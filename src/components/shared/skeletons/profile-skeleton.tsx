import { Skeleton } from "@/src/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-6">
        <Skeleton className="h-20 w-20 rounded-full shrink-0" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, col) => (
          <div
            key={col}
            className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5"
          >
            <Skeleton className="h-5 w-40 mb-1" />
            {Array.from({ length: 5 }).map((_, row) => (
              <div key={row} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
