import type { Courses, Gallery, Reviews, Site } from '@/lib/validators';

/** Pure checks that power the dashboard: "needs attention" warnings and the launch checklist. */

export interface Attention {
  id: string;
  severity: 'warning' | 'info';
  message: string;
  /** Admin page (without the /admin or /malika prefix), e.g. "/settings". */
  href: string;
  action: string;
}

export interface CheckItem {
  id: string;
  label: string;
  done: boolean;
  href: string;
  /** What to do when it is not done. */
  todo: string;
}

export interface ReadinessInput {
  site: Site;
  courses: Courses;
  gallery: Gallery;
  reviews: Reviews;
  /** config/admin.json exists on the data branch (the access code was changed in the panel). */
  hasStoredCode: boolean;
  /** ADMIN_CODE is not set, or still the shipped default. */
  envCodeIsDefault: boolean;
  siteUrlSet: boolean;
  githubConnected: boolean;
}

export const GENERIC_SOCIAL = /^https?:\/\/(www\.)?(youtube\.com|facebook\.com|instagram\.com)\/?$/i;

/** A phone/WhatsApp value that still holds placeholder characters (X) or has too few digits. */
export function isPlaceholderPhone(value: string): boolean {
  if (/x/i.test(value)) return true;
  return value.replace(/\D/g, '').length < 10;
}

export function isPlaceholderImage(path: string): boolean {
  return !path.trim() || path.includes('/placeholders/') || /no-image/.test(path);
}

export function isPlaceholderEmail(email: string): boolean {
  return !email.trim() || /@(example\.|test\.|localhost)/i.test(email) || /^(info|admin|contact)@gkds\.local$/i.test(email);
}

export function isPlaceholderMap(embed: string): boolean {
  return !embed.trim() || /placeholder|example/i.test(embed);
}

const hasRealPhone = (site: Site) => site.phones.length > 0 && site.phones.every((p) => !isPlaceholderPhone(p));

export function computeAttention(i: ReadinessInput): Attention[] {
  const out: Attention[] = [];
  const { site, gallery, courses } = i;

  if (!i.hasStoredCode && i.envCodeIsDefault) {
    out.push({ id: 'default-code', severity: 'warning', message: 'You are still using the default access code (gkds1993). Anyone who knows it can log in.', href: '/security', action: 'Change the access code' });
  }
  if (!hasRealPhone(site)) {
    out.push({ id: 'phones', severity: 'warning', message: 'Some phone numbers are still placeholders.', href: '/settings', action: 'Edit phone numbers' });
  }
  if (isPlaceholderPhone(site.whatsapp)) {
    out.push({ id: 'whatsapp', severity: 'warning', message: 'The WhatsApp number is still a placeholder.', href: '/settings', action: 'Edit the WhatsApp number' });
  }
  if (isPlaceholderMap(site.map.embedUrl)) {
    out.push({ id: 'map', severity: 'warning', message: 'The Google Map is not set up yet.', href: '/settings', action: 'Set up the map' });
  }
  if (isPlaceholderImage(site.logo)) {
    out.push({ id: 'logo', severity: 'warning', message: 'The logo is still the placeholder picture.', href: '/settings', action: 'Upload your logo' });
  }
  if (isPlaceholderEmail(site.email)) {
    out.push({ id: 'email', severity: 'info', message: 'The email address looks like a placeholder.', href: '/settings', action: 'Edit the email' });
  }
  if (!(site.address.landmark ?? '').trim()) {
    out.push({ id: 'landmark', severity: 'info', message: 'The address has no landmark yet (it helps visitors find you).', href: '/settings', action: 'Add a landmark' });
  }
  const genericSocial = (['youtube', 'facebook', 'instagram'] as const).filter((k) => GENERIC_SOCIAL.test(site.social[k] ?? ''));
  if (genericSocial.length > 0) {
    out.push({ id: 'social', severity: 'info', message: `The ${genericSocial.join(', ')} link${genericSocial.length === 1 ? ' is' : 's are'} just the general homepage, not your page.`, href: '/settings', action: 'Fix social links' });
  }
  const missingAlt = gallery.items.filter((p) => !p.alt.trim()).length;
  if (missingAlt > 0) {
    out.push({ id: 'alt', severity: 'warning', message: `${missingAlt} gallery photo${missingAlt === 1 ? ' has' : 's have'} no alt text.`, href: '/gallery', action: 'Describe the photos' });
  }
  if (!courses.courses.some((c) => c.published)) {
    out.push({ id: 'courses', severity: 'warning', message: 'No course is published, so the Courses page is empty.', href: '/courses', action: 'Publish a course' });
  }
  if (!i.siteUrlSet) {
    out.push({ id: 'site-url', severity: 'info', message: 'NEXT_PUBLIC_SITE_URL is not set, so search engines and share cards use a temporary address.', href: '/help', action: 'See how to set it' });
  }
  return out;
}

export function computeChecklist(i: ReadinessInput): CheckItem[] {
  const { site, gallery, courses, reviews } = i;
  const published = gallery.items.filter((p) => p.published);
  const realSocial = (['youtube', 'facebook', 'instagram'] as const).some((k) => {
    const v = site.social[k] ?? '';
    return v.trim() !== '' && !GENERIC_SOCIAL.test(v);
  });
  return [
    { id: 'github', label: 'GitHub is connected', done: i.githubConnected, href: '/', todo: 'Set the GITHUB_* variables and check the connection below.' },
    { id: 'code', label: 'Access code changed from the default', done: i.hasStoredCode || !i.envCodeIsDefault, href: '/security', todo: 'Choose your own access code.' },
    { id: 'phones', label: 'Real phone numbers added', done: hasRealPhone(site), href: '/settings', todo: 'Add your real phone numbers.' },
    { id: 'whatsapp', label: 'WhatsApp number added', done: !isPlaceholderPhone(site.whatsapp), href: '/settings', todo: 'Add your WhatsApp number.' },
    { id: 'address', label: 'Address and landmark filled in', done: Boolean(site.address.line1.trim() && (site.address.landmark ?? '').trim()), href: '/settings', todo: 'Complete the address and landmark.' },
    { id: 'map', label: 'Google Map set up', done: !isPlaceholderMap(site.map.embedUrl), href: '/settings', todo: 'Paste your Google Maps embed link.' },
    { id: 'logo', label: 'Logo uploaded', done: !isPlaceholderImage(site.logo), href: '/settings', todo: 'Upload your logo.' },
    { id: 'social', label: 'At least one social page linked', done: realSocial, href: '/settings', todo: 'Add your YouTube, Facebook or Instagram page.' },
    { id: 'courses', label: 'At least one course published', done: courses.courses.some((c) => c.published), href: '/courses', todo: 'Publish a course.' },
    { id: 'photos', label: 'Gallery has photos with descriptions', done: published.length >= 3 && published.every((p) => p.alt.trim()), href: '/gallery', todo: 'Upload at least 3 photos and describe each one.' },
    { id: 'reviews', label: 'First review received', done: reviews.items.some((r) => r.published), href: '/reviews', todo: 'Ask a happy learner to leave a review.' },
    { id: 'site-url', label: 'Website address (NEXT_PUBLIC_SITE_URL) set', done: i.siteUrlSet, href: '/help', todo: 'Set NEXT_PUBLIC_SITE_URL in Vercel.' },
  ];
}

export function progress(items: CheckItem[]): { done: number; total: number; percent: number } {
  const done = items.filter((x) => x.done).length;
  return { done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 0 };
}
