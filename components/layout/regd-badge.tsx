import Image from 'next/image';
import { splitRegNo, cn } from '@/lib/utils';

/** "Govt. of Odisha / Regd. No. 10/13" badge with the official state seal. */
export function RegdBadge({ regNo, className }: { regNo: string; className?: string }) {
  const [line1, line2] = splitRegNo(regNo);
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl bg-orange-50 px-3 py-1.5 shadow-card',
        className,
      )}
    >
      <Image
        src="/assets/brand/odisha-seal.png"
        alt=""
        width={129}
        height={160}
        className="h-10 w-auto shrink-0"
      />
      <p className="text-[12.5px] font-bold leading-tight text-ink">
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
