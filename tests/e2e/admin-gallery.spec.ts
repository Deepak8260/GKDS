import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';

async function login(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Enter access code').fill('gkds1993');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

const photo = (color: string, w = 3000, h = 2000) =>
  sharp({ create: { width: w, height: h, channels: 3, background: color } }).png().toBuffer();

type Upload = { folder: string; filename: string; dataBase64: string };
type GalleryDoc = { items: { id: string; src: string; alt: string; category: string; order: number; published: boolean }[]; categories: { id: string }[] };

/** Fake media + content APIs: GitHub is never touched. */
async function mockApis(page: Page) {
  const uploads: Upload[] = [];
  const puts: { data: GalleryDoc }[] = [];
  const deletes: string[] = [];
  let counter = 0;

  await page.route('**/api/admin/media**', async (route) => {
    const req = route.request();
    const method = req.method();
    if (method === 'POST') {
      const body = req.postDataJSON() as Upload;
      uploads.push(body);
      counter += 1;
      const name = body.filename.replace(/\.[a-z]+$/i, '').toLowerCase();
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, path: `media/${body.folder}/0000000${counter}-${name}.webp`, size: 4096, width: 100, height: 60 }) });
    }
    if (method === 'DELETE') {
      const { path } = req.postDataJSON() as { path: string };
      deletes.push(path);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, deleted: true }) });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        connected: true,
        totalBytes: 3_000_000,
        files: [
          { path: 'media/gallery/aaaa1111-front.webp', name: 'aaaa1111-front.webp', folder: 'gallery', size: 2_000_000, usedIn: [{ file: 'gallery', jsonPath: 'items.0.src', label: 'Gallery' }] },
          { path: 'media/pages/bbbb2222-spare.webp', name: 'bbbb2222-spare.webp', folder: 'pages', size: 1_000_000, usedIn: [] },
        ],
      }),
    });
  });

  await page.route('**/api/admin/content/gallery', async (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    const body = route.request().postDataJSON() as { data: GalleryDoc };
    puts.push(body);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, sha: 'x', updatedAt: new Date().toISOString(), data: body.data }) });
  });

  return { uploads, puts, deletes };
}

test('upload 3 big photos: compressed in the browser, added with missing alt text, then published with Save', async ({ page }) => {
  test.setTimeout(90_000);
  const { uploads, puts } = await mockApis(page);
  await login(page);
  await page.goto('/admin/gallery');
  await expect(page.getByRole('heading', { name: 'Gallery', level: 1 })).toBeVisible();
  const before = await page.getByRole('list', { name: 'Gallery summary' }).innerText();
  const startCount = Number(/(\d+) photo/.exec(before)![1]);

  await page.getByLabel('Add to category').selectOption({ label: 'Training' });
  await page.locator('#gallery-upload').setInputFiles([
    { name: 'IMG_0001.png', mimeType: 'image/png', buffer: await photo('#aa3311') },
    { name: 'IMG_0002.png', mimeType: 'image/png', buffer: await photo('#11aa33') },
    { name: 'IMG_0003.png', mimeType: 'image/png', buffer: await photo('#1133aa') },
  ]);
  await expect(page.getByText('3 of 3 done')).toBeVisible({ timeout: 60_000 });

  // each file was shrunk to a small WebP before upload (a 3000×2000 PNG is far larger)
  expect(uploads).toHaveLength(3);
  for (const u of uploads) {
    expect(u.folder).toBe('gallery');
    expect(u.dataBase64.startsWith('UklGR')).toBe(true); // "RIFF" = WebP container
    expect(u.dataBase64.length).toBeLessThan(600_000);
  }
  await expect(page.getByRole('list', { name: 'Gallery summary' })).toContainText(`${startCount + 3} photos`);
  await expect(page.getByRole('list', { name: 'Gallery summary' })).toContainText('3 missing alt text');

  // saving is blocked until each photo is described
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('#editor-errors')).toContainText('attention');
  expect(puts).toHaveLength(0);

  // describe them one by one using the "missing alt text only" filter
  await page.getByLabel('Missing alt text only').check();
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: /^Edit Photo/ }).first().click();
    const drawer = page.getByRole('dialog', { name: 'Edit photo' });
    await drawer.getByLabel(/Alt text/).fill(`Training photo number ${i + 1}`);
    await drawer.getByRole('button', { name: 'Done' }).click();
  }
  await page.getByLabel('Missing alt text only').uncheck();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/Saved\./)).toBeVisible();

  expect(puts).toHaveLength(1);
  const items = puts[0].data.items;
  expect(items).toHaveLength(startCount + 3);
  expect(items.map((i) => i.order)).toEqual(items.map((_, i) => i + 1));
  const added = items.slice(-3);
  expect(added.map((i) => i.category)).toEqual(['training', 'training', 'training']);
  expect(added.every((i) => i.published && i.src.startsWith('media/gallery/') && i.alt.startsWith('Training photo number'))).toBe(true);
});

