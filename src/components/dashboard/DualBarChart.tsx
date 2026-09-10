import { formatCompactCents } from "@/lib/money";
import type { PeriodBucket } from "@/lib/analytics";

export function DualBarChart({
  data,
  grossLabel = "Bruto",
  netLabel = "Líquido",
}: {
  data: PeriodBucket[];
  grossLabel?: string;
  netLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.grossCents));
  const chartHeight = 160;

  return (
    <div>
      <div className="flex items-end gap-3 sm:gap-5">
        {data.map((bucket) => (
          <div key={bucket.key} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="flex w-full items-end justify-center gap-1"
              style={{ height: chartHeight }}
            >
              <div
                className="w-1/2 max-w-5 rounded-t bg-brand/25"
                style={{ height: Math.max(2, (bucket.grossCents / max) * chartHeight) }}
                title={`${grossLabel}: ${formatCompactCents(bucket.grossCents)}`}
              />
              <div
                className="w-1/2 max-w-5 rounded-t bg-brand"
                style={{ height: Math.max(2, (bucket.netCents / max) * chartHeight) }}
                title={`${netLabel}: ${formatCompactCents(bucket.netCents)}`}
              />
            </div>
            <span className="text-[11px] font-medium text-foreground/50">{bucket.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-foreground/60">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand/25" /> {grossLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> {netLabel}
        </span>
      </div>
    </div>
  );
}
