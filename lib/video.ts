/** YouTube link helpers. Videos are hosted on YouTube (free, handles streaming); the site only stores the link. */

const ID = /^[A-Za-z0-9_-]{11}$/;

/** The 11-character video id of a YouTube link (watch, youtu.be, shorts, live or embed), or null. */
export function youtubeId(value: string): string | null {
  try {
    const u = new URL(value.trim());
    if (u.protocol !== 'https:') return null;
    const host = u.hostname.replace(/^(www|m)\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0] ?? null;
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?]+)/);
      id = m ? m[1] : u.pathname === '/watch' ? u.searchParams.get('v') : null;
    }
    return id && ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const youtubeEmbedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
export const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** A video file shipped with the website, e.g. /assets/videos/driving-lesson.mp4 */
export function localVideoPath(value: string): string | null {
  const v = value.trim();
  return /^\/assets\/videos\/[A-Za-z0-9][A-Za-z0-9._-]*\.(mp4|webm)$/.test(v) ? v : null;
}

export type VideoSource = { kind: 'youtube'; id: string } | { kind: 'file'; src: string };

/** What a stored video link points at: a YouTube video or a video file on the site; null if it is neither. */
export function videoSource(value: string): VideoSource | null {
  const id = youtubeId(value);
  if (id) return { kind: 'youtube', id };
  const src = localVideoPath(value);
  return src ? { kind: 'file', src } : null;
}
