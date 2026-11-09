# QA report

Everything below was run on **2026-11-09** against the production build (`next build` + `next start`) on a Windows laptop with Microsoft Edge. Where something could **not** be run (it needs a live Vercel deployment and the real GitHub repository), this report says so.

## 1. Summary

| Check | Result |
|---|---|
| `npm run lint` | **Pass**: 0 errors, 0 warnings |
| `npm run typecheck` | **Pass** |
| `npm test` (Vitest) | **Pass**: 27 files, **347 tests** |
| `npm run test:e2e` (Playwright, desktop + Pixel 7 phone) | **Pass**: **166 passed**, 2 skipped on purpose (the phone-menu test is skipped on desktop, the desktop-menu test on the phone), 0 failed |
| `next build` | **Pass** (route table in section 2) |
| axe accessibility, all public and all admin pages | **Pass**: 0 serious or critical violations |
| Link audit (`scripts/audit-links.mjs`) | **Pass**: 6 pages, 29 internal links, 8 anchors, 3 tel/mailto/WhatsApp, 11 external, 0 problems |
| Security audit (`scripts/audit-security.mjs`) | **Pass**: 46 of 46 checks |
| Lighthouse accessibility / best practices / SEO | **100 / 100 / 100** on all public pages (admin login SEO 66 on purpose: it is `noindex`) |
| Lighthouse performance, desktop | **98 to 99** on all public pages |
| Lighthouse performance, mobile | **77 to 87**: **below the 95 target** (see section 5) |
| Performance budgets | CLS **pass**; first-load JS and mobile LCP **not met** (section 5) |

## 2. Build route table

`next build` (Next.js 16.4.5, Turbopack). `○` = prerendered static, `ƒ` = rendered on demand.

```
○ /                  ○ /about            ○ /courses          ○ /gallery
○ /reviews           ○ /contact          ○ /sitemap.xml      ○ /robots.txt
○ /manifest.webmanifest                  ○ /opengraph-image  ○ /_not-found
○ /styleguide        (returns 404 in production; verified by a test)

ƒ /admin  /admin/login  /admin/settings  /admin/home  /admin/about  /admin/courses
ƒ /admin/gallery  /admin/media  /admin/reviews  /admin/security  /admin/help
ƒ /api/admin/{login,logout,health,content/[name],media,history/[name],backup,
              revalidate,reviews/contacts,security/code,security/signout-all}
ƒ /api/media/[...path]   ƒ /api/revalidate   ƒ /api/reviews/submit
ƒ Proxy (middleware)
```

The six public pages are prerendered, but their content comes from GitHub through tagged fetches: they refresh when an admin saves (tag `content`), when **Refresh website cache** is pressed, or after at most one hour.

## 3. Test coverage

* **Unit (347):** schemas and seeds, content fallback, GitHub read/write layer (sha conflicts, retries, rate limits), access-code hashing, sessions, CSRF, login throttle, review stats, the review submit API (spam defences, publishing, photo handling), media upload API (magic bytes, dedupe, usage scan, delete protection), image maths, ZIP writer/reader, backup and restore planning, history/diff, commit wording, launch checklist, courses/gallery/reviews admin logic, the build-time environment check.
* **Browser (166):** every public page on desktop and phone (navigation, filters, lightbox, forms, no horizontal scroll at 320 px), SEO files, security headers and CSP with no console errors, and the whole admin panel: login at `/admin` and `/malika`, all editors, courses, gallery uploads, media library, reviews, dashboard, history/restore, backup/restore, command palette, help. GitHub is **never** contacted in these tests (it is mocked or switched off).

## 4. Findings of this audit, and what was fixed

| Finding | Fix |
|---|---|
| The default access code text `gkds1993` was part of a browser JavaScript file (a hint on the Security page) | Removed from the client code. The audit now fails if it ever appears in `.next/static` again |
| Google Maps scripts (about 330 kB) were fetched while the Home page loaded, although the map sits far down the page | The map iframe now starts loading only when it is about to scroll into view (`components/ui/lazy-map-frame.tsx`). Google requests during the initial load went from 5 to 0 |
| The active category pill in the gallery editor and hidden-item styling failed colour contrast | Darker active colour; hidden items use a dashed border instead of lower opacity |
| Dashboard still talked about "pending reviews" although reviews publish immediately | Replaced by real statistics; sidebar badge removed |
| Production builds could ship with missing settings | `scripts/check-env.mjs` runs before every build and stops a Vercel production build with a plain list |

## 5. Performance (Lighthouse, Edge, simulated slow 4G for mobile)

Median of up to 4 attempts per page. Lighthouse runs with a failed measurement (the browser never painted) are repeated automatically.

