import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { contentNames } from '@/lib/validators';

export const runtime = 'nodejs';

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

const ALLOWED_TAGS = new Set<string>(['content', ...contentNames.map((n) => `content:${n}`)]);

/**
 * Manual cache refresh: POST with header `x-revalidate-secret: $REVALIDATE_SECRET`
 * and optional JSON body `{ "tag": "content:courses" }` (default: everything under "content").
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const provided = request.headers.get('x-revalidate-secret') ?? '';
  if (!secret || !safeEqual(provided, secret)) {
    return Response.json({ revalidated: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  let tag = 'content';
  try {
    const body = (await request.json()) as { tag?: unknown };
    if (typeof body.tag === 'string' && ALLOWED_TAGS.has(body.tag)) tag = body.tag;
  } catch {
    // no/invalid body: use the default tag
  }

  revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: true, tag }, { headers: { 'Cache-Control': 'no-store' } });
}
