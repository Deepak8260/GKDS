# PROMPT 16 — Vercel deployment, documentation and final QA

**Attach:** nothing.
**Prerequisite:** CONTEXT BLOCK pasted; prompts 01–15 done.

## Goal
Make the project deploy to Vercel flawlessly from one private GitHub repo (`main` = code, `data` = content), document everything for a non-developer, and perform a full audit with real results.

## 1. Deployment documentation — `docs/DEPLOYMENT.md` (click-by-click, non-technical wording)
1. **Create the private repo** `gkds` on GitHub, push the code to `main`.
2. **Create the `data` branch** (orphan) and push the seed content: exact commands (`git checkout --orphan data`, `git rm -rf .`, `git checkout main -- content-seed` → move to `content/`, commit, push, return to `main`) OR run `node scripts/push-seed.mjs` (explain both; prefer the script).
3. **Create a fine-grained GitHub token**: Settings → Developer settings → Personal access tokens → Fine-grained; repository access = only `gkds`; permissions Contents (Read & write) + Metadata (Read); expiry 1 year; calendar reminder note.
4. **Import to Vercel**: New Project → import `gkds`; Framework Next.js; Node 20+; production branch `main`; (private repos are supported on the free Hobby plan when the repo belongs to the personal GitHub account; org-owned private repos need a paid plan — mention this).
5. **Environment variables** table (name → value/how to get → scope Production/Preview): `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO=gkds`, `GITHUB_BRANCH=data`, **`ADMIN_CODE` (replace `gkds1993` with the real code)**, `ADMIN_JWT_SECRET` (generate with `openssl rand -base64 32` or an online generator), `NEXT_PUBLIC_SITE_URL` (final domain, with https), `REVALIDATE_SECRET` (random), optional `GIT_COMMIT_NAME/EMAIL`. Explain that changing env vars needs a redeploy.
6. **Verify `data` branch builds are disabled**: `vercel.json` has `git.deploymentEnabled.data=false`; test by saving something in the admin and confirming Vercel shows NO new deployment.
7. **Custom domain**: add domain, DNS records (A/CNAME), HTTPS auto, redirect www ↔ apex, update `NEXT_PUBLIC_SITE_URL` and redeploy.
8. **First login**: open `https://<domain>/admin` or `/malika`, enter the access code, go to Security and change it, replace placeholder phones/address/map in Settings, upload the real logo and photos.
9. **Forgotten code recovery**: set `ADMIN_CODE_RESET=1`, redeploy, log in with `ADMIN_CODE`, change code, remove the variable, redeploy.
10. **Maintenance**: rotating the GitHub token (create new → update Vercel env → redeploy → delete old), backups (`git clone --mirror` + the admin ZIP download), restoring previous content via GitHub history or the admin History, monitoring GitHub API limits, keeping the repo size small, what to do if Vercel build fails.
11. **Troubleshooting table**: symptoms → cause → fix (site shows placeholder photos = env missing/invalid token; admin saves fail with 401 = token expired; 404 on images = media path/branch; changes not visible = cache → use "Refresh website cache"; etc.).

## 2. Configuration review
- `vercel.json`: `{ "regions": ["bom1"], "git": { "deploymentEnabled": { "data": false } } }` plus function settings if needed (`maxDuration` for upload/backup routes), and headers if you keep them there instead of `next.config`.
- All GitHub-touching route handlers use `runtime = 'nodejs'`; middleware uses only Edge-safe APIs (`jose`, no `crypto.scrypt`, no `fs`).
- No filesystem writes at runtime anywhere (`grep` for `fs.write`, `writeFile`).
- `next.config`: `/malika` rewrites, image config, headers/CSP, `poweredByHeader: false`, `reactStrictMode: true`.
- `scripts/check-env.mjs` runs as `prebuild`: in **production** builds on Vercel (`VERCEL_ENV=production`) fail with a readable list of missing REQUIRED variables (`GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, ADMIN_JWT_SECRET, NEXT_PUBLIC_SITE_URL, REVALIDATE_SECRET`) and WARN (not fail) if `ADMIN_CODE` is still `gkds1993`; in preview/local only warn; `ALLOW_SEED_ONLY=1` skips the check.
- Confirm Node version in `package.json` `engines` (>=20) and `.nvmrc`.
- `.gitignore` includes `.env*`, `.next`, `node_modules`, `test-results`, `playwright-report`.

