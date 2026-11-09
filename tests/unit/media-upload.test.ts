import { describe, expect, it } from 'vitest';
import {
  buildUsageIndex,
  contentHash,
  detectImageType,
  findUsage,
  isManagedMediaPath,
  isUploadFolder,
  mediaPathFor,
  sanitizeFileName,
  usageLabel,
} from '@/lib/media-upload';
import { coverRect, fitWithin, formatBytes, rejectReason, squareRect } from '@/lib/image-client';

const bytes = (...n: number[]) => new Uint8Array([...n, ...new Array(Math.max(0, 16 - n.length)).fill(0)]);
const webp = () => new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50, 0, 0, 0, 0]);

describe('sanitizeFileName', () => {
  it('keeps lowercase letters, numbers and single hyphens, at most 40 characters', () => {
    expect(sanitizeFileName('My Photo (1).JPG')).toBe('my-photo-1');
    expect(sanitizeFileName('Café Ünïcode.png')).toBe('cafe-unicode');
    expect(sanitizeFileName('../../etc/passwd')).toBe('etc-passwd');
    expect(sanitizeFileName('x'.repeat(80) + '.webp').length).toBeLessThanOrEqual(40);
    expect(sanitizeFileName('!!!.jpg')).toBe('image');
    expect(sanitizeFileName('')).toBe('image');
  });
});

describe('detectImageType (magic bytes)', () => {
  it('recognises WebP, PNG and JPEG and nothing else', () => {
    expect(detectImageType(webp())).toBe('webp');
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0))).toBe('png');
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0))).toBe('jpeg');
    expect(detectImageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
    expect(detectImageType(new TextEncoder().encode('<script>alert(1)</script>'))).toBeNull();
    expect(detectImageType(bytes(0x47, 0x49, 0x46, 0x38))).toBeNull(); // GIF
    expect(detectImageType(new Uint8Array(3))).toBeNull();
  });
  it('a RIFF file that is not WebP is rejected', () => {
    expect(detectImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45, 0, 0, 0, 0]))).toBeNull();
  });
});

describe('content-hash naming and dedupe', () => {
  it('same bytes give the same name, different bytes a different one', () => {
    const a = webp();
    const b = new Uint8Array([...webp(), 9]);
    expect(contentHash(a)).toMatch(/^[0-9a-f]{8}$/);
    expect(mediaPathFor('gallery', a, 'Front View.JPG')).toBe(mediaPathFor('gallery', webp(), 'Front View.jpg'));
    expect(mediaPathFor('gallery', a, 'x')).not.toBe(mediaPathFor('gallery', b, 'x'));
    expect(mediaPathFor('courses', a, 'Front View.JPG')).toBe(`media/courses/${contentHash(a)}-front-view.webp`);
  });
});

describe('folder and path allow-lists', () => {
  it('only the five upload folders are writable', () => {
    for (const ok of ['branding', 'pages', 'courses', 'gallery', 'avatars']) expect(isUploadFolder(ok)).toBe(true);
    for (const bad of ['reviews', 'config', '../x', 'media', '', undefined, 3]) expect(isUploadFolder(bad)).toBe(false);
  });
  it('managed paths are media/<folder>/<name>.<ext> with no traversal', () => {
    expect(isManagedMediaPath('media/gallery/ab12cd34-front.webp')).toBe(true);
    expect(isManagedMediaPath('media/reviews/5p0g20pol.webp')).toBe(true);
    for (const bad of ['media/../config/admin.json', 'config/admin.json', 'media/other/x.webp', 'media/gallery/../x.webp', 'media/gallery/x.svg', '/assets/x.webp', 'media/gallery/.hidden.webp', undefined]) {
      expect(isManagedMediaPath(bad)).toBe(false);
    }
  });
});

