# CONTEXT BLOCK — read, remember and obey for the ENTIRE project

You are a senior full-stack engineer + UI engineer. You are building the website and admin panel for **Gopal Krushna Driving Training School**, Baleswar (Balasore), Odisha, India. Every later prompt refers to this block. Never contradict it; if a later prompt seems to, follow the later prompt only for that detail and keep everything else here.

## 1. Product summary
- Public website (6 pages): **Home, About Us, Courses, Gallery, Reviews, Contact**.
- Admin panel where the owner manages everything from the UI only (text, images, courses, gallery, review moderation, access code).
- **No database.** GitHub is the data source. The whole thing deploys on **Vercel** with zero extra services.
- **No contact/enquiry form.** Visitors call or WhatsApp the school. **A public "Leave a Review" form exists** (name + star rating + text); reviews go live only after admin approval.
- Brand facts: Established **1993**; "30+ years"; "1000+ trained drivers"; Govt. of Odisha **Regd. No. 10/13**; vehicles: **WagonR** (car course) and **Maruti 800** (small-car course); timings Mon–Sat 8:00 AM – 6:00 PM, Sunday closed; address "Near Baleswar Bus Stand, Baleswar, Odisha – 756001"; email gopalkrishna.driving@gmail.com; phones are placeholders `+91 9XXXXXXXXX` (two of them).

## 2. Tech stack (fixed)
Next.js (latest stable, App Router, React Server Components first), TypeScript **strict**, Tailwind CSS, `lucide-react` icons plus a few custom SVG icons, `zod`, `next/font`, `jose` (JWT), `vitest`, `@playwright/test`. No ORM, no database, no Redux, **no animation library** (all motion is CSS transitions/keyframes + IntersectionObserver, to keep the JS bundle small and Lighthouse mobile ≥ 95). Node 20+. Package manager npm. Import alias `@/*`.

## 3. Repository & data architecture (fixed)
- ONE private GitHub repo `gkds`. Branch `main` = code (Vercel production). Orphan branch `data` = data only:
```
content/site.json  home.json  about.json  courses.json  gallery.json  reviews.json
media/{branding|pages|courses|gallery|avatars}/<hash>-<name>.webp
submissions/reviews/<id>.json          (pending public reviews, one file per review)
config/admin.json                      (salted hash of admin access code; never public)
```
- Env var `GITHUB_BRANCH=data` points all reads/writes to the data branch. `vercel.json` disables deployments of the `data` branch so content edits never rebuild the site.
- `content-seed/*.json` in `main` = fallback/seed. The site must work with ONLY the seed files (no env vars).
- **Reads:** server-side GitHub REST API with a fine-grained token, `fetch` + Next cache tags (`content`, `content:<name>`) + ISR (revalidate 3600). **Writes:** only admin-authenticated Route Handlers (GitHub Contents API, sha-based optimistic concurrency), followed by `revalidateTag`.
- **Images:** the repo is private, so images are served by `app/api/media/[...path]/route.ts` (proxy with token; `Cache-Control: public, s-maxage=31536000, immutable`). Helper `mediaUrl(path)` maps stored `media/...` paths; paths starting with `/` or `http` pass through.
- **Static assets live ONLY in `public/assets/`** (Next.js serves `public/` at the site root, so files are reached at `/assets/...`): `public/assets/brand/` (logo `krishna-golden-flute.png`, favicon, Odisha seal/badge), `public/assets/photos/<vehicles|training|premises|facilities>/` (the real school photos, WebP), `public/assets/decor/` (green-saffron wave, peacock feather), `public/assets/placeholders/` (reviewer avatars + `no-image.svg` only). The photos already exist and are wired into the seed JSON — use them (see docs/ASSETS.md for which photo goes where) instead of inventing placeholders; full-size originals live in `assets-source/originals/` (not deployed). Never put images anywhere else in the repo, and always reference them as `/assets/<folder>/<file>`. Uploaded photos from the admin are NOT here — they go to the data branch (`media/`).
- **Vercel constraints:** no runtime filesystem writes; request bodies < 4.5 MB (images are compressed to WebP in the browser before upload); GitHub routes use `export const runtime = 'nodejs'`; region `bom1`.

