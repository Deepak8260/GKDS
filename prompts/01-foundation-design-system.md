# PROMPT 01 — Foundation, design system, layout shell

**Attach:** any one of the six design images (they all share the same header/footer).
**Prerequisite:** the CONTEXT BLOCK (`00-context-block.md`) has been pasted.

## Goal
Scaffold the project and build everything shared by all pages: tokens, fonts, the UI kit, the header (with Courses dropdown and mobile menu), footer, inner-page hero, decorative pieces, floating mobile actions, error/404/loading pages and a temporary `/styleguide`. No page content yet (except placeholders).

## 1. Scaffold
- `create-next-app` equivalent: Next.js latest stable, TypeScript, Tailwind, ESLint, App Router, no `src/` folder, alias `@/*`.
- Add: `lucide-react`, `framer-motion`, `zod`, `clsx`, `tailwind-merge`, `jose`, `vitest`, `@playwright/test`, `prettier` (+ `prettier-plugin-tailwindcss`).
- Scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (vitest), `test:e2e` (playwright).
- Create `.env.example` containing every variable from CONTEXT BLOCK §4 with `GITHUB_REPO=gkds`, `GITHUB_BRANCH=data`, `ADMIN_CODE=gkds1993`, others empty. Create `.env.local` identical (not committed). `.gitignore` must contain `.env*.local`.
- Folders exactly as: `app/(site)/`, `app/admin/`, `app/api/`, `components/ui|layout|sections|icons|admin`, `lib/`, `content-seed/`, `public/assets/brand/`, `public/assets/placeholders/`, `docs/`, `scripts/`.
- `app/layout.tsx`: loads fonts, sets `<html lang="en-IN">`, `metadataBase`, base metadata, body class `bg-cream text-ink antialiased`.

## 2. Tokens
Implement every token in CONTEXT BLOCK §5 in `tailwind.config.ts` (colours, fontFamily, boxShadow `card`, borderRadius, backgroundImage `brand-orange` & `hero-green`) AND as CSS variables in `globals.css` (`--color-green-900`, etc.). Add utilities: `.container-x` (the container rule), `.section-y`, `.focus-ring`, `.text-balance`. Smooth scrolling with `scroll-padding-top: 96px` (sticky header) and `prefers-reduced-motion` override. Selection colour orange-100.

