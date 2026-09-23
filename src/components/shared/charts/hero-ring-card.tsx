"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { RingStat } from "@/src/components/hr/analytics/components/ring-stat";

/**
 * Shape-agnostic version of `RadialSeriesItem` (src/lib/reports/types.ts) —
 * any multi-segment status/share breakdown can feed this card, not just the
 * report registry's radial chart spec.
 */
export interface RingSegmentData {
  key: string;
  label: string;
  value: number;
  color: string;
  /**
   * Shown centered on the dial instead of the value (e.g. a per-segment
   * illustration) — when set, the value moves down to sit next to the label
   * underneath the dial instead of inside it.
   */
  icon?: ReactNode;
  /**
   * Denominator for this segment's own dial. Leave unset for share-of-total
   * data (every segment is judged against the sum of the others, e.g.
   * gender headcount); set explicitly for an independent scale (e.g. a
   * score out of 100 per department) — when set on any segment, capping
   * takes the top three by value instead of folding the rest into "Other",
   * since independently-scaled values can't be summed into one bucket.
   */
  total?: number;
}

/** At most this many dials render — more than that reads as noise, not a dashboard. */
const MAX_DIALS = 3;

function hasIndependentTotals(segments: RingSegmentData[]): boolean {
  return segments.some((s) => s.total !== undefined);
}

/**
 * Caps the segments shown to `MAX_DIALS`. Share-of-total data folds the
 * overflow into a single "Other" bucket (same convention already used by
 * the sickness-by-reason tile) so the total stays honest; independently-
 * scaled data (a per-segment `total`) just keeps the top three, since there
 * is no meaningful way to merge two different scales into one dial.
 */
function capSegments(segments: RingSegmentData[]): RingSegmentData[] {
  if (segments.length <= MAX_DIALS) return segments;
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  if (hasIndependentTotals(segments)) {
    return sorted.slice(0, MAX_DIALS);
  }
  const top = sorted.slice(0, MAX_DIALS - 1);
  const restValue = sorted.slice(MAX_DIALS - 1).reduce((s, x) => s + x.value, 0);
  return [...top, { key: "__other", label: "Other", value: restValue, color: "#64748b" }];
}

/** A segment's own share: its explicit `total` when set, otherwise the shared sum. */
function pctOf(segment: RingSegmentData, sharedTotal: number): number {
  const denom = segment.total ?? sharedTotal;
  return denom > 0 ? Math.round((segment.value / denom) * 100) : 0;
}

/**
 * Plain-language read of a ring breakdown, as two short paragraphs: the
 * makeup (every segment named), then how the groups compare — how far ahead
 * the leader is, and which group is easy to lose in a list of percentages.
 * Kept factual (no "good"/"bad" judgement calls): there's no generic way to
 * know whether a given segment is the desirable one without knowing the
 * card's own semantics.
 *
 * The card's subtitle is not repeated here — it is already on the card.
 * Exported for tests.
 */
export function summarizeSegments(
  segments: RingSegmentData[],
  totalNoun: string,
): string[] {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const pct = (s: RingSegmentData) => pctOf(s, total);
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  const lines: string[] = [];

  const parts = sorted.map(
    (s) => `${s.label} at ${s.value.toLocaleString()} (${pct(s)}%)`,
  );
  lines.push(
    parts.length > 1
      ? `Out of ${total.toLocaleString()} ${totalNoun}, the breakdown is ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}.`
      : `${parts[0]} of ${total.toLocaleString()} ${totalNoun}.`,
  );

  const top = sorted[0];
  const second = sorted[1];
  const smallest = sorted[sorted.length - 1];

  if (second) {
    const gap = pct(top) - pct(second);
    const ratio = second.value > 0 ? Math.round((top.value / second.value) * 10) / 10 : null;
    lines.push(
      gap >= 20 && ratio
        ? `${top.label} is clearly ahead at ${pct(top)}%, roughly ${ratio}× the size of ${second.label} (${pct(second)}%).`
        : `${top.label} and ${second.label} are fairly close, at ${pct(top)}% and ${pct(second)}% respectively — no single group dominates.`,
    );
  }

  if (sorted.length > 2 && smallest !== second && smallest.value < top.value) {
    lines.push(
      `${smallest.label} is the smallest of the ${sorted.length} groups, at ${pct(smallest)}% (${smallest.value.toLocaleString()} ${totalNoun}).`,
    );
  }

  // Makeup first, then everything that compares the groups, as one paragraph.
  const [makeup, ...comparison] = lines;
  return comparison.length > 0 ? [makeup, comparison.join(" ")] : [makeup];
}