| Page | Device | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| / | mobile | 84 | 100 | 100 | 100 | 4.12 s | 0.000 | 169 ms |
| / | desktop | 99 | 100 | 100 | 100 | 0.84 s | 0.000 | 9 ms |
| /about | mobile | 86 | 100 | 100 | 100 | 4.26 s | 0.000 | 31 ms |
| /about | desktop | 99 | 100 | 100 | 100 | 0.84 s | 0.000 | 0 ms |
| /courses | mobile | 87 | 100 | 100 | 100 | 4.13 s | 0.000 | 36 ms |
| /courses | desktop | 99 | 100 | 100 | 100 | 0.87 s | 0.000 | 0 ms |
| /gallery | mobile | 77 | 100 | 100 | 100 | 5.08 s | 0.000 | 225 ms |
| /gallery | desktop | 98 | 100 | 100 | 100 | 1.07 s | 0.000 | 6 ms |
| /reviews | mobile | 87 | 100 | 100 | 100 | 4.06 s | 0.000 | 69 ms |
| /reviews | desktop | 99 | 100 | 100 | 100 | 0.85 s | 0.000 | 13 ms |
| /contact | mobile | 85 | 100 | 100 | 100 | 3.74 s | 0.000 | 231 ms |
| /contact | desktop | 98 | 100 | 100 | 100 | 1.06 s | 0.000 | 7 ms |
| /admin/login | mobile | 100 | 100 | 100 | 66 (noindex, intended) | 0.77 s | 0.000 | 48 ms |
| /admin/login | desktop | 100 | 100 | 100 | 66 (noindex, intended) | 0.22 s | 0.000 | 5 ms |

*These numbers were taken before the lazy map change; a later spot check of `/contact` on mobile gave 83 with no Google map requests during load. Mobile scores on this machine vary a lot between runs (the same page scored 62 to 84 on repeat runs), so treat them as a range.*

**Budgets**

| Budget | Result |
|---|---|
| CLS < 0.05 | **Met**: 0.000 everywhere |
| LCP < 2.5 s on 4G mobile | **Not met in the simulation** (3.7 to 5.1 s). The picture itself arrives in about 100 ms; the time is spent waiting for the main thread while Lighthouse slows the CPU 4×. Desktop LCP is under 1.1 s |
| First-load JavaScript < 130 kB gzip | **Not met**: **161 to 170 kB** per public page (modern browsers; the extra 39 kB "nomodule" file is only for very old browsers). React 19 and the Next.js runtime alone are about 116 kB gzip, so the budget is not reachable with this framework without removing interactive features |
| Performance ≥ 95 on public pages | **Desktop met (98 to 99); mobile not met (77 to 87)** |

What was already done to help: the hero picture is preloaded with high priority and sized with `sizes`, fonts are self-hosted and swapped, images are WebP/AVIF at fitting widths, the map is deferred, there are no render-blocking third-party scripts, and layout is fixed so nothing moves.

## 6. Security

Executed by `scripts/audit-security.mjs` on a separate production server (46 checks, all passed):

* Every `/api/admin/*` endpoint answers **401** to a caller who is not logged in; `/admin/*` and `/malika/*` redirect to the login page.
* Logged in but **without the CSRF header → 403**; a cross-site request → 403.
* The session cookie is `HttpOnly` and `SameSite=Strict`; admin pages are `no-store` and `noindex`.
* The content API refuses `admin`, `config/admin`, traversal and `submissions`; the media proxy and media delete refuse `config/`, `submissions/`, `content/` and `..`; uploads of non-images and unknown folders are refused.
* Wrong codes end in a **lock-out (429)**, and even the right code is refused while locked out.
* The public review form refuses a foreign origin (403) and non-JSON (415).
* CSP, `nosniff`, referrer policy, permissions policy and framing protection are present; no `X-Powered-By`.
* **No secrets in the repository** (`git grep` for `ghp_`, `github_pat_`, `ADMIN_JWT_SECRET=…` finds nothing outside the example and docs; the only tracked env file is `.env.example`) and **none in the browser bundles** (45 files scanned, including the actual token values from `.env.local`).
* Middleware (`proxy.ts`) uses only Edge-safe code (`jose`); `scrypt` hashing runs in Node route handlers only. Every GitHub-touching route sets `runtime = 'nodejs'`.

**Filesystem writes at runtime:** the only `writeFile` calls are in `app/api/reviews/submit/route.ts`. They are a **local-development convenience** (so a review can be tested before GitHub is connected) and are unreachable in production: when `NODE_ENV=production` and GitHub is not configured the route answers 503 instead. Nothing else writes to disk.

## 7. Link audit

Pages: `/`, `/about`, `/courses`, `/gallery`, `/reviews`, `/contact` (from the sitemap).

* All 29 internal links answer 200; the header dropdown anchors `/courses#car-driving` and `/courses#small-car-driving` exist on the Courses page; every skip link `#main` exists.
* `tel:+919124163306`, `mailto:` and the WhatsApp link are well formed.
* The 11 external links (Google Maps, YouTube, Facebook, Instagram) respond. **Note:** the three social links are still the generic homepages of those sites, not the school's own pages. The admin Dashboard flags this under "Needs attention".
* The audit ran without `NEXT_PUBLIC_SITE_URL`, so canonical and share URLs show `http://localhost:3000`. A production build on Vercel cannot start without that variable (`check-env`), so this does not happen live.