describe('usage scanner', () => {
  const docs = {
    gallery: { hero: { image: 'media/pages/aaaa1111-hero.webp' }, items: [{ src: 'media/gallery/bbbb2222-a.webp' }, { src: 'media/gallery/cccc3333-b.webp' }] },
    home: { hero: { image: 'media/pages/aaaa1111-hero.webp' }, note: 'media/gallery/bbbb2222-a.webp is mentioned in text only as a substring' },
    site: { logo: '/assets/brand/krishna-golden-flute.png' },
  };

  it('finds every exact reference with its JSON path', () => {
    expect(findUsage(docs, 'media/pages/aaaa1111-hero.webp')).toEqual([
      { file: 'gallery', jsonPath: 'hero.image' },
      { file: 'home', jsonPath: 'hero.image' },
    ]);
    expect(findUsage(docs, 'media/gallery/cccc3333-b.webp')).toEqual([{ file: 'gallery', jsonPath: 'items.1.src' }]);
    expect(findUsage(docs, 'media/gallery/nothing.webp')).toEqual([]);
  });

  it('does not count a longer string that merely contains the path', () => {
    expect(findUsage(docs, 'media/gallery/bbbb2222-a.webp')).toEqual([{ file: 'gallery', jsonPath: 'items.0.src' }]);
  });

  it('builds an index of every media/ path, ignoring bundled /assets files', () => {
    const idx = buildUsageIndex(docs);
    expect([...idx.keys()].sort()).toEqual(['media/gallery/bbbb2222-a.webp', 'media/gallery/cccc3333-b.webp', 'media/pages/aaaa1111-hero.webp']);
    expect(idx.get('media/pages/aaaa1111-hero.webp')).toHaveLength(2);
  });

  it('labels files for people', () => {
    expect(usageLabel({ file: 'home', jsonPath: 'hero.image' })).toBe('Home page');
    expect(usageLabel({ file: 'gallery', jsonPath: 'x' })).toBe('Gallery');
  });
});

describe('client image maths', () => {
  it('fitWithin shrinks the long edge and never enlarges', () => {
    expect(fitWithin(4000, 3000, 1920)).toEqual({ width: 1920, height: 1440 });
    expect(fitWithin(3000, 4000, 1920)).toEqual({ width: 1440, height: 1920 });
    expect(fitWithin(800, 600, 1920)).toEqual({ width: 800, height: 600 });
  });

  it('coverRect crops to the target ratio', () => {
    expect(coverRect(4000, 3000, 1200, 630)).toEqual({ x: 0, y: 450, w: 4000, h: 2100 }); // wider target: trim top and bottom
    expect(coverRect(1000, 2000, 1200, 630)).toEqual({ x: 0, y: 738, w: 1000, h: 525 });
    expect(squareRect(4000, 3000)).toEqual({ x: 500, y: 0, w: 3000, h: 3000 });
    expect(squareRect(3000, 4000, { x: 0.5, y: 0 })).toEqual({ x: 0, y: 0, w: 3000, h: 3000 });
  });

  it('formatBytes reads naturally', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(310 * 1024)).toBe('310 KB');
    expect(formatBytes(4.2 * 1024 * 1024)).toBe('4.2 MB');
  });

  it('rejectReason explains what is wrong', () => {
    const ok = { type: 'image/jpeg', name: 'a.jpg', size: 1000 };
    expect(rejectReason(ok)).toBeNull();
    expect(rejectReason({ type: 'image/heic', name: 'a.heic', size: 1000 })).toMatch(/Most Compatible/);
    expect(rejectReason({ type: '', name: 'IMG.HEIC', size: 1000 })).toMatch(/Most Compatible/);
    expect(rejectReason({ type: 'application/pdf', name: 'a.pdf', size: 1000 })).toMatch(/JPG, PNG or WebP/);
    expect(rejectReason({ type: 'image/gif', name: 'a.gif', size: 1000 })).toMatch(/JPG, PNG or WebP/);
    expect(rejectReason({ ...ok, size: 21 * 1024 * 1024 })).toMatch(/20 MB/);
    expect(rejectReason({ ...ok, size: 0 })).toMatch(/empty/);
    expect(rejectReason({ type: '', name: 'photo.png', size: 10 })).toBeNull(); // some browsers leave type empty
  });
});
