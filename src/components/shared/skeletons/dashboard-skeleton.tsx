import { Skeleton } from "@/src/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-40 mb-1" />
        <Skeleton className="h-3 w-56 mb-6" />
        <Skeleton className="h-70 w-full rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, col) => (
          <div
            key={col}
            className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4"
          >
            <Skeleton className="h-5 w-36 mb-1" />
            {Array.from({ length: 5 }).map((_, row) => (
              <div key={row} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
