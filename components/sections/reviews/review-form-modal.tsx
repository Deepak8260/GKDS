'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { publicReviewSchema } from '@/lib/validators';
import { RatingPicker } from './rating-picker';

const STORAGE_KEY = 'gkds:review-submitted-at';
const COOLDOWN_MS = 10 * 60 * 1000;
const MAX_TEXT = 600;
const GENERIC = 'Could not submit right now. Please try again later.';

type Status = 'idle' | 'submitting' | 'success' | 'error';
type Errors = Partial<Record<'name' | 'rating' | 'text', string>>;

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
  'focus-ring w-full rounded-xl border bg-white px-4 py-3 text-base text-ink placeholder:text-muted/70 aria-[invalid=true]:border-red-600';

/**
 * "Leave a Review" dialog. Name + whole-star rating + text only (no photo, email or phone).
 * Validated here with the shared zod schema and again on the server.
 */
export default function ReviewFormModal({ schoolName, onClose }: ReviewFormModalProps) {
  const uid = useId();
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
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
  const ids = { name: `${uid}-name`, nameErr: `${uid}-name-err`, ratingErr: `${uid}-rating-err`, text: `${uid}-text`, textErr: `${uid}-text-err` };

  function validate(): { ok: true; data: ReturnType<typeof publicReviewSchema.parse> } | { ok: false } {
    const parsed = publicReviewSchema.safeParse({ name, rating: rating || undefined, text, company, startedAt });
    if (parsed.success) {
      setErrors({});
      return { ok: true, data: parsed.data };
    }
    const next: Errors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof Errors;
      if (key in { name: 1, rating: 1, text: 1 } && !next[key]) next[key] = issue.message;
    }
    setErrors(next);
    // move focus to the first problem
    requestAnimationFrame(() => {
      const first = next.name ? `#${CSS.escape(ids.name)}` : next.rating ? 'input[name="rating"]' : `#${CSS.escape(ids.text)}`;
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
    >
      {alreadySent && status !== 'success' ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center" role="status">
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
        <div className="flex flex-col items-center gap-4 py-4 text-center" role="status">
          <CircleCheck className="size-14 text-green-700" aria-hidden="true" />
          <p className="text-lg font-semibold text-green-900">
            Thank you! Your review has been submitted and will appear after approval.
          </p>
          <Button onClick={onClose} data-autofocus>
            Close
          </Button>
        </div>
      ) : (
        <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor={ids.name} className="mb-1.5 block text-sm font-semibold text-ink">
              Your Name <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
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
            <label htmlFor={ids.text} className="mb-1.5 block text-sm font-semibold text-ink">
              Your Review <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </label>
            <textarea
              id={ids.text}
              name="text"
              rows={5}
              maxLength={MAX_TEXT}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                clearError('text');
              }}
              aria-invalid={Boolean(errors.text)}
              aria-describedby={errors.text ? ids.textErr : undefined}
              placeholder="What did you like? How were the instructors and the training?"
              className={`${fieldBase} resize-y ${errors.text ? 'border-red-600' : 'border-line'}`}
            />
            <div className="mt-1.5 flex items-start justify-between gap-3">
              {errors.text ? (
                <p id={ids.textErr} className="text-sm font-medium text-red-700">
                  {errors.text}
                </p>
              ) : (
                <span />
              )}
              <p className="shrink-0 text-sm tabular-nums text-muted" aria-hidden="true">
                {text.length}/{MAX_TEXT}
              </p>
            </div>
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
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} arrow={!submitting}>
              {status === 'error' ? 'Try again' : 'Submit Review'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
