import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const CODE = 'gkds1993';

async function login(page: Page, base: '/admin' | '/malika') {
  await page.goto(`${base}/login`);
  await page.getByLabel('Enter access code').fill(CODE);
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page).toHaveURL(new RegExp(`${base}/?$`));
}

for (const base of ['/admin', '/malika'] as const) {
  test(`${base}: logs in with the access code and shows the dashboard`, async ({ page }) => {
    await login(page, base);
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
    await expect(page.getByText('Average rating')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'GitHub connection' })).toBeVisible();
  });

  test(`${base}: logged-out visits go to the login page and keep the prefix`, async ({ page }) => {
    await page.goto(`${base}/security`);
    await expect(page).toHaveURL(new RegExp(`${base}/login\\?next=`));
    await expect(page.getByRole('heading', { name: 'Admin Panel' })).toBeVisible();
    // after login we land where we were going
    await page.getByLabel('Enter access code').fill(CODE);
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(page).toHaveURL(new RegExp(`${base}/security$`));
  });

  test(`${base}: sidebar links keep the prefix and logout returns to login`, async ({ page, isMobile }) => {
    await login(page, base);
    if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
    const nav = page.getByRole('navigation', { name: 'Admin' });
    const hrefs = await nav.getByRole('link').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThanOrEqual(10);
    for (const h of hrefs) expect(h).toMatch(new RegExp(`^${base}(/|$)`));

    if (isMobile) await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(new RegExp(`${base}/login`));
    await page.goto(`${base}/courses`);
    await expect(page).toHaveURL(new RegExp(`${base}/login`));
  });
}

test('a wrong code shows the generic error and stays on the login page', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Enter access code').fill('not-the-code');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Incorrect code. Please try again.' })).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test('the access code can be shown and hidden', async ({ page }) => {
  await page.goto('/admin/login');
  const input = page.getByLabel('Enter access code');
  await expect(input).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show access code' }).click();
  await expect(input).toHaveAttribute('type', 'text');
});

test('admin API refuses logged-out callers', async ({ request }) => {
  expect((await request.get('/api/admin/health')).status()).toBe(401);
  expect((await request.get('/api/admin/content/site')).status()).toBe(401);
  expect(
    (await request.put('/api/admin/content/site', { data: {}, headers: { 'x-requested-with': 'gkds-admin' } })).status(),
  ).toBe(401);
});

test('session cookie is httpOnly + SameSite=Strict, and admin pages are noindex and never cached', async ({ page, context }) => {
  await login(page, '/admin');
  const cookie = (await context.cookies()).find((c) => c.name === 'gkds_admin');
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe('Strict');

  const res = await page.goto('/admin/security');
  expect(res?.headers()['cache-control']).toContain('no-store');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('mutating admin requests without the CSRF header are blocked even when logged in', async ({ page }) => {
  await login(page, '/admin');
  const status = await page.evaluate(async () => {
    const r = await fetch('/api/admin/security/signout-all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    return r.status;
  });
  expect(status).toBe(403);
});

test('content API only serves the six known documents and answers without GitHub', async ({ page }) => {
  await login(page, '/admin');
  const get = (name: string) =>
    page.evaluate(async (n) => {
      const r = await fetch(`/api/admin/content/${n}`, { headers: { 'x-requested-with': 'gkds-admin' } });
      return { status: r.status, body: await r.json() };
    }, name);
  const courses = await get('courses');
  expect(courses.status).toBe(200);
  expect(courses.body.sha).toBeNull(); // not saved on GitHub yet → seed
  expect(Array.isArray(courses.body.data.courses)).toBe(true);
  expect((await get('admin')).status).toBe(404);
  expect((await get('..%2Fconfig%2Fadmin')).status).toBe(404);
});

test('Security page explains that the URL prefix does not matter', async ({ page }) => {
  await login(page, '/admin');
  await page.goto('/admin/security');
  await expect(page.getByText('makes no difference')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Change access code' })).toBeVisible();
});

test('login page, dashboard and security page have no serious accessibility violations', async ({ page }) => {
  const check = async () => {
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    return violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => v.id + ': ' + v.nodes.map((n) => n.target.join(' ')).join(' | '));
  };
  await page.goto('/admin/login');
  expect(await check()).toEqual([]);
  await login(page, '/admin');
  await page.waitForLoadState('networkidle');
  expect(await check()).toEqual([]);
  await page.goto('/admin/security');
  await page.waitForLoadState('networkidle');
  expect(await check()).toEqual([]);
});
