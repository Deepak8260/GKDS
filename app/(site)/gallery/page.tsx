import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/page-hero';
import { DrivingVideos } from '@/components/sections/gallery/driving-videos';
import { GalleryClient } from '@/components/sections/gallery/gallery-client';
import { Container } from '@/components/ui/container';
import { getGallery, getPublishedGallery, getSite } from '@/lib/content';
import { absoluteUrl, jsonLdString } from '@/lib/json-ld';
import { mediaUrl } from '@/lib/media';
import { buildMetadata, truncate } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const [doc, site] = await Promise.all([getGallery(), getSite()]);
  return buildMetadata({
    title: 'Photo Gallery',
    description: truncate(`${doc.hero.subtitle} See our cars, classrooms and training ground in ${site.address.city}.`, 155),
    path: '/gallery',
    image: mediaUrl(doc.hero.image || site.ogImage),
    siteName: site.name,
  });
}

export default async function GalleryPage() {
  const [doc, items] = await Promise.all([getGallery(), getPublishedGallery()]);
  const videos = (doc.videos ?? []).filter((v) => v.published);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: `${doc.titleLead} ${doc.titleHighlight}`.trim(),
    description: doc.hero.subtitle,
    url: absoluteUrl('/gallery'),
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
        breadcrumb={[{ label: 'Home', href: '/' }, { label: doc.hero.title }]}
        image={doc.hero.image}
        imageAlt={doc.hero.imageAlt}
        imagePosition="center 30%"
      />

      <section className="section-y pb-12 pt-10 md:pb-16 md:pt-10" aria-label={`${doc.titleLead} ${doc.titleHighlight}`}>
        <Container>
          <GalleryClient
            titleLead={doc.titleLead}
            titleHighlight={doc.titleHighlight}
            categories={doc.categories}
            items={items}
          />
        </Container>
      </section>

      <DrivingVideos title={doc.videosTitle || 'Driving Videos'} subtitle={doc.videosSubtitle} videos={videos} />
    </>
  );
}
