import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Enter access code').fill('gkds1993');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

type Item = { id: string; name: string; rating: number; text: string; date: string; published: boolean; featured: boolean };
type Doc = { items: Item[]; acceptSubmissions: boolean };

const review = (id: string, over: Partial<Item> = {}): Item => ({
  id,
  name: `Learner ${id}`,
  rating: 5,
  text: `This is the review text from learner ${id}, long enough to read.`,
  date: '2026-10-01T12:00:00.000Z',
  published: true,
  featured: false,
  ...over,
});

const REVIEWS: Item[] = [
  review('a', { featured: true, date: '2026-10-05T12:00:00.000Z' }),
  review('b', { featured: true, rating: 4, date: '2026-10-04T12:00:00.000Z' }),
  review('c', { rating: 3.5, date: '2026-10-03T12:00:00.000Z' }),
  review('d', { date: '2026-10-02T12:00:00.000Z' }),
  review('e', { published: false, date: '2026-10-01T12:00:00.000Z' }),
];

/** Serves a known set of reviews and records saves. GitHub is never touched. */
async function mockReviews(page: Page, items: Item[] = REVIEWS) {
  const puts: { data: Doc }[] = [];
  await page.route('**/api/admin/content/reviews', async (route) => {
    const req = route.request();
    if (req.method() === 'PUT') {
      const body = req.postDataJSON() as { data: Doc };
      puts.push(body);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, sha: 'n', updatedAt: new Date().toISOString(), data: body.data }) });
    }
    const res = await route.fetch();
    const json = (await res.json()) as { data: Doc; sha: string | null };
    json.data.items = structuredClone(items);
    json.sha = 's1';
    return route.fulfill({ response: res, json });
  });
  await page.route('**/api/admin/reviews/contacts', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, contacts: { c: { phone: '98765 43210' } } }) }),
  );
  return puts;
}

async function open(page: Page) {
  await login(page);
  await page.goto('/admin/reviews');
  await expect(page.getByRole('heading', { name: 'Reviews', level: 1 })).toBeVisible();
  await expect(page.getByText('Learner a').first()).toBeVisible();
}

