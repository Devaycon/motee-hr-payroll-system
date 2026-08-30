"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tile, TileLabel, TileSub, MiniBars } from "./tiles";
import { useLeaveTrends } from "../hooks";

/**
 * "Other" leave is a mix of types, so a single count says little. The tile
 * shows its direction over the last few months instead — the Annual and Sick
 * tiles beside it stay single figures.
 */
export function OtherLeaveTrendTile() {
  const { data: trends, loading } = useLeaveTrends();

  if (loading || !trends) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const data = trends.other;

  return (
    <Tile>
      <TileLabel>Other leave</TileLabel>
      <TileSub>
        {data.length > 0 ? `Last ${data.length} months` : "Requests"}
      </TileSub>

      {data.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No other leave requests on record.
        </p>
      ) : (
        <MiniBars
          ariaLabel="Other leave requests by month"
          items={data.map((d) => ({ label: d.month, value: d.value }))}
        />
      )}

      <Link
        href="/time-payroll/leave"
        className="mt-auto inline-flex w-fit items-center gap-0.5 pt-3 text-xs font-medium text-primary hover:underline"
      >
        View leave
        <ChevronRight className="size-3.5" />
      </Link>
    </Tile>
  );
}
