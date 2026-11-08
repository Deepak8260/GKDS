/** Strength hint for a NEW access code. Weak codes get a warning, never a block (the owner may want an easy code). */
export type Strength = { level: 0 | 1 | 2 | 3; label: 'Too short' | 'Weak' | 'Okay' | 'Strong'; warning?: string };

export function codeStrength(code: string): Strength {
  if (code.length < 4) return { level: 0, label: 'Too short' };
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(code)).length;
  if (/^\d+$/.test(code) && code.length < 6) {
    return { level: 1, label: 'Weak', warning: 'Digits-only codes under 6 characters are easy to guess. Consider a longer code.' };
  }
  if (code.length < 6 || classes === 1 && code.length < 8) {
    return { level: 1, label: 'Weak', warning: 'This is easy to guess. A longer code with letters and numbers is safer.' };
  }
  if (code.length >= 12 || (code.length >= 8 && classes >= 3)) return { level: 3, label: 'Strong' };
  return { level: 2, label: 'Okay' };
}
