import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the gallery shows the driving video, playable on the site itself', async ({ page }) => {
  await page.goto('/gallery');
  const section = page.locator('#videos');
  await expect(section.getByRole('heading', { name: 'Driving Videos' })).toBeVisible();
  await expect(section.getByText('A driving lesson on the road')).toBeVisible();
  const video = section.locator('video');
  await expect(video).toHaveAttribute('controls', '');
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThanOrEqual(1);
  expect(await video.evaluate((v: HTMLVideoElement) => Math.round(v.duration))).toBeGreaterThan(30);

  const { violations } = await new AxeBuilder({ page }).include('#videos').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
});

test('the owner message stays hidden until a video is added', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('A Message From The Owner')).toHaveCount(0);
});
