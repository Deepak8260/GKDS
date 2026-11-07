# PROMPT 03 — Home page

**Attach:** `Gopal Krushna Driving School Website.png`
**Prerequisite:** CONTEXT BLOCK pasted; prompts 01 and 02 done. Use ONLY the shared components (`Container`, `Button`, `SectionHeading`, `StatBar`, `IconTile`, `Pill`, `Stars`, `Card`, `Icon`, `WaveDivider`, `PeacockFeather`, …). Do not create duplicates or restyle shared pieces.

## Goal
Build `app/(site)/page.tsx` to match the attached design at 1440px and adapt it gracefully to tablet and mobile. Data: `getHome()`, `getSite()`, `getPublishedCourses()`, `getFeaturedReviews(3)`. Each section is its own component in `components/sections/home/` (`hero.tsx`, `trust-bar.tsx`, `about-teaser.tsx`, `why-choose.tsx`, `courses-teaser.tsx`, `journey.tsx`, `reviews-teaser.tsx`, `contact-teaser.tsx`); the page file only composes them.

## Section-by-section spec (top → bottom)

### 1. Hero (cream background, photo on the right)
- Layout: 2 columns on `lg` (text ≈ 45%, photo ≈ 55% bleeding to the right edge of the viewport), min-height ≈ 520px. Header sits above (already built).
- Left column, vertically centered:
  1. Eyebrow: a 3px × 16px orange vertical bar + uppercase bold 13px tracking-wide text `home.hero.eyebrow` ("BALESWAR'S FIRST AND TRUSTED DRIVING SCHOOL"), ink colour.
  2. H1, two lines: `titleLead` ("Learn to Drive") in dark green Playfair italic 700, `titleHighlight` ("with Confidence") orange italic on the next line; 64px desktop → 40px mobile; line-height 1.05.
  3. Paragraph `subtitle`, 17px, ink, max-width ~440px, 3 lines on desktop.
  4. Two buttons side by side (wrap on mobile): **primary** orange-gradient pill with a steering-wheel icon on the LEFT, label `primaryCta` ("Enquire Now") and a right arrow, linking to `/contact`; **secondary** white pill with 1.5px dark-green border, phone icon left, label `secondaryCta` ("Call Now"), `tel:` link to `site.phones[0]` (strip spaces).
- Right: large photo `hero.image` (school building with signboard + white WagonR with "L DRIVING TRAINING" roof sign + blue Maruti 800 parked in front, trees around). `next/image` `fill`, `priority`, `sizes="(min-width:1024px) 55vw, 100vw"`, `object-cover object-center`. The left edge of the photo fades into cream with a gradient mask (`mask-image: linear-gradient(to right, transparent, black 25%)` with `-webkit-` prefix). On mobile the photo goes BELOW the text (aspect 4/3) with the same fade at top.
- Bottom edge of the hero: decorative waves — a green swoosh rising from the bottom-left with a thin orange line riding its curve, and darker green foliage tint at the bottom-right (`WaveDivider` variant or inline SVG). Purely decorative, `aria-hidden`.

### 2. Trust bar (overlaps hero)
`StatBar` with `overlap` (negative top margin ≈ −48px on desktop so it straddles the hero bottom) and `max-w-[960px] mx-auto`: 4 items from `home.trustBar` — [award] "30+ Years" / "Experience"; [users] "Certified Trainers"; [car] "Car & Small Car" / "Training"; [shield-check] "Safe & Practical" / "Training". Orange outline icons ~32px, bold dark titles. Vertical dividers between items (desktop); 2×2 grid on mobile.

### 3. About teaser
Three-column row on `lg` (photo 28% · text 44% · stats card 28%), stacks on mobile.
- Photo: `aboutTeaser.image` (building facade with signboard) in `rounded-2xl`, aspect ≈ 16/11, soft shadow.
- Text: eyebrow with orange dash "ABOUT US" (13px uppercase), H2 "Gopal Krushna Driving Training School" (Playfair italic 700, dark green, 30px; one line wrap allowed), paragraph (`aboutTeaser.body`), a small "Read More →" text link to `/about` in orange.
- Stats card: `orange-50` rounded-2xl card with 3 rows, each: orange outline icon (calendar-days, users, star) + bold line 1 ("Since 1993", "1000+", "High Success Rate") + lighter line 2 ("Serving Baleswar", "Trained Drivers", "in Driving Tests"); thin dividers between rows.

### 4. Why Choose Us (full-width peach band)
Background `orange-50` (very light cream-peach), full bleed, `py-10`. Two parts on `lg`:
- Left (≈ 25%): eyebrow dash + "WHY CHOOSE US", H2 on two lines: "Learn Driving" (dark green italic) / "The Right Way" (orange italic) — 40px.
- Right (≈ 75%): 5 `IconTile` cards in one row (grid 5 cols on `lg`, 3 on `md`, 2 on mobile with the 5th spanning full width centered): icon (graduation-cap, road, car, shield-check, users — orange outline, 36px) above label: "Experienced & Friendly Trainers", "Real Road Training", "Well-Maintained Vehicles", "Safety First Approach", "Personalized Guidance". White cards, `rounded-xl`, `shadow-card`, centered text, min-height ≈ 110px.