## 3. README (`README.md`)
What the project is; ASCII architecture diagram (Browser → Vercel (Next.js) → GitHub `data` branch; admin writes ↔ GitHub; images proxy); features list; local development (`npm i`, `.env.local`, `npm run dev`, seed-only mode); env var reference; folder map; how the content model works; **how to add a new editable section end-to-end** (schema → seed → getter → component → admin field); scripts list; link to `docs/`.

## 4. Final audit — produce `docs/QA_REPORT.md` with REAL results (run everything)
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `next build` (include the route table showing static/ISR/dynamic per route).
- Lighthouse (mobile + desktop) for all six public pages AND the admin login page: table of scores; fix anything < 95 on public pages.
- axe accessibility scan on all public and admin pages.
- Link checker over the built site (internal links, anchors `/courses#slug`, `tel:`/`mailto:` formats, external links respond).
- Security checks: no secrets in the repo (`git grep -nE "ghp_|github_pat_|ADMIN_JWT_SECRET=.+"`), no secrets in client bundles, admin routes require auth (script that calls each `/api/admin/*` unauthenticated → 401), CSRF header enforced, rate limits working, `config/` and `submissions/` not readable via `/api/media` or the content API, CSP doesn't break maps/analytics.
- **End-to-end manual test script** (write it as a checklist table with pass/fail you actually execute against a Vercel preview with a test `data` branch):
  1. Open `/`, `/about`, `/courses`, `/gallery`, `/reviews`, `/contact` on desktop and phone viewports.
  2. Header dropdown anchors → correct course cards; every `tel:` link; WhatsApp link.
  3. Log in at `/admin` and `/malika` with the code; wrong-code lockout; logout.
  4. Admin → Settings: change a phone number → appears on Contact/Home/Footer within seconds.
  5. Admin → Gallery: upload 5 phone photos → Save → they appear on `/gallery` in the correct category; lightbox works.
  6. Admin → Courses: add a course → appears on `/courses` and in the header dropdown; hide it; delete it.
  7. Public → Leave a Review → pending in admin → approve → appears on `/reviews` (and Home if featured).
  8. Admin → Security: change code → old code fails, new works, second browser signed out.
  9. Admin → History: restore an older Home version → save → public page reverts.
  10. Confirm in Vercel that none of the admin saves triggered a deployment.
  11. Simulate GitHub outage (invalid token) → public site still renders from seed/cache; admin shows a clear error.
- Performance budgets: LCP < 2.5 s on 4G mobile for the Home page; first-load JS < 130 kB gzip per public page; CLS < 0.05.

## 5. Fix & report
Fix every issue found. At the end of `QA_REPORT.md` list **known limitations honestly**, e.g.: in-memory rate limiting is best-effort on serverless; GitHub API limit 5,000 requests/hour (mitigated by ISR + tag caching); first request after a deploy may be slower (cold start of the image proxy); the access code is a single shared secret (no per-user accounts); HEIC photos may need conversion; repo size should be kept < 1 GB.

## Acceptance checklist
- [ ] A fresh clone + the documented env vars deploys to Vercel with no errors; the `data` branch never triggers builds.
- [ ] Every public page and every admin screen works in production on desktop and mobile.
- [ ] `docs/DEPLOYMENT.md`, `README.md`, `docs/DATA_REPO.md` and `docs/QA_REPORT.md` exist and contain accurate, real information.
- [ ] No secrets in the repo or client bundles; default code `gkds1993` flagged until changed.
- [ ] All checks listed in section 4 are executed and results recorded.
