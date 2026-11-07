# PROMPT 14 — Admin: Reviews moderation

**Attach:** nothing.
**Prerequisite:** CONTEXT BLOCK pasted; prompts 07 (public form + pending files), 10 and 13 (uploads) done. Page: `<base>/reviews`.

## Goal
Let the owner approve/reject public submissions, edit and manage published reviews, pick the featured ones for the Home page, add reviews manually, and control the summary numbers (rating/count/recommend%) on the Reviews page.

## Layout
`AdminPageHeader` ("Reviews") + `Tabs` with counts: **Pending (n)** · **Published (n)** · **Summary & page settings**. Sidebar shows a badge with the pending count (poll every 60 s while the tab is visible).

## Tab 1 — Pending
Source: files in `submissions/reviews/*.json` on the `data` branch (`listDir` + read each; newest first; cache 20 s; **Refresh** button).
Each item = card: avatar placeholder (initials), name, `Stars`, full text, submitted time (absolute + relative), actions:
- **Approve** → opens a small editor drawer pre-filled with the submission: Name (editable), Rating (star picker, half stars allowed), Review text (editable, 600 max; typo fixes allowed), Display date (default today; date picker), Avatar (`ImageField`, kind `avatar`, optional; if none the site shows an initials avatar), "Feature on Home page" toggle (max 3 featured — if already 3, show a picker to replace one). Confirm → **write order**: (1) append the review to `reviews.json` (new `id`, `published:true`) with sha-based update, (2) delete the pending file, (3) revalidate. If step 2 fails, show a recoverable warning "Review published, but the pending file couldn't be removed — retry cleanup" with a retry button (idempotent: skip step 1 if the id already exists).
- **Reject** → confirm dialog → delete the pending file (no record kept) with an Undo toast for 8 s (undo recreates the file from memory).
- Quick approve (✓) button on the card for "approve as-is" without opening the drawer.
- Bulk select → Approve all as-is / Reject selected (confirm with count).
- Empty state: "No pending reviews 🎉".
- Spam-looking items (very short, repeated characters, links) get a yellow "Looks suspicious" hint (client-side heuristics) — informational only.

## Tab 2 — Published
Source: `reviews.json`. Searchable, sortable (newest, rating), filter (Featured, Hidden). Each row/card shows avatar, name, stars, text excerpt, date, status pills (Featured, Hidden) with inline actions: **Edit** (same drawer as approve), **Hide/Show** toggle (`published`), **Feature** star toggle (max 3 enforced with a clear message), **Delete** (confirm; staged until Save), drag handle is NOT needed (ordering is by date).
- **Add review manually** button (for reviews received by WhatsApp/in person): drawer with Name, Rating, Text, Date (past dates allowed), Avatar, Featured.
- One **Save changes** per tab session (draft → single commit to `content/reviews.json`) for published edits; approvals commit immediately (they are discrete actions) — make this difference obvious with copy ("Approving publishes immediately").

## Tab 3 — Summary & page settings
- **Summary mode**: radio **Auto** (calculate rating, count and recommend% from published reviews — show the computed values live) or **Manual** (use the numbers entered in Site Settings → Headline statistics: rating, count label, trained drivers, recommend%) — edit those numbers right here too (they write to `site.json` stats through the same API; make clear which file is updated).
- Hero (title, subtitle, image + alt), section title ("What Our Learners Say"), banner texts (`ctaTitleLead`, `ctaTitleHighlight`, `ctaText`).
- **Public form switch**: "Accept new reviews from visitors" toggle stored as `reviews.acceptSubmissions` (add this boolean to the schema, default true); when off, the public "Leave a Review" button shows "Reviews are currently closed" and the API returns 403. Update the public prompt-07 code accordingly.
- Danger zone: "Delete ALL pending reviews" (type DELETE to confirm).

## Technical requirements
- Reuse shared admin kit; optimistic UI with rollback on error; every action shows a toast; keyboard accessible; mobile friendly.
- All writes via the write layer with sha checks and revalidation of `content:reviews` and `content`.
- Concurrency: if two admins act at once, conflicts show the standard reload dialog.
- Security: pending file contents are untrusted — render as text only (React escaping), never `dangerouslySetInnerHTML`; validate the pending file against `pendingReview` schema and skip/flag malformed ones.
- Tests (Vitest): approve flow ordering and idempotency (mock GitHub), featured limit logic, summary computation, suspicious heuristics. Playwright: approve a pending review with the API mocked.

## Acceptance checklist
- [ ] A review submitted on the public site appears in **Pending**; approving (with an edit) makes it show on `/reviews` (and Home when featured) within seconds and removes the pending file.
- [ ] Rejecting removes the pending file; Undo works within 8 seconds.
- [ ] Featured limit of 3 enforced; hide/show/delete/manual add work.
- [ ] Auto vs Manual summary changes the Reviews page numbers; the "accept submissions" switch disables the public form and API.
- [ ] No unsafe HTML rendering; `lint`, `typecheck`, tests, `build` pass.
