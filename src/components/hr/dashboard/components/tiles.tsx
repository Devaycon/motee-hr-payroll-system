"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * The dashboard mockup's building blocks, kept in one place so every tab reads
 * as one surface.
 *
 * These are deliberately plain markup rather than the app's `ChartCard` /
 * ApexCharts wrappers: the mockup's tiles are small, label-led and
 * self-contained, with no chart chrome, toolbar or tooltip layer. Anything that
 * genuinely needs a full chart (the 30-day attendance trend, the action list)
 * still uses the shared chart components underneath these.
 */

export function Tile({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    // Fills its grid cell, so a row never leaves a hole under a short tile.
    // Rows are composed of tiles with similar natural height, and any trailing
    // link is pushed to the bottom, so filling the cell doesn't leave a dead
    // band inside the card either.
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-border bg-card p-3.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Tile heading — the thing being measured. */
export function TileLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm font-medium text-foreground", className)}>
      {children}
    </p>
  );
}

/** The qualifier under the heading — the period, the scope, the basis. */
export function TileSub({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>
  );
}

/** The headline figure. */
export function TileNum({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-1.5 text-3xl font-semibold leading-none text-foreground tabular-nums",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** The coloured delta line under a headline figure. */
export function TileDelta({
  up,
  children,
}: {
  up: boolean;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "mt-1.5 text-xs font-medium",
        up ? "text-[#4ED251]" : "text-red-600",
      )}
    >
      {children}
    </p>
  );
}

/**
 * The drill-down at the foot of a tile.
 *
 * `w-fit` matters: in a `flex-col` card an `inline-flex` child still stretches
 * to the full width, which would make a band across the card clickable rather
 * than the link itself. `mt-auto` pins it to the bottom so tiles in a row line
 * their links up.
 */
export function TileLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mt-auto inline-flex w-fit items-center gap-0.5 pt-3 text-xs font-medium text-primary hover:underline"
    >
      {children}
      <ChevronRight className="size-3.5" />
    </Link>
  );
}

export interface MiniBarItem {
  label: string;
  value: number;
}

const BAR_MIN_H = 10;
const BAR_MAX_H = 34;

/**
 * Three-or-so bars with the value printed above each and the most recent one
 * picked out. Direct-labelled rather than given an axis: at this size a scale
 * would cost more room than it explains.
 */
export function MiniBars({
  items,
  ariaLabel,
}: {
  items: MiniBarItem[];
  ariaLabel?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="mt-3" role="img" aria-label={ariaLabel}>
      <div className="flex h-13 items-end gap-1.5">
        {items.map((item, i) => {
          const isLatest = i === items.length - 1;
          return (
            <div key={item.label} className="flex-1 text-center">
              <p className="mb-1 text-[11px] font-medium text-foreground tabular-nums">
                {item.value}
              </p>
              <div
                className={cn(
                  "rounded-t-sm",
                  isLatest ? "bg-primary" : "bg-muted-foreground/25",
                )}
                style={{
                  height: BAR_MIN_H + (item.value / max) * (BAR_MAX_H - BAR_MIN_H),
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {items.map((item) => (
          <span
            key={item.label}
            className="flex-1 text-center text-[11px] text-muted-foreground"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface HBarItem {
  label: string;
  value: number;
}

/**
 * Ranked horizontal bars — the "By category" reading. One measure, so a single
 * hue; the value sits at the end of every row so the bar length never has to be
 * estimated.
 */
export function HBars({
  items,
  fill,
}: {
  items: HBarItem[];
  /**
   * Spread the rows through whatever height the card has spare instead of
   * stacking them at a fixed rhythm. A short list beside a long one would
   * otherwise leave a hole at the bottom of the card.
   */
  fill?: boolean;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div
      className={cn(
        "mt-3 flex flex-col",
        fill ? "flex-1 justify-around" : "gap-2",
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 text-xs">
          {/* Wraps rather than truncates: these are clinical categories and
              case statuses — "Medical Appointment", "Fit with adjustments" —
              and an ellipsis hides exactly the word that identifies them. */}
          <span className="w-28 shrink-0 leading-tight text-muted-foreground">
            {item.label}
          </span>
          <div className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-muted-foreground tabular-nums">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

/**
 * A small part-to-whole dial beside its own labelled list. Drawn with a conic
 * gradient rather than a charting library — at 56px there is nothing to hover,
 * and the list beside it carries the identity, so colour is never doing the
 * labelling on its own.
 */
export function MiniPie({
  slices,
  size = 56,
  donut = false,
  className,
}: {
  slices: PieSlice[];
  size?: number;
  donut?: boolean;
  className?: string;
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;

  // Running offsets built up front rather than accumulated inside the map, so
  // nothing is reassigned during render.
  const offsets = slices.reduce<number[]>(
    (acc, s) => [...acc, acc[acc.length - 1]! + s.value],
    [0],
  );
  const stops = slices.map((s, i) => {
    const start = (offsets[i]! / total) * 100;
    const end = (offsets[i + 1]! / total) * 100;
    return `${s.color} ${start}% ${end}%`;
  });

  return (
    <div
      className={cn("relative shrink-0 rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${stops.join(", ")})`,
      }}
      role="img"
      aria-label={slices
        .map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`)
        .join(", ")}
    >
      {donut && (
        <div
          className="absolute rounded-full bg-card"
          style={{
            inset: size * 0.22,
          }}
        />
      )}
    </div>
  );
}

/** The legend beside a `MiniPie` — a colour chip, a name and a value. */
export function PieLegend({
  slices,
  format,
}: {
  slices: PieSlice[];
  format?: (slice: PieSlice) => string;
}) {
  return (
    <ul className="flex w-full min-w-0 flex-col gap-1.5 text-xs text-muted-foreground">
      {slices.map((s) => (
        <li key={s.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ background: s.color }}
          />
          <span className="truncate text-foreground">{s.label}</span>
          <span className="ml-auto shrink-0 tabular-nums">
            {format ? format(s) : s.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