test('lists reviews with their status, and shows a private phone number only to the admin', async ({ page }) => {
  await mockReviews(page);
  await open(page);
  await expect(page.getByRole('tab', { name: 'Reviews (5)' })).toBeVisible();
  await expect(page.getByText('Hidden', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Featured', { exact: true })).toHaveCount(2);
  await expect(page.getByRole('link', { name: /98765 43210/ })).toHaveAttribute('href', 'tel:9876543210');
  await expect(page.getByText(/2 of 3 featured/)).toBeVisible();
  // no approval queue any more: reviews are live as soon as they are posted
  await expect(page.getByText(/straight away/)).toBeVisible();
  await expect(page.getByRole('tab', { name: /Pending/ })).toHaveCount(0);
});

test('search, filters and sorting', async ({ page }) => {
  await mockReviews(page);
  await open(page);
  await page.getByPlaceholder('Search name or text…').fill('learner c');
  await expect(page.getByRole('heading', { name: 'Learner c' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Learner a' })).toHaveCount(0);
  await page.getByPlaceholder('Search name or text…').fill('');
  await page.getByLabel('Hidden only').check();
  await expect(page.getByRole('heading', { name: 'Learner e' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(1);
  await page.getByLabel('Hidden only').uncheck();
  await page.getByLabel('Sort by').selectOption('lowest');
  await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText('Learner c');
});

test('the Home page limit of 3 featured reviews is enforced with a clear message', async ({ page }) => {
  const puts = await mockReviews(page);
  await open(page);
  await page.getByRole('button', { name: 'Feature on Home page: Learner c' }).click(); // 3rd slot: fine
  await expect(page.getByText(/3 of 3 featured/)).toBeVisible();
  await page.getByRole('button', { name: 'Feature on Home page: Learner d' }).click(); // 4th: refused
  await expect(page.getByText(/Only 3 reviews can be featured/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Feature on Home page: Learner d' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/Saved\./)).toBeVisible();
  expect(puts[0].data.items.filter((i) => i.featured && i.published)).toHaveLength(3);
});

test('edit a review in the drawer (typo, half-star rating, date) and save once', async ({ page }) => {
  const puts = await mockReviews(page);
  await open(page);
  await page.getByRole('button', { name: 'Edit Learner d' }).click();
  const drawer = page.getByRole('dialog', { name: 'Edit review' });
  await drawer.getByLabel('Review text *').fill('Corrected text: the instructors were very patient with me.');
  await drawer.getByLabel('Rating').selectOption('4.5');
  await drawer.getByLabel('Date shown').fill('2026-08-15');
  await drawer.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/Saved\./)).toBeVisible();
  expect(puts).toHaveLength(1);
  const d = puts[0].data.items.find((i) => i.id === 'd')!;
  expect(d).toMatchObject({ text: 'Corrected text: the instructors were very patient with me.', rating: 4.5, date: '2026-08-15T12:00:00.000Z' });
});

test('add a review manually; cancel removes it again', async ({ page }) => {
  const puts = await mockReviews(page);
  await open(page);
  await page.getByRole('button', { name: 'Add review' }).click();
  await page.getByRole('dialog', { name: 'Add review' }).getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();

  await page.getByRole('button', { name: 'Add review' }).click();
  const drawer = page.getByRole('dialog', { name: 'Add review' });
  await drawer.getByLabel('Name *').fill('Suresh Das');
  await drawer.getByLabel('Review text *').fill('Told me about it on WhatsApp: very good training.');
  await drawer.getByLabel('Rating').selectOption('4');
  await drawer.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/Saved\./)).toBeVisible();
  const added = puts[0].data.items.find((i) => i.name === 'Suresh Das')!;
  expect(added).toMatchObject({ rating: 4, published: true, featured: false });
  expect(puts[0].data.items).toHaveLength(6);
});

test('hide and delete: a deletion is staged until Save', async ({ page }) => {
  const puts = await mockReviews(page);
  await open(page);
  await page.getByRole('switch', { name: 'Published: Learner d' }).click();
  await page.getByRole('button', { name: 'Delete Learner e' }).click();
  await page.getByRole('dialog', { name: 'Delete this review?' }).getByRole('button', { name: 'Delete review' }).click();
  await expect(page.getByRole('heading', { name: 'Learner e' })).toHaveCount(0);
  expect(puts).toHaveLength(0);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/Saved\./)).toBeVisible();
  const items = puts[0].data.items;
  expect(items.map((i) => i.id)).not.toContain('e');
  expect(items.find((i) => i.id === 'd')!.published).toBe(false);
});

test('Summary & page settings: real numbers preview and the visitor-reviews switch', async ({ page }) => {
  const puts = await mockReviews(page);
  await open(page);
  await page.getByRole('tab', { name: 'Summary & page settings' }).click();
  // published: a 5, b 4, c 3.5, d 5  → average 4.4375 → 4.4
  await expect(page.getByText('4.4 / 5')).toBeVisible();
  await expect(page.getByText('75%')).toBeVisible(); // 3 of 4 rated 4+

  await page.getByRole('switch', { name: 'Accept new reviews from visitors' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/Saved\./)).toBeVisible();
  expect(puts[0].data.acceptSubmissions).toBe(false);
});

test('reviews editor has no serious accessibility violations (list, drawer and settings)', async ({ page }) => {
  test.setTimeout(90_000);
  await mockReviews(page);
  await open(page);
  const check = async () => {
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
  };
  expect(await check()).toEqual([]);
  await page.getByRole('button', { name: 'Edit Learner a' }).click();
  await expect(page.getByRole('dialog', { name: 'Edit review' })).toBeVisible();
  expect(await check()).toEqual([]);
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: 'Summary & page settings' }).click();
  expect(await check()).toEqual([]);
});
