# Putting the website online (Vercel + GitHub)

This guide is written for the school owner, not for programmers. Follow the steps in order. Every step says **what to click** and **how to check it worked**.

**What you are building**

```
 Visitor's phone or computer
            │
            ▼
   Vercel  (runs the website)  ◄────────────  GitHub branch "main"   = the website's code
            │
            ▼
   GitHub branch "data"        = your pictures, texts, reviews (saved by the admin panel)
```

* **`main`** is the code. Vercel builds it when it changes.
* **`data`** is your content. Every save in the admin panel adds a small commit here. **Vercel never builds this branch**, so saving a text does not redeploy the site: the change shows up within seconds.

> **Golden rule:** put code on `main` only. Never commit code to the `data` branch, and never set `GITHUB_BRANCH=main`.

---

## Before you start

You need: a GitHub account, a Vercel account (free "Hobby" plan is enough), and about 30 minutes.

> **Private repositories and the free plan:** Vercel's free Hobby plan can deploy a *private* repository only when it belongs to your **personal** GitHub account. A repository owned by a GitHub *organisation* needs a paid Vercel plan.

---

## Step 1: Create the private repository and upload the code

1. On GitHub press **+ → New repository**.
2. Name: `gkds`. Choose **Private**. Do **not** add a README. Press **Create repository**.
3. On your computer, in the project folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/gkds.git
   git push -u origin main
   ```
4. ✅ **Check:** the repository page shows your files on the `main` branch.

## Step 2: Create the `data` branch with the starter content

The easy way (recommended). From the project folder:

```bash
node scripts/push-seed.mjs --dry-run     # shows what would happen
node scripts/push-seed.mjs               # does it
```

It needs the three values from step 3 in a file called `.env.local` (copy `.env.example`). It creates the `data` branch and uploads the six content files to `content/`. It never overwrites files that already exist.

The manual way (no script):

```bash
git checkout --orphan data
git rm -rf .
mkdir content
git show main:content-seed/site.json > content/site.json      # repeat for home, about, courses, gallery, reviews
git add content
git commit -m "chore: create data branch"
git push -u origin data
git checkout main
```

✅ **Check:** on GitHub, switch the branch picker to `data`: you see a `content` folder with six `.json` files.

> **If you created `data` by "branching from main"** (so it also contains the code): it still works, because `vercel.json` stops Vercel from building `data`. But it is untidy, and your own code pushes can collide with the website's saves. Keep working on `main`, and ideally recreate `data` with the commands above.

## Step 3: Create the GitHub token (the website's key to your repository)

1. GitHub → your picture (top right) → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Name: `gkds website`. **Expiration: 1 year** (put a reminder in your calendar for 11 months).
3. **Repository access:** *Only select repositories* → choose `gkds`.
4. **Permissions → Repository permissions:** **Contents: Read and write**, and **Metadata: Read-only**.
5. Press **Generate token** and copy it (it starts with `github_pat_`). You cannot see it again.

✅ **Check:** the token page lists only the `gkds` repository.

## Step 4: Import the project into Vercel

1. Vercel → **Add New… → Project**.
2. Pick the `gkds` repository → **Import**.
3. Framework: **Next.js** (detected automatically). Node.js version: **20 or newer**. Production branch: **`main`**.
4. **Do not press Deploy yet.** First add the variables in step 5.

## Step 5: Environment variables

Vercel → your project → **Settings → Environment Variables**. Add each one for **Production** (and Preview if you use previews).

| Name | Value | Notes |
|---|---|---|
| `GITHUB_TOKEN` | the `github_pat_…` token from step 3 | secret |
| `GITHUB_OWNER` | your GitHub username | |
| `GITHUB_REPO` | `gkds` | repository name only, not the web address |
| `GITHUB_BRANCH` | `data` | never `main` |
| `ADMIN_CODE` | **your own secret code** | replaces the default `gkds1993` |
| `ADMIN_JWT_SECRET` | a long random text | create one with `openssl rand -base64 32`, or any password generator (40+ characters) |
| `NEXT_PUBLIC_SITE_URL` | `https://www.yourschool.in` | the final address, with `https://`, no `/` at the end |
| `REVALIDATE_SECRET` | any long random text | lets you refresh the cache by hand |
| `GIT_COMMIT_NAME`, `GIT_COMMIT_EMAIL` | optional | the author name shown on the website's commits |

> **Changing a variable later needs a redeploy:** Vercel → **Deployments** → the latest one → **⋯ → Redeploy**.

> **Safety net:** before every production build the project checks that the required variables exist. If something is missing the build stops with a plain list of what to add, so a half-set-up website is never published. (Developers can build without them using `ALLOW_SEED_ONLY=1`; the site then shows its built-in content and the admin cannot save.)

Now press **Deploy**.

✅ **Check:** the deployment turns green and your `*.vercel.app` address shows the website.

