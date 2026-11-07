# Static assets

Every bundled image lives in **`public/assets/`**. Next.js serves the `public/` folder at the site root, so a file at `public/assets/brand/logo.svg` is reached in code and in content JSON as **`/assets/brand/logo.svg`**.

```
public/assets/
  brand/
    krishna-golden-flute.png   Krishna with the golden flute emblem (transparent PNG, 1254×1254) — site logo
    favicon.png                browser-tab icon (128×128, cropped from the emblem) — site.favicon
    apple-touch-icon.png       iOS home-screen icon (180×180, emblem on white)
    logo.svg                   old placeholder logo (unused)
  placeholders/                stand-in images used until real photos are uploaded
    hero-building.svg  car-wagonr.svg  car-maruti800.svg  training.svg  classroom.svg
    avatar-1.svg … avatar-6.svg  peacock.svg  road.svg
```

## Rules
- Reference assets as `/assets/<folder>/<file>` (never `/brand/…` or `/placeholders/…`).
- Use lowercase kebab-case file names without spaces (`krishna-golden-flute.png`).
- Put new brand files in `brand/`, temporary stand-ins in `placeholders/`.
- Real photos uploaded through the admin panel are **not** stored here. They go to the private repo's `data` branch under `media/…` and are served through `/api/media/…`.
- The tab icon is set from `site.favicon` (root layout `generateMetadata`), so it also lives in `public/assets/brand/`; there is no `app/icon.*` file.
- `next.config.ts` only allows `next/image` to load from `/assets/**` and `/api/media/**`. A new top-level folder under `public/` would need to be added there.
- Do not put secrets or private files in `public/` — everything in it is world-readable.

## Using the Krishna emblem
```tsx
<Image src="/assets/brand/krishna-golden-flute.png" alt="Krishna playing the golden flute" width={56} height={56} />
```
To use it as the site logo, change `logo` (and `favicon`) in `content-seed/site.json` (or later in the admin Site Settings) to `/assets/brand/krishna-golden-flute.png`.
