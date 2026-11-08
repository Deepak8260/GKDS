# Static assets

Every bundled image lives in **`public/assets/`**. Next.js serves the `public/` folder at the site root, so a file at `public/assets/brand/odisha-seal.png` is reached in code and in content JSON as **`/assets/brand/odisha-seal.png`**.

```
public/assets/
  brand/
    krishna-golden-flute.png   Krishna with the golden flute emblem (transparent, 1254×1254) — site logo
    favicon.png                browser-tab icon (128×128, cropped from the emblem) — site.favicon
    apple-touch-icon.png       iOS home-screen icon (180×180, emblem on white)
    odisha-seal.png            the Government of Odisha state seal, transparent — used in the header "Regd." badge
    odisha-regd-badge.webp     full "Govt. of Odisha / Regd. No. 10/13" card with rounded transparent corners (not yet placed on a page)
    logo.svg                   old placeholder logo (unused)
  photos/
    vehicles/    wagonr-training-car.webp   maruti-800-training-car.webp
    training/    driving-lesson-instructor.webp   training-ground-wagonr.webp
    premises/    school-entrance.webp
    facilities/  classroom.webp   reception.webp
    events/      road-safety-week-gathering.webp   road-safety-week-group.webp
  decor/
    green-saffron-wave.webp    layered green + saffron ribbon (transparent) — bottom of the Home hero
    peacock-feather.webp       peacock feather (transparent) — corner of the Home contact section
  placeholders/
    avatar-1.svg … avatar-6.svg   reviewer stand-ins until real photos are uploaded
    no-image.svg                  fallback when an image path is empty
```

## Where each image is used
| Image | Used for |
|---|---|
| `photos/premises/school-entrance.webp` | Home hero, About hero, Gallery hero, social-share image (`site.ogImage`), Gallery "Our Premises" |
| `photos/training/training-ground-wagonr.webp` | Home About teaser, About story, Courses hero, Reviews hero, Gallery "Training" |
| `photos/vehicles/wagonr-training-car.webp` | Car Driving Course card, Gallery "Our Vehicles", Contact hero |
| `photos/vehicles/maruti-800-training-car.webp` | Small Car Driving Course card, Gallery "Our Vehicles" |
| `photos/training/driving-lesson-instructor.webp` | Courses "Training Highlights" photo, Gallery "Training" |
| `photos/facilities/classroom.webp`, `reception.webp` | Gallery "Facilities" |
| `photos/events/road-safety-week-*.webp` | Road Safety Week (Sadak Suraksha Saptaha) events — Gallery "Events" |
| `brand/odisha-seal.png` | Header "Govt. of Odisha / Regd. No. 10/13" badge (desktop + mobile menu) |
| `decor/green-saffron-wave.webp` | Home hero bottom edge |
| `decor/peacock-feather.webp` | Home contact section corner |

Photos are referenced from the content JSON (`content-seed/*.json`), so each can be swapped later from the admin panel.

## Rules
- Reference assets as `/assets/<folder>/<file>`.
- Use lowercase kebab-case file names without spaces.
- Real photos uploaded through the admin panel are **not** stored here. They go to the private repo's `data` branch under `media/…` and are served through `/api/media/…`.
- `next.config.ts` only allows `next/image` to load from `/assets/**` and `/api/media/**`.
- The tab icon is set from `site.favicon` (root layout `generateMetadata`); there is no `app/icon.*` file.
- Do not put secrets or private files in `public/` — everything in it is world-readable.

## Full-size originals and how the web versions are made
The untouched masters (about 2 MB each) are kept in **`assets-source/originals/`**. That folder is outside `public/`, so it is **not deployed or served**.

To regenerate every optimised file in `public/assets/` (photos → WebP ≤ 1600px wide, seal and badge cropped from the Odisha artwork, wave and feather trimmed to their visible edges):

```bash
node scripts/process-assets.mjs
```

To add a new photo: put the original in `assets-source/originals/`, add a line to the `photos` map in `scripts/process-assets.mjs`, run the script, then reference `/assets/photos/<folder>/<name>.webp` in the content JSON.
