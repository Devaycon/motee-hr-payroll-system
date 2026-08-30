"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Tile, TileLabel, TileSub } from "./tiles";
import { getTurnoverRate } from "../hooks";

/**
 * Turnover against the scale HR reads it on, rather than a bare percentage: the
 * ring shows where the quarter sits between 0% and a 10% ceiling, so "4.3%" is
 * legible without already knowing what good looks like.
 *
 * Deliberately not the shared `RadialGauge` — that wrapper prints the *share of
 * the scale* as its centre value, so a 4.3% rate on a 0–10% scale would read
 * "43%". One number with a meter is a stat tile, not a chart.
 */
const SCALE_CEILING = 10;

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TurnoverGaugeCard() {
  const { rate, delta, voluntary, involuntary } = getTurnoverRate();
  const leavers = voluntary + involuntary;

  const fraction = Math.min(Math.max(rate / SCALE_CEILING, 0), 1);

  return (
    // Details left, ring right. Stacking them left a band of empty card under
    // a centred ring; side by side, the text column fills the height and the
    // ring uses the width that was going spare.
    <Tile>
      <div className="flex flex-1 gap-4">
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

          <Link
            href="/operations/workforce"
            className="mt-auto inline-flex w-fit items-center gap-0.5 pt-3 text-xs font-medium text-primary hover:underline"
          >
            View workforce
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        {/* Sized to the row rather than fixed, so the ring grows to fill the
            card instead of floating in the middle of it. */}
        <svg
          viewBox="0 0 80 80"
          className="h-full max-h-36 w-auto shrink-0 self-center"
          role="img"
          aria-label={`Turnover rate ${rate}% on a 0 to ${SCALE_CEILING}% scale`}
        >
          {/* Rotated so the ring fills clockwise from 12 o'clock. */}
          <g transform="rotate(-90 40 40)">
            <circle
              cx="40"
              cy="40"
              r={RADIUS}
              fill="none"
              strokeWidth="9"
              className="stroke-muted"
            />
            <circle
              cx="40"
              cy="40"
              r={RADIUS}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              className="stroke-primary"
              strokeDasharray={`${fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            />
          </g>
          <text
            x="40"
            y="40"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground text-[14px] font-semibold"
          >
            {rate}%
          </text>
        </svg>
      </div>
    </Tile>
  );
}
