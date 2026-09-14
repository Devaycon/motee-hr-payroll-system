"use client";

import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Tile,
  TileLabel,
  TileSub,
  PieLegend,
  TileLink,
  type PieSlice,
} from "./tiles";
import { useEmploymentTypeBreakdown } from "../hooks";

/** Faint horizontal rules behind the bars, like the reference chart's axis lines. */
const GRID_ROWS = 3;

/**
 * A small column chart sized to sit in the same right-hand slot the dial
 * used to occupy — bars packed close together against light gridlines,
 * rather than stretched across the whole card.
 */
function EmploymentBars({ slices, total }: { slices: PieSlice[]; total: number }) {
  const max = Math.max(...slices.map((s) => s.value), 1);

  return (
    <div
      className="flex h-full max-h-44 min-w-0 flex-1 flex-col self-center"
      role="img"
      aria-label={`Employment type breakdown: ${slices
        .map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`)
        .join(", ")}`}
    >
      <div className="relative flex flex-1 items-end justify-center gap-4">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {Array.from({ length: GRID_ROWS + 1 }).map((_, i) => (
            <div key={i} className="h-px w-full bg-border/60" />
          ))}
        </div>
        {slices.map((s) => {
          const heightPct = Math.max(Math.round((s.value / max) * 100), 12);
          return (
            <div key={s.label} className="relative z-10 flex h-full w-11 shrink-0 flex-col items-center justify-end">
              <div
                className="flex w-full flex-col items-center rounded-t-md pt-0.5"
                style={{ height: `${heightPct}%`, background: s.color }}
              >
                <span className="text-[10px] font-bold leading-tight text-white">
                  {Math.round((s.value / total) * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-center gap-4">
        {slices.map((s) => (
          <span key={s.label} className="w-11 shrink-0 truncate text-center text-[10px] text-muted-foreground">
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Employment type as a dial plus its own labelled list. */
export function EmploymentTypeTile() {
  const { data, loading } = useEmploymentTypeBreakdown();

  if (loading || !data) {
    return <Skeleton className="h-full w-full rounded-xl" />;
  }

  const total = data.data.reduce((sum, d) => sum + d.value, 0) || 1;
  const slices: PieSlice[] = data.data.map((d) => ({
    label: d.label,
    value: d.value,
    color: d.fill,
  }));

  return (
    // Heading, key and link stack down the left; the chart sits on the right
    // where the width is spare, so it can be read at a glance without the
    // card growing.
    <Tile>
      <div className="flex flex-1 gap-10">
        {/* `flex-none`, not `flex-1`: the write-up should only take the width
            its own text needs — stretching it to fill the row is what left a
            gap between the labels and the bars on the right. */}
        <div className="flex min-w-0 flex-none flex-col">
          <TileLabel>Employment type</TileLabel>
          <TileSub>Current headcount</TileSub>

          <div className="mt-3 flex items-start">
            {/* No percentage here — the bars alongside already carry it; the
                list instead gives the headcount each one represents. */}
            <PieLegend slices={slices} />
          </div>

          <TileLink href="/operations/analytics/employees">
            View report
          </TileLink>
        </div>

        <EmploymentBars slices={slices} total={total} />
      </div>
    </Tile>
  );
}
