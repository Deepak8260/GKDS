import { jsonLdString } from '@/lib/json-ld';

/** Renders structured data as a <script type="application/ld+json"> tag (safely serialised). */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}
