import { expect, test } from '@playwright/test';

const PAGES = [
  { path: '/', title: /Gopal Krushna Driving Training School/ },
  { path: '/about', title: /About Us/ },
  { path: '/courses', title: /Courses/ },
  { path: '/gallery', title: /Gallery/ },
  { path: '/reviews', title: /Reviews/ },
  { path: '/contact', title: /Contact Us/ },
];

for (const { path, title } of PAGES) {
  test(`${path}: 200, title, one h1, one site-wide school entity`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('h1')).toHaveCount(1);
    const graphs = await page.locator('script[type="application/ld+json"]').evaluateAll((els) =>
      els.map((e) => e.textContent ?? ''),
    );
    const schools = graphs.filter((g) => g.includes('"@type":"DrivingSchool"') && g.includes('"@graph"'));
    expect(schools).toHaveLength(1);
    expect(graphs.some((g) => g.includes('"BreadcrumbList"'))).toBe(path !== '/');
  });
}

test('unknown URL shows the friendly 404 page with a way home', async ({ page }) => {
  const res = await page.goto('/no-such-page');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /home/i }).first()).toBeVisible();
});

test('style guide and admin are not public yet', async ({ request }) => {
  expect((await request.get('/styleguide')).status()).toBe(404);
});

test('Contact has call links and no enquiry form', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.locator('main a[href^="tel:"]').first()).toBeVisible();
  await expect(page.locator('main form')).toHaveCount(0);
  await expect(page.locator('main textarea')).toHaveCount(0);
});

test('Gallery filter changes the URL and the lightbox opens and closes with Escape', async ({ page }) => {
  await page.goto('/gallery');
  await page.getByRole('group', { name: 'Filter photos by category' }).getByRole('button').nth(1).click();
  await expect(page).toHaveURL(/category=/);
  await page.getByRole('button', { name: /^Open photo/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('Reviews form validates before sending', async ({ page }) => {
  await page.goto('/reviews');
  await page.getByRole('button', { name: /leave a review/i }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /submit review/i }).click();
  await expect(dialog.locator('[aria-invalid="true"]').first()).toBeVisible();
});

test('desktop navigation reaches Courses', async ({ page, isMobile }) => {
  test.skip(isMobile, 'covered by the mobile menu');
  await page.goto('/');
  await page.getByRole('banner').getByRole('link', { name: 'Courses', exact: true }).first().click();
  await expect(page).toHaveURL(/\/courses/);
});

test('mobile menu opens and links work', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'desktop has the full nav');
  await page.goto('/');
  await page.getByRole('button', { name: /menu/i }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'About Us' }).click();
  await expect(page).toHaveURL(/\/about/);
});
