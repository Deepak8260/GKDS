import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PAGES = ['/', '/about', '/courses', '/gallery', '/reviews', '/contact'];
const odia = (p: string) => (p === '/' ? '/or' : `/or${p}`);

/** A normal browser name: the language question is never shown to automated browsers, so the tests that need it say who they are. */
const HUMAN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

async function cookieValue(page: Page): Promise<string | undefined> {
  return (await page.context().cookies()).find((c) => c.name === 'gkds_lang')?.value;
}

test.describe('language switch', () => {
  test('the button in the top bar moves to the same page in Odia and back, and remembers the choice', async ({ page }) => {
    await page.goto('/courses');
    const toOdia = page.getByRole('link', { name: 'Switch the website to Odia' }).first();
    await expect(toOdia).toHaveText(/ଓଡ଼ିଆ/);
    await toOdia.click();
    await expect(page).toHaveURL(/\/or\/courses$/);
    await expect(page.locator('[lang="or-IN"]').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'ମୂଳପୃଷ୍ଠା' }).first()).toBeVisible();
    expect(await cookieValue(page)).toBe('or');

    const back = page.getByRole('link', { name: 'ୱେବସାଇଟ୍‌କୁ ଇଂରାଜୀକୁ ବଦଳାନ୍ତୁ' }).first();
    await expect(back).toHaveText(/English/);
    await back.click();
    await expect(page).toHaveURL(/\/courses$/);
    expect(await cookieValue(page)).toBe('en');
  });

  test('links inside the Odia site stay Odia (menu, breadcrumb, buttons, course anchors)', async ({ page, isMobile }) => {
    await page.goto('/or');
    if (isMobile) await page.getByRole('button', { name: 'ମେନୁ ଖୋଲନ୍ତୁ' }).click();
    const nav = page.getByRole('navigation', { name: isMobile ? 'ମୋବାଇଲ୍' : 'ମୁଖ୍ୟ' });
    const hrefs = await nav.getByRole('link').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThanOrEqual(6);
    for (const h of hrefs) expect(h, 'a menu link left the Odia site').toMatch(/^\/or(\/|$|#)/);

    await page.goto('/or/courses');
    const anchors = await page.locator('a[href*="#"]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    for (const h of anchors.filter((x) => x?.includes('courses#'))) expect(h).toMatch(/^\/or\/courses#/);
  });

  test('a returning Odia reader is sent from the English page to the Odia one; an English reader is not', async ({ page, context }) => {
    await context.addCookies([{ name: 'gkds_lang', value: 'or', url: 'http://localhost:3115' }]);
    await page.goto('/about');
    await expect(page).toHaveURL(/\/or\/about$/);
    await page.goto('/');
    await expect(page).toHaveURL(/\/or$/);

    await context.clearCookies();
    await context.addCookies([{ name: 'gkds_lang', value: 'en', url: 'http://localhost:3115' }]);
    await page.goto('/about');
    await expect(page).toHaveURL(/\/about$/);
    await page.goto('/or/about'); // an Odia address always shows Odia, whatever the cookie says
    await expect(page).toHaveURL(/\/or\/about$/);
  });

  test('unknown Odia addresses show the Odia "page not found" page', async ({ page }) => {
    await page.goto('/or/no-such-page');
    await expect(page.getByRole('heading', { name: 'ପୃଷ୍ଠା ମିଳିଲା ନାହିଁ' })).toBeVisible();
  });
});

test.describe('first-visit language question', () => {
  test.use({ userAgent: HUMAN_UA, storageState: { cookies: [], origins: [] } });
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
  });

  test('a new visitor is asked once; "yes" opens the Odia page and is remembered', async ({ page }) => {
    await page.goto('/about');
    const dialog = page.getByRole('dialog', { name: /Choose your language/ });
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.getByText('Would you like to switch the website from English to Odia?')).toBeVisible();
    await expect(dialog.getByText('ଆପଣ ଏହି ୱେବସାଇଟ୍‌କୁ ଇଂରାଜୀରୁ ଓଡ଼ିଆକୁ ବଦଳାଇବାକୁ ଚାହାଁନ୍ତି କି?')).toBeVisible();
    await dialog.getByRole('button', { name: 'ହଁ, ଓଡ଼ିଆରେ ଦେଖନ୍ତୁ' }).click();
    await expect(page).toHaveURL(/\/or\/about$/);
    expect(await cookieValue(page)).toBe('or');
    await page.goto('/contact'); // remembered: no question, straight to Odia
    await expect(page).toHaveURL(/\/or\/contact$/);
    await expect(page.getByRole('dialog', { name: /Choose your language/ })).toHaveCount(0);
  });

  test('"No, continue in English" is remembered and the question never returns', async ({ page }) => {
    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: /Choose your language/ });
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await dialog.getByRole('button', { name: 'No, continue in English' }).click();
    await expect(dialog).toBeHidden();
    expect(await cookieValue(page)).toBe('en');
    await page.reload();
    await page.waitForTimeout(2500);
    await expect(page.getByRole('dialog', { name: /Choose your language/ })).toHaveCount(0);
    await expect(page).toHaveURL(/localhost:\d+\/$/);
  });

  test('Escape or closing the window counts as English', async ({ page }) => {
    await page.goto('/gallery');
    const dialog = page.getByRole('dialog', { name: /Choose your language/ });
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(await cookieValue(page)).toBe('en');
  });

  test('someone who arrives on an Odia address is not asked (and Odia is remembered)', async ({ page }) => {
    await page.goto('/or/courses');
    await page.waitForTimeout(2500);
    await expect(page.getByRole('dialog', { name: /Choose your language/ })).toHaveCount(0);
    expect(await cookieValue(page)).toBe('or');
  });
});

