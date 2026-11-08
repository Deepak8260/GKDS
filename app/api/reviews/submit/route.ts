import { getReviews } from '@/lib/content';
import { isGithubConfigured } from '@/lib/github';
import { createFile } from '@/lib/github-write';
import { clientIp, hashIp } from '@/lib/rate-limit';
import { reviewLimits } from '@/lib/review-limits';
import { findContactInfo, sanitizeText } from '@/lib/sanitize';
import { newId } from '@/lib/utils';
import { pendingReviewSchema, publicReviewSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const maxDuration = 15;

const MAX_BODY_BYTES = 8 * 1024;
const MIN_FILL_MS = 3000;
const NO_STORE = { 'Cache-Control': 'no-store' };

/** One generic message for anything that is not the visitor's fault or that we don't want to explain to bots. */
const GENERIC = 'Could not submit right now. Please try again later.';

function respond(body: Record<string, unknown>, status = 200, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...extra } });
}
const fail = (status: number, message = GENERIC, extra?: Record<string, unknown>, headers?: Record<string, string>) =>
  respond({ ok: false, message, ...extra }, status, headers);

/** Hosts the form may be posted from: this server's own host and the configured public site URL. */
function allowedHosts(request: Request): Set<string> {
  const hosts = new Set<string>();
  const host = request.headers.get('host');
  if (host) hosts.add(host.toLowerCase());
  try {
    if (process.env.NEXT_PUBLIC_SITE_URL) hosts.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).host.toLowerCase());
  } catch {
    /* ignore a malformed env value */
  }
  return hosts;
}

/**
 * POST /api/reviews/submit — public "Leave a Review" form.
 * Creates ONE pending file `submissions/reviews/<id>.json` on the data branch. It never touches
 * reviews.json, so concurrent submissions cannot conflict, and nothing is public until the admin approves it.
 */
export async function POST(request: Request) {
  // 1. JSON only, small, same-origin
  if (!(request.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) return fail(415);

  const origin = request.headers.get('origin');
  let originHost = '';
  try {
    originHost = origin ? new URL(origin).host.toLowerCase() : '';
  } catch {
    originHost = '';
  }
  if (!originHost || !allowedHosts(request).has(originHost)) return fail(403);

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return fail(413);
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return fail(413);

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400);
  }
  if (typeof json !== 'object' || json === null) return fail(400);

  // 2. Honeypot: bots fill the hidden field. Pretend it worked, store nothing.
  const honeypot = (json as { company?: unknown }).company;
  if (typeof honeypot === 'string' && honeypot.trim() !== '') return respond({ ok: true });

  // 3. Is the form open? (admin switch, prompt 14)
  try {
    if ((await getReviews()).acceptSubmissions === false) return fail(403, 'Reviews are currently closed.');
  } catch {
    /* content problems must not block submissions */
  }

  // 4. Validate (same schema as the browser)
  const parsed = publicReviewSchema.safeParse(json);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
    }
    return fail(400, 'Please check the highlighted fields.', { fieldErrors });
  }

  // 5. Too fast to be a person
  const elapsed = Date.now() - parsed.data.startedAt;
  if (elapsed < MIN_FILL_MS) return fail(400);

  // 6. Sanitise, then re-check what is left
  const name = sanitizeText(parsed.data.name, 60);
  const text = sanitizeText(parsed.data.text, 600);
  const recheck = publicReviewSchema.pick({ name: true, text: true }).safeParse({ name, text });
  if (!recheck.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of recheck.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return fail(400, 'Please check the highlighted fields.', { fieldErrors });
  }
  if (findContactInfo(`${name} ${text}`)) {
    return fail(400, 'Please check the highlighted fields.', {
      fieldErrors: { text: 'Please remove links, email addresses and phone numbers from your review.' },
    });
  }

  // 7. Rate limit (best-effort; see lib/rate-limit.ts)
  const ip = hashIp(clientIp(request.headers));
  const mine = reviewLimits.perIp.check(ip);
  const all = reviewLimits.global.check('global');
  if (!mine.allowed || !all.allowed) {
    const retryAfter = Math.max(mine.retryAfterSec, all.retryAfterSec, 1);
    return fail(429, 'Too many reviews were submitted. Please try again later.', undefined, {
      'Retry-After': String(retryAfter),
    });
  }

  // 8. Store as a pending file
  if (!isGithubConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[reviews] review dropped: GitHub not configured (local development)');
      return respond({ ok: true });
    }
    console.error('[reviews] GitHub is not configured; cannot store the review');
    return fail(503);
  }

  try {
    const id = newId();
    const pending = pendingReviewSchema.parse({
      id,
      name,
      rating: parsed.data.rating,
      text,
      phone: parsed.data.phone,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    });
    await createFile(`submissions/reviews/${id}.json`, `${JSON.stringify(pending, null, 2)}\n`, `review: new submission ${id}`);
    return respond({ ok: true });
  } catch (err) {
    // log the kind of failure only: never the token, repo or request details
    console.error('[reviews] could not store review:', err instanceof Error ? err.name : 'unknown error');
    return fail(502);
  }
}