test('a file that is not a picture never creates a gallery entry and can be retried or dismissed', async ({ page }) => {
  const { uploads } = await mockApis(page);
  await login(page);
  await page.goto('/admin/gallery');
  const summary = page.getByRole('list', { name: 'Gallery summary' });
  const startText = await summary.innerText();
  await page.locator('#gallery-upload').setInputFiles([{ name: 'notes.png', mimeType: 'image/png', buffer: Buffer.from('this is not an image at all') }]);
  await expect(page.getByRole('alert').filter({ hasText: /could not read/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry notes.png' })).toBeVisible();
  expect(uploads).toHaveLength(0);
  expect(await summary.innerText()).toBe(startText);
  await page.getByRole('button', { name: 'Dismiss notes.png' }).click();
  await expect(page.getByRole('button', { name: 'Retry notes.png' })).toHaveCount(0);
});

test('HEIC photos are refused with a helpful message', async ({ page }) => {
  await mockApis(page);
  await login(page);
  await page.goto('/admin/gallery');
  await page.locator('#gallery-upload').setInputFiles([{ name: 'IMG_9.HEIC', mimeType: 'image/heic', buffer: Buffer.from('xxxxxxxxxxxx') }]);
  await expect(page.getByText(/Most Compatible/)).toBeVisible();
});

test('bulk actions: select two photos and unpublish them, then reorder with the arrows; one save carries both', async ({ page }) => {
  const { puts } = await mockApis(page);
  await login(page);
  await page.goto('/admin/gallery');
  const checkboxes = page.getByRole('checkbox', { name: /^Select / });
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await expect(page.getByText('2 selected')).toBeVisible();
  await page.getByRole('button', { name: 'Unpublish' }).click();
  await expect(page.getByRole('list', { name: 'Gallery summary' })).toContainText('2 hidden');

  // move the first photo one place later with the keyboard-friendly buttons
  await page.getByRole('button', { name: /^Move later:/ }).first().click();

  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/Saved\./)).toBeVisible();
  const items = puts[0].data.items;
  expect(items.filter((i) => !i.published)).toHaveLength(2);
  expect(items.map((i) => i.order)).toEqual(items.map((_, i) => i + 1));
});

test('categories: a non-empty one cannot be deleted; a new one can be added and used as a filter', async ({ page }) => {
  await mockApis(page);
  await login(page);
  await page.goto('/admin/gallery');
  await page.getByRole('button', { name: 'Manage categories' }).click();
  const modal = page.getByRole('dialog', { name: 'Manage categories' });
  await expect(modal.getByRole('button', { name: 'Delete Our Vehicles' })).toBeDisabled();
  await expect(modal.getByText(/Cannot delete: Move or delete those \d+ photos? first\./).first()).toBeVisible();

  await modal.getByLabel('New category name').fill('Road Safety Week');
  await modal.getByRole('button', { name: 'Add category' }).click();
  await expect(modal.getByRole('button', { name: 'Delete Road Safety Week' })).toBeEnabled(); // empty, so deletable
  await modal.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('group', { name: 'Filter by category' }).getByRole('button', { name: /Road Safety Week \(0\)/ })).toBeVisible();
});

test('ImageField: upload a new logo and pick another from the library', async ({ page }) => {
  test.setTimeout(60_000);
  const { uploads } = await mockApis(page);
  await login(page);
  await page.goto('/admin/settings');
  const logoBlock = page.locator('[data-field-path="logo"]');
  await logoBlock.locator('input[type="file"]').setInputFiles({ name: 'New Logo.png', mimeType: 'image/png', buffer: await photo('#cc8800', 900, 900) });
  await expect(logoBlock.getByText(/^Uploaded\./)).toBeVisible({ timeout: 30_000 });
  expect(uploads[0].folder).toBe('branding');
  await expect(logoBlock.getByText(/media\/branding\/0000000\d-new logo\.webp/).first()).toBeVisible();

  await logoBlock.getByRole('button', { name: 'Choose from library' }).click();
  const picker = page.getByRole('dialog', { name: 'Choose from library' });
  await expect(picker.getByText('bbbb2222-spare.webp')).toBeVisible();
  await picker.getByText('bbbb2222-spare.webp').click();
  await expect(logoBlock.getByText('media/pages/bbbb2222-spare.webp').first()).toBeVisible();
});

test('Media Library: used pictures cannot be deleted, unused ones can, and "delete all unused" previews the list', async ({ page }) => {
  const { deletes } = await mockApis(page);
  await login(page);
  await page.goto('/admin/media');
  await expect(page.getByRole('heading', { name: 'Media Library', level: 1 })).toBeVisible();
  await expect(page.getByText('Used in: Gallery')).toBeVisible();
  await expect(page.getByText('Unused', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete aaaa1111-front.webp' })).toBeDisabled();

  await page.getByRole('button', { name: /Delete all unused \(1\)/ }).click();
  const bulk = page.getByRole('dialog', { name: 'Delete all unused pictures?' });
  await expect(bulk.getByText('bbbb2222-spare.webp')).toBeVisible();
  await bulk.getByRole('button', { name: 'Delete 1 picture' }).click();
  await expect.poll(() => deletes).toEqual(['media/pages/bbbb2222-spare.webp']);
});

test('gallery editor and media library have no serious accessibility violations', async ({ page }) => {
  test.setTimeout(90_000);
  await mockApis(page);
  await login(page);
  const check = async () => {
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
  };
  await page.goto('/admin/gallery');
  await page.waitForLoadState('networkidle');
  expect(await check()).toEqual([]);
  await page.getByRole('button', { name: /^Edit /i }).first().click();
  await expect(page.getByRole('dialog', { name: 'Edit photo' })).toBeVisible();
  expect(await check()).toEqual([]);
  await page.keyboard.press('Escape');
  await page.goto('/admin/media');
  await expect(page.getByText('Used in: Gallery')).toBeVisible();
  expect(await check()).toEqual([]);
});
