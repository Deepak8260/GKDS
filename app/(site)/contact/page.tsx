import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/page-hero';
import { CallCard } from '@/components/sections/contact/call-card';
import { ContactTiles } from '@/components/sections/contact/contact-tiles';
import { MapCard } from '@/components/sections/contact/map-card';
import { WhatsappTile } from '@/components/sections/contact/whatsapp-tile';
import { WhyStrip } from '@/components/sections/contact/why-strip';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { getSite } from '@/lib/content';
import { JsonLd } from '@/components/seo/json-ld';
import { SCHOOL_ID, SITE_URL, absoluteUrl } from '@/lib/json-ld';
import { mediaUrl } from '@/lib/media';
import { buildMetadata, truncate } from '@/lib/seo';

const TITLE = 'Contact Us';
const SUBTITLE = "Have a question or need assistance? We're here to help you!";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const hours = site.hours.map((h) => `${h.label}: ${h.value}`).join(', ');
  return buildMetadata({
    title: TITLE,
    description: truncate(`Call, WhatsApp or visit ${site.name} in ${site.address.city}, ${site.address.state}. ${hours}.`, 155),
    path: '/contact',
    image: site.ogImage ? mediaUrl(site.ogImage) : undefined,
    siteName: site.name,
  });
}

export default async function ContactPage() {
  const site = await getSite();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${SITE_URL}/contact#page`,
    url: absoluteUrl('/contact'),
    name: TITLE,
    description: SUBTITLE,
    about: { '@id': SCHOOL_ID },
    inLanguage: 'en-IN',
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <PageHero
        title={TITLE}
        subtitle={SUBTITLE}
        breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
        image="/assets/photos/vehicles/wagonr-training-car.webp"
        imageAlt="White WagonR training car with Gopal Krushna Driving Training School branding"
        imagePosition="center 60%"
      />

      <Reveal as="section" className="py-10 md:py-16">
        {/* Phones: intro + tiles, then the call card, then the map. Desktop: call card sits in the right column. */}
        <Container className="grid gap-10 lg:grid-cols-[52fr_44fr] lg:gap-x-12">
          <div className="min-w-0">
            <SectionHeading
              lead="Get In Touch"
              dash="before"
              size="md"
              subtitle="We would love to hear from you! Whether you want to enroll for driving classes, ask about our courses, or need any other information, feel free to reach out to us through the details below or simply call us."
            />
            <div className="mt-7">
              <ContactTiles site={site} />
            </div>
          </div>

          <div className="min-w-0 lg:row-span-2">
            <CallCard
              phones={site.phones}
              text={site.callCardText}
              schedule={{ openDays: site.openDays, openFrom: site.openFrom, openTo: site.openTo, dayHours: site.dayHours }}
            />
            <div aria-hidden="true" className="my-5 flex items-center gap-4 text-sm font-semibold uppercase tracking-widest text-muted">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>
            <WhatsappTile number={site.whatsapp} message={site.whatsappMessage} />
          </div>

          <div className="min-w-0">
            <SectionHeading lead="Find Us on Map" dash="before" size="sm" />
            <div className="mt-5">
              <MapCard site={site} />
            </div>
          </div>
        </Container>
      </Reveal>

      <WhyStrip />
    </>
  );
}
