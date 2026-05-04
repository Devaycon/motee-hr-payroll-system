import { Skeleton } from "@/src/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

const COL_WIDTHS = [
  "w-44",
  "w-28",
  "w-24",
  "w-20",
  "w-16",
  "w-20",
  "w-24",
  "w-28",
];

export function TableSkeleton({
  rows = 8,
  columns = 5,
  showHeader = true,
}: TableSkeletonProps) {
  const colWidths = Array.from(
    { length: columns },
    (_, i) => COL_WIDTHS[i % COL_WIDTHS.length],
  );

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {showHeader && (
        <div className="flex items-center gap-6 px-5 py-4 border-b border-border bg-muted/30">
          {colWidths.map((w, i) => (
            <Skeleton key={i} className={`h-3.5 ${w}`} />
          ))}
        </div>
      )}

      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex items-center gap-6 px-5 py-3.5">
            {colWidths.map((w, col) => (
              <div
                key={col}
                className={`flex items-center gap-2.5 ${col === 0 ? "flex-1" : w}`}
              >
                {col === 0 && (
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                )}
                <Skeleton className={`h-3.5 ${col === 0 ? "w-36" : w}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
