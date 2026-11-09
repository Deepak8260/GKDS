import { describe, expect, it } from 'vitest';
import { galleryVideoSchema } from '@/lib/validators/gallery';
import { homeSchema } from '@/lib/validators/home';
import { videoSource, youtubeId } from '@/lib/video';
import seedHome from '@/content-seed/home.json';
import seedGallery from '@/content-seed/gallery.json';
import { gallerySchema } from '@/lib/validators/gallery';

const ID = 'dQw4w9WgXcQ';

describe('youtubeId', () => {
  it('reads every common kind of YouTube link', () => {
    for (const url of [
      `https://www.youtube.com/watch?v=${ID}`,
      `https://youtube.com/watch?v=${ID}&t=42s`,
      `https://m.youtube.com/watch?v=${ID}`,
      `https://youtu.be/${ID}?si=abc`,
      `https://www.youtube.com/shorts/${ID}`,
      `https://www.youtube.com/embed/${ID}`,
      `https://www.youtube-nocookie.com/embed/${ID}`,
      `  https://www.youtube.com/live/${ID}  `,
    ]) {
      expect(youtubeId(url), url).toBe(ID);
    }
  });

  it('rejects everything else (other sites, http, bad ids, scripts)', () => {
    for (const url of ['', 'not a url', `http://www.youtube.com/watch?v=${ID}`, `https://evil.com/watch?v=${ID}`, `https://www.youtube.com.evil.com/watch?v=${ID}`, 'https://www.youtube.com/watch?v=short', 'https://www.youtube.com/', 'javascript:alert(1)', `https://vimeo.com/${ID}`]) {
      expect(youtubeId(url), url).toBeNull();
    }
  });
});

describe('video content', () => {
  it('the bundled content is valid and shows no video until one is added', () => {
    expect(homeSchema.safeParse(seedHome).success).toBe(true);
    expect(gallerySchema.safeParse(seedGallery).success).toBe(true);
    expect(seedHome.ownerMessage.videoUrl).toBe('');
  });

  it('content saved before these sections existed stays valid', () => {
    const { ownerMessage: _o, ...oldHome } = seedHome;
    const { videos: _v, videosTitle: _t, videosSubtitle: _s, ...oldGallery } = seedGallery;
    expect(homeSchema.safeParse(oldHome).success).toBe(true);
    expect(gallerySchema.safeParse(oldGallery).success).toBe(true);
  });

  it('a gallery video needs a real YouTube link and a title', () => {
    const ok = { id: 'v1', url: `https://youtu.be/${ID}`, title: 'Reverse parking', published: true };
    expect(galleryVideoSchema.safeParse(ok).success).toBe(true);
    expect(galleryVideoSchema.safeParse({ ...ok, url: 'https://example.com/x.mp4' }).success).toBe(false);
    expect(galleryVideoSchema.safeParse({ ...ok, title: ' ' }).success).toBe(false);
  });

  it('the owner video link may be empty, but never a non-YouTube link', () => {
    const ok = { ...seedHome, ownerMessage: { ...seedHome.ownerMessage, videoUrl: `https://youtu.be/${ID}` } };
    expect(homeSchema.safeParse(ok).success).toBe(true);
    expect(homeSchema.safeParse({ ...seedHome, ownerMessage: { ...seedHome.ownerMessage, videoUrl: 'https://example.com/a.mp4' } }).success).toBe(false);
  });
});

describe('videoSource', () => {
  it('accepts YouTube links and video files shipped under /assets/videos, nothing else', () => {
    expect(videoSource(`https://youtu.be/${ID}`)).toEqual({ kind: 'youtube', id: ID });
    expect(videoSource('/assets/videos/driving-lesson.mp4')).toEqual({ kind: 'file', src: '/assets/videos/driving-lesson.mp4' });
    for (const bad of ['/assets/videos/../secret.mp4', '/assets/videos/x.exe', '//evil.com/a.mp4', 'https://example.com/a.mp4', '/other/a.mp4', '/assets/videos/']) {
      expect(videoSource(bad), bad).toBeNull();
    }
  });
});
