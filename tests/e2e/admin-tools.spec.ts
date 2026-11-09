import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { createZip, readZip } from '../../lib/zip';

async function login(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Enter access code').fill('gkds1993');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

test('Dashboard (seed mode) warns about the default access code and shows the launch checklist', async ({ page }) => {
  await login(page);
  await expect(page.getByRole('heading', { name: 'Welcome back', level: 1 })).toBeVisible();
  await expect(page.getByText(/India time/)).toBeVisible();

  const warning = page.getByRole('list', { name: 'Things that need attention' });
  await expect(warning.getByText(/still using the default access code/)).toBeVisible();
  await expect(warning.getByRole('link', { name: 'Change the access code' })).toHaveAttribute('href', '/admin/security');

  await expect(page.getByRole('heading', { name: 'Is your site ready to launch?' })).toBeVisible();
  await expect(page.getByText(/\d+ of \d+/).first()).toBeVisible();
  await expect(page.getByText('Not done: GitHub is connected')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Choose your own access code.' })).toHaveAttribute('href', '/admin/security');

  // there is no pending-review queue any more
  await expect(page.getByText('Pending reviews')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Add a photo' })).toHaveAttribute('href', '/admin/gallery');
});

test('Dashboard links keep the /malika prefix', async ({ page }) => {
  await page.goto('/malika/login');
  await page.getByLabel('Enter access code').fill('gkds1993');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page).toHaveURL(/\/malika\/?$/);
  await expect(page.getByRole('link', { name: 'Add a course' })).toHaveAttribute('href', '/malika/courses');
});

test('History → Restore loads an older version into the editor as a draft, then Save makes it a new version', async ({ page }) => {
  await login(page);
  const seed = (await (await page.request.get('/api/admin/content/home')).json()) as { data: { hero: { titleLead: string } } };
  const old = structuredClone(seed.data);
  old.hero.titleLead = 'An older headline';

  const puts: { data: { hero: { titleLead: string } } }[] = [];
  await page.route('**/api/admin/history/home**', (route) => {
    const sha = new URL(route.request().url()).searchParams.get('sha');
    const body = sha
      ? { ok: true, data: old }
      : {
          ok: true,
          connected: true,
          commits: [
            { sha: 'a'.repeat(40), short: 'aaaaaaa', message: 'Updated Home page', raw: 'admin: update home.json', date: new Date().toISOString(), author: 'GKDS Admin', url: 'https://github.com/x/y/commit/a' },
            { sha: 'b'.repeat(40), short: 'bbbbbbb', message: 'Added starting content: Home page', raw: 'seed: add home.json', date: '2026-10-01T10:00:00Z', author: 'me', url: 'https://github.com/x/y/commit/b' },
          ],
        };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.route('**/api/admin/content/home', async (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    const body = route.request().postDataJSON() as { data: { hero: { titleLead: string } } };
    puts.push(body);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, sha: 'n', updatedAt: new Date().toISOString(), data: body.data }) });
  });

  await page.goto('/admin/home');
  await expect(page.getByRole('heading', { name: 'Home Page', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'History' }).click();
  const drawer = page.getByRole('dialog', { name: 'History' });
  await expect(drawer.getByText('Updated Home page')).toBeVisible();
  await expect(drawer.getByText('Added starting content: Home page')).toBeVisible();

  await drawer.getByText('Updated Home page').click();
  await expect(drawer.getByText(/Restoring this version would change 1 thing/)).toBeVisible();
  await expect(drawer.getByText('hero.titleLead')).toBeVisible();
  await expect(drawer.getByText('An older headline')).toBeVisible();
  expect(puts).toHaveLength(0); // looking is free

  await drawer.getByRole('button', { name: 'Restore this version' }).click();
  await expect(page.getByText(/Loaded into the editor as a draft/)).toBeVisible();
  expect(puts).toHaveLength(0); // still only a draft
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeEnabled();

  await page.getByRole('button', { name: /1\. Hero/ }).click();
  await expect(page.getByLabel('Headline (first part)')).toHaveValue('An older headline');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/Saved\./)).toBeVisible();
  expect(puts).toHaveLength(1);
  expect(puts[0].data.hero.titleLead).toBe('An older headline');
});

test('History says so clearly when a version no longer fits the page layout', async ({ page }) => {
  await login(page);
  await page.route('**/api/admin/history/about**', (route) => {
    const sha = new URL(route.request().url()).searchParams.get('sha');
    return sha
      ? route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ ok: false, message: 'That older version no longer fits the current page layout, so it cannot be restored here.' }) })
      : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, connected: true, commits: [{ sha: 'c'.repeat(40), short: 'ccccccc', message: 'Updated About page', raw: 'x', date: new Date().toISOString(), author: '', url: 'https://example.com' }] }) });
  });
  await page.goto('/admin/about');
  await page.getByRole('button', { name: 'History' }).click();
  await page.getByRole('dialog', { name: 'History' }).getByText('Updated About page').click();
  await expect(page.getByText(/no longer fits the current page layout/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore this version' })).toHaveCount(0);
});

