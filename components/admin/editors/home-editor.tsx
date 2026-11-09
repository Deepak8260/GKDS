'use client';

import type { ReactNode } from 'react';
import { useAdminBase } from '../admin-client';
import { Area, ContentEditor, Icons, Img, List, Section, Text } from '../editor';

const blankFeature = () => ({ icon: 'star', title: '', text: '' });
const blankStat = () => ({ icon: 'star', title: '', subtitle: '' });
const titleOf = (v: unknown) => String((v as { title?: string }).title || 'New item');

function Note({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">{children}</p>;
}

/** Icon + title + optional second line: the shape of trust-bar items, "why choose us" items and journey steps. */
function FeatureItem({ base, secondLabel }: { base: string; secondLabel?: string }) {
  return (
    <>
      <Icons path={`${base}.icon`} label="Icon" />
      <Text path={`${base}.title`} label="Title" required maxLength={120} />
      {secondLabel ? <Text path={`${base}.text`} label={secondLabel} maxLength={300} /> : null}
    </>
  );
}

export function HomeEditor() {
  const adminBase = useAdminBase();
  return (
    <ContentEditor
      name="home"
      title="Home Page"
      description="Every block of the home page, in the order visitors see it. Open a block to edit it."
      previewPath="/"
    >
      <Section
        accordion
        title="1. Hero (top banner)"
        summary="Big headline, subtitle, photo and the two buttons"
        paths={['hero']}
      >
        <Text path="hero.eyebrow" label="Small line above the headline" required maxLength={80} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Text path="hero.titleLead" label="Headline (first part)" required maxLength={60} />
          <Text
            path="hero.titleHighlight"
            label="Highlighted words (orange)"
            required
            maxLength={60}
          />
        </div>
        <Area path="hero.subtitle" label="Subtitle" required rows={3} maxLength={300} />
        <Img path="hero.image" altPath="hero.imageAlt" label="Hero image" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Text path="hero.primaryCta" label="Main button label" required maxLength={30} />
          <Text path="hero.secondaryCta" label="Second button label" required maxLength={30} />
        </div>
      </Section>

      <Section
        accordion
        title="2. Trust bar"
        summary="The strip of highlights under the hero (3 to 5 items)"
        paths={['trustBar']}
      >
        <List
          path="trustBar"
          noun="item"
          min={3}
          max={5}
          createItem={blankFeature}
          itemLabel={titleOf}
        >
          {(base) => <FeatureItem base={base} secondLabel="Second line (optional)" />}
        </List>
      </Section>

      <Section
        accordion
        title="3. About teaser"
        summary="Short about-us block with photo and three numbers"
        paths={['aboutTeaser']}
      >
        <Text
          path="aboutTeaser.eyebrow"
          label="Small line above the title"
          required
          maxLength={40}
        />
        <Text path="aboutTeaser.title" label="Title" required maxLength={120} />
        <Area path="aboutTeaser.body" label="Text" required rows={5} maxLength={600} />
        <Img path="aboutTeaser.image" altPath="aboutTeaser.imageAlt" label="Photo" />
        <p className="text-sm font-medium text-ink">Highlight numbers</p>
        <List
          path="aboutTeaser.stats"
          noun="number"
          min={1}
          max={4}
          createItem={blankStat}
          itemLabel={titleOf}
        >
          {(base) => (
            <>
              <Icons path={`${base}.icon`} label="Icon" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Text
                  path={`${base}.title`}
                  label="Number or heading"
                  required
                  maxLength={80}
                  placeholder="1993"
                />
                <Text
                  path={`${base}.subtitle`}
                  label="Caption"
                  maxLength={120}
                  placeholder="Serving Baleswar"
                />
              </div>
            </>
          )}
        </List>
      </Section>

      <Section
        accordion
        title="3b. Message from the owner"
        summary="Welcome video from the owner with a short text (shown once a YouTube link is added)"
        paths={['ownerMessage']}
      >
        <Note>
          Upload the video to YouTube (it can be &ldquo;Unlisted&rdquo;), then paste its link below. Until a link is added this section is hidden on the website.
        </Note>
        <Text path="ownerMessage.videoUrl" label="Video link (YouTube link or video file path)" maxLength={300} placeholder="https://www.youtube.com/watch?v=…" />
        <Text path="ownerMessage.videoTitle" label="Video title (read by screen readers)" maxLength={120} />
        <Text path="ownerMessage.eyebrow" label="Small line above the title" required maxLength={40} />
        <Text path="ownerMessage.title" label="Title" required maxLength={120} />
        <Area path="ownerMessage.body" label="Text next to the video" required rows={5} maxLength={800} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Text path="ownerMessage.ownerName" label="Owner's name (optional)" maxLength={80} />
          <Text path="ownerMessage.ownerRole" label="Role (optional)" maxLength={80} />
        </div>
      </Section>

      <Section
        accordion
        title="4. Why choose us"
        summary="Reasons to pick the school (3 to 6 items)"
        paths={['whyChoose']}
      >
        <Text path="whyChoose.eyebrow" label="Small line above the title" required maxLength={40} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Text path="whyChoose.lead" label="Title (first part)" required maxLength={60} />
          <Text
            path="whyChoose.highlight"
            label="Highlighted words (orange)"
            required
            maxLength={60}
          />
        </div>
        <List
          path="whyChoose.items"
          noun="reason"
          min={3}
          max={6}
          createItem={blankFeature}
          itemLabel={titleOf}
        >
          {(base) => <FeatureItem base={base} />}
        </List>
      </Section>

      <Section
        accordion
        title="5. Courses intro"
        summary="Heading above the course cards"
        paths={['coursesIntro']}
      >
        <Note>
          The course cards themselves come from the courses list.{' '}
          <a className="font-semibold underline underline-offset-2" href={`${adminBase}/courses`}>
            Manage courses
          </a>
        </Note>
        <Text
          path="coursesIntro.eyebrow"
          label="Small line above the title"
          required
          maxLength={40}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Text path="coursesIntro.lead" label="Title (first part)" required maxLength={80} />
          <Text
            path="coursesIntro.highlight"
            label="Highlighted words (orange)"
            required
            maxLength={40}
          />
        </div>
        <Area path="coursesIntro.subtitle" label="Subtitle" required rows={3} maxLength={300} />
      </Section>

      <Section
        accordion
        title="6. Learning journey"
        summary="Step-by-step path from enrolment to licence (3 to 6 steps)"
        paths={['journey']}
      >
        <Text path="journey.eyebrow" label="Small line above the title" required maxLength={40} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Text path="journey.lead" label="Title (first part)" required maxLength={80} />
          <Text
            path="journey.highlight"
            label="Highlighted words (orange)"
            required
            maxLength={60}
          />
        </div>
        <List
          path="journey.steps"
          noun="step"
          min={3}
          max={6}
          createItem={blankFeature}
          itemLabel={titleOf}
        >
          {(base) => <FeatureItem base={base} secondLabel="Caption" />}
        </List>
      </Section>

      <Section
        accordion
        title="7. Reviews intro"
        summary="Heading above the featured reviews"
        paths={['reviewsIntro']}
      >
        <Note>
          Featured reviews are picked in the Reviews section. The block only shows once at least one
          review is featured.
        </Note>
        <Text
          path="reviewsIntro.eyebrow"
          label="Small line above the title"
          required
          maxLength={40}
        />
        <Text path="reviewsIntro.title" label="Title" required maxLength={80} />
      </Section>

      <Section
        accordion
        title="8. Contact teaser"
        summary="Call-to-action block above the footer"
        paths={['contactTeaser']}
      >
        <Note>
          Phone numbers, address, hours and the map come from{' '}
          <a className="font-semibold underline underline-offset-2" href={`${adminBase}/settings`}>
            Site Settings
          </a>
          .
        </Note>
        <Text
          path="contactTeaser.eyebrow"
          label="Small line above the title"
          required
          maxLength={40}
        />
        <Text path="contactTeaser.title" label="Title" required maxLength={60} />
        <Area path="contactTeaser.body" label="Text" required rows={3} maxLength={300} />
      </Section>
    </ContentEditor>
  );
}
