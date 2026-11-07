# PROMPT 08 — Contact page (call-first, NO form)

**Attach:** `Gopal Krushna Driving School Contact Page.png`
**Prerequisite:** CONTEXT BLOCK pasted; prompts 01–07 done. Reuse shared components.

## Important change vs the design
The design has a "Send Us a Message" form. **Do NOT build any form, `/api/enquiry` route, email integration, or enquiry storage.** Replace the form card with a **"Call Us Directly"** card (spec below). Everything else follows the design.

## Goal
Build `app/(site)/contact/page.tsx` from `getSite()`. The page is fully static/ISR. Components in `components/sections/contact/`: `contact-tiles.tsx`, `map-card.tsx`, `call-card.tsx` (client, for the Open/Closed badge + copy button), `whatsapp-tile.tsx`, `why-strip.tsx`.

## Sections

### 1. Hero — `PageHero`
Breadcrumb `Home › Contact`; H1 "Contact Us"; subtitle "Have a question or need assistance? We're here to help you!"; right image = white WagonR in front of the school building.

### 2. Two-column body (`lg`: left ≈ 52%, right ≈ 44%; stacked on mobile, left content first)

**Left column**
- Dash + H2 "Get In Touch" (italic dark green, 36px) and paragraph: "We would love to hear from you! Whether you want to enroll for driving classes, ask about our courses, or need any other information, feel free to reach out to us through the details below or simply call us." (16px ink).
- **Contact tiles** — 2×2 grid (1 column on mobile), `rounded-2xl`, padding 20px, **alternating backgrounds** exactly as designed: Phone = `green-50`, Email = `orange-50`, Address = `orange-50`, Working Hours = `green-50` (checkerboard). Each tile: solid orange circle (48px) with a white icon (phone, mail, map-pin, clock) on the left; right side: bold title (Inter 700 18px) + lines of detail (15px ink):
  - **Phone**: every number in `site.phones`, each on its own line as a `tel:` link (spaces removed in `href`).
  - **Email**: `site.email` as a `mailto:` link (break-all to avoid overflow).
  - **Address**: "Near Baleswar Bus Stand," / "Baleswar, Odisha – 756001" (built from `site.address`; if `landmark` is set it replaces/prepends "Near …").
  - **Working Hours**: lines from `site.hours` → "Mon – Sat: 8:00 AM – 6:00 PM" / "Sunday: Closed".
- **"Find Us on Map"** — dash + H2 (italic dark green, 32px). `map-card`: `rounded-2xl` bordered card, aspect ≈ 16/10 (min-h 300px), the Google Maps iframe (`src={site.map.embedUrl}`, `loading="lazy"`, `referrerPolicy="no-referrer-when-downgrade"`, `allowFullScreen`, `title="Map: Gopal Krushna Driving Training School, Baleswar"`). A white info chip overlaid at the top-left with: bold "Gopal Krushna Driving Training School", the address (2 lines, 13px), and a blue-ish text link "View larger map" → `site.map.directionsUrl` (new tab, `rel="noopener noreferrer"`). Add a click-to-load facade? No — keep a normal lazy iframe, but wrap in a container with a skeleton background so there is no CLS.

**Right column**
- **Call Us Directly card** (replaces the form): `Card` with `orange-50`→white soft gradient, `rounded-2xl`, padding 28–32px, shadow. Contents:
  1. Dash + H3 "**Call Us** *Directly*" (italic; "Call Us" dark green, "Directly" orange; 30px).
  2. Short text: "Speak to us for course details, timings and admission information. We're happy to help!" (editable — read it from `site.callCardText`; add this optional field to the `Site` schema with this default and mention that you did).
  3. **Open/Closed badge** (client component): computes the current time in **Asia/Kolkata** using `Intl.DateTimeFormat` and the `site.openDays/openFrom/openTo` fields → green pill "● Open now · Closes 6:00 PM" or grey/red pill "● Closed now · Opens Monday 8:00 AM". Server renders a neutral skeleton ("Check our working hours") to avoid hydration mismatch; updates every minute while mounted.
  4. One large **orange pill button per phone number** (full-width, height 56px, phone icon left, number in bold 20px, small "Tap to call" caption right on mobile); `href="tel:+91..."`. On desktop the number is also **selectable text**, and a small "Copy" ghost button beside each copies the number to the clipboard (with a `Toast` "Number copied" and `aria-live`). If clipboard API is unavailable, fall back silently.
  5. Divider "or".
- **WhatsApp "Quick Enquiry?" tile** below the card (as designed): `green-50` rounded-2xl horizontal card with the WhatsApp green circle icon (use an inline WhatsApp SVG — lucide doesn't ship brand icons), bold "Quick Enquiry?" and "Chat with us on WhatsApp for faster assistance!", and a right arrow; whole tile is a link to `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappMessage)}` opening in a new tab. Render it normally even when `site.whatsapp` is still a placeholder; the admin readiness checklist (prompt 15) flags placeholders.

### 3. "Why" strip — `StatBar`
Full-width cream band above the footer containing four icon+label items separated by vertical dividers (stack 2×2 on mobile): [shield-check] "Learn with Certified Instructors" · [car] "Safe & Practical Training" · [target] "Personalized Guidance" · [thumbs-up] "Build Confidence on the Road". Orange outline icons ~44px, bold 15px labels, two-line wrap as designed.

## Requirements
- No form elements anywhere on the page except buttons; no network calls from the page other than the map iframe.
- `generateMetadata` via `buildMetadata` ("Contact Us | …"). JSON-LD `ContactPage` + the school's `ContactPoint` entries (telephone, contactType "customer service", areaServed IN-OR, availableLanguage ["en","or","hi"]).
- All values from `site.json`. Handle missing optional fields gracefully (no empty tiles).
- Responsive: ≤ md the right column (Call card + WhatsApp) moves directly **after the Get In Touch paragraph and tiles**, before the map, so phone buttons are reachable without scrolling far.
- Accessibility: tiles are readable by screen readers as groups (`<section aria-labelledby>`), links have descriptive labels ("Call +91 …"), badge text not colour-only.

## Acceptance checklist
- [ ] Matches the design everywhere except the form → Call card.
- [ ] Every phone number is tap-to-call; copy works; Open/Closed badge correct in IST (test by mocking the clock: Mon 9:00 → open; Sun 10:00 → closed; Mon 18:30 → closed).
- [ ] WhatsApp link opens with the prefilled message.
- [ ] No `<form>`, no `/api/enquiry`, no email package in the repo (`grep` proves it).
- [ ] No hydration warnings; map lazy-loaded without CLS.
- [ ] `lint`, `typecheck`, `build` pass.
