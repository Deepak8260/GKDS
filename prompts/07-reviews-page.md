# PROMPT 07 — Reviews page + public "Leave a Review" form

**Attach:** `Gopal Krushna Student Reviews.png`
**Prerequisite:** CONTEXT BLOCK pasted; prompts 01–06 done. Reuse shared components (`PageHero`, `StatBar`, `Stars`, `Card`, `Modal`, `Button`, `CTABanner`-style banner).

## Goal
Build `app/(site)/reviews/page.tsx` (data: `getReviews()`, `getSite()`, `getReviewStats()`) plus the public review submission flow: modal form → `POST /api/reviews/submit` → a pending file in the private repo (`submissions/reviews/<id>.json` on the `data` branch). Nothing becomes public until the admin approves it (prompt 14).

Files: `components/sections/reviews/` → `rating-summary.tsx`, `reviews-client.tsx` (sort + grid + load more), `review-card.tsx`, `sort-select.tsx`, `review-form-modal.tsx`, `share-banner.tsx`; `lib/github-write.ts` (createFile only for now); `app/api/reviews/submit/route.ts`; `lib/rate-limit.ts`; `lib/sanitize.ts`.

## Page sections

### 1. Hero — `PageHero`
Breadcrumb `Home › Reviews`; H1 "Student Reviews"; subtitle "Hear from our learners about their experience with us."; right image = white WagonR with "L DRIVING TRAINING" roof sign beside orange cones.

### 2. Rating summary — `StatBar` (overlapping the hero slightly like in the design, centered card)
Three items, larger numerals: [star icon in orange outline, 40px] **"4.8 / 5"** (big 36px bold; "/ 5" smaller) with caption "Based on 250+ Reviews" · [users] **"1000+"** "Happy Learners" · [shield-check] **"95%"** "Would Recommend". Values: `summaryMode==='manual'` → from `site.stats` (rating, ratingCount, trainedDrivers, recommendPercent); `'auto'` → computed by `getReviewStats()` from published reviews.

### 3. "What Our Learners Say" + sort
- Left: dash + H2 "What Our Learners Say" (italic dark green 44px; `titleLead`).
- Right: sort control — a custom accessible **listbox/select** pill (white, 1px dark-green border, rounded-xl, height 44px, "Most Recent" label + chevron). Options: **Most Recent** (date desc, default), **Highest Rated** (rating desc then date desc), **Lowest Rated** (rating asc then date desc). Keyboard: Enter/Space opens, arrows move, Enter selects, Esc closes, `aria-haspopup="listbox"`, `aria-expanded`, `role="option" aria-selected`. Selection synced to URL `?sort=recent|highest|lowest` (default omitted). Implement as a client component; you may use a native `<select>` styled the same for mobile (`md:hidden`) if that gives better UX, but the desktop version must match the design.

### 4. Review grid
- 3 columns on `lg`, 2 on `md`, 1 on mobile; gap 24px. Only `published` reviews.
- **ReviewCard** (white `Card`, `rounded-2xl`, shadow, padding 24px): header row = circular avatar 64px (image via `mediaUrl`, else generated **initials avatar** with deterministic brand-colour background from the name hash, white initials) + column with bold name (Inter 700 18px dark navy/ink), `Stars` (orange, 20px, half-star aware, `aria-label="4.5 out of 5 stars"`), and a relative time line (muted 14px) such as "2 weeks ago"; a large faint **green quote mark** (“) icon at the top-right (`green-100`, 48px, `aria-hidden`); body = the review text in curly quotes, 15.5px/1.6 ink. Equal-height cards per row.
- Relative time helper `formatRelative(date)` in `lib/utils/date.ts`: "today", "x days ago", "1 week ago", "x weeks ago", "1 month ago", "x months ago", "1 year ago", "x years ago" (unit tests!). Rendered with `<time dateTime=ISO>`; computed at render on the server (ISR) — acceptable staleness (≤ 1h) — plus hydration-safe client refresh not required.
- **Pagination**: show 9, then "Load more reviews" button (+9) with `aria-live` count. Empty state: "No reviews yet — be the first to share your experience!" with the review button.

