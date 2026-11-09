'use client';

import { Phone as PhoneIcon } from 'lucide-react';
import { RegdBadge } from '@/components/layout/regd-badge';
import { extractMapSrc } from '@/lib/admin/map';
import { isGoogleMapsEmbed } from '@/lib/validators';
import { telHref, whatsappHref } from '@/lib/utils';
import {
  Area,
  Choice,
  ContentEditor,
  Img,
  List,
  Num,
  Section,
  Tags,
  Text,
  Time,
  useEditor,
} from '../editor';

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];
const DAY_OPTIONS = DAYS.map((d) => ({ value: String(d.value), label: d.label }));

function BadgePreview() {
  const ed = useEditor();
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">Header badge preview</p>
      <RegdBadge regNo={String(ed.get('regNo') ?? '')} className="inline-flex" />
    </div>
  );
}

function PhoneItem({ base }: { base: string }) {
  const ed = useEditor();
  const value = String(ed.get(base) ?? '');
  return (
    <>
      <Text
        path={base}
        label="Phone number"
        required
        inputMode="tel"
        type="tel"
        maxLength={20}
        placeholder="+91 91241 63306"
      />
      {value.trim() ? (
        <a
          href={telHref(value)}
          className="focus-ring inline-flex min-h-11 items-center gap-2 rounded text-sm font-semibold text-green-800 underline underline-offset-2"
        >
          <PhoneIcon className="size-4" aria-hidden="true" /> Test call link ({telHref(value)})
        </a>
      ) : null}
    </>
  );
}

function WhatsappPreview() {
  const ed = useEditor();
  const number = String(ed.get('whatsapp') ?? '');
  const message = String(ed.get('whatsappMessage') ?? '');
  if (!/^\d{10,15}$/.test(number)) return null;
  const href = whatsappHref(number, message);
  return (
    <div className="rounded-lg bg-green-50 p-3 text-sm">
      <p className="break-all text-muted">{href}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring mt-2 inline-flex min-h-11 items-center rounded font-semibold text-green-800 underline underline-offset-2"
      >
        Open this WhatsApp link (test)
      </a>
    </div>
  );
}

function DaysPicker() {
  const ed = useEditor();
  const open = (ed.get('openDays') as number[] | undefined) ?? [];
  return (
    <fieldset data-field-path="openDays">
      <legend className="mb-1.5 text-sm font-medium text-ink">Open on these days</legend>
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => {
          const on = open.includes(d.value);
          return (
            <label
              key={d.value}
              className={`flex min-h-11 min-w-14 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-semibold focus-within:ring-2 focus-within:ring-orange-500 ${on ? 'border-green-700 bg-green-700 text-white' : 'border-line bg-white text-ink'}`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={on}
                onChange={() =>
                  ed.set(
                    'openDays',
                    on
                      ? open.filter((x) => x !== d.value)
                      : [...open, d.value].sort((a, b) => a - b),
                  )
                }
              />
              {d.label}
            </label>
          );
        })}
      </div>
      {ed.err('openDays') ? (
        <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">
          {ed.err('openDays')}
        </p>
      ) : null}
    </fieldset>
  );
}

function MapField() {
  const ed = useEditor();
  const value = String(ed.get('map.embedUrl') ?? '');
  const valid = isGoogleMapsEmbed(value);
  return (
    <>
      <Area
        path="map.embedUrl"
        label="Embed URL"
        required
        rows={3}
        maxLength={2000}
        transform={extractMapSrc}
        hint={
          <>
            Google Maps → search your place → <strong>Share</strong> → <strong>Embed a map</strong>{' '}
            → copy. You can paste the whole <code>&lt;iframe …&gt;</code> snippet and we pick out
            the link for you.
          </>
        }
      />
      {valid ? (
        <iframe
          title="Map preview"
          src={value}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-64 w-full rounded-xl border border-line"
        />
      ) : (
        <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-800">
          The preview appears when the embed link is valid.
        </p>
      )}
    </>
  );
}