test.describe('automated browsers and search engines are never interrupted', () => {
  test('the default test browser sees no language question', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await page.waitForTimeout(2500);
    await expect(page.getByRole('dialog', { name: /Choose your language/ })).toHaveCount(0);
  });
});

test.describe('the Odia pages', () => {
  for (const path of PAGES) {
    test(`${odia(path)}: shows Odia, has the right language tags and links to its English twin`, async ({ page }) => {
      await page.goto(odia(path));
      const h1 = page.getByRole('heading', { level: 1 }).first();
      await expect(h1).toBeVisible();
      expect(await h1.innerText()).toMatch(/[଀-୿]/);
      await expect(page.locator('[lang="or-IN"]').first()).toBeAttached();

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toMatch(new RegExp(`${odia(path).replace('/', '\\/')}$`));
      const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) => els.map((e) => [e.getAttribute('hreflang'), e.getAttribute('href')]));
      const lang = Object.fromEntries(alternates as [string, string][]);
      expect(lang['en-IN']).toMatch(path === '/' ? /localhost:\d+\/?$/ : new RegExp(`${path.replace('/', '\/')}$`));
      expect(lang['or-IN']).toMatch(new RegExp(`${odia(path).replace('/', '\\/')}$`));
      expect(await page.locator('meta[property="og:locale"]').getAttribute('content')).toBe('or_IN');
    });

    test(`${odia(path)}: no English text is left on the page`, async ({ page }) => {
      await page.goto(odia(path));
      await page.waitForLoadState('networkidle');
      const leftovers = await page.evaluate(() => {
        // allowed Latin text: contact details, the "English" switch, brand names of social networks, digits and times
        const allowed = /^(English|YouTube|Facebook|Instagram|WhatsApp|\+?\d[\d\s+()-]*|[\w.+-]+@[\w.-]+|GKDS)$/i;
        const found = new Set<string>();
        const latin = (s: string) => /[A-Za-z]{3,}/.test(s);
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const parent = n.parentElement;
          if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) continue;
          const text = (n.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (!text || !latin(text)) continue;
          // an email address split by a line-break hint (<wbr>) arrives in two pieces
          if (parent.closest('a[href^="mailto:"], a[href^="tel:"]')) continue;
          if (allowed.test(text) || parent.closest('[lang="en"]')) continue;
          found.add(`text: ${text}`);
        }
        for (const el of document.querySelectorAll('[aria-label], [title], img[alt], [placeholder]')) {
          for (const attr of ['aria-label', 'title', 'alt', 'placeholder']) {
            if (el.closest('[lang="en"]')) continue; // the switch back to English is meant to stay English
            const v = (el.getAttribute(attr) ?? '').replace(/[\w.+-]+@[\w.-]+/g, '').replace(/English/g, '').trim();
            if (v && latin(v) && !allowed.test(v) && !(el.getAttribute('href') ?? '').startsWith('tel:')) found.add(`${attr}: ${v}`);
          }
        }
        return [...found];
      });
      expect(leftovers).toEqual([]);
    });

    test(`${odia(path)}: no serious accessibility violations`, async ({ page }) => {
      await page.goto(odia(path));
      await page.waitForLoadState('networkidle');
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
      expect(bad).toEqual([]);
    });
  }
});

