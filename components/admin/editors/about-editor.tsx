'use client';

import { SafeImage as Image } from '@/components/ui/safe-image';
import { mediaUrl } from '@/lib/media';
import { Area, ContentEditor, Icons, Img, List, Section, Text, useEditor } from '../editor';

const blankFeature = () => ({ icon: 'star', title: '', text: '' });
const blankStat = () => ({ icon: 'star', title: '', subtitle: '' });
const titleOf = (v: unknown) => String((v as { title?: string }).title || 'New item');

/** Shows how the story photo is cropped inside its frame for the chosen focus point. */
function FocusPreview() {
  const ed = useEditor();
  const src = String(ed.get('story.image') ?? '');
  const position = String(ed.get('story.imagePosition') ?? '') || 'center';
  if (!src) return null;
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">Crop preview</p>
      <div className="relative aspect-[4/3] w-full max-w-xs overflow-hidden rounded-xl border border-line bg-green-50">
        <Image
          src={mediaUrl(src)}
          alt=""
          fill
          sizes="320px"
          className="object-cover"
          style={{ objectPosition: position }}
          unoptimized
        />
      </div>
    </div>
  );
}

export function AboutEditor() {
  return (
    <ContentEditor
      name="about"
      title="About Page"
      description="The About Us page: banner, story, numbers, mission, vision and values."
      previewPath="/about"
    >
      <Section title="Banner" paths={['hero']}>
        <Text path="hero.title" label="Title" required maxLength={120} />
        <Area path="hero.subtitle" label="Subtitle" required rows={2} maxLength={300} />
        <Img path="hero.image" altPath="hero.imageAlt" label="Banner image" />
      </Section>

      <Section title="Our story" paths={['story']}>
        <Text path="story.eyebrow" label="Small line above the title" required maxLength={40} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Text path="story.titleLead" label="Title (first part)" required maxLength={60} />
          <Text
            path="story.titleHighlight"
            label="Highlighted words (orange)"
            required
            maxLength={60}
          />
        </div>
        <p className="text-sm font-medium text-ink">Paragraphs</p>
        <List
          path="story.paragraphs"
          noun="paragraph"
          min={1}
          max={5}
          createItem={() => ''}
          itemLabel={(v, i) => String(v).slice(0, 40) || `Paragraph ${i + 1}`}
        >
          {(base) => <Area path={base} label="Paragraph" required rows={4} maxLength={1500} />}
        </List>
        <Img path="story.image" altPath="story.imageAlt" label="Story photo" />
        <Text
          path="story.imagePosition"
          label="Image focus (optional)"
          maxLength={30}
          placeholder="75% center"
          hint="Which part of the photo stays visible when it is cropped. Examples: center, 75% center, left top."
        />
        <FocusPreview />
      </Section>

      <Section
        title="Numbers strip"
        paths={['stats']}
        description="Up to four highlights shown under the story."
      >
        <List path="stats" noun="number" min={1} max={4} createItem={blankStat} itemLabel={titleOf}>
          {(base) => (
            <>
              <Icons path={`${base}.icon`} label="Icon" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Text path={`${base}.title`} label="Heading" required maxLength={80} />
                <Text path={`${base}.subtitle`} label="Caption" maxLength={120} />
              </div>
            </>
          )}
        </List>
      </Section>

      <Section title="Mission and vision" paths={['missionVisionTitle', 'mission', 'vision']}>
        <Text path="missionVisionTitle" label="Section heading" required maxLength={60} />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-5">
            <Text path="mission.title" label="Mission title" required maxLength={60} />
            <Area path="mission.text" label="Mission text" required rows={4} maxLength={400} />
          </div>
          <div className="space-y-5">
            <Text path="vision.title" label="Vision title" required maxLength={60} />
            <Area path="vision.text" label="Vision text" required rows={4} maxLength={400} />
          </div>
        </div>
      </Section>

      <Section title="Our values" paths={['valuesTitle', 'values']}>
        <Text path="valuesTitle" label="Section heading" required maxLength={60} />
        <List
          path="values"
          noun="value"
          min={3}
          max={6}
          createItem={blankFeature}
          itemLabel={titleOf}
        >
          {(base) => (
            <>
              <Icons path={`${base}.icon`} label="Icon" />
              <Text path={`${base}.title`} label="Title" required maxLength={120} />
              <Area path={`${base}.text`} label="Description" rows={2} maxLength={300} />
            </>
          )}
        </List>
      </Section>
    </ContentEditor>
  );
}
