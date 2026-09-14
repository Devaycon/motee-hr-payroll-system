"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * The dashboard mockup's building blocks, kept in one place so every tab reads
 * as one surface.
 *
 * These are deliberately plain markup rather than the app's `ChartCard` /
 * Nivo wrappers: the mockup's tiles are small, label-led and self-contained,
 * with no chart chrome, toolbar or tooltip layer — drawn directly in CSS/SVG
 * rather than a charting library, since at this size there is nothing to
 * hover and a library's own chrome would cost more room than it explains.
 * Anything that genuinely needs a full chart (the 30-day attendance trend,
 * the action list) uses the shared chart components instead.
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
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <p
      className={cn(
        "mt-1.5 inline-flex items-center gap-0.5 text-xs font-medium",
        up ? "text-[#50D34C]" : "text-red-600",
      )}
    >
      <Icon className="h-3 w-3" />
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

/**
 * Three-or-so bars with the value printed above each and the most recent one
 * picked out. Direct-labelled rather than given an axis: at this size a scale
 * would cost more room than it explains.
 */
export function MiniBars({
  items,
  ariaLabel,
  height = 64,
  highlight = "latest",
}: {
  items: MiniBarItem[];
  ariaLabel?: string;
  height?: number;
  /**
   * Which bars get the primary colour: `"latest"` (default) picks out the
   * most recent item, for a weekly trend where "how does this period compare"
   * is the point. `"nonzero"` colours every bar with a value instead — for a
   * categorical breakdown (e.g. events by day) there is no "latest", and
   * highlighting by position instead of by data left an empty bar coloured
   * while the bars that actually had something in them stayed grey.
   */
  highlight?: "latest" | "nonzero";
}) {
  if (items.length === 0) return null;

  const max = Math.max(...items.map((i) => i.value), 1);
  const lastIndex = items.length - 1;

  return (
    <div className="mt-3" role="img" aria-label={ariaLabel}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {items.map((item, i) => {
          const pct = Math.max(Math.round((item.value / max) * 100), item.value > 0 ? 6 : 2);
          const isHighlighted =
            highlight === "latest" ? i === lastIndex : item.value > 0;
          return (
            <div
              key={`${item.label}-${i}`}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              <span
                className={cn(
                  "text-[10px] font-semibold tabular-nums",
                  isHighlighted ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.value}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-sm",
                  isHighlighted ? "bg-primary" : "bg-muted-foreground/25",
                )}
                style={{ height: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-1.5">
        {items.map((item, i) => (
          <span
            key={`${item.label}-label-${i}`}
            className="flex-1 truncate text-center text-[10px] text-muted-foreground"
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
  if (items.length === 0) return null;

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div
      className={cn(
        "mt-3 flex flex-col gap-2",
        fill ? "flex-1 justify-center" : "justify-start",
      )}
    >
      {items.map((item, i) => {
        const pct = Math.max(Math.round((item.value / max) * 100), 4);
        return (
          <div key={`${item.label}-${i}`} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">
              {item.label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
              {item.value}
            </span>
          </div>
        );
      })}
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
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let cursor = 0;
  const stops = slices.map((s) => {
    const start = (cursor / (total || 1)) * 360;
    cursor += s.value;
    const end = (cursor / (total || 1)) * 360;
    return `${s.color} ${start}deg ${end}deg`;
  });

  return (
    <div
      className={cn("relative shrink-0 rounded-full", className)}
      style={{
        width: size,
        height: size,
        background:
          total > 0 ? `conic-gradient(${stops.join(", ")})` : "var(--muted)",
      }}
      role="img"
      aria-label={slices.map((s) => `${s.label}: ${s.value}`).join(", ")}
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
