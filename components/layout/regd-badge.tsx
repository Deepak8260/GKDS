import { OdishaEmblemIcon } from '@/components/icons/custom-icons';
import { splitRegNo, cn } from '@/lib/utils';

/** "Govt. of Odisha / Regd. No. 10/13" badge with the state emblem. */
export function RegdBadge({ regNo, className }: { regNo: string; className?: string }) {
  const [line1, line2] = splitRegNo(regNo);
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl bg-orange-50 px-3 py-2 shadow-card',
        className,
      )}
    >
      <OdishaEmblemIcon size={34} />
      <p className="text-[13px] font-bold leading-tight text-ink">
        {line1}
        {line2 ? (
          <>
            <br />
            {line2}
          </>
        ) : null}
      </p>
    </div>
  );
}
