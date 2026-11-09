/** Friendly wording for the commit messages the site itself writes to the data branch. */

const NAMES: Record<string, string> = {
  site: 'Site settings',
  home: 'Home page',
  about: 'About page',
  courses: 'Courses',
  gallery: 'Gallery',
  reviews: 'Reviews',
};

const contentName = (file: string) => NAMES[file.replace(/\.json$/, '')] ?? file;

/** Commits written by the admin panel, the public review form or the seed script (not code commits). */
export function isContentCommit(message: string): boolean {
  return /^(admin|review|seed):/.test(message);
}

/** "admin: update courses.json" → "Updated Courses" … anything unknown is shown as it is. */
export function prettifyCommit(message: string): string {
  const m = message.split('\n')[0].trim();
  let r: RegExpExecArray | null;

  if ((r = /^admin: update (\S+\.json)$/.exec(m))) return `Updated ${contentName(r[1])}`;
  if ((r = /^admin: restore (\S+\.json) from backup$/.exec(m))) return `Restored ${contentName(r[1])} from a backup`;
  if ((r = /^admin: upload media\/(\w+)\//.exec(m))) return r[1] === 'gallery' ? 'Uploaded a gallery photo' : 'Uploaded a picture';
  if (/^admin: upload /.test(m)) return 'Uploaded a picture';
  if (/^admin: delete media\//.test(m)) return 'Deleted a picture';
  if (/^admin: (change|update) access code/i.test(m)) return 'Changed the access code';
  if (/^admin: sign out/i.test(m)) return 'Signed out all devices';
  if (/^admin: .*config\/admin\.json/.test(m)) return 'Changed security settings';
  if (/^review: new review /.test(m)) return 'A visitor posted a review';
  if (/^review: photo for /.test(m)) return 'A review photo was added';
  if (/^review: contact for /.test(m)) return 'A review contact was saved';
  if ((r = /^seed: add (\S+\.json)$/.exec(m))) return `Added starting content: ${contentName(r[1])}`;
  return m;
}

/** Which content file (without .json) a commit message is about, or null. */
export function commitContentName(message: string): string | null {
  const r = /(?:update|restore|add) (site|home|about|courses|gallery|reviews)\.json/.exec(message);
  return r ? r[1] : null;
}
