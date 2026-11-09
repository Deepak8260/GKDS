#!/usr/bin/env node
/**
 * Security audit against a running production build.
 *
 *   ADMIN_CODE=gkds1993 ADMIN_JWT_SECRET=<long> npx next start -p 3116      (a SEPARATE server: it triggers the login lock-out)
 *   node scripts/audit-security.mjs http://localhost:3116
 *
 * Exit code 1 when a check fails.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.argv[2] ?? 'http://localhost:3116').replace(/\/$/, '');
const CODE = process.env.AUDIT_CODE ?? 'gkds1993';
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

const same = { 'x-requested-with': 'gkds-admin', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' };
async function call(path, { method = 'GET', headers = {}, body, cookie } = {}) {
  return fetch(`${base}${path}`, {
    method,
    redirect: 'manual',
    headers: { ...headers, ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/* 1. Every admin API refuses a caller who is not logged in */
const adminApis = [
  ['GET', '/api/admin/health'],
  ['GET', '/api/admin/content/site'],
  ['PUT', '/api/admin/content/site'],
  ['GET', '/api/admin/media'],
  ['POST', '/api/admin/media'],
  ['DELETE', '/api/admin/media'],
  ['GET', '/api/admin/history/site'],
  ['GET', '/api/admin/backup'],
  ['POST', '/api/admin/backup'],
  ['POST', '/api/admin/revalidate'],
  ['GET', '/api/admin/reviews/contacts'],
  ['POST', '/api/admin/security/code'],
  ['POST', '/api/admin/security/signout-all'],
];
for (const [method, path] of adminApis) {
  const res = await call(path, { method, headers: same, body: method === 'GET' ? undefined : {} });
  check(`logged out: ${method} ${path} → 401`, res.status === 401, `status ${res.status}`);
}

/* 2. Admin pages redirect to the login page */
for (const path of ['/admin', '/admin/settings', '/malika', '/malika/gallery']) {
  const res = await call(path);
  const where = res.headers.get('location') ?? '';
  check(`logged out: ${path} → redirect to login`, [301, 302, 307, 308].includes(res.status) && /\/(admin|malika)\/login/.test(where), `status ${res.status} → ${where}`);
}

/* 3. Public endpoints that must not leak private files */
for (const path of ['/api/media/config/admin.json', '/api/media/submissions/reviews/x.json', '/api/media/media/../config/admin.json', '/api/media/content/site.json']) {
  const res = await call(path);
  check(`media proxy refuses ${path}`, res.status === 400 || res.status === 404, `status ${res.status}`);
}

/* 4. Login, then CSRF and whitelist checks */
const login = await call('/api/admin/login', { method: 'POST', headers: same, body: { code: CODE } });
const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
const setCookie = (login.headers.getSetCookie?.() ?? []).join(' | ');
check('login with the right code succeeds and sets the cookie', login.status === 200 && cookie.includes('gkds_admin='), `status ${login.status}`);
check('session cookie is HttpOnly and SameSite=Strict', /httponly/i.test(setCookie) && /samesite=strict/i.test(setCookie), setCookie.replace(/gkds_admin=[^;]+/, 'gkds_admin=…'));

if (cookie) {
  const noCsrf = await call('/api/admin/security/signout-all', { method: 'POST', headers: { 'content-type': 'application/json' }, body: {}, cookie });
  check('logged in but without the CSRF header → 403', noCsrf.status === 403, `status ${noCsrf.status}`);
  const crossSite = await call('/api/admin/security/signout-all', { method: 'POST', headers: { ...same, 'sec-fetch-site': 'cross-site' }, body: {}, cookie });
  check('cross-site request → 403', crossSite.status === 403, `status ${crossSite.status}`);
  for (const name of ['admin', 'config%2Fadmin', '..%2Fconfig%2Fadmin', 'submissions']) {
    const res = await call(`/api/admin/content/${name}`, { headers: same, cookie });
    check(`content API refuses "${decodeURIComponent(name)}"`, res.status === 404, `status ${res.status}`);
  }
  for (const path of ['config/admin.json', 'media/../config/admin.json', 'content/site.json']) {
    const res = await call('/api/admin/media', { method: 'DELETE', headers: same, body: { path }, cookie });
    check(`media delete refuses "${path}"`, res.status === 400 || res.status === 409, `status ${res.status}`);
  }
  const notImage = await call('/api/admin/media', { method: 'POST', headers: same, body: { folder: 'gallery', filename: 'x.png', dataBase64: Buffer.from('<svg onload=alert(1)>' + ' '.repeat(20)).toString('base64') }, cookie });
  check('media upload refuses a non-image', [409, 415].includes(notImage.status), `status ${notImage.status}`);
  const badFolder = await call('/api/admin/media', { method: 'POST', headers: same, body: { folder: '../config', filename: 'x.png', dataBase64: 'AAAA' }, cookie });
  check('media upload refuses an unknown folder', [400, 409].includes(badFolder.status), `status ${badFolder.status}`);
}

