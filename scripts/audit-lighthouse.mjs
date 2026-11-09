#!/usr/bin/env node
/**
 * Lighthouse scores (mobile and desktop) for the six public pages and the admin login page.
 *
 *   npm run build && npx next start -p 3115
 *   CHROME_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" node scripts/audit-lighthouse.mjs http://localhost:3115
 *
 * Uses `npx lighthouse` (not a dependency of the project). Prints a markdown table.
 * Edge sometimes fails a run (NO_NAVSTART, or a page that never paints): the script retries up to 3 more times.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = (process.argv[2] ?? 'http://localhost:3115').replace(/\/$/, '');
const pages = ['/', '/about', '/courses', '/gallery', '/reviews', '/contact', '/admin/login'];
const out = join(tmpdir(), 'gkds-lighthouse');
mkdirSync(out, { recursive: true });

function run(path, preset) {
  const file = join(out, `${preset}-${path.replace(/\W+/g, '_') || 'home'}.json`);
  const args = [
    'lighthouse',
    `${base}${path}`,
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json',
    `--output-path=${file}`,
    '--quiet',
    '--chrome-flags="--headless=new --no-sandbox"',
    ...(preset === 'desktop' ? ['--preset=desktop'] : []),
  ];
  if (process.env.CHROME_PATH) args.push(`--chrome-path="${process.env.CHROME_PATH}"`);
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = spawnSync('npx', args, { shell: true, encoding: 'utf8', timeout: 180_000 });
    try {
      const json = JSON.parse(readFileSync(file, 'utf8'));
      rmSync(file, { force: true });
      // a run where the browser never painted reports performance null / LCP 0: that is a failed measurement, so try again
      const valid = json.categories.performance.score !== null && (json.audits['largest-contentful-paint']?.numericValue ?? 0) > 0;
      if (valid || attempt === 3) return valid ? json : { error: 'the browser did not paint (measurement failed)' };
    } catch {
      if (attempt === 3) return { error: (r.stderr || r.stdout || 'no output').slice(0, 200) };
    }
  }
}

const fmt = (j, key) => (j.error ? 'n/a' : String(Math.round((j.categories[key]?.score ?? 0) * 100)));
const ms = (j, id) => (j.error ? 'n/a' : `${((j.audits[id]?.numericValue ?? 0) / 1000).toFixed(2)}s`);

console.log('| Page | Device | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const path of pages) {
  for (const preset of ['mobile', 'desktop']) {
    const j = run(path, preset);
    const cls = j.error ? 'n/a' : (j.audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3);
    const tbt = j.error ? 'n/a' : `${Math.round(j.audits['total-blocking-time']?.numericValue ?? 0)} ms`;
    console.log(`| ${path} | ${preset} | ${fmt(j, 'performance')} | ${fmt(j, 'accessibility')} | ${fmt(j, 'best-practices')} | ${fmt(j, 'seo')} | ${ms(j, 'largest-contentful-paint')} | ${cls} | ${tbt} |`);
  }
}
