import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  readAdminContent: vi.fn(),
  revalidateContent: vi.fn(),
  getGithubConfig: vi.fn(),
  listDir: vi.fn(),
  getFile: vi.fn(),
  putBinary: vi.fn(),
  deleteFile: vi.fn(),
}));

vi.mock('@/lib/auth/guard', () => ({
  guardAdminApi: mocks.guard,
  json: (body: unknown, status = 200, extra: Record<string, string> = {}) => Response.json(body, { status, headers: extra }),
  callerId: () => ({ ip: '1.1.1.1', id: 'caller' }),
}));
vi.mock('@/lib/admin/content', () => ({ readAdminContent: mocks.readAdminContent, revalidateContent: mocks.revalidateContent }));
vi.mock('@/lib/github', async () => {
  const actual = await vi.importActual<typeof import('@/lib/github')>('@/lib/github');
  return { ...actual, getGithubConfig: mocks.getGithubConfig, listDir: mocks.listDir };
});
vi.mock('@/lib/github-write', async () => {
  const actual = await vi.importActual<typeof import('@/lib/github-write')>('@/lib/github-write');
  return { ...actual, getFile: mocks.getFile, putBinary: mocks.putBinary, deleteFile: mocks.deleteFile };
});

import { DELETE, GET, POST } from '@/app/api/admin/media/route';
import { detectImageType } from '@/lib/media-upload';
import sharp from 'sharp';

const call = (method: string, body?: unknown, url = 'http://localhost/api/admin/media') =>
  new Request(url, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });

const png = async () => (await sharp({ create: { width: 320, height: 200, channels: 3, background: '#2a7f2a' } }).png().toBuffer()).toString('base64');
const webpB64 = async () => (await sharp({ create: { width: 320, height: 200, channels: 3, background: '#2a2a7f' } }).webp().toBuffer()).toString('base64');

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.guard.mockResolvedValue(null);
  mocks.getGithubConfig.mockReturnValue({ owner: 'o', repo: 'r', branch: 'data', token: 't' });
  mocks.getFile.mockResolvedValue(null);
  mocks.putBinary.mockResolvedValue({ path: 'x', sha: 'y' });
  mocks.deleteFile.mockResolvedValue(undefined);
  mocks.readAdminContent.mockImplementation(async (name: string) => ({
    data:
      name === 'gallery'
        ? { items: [{ src: 'media/gallery/aaaa1111-used.webp' }] }
        : name === 'home'
          ? { hero: { image: 'media/pages/bbbb2222-hero.webp' } }
          : {},
  }));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/admin/media', () => {
  it('stores a PNG as WebP under media/<folder>/<hash>-<name>.webp and commits it', async () => {
    const res = await POST(call('POST', { folder: 'gallery', filename: 'Front View (1).PNG', dataBase64: await png() }));
    expect(res.status).toBe(200);
    const out = await res.json();
    expect(out.path).toMatch(/^media\/gallery\/[0-9a-f]{8}-front-view-1\.webp$/);
    expect(out.existed).toBe(false);
    expect(mocks.putBinary).toHaveBeenCalledTimes(1);
    const [path, bytes, opts] = mocks.putBinary.mock.calls[0] as [string, Buffer, { message: string }];
    expect(path).toBe(out.path);
    expect(detectImageType(bytes)).toBe('webp');
    expect(opts.message).toBe(`admin: upload ${out.path}`);
  });

  it('keeps a WebP exactly as sent, and the same picture gets the same path (dedupe: no second commit)', async () => {
    const data = await webpB64();
    const first = await (await POST(call('POST', { folder: 'pages', filename: 'hero.webp', dataBase64: data }))).json();
    expect(Buffer.from(data, 'base64').equals(mocks.putBinary.mock.calls[0][1] as Buffer)).toBe(true);

    mocks.getFile.mockResolvedValue({ sha: 's', text: '', buffer: Buffer.from('x') });
    const second = await (await POST(call('POST', { folder: 'pages', filename: 'hero.webp', dataBase64: data }))).json();
    expect(second.path).toBe(first.path);
    expect(second.existed).toBe(true);
    expect(mocks.putBinary).toHaveBeenCalledTimes(1);
  });

  it('refuses anything that is not really a JPG, PNG or WebP (by magic bytes), whatever the name says', async () => {
    for (const text of ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', '<?php echo 1;', 'GIF89a......']) {
      const res = await POST(call('POST', { folder: 'gallery', filename: 'evil.png', dataBase64: Buffer.from(text + ' '.repeat(20)).toString('base64') }));
      expect(res.status, text).toBe(415);
    }
    expect(mocks.putBinary).not.toHaveBeenCalled();
  });

  it('refuses unknown folders (including traversal) and oversized bodies', async () => {
    for (const folder of ['config', '../x', 'reviews', '', undefined]) {
      expect((await POST(call('POST', { folder, filename: 'a.png', dataBase64: await png() }))).status).toBe(400);
    }
    const big = 'A'.repeat(4_400_000);
    expect((await POST(call('POST', { folder: 'gallery', filename: 'a.png', dataBase64: big }))).status).toBe(413);
    expect(mocks.putBinary).not.toHaveBeenCalled();
  });

  it('is blocked when logged out, and says so when GitHub is not connected', async () => {
    mocks.guard.mockResolvedValue(Response.json({ ok: false }, { status: 401 }));
    expect((await POST(call('POST', { folder: 'gallery', filename: 'a.png', dataBase64: await png() }))).status).toBe(401);
    mocks.guard.mockResolvedValue(null);
    mocks.getGithubConfig.mockReturnValue(null);
    expect((await POST(call('POST', { folder: 'gallery', filename: 'a.png', dataBase64: await png() }))).status).toBe(409);
  });

  it('answers 429 with retryAfter when GitHub asks us to slow down', async () => {
    mocks.putBinary.mockRejectedValue(Object.assign(new Error('rate'), { status: 403 }));
    const res = await POST(call('POST', { folder: 'gallery', filename: 'a.png', dataBase64: await png() }));
    expect(res.status).toBe(429);
    expect((await res.json()).retryAfter).toBeGreaterThan(0);
  });
});

