# PROMPT 11 — Admin: Site Settings, Home page and About page editors

**Attach:** nothing.
**Prerequisite:** CONTEXT BLOCK pasted; prompt 10 done (use its admin kit: `useAdminResource`, `FormSection`, `RepeaterField`, `IconPicker`, `ImageField`, `SaveBar`, etc.). Pages live at `<base>/settings`, `<base>/home`, `<base>/about` where `<base>` is `/admin` or `/malika`.

## Goal
Three form-based editors that expose **every** editable field of `site.json`, `home.json` and `about.json` exactly as modelled in CONTEXT BLOCK §8 (+ `Site.callCardText` added in prompt 08). Forms are generated with the zod schemas as the source of truth for validation and field-level errors. Saving calls `PUT /api/admin/content/<name>` → validate → commit to the `data` branch → revalidate → public site updates in seconds.

## Common behaviour (all three pages)
- Layout: `AdminPageHeader` (title, description, "Preview page ↗" button that opens the matching public page in a new tab) + stacked `FormSection` cards (or an `Accordion` on long pages) + sticky `SaveBar`.
- Load → draft state → dirty tracking → Save (disabled until valid and dirty). Live validation (on blur + on save), error summary at the top when saving fails with links to the failing fields.
- Conflict handling: if the file's sha changed since loading, show a dialog "This content was changed elsewhere" with **Reload latest** (discard my changes) / **Keep editing** (and re-try save after reload merging manually).
- "Reset section to default" button per section (loads the seed values for that section into the draft, with confirm) and "Reset all".
- Meta line: "Last saved <relative time> by admin" from the latest commit touching that file (use `getCommits(path,1)`).
- Unsaved-changes guard; toasts for success/failure; every control labelled; mobile friendly (single column).
- Character counters on long texts; trim whitespace; prevent empty required fields.

## 1. Site Settings (`site.json`)
Sections:
1. **Brand** — Name, Short name, Tagline, Regd. number text (e.g. "Govt. of Odisha Regd. No. 10/13"; the header badge splits it at the first "Regd." into two lines — show a live preview of the badge), Logo (`ImageField`, folder `branding`, recommended square ≥ 400px), Favicon (`ImageField`), Social share image (`ImageField`, 1200×630 recommended).
2. **Contact** — Phone numbers (`RepeaterField`, min 1, max 4; each validated as an Indian number: digits with optional +91; show a "Test call link" preview `tel:`), WhatsApp number (digits with country code, helper "e.g. 919876543210"), WhatsApp prefilled message (with live preview of the final `wa.me` link and an "Open" test button), Email, **Call card text** (the sentence shown on the Contact page's call card).
3. **Address** — Line 1, Line 2 (optional), Landmark (optional, e.g. "Near Baleswar Bus Stand"), City, State, PIN (6 digits).
4. **Working hours** — `RepeaterField` of `{label, value}` rows (e.g. "Mon – Sat" / "8:00 AM – 6:00 PM", "Sunday" / "Closed") for display, plus the **machine-readable schedule** used by the Open/Closed badge: days toggles Mon–Sun (checkboxes), Opens at (time input), Closes at (time input) with a note "Timezone: India (IST)". Validate opens < closes.
5. **Social links** — YouTube, Facebook, Instagram (URL inputs, https only, optional; empty hides the icon in the footer).
6. **Google Map** — Embed URL (textarea; helper with steps: Google Maps → Share → Embed a map → copy the `src` URL — also accept a pasted full `<iframe …>` snippet and extract `src` automatically), Directions/“View larger map” URL (paste a Google Maps share link). Live preview iframe below. Validate that the embed host is `www.google.com/maps/embed`.
7. **SEO** — Page title, Meta description (counter with ideal 120–155), Keywords (tag input).
8. **Headline statistics** — Since year, "Years" label (e.g. "30+ Years"), Trained drivers (e.g. "1000+"), Success label, Rating (0–5, step 0.1), Rating count label (e.g. "250+"), Recommend % (0–100).

## 2. Home page (`home.json`)
Accordion sections in the same order as the public page, each with a small thumbnail of what it controls:
1. **Hero** — Eyebrow, Title (first part), Highlighted words (orange), Subtitle, Hero image (`ImageField`, folder `pages`, with `imageAlt`), Primary button label, Secondary button label.
2. **Trust bar** — `RepeaterField` (exactly 4 recommended; allow 3–5) of {icon (`IconPicker`), title, optional second line}.
3. **About teaser** — Eyebrow, Title, Body (textarea), Image + alt, Stats (3 items: icon, title, subtitle).
4. **Why Choose Us** — Eyebrow, Lead words, Highlighted words, items repeater {icon, title} (3–6).
5. **Courses intro** — Eyebrow, Lead, Highlight, Subtitle (the cards themselves come from the Courses manager — show a note + link "Manage courses").
6. **Learning journey** — Eyebrow, Lead, Highlight, Steps repeater {icon, title, caption} (3–6, reorderable).
7. **Reviews intro** — Eyebrow, Title (note: "Featured reviews are chosen in Reviews → Featured").
8. **Contact teaser** — Eyebrow, Title, Body (note: phones/address/hours/map come from Site Settings).

## 3. About page (`about.json`)
Sections: **Hero** (title, subtitle, image + alt) · **Story** (eyebrow, title first part, highlighted part, paragraphs `RepeaterField` of textareas (1–5), image + alt + optional "Image focus" (`imagePosition`, e.g. "75% center", with a live crop preview)) · **Stats strip** (4 items {icon, title, subtitle}) · **Mission** (title, text) · **Vision** (title, text) · **Section titles** (`missionVisionTitle`, `valuesTitle`) · **Values** (`RepeaterField` {icon, title, text}, 3–6).

## 4. Implementation notes
- Build ONE reusable `ContentEditor` pattern: page config describes sections/fields declaratively (path, label, component, validation hints), so adding a field later needs one line. Reuse across the three pages (and later prompts).
- All image fields store the returned `media/...` path and `alt` text; until prompt 13 lands, `ImageField` can accept pasted paths/URLs in a "Advanced: path" input for testing.
- Icons come only from the whitelist; show the icon next to its name.
- Protect against accidental data loss: the editor never writes a field the schema doesn't know (strip unknown keys), and never saves while invalid.
- Add Vitest tests for the field-mapping helpers and the iframe-`src` extractor; Playwright test: edit hero title in Home, save, reload public page (with seed mode, assert the API round-trip using mocks).

## Acceptance checklist
- [ ] Every field in the three JSON files is editable; saving updates the public page within ~10 seconds (verify against a real `data` branch).
- [ ] Invalid input (bad phone, bad URL, empty required field, wrong map URL) is blocked with clear inline messages.
- [ ] Pasting a full Google `<iframe>` snippet extracts the `src`; live map preview works.
- [ ] Reset-to-default, unsaved-changes guard and conflict dialog all work.
- [ ] Works at 390px width; keyboard accessible; `lint`, `typecheck`, tests, `build` pass.