### 5. "Share Your Experience" banner
Light-green rounded banner (like `CTABanner`, with road illustration at right): left a large orange speech-bubble-with-star outline icon (message-circle with a star, 72px), a thin vertical divider, then title "**Share** *Your Experience*" ("Share" dark green italic; the design shows "Share Your Experience" — use `ctaTitleLead` + `ctaTitleHighlight` = "Share" / "Your Experience"), text "Have you trained with us? We'd love to hear your feedback!", and a primary button **"Leave a Review →"** that opens the review modal.

## Review form modal (`review-form-modal.tsx`, uses shared `Modal`, dynamically imported)
- Title "Leave a Review" with a short intro "Tell us about your experience at Gopal Krushna Driving Training School."
- Fields: **Your Name** (required, 2–60 chars, letters/spaces/.'- allowed); **Rating** — interactive star picker (radio group, 1–5 whole stars; hover preview; keyboard arrows; label "Rate your experience"; required); **Your Review** (textarea, required, 20–600 chars, live counter "123/600"). **No photo upload, no email, no phone.** Hidden honeypot input (`company`, visually hidden, `tabIndex=-1`, `autocomplete="off"`) and a hidden `formStartedAt` timestamp.
- Client validation with the shared zod `publicReviewSchema` (export from `lib/validators/reviews.ts` — name, rating, text, honeypot, startedAt); inline errors under fields (`aria-describedby`), `aria-live` for submit status; submit button shows spinner; double-submit prevented.
- States: idle → submitting → **success** (green check, "Thank you! Your review has been submitted and will appear after approval.", Close button) / **error** (friendly message, keep inputs, Retry). Remember last submission in `localStorage` (try/catch) to politely block a second submit within 10 minutes ("You already submitted a review recently").
- Focus management: initial focus on name field; return focus to the "Leave a Review" button on close.

## Submission API — `app/api/reviews/submit/route.ts`
`export const runtime = 'nodejs'; export const maxDuration = 15;` POST JSON only.
1. Reject if `Content-Type` isn't JSON, body > 8 KB, or `Origin` host doesn't match `NEXT_PUBLIC_SITE_URL`/the request host.
2. Validate with the shared schema server-side. Honeypot non-empty → respond `200 {ok:true}` silently (don't reveal). `startedAt` less than 3 seconds ago → reject as spam (generic message).
3. Rate limit (`lib/rate-limit.ts`, in-memory sliding window keyed by hashed IP from `x-forwarded-for`): 3 submissions/hour/IP and 30/hour global; return 429 with `Retry-After`. Document in a code comment that serverless memory is best-effort.
4. Sanitise (`lib/sanitize.ts`): strip HTML tags and control characters, collapse whitespace, trim; reject URLs/emails/phone numbers in text (regex) to reduce spam; cap lengths.
5. Create ONE new file `submissions/reviews/<id>.json` (id = `newId()`; content `{id,name,rating,text,submittedAt,status:'pending'}`) via `lib/github-write.ts → createFile(path, content, message)` (PUT contents API, base64, branch `GITHUB_BRANCH`, message `review: new submission <id>`); retry up to 3× with exponential backoff on 409/5xx/network errors; never edit `reviews.json`.
6. Respond `{ok:true}`; on failure `{ok:false, message:'Could not submit right now. Please try again later.'}` with a proper status. Never include stack traces, tokens or repo details.
7. If GitHub isn't configured (local dev), respond ok but log "review dropped: GitHub not configured" in dev only.

## SEO / structured data
`buildMetadata` ("Student Reviews | …"). JSON-LD `AggregateRating` inside the school's `DrivingSchool` entity (ratingValue, reviewCount from the summary) and up to 5 `Review` items (author, reviewRating, reviewBody, datePublished).

## Tests
Vitest: relative-time helper, sorting comparator (ties), sanitiser (HTML, URLs), rate limiter window logic, schema boundaries. Playwright: open modal, validation errors, success flow with the route mocked.

## Acceptance checklist
- [ ] Page matches the design (summary strip, sort pill, 3-column cards with avatar/stars/quote mark, green "Share Your Experience" banner).
- [ ] Sorting works, persists in the URL, and is keyboard accessible; half-star rendering correct for 4.5.
- [ ] Valid submission creates `submissions/reviews/<id>.json` on the `data` branch and shows the success message; nothing appears on the public page.
- [ ] Spam attempts (honeypot, too fast, links in text, >3/hour) are rejected; errors never leak internals.
- [ ] No photo/email/phone fields exist anywhere in the form.
- [ ] `lint`, `typecheck`, tests, `build` pass.
