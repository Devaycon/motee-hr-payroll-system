"use client";

import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useStatCards } from "../hooks";

export function StatCards() {
  const { data, loading } = useStatCards();

  if (loading || !data) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return <HrStatCardsGrid stats={data} columns={3} />;
}
