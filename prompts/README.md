# Gopal Krushna Driving Training School — Prompt Pack

Each file in this folder is ONE ready-to-paste prompt. Paste them to your AI coding tool **in numeric order**.

## How to use
1. Create an empty project folder and open it in your AI tool (Claude Code, Cursor, etc.).
2. Paste **`00-context-block.md`** first (the AI must remember it for the whole project). If you ever start a fresh chat, paste it again before the next prompt.
3. Paste prompt `01`, attach the design image listed in the table, and let the AI finish. Check the **Acceptance checklist** at the bottom of the prompt. Run `npm run build` and `npm run dev` and look at the result.
4. Only move to the next prompt when the checklist passes. If the AI stops halfway, reply: *"Continue exactly where you stopped and finish the acceptance checklist."*
5. If a page drifts from the shared look, reply: *"Refactor this to reuse the shared components and design tokens from the CONTEXT BLOCK; do not create duplicates."*

## Order
| File | Builds | Attach this design |
|---|---|---|
| 00-context-block.md | Shared rules, design tokens, data model (paste first, always) | — |
| 01-foundation-design-system.md | Project scaffold, tokens, UI kit, header, footer, hero | any one design |
| 02-github-data-layer.md | GitHub-as-database read layer, seed JSON, image proxy | — |
| 03-home-page.md | Home page | Gopal Krushna Driving School Website.png |
| 04-about-page.md | About Us page | Gopal Krushna Driving School About Us.png |
| 05-courses-page.md | Courses page | Gopal Krushna Driving Courses Page.png |
| 06-gallery-page.md | Gallery page + lightbox | Driving School Gallery Showcase.png |
| 07-reviews-page.md | Reviews page + public "Leave a Review" form | Gopal Krushna Student Reviews.png |
| 08-contact-page.md | Contact page (call-first, NO form) | Gopal Krushna Driving School Contact Page.png |
| 09-seo-performance-accessibility.md | SEO, speed, accessibility, tests (public site done) | — |
| 10-admin-auth-shell.md | Admin at /admin and /malika, access-code login, shell, GitHub write layer | — |
| 11-admin-settings-home-about.md | Admin editors: site settings, Home, About | — |
| 12-admin-courses.md | Admin courses manager | — |
| 13-admin-gallery-media.md | Admin gallery + media library + image upload pipeline | — |
| 14-admin-reviews.md | Admin review moderation | — |
| 15-admin-dashboard-history.md | Dashboard, content history/restore, backup, help | — |
| 16-deployment-qa.md | Vercel deployment, docs, final QA | — |

## Decisions already made (do not ask the AI to change them)
- Next.js App Router + TypeScript + Tailwind, deployed entirely on Vercel, **no database**.
- **One private GitHub repo `gkds`**: branch `main` = code, orphan branch `data` = content, images, pending reviews and the hashed admin code. Vercel does not build the `data` branch, so admin saves never trigger a redeploy.
- **No contact/enquiry form.** Visitors phone or WhatsApp the school. The **public review form stays**, and reviews appear only after admin approval.
- **Admin** is available at both `/admin` and `/malika`, protected by an access code (default `gkds1993` from `.env`, changeable from the admin Security page).

## Small content fixes I made while reading the designs
- Home says "hundreds of learners", About says "thousands", stats say "1000+". Seed data uses one consistent phrase: "over 1000 learners".
- The Contact design text says "...or the contact form". Since there is no form, the seed text says "...or simply call us."
- The Home section labelled "OUR TRAINING COURSES" above "A Simple and Practical Learning Journey" is kept as designed; you can edit it later in admin.
- Reviewer "Subhom Jena" in one design vs "Subham Jena" in another: seed uses "Subham Jena".
- Email in the design is `gopalkrishna.driving@gmail.com` (spelled "Krishna"); kept as given, editable in admin.
- All phone numbers, the "Near ____" landmark and the map are placeholders, editable in admin.
