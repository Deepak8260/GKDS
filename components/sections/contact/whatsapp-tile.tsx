import { ArrowRight } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/custom-icons';
import { tFor } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';
import { whatsappHref } from '@/lib/utils';

interface WhatsappTileProps {
  number: string;
  message: string;
  locale?: Locale;
}

/** "Quick Enquiry?" tile: the whole tile opens WhatsApp with a ready-to-send message. */
export function WhatsappTile({ number, message, locale = 'en' }: WhatsappTileProps) {
  const t = tFor(locale);
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
        <span className="block text-lg font-bold text-ink">{t.contact.quickEnquiry}</span>
        <span className="block text-[14px] leading-snug text-ink/80">
          {t.contact.quickEnquiryText}
        </span>
        <span className="sr-only">{t.actions.opensWhatsapp}</span>
      </span>
      <ArrowRight className="size-6 shrink-0 text-ink transition group-hover:translate-x-1" aria-hidden="true" />
    </a>
  );
}
