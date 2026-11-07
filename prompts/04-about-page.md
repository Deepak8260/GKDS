# PROMPT 04 — About Us page

**Attach:** `Gopal Krushna Driving School About Us.png`
**Prerequisite:** CONTEXT BLOCK pasted; prompts 01–03 done. Reuse shared components only (`PageHero`, `SectionHeading`, `StatBar`, `IconTile`, `Icon`, `PeacockFeather`, `Reveal`).

## Goal
Build `app/(site)/about/page.tsx` matching the design. Data: `getAbout()` and `getSite()`. Section components in `components/sections/about/` (`story.tsx`, `about-stats.tsx`, `mission-vision.tsx`, `values.tsx`).

## Sections (top → bottom)

### 1. Hero — `PageHero`
Breadcrumb `Home › About Us`; H1 "About Us"; subtitle "Know more about Gopal Krushna Driving Training School, our journey, values and commitment to safe driving." (orange left bar); right image = school building with the green signboard "Gopal Krushna Driving Training School" among trees (`about.hero.image`, `priority`). Wavy bottom edge with orange swoosh (already in `PageHero`).

### 2. Our Story (two columns, `lg`: 48% image / 52% text; stacked on mobile with image first)
- **Left image block**: photo of the building with the white WagonR and blue Maruti 800 in front (`about.story.image`), `rounded-2xl`, aspect ≈ 6/5. Decorative **orange outline frame offset** behind it: a 2px orange `rounded-2xl` border positioned `-translate-x-2 translate-y-2` (shifted ~10px down-left), `aria-hidden`.
- **Right text**:
  - Eyebrow: orange dash + uppercase "OUR STORY".
  - Title on two lines, Playfair italic 700 ≈ 48px: line 1 "Gopal Krushna" in dark green; line 2 "Driving Training School" in orange.
  - Paragraph 1: "Established in 1993, Gopal Krushna Driving Training School has been a trusted name in Baleswar (Baleshwar) for quality driving training. For over 30 years, we have helped over 1000 learners become confident, skilled and responsible drivers."
  - Paragraph 2: "We focus on practical, real-road training, road safety awareness and personalized guidance for every learner."
  - Paragraphs come from `about.story.paragraphs[]` (render each as `<p>`, 17px/1.7, ink).

### 3. Stat strip — `StatBar`
Four items (icons orange outline ~36px): [calendar-days] **Since 1993** / Serving Baleswar · [users] **1000+** / Trained Drivers · [star] **High Success Rate** / in Driving Tests · [car] **Experienced** / & Certified Trainers. Thin vertical dividers; full container width; stacks 2×2 on mobile.

### 4. Mission & Vision | Values (two columns with a thin vertical divider between them on `lg`; stacked on mobile)
- **Left column** — dash + H2 "Our Mission & Vision" (italic dark green, 36px). Two rows separated by a thin horizontal `line` rule: each row = 72px `orange-50` rounded-xl icon tile (target icon for Mission, eye icon for Vision, orange outline 36px) + content: bold 22px title ("Our Mission" / "Our Vision", Inter 700 dark green) and text (16px, ink):
  - Mission: "To provide safe, practical and high-quality driving training that builds confident and responsible drivers."
  - Vision: "To be the most trusted driving training school in the region, known for quality training, safety and learner success."
- **Right column** — dash + H2 "Our Values". Four rows divided by thin rules; each row = 56px `orange-50` rounded-xl icon tile + bold title (Inter 700 18px dark green) + one-line description (15px muted):
  1. [shield-check] **Safety First** — "We prioritize road safety in every step of training."
  2. [handshake] **Honest Guidance** — "Transparent, practical and learner-focused training."
  3. [users] **Personal Attention** — "Individual support for a better learning experience."
  4. [award] **Quality Training** — "A perfect blend of practical skills and road awareness."

### 5. Decorative bottom
`PeacockFeather` anchored to the bottom-left of the page content area just above the footer (desktop only), plus the footer-top wave as in the design (soft green swoosh bottom-left, orange line bottom-right) — implemented once via `WaveDivider`/decor props, not duplicated CSS.

## Requirements
- All text from `about.json` (+ `site.stats` where noted); icons by name through `Icon`.
- `generateMetadata`: title "About Us | {site.shortName}…" pattern (use a shared `buildMetadata({title, description, path, image})` helper — create it in `lib/seo.ts` now and reuse it in later pages), description from the first story paragraph (trimmed to 155 chars).
- JSON-LD `AboutPage` referencing the `DrivingSchool` entity (`foundingDate: 1993`).
- Animation: `Reveal` fade-up per section.
- Reuse: do NOT build another stat bar, heading or hero. If something is missing in the shared kit, extend the shared component (backwards compatible) and mention it.

## Responsive behaviour
≥ 1024: as designed. 768: story stacks (image first, frame offset reduced), stat strip 4 across smaller → 2×2, mission/vision and values stack with the divider turned horizontal. 390: single column; hero image placed as per `PageHero` mobile spec; text sizes per scale.

## Acceptance checklist
- [ ] Matches the design (frame offset on the photo, two-line orange/green title, stat strip, divider between the two lower columns, icon tiles).
- [ ] Every string is editable through `about.json` seed; no hard-coded copy besides aria labels.
- [ ] `buildMetadata` helper exists and is used; `AboutPage` JSON-LD valid.
- [ ] Mobile 390px has no horizontal scroll; keyboard focus visible; contrast AA.
- [ ] `lint`, `typecheck`, `build` pass.