describe('DELETE /api/admin/media', () => {
  it('blocks deleting a picture that is in use and lists where', async () => {
    const res = await DELETE(call('DELETE', { path: 'media/gallery/aaaa1111-used.webp' }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.usedIn).toEqual([{ file: 'gallery', jsonPath: 'items.0.src', label: 'Gallery' }]);
    expect(mocks.deleteFile).not.toHaveBeenCalled();
  });

  it('deletes an unused picture with its sha', async () => {
    mocks.getFile.mockResolvedValue({ sha: 'blob-sha', text: '', buffer: Buffer.from('x') });
    const res = await DELETE(call('DELETE', { path: 'media/gallery/cccc3333-free.webp' }));
    expect(res.status).toBe(200);
    expect(mocks.deleteFile).toHaveBeenCalledWith('media/gallery/cccc3333-free.webp', 'blob-sha', 'admin: delete media/gallery/cccc3333-free.webp');
  });

  it('never touches paths outside media/', async () => {
    for (const path of ['config/admin.json', 'media/../config/admin.json', 'content/site.json', '/assets/x.webp', 42]) {
      expect((await DELETE(call('DELETE', { path }))).status).toBe(400);
    }
    expect(mocks.deleteFile).not.toHaveBeenCalled();
  });
});

describe('GET /api/admin/media', () => {
  it('lists files with size, folder and where each is used', async () => {
    mocks.listDir.mockImplementation(async (dir: string) =>
      dir === 'media/gallery'
        ? [
            { name: 'aaaa1111-used.webp', path: 'media/gallery/aaaa1111-used.webp', type: 'file', sha: 's1', size: 1000 },
            { name: 'cccc3333-free.webp', path: 'media/gallery/cccc3333-free.webp', type: 'file', sha: 's2', size: 500 },
            { name: 'notes.txt', path: 'media/gallery/notes.txt', type: 'file', sha: 's3', size: 5 },
          ]
        : [],
    );
    const body = await (await GET(call('GET', undefined, 'http://localhost/api/admin/media?fresh=1'))).json();
    expect(body.connected).toBe(true);
    expect(body.totalBytes).toBe(1500);
    expect(body.files.map((f: { name: string }) => f.name)).toEqual(['aaaa1111-used.webp', 'cccc3333-free.webp']);
    expect(body.files[0].usedIn[0]).toMatchObject({ file: 'gallery', label: 'Gallery' });
    expect(body.files[1].usedIn).toEqual([]);
  });

  it('rejects an unknown folder and reports "not connected" without errors', async () => {
    expect((await GET(call('GET', undefined, 'http://localhost/api/admin/media?folder=config'))).status).toBe(400);
    mocks.getGithubConfig.mockReturnValue(null);
    const body = await (await GET(call('GET'))).json();
    expect(body).toMatchObject({ ok: true, connected: false, files: [] });
  });
});
