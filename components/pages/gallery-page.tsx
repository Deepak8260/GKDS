import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/page-hero';
import { GalleryClient } from '@/components/sections/gallery/gallery-client';
import { Container } from '@/components/ui/container';
import { getGallery, getPublishedGallery, getSite } from '@/lib/content';
import { tFor } from '@/lib/i18n';
import { fmt, localizePath, type Locale } from '@/lib/i18n/locales';
import { absoluteUrl, jsonLdString } from '@/lib/json-ld';
import { mediaUrl } from '@/lib/media';
import { buildMetadata, truncate } from '@/lib/seo';

export async function galleryMetadata(locale: Locale): Promise<Metadata> {
  const [doc, site] = await Promise.all([getGallery(locale), getSite(locale)]);
  const t = tFor(locale).meta;
  return buildMetadata({
    title: t.gallery,
    description: truncate(fmt(t.galleryDescription, { subtitle: doc.hero.subtitle, city: site.address.city }), 155),
    path: '/gallery',
    image: mediaUrl(doc.hero.image || site.ogImage),
    siteName: site.name,
    locale,
  });
}

export async function GalleryPageView({ locale }: { locale: Locale }) {
  const [doc, items] = await Promise.all([getGallery(locale), getPublishedGallery(locale)]);
  const t = tFor(locale);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: `${doc.titleLead} ${doc.titleHighlight}`.trim(),
    description: doc.hero.subtitle,
    url: absoluteUrl(localizePath('/gallery', locale)),
    image: items.slice(0, 12).map((i) => ({
      '@type': 'ImageObject',
      contentUrl: absoluteUrl(mediaUrl(i.src)),
      caption: i.alt,
    })),
  };

  return (
    <>
      {items.length > 0 ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      ) : null}

      <PageHero
        title={doc.hero.title}
        subtitle={doc.hero.subtitle}
        breadcrumb={[{ label: t.nav.home, href: '/' }, { label: doc.hero.title }]}
        image={doc.hero.image}
        imageAlt={doc.hero.imageAlt}
        imagePosition="center 30%"
        locale={locale}
      />

      <section className="section-y pb-12 pt-10 md:pb-16 md:pt-10" aria-label={`${doc.titleLead} ${doc.titleHighlight}`}>
        <Container>
          <GalleryClient
            titleLead={doc.titleLead}
            titleHighlight={doc.titleHighlight}
            categories={doc.categories}
            items={items}
            t={t.gallery}
          />
        </Container>
      </section>
    </>
  );
}
