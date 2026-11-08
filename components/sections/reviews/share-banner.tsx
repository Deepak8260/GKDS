import { ReviewBubbleIcon } from '@/components/icons/custom-icons';
import { Container } from '@/components/ui/container';
import { CTABanner } from '@/components/ui/cta-banner';
import { Reveal } from '@/components/ui/reveal';
import type { Reviews } from '@/lib/validators';
import { LeaveReviewButton } from './leave-review-button';

interface ShareBannerProps {
  doc: Pick<Reviews, 'ctaTitleLead' | 'ctaTitleHighlight' | 'ctaText'>;
  schoolName: string;
  accepting: boolean;
}

/** Light-green "Share Your Experience" banner with the Leave a Review button. */
export function ShareBanner({ doc, schoolName, accepting }: ShareBannerProps) {
  return (
    <Reveal as="section" className="pb-16 md:pb-24">
      <Container>
        <CTABanner
          lead={doc.ctaTitleLead}
          highlight={doc.ctaTitleHighlight}
          text={doc.ctaText}
          icon={<ReviewBubbleIcon size={72} strokeWidth={1.4} className="text-orange-500" />}
          iconDivider
          action={<LeaveReviewButton schoolName={schoolName} accepting={accepting} />}
        />
      </Container>
    </Reveal>
  );
}