### 5. Our Driving Courses teaser
- Header row: left `SectionHeading` (eyebrow "OUR DRIVING COURSES", H2 "Choose the Right Course" + orange italic "for You", subtitle "Flexible and practical driving courses designed for beginners as well as experienced learners."); right a secondary outlined orange pill "View All Courses →" linking `/courses` (moves under heading on mobile).
- Below: 2 horizontal `Card`s side-by-side (stack on mobile), generated from published courses (sorted by `order`, max 2 shown; if more exist show the first 2). Each card: car cut-out image on the LEFT (≈ 42% width, `object-contain`, white car for WagonR, blue for Maruti 800), content on the RIGHT: title (**Inter 700, 22px, dark green**, NOT italic), description (muted 15px, 2–3 lines), and a `Pill` containing the vehicle name ("WagonR" / "Maruti 800"). Entire card links to `/courses#<slug>` (use a visually-hidden label + stretched link, keep focus ring).

### 6. Learning Journey
- Header: eyebrow "OUR TRAINING COURSES" (as designed — editable text), H2 "A Simple and Practical" (dark green italic) + "Learning Journey" (orange italic), left aligned.
- Steps row (5 steps) from `home.journey.steps`: each step = circular `orange-100` icon badge (64px) with orange outline icon, bold title (Registration, Practical Training, Road Experience, Test Preparation, Get Your Licence), and a small muted two-line caption ("Join the course with basic details", "Hands-on practice with instructor", "Learn on real road conditions", "Guidance for the driving test", "Become a licensed driver"). Between steps an orange arrow (`→`, thin, 24px) connector.
- Responsive: ≤ md becomes a vertical timeline (left rail with a 2px orange-100 line, badges on the rail, text to the right, connectors hidden).

### 7. Student reviews teaser
- Header row: eyebrow "STUDENT REVIEWS", H2 "What Our Learners Say" (all dark green italic), right outlined pill "View All Reviews →" (`/reviews`).
- 3 compact `Card`s (grid 3 cols → 1 on mobile) from `getFeaturedReviews(3)`: left small circular avatar (56px; fallback to initials avatar in brand colours), right: bold name, `Stars` (orange, 16px) under the name, then the quote text in quotes (14–15px, muted, 3–4 lines clamp-4).

### 8. Contact teaser (with map)
- Peacock-feather decoration absolutely positioned at the left edge, `PeacockFeather`, desktop only.
- Left column: eyebrow "GET IN TOUCH", H2 "Contact Us" (dark green italic), paragraph `contactTeaser.body`.
- Middle column: three rows with orange outline icons (phone, map-pin, clock): all phone numbers (each a `tel:` link, one per line), the address ("Baleswar, Odisha" + landmark line "(Near ____)" from `site.address.landmark` if set), hours ("Mon – Sat: 8:00 AM – 6:00 PM" / "Sunday: Closed") built from `site.hours`.
- Right column: map card (`rounded-2xl`, shadow, 16:10): `<iframe src={site.map.embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Map showing Gopal Krushna Driving Training School">`; overlay link "View larger map" (bottom-left chip) → `site.map.directionsUrl` in a new tab.
- Below the section, a green wave with an orange line (flipped `WaveDivider`) leads into the footer, as in the design.

## Cross-cutting requirements
- All copy comes from JSON; the **only** hard-coded strings allowed are aria-labels and the "Read More"/"View All Courses →"/"View All Reviews →" button labels (put these labels in `home.json` too if you prefer — but keep them consistent).
- Scroll-reveal: each section fades up (y: 16 → 0, 250ms, once) using a tiny `Reveal` wrapper; disabled under `prefers-reduced-motion`; **do not animate the hero LCP image**.
- Metadata: `generateMetadata` uses `site.seo`; canonical `/`; OG image `site.ogImage`.
- JSON-LD: render a `DrivingSchool` (LocalBusiness) script in this page only if not already in the root layout (prompt 09 will centralise it) — for now include it here with name, address, telephone, openingHours, sameAs, foundingDate 1993.
- Heights: reserve image space (aspect ratios) so there is no CLS.
- Data-driven: if `getPublishedCourses()` returns 0 courses hide the courses block; if 0 featured reviews hide the reviews block.

## Responsive behaviour summary
1440: as design. 1024: hero text 50/50, why-choose tiles 5 across (smaller). 768: hero stacks (text then photo), about teaser 2-col (photo + text, stats card below full width), tiles 3 across. 390: single column, trust bar 2×2, journey vertical, map 4:3, buttons full-width.

## Acceptance checklist
- [ ] Side by side with the attached design the page matches: spacing, colours, heading style, orange/green accents, rounded cards, wave edges.
- [ ] Hero image is the only `priority` image; other images lazy; no CLS.
- [ ] Changing `home.json`/`courses.json`/`reviews.json` in the seed changes the page without touching components.
- [ ] No horizontal scroll at 390px; tap targets ≥ 44px; keyboard focus visible on every link/button/card.
- [ ] `npm run lint`, `typecheck`, `build` pass; Lighthouse mobile ≥ 95 in all four categories.
