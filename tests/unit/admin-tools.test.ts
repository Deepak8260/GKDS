import { deflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { buildBackup, backupPath, planRestore } from '@/lib/admin/backup';
import { commitContentName, isContentCommit, prettifyCommit } from '@/lib/admin/commits';
import { diffSummary } from '@/lib/admin/diff';
import { computeAttention, computeChecklist, isPlaceholderEmail, isPlaceholderImage, isPlaceholderMap, isPlaceholderPhone, progress, type ReadinessInput } from '@/lib/admin/readiness';
import { tokenExpiryDays } from '@/lib/admin/health';
import { createZip, crc32, readZip, ZipError } from '@/lib/zip';
import { contentNames, type ContentName } from '@/lib/validators';
import about from '@/content-seed/about.json';
import courses from '@/content-seed/courses.json';
import gallery from '@/content-seed/gallery.json';
import home from '@/content-seed/home.json';
import reviews from '@/content-seed/reviews.json';
import site from '@/content-seed/site.json';

const docs = (): Record<ContentName, unknown> => structuredClone({ site, home, about, courses, gallery, reviews }) as Record<ContentName, unknown>;

describe('commit messages are made friendly', () => {
  it('prettifies what the site writes', () => {
    expect(prettifyCommit('admin: update courses.json')).toBe('Updated Courses');
    expect(prettifyCommit('admin: update site.json')).toBe('Updated Site settings');
    expect(prettifyCommit('admin: upload media/gallery/ab12cd34-front.webp')).toBe('Uploaded a gallery photo');
    expect(prettifyCommit('admin: upload media/branding/ab12cd34-logo.webp')).toBe('Uploaded a picture');
    expect(prettifyCommit('admin: delete media/pages/x.webp')).toBe('Deleted a picture');
    expect(prettifyCommit('admin: restore about.json from backup')).toBe('Restored About page from a backup');
    expect(prettifyCommit('review: new review 5p0g20pol')).toBe('A visitor posted a review');
    expect(prettifyCommit('review: photo for 5p0g20pol')).toBe('A review photo was added');
    expect(prettifyCommit('seed: add home.json')).toBe('Added starting content: Home page');
    expect(prettifyCommit('feat: something else\n\nbody')).toBe('feat: something else');
  });
  it('tells content commits from code commits, and names the file', () => {
    expect(isContentCommit('admin: update home.json')).toBe(true);
    expect(isContentCommit('review: new review x')).toBe(true);
    expect(isContentCommit('feat(admin): courses manager')).toBe(false);
    expect(commitContentName('admin: update gallery.json')).toBe('gallery');
    expect(commitContentName('admin: upload media/x.webp')).toBeNull();
  });
});

describe('diffSummary', () => {
  it('lists changed paths with old and new values', () => {
    const a = { hero: { title: 'Old', sub: 'same' }, list: [{ n: 1 }, { n: 2 }], gone: 'x' };
    const b = { hero: { title: 'New', sub: 'same' }, list: [{ n: 1 }, { n: 3 }, { n: 4 }], added: true };
    const d = diffSummary(a, b);
    const paths = d.changes.map((c) => c.path);
    expect(paths).toContain('hero.title');
    expect(paths).toContain('list (items)');
    expect(paths).toContain('list.1.n');
    expect(paths).toContain('gone');
    expect(paths).toContain('added');
    expect(paths).not.toContain('hero.sub');
    expect(d.changes.find((c) => c.path === 'hero.title')).toEqual({ path: 'hero.title', from: 'Old', to: 'New' });
    expect(d.changes.find((c) => c.path === 'gone')).toMatchObject({ from: 'x', to: '(not set)' });
  });
  it('is empty for equal values and truncates long lists and values', () => {
    expect(diffSummary({ a: [1, 2] }, { a: [1, 2] })).toEqual({ changes: [], total: 0, truncated: false });
    const big = diffSummary({ items: Array.from({ length: 100 }, (_, i) => i) }, { items: Array.from({ length: 100 }, (_, i) => i + 1000) }, 10);
    expect(big.changes).toHaveLength(10);
    expect(big.total).toBe(100);
    expect(big.truncated).toBe(true);
    expect(diffSummary({ t: 'a' }, { t: 'b'.repeat(500) }).changes[0].to.length).toBeLessThan(100);
  });
});

describe('ZIP writer and reader', () => {
  it('crc32 matches the standard check value', () => {
    expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926);
  });

  it('round-trips files byte for byte', () => {
    const files = [
      { name: 'content/site.json', data: Buffer.from('{"a":1}\n') },
      { name: 'README.txt', data: Buffer.from('héllo ✓') },
      { name: 'empty.txt', data: Buffer.alloc(0) },
    ];
    const back = readZip(createZip(files));
    expect(back.map((f) => f.name)).toEqual(files.map((f) => f.name));
    back.forEach((f, i) => expect(f.data.equals(files[i].data)).toBe(true));
  });

  it('also reads deflate-compressed ZIPs (re-zipped by Windows or macOS)', () => {
    const data = Buffer.from('{"hello":"world"}'.repeat(50));
    const stored = createZip([{ name: 'content/x.json', data }]);
    // turn the stored entry into a deflated one by patching a copy
    const raw = deflateRawSync(data);
    const name = Buffer.from('content/x.json');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc32(data), 14);
    local.writeUInt32LE(raw.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt32LE(crc32(data), 16);
    entry.writeUInt32LE(raw.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(name.length, 28);
    const centralOffset = local.length + name.length + raw.length;
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(1, 8);
    end.writeUInt16LE(1, 10);
    end.writeUInt32LE(entry.length + name.length, 12);
    end.writeUInt32LE(centralOffset, 16);
    const zip = Buffer.concat([local, name, raw, entry, name, end]);
    expect(readZip(zip)[0].data.equals(data)).toBe(true);
    expect(stored.length).toBeGreaterThan(0);
  });

  it('rejects junk, damaged data, unsafe names and checksum mismatches', () => {
    expect(() => readZip(Buffer.from('not a zip at all, just some text'))).toThrow(ZipError);
    const good = createZip([{ name: 'a.json', data: Buffer.from('{"x":1}') }]);
    const damaged = Buffer.from(good);
    damaged[40] ^= 0xff; // flip a byte inside the file data
    expect(() => readZip(damaged)).toThrow(/checksum|damaged/i);
    expect(() => readZip(createZip([{ name: '../evil.json', data: Buffer.from('1') }]))).toThrow(/unsafe/i);
    expect(() => readZip(createZip([{ name: '/abs.json', data: Buffer.from('1') }]))).toThrow(/unsafe/i);
  });
});

describe('backup and restore planning', () => {
  it('a backup holds the six content files plus a README, all valid JSON', () => {
    const zip = readZip(buildBackup(docs(), new Date('2026-11-09T10:00:00Z')));
    expect(zip.map((f) => f.name).sort()).toEqual(['README.txt', ...contentNames.map(backupPath)].sort());
    for (const f of zip.filter((x) => x.name.endsWith('.json'))) expect(() => JSON.parse(f.data.toString('utf8'))).not.toThrow();
    expect(zip.find((f) => f.name === 'README.txt')!.data.toString()).toContain('2026-11-09T10:00:00.000Z');
  });

  it('restoring a backup that matches the current content changes nothing', () => {
    const plan = planRestore(buildBackup(docs()), docs());
    expect(plan.files.every((f) => f.status === 'unchanged')).toBe(true);
    expect(plan.canRestore).toBe(false);
    expect(plan.ignored).toEqual(['README.txt']);
  });

  it('lists what would change, and only changed files are restorable', () => {
    const old = docs();
    (old.home as { hero: { titleLead: string } }).hero.titleLead = 'Old headline';
    const plan = planRestore(buildBackup(old), docs());
    const home = plan.files.find((f) => f.name === 'home')!;
    expect(home.status).toBe('changed');
    expect(home.changes![0]).toMatchObject({ path: 'hero.titleLead', to: 'Old headline' });
    expect(plan.files.filter((f) => f.status === 'changed')).toHaveLength(1);
    expect(plan.canRestore).toBe(true);
  });

  it('refuses the whole restore if any file no longer matches the schema', () => {
    const broken = docs();
    (broken.site as { phones: unknown }).phones = [];
    const plan = planRestore(buildBackup(broken), docs());
    expect(plan.files.find((f) => f.name === 'site')!.status).toBe('invalid');
    expect(plan.canRestore).toBe(false);
  });

  it('explains non-ZIP uploads and ZIPs without content files', () => {
    expect(planRestore(Buffer.from('hello'), docs()).error).toMatch(/ZIP/);
    expect(planRestore(createZip([{ name: 'readme.txt', data: Buffer.from('x') }]), docs()).error).toMatch(/does not contain/);
    const notJson = createZip([{ name: 'content/site.json', data: Buffer.from('{oops') }]);
    expect(planRestore(notJson, docs()).files[0]).toMatchObject({ status: 'invalid' });
  });
});

describe('launch readiness', () => {
  const input = (over: Partial<ReadinessInput> = {}): ReadinessInput => ({
    site: structuredClone(site) as ReadinessInput['site'],
    courses: structuredClone(courses) as ReadinessInput['courses'],
    gallery: structuredClone(gallery) as ReadinessInput['gallery'],
    reviews: structuredClone(reviews) as ReadinessInput['reviews'],
    hasStoredCode: false,
    envCodeIsDefault: true,
    siteUrlSet: false,
    githubConnected: false,
    ...over,
  });

  it('recognises placeholders', () => {
    expect(isPlaceholderPhone('+91 98XXX XXXXX')).toBe(true);
    expect(isPlaceholderPhone('12345')).toBe(true);
    expect(isPlaceholderPhone('+91 91241 63306')).toBe(false);
    expect(isPlaceholderImage('/assets/placeholders/no-image.svg')).toBe(true);
    expect(isPlaceholderImage('')).toBe(true);
    expect(isPlaceholderImage('/assets/brand/krishna-golden-flute.png')).toBe(false);
    expect(isPlaceholderEmail('info@example.com')).toBe(true);
    expect(isPlaceholderEmail('office@school.in')).toBe(false);
    expect(isPlaceholderMap('https://www.google.com/maps/embed?pb=PLACEHOLDER')).toBe(true);
  });

  it('warns about the default access code only while it is really the default', () => {
    const ids = (i: ReadinessInput) => computeAttention(i).map((a) => a.id);
    expect(ids(input())).toContain('default-code');
    expect(ids(input({ hasStoredCode: true }))).not.toContain('default-code');
    expect(ids(input({ envCodeIsDefault: false }))).not.toContain('default-code');
  });

  it('flags placeholder settings, missing alt text, no published course and generic social links', () => {
    const i = input();
    i.site.phones = ['+91 98XXX XXXXX'];
    i.site.whatsapp = '91XXXXXXXXXX';
    i.site.social.facebook = 'https://www.facebook.com/';
    i.gallery.items[0].alt = '';
    i.courses.courses.forEach((c) => (c.published = false));
    const ids = computeAttention(i).map((a) => a.id);
    for (const id of ['phones', 'whatsapp', 'social', 'alt', 'courses']) expect(ids).toContain(id);
    expect(computeAttention(i).find((a) => a.id === 'alt')!.message).toBe('1 gallery photo has no alt text.');
  });

  it('the checklist counts what is done and drives the progress ring', () => {
    const list = computeChecklist(input());
    const p = progress(list);
    expect(p.total).toBe(list.length);
    expect(p.done).toBeGreaterThan(0);
    expect(p.done).toBeLessThan(p.total); // github / site url / default code are not done in seed mode
    expect(list.find((c) => c.id === 'github')!.done).toBe(false);
    const ready = computeChecklist(input({ githubConnected: true, siteUrlSet: true, hasStoredCode: true }));
    expect(ready.find((c) => c.id === 'github')!.done).toBe(true);
    expect(ready.find((c) => c.id === 'code')!.done).toBe(true);
    expect(progress([]).percent).toBe(0);
  });
});

describe('GitHub token expiry warning', () => {
  const now = Date.parse('2026-11-09T00:00:00Z');
  it('counts the whole days left, and copes with missing or odd headers', () => {
    expect(tokenExpiryDays('2026-11-24 00:00:00 UTC', now)).toBe(15);
    expect(tokenExpiryDays('2026-11-10 12:00:00 UTC', now)).toBe(1);
    expect(tokenExpiryDays('2026-11-01 00:00:00 UTC', now)).toBeLessThan(0);
    expect(tokenExpiryDays(null, now)).toBeNull();
    expect(tokenExpiryDays('', now)).toBeNull();
    expect(tokenExpiryDays('someday', now)).toBeNull();
  });
});
