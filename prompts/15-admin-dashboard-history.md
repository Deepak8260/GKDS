# PROMPT 15 — Admin: Dashboard completion, content history/restore, backup, help

**Attach:** nothing.
**Prerequisite:** CONTEXT BLOCK pasted; prompts 10–14 done. There is no enquiry inbox (the site has no enquiry form), so this prompt finishes the admin experience instead.

## 1. Dashboard upgrades (`<base>`)
- **Greeting header**: "Welcome back" + today's date (IST) + "View website ↗".
- **Stat cards** (clickable): Courses (published/total), Gallery photos (published/total, missing-alt count), Published reviews (+ average rating), **Pending reviews** (accent badge; link to Reviews).
- **Needs attention** card (only shows issues): pending reviews waiting; placeholder values still in Settings (phone numbers containing `X`, WhatsApp placeholder, empty/placeholder map URL, address landmark blank, default logo still the placeholder, social links still the generic homepages); gallery photos without alt text; media files unused; admin still using the default access code from the environment (detected via absence of `config/admin.json`) → prominent warning with a button to the Security page.
- **"Is your site ready to launch?" checklist** — computed items with ✓/✗ and deep links (e.g. "Add real phone numbers → Settings"). Show a progress ring (x of y done).
- **Recent changes**: last 10 commits on the `data` branch from the GitHub commits API (message prettified: "Updated Courses", "Uploaded photo", "Approved a review"; time ago; link to the commit on GitHub), cached 60 s.
- **GitHub health** card from prompt 10 stays (token expiry warning if the API reports `github-authentication-token-expiration` header within 14 days).
- Quick actions grid: Add photo, Add course, Edit phone numbers, Review pending.

## 2. Content history & restore
- On each editor (Site Settings, Home, About, Courses, Gallery, Reviews summary) add a **History** button in the header → drawer listing the last 20 commits touching that file (`getCommits(path, 20)`): friendly message, time, short sha.
- Selecting a version shows a read-only **diff-style summary** (changed top-level sections/fields: compare JSON objects and list changed paths with old → new values, truncated) and a **Restore this version** button.
- Restore: fetch the file content at that commit sha (`GET contents?ref=<sha>`), validate with the zod schema (reject with a clear message if the old shape is no longer valid), load it into the editor as the **draft** (not committed) so the user can review, then Save to commit as a NEW commit. Never rewrite git history.

## 3. Backup & export
- **Download backup** button (Dashboard + Help): `GET /api/admin/backup` streams a ZIP containing `content/*.json` and a `README.txt` with the date and restore instructions (build the ZIP server-side with a small pure-JS zip writer, no heavy dependency; media files excluded — explain they live in the repo and a `git clone` gets everything).
- **Import/restore from backup** (advanced, collapsed): upload the ZIP, validate every JSON, show a preview of what would change, require typing RESTORE, then commit each file (one commit per file, same naming convention).

## 4. Help page (`<base>/help`)
Short, friendly cards with screenshots-free step lists (written for a non-technical owner), each with a "Take me there" link:
1. Change phone numbers / address / timings.
2. Add or hide a photo in the gallery.
3. Approve or reject a review; feature a review on the Home page.
4. Add or edit a course.
5. Replace the logo or a page image.
6. Change the admin access code (Security page) — and what to do if it is forgotten (set `ADMIN_CODE_RESET=1` in the Vercel project env vars, redeploy, log in with `ADMIN_CODE`, change the code, then remove `ADMIN_CODE_RESET`).
7. Restore an older version (History) and download a backup.
8. Why changes show on the website within seconds and what to do if they don't ("Re-check GitHub connection", or "Refresh website cache" button → calls `POST /api/admin/revalidate`, which runs `revalidateTag('content')`).
9. Using the panel at `/admin` or `/malika` (same thing).
Also show system info: app version (from package.json), data repo & branch name, last revalidation time.

## 5. Misc polish
- **Refresh website cache** button (Dashboard header menu).
- Global search (⌘/Ctrl-K) command palette to jump to any admin page (simple client-side list).
- Keyboard shortcuts overlay (`?`).
- Dark mode is NOT required.
- Final admin accessibility pass: axe on all admin pages (login, dashboard, settings, home, about, courses, gallery, media, reviews, security, help) → 0 serious/critical.

## Tests
Vitest: readiness-check computation, commit-message prettifier, JSON diff summary, ZIP writer output (unzip and compare), restore validation. Playwright: dashboard shows warnings in seed mode; History → Restore loads into draft (API mocked).

## Acceptance checklist
- [ ] Dashboard accurately reflects counts, pending reviews, placeholder warnings and the default-code warning; readiness checklist links work.
- [ ] History lists commits per file; restoring an older version loads it as a draft and saving creates a new commit that the public site reflects.
- [ ] Backup ZIP downloads and contains valid JSON; import preview + RESTORE confirmation works.
- [ ] Help page covers all tasks (including forgotten-code recovery); "Refresh website cache" works.
- [ ] `lint`, `typecheck`, tests, `build` pass; axe clean on admin pages.