export function SiteEditor() {
  return (
    <ContentEditor
      name="site"
      title="Site Settings"
      description="Your school name, contact details, hours, map and search-engine text. Changes appear across the whole website."
      previewPath="/"
    >
      <Section
        title="Brand"
        paths={['name', 'shortName', 'tagline', 'regNo', 'logo', 'favicon', 'ogImage']}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Text path="name" label="School name" required maxLength={120} />
          <Text
            path="shortName"
            label="Short name"
            required
            maxLength={60}
            hint="Shown in the header and footer."
          />
        </div>
        <Text path="tagline" label="Tagline" required maxLength={160} />
        <Text
          path="regNo"
          label="Registration text"
          required
          maxLength={80}
          hint="Example: Govt. of Odisha Regd. No. 10/13. The badge splits it at the word Regd. into two lines."
        />
        <BadgePreview />
        <Img path="logo" label="Logo" hint="Square, at least 400 × 400 px." />
        <Img path="favicon" label="Favicon (browser tab icon)" />
        <Img
          path="ogImage"
          label="Social share image"
          hint="Shown when the site is shared on WhatsApp or Facebook. 1200 × 630 px works best."
        />
      </Section>

      <Section
        title="Contact"
        paths={['phones', 'whatsapp', 'whatsappMessage', 'email', 'callCardText']}
      >
        <List
          path="phones"
          noun="phone number"
          min={1}
          max={4}
          createItem={() => ''}
          itemLabel={(v) => String(v || 'New phone number')}
        >
          {(base) => <PhoneItem base={base} />}
        </List>
        <Text
          path="whatsapp"
          label="WhatsApp number"
          required
          inputMode="numeric"
          maxLength={15}
          hint="Digits only, with the country code. Example: 919876543210"
        />
        <Area
          path="whatsappMessage"
          label="WhatsApp pre-filled message"
          required
          rows={2}
          maxLength={300}
        />
        <WhatsappPreview />
        <Text path="email" label="Email" required type="email" maxLength={120} />
        <Area
          path="callCardText"
          label="Call card text"
          required
          rows={2}
          maxLength={300}
          hint="The sentence shown on the Contact page call card."
        />
      </Section>

      <Section title="Address" paths={['address']}>
        <Text path="address.line1" label="Address line 1" required maxLength={120} />
        <Text path="address.line2" label="Address line 2" maxLength={120} />
        <Text
          path="address.landmark"
          label="Landmark"
          maxLength={120}
          placeholder="Near Baleswar Bus Stand"
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <Text path="address.city" label="City" required maxLength={60} />
          <Text path="address.state" label="State" required maxLength={60} />
          <Text path="address.pin" label="PIN code" required inputMode="numeric" maxLength={6} />
        </div>
      </Section>

      <Section
        title="Working hours"
        paths={['hours', 'openDays', 'openFrom', 'openTo', 'dayHours']}
        description="The lines shown to visitors, and the schedule behind the Open now badge (India time, IST)."
      >
        <List
          path="hours"
          noun="hours line"
          min={1}
          max={7}
          createItem={() => ({ label: '', value: '' })}
          itemLabel={(v) => String((v as { label?: string }).label || 'New line')}
        >
          {(base) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Text
                path={`${base}.label`}
                label="Days"
                required
                maxLength={40}
                placeholder="Mon – Sat"
              />
              <Text
                path={`${base}.value`}
                label="Time"
                required
                maxLength={60}
                placeholder="5:00 AM – 9:00 PM"
              />
            </div>
          )}
        </List>
        <DaysPicker />
        <div className="grid gap-5 sm:grid-cols-2">
          <Time path="openFrom" label="Opens at" />
          <Time path="openTo" label="Closes at" hint="Timezone: India (IST)" />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">
            Different hours on a particular day (optional)
          </p>
          <List
            path="dayHours"
            noun="special day"
            max={7}
            createItem={() => ({ day: 0, from: '06:00', to: '21:00' })}
            itemLabel={(v) =>
              `Special hours: ${DAYS.find((d) => d.value === (v as { day: number }).day)?.label ?? ''}`
            }
          >
            {(base) => (
              <div className="grid gap-4 sm:grid-cols-3">
                <Choice path={`${base}.day`} label="Day" options={DAY_OPTIONS} numeric />
                <Time path={`${base}.from`} label="Opens at" />
                <Time path={`${base}.to`} label="Closes at" />
              </div>
            )}
          </List>
        </div>
      </Section>

      <Section
        title="Social links"
        paths={['social']}
        description="Leave a link empty to hide its icon in the footer."
      >
        <Text
          path="social.youtube"
          label="YouTube"
          placeholder="https://www.youtube.com/@yourchannel"
          maxLength={500}
        />
        <Text
          path="social.facebook"
          label="Facebook"
          placeholder="https://www.facebook.com/yourpage"
          maxLength={500}
        />
        <Text
          path="social.instagram"
          label="Instagram"
          placeholder="https://www.instagram.com/yourpage"
          maxLength={500}
        />
      </Section>

      <Section title="Google Map" paths={['map']}>
        <MapField />
        <Text
          path="map.directionsUrl"
          label="Get directions link"
          required
          maxLength={1000}
          hint="Open your place in Google Maps, press Share, and paste the link."
        />
      </Section>

      <Section title="Search engines (SEO)" paths={['seo']}>
        <Text path="seo.title" label="Page title" required maxLength={120} />
        <Area
          path="seo.description"
          label="Meta description"
          required
          rows={3}
          maxLength={200}
          hint="Ideal length: 120–155 characters."
        />
        <Tags path="seo.keywords" label="Keywords" />
      </Section>

      <Section
        title="Headline statistics"
        paths={['stats']}
        description="Numbers used around the site (home page, about page, structured data)."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Num path="stats.sinceYear" label="Established (year)" required min={1900} max={2100} />
          <Text
            path="stats.yearsLabel"
            label="Years label"
            required
            maxLength={40}
            placeholder="30+ Years"
          />
          <Text
            path="stats.trainedDrivers"
            label="Trained drivers"
            required
            maxLength={40}
            placeholder="1000+"
          />
          <Text
            path="stats.successRateLabel"
            label="Success label"
            required
            maxLength={60}
            placeholder="High Success Rate"
          />
          <Num
            path="stats.rating"
            label="Rating (0–5)"
            min={0}
            max={5}
            step={0.1}
            hint="The Reviews page always shows the real average from reviews."
          />
          <Text
            path="stats.ratingCount"
            label="Rating count label"
            required
            maxLength={40}
            placeholder="250+"
          />
          <Num path="stats.recommendPercent" label="Recommend %" min={0} max={100} />
        </div>
      </Section>
    </ContentEditor>
  );
}
