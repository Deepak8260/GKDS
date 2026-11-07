import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import siteSeed from '@/content-seed/site.json';

const mocks = vi.hoisted(() => ({
  isGithubConfigured: vi.fn(),
  readJson: vi.fn(),
}));

vi.mock('@/lib/github', () => ({
  isGithubConfigured: mocks.isGithubConfigured,
  readJson: mocks.readJson,
}));

import { loadContent } from '@/lib/content';

const fromGithub = { ...siteSeed, tagline: 'Loaded from GitHub' };

describe('loadContent (GitHub with seed fallback)', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mocks.isGithubConfigured.mockReset();
    mocks.readJson.mockReset();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('returns the seed without calling GitHub when not configured', async () => {
    mocks.isGithubConfigured.mockReturnValue(false);
    const site = await loadContent('site');
    expect(site.tagline).toBe(siteSeed.tagline);
    expect(mocks.readJson).not.toHaveBeenCalled();
  });

  it('returns validated GitHub content when available', async () => {
    mocks.isGithubConfigured.mockReturnValue(true);
    mocks.readJson.mockResolvedValue(fromGithub);
    const site = await loadContent('site');
    expect(site.tagline).toBe('Loaded from GitHub');
    expect(mocks.readJson).toHaveBeenCalledWith('content/site.json', {
      tags: ['content', 'content:site'],
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('falls back to the seed on 404 / read errors and logs a warning', async () => {
    mocks.isGithubConfigured.mockReturnValue(true);
    mocks.readJson.mockRejectedValue(new Error('GitHub: not found – content/site.json'));
    const site = await loadContent('site');
    expect(site.tagline).toBe(siteSeed.tagline);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('falls back on network errors and rate limits', async () => {
    mocks.isGithubConfigured.mockReturnValue(true);
    mocks.readJson.mockRejectedValueOnce(new Error('GitHub request failed: network error'));
    expect((await loadContent('home')).hero.titleLead).toBe('Learn to Drive');
    mocks.readJson.mockRejectedValueOnce(new Error('GitHub: rate limit reached'));
    expect((await loadContent('about')).hero.title).toBe('About Us');
  });

  it('falls back when the JSON text is invalid (reader throws)', async () => {
    mocks.isGithubConfigured.mockReturnValue(true);
    mocks.readJson.mockRejectedValue(new Error('Invalid JSON in content/courses.json'));
    const courses = await loadContent('courses');
    expect(courses.courses.length).toBe(2);
  });

  it('falls back when GitHub content fails schema validation', async () => {
    mocks.isGithubConfigured.mockReturnValue(true);
    mocks.readJson.mockResolvedValue({ ...siteSeed, phones: [] });
    const site = await loadContent('site');
    expect(site.phones.length).toBeGreaterThan(0);
    expect(site.tagline).toBe(siteSeed.tagline);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('failed validation'));
  });

  it('falls back when GitHub returns something that is not an object', async () => {
    mocks.isGithubConfigured.mockReturnValue(true);
    mocks.readJson.mockResolvedValue('<html>oops</html>');
    const reviews = await loadContent('reviews');
    expect(reviews.items.length).toBe(6);
  });
});
