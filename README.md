# Gopal Krushna Driving Training School: website and admin panel

A fast, mostly static website for a driving school in Balasore (Baleswar), Odisha (est. 1993), with an easy admin panel.

* **No database.** All text, photos and reviews are plain files in a private GitHub repository.
* **Deployed entirely on Vercel.** Saving something in the admin shows on the website within seconds, without a redeploy.
* **Call first.** There is no enquiry form: visitors phone or WhatsApp the school. Visitors can leave a review, which is published right away.

## How it fits together

```
 Browser ───────────────►  Vercel  (Next.js 16, React 19)
                              │
        public pages          │  reads content/*.json (cached, tag "content")
        /  /about  /courses   │  ───────────────────────────────►  GitHub  (private repo "gkds")
        /gallery /reviews     │                                      ├─ branch main : the code
        /contact              │  ◄───────────────────────────────    └─ branch data : content, pictures,
                              │       writes (admin + review form)         review contacts, access-code hash
 Admin  /admin  or  /malika   │
   (same panel, access code)  │  /api/media/…  ──►  pictures proxied from the private repo
                              ▼
                  if GitHub is unreachable or a file is
                  invalid, the site falls back to the
                  bundled content-seed/*.json
```

## Features

* **Public site:** Home, About, Courses, Gallery (categories + lightbox), Reviews (real statistics, public review form with optional photo), Contact (call, WhatsApp, map, live Open/Closed badge in India time).
* **SEO and speed:** structured data (DrivingSchool, ratings, opening hours), sitemap, robots, share images, security headers and CSP, accessibility checked with axe.
* **Admin panel:** access-code login (hashed, lock-out after 5 wrong tries), editors for Site Settings, Home, About, Courses, Gallery, Reviews; Media Library; Dashboard with a launch checklist; History and restore for every page; ZIP backup and restore; Help page; Ctrl/⌘-K search.
* **Images:** compressed to WebP in the browser before upload, stored with content-hash names, usage tracked so nothing in use can be deleted.

## Local development

```bash
npm install
cp .env.example .env.local      # optional: the site runs without any variables
npm run dev                     # http://localhost:3000
```

**Seed-only mode** (no variables at all): the site shows `content-seed/*.json` and the admin opens with the default code `gkds1993`, but cannot save (it says GitHub is not connected). Add the `GITHUB_*` variables to try saving against a real test repository.

Admin: `http://localhost:3000/admin` (or `/malika`).

## Environment variables

| Name | Required in production | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | yes | Fine-grained token, Contents: read and write on the repo |
| `GITHUB_OWNER` | yes | GitHub user or organisation |
| `GITHUB_REPO` | yes | Repository name (`gkds`) |
| `GITHUB_BRANCH` | yes | Content branch: `data` (never `main`) |
| `ADMIN_JWT_SECRET` | yes | Signs admin login cookies (40+ random characters) |
| `NEXT_PUBLIC_SITE_URL` | yes | Final address, `https://…`, no trailing slash |
| `REVALIDATE_SECRET` | yes | Header secret for `POST /api/revalidate` |
| `ADMIN_CODE` | recommended | First access code. Default `gkds1993` is flagged until changed |
| `ADMIN_CODE_RESET` | no | `1` = forgotten-code recovery (see `docs/DEPLOYMENT.md`, step 9) |
| `GIT_COMMIT_NAME`, `GIT_COMMIT_EMAIL` | no | Author of the admin's commits |
| `ALLOW_SEED_ONLY` | no | `1` = skip the build-time variable check |

`scripts/check-env.mjs` runs before every build: on a Vercel **production** build it stops with a readable list if a required variable is missing; elsewhere it only warns.

## Folder map

```
app/(site)/        public pages          app/admin/        admin pages (login + panel)
app/api/           admin, media, reviews and revalidate endpoints
components/        ui/ (design system), layout/, sections/<page>/, admin/ (kit + editors)
lib/               content/ (readers), validators/ (zod schemas), auth/, admin/ (pure admin logic),
                   github.ts + github-write.ts (GitHub read/write layer), image-client.ts, zip.ts
content-seed/      built-in content (the fallback, also what the first data branch is made from)
public/assets/     the only static assets (brand, photos, decor); originals in assets-source/
scripts/           push-seed.mjs (create data branch), check-env.mjs (prebuild), process-assets.mjs
tests/             unit/ (Vitest) and e2e/ (Playwright + axe)
docs/              DEPLOYMENT.md, DATA_REPO.md, ASSETS.md, QA_REPORT.md
proxy.ts           guards /admin, /malika and /api/admin; sets the admin prefix
```

## How the content works

1. Six documents: `site`, `home`, `about`, `courses`, `gallery`, `reviews`. Each has a zod schema in `lib/validators/` (the single source of truth) and a starter file in `content-seed/`.
2. `lib/content/index.ts` reads `content/<name>.json` from GitHub (cached with Next.js tags), validates it, and falls back to the seed on any problem. Pages call `getSite()`, `getCourses()`, `getPublishedReviews()` and so on.
3. The admin saves through `PUT /api/admin/content/<name>`: validate → commit to the `data` branch → refresh the cache tags.

### Adding a new editable section, end to end

Example: a "Notice banner" on the Home page.

1. **Schema:** add the fields to `lib/validators/home.ts` (for example `notice: z.object({ show: z.boolean(), text: required(160) })`).
2. **Seed:** add the same fields to `content-seed/home.json`. (A unit test fails if the seed no longer matches the schema.)
3. **Getter:** nothing to do for fields of an existing document: `getHome()` already returns them, typed.
4. **Component:** render it in a component under `components/sections/home/` and place it in `app/(site)/page.tsx`.
5. **Admin field:** add one line to `components/admin/editors/home-editor.tsx` inside a `<Section>`: `<Text path="notice.text" label="Notice text" required maxLength={160} />` (also `Area`, `Num`, `Switch`, `Img`, `Icons`, `Tags`, `List` for lists). Validation, error messages, reset-to-default, history and saving come for free.
6. **Test:** add the field to an existing Playwright editor test or a unit test for the logic.

A brand-new document (a seventh page) additionally needs: a name in `contentNames` and `contentSchemas` (`lib/validators/index.ts`), a seed file, a line in `lib/content/index.ts`, an editor page under `app/admin/(panel)/` and a nav entry in `components/admin/nav.ts`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build (runs `check-env` first) / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright + axe). Build first. `PW_CHANNEL=msedge` uses an installed Edge |
| `node scripts/push-seed.mjs [--dry-run] [--overwrite]` | Create the `data` branch and upload the starter content |
| `node scripts/process-assets.mjs` | Turn originals in `assets-source/` into optimised files in `public/assets/` |

## Documentation

* `docs/DEPLOYMENT.md`: go live on Vercel, click by click, plus troubleshooting
* `docs/DATA_REPO.md`: how the `data` branch is organised
* `docs/ASSETS.md`: where pictures come from
* `docs/QA_REPORT.md`: what was tested, with results and the known limits
