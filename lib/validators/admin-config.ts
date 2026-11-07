import { z } from 'zod';
import { isoDate } from './common';

/** `config/admin.json` on the data branch: salted hash of the admin access code. Never public. */
export const adminConfigSchema = z.object({
  hash: z.string().min(1),
  salt: z.string().min(1),
  updatedAt: isoDate,
  /** Bumped on every code change / "sign out everywhere" to invalidate old sessions. */
  sessionVersion: z.number().int().min(0),
});

export type AdminConfig = z.infer<typeof adminConfigSchema>;
