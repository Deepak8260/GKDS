#!/usr/bin/env node
/**
 * Build the web-optimised images in public/assets/ from the full-size masters in assets-source/originals/.
 *
 *   node scripts/process-assets.mjs
 *
 * - Photos            → WebP, max 1600px wide
 * - Odisha seal       → tight crop of the state emblem with the white card removed (transparent PNG)
 * - Odisha badge      → the whole "Govt. of Odisha / Regd. No. 10/13" card with rounded transparent corners (WebP)
 * - Wave + feather    → trimmed to their visible bounds (transparent WebP)
 *
 * Uses `sharp` (already installed as a Next.js dependency). Masters are NOT deployed (they live outside public/).
 */
import { createRequire } from 'node:module';
import { mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'package.json'));
const sharp = require('sharp');

const src = (name) => join(root, 'assets-source', 'originals', name);
const dest = (rel) => {
  const p = join(root, 'public', 'assets', rel);
  mkdirSync(dirname(p), { recursive: true });
  return p;
};
const report = [];
const done = (rel) => report.push(`${rel.padEnd(46)} ${(statSync(dest(rel)).size / 1024).toFixed(0).padStart(5)} KB`);

/* ---------- photos ---------- */
const photos = {
  'wagonr-training-car.png': 'photos/vehicles/wagonr-training-car.webp',
  'maruti-800-training-car.png': 'photos/vehicles/maruti-800-training-car.webp',
  'driving-lesson-instructor.png': 'photos/training/driving-lesson-instructor.webp',
  'training-ground-wagonr.png': 'photos/training/training-ground-wagonr.webp',
  'school-entrance.png': 'photos/premises/school-entrance.webp',
  'classroom.png': 'photos/facilities/classroom.webp',
  'reception.png': 'photos/facilities/reception.webp',
};
for (const [from, to] of Object.entries(photos)) {
  await sharp(src(from)).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toFile(dest(to));
  done(to);
}

/* ---------- helpers ---------- */
async function raw(file, extract) {
  let img = sharp(file).ensureAlpha();
  if (extract) img = img.extract(extract);
  return img.raw().toBuffer({ resolveWithObject: true });
}

/** Crop to the bounding box of pixels whose alpha > threshold. */
async function trimToAlpha(file, threshold = 12) {
  const { data, info } = await raw(file);
  let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/* ---------- decor: wave + feather ---------- */
for (const [from, to, width, quality] of [
  ['green-saffron-wave.png', 'decor/green-saffron-wave.webp', 1400, 78], // smooth gradients: compresses well, shown full-width
  ['peacock-feather.png', 'decor/peacock-feather.webp', 480, 88],
]) {
  const box = await trimToAlpha(src(from));
  await sharp(src(from)).extract(box).resize({ width, withoutEnlargement: true }).webp({ quality, alphaQuality: 90, effort: 5 }).toFile(dest(to));
  done(to);
}

/* ---------- Odisha seal: circle + pillar mask, white card → transparent ---------- */
{
  // measured on the 1536×1024 master: ring centre (327, 567), radius ≈ 212; the Ashoka pillar rises above it (x 255–400, y 255–480)
  const region = { left: 111, top: 250, width: 430, height: 536 };
  const { data, info } = await raw(src('odisha-regd-badge.png'), region);
  const cx = 327 - region.left, cy = 567 - region.top, r = 210;
  const bg = [254, 252, 248];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      const inCircle = (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
      const inPillar = x >= 255 - region.left && x <= 400 - region.left && y >= 255 - region.top && y <= 480 - region.top;
      if (!inCircle && !inPillar) { data[i + 3] = 0; continue; }
      // colour-to-alpha against the card's off-white
      let a = 0;
      for (let c = 0; c < 3; c++) a = Math.max(a, (bg[c] - data[i + c]) / bg[c]);
      a = Math.min(1, Math.max(0, a * 1.12));
      if (a < 0.04) { data[i + 3] = 0; continue; }
      for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, Math.round((data[i + c] - bg[c] * (1 - a)) / a)));
      data[i + 3] = Math.round(a * 255);
    }
  }
  const tmp = await sharp(data, { raw: info }).png().toBuffer();
  const box = await trimToAlpha(tmp, 8).catch(() => null);
  let img = sharp(tmp);
  if (box) img = sharp(await sharp(tmp).extract(box).png().toBuffer());
  await img.resize({ height: 160 }).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(dest('brand/odisha-seal.png'));
  done('brand/odisha-seal.png');
}

/* ---------- Odisha registration badge: the whole card with rounded transparent corners ---------- */
{
  const region = { left: 64, top: 234, width: 1408, height: 556 };
  const radius = 84;
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${region.width}" height="${region.height}"><rect width="${region.width}" height="${region.height}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`,
  );
  // sharp applies composite() after resize(), so crop → mask → resize in separate steps.
  const cropped = await sharp(src('odisha-regd-badge.png')).extract(region).png().toBuffer();
  const masked = await sharp(cropped).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  await sharp(masked).resize({ width: 900 }).webp({ quality: 90, alphaQuality: 100, effort: 5 }).toFile(dest('brand/odisha-regd-badge.webp'));
  done('brand/odisha-regd-badge.webp');
}

console.log(report.join('\n'));
