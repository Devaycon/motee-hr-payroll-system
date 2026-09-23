import { Skeleton } from "@/src/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 py-6">
      <Skeleton className="h-16 w-72" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
