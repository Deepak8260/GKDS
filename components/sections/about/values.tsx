import { Icon } from '@/components/ui/icon';
import { SectionHeading } from '@/components/ui/section-heading';
import type { About } from '@/lib/validators';

interface ValuesProps {
  heading: About['valuesTitle'];
  values: About['values'];
}

/** "Our Values": rows with an orange icon tile, bold title and a one-line description. */
export function Values({ heading, values }: ValuesProps) {
  return (
    <div>
      <SectionHeading lead={heading} size="md" />
      <ul className="mt-6 divide-y divide-line">
        {values.map((v, i) => (
          <li key={`${v.title}-${i}`} className="flex items-center gap-4 py-4 first:pt-2 last:pb-0">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <Icon name={v.icon} size={28} />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-green-900">{v.title}</h3>
              {v.text ? <p className="mt-0.5 text-[14px] leading-snug text-muted">{v.text}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
