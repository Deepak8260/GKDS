# PROMPT 09 — SEO, performance, accessibility, resilience (public site complete)

**Attach:** nothing.
**Prerequisite:** CONTEXT BLOCK pasted; prompts 01–08 done (all six public pages exist).

## Goal
Harden and polish the whole public site so it is fast, accessible, discoverable, secure and robust. Do an audit pass over EVERY page and fix what you find. Report what you changed.

## 1. SEO
- `lib/seo.ts`: central `buildMetadata({title, description, path, image?, noindex?})` already exists — ensure every page uses it; title template `%s | Gopal Krushna Driving Training School`; home uses the long title from `site.seo.title`.
- `app/sitemap.ts` listing `/`, `/about`, `/courses`, `/gallery`, `/reviews`, `/contact` (with `lastModified`), absolute URLs from `NEXT_PUBLIC_SITE_URL`. `app/robots.ts`: allow `/`, disallow `/admin`, `/malika`, `/api`, `/styleguide`; include sitemap URL.
- Canonical URLs, Open Graph + Twitter cards. Generate a branded `opengraph-image.tsx` (1200×630: dark green background, "Gopal Krushna Driving Training School", orange "Learn to Drive with Confidence", Regd. line) used when `site.ogImage` is empty.
- **Centralised JSON-LD** component `JsonLd` and one global `DrivingSchool` (schema.org `DrivingSchool`/`LocalBusiness`) entity in the root layout: name, url, logo, image, telephone[], email, address (PostalAddress: Baleswar, Odisha, IN, 756001), openingHoursSpecification (from `site.hours/openDays`), foundingDate 1993, areaServed, sameAs (social links), `aggregateRating` (from stats). Remove duplicate/inline LocalBusiness scripts from pages; page-level scripts reference it by `@id`.
- `lang="en-IN"`, `<meta name="theme-color" content="#0B3D1E">`, favicon set from `site.favicon` with a static fallback (`app/icon.svg`, `apple-icon.png` placeholder), web manifest (`app/manifest.ts`) with name, short name, colours.
- Block `/styleguide` (return 404 in production or delete it).
- Internal links use `next/link`; breadcrumbs structured data (`BreadcrumbList`) on inner pages.

## 2. Performance
- Audit every `next/image`: correct `sizes`, only the LCP image has `priority`, modern formats on (`images.formats: ['image/avif','image/webp']`), sensible `deviceSizes`, `minimumCacheTTL` high for `/api/media` and placeholders.
- Dynamic imports: lightbox, review modal (framer-motion was already removed in prompt 03; keep it out). Remove unused dependencies; check bundle with `@next/bundle-analyzer` (dev only) and keep first-load JS per page < 130 kB gzip.
- Fonts: subsets `latin`, only needed weights, `display: swap`, preloaded; no layout shift from fonts (`adjustFontFallback`).
- Confirm in the `next build` output that all six pages are **static/ISR** (○ or ●), none accidentally dynamic (look for `cookies()/headers()` usage in public routes and remove it).
- Headers in `next.config` (`headers()`): long immutable cache for `/_next/static` and `/placeholders`, `/brand`; sensible `stale-while-revalidate` for HTML handled by ISR.
- Add `@vercel/analytics` and `@vercel/speed-insights` (loaded only in production).
- Set `experimental.optimizePackageImports: ['lucide-react']` where supported.

## 3. Accessibility (WCAG 2.2 AA)
- Skip link, landmarks (`header`, `nav aria-label="Primary"`, `main`, `footer`), one `h1` per page, logical heading order.
- Colour contrast: verify orange-500 (#F26B0F) text on white/cream for **body-size text** (it is borderline; if < 4.5:1 for small text, use `orange-600` for small orange text and keep `orange-500` for large headings ≥ 24px and for fills). Update the token usage centrally, not per component.
- Visible focus rings everywhere; `:focus-visible` only; 44×44px minimum targets; `aria-current="page"` on active nav; all icons decorative unless labelled; reduced-motion honoured; form controls labelled (review modal); modals trap focus; dropdown/menus keyboard operable; zoom to 200% with no loss of content.
- Run `axe` via Playwright (`@axe-core/playwright`) on all six pages at desktop and mobile viewports; zero serious/critical violations.

## 4. Resilience & security
- Image fallback: a small `SafeImage` wrapper that swaps to a placeholder on `onError` (client) — use it for gallery/review avatars/course images.
- Route-level `error.tsx`/`not-found.tsx` verified; a global `app/global-error.tsx`.
- Security headers via `next.config` `headers()`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN` (or CSP `frame-ancestors 'self'`), `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security` (Vercel adds HSTS on custom domains, still set), and a conservative **CSP** allowing: self, `https://www.google.com` (maps iframe `frame-src`), `https://va.vercel-scripts.com` and `https://vitals.vercel-insights.com` (analytics), `img-src 'self' data: blob:`, `style-src 'self' 'unsafe-inline'`, `font-src 'self'` (next/font self-hosts). Test that the map, analytics and images still work.
- Verify no secrets are bundled to the client (`grep` `.next/static` for `GITHUB_TOKEN`, `ghp_`, `github_pat_`).
- Review the public POST route (`/api/reviews/submit`) once more for abuse: size limits, origin check, rate limit, sanitisation.

## 5. Tests & CI
- Playwright smoke tests (`tests/e2e/`): each page loads (200, title, one h1), header nav works incl. Courses dropdown anchors, Gallery filter & lightbox open/close, Reviews sort + modal validation, Contact shows `tel:` links and no `<form>`, 404 page, sitemap/robots content.
- Vitest unit tests keep passing.
- `.github/workflows/ci.yml`: on push/PR to `main`: `npm ci`, lint, typecheck, vitest, build (with no env vars → seed mode), Playwright against `next start`. Cache npm. (The `data` branch must be excluded from CI: `branches: [main]`.)

## Acceptance checklist
- [ ] Lighthouse (mobile) ≥ 95 on Performance, Accessibility, Best Practices, SEO for all six pages (paste the scores in your report).
- [ ] `sitemap.xml`, `robots.txt`, manifest, OG image and JSON-LD validate (no errors in Rich Results/Schema validators logic — at least `JSON.parse`-valid and schema-correct fields).
- [ ] axe: 0 serious/critical issues; keyboard-only walkthrough of nav, dropdown, gallery lightbox and review modal passes.
- [ ] Build output shows all public pages static/ISR; first-load JS budget met.
- [ ] CSP/headers active without breaking maps/analytics/images.
- [ ] CI workflow green locally (`act` or by running the same commands).
