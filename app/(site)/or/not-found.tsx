import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getSite } from '@/lib/content';
import { tFor } from '@/lib/i18n';
import { telHref } from '@/lib/utils';

export const metadata = { title: { absolute: 'ପୃଷ୍ଠା ମିଳିଲା ନାହିଁ' }, robots: { index: false } };

export default async function OdiaNotFound() {
  const site = await getSite('or');
  const t = tFor('or');
  return (
    <Container className="section-y flex flex-col items-center text-center">
      <p className="font-display text-7xl font-bold text-orange-500 md:text-8xl">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-green-900 md:text-4xl">{t.errors.notFoundTitle}</h1>
      <p className="mt-3 max-w-md text-ink/80">{t.errors.notFoundText}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/" arrow>
          {t.actions.backHome}
        </Button>
        <Button href={telHref(site.phones[0])} variant="secondary" icon={<Phone className="size-5" aria-hidden="true" />}>
          {t.actions.callNow}
        </Button>
      </div>
    </Container>
  );
}