## Step 6: Confirm that the `data` branch never triggers a build

`vercel.json` already tells Vercel to ignore the `data` branch:

```json
{ "git": { "deploymentEnabled": { "data": false } } }
```

Test it: open `/admin`, change something small (for example a tagline), press **Save changes**. Then look at Vercel → **Deployments**.

✅ **Check:** there is **no new deployment**, and yet the change is visible on the website within a few seconds.

## Step 7: Your own domain

1. Vercel → **Settings → Domains → Add** → type your domain, for example `yourschool.in`.
2. Vercel shows DNS records. At your domain provider add exactly those: usually an **A record** `76.76.21.21` for the bare domain and a **CNAME** `cname.vercel-dns.com` for `www`.
3. Wait (minutes to a few hours). HTTPS is switched on automatically.
4. Choose which one is the main address (for example `www.yourschool.in`); Vercel redirects the other to it.
5. Set `NEXT_PUBLIC_SITE_URL` to the main address (with `https://`) and **redeploy**.

✅ **Check:** `https://www.yourschool.in` opens with a padlock, and `http://` and the other spelling redirect to it.

## Step 8: First login and first clean-up

1. Open `https://<your-domain>/admin` (or `/malika`: it is exactly the same panel).
2. Enter your `ADMIN_CODE`.
3. Open **Security** and choose a new access code. (From then on the code you set in the panel is used; other devices are signed out.)
4. Open the **Dashboard**. The **"Needs attention"** list and the **launch checklist** show what is left to do. Typically:
   * **Site Settings:** real phone numbers, WhatsApp number, address and landmark, Google Map, social links.
   * Upload your real **logo** (Site Settings → Brand).
   * **Gallery:** upload your photos and describe each one.
5. Press **Refresh website cache** if anything looks old.

## Step 9: If you forget the access code

1. Vercel → **Settings → Environment Variables**: add `ADMIN_CODE_RESET` = `1`.
2. **Redeploy.**
3. Log in with the `ADMIN_CODE` value from step 5.
4. Open **Security** and choose a new code.
5. **Delete** the `ADMIN_CODE_RESET` variable and **redeploy** again.

## Step 10: Looking after the website

**Rotate the GitHub token** (before it expires, the Dashboard warns you 14 days ahead): create a new token (step 3) → put it in Vercel as `GITHUB_TOKEN` → redeploy → delete the old token on GitHub.

**Backups**
* In the admin panel: **Dashboard → Download backup** (a ZIP of all page text and settings).
* Everything including pictures: `git clone --mirror https://github.com/<you>/gkds.git` on your computer now and then.

**Go back to an older version**
* In any editor press **History**, pick a version, **Restore this version**, then **Save changes** (it is saved as a new version; nothing is ever erased).
* Or restore a whole backup ZIP: Dashboard → *Restore from a backup*.
* Or use GitHub's own history on the `data` branch.

**GitHub request limits:** GitHub allows 5,000 requests per hour for the token. The website caches everything, so normal use is far below that. The Dashboard's *GitHub connection* card shows how many are left.

**Keep the repository small:** upload photos through the admin panel (they are shrunk automatically), delete unused ones in the **Media Library**, and stay well below 1 GB.

**If a Vercel build fails:** open the failed deployment → **Build Logs**. A box starting with `[check-env]` lists missing variables. Add them and redeploy.

## Step 11: Troubleshooting

| What you see | Likely cause | What to do |
|---|---|---|
| The website shows the default pictures and texts, and admin saving says "GitHub is not connected" | `GITHUB_*` variables missing or the token is invalid | Check step 5; Dashboard → *GitHub connection* tells you which row is red |
| Saving in the admin fails ("Please sign in again" or a GitHub error) | The token has expired | Create a new token (step 10) |
| Pictures show as broken (404) | The picture is not on the `data` branch, or `GITHUB_BRANCH` is wrong | Make sure `GITHUB_BRANCH=data`; re-upload the picture |
| A change is saved but the website still shows the old text | Cache | Dashboard → **Refresh website cache**, then reload |
| Login says "Too many attempts" | 5 wrong codes in a row | Wait 15 minutes |
| Cannot log in at all | Forgotten code | Step 9 |
| Every admin save starts a new Vercel deployment | `GITHUB_BRANCH` is `main`, or `vercel.json` is missing | Set it to `data`; keep `vercel.json` |
| "Reviews are currently closed" on the website | The switch is off | Admin → Reviews → *Summary & page settings* → *Accept new reviews from visitors* |
| Google or WhatsApp show a wrong web address | `NEXT_PUBLIC_SITE_URL` is missing or wrong | Fix it (step 5) and redeploy |
| Build stops with `[check-env]` | A required variable is missing | Add what the list says and redeploy |

---

*Reference:* `docs/DATA_REPO.md` explains how the `data` branch is organised. `docs/QA_REPORT.md` lists what was tested and the known limits.