## 8. The end-to-end manual test script

Honest status of each step. "Automated" means it was executed by the Playwright/Vitest suites against the production build with GitHub mocked or switched off. **"Not run live"** means it needs the deployed site and the real repository, and was not run in this audit.

| # | Step | Status |
|---|---|---|
| 1 | Open `/`, `/about`, `/courses`, `/gallery`, `/reviews`, `/contact` on desktop and phone | **Pass** (automated, desktop and Pixel 7; no horizontal scroll at 320 px) |
| 2 | Header dropdown anchors, every `tel:` link, WhatsApp link | **Pass** (link audit + browser tests) |
| 3 | Log in at `/admin` and `/malika`; wrong-code lock-out; logout | **Pass** (automated + security audit) |
| 4 | Settings: change a phone number → shows on Contact/Home/Footer within seconds | Save request and validation **pass** (automated, mocked). **Not run live**: the propagation through GitHub and the cache |
| 5 | Gallery: upload 5 phone photos → Save → on `/gallery` in the right category; lightbox | Compression, upload queue, alt text, bulk actions **pass** (automated, 3 large photos, mocked upload API). **Not run live** |
| 6 | Courses: add → public page and header dropdown; hide; delete | **Pass** (automated, mocked save); a unit test proves the header, Home teaser and Courses page all use `getPublishedCourses()` |
| 7 | Public "Leave a Review" → … | **Changed by design:** reviews publish immediately (there is no approval queue). The submit API is unit-tested (publishing, photo, phone privacy, retries on conflict). **The owner posted a real review with a photo on the real repository**: it created the commits `review: photo for …` and `review: new review …` on the `data` branch, which proves the live write path |
| 8 | Security: change code → old code fails, new works, second browser signed out | Unit-tested (hashing, precedence, session version). **Not run live** |
| 9 | History: restore an older Home version → save → public page reverts | **Pass** (automated, mocked history API: loads as a draft, saves as a new version). **Not run live** |
| 10 | Vercel shows no deployment for admin saves | **Not run live.** Configured in `vercel.json`; verify with step 6 of `docs/DEPLOYMENT.md` |
| 11 | GitHub outage → public site still renders; admin shows a clear error | **Pass** (the whole browser suite runs with GitHub switched off, so every public page renders from the built-in content; the admin says "GitHub is not connected"). An expired token (401) is handled by the write layer and covered by unit tests |

## 9. Known limitations

* **Access control is one shared code.** There are no per-person accounts. Anyone with the code has full control. Change it from the default (the Dashboard warns until you do) and keep it private.
* **Login lock-out and rate limits live in memory.** On Vercel each server instance has its own memory, so these are a best-effort brake, not a guarantee. The access code's strength is the real protection.
* **Reviews are not moderated.** Anything that passes the automatic checks (spam traps, no links or phone numbers in the text, 3 per visitor per hour, 30 per hour overall) is public at once. The admin can hide or delete a review afterwards.
* **GitHub API limit: 5,000 requests per hour** for the token. Pages are cached and refreshed by tag, so normal use is far below it; a very large media library plus many editors could approach it.
* **Cold starts:** the first request after a deploy (especially the picture proxy) can be slower.
* **Pictures:** JPG, PNG and WebP only; iPhone HEIC photos must be shared as JPG or set to "Most Compatible". The images are compressed in the browser, which needs a reasonably modern phone. Keep the repository under about 1 GB.
* **Mobile performance score is 77 to 87** and the 130 kB first-load JavaScript budget is not met (section 5). Desktop is 98 to 99.
* **Not verified live:** deployment on Vercel, the real GitHub round-trips for editors, domain and DNS (section 8).
* **Branch layout:** the repository's `data` branch must contain content only. A `data` branch created "from main" also holds code; it works because Vercel ignores it, but code pushes and website saves could collide there.
* **In-browser compression** reads the whole photo into memory: a 20 MB photo on a very old phone may fail with a clear message.

## 10. How to repeat these checks

```bash
npm run lint && npm run typecheck && npm test
GITHUB_TOKEN= GITHUB_OWNER= GITHUB_REPO= npm run build     # GitHub off, so tests use the built-in content
PW_CHANNEL=msedge npm run test:e2e                           # PW_CHANNEL only if Playwright's own browser is missing

npx next start -p 3115                                       # in a second terminal, for the next two
node scripts/audit-links.mjs http://localhost:3115
CHROME_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" node scripts/audit-lighthouse.mjs http://localhost:3115

ADMIN_CODE=gkds1993 ADMIN_JWT_SECRET=<long text> npx next start -p 3116   # a separate server: it triggers the lock-out
node scripts/audit-security.mjs http://localhost:3116
```