test.describe('Odia interface pieces', () => {
  test('the review form speaks Odia, including its validation messages', async ({ page }) => {
    await page.goto('/or/reviews');
    await page.getByRole('button', { name: 'ସମୀକ୍ଷା ଲେଖନ୍ତୁ' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'ସମୀକ୍ଷା ଲେଖନ୍ତୁ' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('ଆପଣଙ୍କ ଅନୁଭୂତି ଜଣାନ୍ତୁ')).toBeVisible();
    await expect(dialog.getByLabel(/ଆପଣଙ୍କ ନାମ/)).toBeVisible();
    await dialog.getByRole('button', { name: 'ସମୀକ୍ଷା ପଠାନ୍ତୁ' }).click();
    await expect(dialog.getByText('ଦୟାକରି ଆପଣଙ୍କ ନାମ ଲେଖନ୍ତୁ (ଅତି କମରେ 2 ଟି ଅକ୍ଷର)।')).toBeVisible();
    await expect(dialog.getByText('ଦୟାକରି ଏକ ଷ୍ଟାର୍ ରେଟିଂ ବାଛନ୍ତୁ।')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'ୱିଣ୍ଡୋ ବନ୍ଦ କରନ୍ତୁ' })).toBeVisible();
    await expect(dialog.getByRole('radio', { name: /5 ଷ୍ଟାର୍, ଉତ୍କୃଷ୍ଟ/ })).toBeAttached();
  });

  test('the gallery filter, counter and photo viewer are in Odia', async ({ page }) => {
    await page.goto('/or/gallery');
    const group = page.getByRole('group', { name: 'ବିଭାଗ ଅନୁଯାୟୀ ଫଟୋ ଛାଣନ୍ତୁ' });
    await expect(group.getByRole('button', { name: /ସମସ୍ତ ଫଟୋ/ })).toBeVisible();
    await expect(page.getByText(/ଟି ଫଟୋ ଦେଖାଯାଉଛି|ଫଟୋ ଦେଖାଯାଉଛି/)).toBeVisible();
    await page.getByRole('button', { name: /^ଫଟୋ ଖୋଲନ୍ତୁ:/ }).first().click();
    const viewer = page.getByRole('dialog', { name: 'ଫଟୋ ଦର୍ଶକ' });
    await expect(viewer).toBeVisible();
    await expect(viewer.getByRole('button', { name: 'ଫଟୋ ଦର୍ଶକ ବନ୍ଦ କରନ୍ତୁ' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
  });

  test('the open/closed badge on the contact page is in Odia', async ({ page }) => {
    await page.goto('/or/contact');
    await expect(page.getByText(/ଏବେ (ଖୋଲା|ବନ୍ଦ) ଅଛି/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ଫୋନ୍' })).toBeVisible();
    await expect(page.getByRole('link', { name: /^\+91 .* କୁ କଲ୍ କରନ୍ତୁ$/ }).first()).toBeVisible();
  });

  test('the Odia site is set in the Odia font', async ({ page }) => {
    await page.goto('/or');
    const family = await page.locator('h1').first().evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toMatch(/Noto Sans Oriya|__Noto_Sans_Oriya/i);
  });
});
