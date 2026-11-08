import 'server-only';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { CODE_MAX, CODE_MIN } from './constants';
import type { AdminConfig } from '@/lib/validators';

/** Access-code hashing and checking. The plaintext code is never logged or stored. */

type Env = Record<string, string | undefined>;

const KEY_LEN = 64;
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 96 * 1024 * 1024 };
export const DEFAULT_ADMIN_CODE = 'gkds1993';

function scryptAsync(code: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(code.normalize('NFKC'), salt, KEY_LEN, SCRYPT, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/** Salted scrypt hash (16-byte salt, 64-byte key), both base64. */
export async function hashAccessCode(code: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16);
  const key = await scryptAsync(code, salt);
  return { hash: key.toString('base64'), salt: salt.toString('base64') };
}

export async function verifyAgainstHash(code: string, hash: string, salt: string): Promise<boolean> {
  const expected = Buffer.from(hash, 'base64');
  if (expected.length !== KEY_LEN) return false;
  const actual = await scryptAsync(code, Buffer.from(salt, 'base64'));
  return timingSafeEqual(actual, expected);
}

/** Constant-time string comparison (both sides hashed first so the lengths match). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** The stored hash wins unless ADMIN_CODE_RESET=1; otherwise the environment code decides. */
export function codeSource(config: AdminConfig | null, env: Env = process.env): 'file' | 'env' {
  return config && config.hash && env.ADMIN_CODE_RESET?.trim() !== '1' ? 'file' : 'env';
}

export async function verifyAccessCode(
  code: string,
  { config, env = process.env }: { config: AdminConfig | null; env?: Env },
): Promise<boolean> {
  if (typeof code !== 'string' || code.length < 1 || code.length > 200) return false;
  if (config && codeSource(config, env) === 'file') return verifyAgainstHash(code, config.hash, config.salt);
  const expected = env.ADMIN_CODE?.trim() || DEFAULT_ADMIN_CODE;
  return safeEqual(code, expected);
}

/** Rules for a NEW code: 4–64 characters, anything allowed. Weakness is a warning, not an error. */
export function validateNewCode(code: string): { ok: true } | { ok: false; message: string } {
  if (code.length < CODE_MIN) return { ok: false, message: `Use at least ${CODE_MIN} characters.` };
  if (code.length > CODE_MAX) return { ok: false, message: `Use at most ${CODE_MAX} characters.` };
  return { ok: true };
}
