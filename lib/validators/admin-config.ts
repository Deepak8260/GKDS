import { z } from 'zod';
import { isoDate } from './common';

/** `config/admin.json` on the data branch: salted hash of the admin access code. Never public. */
export const adminConfigSchema = z.object({
  /** Empty hash + salt = no stored code yet: the environment ADMIN_CODE still applies (used by "sign out everywhere"). */
  hash: z.string(),
  salt: z.string(),
  updatedAt: isoDate,
  /** Bumped on every code change / "sign out everywhere" to invalidate old sessions. */
  sessionVersion: z.number().int().min(0),
});

export type AdminConfig = z.infer<typeof adminConfigSchema>;
