import { Eye, Target } from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';
import type { About } from '@/lib/validators';

interface MissionVisionProps {
  heading: About['missionVisionTitle'];
  mission: About['mission'];
  vision: About['vision'];
}

/** "Our Mission & Vision": two icon rows (target = mission, eye = vision). */
export function MissionVision({ heading, mission, vision }: MissionVisionProps) {
  const rows = [
    { Icon: Target, item: mission },
    { Icon: Eye, item: vision },
  ];
  return (
    <div>
      <SectionHeading lead={heading} size="md" />
      <ul className="mt-6 divide-y divide-line">
        {rows.map(({ Icon, item }) => (
          <li key={item.title} className="flex items-start gap-5 py-6 first:pt-2 last:pb-0">
            <span className="flex size-[72px] shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <Icon className="size-9" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-green-900 md:text-[17px]">{item.title}</h3>
              <p className="mt-1.5 text-base leading-relaxed text-ink">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
