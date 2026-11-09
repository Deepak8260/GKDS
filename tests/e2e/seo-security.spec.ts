import { expect, test } from '@playwright/test';

test('robots.txt blocks private areas and points to the sitemap', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  for (const p of ['/admin', '/malika', '/api']) expect(body).toContain(`Disallow: ${p}`);
  expect(body).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
});

test('sitemap lists the six public pages in English and Odia with absolute URLs and language alternates', async ({ request }) => {
  const body = await (await request.get('/sitemap.xml')).text();
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs).toHaveLength(12);
  expect(locs.filter((l) => /\/or(\/|$)/.test(l))).toHaveLength(6);
  expect(body).toContain('hreflang="or-IN"');
  expect(body).toContain('hreflang="en-IN"');
  for (const l of locs) expect(l).toMatch(/^https?:\/\//);
  expect(locs.some((l) => l.endsWith('/styleguide') || l.includes('/admin'))).toBe(false);
});

test('manifest is valid and its icons exist', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.status()).toBe(200);
  const m = await res.json();
  expect(m.name).toContain('Gopal Krushna');
  for (const icon of m.icons) expect((await request.get(icon.src)).status()).toBe(200);
});

test('fallback share image renders', async ({ request }) => {
  const res = await request.get('/opengraph-image');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
});

test('security headers and CSP are present', async ({ request }) => {
  const h = (await request.get('/')).headers();
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('SAMEORIGIN');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['content-security-policy']).toContain("default-src 'self'");
});

test('no CSP violations or console errors on any public page', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(m.text());
  });
  page.on('pageerror', (e) => problems.push(e.message));
  for (const path of ['/', '/about', '/courses', '/gallery', '/reviews', '/contact']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  expect(problems).toEqual([]);
});
