import { Phone } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/custom-icons';
import { tFor } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';
import { fmt } from '@/lib/i18n/locales';
import { telHref, whatsappHref } from '@/lib/utils';

interface FloatingActionsProps {
  phone: string;
  whatsapp: string;
  whatsappMessage?: string;
  locale?: Locale;
}

/** Mobile-only floating Call + WhatsApp buttons (bottom-right). */
export function FloatingActions({ phone, whatsapp, whatsappMessage, locale = 'en' }: FloatingActionsProps) {
  const t = tFor(locale).actions;
  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex flex-col gap-3 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingRight: 'env(safe-area-inset-right)' }}
    >
      <a
        href={whatsappHref(whatsapp, whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.chatWhatsapp}
        className="focus-ring flex size-[52px] items-center justify-center rounded-full bg-whatsapp text-white shadow-card-lg"
      >
        <WhatsappIcon size={28} />
      </a>
      <a
        href={telHref(phone)}
        aria-label={fmt(t.callPhone, { phone })}
        className="focus-ring flex size-[52px] items-center justify-center rounded-full bg-green-700 text-white shadow-card-lg"
      >
        <Phone className="size-6" aria-hidden="true" />
      </a>
    </div>
  );
}
