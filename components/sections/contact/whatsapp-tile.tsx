import { ArrowRight } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/custom-icons';
import { whatsappHref } from '@/lib/utils';

interface WhatsappTileProps {
  number: string;
  message: string;
}

/** "Quick Enquiry?" tile: the whole tile opens WhatsApp with a ready-to-send message. */
export function WhatsappTile({ number, message }: WhatsappTileProps) {
  return (
    <a
      href={whatsappHref(number, message)}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring group flex items-center gap-4 rounded-2xl border border-green-100 bg-green-50 p-5 transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <span
        aria-hidden="true"
        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white"
      >
        <WhatsappIcon size={32} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold text-ink">Quick Enquiry?</span>
        <span className="block text-[14px] leading-snug text-ink/80">
          Chat with us on WhatsApp for faster assistance!
        </span>
        <span className="sr-only"> (opens WhatsApp in a new tab)</span>
      </span>
      <ArrowRight className="size-6 shrink-0 text-ink transition group-hover:translate-x-1" aria-hidden="true" />
    </a>
  );
}
