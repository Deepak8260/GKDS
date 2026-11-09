# Data repository setup (GitHub as the database)

The website has **no database**. All content lives as plain files in the **same private GitHub repo** as the code, on a separate **orphan branch called `data`**:

| Branch | Contains | Deployed by Vercel? |
|---|---|---|
| `main` | The website code (and `content-seed/` fallback files) | Yes (production) |
| `data` | Only content, images and private review contact files — **never code** | **No** (disabled in `vercel.json`) |

Because Vercel does not build the `data` branch, saving something in the admin never triggers a redeploy.

## Folder structure on the `data` branch

```
README.md
content/
  site.json  home.json  about.json  courses.json  gallery.json  reviews.json
  or/<same names>.json                                 (Odia translations saved in the admin → Translations; optional)
media/
  branding/  pages/  courses/  gallery/  avatars/      (WebP images, content-hashed names)
submissions/
  reviews/<id>.json                                    (a visitor's optional phone number for one review: private, admin-only)
config/
  admin.json                                           (salted hash of the admin access code — never public)
```

Files appear on the branch as they are first used. The site runs fine if `content/*.json` is missing — it falls back to the bundled `content-seed/` files.

## One-time setup

1. **Create the repo** on GitHub: `gkds`, **Private**. Do not add a README/licence (keeps it empty).
2. **Push the code to `main`:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/gkds.git
   git push -u origin main
   ```
3. **Create a fine-grained token** (GitHub → Settings → Developer settings → Personal access tokens → *Fine-grained tokens* → Generate):
   - Repository access: **Only select repositories → `gkds`**
   - Repository permissions: **Contents: Read and write**, **Metadata: Read-only**
   - Expiration: 1 year (add a calendar reminder to rotate it).
4. **Put the values in `.env.local`** (local) and later in Vercel → Project → Settings → Environment Variables:
   ```
   GITHUB_TOKEN=github_pat_xxx
   GITHUB_OWNER=<your-username>
   GITHUB_REPO=gkds
   GITHUB_BRANCH=data
   REVALIDATE_SECRET=<any long random string>
   ```
5. **Create the `data` branch and upload the starter content** — one command does both:
   ```bash
   node scripts/push-seed.mjs
   ```
   - It creates the orphan `data` branch if needed and uploads `content-seed/*.json` to `content/`.
   - It **never overwrites** files that already exist (so it cannot erase admin edits). Use `--overwrite` to deliberately reset them, or `--dry-run` to preview.

   *Manual alternative (without the script):*
   ```bash
   git checkout --orphan data
   git rm -rf .
   mkdir content && git show main:content-seed/site.json > content/site.json   # repeat for the other five files
   git add content && git commit -m "chore: create data branch"
   git push -u origin data
   git checkout main
   ```
6. **Vercel:** `vercel.json` already contains `{"git":{"deploymentEnabled":{"data":false}}}` so pushes to `data` are ignored. After your first deploy, save something in the admin and confirm Vercel shows **no** new deployment.

## How the site reads and refreshes content

- Pages read `content/<name>.json` from the `data` branch through the GitHub API, cached with Next.js tags (`content`, `content:<name>`) for up to one hour.
- Saving in the admin refreshes the cache immediately. To refresh manually after editing a file on GitHub:
  ```bash
  curl -X POST https://<your-domain>/api/revalidate \
    -H "x-revalidate-secret: <REVALIDATE_SECRET>"
  # or one document only:
  curl -X POST https://<your-domain>/api/revalidate \
    -H "x-revalidate-secret: <REVALIDATE_SECRET>" -H "Content-Type: application/json" \
    -d '{"tag":"content:courses"}'
  ```
- If GitHub is unreachable, the token is wrong, a file is missing or contains invalid JSON, the site **safely falls back to the bundled seed content** and logs a warning on the server.

## Reviews

A review posted on the public form is added straight to `content/reviews.json` (there is no approval queue). Its optional photo goes to `media/reviews/<id>.webp`, and an optional phone number to the private file `submissions/reviews/<id>.json`, which only the admin panel reads. In the admin you can edit, hide, feature or delete reviews.

## Images

The repo is private, so images are served through the site at `/api/media/media/<folder>/<file>.webp`. The route fetches the file from GitHub with the server-side token and returns it with a one-year immutable cache header, so GitHub is rarely contacted again.

## Backups

`git clone --mirror https://github.com/<you>/gkds.git` backs up code **and** the `data` branch. Every admin save is a commit, so older versions of any content file can be restored from GitHub history or from the **History** button in each admin editor. **Dashboard → Download backup** gives a ZIP of all page text and settings.

## Odia language

The public site exists in English (`/`, `/about`, …) and Odia (`/or`, `/or/about`, …). Fixed words (menus, buttons, form messages) live in `lib/i18n/dict.ts` and `dict-or.ts`. Editable page text is translated in **Admin → Translations**; those lines are saved as `content/or/<name>.json` on the `data` branch and win over the translations bundled in `content-seed/or/`. A line with no Odia text shows in English on the Odia site. Visitors' reviews are never translated. The choice is remembered in the `gkds_lang` cookie (new visitors get a one-time "English or Odia?" question; returning Odia readers are redirected to `/or`). Have a native Odia speaker proofread the bundled wording.