test('Backup: downloads a ZIP with the six content files; restore shows a preview and needs RESTORE', async ({ page }) => {
  await login(page);
  const res = await page.request.get('/api/admin/backup');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('application/zip');
  expect(res.headers()['content-disposition']).toMatch(/gkds-content-backup-\d{4}-\d{2}-\d{2}\.zip/);
  const body = await res.body();
  expect(body.subarray(0, 2).toString()).toBe('PK');
  const files = readZip(body);
  expect(files.map((f) => f.name).sort()).toEqual(['README.txt', ...['about', 'courses', 'gallery', 'home', 'reviews', 'site'].map((n) => `content/${n}.json`)].sort());

  // an older home.json inside an otherwise identical backup
  const changed = files.map((f) => {
    if (f.name !== 'content/home.json') return f;
    const doc = JSON.parse(f.data.toString('utf8'));
    doc.hero.titleLead = 'Backup headline';
    return { ...f, data: Buffer.from(`${JSON.stringify(doc, null, 2)}\n`) };
  });

  const restores: unknown[] = [];
  await page.route('**/api/admin/backup', async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') return route.fallback();
    const sent = req.postDataJSON() as { confirm?: string };
    if (sent.confirm) {
      restores.push(sent);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, results: [{ name: 'home', ok: true }] }) });
    }
    return route.fallback(); // the real preview, which needs no GitHub
  });

  await page.goto('/admin');
  await page.getByText('Restore from a backup (advanced)').click();
  await page.getByLabel('Backup ZIP').setInputFiles({ name: 'backup.zip', mimeType: 'application/zip', buffer: createZip(changed) });

  const list = page.getByRole('list', { name: 'What the backup contains' });
  await expect(list.getByText('Will change')).toHaveCount(1);
  await expect(list.getByText(/hero\.titleLead: .* → Backup headline/)).toBeVisible();
  await expect(list.getByText('Same as now')).toHaveCount(5);

  const button = page.getByRole('button', { name: 'Restore 1 page' });
  await expect(button).toBeDisabled();
  await page.getByLabel(/Type RESTORE/).fill('restore');
  await expect(button).toBeDisabled(); // case matters
  await page.getByLabel(/Type RESTORE/).fill('RESTORE');
  await button.click();
  await expect(page.getByText(/Backup restored/)).toBeVisible();
  expect(restores).toHaveLength(1);
});

test('Backup import refuses things that are not a ZIP of content files', async ({ page }) => {
  await login(page);
  await page.goto('/admin');
  await page.getByText('Restore from a backup (advanced)').click();
  await page.getByLabel('Backup ZIP').setInputFiles({ name: 'notes.zip', mimeType: 'application/zip', buffer: Buffer.from('this is not a zip file') });
  await expect(page.getByRole('alert').filter({ hasText: /ZIP/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Restore \d/ })).toHaveCount(0);
});

test('Ctrl+K search jumps to a page, and ? shows the shortcuts', async ({ page }) => {
  await login(page);
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Search the admin panel' });
  await expect(palette).toBeVisible();
  await palette.getByRole('combobox').fill('galle');
  await expect(palette.getByRole('option', { name: /Gallery/ })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/admin\/gallery$/);

  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeHidden();
});

test('Help covers the main tasks, including forgotten-code recovery, and Refresh website cache works', async ({ page }) => {
  await login(page);
  await page.goto('/admin/help');
  await expect(page.getByRole('heading', { name: 'Help', level: 1 })).toBeVisible();
  for (const title of [/Change phone numbers/, /Add or hide a photo/, /Manage reviews/, /Add or edit a course/, /Replace the logo/, /Change the admin access code/, /older version/, /Why changes appear/, /\/admin or \/malika/]) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  }
  await expect(page.getByText(/ADMIN_CODE_RESET to 1/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Take me to Site Settings' }).first()).toHaveAttribute('href', '/admin/settings');
  await expect(page.getByText('App version')).toBeVisible();

  await page.getByRole('button', { name: 'Refresh website cache' }).click();
  await expect(page.getByText(/Website cache refreshed/)).toBeVisible();
});

test('every admin page has no serious accessibility violations', async ({ page }) => {
  test.setTimeout(240_000);
  const check = async (label: string) => {
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
    expect(bad, label).toEqual([]);
  };
  await page.goto('/admin/login');
  await check('login');
  await login(page);
  for (const path of ['/admin', '/admin/settings', '/admin/home', '/admin/about', '/admin/courses', '/admin/gallery', '/admin/media', '/admin/reviews', '/admin/security', '/admin/help']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await check(path);
  }
});