## 4. Environment variables (names are fixed)
`GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` (=`gkds`), `GITHUB_BRANCH` (=`data`), `ADMIN_CODE` (default **`gkds1993`** in `.env.example`/`.env.local`), `ADMIN_JWT_SECRET`, `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`, optional `ADMIN_CODE_RESET`, optional `GIT_COMMIT_NAME`/`GIT_COMMIT_EMAIL`. Never expose any of these to client code except `NEXT_PUBLIC_*`. `.env*.local` is git-ignored.

## 5. Design system (single source of truth — put tokens in `tailwind.config.ts` + CSS variables in `app/globals.css`; NEVER hard-code colours/shadows/radii in components)
**Colours**
| Token | Hex | Use |
|---|---|---|
| green-950 | #082B16 | footer bottom bar / deepest |
| green-900 | #0B3D1E | footer bg, hero gradient start, headings |
| green-800 | #0F4D2A | hero gradient mid, active filter pill |
| green-700 | #166534 | check icons, links |
| green-100 | #DDEEDF | soft green tiles |
| green-50 | #F1F8F2 | soft green card backgrounds, CTA banner |
| orange-500 | #F26B0F | primary accent, highlighted heading words, buttons |
| orange-600 | #DB5A06 | button hover |
| orange-100 | #FFE6D1 | pills, icon tiles |
| orange-50 | #FFF4EA | soft peach tiles, stat cards |
| cream | #FFFAF3 | page background |
| ink | #1A1A1A | body text |
| muted | #5B5B5B | secondary text |
| line | #EADFD0 | borders/dividers |
Gradients: `brand-orange` = linear 90° #FF8A2A → #F26B0F; `hero-green` = linear 100° #0B3D1E 0% → #14532D 55% → transparent 100%.
**Typography:** Headings = **Playfair Display** (700, italic for section headings and brand name; upright 700 for inner-page hero titles). Body/UI = **Inter** (400/500/600/700). Load with `next/font/google`, `display: swap`, CSS vars `--font-display`, `--font-body`. Scale (desktop → mobile): hero H1 64 → 40; inner hero H1 56 → 36; section H2 40 → 28; card title 22 → 20; body 16; small 14; eyebrow 13 uppercase tracking-wide bold.
**Heading pattern (everywhere):** a short orange dash (`w-10 h-[3px] rounded bg-orange-500`) sits before/above the heading; heading text is dark green italic serif, and 1–3 key words are wrapped in orange (e.g. "Learn to Drive *with Confidence*"). Eyebrows are small uppercase ink/green text with an orange vertical bar or dash.
**Shape language:** cards `rounded-2xl`, 1px `line` border, warm shadow `shadow-card: 0 8px 24px rgba(120,80,30,.08)`; large images `rounded-2xl`; buttons fully rounded pills; icon tiles `rounded-xl` with `orange-50` bg and orange outline icons (stroke 1.75).
**Buttons:** primary = `brand-orange` gradient, white text, 600 weight, `px-6 h-12`, trailing arrow icon, hover `orange-600` + translateY(-1px); secondary = white, 1.5px orange (or green-800) border, matching text; ghost = text only. Focus ring: 2px orange-500 with 2px offset.
**Layout:** container `max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8`; section padding `py-12 md:py-20`; grid gap 24px; breakpoints sm 640, md 768, lg 1024, xl 1280. Mobile-first.
**Inner-page hero pattern:** dark green gradient panel (~260px tall desktop, 220px mobile), breadcrumb (white, small, `Home › Page`), upright serif white H1, subtitle in white with a 3px orange bar on its left, a photo on the right (60% width, fading into the green via `hero-green` overlay), and a **wavy bottom edge**: cream page colour curves up into the green, with an orange swoosh stroke riding the wave (reusable inline SVG `WaveDivider`). Home hero is the same idea on a cream background (see prompt 03).
**Decoration:** peacock-feather image (decorative, `aria-hidden`, hidden below `md`) bottom-left above the footer on Home and About.
**Motion:** subtle fade-up on scroll (once), 150–250ms transitions, everything disabled under `prefers-reduced-motion`.

