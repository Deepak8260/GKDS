# PROMPT 05 — Courses page

**Attach:** `Gopal Krushna Driving Courses Page.png`
**Prerequisite:** CONTEXT BLOCK pasted; prompts 01–04 done. Reuse shared components; keep `buildMetadata` from prompt 04.

## Goal
Build `app/(site)/courses/page.tsx` from `getCourses()` (published courses only, sorted by `order`) and `getSite()`. Components in `components/sections/courses/` (`course-card.tsx`, `included.tsx`, `highlights.tsx`).

## Sections

### 1. Hero — `PageHero`
Breadcrumb `Home › Courses`; H1 "Our Courses"; subtitle "Practical, step-by-step driving training for beginners and experienced learners."; right image = white WagonR and blue Maruti 800 parked on the practice ground with orange traffic cones and trees (`courses.hero.image`).

### 2. "Our Driving Courses" grid
- Heading (dash-before style): "— **Our Driving** *Courses*": "Our Driving" in dark green italic, "Courses" in orange italic, 44px; subtitle underneath "Choose the right course based on your learning needs and vehicle preference." (17px ink).
- **Grid**: 2 columns on `lg` (1 on mobile), gap 24px, auto-adjusts if the admin later adds/removes courses (1 course → full-width card; 3 → 2+1 centered; use CSS grid with `auto-fit`-like behaviour via Tailwind classes depending on count).
- **CourseCard** (`id={course.slug}`, `scroll-mt-28` so the sticky header never covers it): large `rounded-2xl` card with a soft green gradient background (`green-50` → white), 1px `line` border, `shadow-card`. Two-part layout: **left ≈ 42%** car cut-out image (`object-contain`, drop shadow under the car, `sizes="(min-width:1024px) 22vw, 60vw"`); **right**: title (Inter 700 26px dark green), description (16px ink), a `Pill` reading "Vehicle: {vehicle}" (peach `orange-100`, bold), then a `CheckList` of `course.features` (green check circles, 16px). Footer line inside card: text link "Call to enrol" with phone icon → `tel:` first phone (small, orange, underline on hover).
  - WagonR card text: "Learn to drive a car with step-by-step practical training on real roads." bullets Beginner Friendly / Real Road Training / Licence Test Guidance.
  - Maruti 800 card text: "Build your driving skills with focused and affordable training." bullets Ideal for First-Time Learners / Hands-on Practice / Licence Test Guidance.
  - The Header dropdown links (`/courses#car-driving`, `/courses#small-car-driving`) must land with the matching card visible and a brief highlight ring (CSS `:target` outline orange 2px with fade out) — implement with `:target` CSS, no JS.

### 3. "What's Included in the Training?"
Heading with dash: "What's Included in the Training?" (italic dark green 34px; whole heading dark green, apostrophe typographic). Row of 5 `IconTile` (horizontal variant: orange outline icon left, label right in Inter 600 two lines) in white rounded-xl cards: [steering-wheel] "Vehicle Practice", [road] "Real Road Training", [shield-check] "Road Safety & Traffic Rules", [file-text] "Licence Test Preparation", [headphones] "Personal Guidance". Grid 5 cols on `xl`, 3 on `md`, 2 on mobile (last item spans/centers).

### 4. Training Highlights (two columns)
- Left (≈ 52%): photo of a young learner driving with the instructor beside him giving guidance (`highlights.image`), `rounded-2xl`, with an **orange 2px outline frame** (inset border) like the About page frame; aspect ≈ 16/10.
- Right: dash + H2 "**Training** *Highlights*" ("Training" dark green italic, "Highlights" orange italic, 40px) and a `CheckList` (green check circles, 17px, generous spacing) of: "Experienced and certified trainers", "Step-by-step, practical learning approach", "Training on both city and highway roads", "Focus on safe and responsible driving", "Complete guidance for driving licence (DL)".

### 5. CTA banner — `CTABanner`
Light-green banner: small green car icon at left; title "Ready to Start Your" (dark green italic) + "Driving Journey?" (orange italic); text "Enroll today and learn to drive with confidence at Gopal Krushna Driving Training School."; right side: primary button **"Call Now"** (phone icon, `tel:` first number) and a secondary text link "Visit Contact Page →" (`/contact`); faint road illustration on the far right. (The design shows "Enquire Now" — there is no enquiry form in this project, so the action is calling.)

## Requirements
- Content entirely from `courses.json`; adding a third course in the seed JSON must render a third card, update the header dropdown (already data-driven), and the Home teaser without code changes.
- Anchors: each `CourseCard` has `id=slug`; slugs validated URL-safe in the schema.
- `generateMetadata` via `buildMetadata` ("Driving Courses in Baleswar | …").
- JSON-LD: `ItemList` of `Course` items (name, description, provider = the school) — keep it simple and valid.
- Images: each course image has `imageAlt`; use `sizes`; first card image may be `priority` only if above the fold on mobile (otherwise lazy).
- `Reveal` fade-up per block (not on hero).
- Empty state: if no published courses, show a friendly "Courses will be updated soon — call us for details" card with a Call button.

## Responsive behaviour
≥ 1024: 2 cards per row; 768: 1 card per row, image above content at 60% width; 390: image on top full-width (max-h 220px), content below, tiles 2-col, highlights photo above list.

## Acceptance checklist
- [ ] Visually matches the design (soft-green course cards, vehicle pill, check bullets, included tiles, highlights photo with orange frame, CTA banner).
- [ ] `/courses#car-driving` and `/courses#small-car-driving` scroll to the right card without being hidden by the sticky header and show the `:target` highlight.
- [ ] Add a third course to the seed → third card appears, header dropdown lists it, Home teaser still shows 2.
- [ ] No hard-coded copy except aria labels and the "Call to enrol"/"Call Now"/"Visit Contact Page" labels.
- [ ] `lint`, `typecheck`, `build` pass; responsive checks done.
