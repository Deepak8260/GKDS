# PROMPT 10 — Admin: access-code login, shell, GitHub write layer, shared admin kit

**Attach:** nothing.
**Prerequisite:** CONTEXT BLOCK pasted; the public site (prompts 01–09) is complete.

## Goal
Build the foundation of the admin panel. The admin is reachable at **both `/admin` and `/malika`** (identical panel). It is protected by an **access code** (default `gkds1993` from `ADMIN_CODE`, changeable from the admin's Security page and then stored as a salted hash in `config/admin.json` on the `data` branch). Everything is edited through the UI; the only persistence is the `data` branch of the private repo. Visual language = same tokens/fonts as the public site (green + orange + cream, rounded cards) but with an app-style layout.

## 1. URLs and routing
- Single route tree `app/admin/**`. In `next.config` add `rewrites()` mapping `/malika` → `/admin` and `/malika/:path*` → `/admin/:path*`. Middleware, cookies and APIs must treat both prefixes identically.
- `useAdminBase()` (client) / `getAdminBase()` (server, from the request pathname) returns `/admin` or `/malika`, whichever the user entered with; **every internal admin link/redirect is built with it**, so users never bounce between the two prefixes. API calls always go to `/api/admin/*`.
- Unauthenticated visit to `/admin`, `/malika` or any subpath → redirect to `<base>/login?next=<path>`. After login redirect to `next` (validated to be a relative admin path) or `<base>`.
- Admin pages: `noindex,nofollow`, `export const dynamic = 'force-dynamic'`, `Cache-Control: no-store`.

## 2. Authentication (`lib/auth/`)
- **Login screen** (`<base>/login`): centered card on cream, school logo + "Admin Panel", ONE input "Enter access code" (type password, show/hide eye toggle, autofocus, Enter submits), orange "Unlock" button, generic error "Incorrect code. Please try again.", lockout message "Too many attempts. Try again in N minutes." No username, no "forgot" link (recovery is via env var, documented in help).
- **Code source (priority order)**: (1) if `config/admin.json` exists on the data branch (and `ADMIN_CODE_RESET` is not `1`) → verify against its salted **scrypt** hash (`crypto.scrypt`, 16-byte salt, 64-byte key, params N=2^15); (2) otherwise compare with env `ADMIN_CODE` (default `gkds1993`). All comparisons via `crypto.timingSafeEqual` on equal-length buffers (hash both sides first for the env compare). The code may be any string of 4–64 characters. Never log or persist the plaintext code.
- **Session**: on success issue a JWT (`jose`, HS256, secret `ADMIN_JWT_SECRET`, claims `{sub:'admin', sv: sessionVersion, iat, exp: 12h}`) in cookie `gkds_admin` — `httpOnly`, `Secure` (in production), `SameSite=Strict`, `Path=/`, `Max-Age=43200`. Logout (`POST /api/admin/logout`) clears it.
- **middleware.ts**: matches `/admin/:path*`, `/malika/:path*`, `/api/admin/:path*`; allows login pages and `POST /api/admin/login`; verifies the JWT signature/expiry (Edge-safe, `jose`); pages redirect, APIs return 401 JSON. Admin API handlers and the admin layout ALSO call `requireAdmin()` (defence in depth) which additionally compares the token's `sv` with the current `sessionVersion` from `config/admin.json` (cached ≤ 30 s; absent file ⇒ version 0). Changing the code bumps the version and thereby signs out every other device.
- **Brute-force protection**: per-IP limiter (in-memory) with progressive delay (0.5 s, 1 s, 2 s, 4 s…) and **lockout of 15 minutes after 5 failed attempts**; global cap of 30 failures/hour; always the same generic error. Log failed attempts (IP hash only, no code).
- **CSRF**: all mutating admin requests (`POST/PUT/PATCH/DELETE`) must send header `x-requested-with: gkds-admin` and pass an `Origin`/`Sec-Fetch-Site: same-origin` check, in addition to `SameSite=Strict`.
- **Recovery**: if `ADMIN_CODE_RESET=1` is set in the environment, login ignores `config/admin.json` and accepts `ADMIN_CODE` again. Document it in the Help page and `docs/DEPLOYMENT.md`.
- **Security page** (`<base>/security`): section "Change access code" — fields *Current code*, *New code* (4–64 chars, any characters; show a strength meter with a warning, not a block, for short/simple codes such as digits-only <6), *Confirm new code*. On save (`POST /api/admin/security/code`): verify current code (rate limited), write `config/admin.json` `{hash, salt, updatedAt, sessionVersion: old+1}` via the write layer (create or update with sha), re-issue the caller's cookie with the new `sv`, toast "Access code updated. Other devices were signed out." Also show "Last changed: <date or 'never (using default from environment)'>" and a **"Sign out everywhere"** button (bumps `sessionVersion` only). A callout reminds: "Using `/malika` or `/admin` makes no difference — the access code is what protects the panel."

## 3. Admin shell (`app/admin/layout.tsx` + `components/admin/`)
- Left **sidebar** (260px, collapses into a slide-over drawer < `lg` with a hamburger in the top bar): logo block, then nav items with lucide icons — Dashboard, Site Settings, Home Page, About Page, Courses, Gallery, Media Library, Reviews (with pending-count badge), Security, Help. Active item = orange-50 background + orange text + left orange bar. Footer of sidebar: "View website ↗" and "Sign out".
- **Top bar**: page title, breadcrumb, "View website" (opens `/` in a new tab), Logout, and a small connection indicator dot (green = GitHub OK).
- Background `cream`, content area max-w 1100px, cards white `rounded-2xl` with `line` border; buttons use the same `Button` component as the site.
- Global admin UX: toast system (success/error/info with auto-dismiss, `aria-live`), confirm dialog component (`useConfirm()` promise-based, with optional "type the name to confirm"), unsaved-changes guard (`beforeunload` + in-app navigation prompt), skeleton loaders, error boundary per page, loading states on every button.
- Responsive and keyboard accessible; works on a phone (the owner will edit from a mobile).

## 4. GitHub write layer (`lib/github-write.ts`, `server-only`; extends prompt 07's createFile)
- `getFile(path)` → `{content(string|Buffer), sha}` | null; `putJson(path, data, {sha?, message})` (create or update; JSON stringified with 2-space indent + trailing newline); `putBinary(path, buffer, {message})`; `deleteFile(path, sha, message)`; `listDir(path)`; `getCommits(path?, limit)`.
- **Optimistic concurrency**: updates send the last known `sha`; on 409/422 re-fetch and throw `ConflictError` with the latest content so the UI can say "This was changed elsewhere. Reload latest?" — never silently overwrite.
- Commit message convention `admin: update courses.json`, `admin: upload media/gallery/<file>`, `admin: delete …`; commit author from `GIT_COMMIT_NAME`/`GIT_COMMIT_EMAIL` if set (default "GKDS Admin <admin@gkds.local>").
- Retry with exponential backoff (max 3) on network/5xx and on secondary-rate-limit 403 (`retry-after`); surface friendly errors.
- After every successful write call `revalidateTag('content')` and `revalidateTag('content:<name>')` so the site updates within seconds.
- All content writes are validated with the zod schemas from prompt 02 BEFORE committing; invalid → 422 with `{errors: Record<path, message>}`.
- A write queue serialises writes to the same path within one server instance.

## 5. Generic content API (`app/api/admin/content/[name]/route.ts`)
Whitelist `site|home|about|courses|gallery|reviews`. `GET` → `{data, sha, updatedAt}` (reads from GitHub with `cache: 'no-store'`, falls back to the seed with `sha: null` if the file doesn't exist yet — then the first save creates it). `PUT {data, sha}` → validate → commit → revalidate → `{ok, sha, updatedAt}`. `requireAdmin()` + CSRF checks on every call.

## 6. Reusable admin building blocks (`components/admin/`) — used by every later admin prompt
`useAdminResource(name)` (load, local draft state, dirty detection, `save()`, conflict handling, error mapping to fields), `AdminPageHeader` (title, description, actions), `FormSection` (titled white card), `TextField`, `TextArea` (with character counter), `NumberField`, `SelectField`, `Toggle`, `UrlField`, `IconPicker` (searchable grid of the whitelist from prompt 01 with preview), `ImageField` (shows current image thumbnail, alt-text input, "Choose / Upload" button — upload pipeline implemented in prompt 13; for now accept a stub returning a placeholder path), `RepeaterField` (add / remove / reorder with drag handle **and** up/down buttons for accessibility; supports item templates), `Accordion`, `Tabs`, `SaveBar` (sticky bottom bar: "You have unsaved changes · Discard · **Save changes**", disabled when clean, spinner while saving), `EmptyState`, `StatusPill`.

## 7. Dashboard (`<base>`) — first version
Cards: Courses (count), Gallery photos (count, published), Published reviews, **Pending reviews** (count, links to Reviews), "Last content update" (latest commit date on the data branch). **GitHub health check card**: token valid, repo reachable, branch `data` exists, API rate-limit remaining, each with ✓/✗ and a "Re-check" button. Quick links grid to each editor. (Prompt 15 enriches it.)

## 8. Security notes (implement)
Never expose `GITHUB_TOKEN`/secrets to the client; admin handlers set `Cache-Control: no-store`; no admin route is cacheable by CDN; sanitise error messages; `config/` and `submissions/` are never served by the media proxy or generic content API; add a code comment that `/malika` is only an alias.

## Tests
Vitest: scrypt hash/verify, env fallback vs file precedence, `ADMIN_CODE_RESET`, lockout timing, `sessionVersion` mismatch rejection, CSRF guard, path whitelist for the content API. Playwright: login at `/admin` and `/malika` with `gkds1993`, wrong code error, redirect when logged out, logout.

## Acceptance checklist
- [ ] `gkds1993` logs in at **both** `/admin/login` and `/malika/login`; wrong code shows the generic error; 5 failures lock out for 15 minutes.
- [ ] Logged-out access to `/admin/*`, `/malika/*`, `/api/admin/*` → redirect / 401.
- [ ] Security page changes the code: old code stops working, new works, other sessions are logged out, current session stays logged in; `config/admin.json` appears in the data branch with a hash (no plaintext). `ADMIN_CODE_RESET=1` restores env-code login.
- [ ] Dashboard counts and health check show live data; a temporary "Write test" button commits a file to the data branch (remove it before finishing) and the change is visible on GitHub.
- [ ] Sidebar/drawer works on mobile; links preserve the prefix you entered with.
- [ ] `lint`, `typecheck`, tests, `build` pass.
