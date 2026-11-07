import { Phone } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/custom-icons';
import { telHref, whatsappHref } from '@/lib/utils';

interface FloatingActionsProps {
  phone: string;
  whatsapp: string;
  whatsappMessage?: string;
}

/** Mobile-only floating Call + WhatsApp buttons (bottom-right). */
export function FloatingActions({ phone, whatsapp, whatsappMessage }: FloatingActionsProps) {
  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex flex-col gap-3 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingRight: 'env(safe-area-inset-right)' }}
    >
      <a
        href={whatsappHref(whatsapp, whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="focus-ring flex size-[52px] items-center justify-center rounded-full bg-whatsapp text-white shadow-card-lg"
      >
        <WhatsappIcon size={28} />
      </a>
      <a
        href={telHref(phone)}
        aria-label={`Call ${phone}`}
        className="focus-ring flex size-[52px] items-center justify-center rounded-full bg-green-700 text-white shadow-card-lg"
      >
        <Phone className="size-6" aria-hidden="true" />
      </a>
    </div>
  );
}
