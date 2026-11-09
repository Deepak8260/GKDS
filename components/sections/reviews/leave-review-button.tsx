'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button, type ButtonVariant } from '@/components/ui/button';

// the dialog (and the validation library it uses) loads only when someone asks to leave a review
const ReviewFormModal = dynamic(() => import('./review-form-modal'), { ssr: false });

interface LeaveReviewButtonProps {
  /** The business name shown in the dialog intro. */
  schoolName: string;
  /** False when the admin has closed public reviews. */
  accepting?: boolean;
  variant?: ButtonVariant;
  className?: string;
}

/** "Leave a Review →" button that opens the review dialog (and gives focus back to itself on close). */
export function LeaveReviewButton({ schoolName, accepting = true, variant = 'primary', className }: LeaveReviewButtonProps) {
  const [open, setOpen] = useState(false);

  if (!accepting) {
    return (
      <Button variant="secondary" disabled className={className}>
        Reviews are currently closed
      </Button>
    );
  }

  return (
    <>
      <Button variant={variant} arrow aria-haspopup="dialog" onClick={() => setOpen(true)} className={className}>
        Leave a Review
      </Button>
      {open ? <ReviewFormModal schoolName={schoolName} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
