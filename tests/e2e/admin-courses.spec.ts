import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Enter access code').fill('gkds1993');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

type CourseDoc = { courses: { id: string; slug: string; title: string; order: number; published: boolean; features: string[] }[] };

/** Saves go to PUT /api/admin/content/courses; GitHub is never touched in these tests. */
async function mockSave(page: Page) {
  const bodies: { data: CourseDoc }[] = [];
  await page.route('**/api/admin/content/courses', async (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    const body = route.request().postDataJSON() as { data: CourseDoc };
    bodies.push(body);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, sha: 'x', updatedAt: new Date().toISOString(), data: body.data }) });
  });
  return bodies;
}

async function addBikeCourse(page: Page) {
  await page.getByRole('button', { name: 'Add course' }).click();
  const drawer = page.getByRole('dialog', { name: 'Add course' });
  await expect(drawer).toBeVisible();
  await drawer.getByLabel('Title *').fill('Bike Driving Course');
  // the slug follows the title until it is edited by hand
  await expect(drawer.getByLabel(/Web address/)).toHaveValue('bike-driving-course');
  await drawer.getByLabel('Short description *').fill('Learn to ride a two-wheeler safely.');
  await drawer.getByLabel('Vehicle name *').fill('Scooter');
  await drawer.getByLabel('Feature *').first().fill('Helmet and safety basics');
  await drawer.getByRole('switch', { name: 'Published' }).click();
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(drawer).toBeHidden();
}

test('add a course, publish it, reorder it and save: one PUT with order 1..n', async ({ page }) => {
  const bodies = await mockSave(page);
  await login(page);
  await page.goto('/admin/courses');
  await expect(page.getByRole('heading', { name: 'Courses', level: 1 })).toBeVisible();
  await expect(page.getByText('Car Driving Course').first()).toBeVisible();

  await addBikeCourse(page);
  await expect(page.getByText('Bike Driving Course').first()).toBeVisible();

  // move the new course to the top with the keyboard-accessible buttons
  await page.getByRole('button', { name: 'Move up: Bike Driving Course' }).click();
  await page.getByRole('button', { name: 'Move up: Bike Driving Course' }).click();
  await expect(page.getByRole('button', { name: 'Move up: Bike Driving Course' })).toBeDisabled();

  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/Saved\./)).toBeVisible();

  expect(bodies).toHaveLength(1);
  const saved = bodies[0].data.courses;
  expect(saved).toHaveLength(3);
  expect(saved.map((c) => c.order)).toEqual([1, 2, 3]);
  expect(saved[0]).toMatchObject({ slug: 'bike-driving-course', title: 'Bike Driving Course', published: true, features: ['Helmet and safety basics'] });
});

test('cancelling a new course removes it again', async ({ page }) => {
  const bodies = await mockSave(page);
  await login(page);
  await page.goto('/admin/courses');
  await page.getByRole('button', { name: 'Add course' }).click();
  await page.getByRole('dialog', { name: 'Add course' }).getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled(); // nothing changed
  expect(bodies).toHaveLength(0);
});

test('slug: unique, and changing an existing one warns', async ({ page }) => {
  await login(page);
  await page.goto('/admin/courses');
  await page.getByRole('button', { name: 'Edit Car Driving Course' }).click();
  const drawer = page.getByRole('dialog', { name: 'Edit course' });
  const slug = drawer.getByLabel(/Web address/);
  await slug.fill('small-car-driving'); // already used by the other course
  await expect(drawer.getByText(/unique one/)).toBeVisible();
  await slug.fill('car-lessons');
  await expect(drawer.getByText(/Links to this course anchor will change/)).toBeVisible();
  await expect(drawer.getByText('/courses#car-lessons').first()).toBeVisible();
});

test('delete needs the title typed and is staged until Save', async ({ page }) => {
  const bodies = await mockSave(page);
  await login(page);
  await page.goto('/admin/courses');
  await page.getByRole('button', { name: 'Delete Small Car Driving Course' }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete this course?' });
  const confirm = dialog.getByRole('button', { name: 'Delete course' });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel(/Type/).fill('Small Car Driving Course');
  await confirm.click();
  await expect(page.getByText('Small Car Driving Course')).toHaveCount(0);
  expect(bodies).toHaveLength(0); // staged only
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/Saved\./)).toBeVisible();
  expect(bodies[0].data.courses).toHaveLength(1);
  expect(bodies[0].data.courses[0].order).toBe(1);
});

test('hiding every course shows the empty-state warning', async ({ page }) => {
  await login(page);
  await page.goto('/admin/courses');
  await page.getByRole('switch', { name: 'Published: Car Driving Course' }).click();
  await page.getByRole('switch', { name: 'Published: Small Car Driving Course' }).click();
  await expect(page.getByText(/Courses page will show an empty state/)).toBeVisible();
});

test('Page content tab edits the banner and bottom call-to-action', async ({ page }) => {
  const bodies = await mockSave(page);
  await login(page);
  await page.goto('/admin/courses');
  await page.getByRole('tab', { name: 'Page content' }).click();
  await page.getByRole('button', { name: /Bottom banner/ }).click();
  await page.getByLabel('Title (first part)').last().fill('Ready to Start Your Journey?');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/Saved\./)).toBeVisible();
  expect((bodies[0].data as unknown as { cta: { lead: string } }).cta.lead).toBe('Ready to Start Your Journey?');
});

test('the courses editor (with its drawer open) has no serious accessibility violations', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.goto('/admin/courses');
  await page.waitForLoadState('networkidle');
  const check = async () => {
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
  };
  expect(await check()).toEqual([]);
  await page.getByRole('button', { name: 'Edit Car Driving Course' }).click();
  await expect(page.getByRole('dialog', { name: 'Edit course' })).toBeVisible();
  expect(await check()).toEqual([]);
});

test('Escape closes the drawer and discards its edits', async ({ page }) => {
  await login(page);
  await page.goto('/admin/courses');
  await page.getByRole('button', { name: 'Edit Car Driving Course' }).click();
  const drawer = page.getByRole('dialog', { name: 'Edit course' });
  await drawer.getByLabel('Vehicle name *').fill('Something else');
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
});
