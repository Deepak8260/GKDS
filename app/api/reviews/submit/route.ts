import { revalidateTag } from 'next/cache';
import { getReviews, getSeed } from '@/lib/content';
import { isGithubConfigured } from '@/lib/github';
import { ConflictError, createFile, getFile, putJson } from '@/lib/github-write';
import { clientIp, hashIp } from '@/lib/rate-limit';
import { reviewLimits } from '@/lib/review-limits';
import { findContactInfo, sanitizeText } from '@/lib/sanitize';
import { newId } from '@/lib/utils';
import { publicReviewSchema, reviewsSchema } from '@/lib/validators';

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
const fail = (
  status: number,
  message = GENERIC,
  extra?: Record<string, unknown>,
  headers?: Record<string, string>,
) => respond({ ok: false, message, ...extra }, status, headers);

/** Hosts the form may be posted from: this server's own host and the configured public site URL. */
function allowedHosts(request: Request): Set<string> {
  const hosts = new Set<string>();
  const host = request.headers.get('host');
  if (host) hosts.add(host.toLowerCase());
  try {
    if (process.env.NEXT_PUBLIC_SITE_URL)
      hosts.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).host.toLowerCase());
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
  if (!(request.headers.get('content-type') ?? '').toLowerCase().includes('application/json'))
    return fail(415);

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
    if ((await getReviews()).acceptSubmissions === false)
      return fail(403, 'Reviews are currently closed.');
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
      fieldErrors: {
        text: 'Please remove links, email addresses and phone numbers from your review.',
      },
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

  // 8. Publish straight away: append to content/reviews.json on the data branch
  const hasGithub = isGithubConfigured();
  if (!hasGithub && process.env.NODE_ENV === 'production') {
    console.error('[reviews] GitHub is not configured; cannot store the review');
    return fail(503);
  }

  try {
    const id = newId();
    const review = {
      id,
      name,
      rating: parsed.data.rating,
      text,
      date: new Date().toISOString(),
      published: true,
      featured: false,
    };
    if (hasGithub) await appendReview(review);
    else await appendReviewLocally(review);

    // The phone number is optional and never public: keep it in a private file next to the review id
    if (parsed.data.phone && hasGithub) {
      const contact = { id, name, phone: parsed.data.phone, submittedAt: review.date };
      await createFile(
        `submissions/reviews/${id}.json`,
        `${JSON.stringify(contact, null, 2)}
`,
        `review: contact for ${id}`,
      ).catch(() => {});
    }

    revalidateTag('content', { expire: 0 });
    revalidateTag('content:reviews', { expire: 0 });
    return respond({ ok: true });
  } catch (err) {
    // log the kind of failure only: never the token, repo or request details
    console.error(
      '[reviews] could not store review:',
      err instanceof Error ? err.name : 'unknown error',
    );
    return fail(502);
  }
}

type NewReview = {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  published: boolean;
  featured: boolean;
};

/** Add one review to reviews.json. Re-reads and retries when someone else saved at the same moment. */
async function appendReview(review: NewReview) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const file = await getFile('content/reviews.json');
    let doc: Record<string, unknown>;
    if (file) {
      doc = JSON.parse(file.text) as Record<string, unknown>;
    } else {
      doc = { ...getSeed('reviews') } as Record<string, unknown>;
    }
    const items = Array.isArray(doc.items) ? (doc.items as unknown[]) : [];
    if (items.length >= 1000) throw new Error('review limit reached');
    const next = { ...doc, items: [...items, review] };
    reviewsSchema.parse(next);
    try {
      await putJson('content/reviews.json', next, {
        sha: file?.sha ?? null,
        message: `review: new review ${review.id}`,
      });
      return;
    } catch (err) {
      if (err instanceof ConflictError && attempt < 3) continue;
      throw err;
    }
  }
}

/** Local development without GitHub: write into the bundled seed so the review shows up while testing. */
async function appendReviewLocally(review: NewReview) {
  const { readFile, writeFile } = await import('node:fs/promises');
  const path = `${process.cwd()}/content-seed/reviews.json`;
  const doc = JSON.parse(await readFile(path, 'utf8')) as { items: unknown[] };
  doc.items.push(review);
  reviewsSchema.parse(doc);
  await writeFile(
    path,
    `${JSON.stringify(doc, null, 2)}
`,
    'utf8',
  );
  console.warn(
    '[reviews] GitHub not configured: review saved to content-seed/reviews.json (local development only)',
  );
}