## 3. UI kit (`components/ui`) — specs
- **Container**: the container rule; `as` prop.
- **Button**: variants primary/secondary/ghost; sizes sm (h-10), md (h-12), lg (h-14); props `href` (renders `next/link`, or `<a>` for `tel:`/`mailto:`/external with `rel="noopener noreferrer"`), `icon` (left), `iconRight` (right, default arrow for primary when `arrow` true), `loading` state with spinner, disabled state. Pill radius, 600 weight.
- **SectionHeading**: renders optional eyebrow (orange dash + uppercase 13px tracking-wide ink text), the `h2` (`lead` in dark green italic serif + `highlight` in orange; both inline so wrapping looks natural), optional subtitle paragraph (muted, max-w-xl), and optional right-aligned `action` rendered as a secondary pill button with arrow (stacks under the heading on mobile). Props `as` (h1/h2/h3), `size` (md 40px, lg 48px, sm 28px), `dash` position (`before` inline for page titles like "— Our Driving Courses", `above` for eyebrow style).
- **Card**: white (or `tone` cream/green-soft/orange-soft), rounded-2xl, border `line`, `shadow-card`, optional `hover` lift.
- **Pill**: small rounded-full label (`orange-100` bg, dark orange-700 text, semi-bold) — used for "WagonR", "Vehicle: Maruti 800".
- **Stars**: SVG stars in orange-500, supports `value` 0–5 with half star (use clipPath), `size`, and `aria-label="4.5 out of 5 stars"` on the wrapper (stars themselves `aria-hidden`).
- **Icon**: `Icon({name,size,className})` maps a name string to a lucide icon via an explicit whitelist object (export the whitelist for the admin IconPicker) and to custom icons (`steering-wheel`, `road`, `odisha-emblem`); unknown name → `HelpCircle` fallback + dev console warning. Whitelist must include at least: award, users, car, shield-check, graduation-cap, route, calendar-days, star, clipboard-list, badge-check, id-card, target, eye, handshake, phone, mail, map-pin, clock, thumbs-up, headphones, file-text, check-circle-2, message-circle-heart, sparkles, wrench, fuel, gauge, user-check, trophy, heart-handshake, shield, car-front, steering-wheel, road, traffic-cone, building-2, layout-grid, message-circle, camera, copy, arrow-right, chevron-down, menu, x, check, search, quote.
- **StatBar**: white rounded-2xl card, soft shadow, horizontal flex of items; each item = orange outline icon (32px) + bold title + optional lighter subtitle (two lines: e.g. "30+ Years" / "Experience"); thin vertical divider (`line` colour, 1px, h-10) between items from `md` up; on mobile a 2-column grid with horizontal dividers; `overlap` prop adds negative top margin (used on Home to overlap the hero).
- **IconTile**: white rounded-xl card, centered or left icon (orange outline) + label (semi-bold, 2 lines max); variants `vertical` (icon above label, used for Why Choose Us / What's Included) and `horizontal` (icon left).
- **CheckList**: list of items with a filled green-700 circle containing a white check; item text ink 16px; `gap-3`; `columns` prop.
- **CTABanner**: full-width rounded-2xl `green-50` banner with a faint road illustration (inline SVG, opacity-20) on the right edge, a small green car icon (or custom illustration) at left, title (`lead` italic serif dark green + `highlight` orange), supporting text, and a right-aligned primary button. Mobile: stacked, centered.
- **Modal**: accessible dialog (focus trap, ESC, overlay click, scroll lock, returns focus, `aria-modal`), used by reviews and admin.
- **Skeleton**, **Toast** (small context + hook `useToast`), **Badge** for admin counts.

## 4. Layout components — exact specs
**Logo**: image `public/assets/brand/logo.svg` (create a simple placeholder circular emblem SVG; the real one replaces it: yellow circle, Krishna with flute, peacock feather) + vertical 1px divider + two text lines: "Gopal Krushna" (Playfair italic 700, dark green, 28px desktop/22px mobile) and "Driving Training School" (Playfair italic 600, orange-500, 15px/12px). Props `variant: 'light' | 'dark'` (footer uses white text for line 1 and light cream for line 2).

**Header** (server component shell + small client parts): sticky top-0, z-50, white background, height 72px desktop / 64px mobile, bottom border `line`; adds `shadow-card` after scroll (tiny client hook). Layout: Logo (left) · nav (center/right) · Regd. badge (far right).
- Nav links in this order: **Home** (`/`), **About Us** (`/about`), **Courses** (`/courses`, with chevron-down and dropdown), **Gallery** (`/gallery`), **Reviews** (`/reviews`), **Contact** (`/contact`). Inter 500, 16px, dark-green/ink; hover → orange; **active** = orange text + 3px orange rounded underline offset 6px below the label (the designs show exactly this).
- **CoursesDropdown**: hover (desktop pointer) and click/Enter/Space/Arrow-Down open a white rounded-xl panel with shadow listing every published course from `getCourses()` (title, links to `/courses#<slug>`) plus a final "All Courses" link; Esc closes, arrow keys navigate, closes on outside click, `aria-expanded`, `aria-haspopup="menu"`. The parent "Courses" link itself still navigates to `/courses`.
- **Regd. badge**: rounded-xl pill/card with `orange-50` background and soft shadow, containing `OdishaEmblemIcon` (red/orange government-style emblem) and two lines of bold 13px text: "Govt. of Odisha" / "Regd. No. 10/13" (split from `site.regNo`). Hidden below `lg`; on mobile it appears inside the mobile menu and in the footer.
- **MobileNav** (below `lg`): hamburger button → slide-over from right (width min(88vw, 360px)), dark overlay, focus trap, ESC, body scroll lock, large tap targets, links stacked, Courses expands inline as an accordion of its sub-links, bottom area with Call Now (`tel:`) + WhatsApp buttons and the Regd. badge. Animated with framer-motion (instant under reduced motion).

**Footer**: background `green-900` (bottom copyright bar slightly darker `green-950` or separated by a 1px `white/15` line). Row 1 (desktop): Logo (dark variant) · vertical divider · nav links centred (Home, About Us, Courses, Gallery, Reviews, Contact; white, Inter 500; **active page orange**) · vertical divider · social icons (YouTube, Facebook, Instagram — white lucide/brand SVGs, 24px, in 40px circles on hover orange). Row 2: thin divider, then left "© 2026 Gopal Krushna Driving Training School. All Rights Reserved." (year computed from current year via `new Date().getFullYear()` but seed text from site.name) and right "Govt. of Odisha Regd. No. 10/13". Mobile: everything stacked and centered, links wrap in 2–3 columns. Social links come from `site.social`; hide any that are empty.

**PageHero** (props: `title`, `subtitle`, `breadcrumb: {label, href?}[]`, `image`, `imageAlt`, `imagePosition`): per CONTEXT BLOCK §5 pattern. Details: outer `relative overflow-hidden`; background `hero-green`; left content column (max-w ~540px) vertically centered: breadcrumb (white/80, 14px, chevron separators, current page white), `h1` (white, Playfair 700 upright, 56/36px), subtitle (white, 17px, max-w-md) with a 3px `orange-500` left border and `pl-4`. Right: the photo `object-cover` occupying right ~62% (on mobile it sits behind the text at ~35% opacity or as a top banner of 160px — choose a design that keeps the text readable), with a left-to-right gradient mask blending into the green. Bottom: `WaveDivider` overlapping the hero bottom edge (cream wave rising in front of green, orange swoosh line running along the curve from left to right, a second thin green wave at left). Hero image has `priority`. Min height 260px desktop / 220px mobile.

**WaveDivider**: inline SVG component, `preserveAspectRatio="none"`, props `flip`, `className`; fills `cream`, orange stroke path (stroke-width 6, rounded caps, gradient fade at ends).

**PeacockFeather**: decorative SVG/PNG (create an SVG placeholder illustration: teal/blue eye with green barbs), absolutely positioned bottom-left, `aria-hidden`, `hidden md:block`.

**FloatingActions** (mobile only, `md:hidden`): fixed bottom-right stack of two 52px round buttons — green "Call" (`tel:` first phone) and WhatsApp-green (wa.me link from `site.whatsapp` + `site.whatsappMessage`); respect safe-area inset; do not cover the footer text (add bottom padding to body on mobile).

## 5. Site layout & shared pages
- `app/(site)/layout.tsx`: skip-link ("Skip to content" → `#main`), `<Header/>`, `<main id="main">`, `<Footer/>`, `<FloatingActions/>`.
- Header/Footer data come from `getSite()` and `getCourses()` from `lib/content` — for now create `lib/content/index.ts` with stubs reading `content-seed/site.json` and `content-seed/courses.json` (replaced by the real GitHub layer in prompt 02). Create those two seed files now using the facts in CONTEXT BLOCK §1 (phones `+91 9XXXXXXXXX`, etc.) and two courses (Car Driving Course / WagonR, Small Car Driving Course / Maruti 800) with placeholder images.
- `not-found.tsx` (friendly "Page not found" with Home + Call buttons), `error.tsx` (client, with Retry), `loading.tsx` (brand skeleton).
- Placeholder images in `public/assets/placeholders/` (SVG gradients/illustrations named: `hero-building.svg`, `car-wagonr.svg`, `car-maruti800.svg`, `training.svg`, `classroom.svg`, `avatar-1..6.svg`, `peacock.svg`, `road.svg`). Make them look intentional (brand-coloured), not blank.
- Temporary `app/(site)/styleguide/page.tsx` (`robots: noindex`) rendering every UI/layout component with sample props, so I can visually check the system. It will be removed/blocked in prompt 09.

## 6. Quality rules for this prompt
Responsive checks at 1440, 1024, 768, 390 px. No horizontal scroll. All interactive elements keyboard reachable. Header height constant (no layout jump on scroll). Use `next/link` and `next/image` everywhere appropriate.

## Acceptance checklist
- [ ] `npm run lint`, `npm run typecheck`, `npm run build` pass.
- [ ] Header matches the designs (logo block, nav order, orange active underline, Regd. badge) at 1440px and collapses cleanly to the mobile menu at < 1024px.
- [ ] Courses dropdown works by mouse and keyboard; sub-links use `#slug` anchors.
- [ ] Footer matches the designs (green, links, active orange, social icons, copyright left / Regd. right).
- [ ] `PageHero` renders the green gradient, breadcrumb, orange-barred subtitle, right image and wavy orange-swoosh edge.
- [ ] `/styleguide` shows every component; tokens are used, no hard-coded hex values in components (`grep` to confirm).
- [ ] No business data hard-coded in components.
