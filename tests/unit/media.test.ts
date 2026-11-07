import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mediaUrl } from '@/lib/media';
import { validateMediaPath } from '@/lib/media-path';

const mocks = vi.hoisted(() => {
  class GithubNotFoundError extends Error {}
  return {
    GithubNotFoundError,
    isGithubConfigured: vi.fn(),
    readRaw: vi.fn(),
  };
});

vi.mock('@/lib/github', () => ({
  GithubNotFoundError: mocks.GithubNotFoundError,
  isGithubConfigured: mocks.isGithubConfigured,
  readRaw: mocks.readRaw,
}));

import { GET } from '@/app/api/media/[...path]/route';

describe('mediaUrl', () => {
  it('maps repo media paths to the proxy route', () => {
    expect(mediaUrl('media/gallery/ab12cd-front.webp')).toBe('/api/media/media/gallery/ab12cd-front.webp');
  });
  it('passes site paths and https URLs through unchanged', () => {
    expect(mediaUrl('/placeholders/car-wagonr.svg')).toBe('/placeholders/car-wagonr.svg');
    expect(mediaUrl('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
  });
  it('falls back to a placeholder for empty values', () => {
    expect(mediaUrl('')).toBe('/placeholders/hero-building.svg');
    expect(mediaUrl(undefined)).toBe('/placeholders/hero-building.svg');
  });
});

describe('validateMediaPath', () => {
  it('accepts media/<folder>/<file>.<ext>', () => {
    const r = validateMediaPath(['media', 'gallery', 'ab12cd-front.webp']);
    expect(r).toEqual({ ok: true, path: 'media/gallery/ab12cd-front.webp', contentType: 'image/webp' });
  });

  it.each([
    [['media', '..', 'config', 'admin.json'], 'traversal'],
    [['media', 'gallery', '..'], 'dot-dot'],
    [['content', 'site.json'], 'outside media'],
    [['media', 'gallery'], 'no file'],
    [['media', 'gallery', 'a.json'], 'bad extension'],
    [['media', 'gallery', 'a.webp.exe'], 'bad extension 2'],
    [['media', 'gallery', '.hidden.webp'], 'hidden file'],
    [['media', 'gallery', 'a%2e%2e.webp'], 'percent sign'],
    [['media', 'gallery', 'a\\b.webp'], 'backslash'],
    [['media', '', 'a.webp'], 'empty segment'],
    [[], 'empty'],
  ])('rejects %j (%s)', (segments) => {
    expect(validateMediaPath(segments as string[]).ok).toBe(false);
  });

  it('rejects undefined', () => {
    expect(validateMediaPath(undefined).ok).toBe(false);
  });
});

describe('GET /api/media/[...path]', () => {
  const call = (path: string[]) =>
    GET(new Request('http://localhost/api/media/' + path.join('/')), { params: Promise.resolve({ path }) });

  beforeEach(() => {
    mocks.isGithubConfigured.mockReset().mockReturnValue(true);
    mocks.readRaw.mockReset();
  });

  it('rejects traversal attempts with 400 and never calls GitHub', async () => {
    const res = await call(['media', '..', 'config', 'admin.json']);
    expect(res.status).toBe(400);
    expect(mocks.readRaw).not.toHaveBeenCalled();
  });

  it('refuses to serve content/config/submissions paths', async () => {
    for (const p of [['config', 'admin.json'], ['content', 'site.json'], ['submissions', 'reviews', 'x.webp']]) {
      expect((await call(p)).status).toBe(400);
    }
    expect(mocks.readRaw).not.toHaveBeenCalled();
  });

  it('returns 404 when GitHub is not configured', async () => {
    mocks.isGithubConfigured.mockReturnValue(false);
    expect((await call(['media', 'gallery', 'a.webp'])).status).toBe(404);
  });

  it('serves the image with immutable cache headers', async () => {
    mocks.readRaw.mockResolvedValue(Buffer.from([1, 2, 3]));
    const res = await call(['media', 'gallery', 'a.webp']);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/webp');
    expect(res.headers.get('cache-control')).toContain('immutable');
    expect(res.headers.get('cache-control')).toContain('s-maxage=31536000');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(Array.from(new Uint8Array(await res.arrayBuffer()))).toEqual([1, 2, 3]);
  });

  it('adds a restrictive CSP for SVG files', async () => {
    mocks.readRaw.mockResolvedValue(Buffer.from('<svg/>'));
    const res = await call(['media', 'branding', 'logo.svg']);
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
  });

  it('returns 404 for missing files and 502 for other GitHub errors', async () => {
    mocks.readRaw.mockRejectedValueOnce(new mocks.GithubNotFoundError('x'));
    expect((await call(['media', 'gallery', 'missing.webp'])).status).toBe(404);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.readRaw.mockRejectedValueOnce(new Error('boom'));
    expect((await call(['media', 'gallery', 'a.webp'])).status).toBe(502);
  });
});
