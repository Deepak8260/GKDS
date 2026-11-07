# PROMPT 12 — Admin: Courses manager

**Attach:** nothing.
**Prerequisite:** CONTEXT BLOCK pasted; prompts 10–11 done (admin kit, `ContentEditor` pattern). Page: `<base>/courses`.

## Goal
Let the owner add, edit, reorder, hide and delete courses and edit all other Courses-page content, with one atomic save (a single commit to `content/courses.json`). Changes automatically propagate to the Courses page, Home teaser, header dropdown and anchors.

## Layout
`AdminPageHeader` ("Courses", description, primary action **Add course**) + `Tabs`: **Courses** · **Page content** · sticky `SaveBar` shared by both tabs (single draft of the whole `courses.json`).

### Tab 1 — Courses
- **List** of course cards (vertical list on mobile, 2-column grid on desktop): thumbnail, title, vehicle `Pill`, "Published" `Toggle`, order handle, "Edit" and "Delete" buttons. **Drag-to-reorder** (pointer + keyboard via up/down buttons with `aria-label="Move up"`), `order` renumbered 1..n on change. Drafts (unpublished) show a grey "Hidden" pill and reduced opacity.
- **Edit course** opens a side drawer (full-screen on mobile) with:
  - Title (required, ≤ 80), **Slug** (auto-generated from title until manually edited; lowercase-hyphen, unique among courses, show the resulting URL `/courses#<slug>`; warn when changing an existing slug: "Links to this course anchor will change"), Short description (textarea ≤ 220 with counter), Vehicle name (e.g. "WagonR"), Course image (`ImageField`, folder `courses`, with alt text; recommended: car on transparent/clean background, landscape ≥ 800px wide), **Features** (`RepeaterField` of short strings, 1–6, reorderable — these are the green-check bullets), Published toggle.
  - Live **mini-preview** of the course exactly as the public `CourseCard` renders (render the real `CourseCard` component with draft data inside a scaled container).
  - Buttons: Done (applies to draft), Cancel (discard drawer edits).
- **Add course** creates a new draft with a fresh `id`, order = last+1, published = false, opens the drawer.
- **Delete**: confirm dialog requiring the user to type the course title. Deleting is staged in the draft until Save.
- Guard rails: at least one course must stay published (warn on save if zero published — allowed but show "The courses page will show an empty state"); max 8 courses.

### Tab 2 — Page content
Accordions for the rest of `courses.json`: **Hero** (title, subtitle, image + alt) · **Intro heading** (lead, highlight, subtitle) · **"What's Included" tiles** (section title; `RepeaterField` {icon, title}, 3–6) · **Training Highlights** (lead, highlight, image + alt, bullet list repeater 3–8) · **Bottom CTA banner** (lead, highlight, text). Each accordion header shows a one-line summary and a validity dot.

## Behaviour
- One draft, one **Save changes** → validate whole document with the zod schema → single commit `admin: update courses.json` → revalidate tags `content:courses`, `content` (affects Home & Header). Show a success toast with a link "View courses page ↗".
- Conflict handling and unsaved-changes guard from the shared kit.
- After saving a slug change, nothing else needs updating (all references derive from data); add a Vitest test asserting the Header dropdown, Home teaser and Courses page all derive from `getPublishedCourses()`.
- Deleting a course does NOT delete its image file from `media/` automatically; show a note and offer "Remove unused image" in the Media Library (prompt 13).
- Accessibility: drag handles have keyboard alternatives; drawer traps focus; all form controls labelled.

## Acceptance checklist
- [ ] Add a third course, upload its image, publish → appears on the Courses page, the header dropdown and nothing breaks on Home (still shows the first 2).
- [ ] Reorder via drag and via keyboard; order persists; hide/unhide works.
- [ ] Slug uniqueness and format enforced; warning on slug change; anchor links work.
- [ ] Delete requires typing the title; staged until Save.
- [ ] Page content tab edits (hero, included tiles, highlights, CTA) show on the public page after save.
- [ ] Mini-preview uses the real `CourseCard`; `lint`, `typecheck`, tests, `build` pass.
