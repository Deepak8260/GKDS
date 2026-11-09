import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names and resolve Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "+91 98765 43210" -> "tel:+919876543210" */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/** Build a wa.me link from digits (with country code) and a prefilled message. */
export function whatsappHref(number: string, message?: string) {
  const digits = number.replace(/\D/g, '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

/** "Govt. of Odisha Regd. No. 10/13" -> ["Govt. of Odisha", "Regd. No. 10/13"] */
export function splitRegNo(regNo: string): [string, string] {
  const i = regNo.indexOf('Regd.');
  if (i <= 0) return [regNo, ''];
  return [regNo.slice(0, i).trim(), regNo.slice(i).trim()];
}

/** Short, URL-safe, collision-resistant id (e.g. "k3f9a2x8q1b7"). */
export function newId(): string {
  const bytes = new Uint8Array(9);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join('');
}

/** True for absolute/external URLs and non-http schemes (tel:, mailto:, wa.me). */
export function isExternalHref(href: string) {
  return /^(https?:)?\/\//.test(href) || /^(tel|mailto|sms):/.test(href);
}