## 6. Shared component catalogue (build once in prompt 01; reuse everywhere; never duplicate)
`components/ui/`: `Container`, `Button` (variant primary|secondary|ghost, size sm|md|lg, `href` renders a link, `icon`, `iconRight`), `SectionHeading` ({eyebrow?, lead, highlight?, subtitle?, action?{label,href}, align}), `Card`, `Pill`, `Stars` ({value 0–5, half stars, size}), `Icon` ({name} → lucide or custom, whitelist, fallback), `StatBar` ({items[{icon,title,subtitle?}]}), `IconTile`, `CheckList`, `CTABanner`, `Skeleton`, `Toast` (admin), `Modal`.
`components/layout/`: `Logo`, `Header` (+`NavLink`, `CoursesDropdown`, `MobileNav`), `Footer`, `PageHero`, `WaveDivider`, `PeacockFeather`, `FloatingActions` (mobile Call + WhatsApp).
Custom icons in `components/icons/`: `SteeringWheelIcon`, `RoadIcon`, `OdishaEmblemIcon`, `PeacockFeather`.

## 7. Routes
Public: `/`, `/about`, `/courses` (cards have ids = slug for `#car-driving` anchors), `/gallery` (`?category=`), `/reviews` (`?sort=`), `/contact`, `/api/media/[...path]`, `/api/reviews/submit`, `/api/revalidate`. Admin (identical at `/admin/*` and `/malika/*` via rewrite): `/login`, dashboard, `/settings`, `/home`, `/about`, `/courses`, `/gallery`, `/media`, `/reviews`, `/security`, `/help`; APIs under `/api/admin/*`. Header nav order: **Home, About Us, Courses ▾, Gallery, Reviews, Contact**.

