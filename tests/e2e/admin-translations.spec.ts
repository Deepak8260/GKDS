import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Enter access code').fill('gkds1993');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

const rows = [
  { path: 'hero.title', en: 'Our Courses', or: 'ଆମର ପାଠ୍ୟକ୍ରମ', source: 'built-in', stale: false },
  { path: 'hero.subtitle', en: 'Learn well', or: '', source: 'none', stale: false },
];

test('the Translations page lists English next to Odia, saves edits, and is accessible', async ({ page }) => {
  const puts: { translations: Record<string, string>; sha: string | null }[] = [];
  await page.route('**/api/admin/translations/**', async (route) => {
    const req = route.request();
    if (req.method() === 'PUT') {
      puts.push(req.postDataJSON());
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, sha: 'n' }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, connected: true, sha: 's1', rows }) });
  });
  await login(page);
  await page.goto('/admin/translations');
  await expect(page.getByRole('heading', { name: 'Translations' })).toBeVisible();
  await expect(page.getByText('1 of 2 lines have Odia text')).toBeVisible();
  await expect(page.getByText('Learn well')).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);

  await page.getByLabel(/Odia \(ଓଡ଼ିଆ\)/).nth(1).fill('ଭଲ ଭାବରେ ଶିଖନ୍ତୁ');
  await page.getByRole('button', { name: /^Save/ }).click();
  await expect.poll(() => puts.length).toBe(1);
  expect(puts[0].sha).toBe('s1');
  expect(puts[0].translations['hero.subtitle']).toBe('ଭଲ ଭାବରେ ଶିଖନ୍ତୁ');
});
