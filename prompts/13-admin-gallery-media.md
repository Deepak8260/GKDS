# PROMPT 13 — Admin: Gallery manager, Media library and the image upload pipeline

**Attach:** nothing.
**Prerequisite:** CONTEXT BLOCK pasted; prompts 10–12 done. Pages: `<base>/gallery`, `<base>/media`. This prompt ALSO completes `ImageField` for every admin form.

## Goal
A reliable, phone-friendly way to upload, organise and publish photos, with automatic compression so everything fits within Vercel's 4.5 MB request limit, and with image usage tracking so nothing in use is deleted by accident.

## 1. Client-side image pipeline (`lib/image-client.ts`)
- Accept `image/jpeg`, `image/png`, `image/webp` (and `image/heic`/`heif` only if conversion is reliable via a lazily-loaded library — otherwise reject with the message "Please upload JPG, PNG or WebP. On iPhone use 'Most Compatible' format or share as JPG"). Max input 20 MB.
- Read EXIF orientation and auto-rotate; strip metadata (privacy/GPS) by re-encoding on a canvas (`createImageBitmap` + `OffscreenCanvas` when available).
- Presets by `kind`: `gallery`/`pages`/`courses` → long edge ≤ 1920px; `avatar` → square-crop-capable ≤ 400px; `logo` → ≤ 800px (keep PNG/SVG-like transparency: use WebP lossless/alpha); `og` → exactly 1200×630 cover crop.
- Encode to **WebP** quality 0.82 (retry at 0.7/0.6 if still > 900 KB). The final blob must be ≤ **3 MB** (base64 + JSON overhead then stays under 4.5 MB); otherwise error "Image is too large even after compression".
- Return `{blob, width, height, bytesBefore, bytesAfter, previewUrl}`; UI shows before/after size ("4.2 MB → 310 KB").
- Optional simple **crop/aspect** dialog for avatar/og (square or 1.91:1) using canvas (no heavy library).

## 2. Upload & delete APIs
- `POST /api/admin/media` (Node runtime, `maxDuration: 30`): auth + CSRF; body JSON `{folder, filename, dataBase64}`; `folder` ∈ `branding|pages|courses|gallery|avatars`; verify base64 length ≤ ~4.2 MB; decode; **magic-byte check** that it is really WebP/PNG/JPEG; sanitise the name to `[a-z0-9-]` (≤ 40 chars); store as `media/<folder>/<sha1(content).slice(0,8)>-<slug>.webp`; if the path already exists return it (dedupe); commit via `putBinary` (message `admin: upload media/<folder>/<file>`); respond `{path, size, width?, height?}`.
- `DELETE /api/admin/media` `{path}`: scan all content JSON files (`site, home, about, courses, gallery, reviews`) for the path; if referenced → 409 `{usedIn:[{file, jsonPath}]}`; else delete the file (needs sha) and revalidate.
- `GET /api/admin/media?folder=` lists files with `{path,name,size,folder,usedIn}` (use `listDir` + a usage index built from the content files; cache 30 s).
- Upload queue on the client: concurrency 2, per-file progress states (queued → compressing → uploading → done/error), **retry** button, resumable after errors, handles GitHub secondary rate limits by backing off (server returns 429 + `retryAfter`).

## 3. `ImageField` (final version, used everywhere)
Shows current image thumbnail (or empty state), **Alt text** input (required when an image is set, with hint "Describe the photo for visually impaired users and Google"), and buttons **Choose from library** (opens `MediaPickerModal`: grid of existing media with folder filter + search, select to use) and **Upload new** (drag-drop or file picker → compress → upload → returns path). Props: `kind` (preset), `folder`, `aspectHint`, `value`, `onChange({path, alt})`. Supports remove (sets empty, with confirm when the field is required). Uploads happen immediately (file is committed to `data` even if the form isn't saved yet — show a note; unused files are cleaned from the Media Library).

## 4. Gallery manager (`<base>/gallery`)
- `AdminPageHeader` + stats chips ("32 photos · 28 published · 4 hidden · 2 missing alt text").
- **Upload zone** (large dashed card): drag-and-drop or "Choose photos" (multiple), also a camera option on mobile (`capture` not forced). Category select ("Add to category") applies to the batch; show per-file progress cards. Uploaded images are appended to the draft `gallery.items` (`published:true`, `createdAt` now, `order` after the last) and the metadata is committed once when the user presses **Save changes** (images themselves are already stored).
- **Grid of photos** (responsive 2/3/4 columns): thumbnail with overlay controls — drag handle (reorder, plus keyboard up/down), checkbox (bulk select), Published `Toggle`, a pencil to edit. Card footer shows category chip and an **alt-text warning badge** if empty.
- **Edit photo drawer**: preview, Alt text (required), Category (select), Published toggle, Replace image (re-upload keeping metadata), Delete (staged) — delete also offers "remove file from library if unused".
- **Bulk actions bar** (appears when ≥ 1 selected): Publish, Unpublish, Change category, Delete (confirm), Select all / none.
- **Filters**: category tabs (All + each category + counts), search by alt text, toggle "Missing alt text only", "Hidden only".
- **Categories manager** (modal): list with add / rename / reorder / pick icon (`IconPicker`) / delete (blocked with a message when the category still has photos: "Move or delete those 5 photos first"). The "All Photos" pill is built-in and not editable.
- **Page settings** accordion: hero (title, subtitle, image + alt), section title words ("Photo" / "Gallery").
- Single **Save changes** → validate → one commit to `content/gallery.json` → revalidate.

## 5. Media library (`<base>/media`)
Grid/list toggle of everything under `media/` (all folders) with folder filter, search, sorting (newest, name, size). Each item: thumbnail, file name, folder, size, "Used in: Gallery, Home hero…" (or "Unused" badge), **Copy path**, **Open**, **Delete** (disabled with tooltip when used). Bulk "Delete all unused" with confirm and a preview list. Shows total library size and a soft warning above 500 MB (GitHub repo size guidance).

## 6. Quality & safety
- Never upload non-images; never trust client MIME; path-sanitise everything; no directory traversal; rate limit the media API per session.
- Large batches (e.g. 20 phone photos) must complete without 413/timeouts; compress in a Web Worker if available to keep the UI responsive; show an overall progress bar.
- Failed uploads never create entries in `gallery.json`.
- Vitest: filename sanitiser, hash naming/dedupe, magic-byte check, usage scanner. Playwright: upload with a mocked API, alt-text requirement, bulk publish.

## Acceptance checklist
- [ ] Upload 10 large phone photos in one go: all compress (< 1 MB typical), upload on Vercel without 413, appear in the grid, and after **Save changes** appear on the public Gallery in the right category within seconds.
- [ ] `ImageField` works in Settings, Home, About, Courses and Reviews forms (library picker + upload + alt text).
- [ ] Deleting an image used anywhere is blocked and lists where it is used; unused images can be deleted.
- [ ] Category management blocks deleting non-empty categories; reorder works by mouse and keyboard.
- [ ] Alt-text warnings and filters work; mobile layout usable.
- [ ] `lint`, `typecheck`, tests, `build` pass.