## 8. Canonical data model (TypeScript; implemented as zod schemas in prompt 02 — every page/admin prompt must use exactly these shapes)
```ts
type IconName = string;                       // lucide kebab-case or custom icon id
type MediaPath = string;                      // "media/gallery/ab12cd-front.webp" | "/assets/placeholders/x.jpg" | "https://..."

interface Site {
  name: string; shortName: string; tagline: string; regNo: string;      // "Govt. of Odisha Regd. No. 10/13"
  logo: MediaPath; favicon: MediaPath; ogImage: MediaPath;
  phones: string[];                           // ["+91 9XXXXXXXXX", "+91 9XXXXXXXXX"]
  whatsapp: string;                           // digits with country code, "919XXXXXXXXX"
  whatsappMessage: string;                    // prefilled text
  callCardText: string;                       // sentence on the Contact page "Call Us Directly" card
  email: string;
  address: { line1: string; line2?: string; city: string; state: string; pin: string; landmark?: string };
  hours: { label: string; value: string }[];  // [{Mon – Sat, "8:00 AM – 6:00 PM"},{Sunday,"Closed"}]
  openDays: number[]; openFrom: string; openTo: string;   // [1..6], "08:00", "18:00" (IST, used for Open/Closed badge)
  social: { youtube?: string; facebook?: string; instagram?: string };
  map: { embedUrl: string; directionsUrl: string; lat?: number; lng?: number };
  seo: { title: string; description: string; keywords?: string[] };
  stats: { sinceYear: number; yearsLabel: string; trainedDrivers: string; successRateLabel: string;
           rating: number; ratingCount: string; recommendPercent: number };
}
interface Hero { title: string; subtitle: string; image: MediaPath; imageAlt: string }
interface Feature { icon: IconName; title: string; text?: string }
interface Home { hero: { eyebrow: string; titleLead: string; titleHighlight: string; subtitle: string; image: MediaPath; imageAlt: string; primaryCta: string; secondaryCta: string };
  trustBar: Feature[];
  aboutTeaser: { eyebrow: string; title: string; body: string; image: MediaPath; imageAlt: string; stats: {icon: IconName; title: string; subtitle: string}[] };
  whyChoose: { eyebrow: string; lead: string; highlight: string; items: Feature[] };
  coursesIntro: { eyebrow: string; lead: string; highlight: string; subtitle: string };
  journey: { eyebrow: string; lead: string; highlight: string; steps: Feature[] };
  reviewsIntro: { eyebrow: string; title: string };
  contactTeaser: { eyebrow: string; title: string; body: string } }
interface About { hero: Hero;
  story: { eyebrow: string; titleLead: string; titleHighlight: string; paragraphs: string[]; image: MediaPath; imageAlt: string };
  stats: {icon: IconName; title: string; subtitle: string}[];
  mission: { title: string; text: string }; vision: { title: string; text: string };
  valuesTitle: string; missionVisionTitle: string; values: Feature[] }
interface Course { id: string; slug: string; title: string; description: string; vehicle: string; image: MediaPath; imageAlt: string; features: string[]; order: number; published: boolean }
interface Courses { hero: Hero; intro: { lead: string; highlight: string; subtitle: string }; courses: Course[];
  includedTitle: string; included: Feature[];
  highlights: { lead: string; highlight: string; image: MediaPath; imageAlt: string; items: string[] };
  cta: { lead: string; highlight: string; text: string } }
interface GalleryCategory { id: string; label: string; icon: IconName }
interface GalleryItem { id: string; src: MediaPath; alt: string; category: string; order: number; published: boolean; createdAt: string }
interface Gallery { hero: Hero; titleLead: string; titleHighlight: string; categories: GalleryCategory[]; items: GalleryItem[] }
interface Review { id: string; name: string; rating: number /*1–5, halves allowed*/; text: string; avatar?: MediaPath; date: string /*ISO*/; published: boolean; featured: boolean }
interface Reviews { hero: Hero; titleLead: string; titleHighlight?: string; summaryMode: 'auto' | 'manual'; acceptSubmissions: boolean /*default true*/; ctaTitleLead: string; ctaTitleHighlight: string; ctaText: string; items: Review[] }
interface PendingReview { id: string; name: string; rating: number; text: string; submittedAt: string; status: 'pending' }
```

## 9. Engineering rules
1. Server Components by default; client components only for interaction (mobile nav, gallery filter/lightbox, review sort/modal, open-now badge, admin forms).
2. **Zero hard-coded business data in components.** Phones, address, hours, social links, copy, images always come from the content layer (`getSite()`, `getHome()`, ...), with seed fallback.
3. Every `next/image` has meaningful `alt`, correct `sizes`, `priority` only for the LCP image. Prefer WebP/AVIF.
4. Accessibility: semantic landmarks, skip link, visible focus, 44px touch targets, `aria-current="page"`, AA contrast, keyboard operable menus/modals/lightbox, `aria-live` for async status.
5. Performance: pages static + ISR; dynamic-import heavy client pieces (lightbox, review modal); no unused deps; no layout shift.
6. Forms/APIs: validate with the shared zod schemas on client AND server; sanitise text; rate-limit public POSTs (best effort); never leak internals in errors.
7. Code style: strict TS, no `any`, small components, named exports, file names kebab-case, one component per file, colocate section components under `components/sections/<page>/`.
8. Do not invent content: use only the copy given in the prompts/designs; anything unknown becomes an editable placeholder in seed JSON.
9. After each prompt: `npm run lint`, `npx tsc --noEmit`, `npm run build` must pass, and you must state what you verified.
10. If you must deviate from a prompt, say so explicitly at the end and explain why.