/** Numbered ranking with an inline proportion bar per segment — a different lens on the same data than the dials or the prose summary. */
function RankedBreakdown({ segments }: { segments: RingSegmentData[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  return (
    <div className="flex flex-col gap-3">
      {sorted.map((s, i) => {
        const pct = pctOf(s, total);
        return (
          <div key={s.key} className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-xs font-medium text-foreground">{s.label}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {s.value.toLocaleString()} · {pct}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: s.color }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * A half-circle "speedometer" reading — the alternate dial style, so a page
 * with several hero cards doesn't render the same full ring over and over.
 * Same stroke-arc technique as `RingStat`, halved to a 180° sweep.
 */
function SpeedoGauge({
  value,
  total,
  color,
  centerValue,
  centerLabel,
  size = 148,
}: {
  value: number;
  total: number;
  color: string;
  centerValue: string;
  centerLabel?: string;
  size?: number;
}) {
  const r = size * 0.4;
  const stroke = size * 0.086;
  const cx = size / 2;
  const cy = size / 2;
  const half = Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  const path = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <svg
      width={size}
      height={size / 2 + size * 0.12}
      viewBox={`0 0 ${size} ${size / 2 + size * 0.12}`}
      role="img"
      aria-label={`${centerValue}${centerLabel ? ` ${centerLabel}` : ""}`}
    >
      <path d={path} fill="none" className="stroke-muted" strokeWidth={stroke} strokeLinecap="round" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${frac * half} ${half}`}
      />
      <text
        x="50%"
        y={cy - size * 0.02}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground font-bold tabular-nums"
        style={{ fontSize: size * 0.19 }}
      >
        {centerValue}
      </text>
      {centerLabel && (
        <text
          x="50%"
          y={cy + size * 0.19}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-muted-foreground"
          style={{ fontSize: size * 0.095 }}
        >
          {centerLabel}
        </text>
      )}
    </svg>
  );
}

/**
 * One dial, in either style. When the segment carries an `icon`, the dial's
 * own number is dropped in favour of the icon sitting centered on top of it,
 * and the value moves down to sit beside the label underneath instead.
 */
function SegmentDial({
  segment,
  variant,
  fallbackTotal,
  size,
}: {
  segment: RingSegmentData;
  variant: "ring" | "gauge";
  fallbackTotal: number;
  size: number;
}) {
  const denom = segment.total ?? fallbackTotal;
  const hasIcon = Boolean(segment.icon);
  const gaugeHeight = size / 2 + size * 0.12;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: variant === "gauge" ? gaugeHeight : size }}
      >
        {variant === "gauge" ? (
          <SpeedoGauge
            value={segment.value}
            total={denom}
            color={segment.color}
            centerValue={hasIcon ? "" : String(segment.value)}
            size={size}
          />
        ) : (
          <RingStat
            segments={[{ value: segment.value, color: segment.color }]}
            total={denom}
            centerValue={hasIcon ? "" : String(segment.value)}
            size={size}
          />
        )}
        {hasIcon && (
          <span
            className="absolute flex items-center justify-center"
            style={
              variant === "gauge"
                ? { left: "50%", top: size / 2, transform: "translate(-50%, -50%)", width: size * 0.34, height: size * 0.34 }
                : { width: size * 0.4, height: size * 0.4 }
            }
          >
            {segment.icon}
          </span>
        )}
      </div>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {hasIcon ? `${segment.label} = ${segment.value.toLocaleString()}` : segment.label}
      </span>
    </div>
  );
}

/**
 * The three-section hero card: dials on the left, an AI-style prose summary
 * in the middle (titled "Analytics Summary"), and a ranked breakdown on the
 * right. Originally built for the analytics report pages' radial spec; this
 * is the shape-agnostic version so any status/share breakdown elsewhere in
 * the app (dashboard tabs included) can use the same pattern.
 */
export function HeroRingCard({
  title,
  description,
  segments,
  totalNoun = "total",
  summaryLines,
  summaryTitle = "Analytics Summary",
  summaryIcon: SummaryIcon = Sparkles,
  variant = "ring",
  className,
  viewMoreHref,
}: {
  title: string;
  description?: string;
  segments: RingSegmentData[];
  /** Noun used in the auto-generated summary, e.g. "employees", "alerts". */
  totalNoun?: string;
  /** Override the auto-generated summary prose entirely — one paragraph per entry. */
  summaryLines?: string[];
  /** Heading of the middle section. Defaults to "Analytics Summary". */
  summaryTitle?: string;
  /** Icon beside the summary heading. Defaults to the sparkles. */
  summaryIcon?: LucideIcon;
  /** Full rings (default) or half-circle "speedometer" dials — vary this across a page of several hero cards. */
  variant?: "ring" | "gauge";
  className?: string;
  /** When set, renders a "View more →" link to this route (same convention as `ChartCard`). */
  viewMoreHref?: string;
}) {
  const display = capSegments(segments);
  const single = display.length === 1;
  const summary = summaryLines ?? summarizeSegments(display, totalNoun);
  const total = display.reduce((s, x) => s + x.value, 0);

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {viewMoreHref && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 gap-1 px-2 text-xs text-primary hover:text-primary"
          >
            <Link href={viewMoreHref}>
              View more
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
        <div className="flex flex-wrap items-center gap-6 sm:flex-none">
          {single ? (
            display[0].icon ? (
              <SegmentDial
                segment={display[0]}
                variant={variant}
                fallbackTotal={display[0].total ?? total}
                size={variant === "gauge" ? 160 : 140}
              />
            ) : variant === "gauge" ? (
              <SpeedoGauge
                value={display[0].value}
                total={display[0].total ?? total}
                color={display[0].color}
                centerValue={String(display[0].value)}
                centerLabel={display[0].label}
                size={160}
              />
            ) : (
              <RingStat
                segments={[{ value: display[0].value, color: display[0].color }]}
                total={display[0].total}
                centerValue={String(display[0].value)}
                centerLabel={display[0].label}
                size={140}
              />
            )
          ) : (
            display.map((s) => (
              <SegmentDial key={s.key} segment={s} variant={variant} fallbackTotal={total} size={variant === "gauge" ? 148 : 128} />
            ))
          )}
        </div>

        <div className="hidden w-px shrink-0 bg-border sm:block" />

        <div className="flex flex-1 flex-col justify-center gap-2 py-1">
          <h4 className="flex items-center gap-1.5 text-base font-bold text-foreground">
            <SummaryIcon className="h-5 w-5 text-blue-500" />
            {summaryTitle}
          </h4>
          {/* A blue-tinted panel, one paragraph per summary line. */}
          <div className="flex flex-col gap-3 rounded-xl border border-blue-500/25 bg-blue-500/10 p-4 text-sm leading-relaxed text-foreground/80">
            {summary.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        {!single && (
          <>
            <div className="hidden w-px shrink-0 bg-border sm:block" />
            <div className="flex w-full flex-col justify-center gap-2.5 py-1 sm:w-60 sm:shrink-0">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ranked breakdown
              </h4>
              <RankedBreakdown segments={display} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
