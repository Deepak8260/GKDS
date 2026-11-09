import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/page-hero';
import { PeacockFeather } from '@/components/layout/peacock-feather';
import { AboutStats } from '@/components/sections/about/about-stats';
import { MissionVision } from '@/components/sections/about/mission-vision';
import { Story } from '@/components/sections/about/story';
import { Values } from '@/components/sections/about/values';
import { JsonLd } from '@/components/seo/json-ld';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { getAbout, getSite } from '@/lib/content';
import { tFor } from '@/lib/i18n';
import { LANG_TAG, localizePath, type Locale } from '@/lib/i18n/locales';
import { SCHOOL_ID, SITE_URL, absoluteUrl } from '@/lib/json-ld';
import { mediaUrl } from '@/lib/media';
import { buildMetadata, truncate } from '@/lib/seo';

export async function aboutMetadata(locale: Locale): Promise<Metadata> {
  const [about, site] = await Promise.all([getAbout(locale), getSite(locale)]);
  return buildMetadata({
    title: about.hero.title,
    description: truncate(about.story.paragraphs[0] ?? about.hero.subtitle, 155),
    path: '/about',
    image: site.ogImage ? mediaUrl(site.ogImage) : undefined,
    siteName: site.name,
    locale,
  });
}

export async function AboutPageView({ locale }: { locale: Locale }) {
  const about = await getAbout(locale);
  const t = tFor(locale);
  const path = localizePath('/about', locale);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${SITE_URL}${path}#page`,
    url: absoluteUrl(path),
    name: about.hero.title,
    description: about.hero.subtitle,
    about: { '@id': SCHOOL_ID },
    inLanguage: LANG_TAG[locale],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <PageHero
        title={about.hero.title}
        subtitle={about.hero.subtitle}
        breadcrumb={[{ label: t.nav.home, href: '/' }, { label: about.hero.title }]}
        image={about.hero.image}
        imageAlt={about.hero.imageAlt}
        imagePosition="center 28%"
        locale={locale}
      />

      <Story story={about.story} />
      <AboutStats stats={about.stats} />

      <Reveal as="section" className="section-y pt-6 md:pt-10">
        <Container className="grid gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-12">
          <MissionVision heading={about.missionVisionTitle} mission={about.mission} vision={about.vision} />
          <span aria-hidden="true" className="h-px w-full bg-line lg:h-auto lg:w-px" />
          <Values heading={about.valuesTitle} values={about.values} />
        </Container>
      </Reveal>

      {/* peacock feather sits on top of the footer wave (bottom-left, desktop only) */}
      <div className="relative">
        <PeacockFeather className="absolute -left-3 bottom-0 z-0 h-20 xl:h-24" />
      </div>
    </>
  );
}