/* 5. Headers on public and admin responses */
const home = await call('/');
const h = (name) => home.headers.get(name) ?? '';
check('CSP present and blocks framing/objects', /default-src/.test(h('content-security-policy')) && /object-src 'none'/.test(h('content-security-policy')), h('content-security-policy').slice(0, 80));
check('X-Content-Type-Options: nosniff', /nosniff/i.test(h('x-content-type-options')));
check('Referrer-Policy set', h('referrer-policy') !== '', h('referrer-policy'));
check('framing is blocked (X-Frame-Options or frame-ancestors)', /deny|sameorigin/i.test(h('x-frame-options')) || /frame-ancestors/.test(h('content-security-policy')));
check('Permissions-Policy set', h('permissions-policy') !== '');
check('no X-Powered-By header', h('x-powered-by') === '');
if (cookie) {
  const page = await call('/admin/security', { cookie });
  check('admin pages are no-store and noindex', /no-store/.test(page.headers.get('cache-control') ?? '') && /noindex/i.test(await page.text()));
}

/* 6. Brute force: wrong codes are throttled and finally locked out */
let locked = false;
let last = 0;
for (let i = 0; i < 8 && !locked; i++) {
  const res = await call('/api/admin/login', { method: 'POST', headers: { ...same, 'x-forwarded-for': '198.51.100.77' }, body: { code: `wrong-${i}` } });
  last = res.status;
  locked = res.status === 429;
}
check('repeated wrong codes end in a lock-out (429)', locked, `last status ${last}`);
const afterLock = await call('/api/admin/login', { method: 'POST', headers: { ...same, 'x-forwarded-for': '198.51.100.77' }, body: { code: CODE } });
check('even the right code is refused while locked out', afterLock.status === 429, `status ${afterLock.status}`);

/* 7. Public review form refuses foreign origins and bad bodies */
const foreign = await call('/api/reviews/submit', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: { name: 'A B', rating: 5, text: 'x'.repeat(30), startedAt: 1 } });
check('review form refuses a foreign origin (403)', foreign.status === 403, `status ${foreign.status}`);
const wrongType = await call('/api/reviews/submit', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'x' });
check('review form refuses non-JSON (415)', wrongType.status === 415, `status ${wrongType.status}`);

/* 8. Nothing secret in the repository or in the browser bundles */
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};
const staticFiles = walk(join(process.cwd(), '.next', 'static')).filter((f) => /\.(js|css|map|json|html)$/.test(f));
const patterns = [/ghp_[A-Za-z0-9]{20,}/, /github_pat_[A-Za-z0-9_]{20,}/, /ADMIN_JWT_SECRET/, /GITHUB_TOKEN/, /gkds1993/, /ADMIN_CODE_RESET/];
const leaks = [];
const secretValues = [];
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^(GITHUB_TOKEN|ADMIN_JWT_SECRET|REVALIDATE_SECRET)=(.{12,})$/);
    if (m) secretValues.push(m[2].trim());
  }
}
for (const f of staticFiles) {
  const text = readFileSync(f, 'utf8');
  for (const p of patterns) if (p.test(text)) leaks.push(`${f} matches ${p}`);
  for (const v of secretValues) if (text.includes(v)) leaks.push(`${f} contains a secret value from .env.local`);
}
check(`browser bundles (${staticFiles.length} files in .next/static) contain no secrets or server-only names`, leaks.length === 0, leaks.slice(0, 3).join('; '));

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok || !r.detail ? '' : `  (${r.detail})`}`);
console.log(`\n${results.length - failed.length} of ${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
