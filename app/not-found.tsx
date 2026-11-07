import { Phone } from 'lucide-react';
import { SiteShell } from '@/components/layout/site-shell';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getSite } from '@/lib/content';
import { telHref } from '@/lib/utils';

export const metadata = { title: 'Page not found', robots: { index: false } };

export default async function NotFound() {
  const site = await getSite();
  return (
    <SiteShell>
      <Container className="section-y flex flex-col items-center text-center">
        <p className="font-display text-7xl font-bold italic text-orange-500 md:text-8xl">404</p>
        <h1 className="mt-4 font-display text-3xl font-bold italic text-green-900 md:text-4xl">
          Page not found
        </h1>
        <p className="mt-3 max-w-md text-ink/80">
          The page you are looking for may have moved or no longer exists. Let us take you back on the road.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/" arrow>
            Back to Home
          </Button>
          <Button
            href={telHref(site.phones[0])}
            variant="secondary"
            icon={<Phone className="size-5" aria-hidden="true" />}
          >
            Call Now
          </Button>
        </div>
      </Container>
    </SiteShell>
  );
}
