import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const CODE = 'gkds1993';

async function login(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Enter access code').fill(CODE);
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

/** The editors save through PUT /api/admin/content/<name>; GitHub is never touched in these tests. */
async function mockSave(page: Page, name: string) {
  const bodies: { data: Record<string, unknown>; sha: string | null }[] = [];
  await page.route(`**/api/admin/content/${name}`, async (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    const body = route.request().postDataJSON() as { data: Record<string, unknown>; sha: string | null };
    bodies.push(body);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, sha: 'new-sha', updatedAt: new Date().toISOString(), data: body.data }),
    });
  });
  return bodies;
}

test('Home editor: edit the hero headline, save, and the PUT carries the new text', async ({ page }) => {
  const bodies = await mockSave(page, 'home');
  await login(page);
  await page.goto('/admin/home');
  await expect(page.getByRole('heading', { name: 'Home Page', level: 1 })).toBeVisible();

  const save = page.getByRole('button', { name: 'Save changes' });
  await expect(save).toBeDisabled(); // nothing changed yet

  await page.getByRole('button', { name: /1\. Hero/ }).click();
  const headline = page.getByLabel('Headline (first part)');
  await headline.fill('Learn Driving With Confidence');
  await expect(save).toBeEnabled();
  await save.click();

  await expect(page.getByText(/Saved\. The website will update/)).toBeVisible();
  expect(bodies).toHaveLength(1);
  expect((bodies[0].data.hero as { titleLead: string }).titleLead).toBe('Learn Driving With Confidence');
  await expect(save).toBeDisabled(); // clean again after saving
});

test('Site settings: an empty required field is blocked with a clear message and no request is sent', async ({ page }) => {
  const bodies = await mockSave(page, 'site');
  await login(page);
  await page.goto('/admin/settings');
  await expect(page.getByRole('heading', { name: 'Site Settings', level: 1 })).toBeVisible();

  await page.getByLabel('School name').fill('');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.locator('#editor-errors')).toContainText('attention');
  await expect(page.getByText('This field is required').first()).toBeVisible();
  expect(bodies).toHaveLength(0);

  // fixing the field (to something new) clears the error and lets the save through
  await page.getByLabel('School name').fill('Gopal Krushna Driving School');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/Saved\./)).toBeVisible();
  expect(bodies).toHaveLength(1);
});

test('Site settings: pasting a full Google iframe keeps only its src', async ({ page }) => {
  await login(page);
  await page.goto('/admin/settings');
  const url = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1&hl=en';
  await page.getByLabel('Embed URL').fill(`<iframe src="${url}" width="600" height="450" style="border:0;" loading="lazy"></iframe>`);
  await expect(page.getByLabel('Embed URL')).toHaveValue(url);
  await expect(page.getByTitle('Map preview')).toHaveAttribute('src', url);
});

test('Site settings: opening time must be before closing time', async ({ page }) => {
  const bodies = await mockSave(page, 'site');
  await login(page);
  await page.goto('/admin/settings');
  await page.getByLabel('Opens at', { exact: true }).first().fill('22:00');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Closing time must be after the opening time').first()).toBeVisible();
  expect(bodies).toHaveLength(0);
});

test('Reset section to default restores the original text', async ({ page }) => {
  await login(page);
  await page.goto('/admin/about');
  const title = page.getByLabel(/^Title/).first();
  const original = await title.inputValue();
  await title.fill('Changed');
  await page.getByRole('button', { name: 'Reset section to default' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset section', exact: true }).click();
  await expect(title).toHaveValue(original);
});

test('the three editors have no serious accessibility violations', async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  for (const path of ['/admin/settings', '/admin/home', '/admin/about']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
    expect(bad, path).toEqual([]);
  }
});
