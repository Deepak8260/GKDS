import aboutSeed from '@/content-seed/about.json';
import homeSeed from '@/content-seed/home.json';
import siteSeed from '@/content-seed/site.json';

/** Bundled default content, used by "Reset section to default" in the editors (safe for the browser). */
export const DEFAULTS = { site: siteSeed, home: homeSeed, about: aboutSeed } as const;
