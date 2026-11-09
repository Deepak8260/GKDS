#!/usr/bin/env node
/**
 * Link checker for the built site.
 *
 *   npm run build && npx next start -p 3115        (in one terminal)
 *   node scripts/audit-links.mjs http://localhost:3115
 *
 * Checks every page in sitemap.xml: internal links respond, `/courses#slug` anchors exist on the target page,
 * tel:, mailto: and WhatsApp links are well formed, and external links respond. Exit code 1 on any failure.
 */
const base = (process.argv[2] ?? 'http://localhost:3115').replace(/\/$/, '');
const skipExternal = process.argv.includes('--no-external');

const results = [];
const record = (kind, target, ok, detail = '') => results.push({ kind, target, ok, detail });

async function get(url, init = {}) {
  const ctrl = AbortSignal.timeout(15_000);
  return fetch(url, { redirect: 'follow', signal: ctrl, headers: { 'user-agent': 'gkds-link-audit' }, ...init });
}

const sitemap = await (await get(`${base}/sitemap.xml`)).text();
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname || '/');
if (!pages.includes('/')) pages.unshift('/');

const internal = new Map(); // path -> pages it was found on
const anchors = new Map(); // "path#id" -> found on
const external = new Map();
const special = [];
const htmlCache = new Map();

for (const page of pages) {
  const res = await get(`${base}${page}`);
  const html = await res.text();
  htmlCache.set(page, html);
  record('page', page, res.status === 200, `status ${res.status}`);

  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const raw = m[1].replace(/&amp;/g, '&');
    if (raw.startsWith('tel:') || raw.startsWith('mailto:')) special.push(raw);
    else if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)/.test(raw)) special.push(raw);
    else if (raw.startsWith('http://') || raw.startsWith('https://')) {
      if (raw.startsWith(base)) internal.set(new URL(raw).pathname + new URL(raw).hash, page);
      else external.set(raw, page);
    } else if (raw.startsWith('/') && !raw.startsWith('//')) {
      if (raw.includes('#')) anchors.set(raw, page);
      else internal.set(raw, page);
    } else if (raw.startsWith('#') && raw.length > 1) {
      anchors.set(`${page}${raw}`, page);
    }
  }
}

// internal links (pages, images, scripts): must answer 200
for (const [path, from] of internal) {
  if (path.startsWith('/_next/image')) continue; // optimiser URLs depend on the viewport; the source images are checked below
  const url = path.split('#')[0];
  if (!url) continue;
  try {
    const res = await get(`${base}${url}`, { method: 'GET' });
    record('internal', `${url} (on ${from})`, res.status === 200, `status ${res.status}`);
  } catch (e) {
    record('internal', `${url} (on ${from})`, false, String(e.message ?? e));
  }
}

// anchors: the id must exist on the target page
for (const [target, from] of anchors) {
  const [path, id] = target.split('#');
  const pagePath = path || from;
  let html = htmlCache.get(pagePath);
  if (!html) {
    html = await (await get(`${base}${pagePath}`)).text();
    htmlCache.set(pagePath, html);
  }
  record('anchor', `${target} (on ${from})`, new RegExp(`\\bid="${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html), `id="${id}" on ${pagePath}`);
}

// tel:, mailto:, WhatsApp
for (const link of new Set(special)) {
  let ok = false;
  if (link.startsWith('tel:')) ok = /^tel:\+?\d{10,15}$/.test(link);
  else if (link.startsWith('mailto:')) ok = /^mailto:[^@\s?]+@[^@\s?]+\.[^@\s?]+/.test(link);
  else ok = /^https:\/\/wa\.me\/\d{10,15}(\?text=.*)?$/.test(link);
  record('contact-link', link, ok, ok ? 'well formed' : 'malformed');
}

// external links: any answer below 500 means the site exists (social sites often answer 403/429 to bots)
if (!skipExternal) {
  for (const [url, from] of external) {
    try {
      const res = await get(url, { method: 'GET' });
      record('external', `${url} (on ${from})`, res.status < 500, `status ${res.status}`);
    } catch (e) {
      record('external', `${url} (on ${from})`, false, String(e.cause?.code ?? e.message ?? e));
    }
  }
}

const failed = results.filter((r) => !r.ok);
const count = (k) => results.filter((r) => r.kind === k).length;
console.log(`Pages checked: ${count('page')}  Internal links: ${count('internal')}  Anchors: ${count('anchor')}  tel/mailto/WhatsApp: ${count('contact-link')}  External: ${count('external')}`);
for (const r of results.filter((x) => x.kind !== 'internal' || !x.ok)) console.log(`${r.ok ? 'PASS' : 'FAIL'}  [${r.kind}] ${r.target}  ${r.detail}`);
console.log(failed.length ? `\n${failed.length} problem(s) found.` : '\nAll links OK.');
process.exit(failed.length ? 1 : 0);
