# PROMPT 06 — Gallery page (filters + lightbox)

**Attach:** `Driving School Gallery Showcase.png`
**Prerequisite:** CONTEXT BLOCK pasted; prompts 01–05 done. Reuse shared components.

## Goal
Build `app/(site)/gallery/page.tsx` from `getGallery()` (published items, sorted by `order`). Server component for data + hero; one client component `components/sections/gallery/gallery-client.tsx` for filtering, grid and lightbox. Extra files: `lightbox.tsx` (dynamic import), `filter-pills.tsx`.

## Sections

### 1. Hero — `PageHero`
Breadcrumb `Home › Gallery`; H1 "Gallery"; subtitle "A glimpse of our training vehicles, premises and practical driving sessions."; right image = school building with green signboard among trees.

### 2. Heading + filter pills (one row on `lg`, wraps below on smaller)
- Left: dash + H2 "**Photo** *Gallery*" ("Photo" dark green italic, "Gallery" orange italic, 44px).
- Right: filter pills in a row (scrollable horizontally on mobile with snap, no visible scrollbar, edge fade): **All Photos** (always first; icon: layout-grid), then one pill per `gallery.categories` — in the design: **Our Vehicles** (car icon), **Training** (traffic-cone icon), **Our Premises** (building-2 icon), **Facilities** (users icon).
  - Pill style: height 44px, `rounded-full`, px-4, Inter 600 15px, icon 18px. **Active** = solid `green-800` background, white text/icon. **Inactive** = white background, 1px `line` border, subtle shadow, dark-green text, **orange icon**. Hover: orange border. Each is a `<button type="button" aria-pressed>` inside a `role="group" aria-label="Filter photos by category"`.
- State is synced to the URL (`?category=training`) with `history.replaceState`/`useSearchParams`; initial render reads it (so shared links open filtered; unknown value → All). No full refetch — items are already on the page.

### 3. Photo grid
- 3 columns on `lg`, 2 on `sm/md`, 1 on `<sm` (2 columns at ≥ 480px is fine). Gap 24px (16px mobile). All tiles uniform **4:3** (design shows slightly varied heights — use uniform 4:3 for robustness), `rounded-2xl`, overflow hidden, 1px `line` border, `shadow-card`.
- Tile = `<button>` (opens lightbox) containing a `next/image` (`fill`, `object-cover`, `sizes="(min-width:1024px) 380px, (min-width:640px) 50vw, 100vw"`, `placeholder="blur"` with a generated tiny blurDataURL or a neutral colour fallback). Hover/focus: image scale 1.05 (300ms), dark gradient from the bottom, caption (`alt`) at the bottom-left in white 14px, expand icon top-right in a translucent circle. Touch devices: caption always hidden, only tap to open.
- First 6 images `loading="eager"`/priority (first 3 priority only), rest lazy.
- Grid layout animation on filter change: items fade/scale with a CSS transition/keyframe on the changed tiles (≤ 250ms, disabled under reduced motion; no animation library).
- **Load more**: render 12 at first (grid of 9 in the seed shows all); a "Load more photos" secondary button reveals 12 more; announce "Showing X of Y photos" in an `aria-live="polite"` region. Count text also visible near the grid ("Showing 9 photos").
- **Empty state** for a category with no photos: card with camera icon, "No photos in this category yet." and a "View all photos" button.

### 4. Lightbox (build in-house, no library) — `lightbox.tsx`
- Opens when a tile is clicked; full-screen dark overlay (`black/90`), image `object-contain` max 90vw × 80vh, `next/image` with `sizes="100vw"` (non-priority), caption + counter ("3 / 9") below; close button (top-right, 44px), prev/next buttons (left/right, 44px, hidden if only one image), keyboard: `Esc` close, `←/→` navigate, `Home/End` first/last; touch: swipe left/right (pointer events, threshold 50px) and tap overlay to close; focus trapped inside, initial focus on close button, focus returns to the originating tile on close; `role="dialog" aria-modal="true" aria-label="Photo viewer"`; body scroll locked; preloads the previous and next image; navigation scoped to the currently filtered list. Respect reduced motion (no zoom animation).
- Imported with `next/dynamic` (`ssr:false`) only after the first click.

### 5. Footer area
Nothing extra (the standard footer). Optionally a muted line under the grid: "Want to see our vehicles and premises in person? Call us to visit." with a Call button (text editable? — keep as hard-coded aria-less microcopy ONLY if added to `gallery.json` as `footerNote`; otherwise omit).

## Data details
- Category assignment for the seed (see prompt 02): vehicles = WagonR, Maruti 800, dashboard; training = cones circle, cone lane; premises = building signboard; facilities = classroom ×2, reception desk.
- Items with `published:false` are excluded. Sort by `order` ascending.
- Image path through `mediaUrl()`.

## Requirements
- Works with 100+ images smoothly (virtualization not required; pagination handles it).
- No CLS: tiles have fixed aspect ratio.
- `generateMetadata` via `buildMetadata` ("Photo Gallery | …"); JSON-LD `ImageGallery` (first 12 images).
- Accessibility: pills have `aria-pressed`; tiles have accessible names ("Open photo: {alt}"); lightbox fully keyboard operable; `alt` always meaningful.

## Acceptance checklist
- [ ] Matches the design: pills (active dark-green, inactive white with orange icons), rounded tiles, hover effect, 3-column layout.
- [ ] Filtering is instant, URL-synced, and shareable; refresh keeps the filter.
- [ ] Lightbox: open/close/prev/next with mouse, keyboard and swipe; focus trap and focus restore verified.
- [ ] Empty category state and Load more work (test with 30 duplicated seed items).
- [ ] Lighthouse mobile ≥ 95; `lint`, `typecheck`, `build` pass.
