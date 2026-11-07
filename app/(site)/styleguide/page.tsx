import type { Metadata } from 'next';
import { Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckList } from '@/components/ui/check-list';
import { Container } from '@/components/ui/container';
import { CTABanner } from '@/components/ui/cta-banner';
import { ICON_NAMES, Icon } from '@/components/ui/icon';
import { IconTile } from '@/components/ui/icon-tile';
import { Pill } from '@/components/ui/pill';
import { SectionHeading } from '@/components/ui/section-heading';
import { Skeleton } from '@/components/ui/skeleton';
import { StatBar } from '@/components/ui/stat-bar';
import { Stars } from '@/components/ui/stars';
import { Logo } from '@/components/layout/logo';
import { PageHero } from '@/components/layout/page-hero';
import { PeacockFeather } from '@/components/layout/peacock-feather';
import { RegdBadge } from '@/components/layout/regd-badge';
import { WaveDivider } from '@/components/layout/wave-divider';
import { StyleguideDemo } from './styleguide-demo';

export const metadata: Metadata = {
  title: 'Styleguide',
  robots: { index: false, follow: false },
};

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-8">
      <h2 className="mb-5 border-b border-line pb-2 font-body text-sm font-bold uppercase tracking-widest text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Temporary visual check of the design system (blocked in prompt 09). */
export default function StyleguidePage() {
  return (
    <>
      <PageHero
        title="Styleguide"
        subtitle="Every shared component with sample props."
        breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Styleguide' }]}
        image="/placeholders/hero-building.svg"
        imageAlt="Placeholder building"
      />
      <Container className="pb-20">
        <Block title="Colours">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              ['green-950', 'bg-green-950 text-white'],
              ['green-900', 'bg-green-900 text-white'],
              ['green-800', 'bg-green-800 text-white'],
              ['green-700', 'bg-green-700 text-white'],
              ['green-100', 'bg-green-100'],
              ['green-50', 'bg-green-50'],
              ['orange-700', 'bg-orange-700 text-white'],
              ['orange-600', 'bg-orange-600 text-white'],
              ['orange-500', 'bg-orange-500 text-white'],
              ['orange-100', 'bg-orange-100'],
              ['orange-50', 'bg-orange-50'],
              ['cream', 'bg-cream border border-line'],
              ['ink', 'bg-ink text-white'],
              ['muted', 'bg-muted text-white'],
            ].map(([name, cls]) => (
              <div key={name} className={`rounded-xl p-4 text-sm font-semibold ${cls}`}>
                {name}
              </div>
            ))}
          </div>
        </Block>

        <Block title="Typography">
          <p className="font-display text-5xl font-bold italic text-green-900">
            Learn to Drive <span className="text-orange-500">with Confidence</span>
          </p>
          <p className="mt-3 font-display text-4xl font-bold text-green-900">Inner hero title (upright)</p>
          <p className="mt-3 text-base text-ink">Body text — Inter 16px. Practical, step-by-step driving training.</p>
          <p className="mt-1 text-sm text-muted">Small muted text — 14px.</p>
        </Block>

        <Block title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button arrow>Enquire Now</Button>
            <Button icon={<Phone className="size-5" aria-hidden="true" />}>Call Now</Button>
            <Button variant="secondary">Secondary orange</Button>
            <Button variant="secondary" tone="green" icon={<Phone className="size-5" aria-hidden="true" />}>
              Secondary green
            </Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="sm" arrow>
              Small
            </Button>
            <Button size="lg" arrow>
              Large
            </Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Block>

        <Block title="Section headings">
          <div className="space-y-8">
            <SectionHeading
              eyebrow="Our driving courses"
              lead="Choose the Right Course"
              highlight="for You"
              subtitle="Flexible and practical driving courses designed for beginners as well as experienced learners."
              action={{ label: 'View All Courses', href: '/courses' }}
            />
            <SectionHeading lead="Our Driving" highlight="Courses" dash="before" size="lg" subtitle="Dash inline before the heading." />
            <SectionHeading lead="Photo" highlight="Gallery" size="sm" />
          </div>
        </Block>

        <Block title="Pill · Badge · Stars">
          <div className="flex flex-wrap items-center gap-4">
            <Pill>WagonR</Pill>
            <Pill>Vehicle: Maruti 800</Pill>
            <Badge>3</Badge>
            <Badge tone="green">12</Badge>
            <Badge tone="neutral">New</Badge>
            <Stars value={5} />
            <Stars value={4.5} size={24} />
            <Stars value={3} />
          </div>
        </Block>

        <Block title="StatBar">
          <div className="space-y-6">
            <StatBar
              items={[
                { icon: 'award', title: '30+ Years', subtitle: 'Experience' },
                { icon: 'users', title: 'Certified', subtitle: 'Trainers' },
                { icon: 'car', title: 'Car & Small Car', subtitle: 'Training' },
                { icon: 'shield-check', title: 'Safe & Practical', subtitle: 'Training' },
              ]}
            />
          </div>
        </Block>

        <Block title="IconTile · CheckList · Card">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <IconTile icon="graduation-cap" label="Experienced & Friendly Trainers" />
            <IconTile icon="road" label="Real Road Training" />
            <IconTile icon="car" label="Well-Maintained Vehicles" />
            <IconTile icon="steering-wheel" label="Vehicle Practice" />
            <IconTile icon="headphones" label="Personal Guidance" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <IconTile variant="horizontal" icon="file-text" label="Licence Test Preparation" />
            <IconTile variant="horizontal" icon="shield-check" label="Road Safety & Traffic Rules" />
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Card tone="green-soft" className="p-6">
              <h3 className="font-body text-xl font-bold text-green-900">Car Driving Course</h3>
              <p className="mt-1 text-ink/80">Learn to drive a car with step-by-step practical training.</p>
              <Pill className="mt-3">Vehicle: WagonR</Pill>
              <CheckList className="mt-4" items={['Beginner Friendly', 'Real Road Training', 'Licence Test Guidance']} />
            </Card>
            <Card hover tone="orange-soft" className="p-6">
              <p className="font-semibold text-green-900">Hover card (orange-soft)</p>
              <p className="mt-1 text-ink/80">Lifts on hover with a larger warm shadow.</p>
            </Card>
          </div>
        </Block>

        <Block title="CTABanner">
          <CTABanner
            lead="Ready to Start Your"
            highlight="Driving Journey?"
            text="Enroll today and learn to drive with confidence at Gopal Krushna Driving Training School."
            action={<Button icon={<Phone className="size-5" aria-hidden="true" />}>Call Now</Button>}
          />
        </Block>

        <Block title="Logo · Regd. badge · Decoration">
          <div className="flex flex-wrap items-center gap-8">
            <Logo />
            <div className="rounded-xl bg-green-900 p-4">
              <Logo variant="dark" />
            </div>
            <RegdBadge regNo="Govt. of Odisha Regd. No. 10/13" />
            <PeacockFeather className="!block h-32" />
          </div>
        </Block>

        <Block title="WaveDivider">
          <div className="relative overflow-hidden rounded-xl bg-green-900 pt-24">
            <WaveDivider />
          </div>
        </Block>

        <Block title="Skeleton · Modal · Toast">
          <div className="mb-5 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <StyleguideDemo />
        </Block>

        <Block title={`Icon whitelist (${ICON_NAMES.length})`}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {ICON_NAMES.map((name) => (
              <li key={name} className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs">
                <span className="text-orange-500">
                  <Icon name={name} size={20} />
                </span>
                {name}
              </li>
            ))}
          </ul>
        </Block>
      </Container>
    </>
  );
}
