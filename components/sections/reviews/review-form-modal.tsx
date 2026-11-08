'use client';

import Image from 'next/image';
import { useId, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, CircleCheck, MessageSquareText, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { publicReviewSchema } from '@/lib/validators';
import { RatingPicker } from './rating-picker';

const STORAGE_KEY = 'gkds:review-submitted-at';
const COOLDOWN_MS = 10 * 60 * 1000;
const MAX_TEXT = 600;
const GENERIC = 'Could not submit right now. Please try again later.';

type Status = 'idle' | 'submitting' | 'success' | 'error';
type Errors = Partial<Record<'name' | 'phone' | 'rating' | 'text' | 'consent', string>>;

interface ReviewFormModalProps {
  schoolName: string;
  onClose: () => void;
}

function readLastSubmit(): number {
  try {
    return Number(window.localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}
function rememberSubmit() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* private mode etc.: the server-side limit still applies */
  }
}

const fieldBase =
  'focus-ring w-full rounded-xl border bg-white px-4 py-2.5 text-base text-ink shadow-sm placeholder:text-muted/60 aria-[invalid=true]:border-red-600';
const labelBase = 'mb-1.5 flex items-center gap-2.5 text-base font-bold text-ink';

/** Decorative road + trees scene that fades into the white header (no extra image request). */
function RoadScene() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[48%] sm:w-[44%]">
      <svg viewBox="0 0 300 200" preserveAspectRatio="xMaxYMax slice" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id="rv-fade" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rv-down" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="rv-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff8e8" />
            <stop offset="1" stopColor="#eef6e4" />
          </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#rv-sky)" />
        <circle cx="250" cy="70" r="30" fill="#ffe9a8" opacity=".7" />
        <path d="M0 150 C80 110 170 120 300 105 L300 200 L0 200Z" fill="#8cc063" />
        <path d="M110 200 C150 160 210 135 300 128 L300 168 C240 168 200 180 180 200Z" fill="#555c66" />
        <path d="M150 196 C190 170 240 152 300 148" stroke="#fff" strokeWidth="2" strokeDasharray="8 7" fill="none" />
        <g fill="#3f8a3a">
          <circle cx="215" cy="78" r="22" />
          <circle cx="255" cy="62" r="26" />
          <circle cx="285" cy="82" r="22" />
        </g>
        <g fill="#6b4a2b">
          <rect x="212" y="94" width="5" height="30" />
          <rect x="253" y="82" width="5" height="40" />
          <rect x="283" y="98" width="5" height="26" />
        </g>
        <path d="M262 136 l6 -22 l6 22z" fill="#ff6a13" />
        <rect width="300" height="200" fill="url(#rv-fade)" />
        <rect y="150" width="300" height="50" fill="url(#rv-down)" />
      </svg>
    </div>
  );
}

/**
 * "Leave a Review" dialog. Name, optional phone (admin only), whole-star rating, text and a consent tick.
 * Validated here with the shared zod schema and again on the server.
 */
