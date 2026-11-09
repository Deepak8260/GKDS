import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/page-hero';
import { CallCard } from '@/components/sections/contact/call-card';
import { ContactTiles } from '@/components/sections/contact/contact-tiles';
import { MapCard } from '@/components/sections/contact/map-card';
import { WhatsappTile } from '@/components/sections/contact/whatsapp-tile';
import { WhyStrip } from '@/components/sections/contact/why-strip';
import { JsonLd } from '@/components/seo/json-ld';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { getSite } from '@/lib/content';
import { tFor } from '@/lib/i18n';
import { LANG_TAG, fmt, localizePath, type Locale } from '@/lib/i18n/locales';
import { SCHOOL_ID, SITE_URL, absoluteUrl } from '@/lib/json-ld';
import { mediaUrl } from '@/lib/media';
import { buildMetadata, truncate } from '@/lib/seo';

export async function contactMetadata(locale: Locale): Promise<Metadata> {
  const site = await getSite(locale);
  const t = tFor(locale).meta;
  const hours = site.hours.map((h) => `${h.label}: ${h.value}`).join(', ');
  return buildMetadata({
    title: tFor(locale).contact.title,
    description: truncate(fmt(t.contactDescription, { name: site.name, city: site.address.city, state: site.address.state, hours }), 155),
    path: '/contact',
    image: site.ogImage ? mediaUrl(site.ogImage) : undefined,
    siteName: site.name,
    locale,
  });
}

export async function ContactPageView({ locale }: { locale: Locale }) {
  const site = await getSite(locale);
  const t = tFor(locale);
  const path = localizePath('/contact', locale);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${SITE_URL}${path}#page`,
    url: absoluteUrl(path),
    name: t.contact.title,
    description: t.contact.subtitle,
    about: { '@id': SCHOOL_ID },
    inLanguage: LANG_TAG[locale],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <PageHero
        title={t.contact.title}
        subtitle={t.contact.subtitle}
        breadcrumb={[{ label: t.nav.home, href: '/' }, { label: t.nav.contact }]}
        image="/assets/photos/vehicles/wagonr-training-car.webp"
        imageAlt={t.contact.heroAlt}
        imagePosition="center 60%"
        locale={locale}
      />

      <Reveal as="section" className="py-10 md:py-12">
        {/* Phones: intro + tiles, then the call card, then the map. Desktop: call card sits in the right column. */}
        <Container className="grid gap-10 lg:grid-cols-[52fr_44fr] lg:gap-x-12">
          <div className="min-w-0">
            <SectionHeading lead={t.contact.getInTouch} dash="before" size="md" subtitle={t.contact.intro} />
            <div className="mt-7">
              <ContactTiles site={site} locale={locale} />
            </div>
          </div>

          <div className="min-w-0 lg:row-span-2">
            <CallCard
              phones={site.phones}
              text={site.callCardText}
              schedule={{ openDays: site.openDays, openFrom: site.openFrom, openTo: site.openTo, dayHours: site.dayHours }}
              t={{ hours: t.hours, contact: t.contact, actions: t.actions }}
            />
            <div aria-hidden="true" className="my-5 flex items-center gap-4 text-sm font-semibold uppercase tracking-widest text-muted">
              <span className="h-px flex-1 bg-line" />
              {t.contact.or}
              <span className="h-px flex-1 bg-line" />
            </div>
            <WhatsappTile number={site.whatsapp} message={site.whatsappMessage} locale={locale} />
          </div>

          <div className="min-w-0">
            <SectionHeading lead={t.contact.findUs} dash="before" size="sm" />
            <div className="mt-5">
              <MapCard site={site} locale={locale} />
            </div>
          </div>
        </Container>
      </Reveal>

      <WhyStrip locale={locale} />
    </>
  );
}
