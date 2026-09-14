"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Tile, TileLabel, TileSub } from "./tiles";
import { getTurnoverRate } from "../hooks";

/**
 * Turnover against the scale HR reads it on, rather than a bare percentage: the
 * bar shows where the quarter sits between 0% and a 10% ceiling, so "4.3%" is
 * legible without already knowing what good looks like.
 *
 * Deliberately not the shared `RadialGauge` — that wrapper prints the *share of
 * the scale* as its centre value, so a 4.3% rate on a 0–10% scale would read
 * "43%". One number with a meter is a stat tile, not a chart.
 */
const SCALE_CEILING = 10;

export function TurnoverGaugeCard() {
  const { rate, delta, voluntary, involuntary } = getTurnoverRate();
  const leavers = voluntary + involuntary;

  const fraction = Math.min(Math.max(rate / SCALE_CEILING, 0), 1);

  return (
    <Tile>
      <div className="flex min-w-0 flex-1 flex-col">
        <TileLabel>Turnover rate</TileLabel>
        <TileSub>Current quarter</TileSub>

        {/* Plain counts first, then the rate they produce. "Leavers as a
            share of headcount on a 0–10% scale" made the reader do the
            arithmetic before they could tell whether 4.3% was a problem. */}
        <p className="mt-2 text-xs text-foreground">
          {leavers} {leavers === 1 ? "person" : "people"} left this quarter
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {voluntary} resigned, {involuntary} let go
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {delta === 0
            ? "Same as last quarter"
            : `${delta > 0 ? "Up" : "Down"} ${Math.abs(delta)}% on last quarter`}
        </p>

        {/* The same 0–10% scale as before, just as a bar instead of a ring —
            a fixed-height row, so it never pushes the card's own height
            around the way a chart sized to fill spare space would. */}
        <div
          className="mt-3"
          role="img"
          aria-label={`Turnover rate ${rate}% on a 0 to ${SCALE_CEILING}% scale`}
        >
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-foreground">{rate}%</span>
            <span className="text-[10px] text-muted-foreground">of {SCALE_CEILING}% scale</span>
          </div>
          <div className="relative mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${fraction * 100}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>0%</span>
            <span>{SCALE_CEILING}%</span>
          </div>
        </div>

        <Link
          href="/operations/workforce"
          className="mt-auto inline-flex w-fit items-center gap-0.5 pt-3 text-xs font-medium text-primary hover:underline"
        >
          View workforce
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </Tile>
  );
}