export default function ReviewFormModal({ schoolName, onClose }: ReviewFormModalProps) {
  const uid = useId();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState(''); // honeypot: humans never see or fill this
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [startedAt] = useState(() => Date.now());
  const [alreadySent] = useState(() => Date.now() - readLastSubmit() < COOLDOWN_MS);
  const formRef = useRef<HTMLFormElement>(null);

  const submitting = status === 'submitting';

  /** A field's error goes away as soon as the visitor edits that field; the summary line goes with the last one. */
  function clearError(key: keyof Errors) {
    if (!errors[key]) return;
    const next = { ...errors };
    delete next[key];
    setErrors(next);
    if (Object.keys(next).length === 0 && status !== 'error') setMessage('');
  }
  const ids = {
    name: `${uid}-name`,
    nameErr: `${uid}-name-err`,
    phone: `${uid}-phone`,
    phoneErr: `${uid}-phone-err`,
    ratingErr: `${uid}-rating-err`,
    text: `${uid}-text`,
    textErr: `${uid}-text-err`,
    consent: `${uid}-consent`,
    consentErr: `${uid}-consent-err`,
  };

  function validate(): { ok: true; data: ReturnType<typeof publicReviewSchema.parse> } | { ok: false } {
    const parsed = publicReviewSchema.safeParse({
      name,
      phone: phone.trim() || undefined,
      rating: rating || undefined,
      text,
      consent,
      company,
      startedAt,
    });
    const next: Errors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (key in { name: 1, phone: 1, rating: 1, text: 1 } && !next[key]) next[key] = issue.message;
      }
    }
    if (!consent) next.consent = 'Please tick the box to allow us to display your review.';

    if (parsed.success && Object.keys(next).length === 0) {
      setErrors({});
      return { ok: true, data: parsed.data };
    }
    setErrors(next);
    // move focus to the first problem
    requestAnimationFrame(() => {
      const first = next.name
        ? `#${CSS.escape(ids.name)}`
        : next.phone
          ? `#${CSS.escape(ids.phone)}`
          : next.rating
            ? 'input[name="rating"]'
            : next.text
              ? `#${CSS.escape(ids.text)}`
              : `#${CSS.escape(ids.consent)}`;
      formRef.current?.querySelector<HTMLElement>(first)?.focus();
    });
    return { ok: false };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return; // no double submits
    const result = validate();
    if (!result.ok) {
      setStatus('idle');
      setMessage('Please check the highlighted fields.');
      return;
    }

    setStatus('submitting');
    setMessage('');
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; fieldErrors?: Errors } | null;

      if (res.ok && json?.ok) {
        rememberSubmit();
        setStatus('success');
        return;
      }
      if (json?.fieldErrors) {
        setErrors(json.fieldErrors);
        setStatus('idle');
        setMessage(json.message ?? 'Please check the highlighted fields.');
        return;
      }
      setStatus('error');
      setMessage(json?.message ?? GENERIC);
    } catch {
      setStatus('error');
      setMessage('We could not reach the server. Please check your connection and try again.');
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Leave a Review"
      description={`Tell us about your experience at ${schoolName}.`}
      bare
      className="sm:max-w-[640px] sm:rounded-[28px]"
    >
      {alreadySent && status !== 'success' ? (
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center" role="status">
          <CircleCheck className="size-12 text-green-700" aria-hidden="true" />
          <p className="text-base text-ink">
            You already submitted a review recently. Thank you! Please try again a little later if you would like to add
            another.
          </p>
          <Button onClick={onClose} data-autofocus>
            Close
          </Button>
        </div>
      ) : status === 'success' ? (
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center" role="status">
          <CircleCheck className="size-14 text-green-700" aria-hidden="true" />
          <p className="text-lg font-semibold text-green-900">
            Thank you! Your review has been submitted and will appear after approval.
          </p>
          <Button onClick={onClose} data-autofocus>
            Close
          </Button>
        </div>
      ) : (
        <>
          <header className="relative overflow-hidden bg-gradient-to-b from-white to-green-50/40 px-5 pb-12 pt-5 sm:px-8">
            <RoadScene />
            <div className="relative flex items-center gap-3 pr-12">
              <Image src="/assets/brand/krishna-golden-flute.png" alt="" width={56} height={56} className="size-12 object-contain sm:size-14" />
              <span aria-hidden="true" className="h-10 w-px bg-green-900/30" />
              <p className="font-display text-xl font-bold italic leading-tight text-green-900 sm:text-2xl">
                Gopal Krushna
                <span className="block text-sm font-semibold text-orange-600 sm:text-base">Driving Training School</span>
              </p>
            </div>
            <div className="relative mt-5">
              <p aria-hidden="true" className="text-3xl font-extrabold tracking-tight text-green-900 sm:text-4xl">
                Share Your Experience
              </p>
              <p className="mt-1.5 max-w-[26rem] text-sm text-ink/80 sm:text-base">
                Your feedback helps us improve our training and service.
              </p>
              <span aria-hidden="true" className="mt-3 block h-1 w-12 rounded-full bg-orange-500" />
            </div>
          </header>

          <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4 px-5 pb-6 pt-1 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={ids.name} className={labelBase}>
                  <User className="size-6 text-green-800" strokeWidth={1.6} aria-hidden="true" />
                  <span>
                    Your Name <span aria-hidden="true" className="text-red-600">*</span>
                    <span className="sr-only"> (required)</span>
                  </span>
                </label>
                <input
                  id={ids.name}
                  data-autofocus
                  type="text"
                  name="name"
                  autoComplete="name"
                  maxLength={60}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearError('name');
                  }}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? ids.nameErr : undefined}
                  placeholder="e.g. Amit Sahoo"
                  className={`${fieldBase} ${errors.name ? 'border-red-600' : 'border-line'}`}
                />
                {errors.name ? (
                  <p id={ids.nameErr} className="mt-1.5 text-sm font-medium text-red-700">
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor={ids.phone} className={labelBase}>
                  <Phone className="size-6 text-green-800" strokeWidth={1.6} aria-hidden="true" />
                  <span>
                    Phone Number <span className="text-sm font-normal text-ink/80">(Optional)</span>
                  </span>
                </label>
                <input
                  id={ids.phone}
                  type="tel"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={16}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearError('phone');
                  }}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? ids.phoneErr : undefined}
                  placeholder="e.g. 98765 43210"
                  className={`${fieldBase} ${errors.phone ? 'border-red-600' : 'border-line'}`}
                />
                {errors.phone ? (
                  <p id={ids.phoneErr} className="mt-1.5 text-sm font-medium text-red-700">
                    {errors.phone}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <RatingPicker
                value={rating}
                onChange={(n) => {
                  setRating(n);
                  clearError('rating');
                }}
                error={errors.rating}
                errorId={ids.ratingErr}
              />
              {errors.rating ? (
                <p id={ids.ratingErr} className="mt-1.5 text-sm font-medium text-red-700">
                  {errors.rating}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor={ids.text} className={labelBase}>
                <MessageSquareText className="size-6 text-green-800" strokeWidth={1.6} aria-hidden="true" />
                <span>
                  Your Review <span aria-hidden="true" className="text-red-600">*</span>
                  <span className="sr-only"> (required)</span>
                </span>
              </label>
              <textarea
                id={ids.text}
                name="text"
                rows={4}
                maxLength={MAX_TEXT}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  clearError('text');
                }}
                aria-invalid={Boolean(errors.text)}
                aria-describedby={errors.text ? ids.textErr : undefined}
                placeholder="Tell us about your experience — the training, instructors, vehicles, and overall service."
                className={`${fieldBase} resize-y ${errors.text ? 'border-red-600' : 'border-line'}`}
              />
              <div className="mt-1 flex items-start justify-between gap-3">
                {errors.text ? (
                  <p id={ids.textErr} className="text-sm font-medium text-red-700">
                    {errors.text}
                  </p>
                ) : (
                  <span />
                )}
                <p className="shrink-0 text-sm tabular-nums text-muted" aria-hidden="true">
                  {text.length} / {MAX_TEXT}
                </p>
              </div>
            </div>

            <div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-gradient-to-r from-orange-50 to-orange-50/30 px-4 py-3 text-sm text-ink sm:text-base">
                <input
                  id={ids.consent}
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    clearError('consent');
                  }}
                  aria-invalid={Boolean(errors.consent)}
                  aria-describedby={errors.consent ? ids.consentErr : undefined}
                  className="focus-ring size-5 shrink-0 rounded border-2 border-ink/70 accent-green-800"
                />
                Allow us to display this review on our website.
              </label>
              {errors.consent ? (
                <p id={ids.consentErr} className="mt-1.5 text-sm font-medium text-red-700">
                  {errors.consent}
                </p>
              ) : null}
            </div>

            {/* honeypot: hidden from people and assistive tech; bots tend to fill every field */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Company
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </label>
            </div>

            <div aria-live="polite" role="status" className="min-h-5 text-sm font-medium text-red-700">
              {status === 'error' || message ? message : ''}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="focus-ring inline-flex h-12 min-w-[8.5rem] items-center justify-center rounded-full border-2 border-green-900 bg-white px-6 text-base font-bold text-green-900 hover:bg-green-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="focus-ring inline-flex h-12 min-w-[12rem] items-center justify-center gap-2 rounded-full bg-gradient-to-b from-orange-400 to-orange-600 px-7 text-base font-bold text-white shadow-[0_8px_20px_-6px_rgba(234,88,12,0.6)] hover:from-orange-500 hover:to-orange-700 disabled:opacity-70"
              >
                {submitting ? 'Submitting…' : status === 'error' ? 'Try again' : 'Submit Review'}
                {submitting ? null : <ArrowRight className="size-5" aria-hidden="true" />}
              </button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}
