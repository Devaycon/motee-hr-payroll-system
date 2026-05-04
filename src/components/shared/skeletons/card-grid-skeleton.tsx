import { Skeleton } from "@/src/components/ui/skeleton";

interface CardGridSkeletonProps {
  count?: number;
  columns?: number;
}

export function CardGridSkeleton({
  count = 6,
  columns = 3,
}: CardGridSkeletonProps) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>

          <Skeleton className="h-5 w-20 rounded-full" />

          <Skeleton className="h-px w-full" />

          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
