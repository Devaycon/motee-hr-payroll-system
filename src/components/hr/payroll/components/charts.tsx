"use client";

import { useState } from "react";
import { cn } from "@/src/lib/utils";

/**
 * Small, dependency-free charts for the payroll screens. Thin bars with
 * rounded data ends on a shared baseline, a hover tooltip on every mark, a
 * legend for every multi-series chart, and text in ink colours (never the
 * series colour). Categorical colours are assigned in this fixed order and
 * were validated for colour-blind separation in light and dark mode.
 */
export const SERIES = [
  { bar: "bg-blue-600 dark:bg-blue-500", dot: "bg-blue-600 dark:bg-blue-500" },
  { bar: "bg-teal-600", dot: "bg-teal-600" },
  { bar: "bg-amber-600", dot: "bg-amber-600" },
  { bar: "bg-pink-600 dark:bg-pink-500", dot: "bg-pink-600 dark:bg-pink-500" },
  { bar: "bg-violet-600 dark:bg-violet-500", dot: "bg-violet-600 dark:bg-violet-500" },
] as const;

export const compactNaira = (n: number) => {
  const a = Math.abs(n);
  const s = n < 0 ? "−" : "";
  if (a >= 1_000_000_000) return `${s}₦${(a / 1_000_000_000).toFixed(2)}bn`;
  if (a >= 1_000_000) return `${s}₦${(a / 1_000_000).toFixed(a >= 100_000_000 ? 0 : 1)}m`;
  if (a >= 1000) return `${s}₦${Math.round(a / 1000)}k`;
  return `${s}₦${Math.round(a)}`;
};

export function Legend({ items }: { items: { label: string; index?: number; className?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      {items.map((it, i) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-[2px]", it.className ?? SERIES[(it.index ?? i) % SERIES.length].dot)} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function Tip({ lines }: { lines: string[] }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 min-w-max -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-md">
      {lines.map((l, i) => (
        <p key={i} className={i === 0 ? "font-semibold" : "tabular-nums text-muted-foreground"}>{l}</p>
      ))}
    </div>
  );
}

export interface StackPart {
  key: string;
  value: number;
}

/**
 * Vertical bars, optionally stacked. Each column gets a hover tooltip with
 * every part; `muted` columns (in progress / forecast) are drawn lighter.
 */
export function ColumnChart({
  columns,
  series,
  height = 140,
  format = compactNaira,
  marker,
}: {
  columns: { label: string; parts: StackPart[]; muted?: boolean; note?: string; marker?: number | null }[];
  series: { key: string; label: string }[];
  height?: number;
  format?: (n: number) => string;
  /** Label for a per-column reference tick (e.g. budget). */
  marker?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const totals = columns.map((c) => c.parts.reduce((s, p) => s + Math.max(0, p.value), 0));
  const max = Math.max(1, ...totals, ...columns.map((c) => c.marker ?? 0));
  const order = new Map(series.map((s, i) => [s.key, i]));
  return (
    <div className="space-y-2">
      {(series.length > 1 || marker) && <Legend items={[...series.map((s, i) => ({ label: s.label, index: i })), ...(marker ? [{ label: marker, className: "bg-foreground/70" }] : [])]} />}
      <div className="flex items-end gap-2 border-b border-border/70" style={{ height }} role="img" aria-label={`Chart: ${series.map((s) => s.label).join(", ")}`}>
        {columns.map((c, i) => (
          <div
            key={c.label + i}
            className="relative flex h-full flex-1 cursor-default flex-col justify-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === i && (
              <Tip
                lines={[
                  c.label + (c.note ? ` · ${c.note}` : ""),
                  ...c.parts.filter((p) => p.value).map((p) => `${series.find((s) => s.key === p.key)?.label ?? p.key}: ${format(p.value)}`),
                  ...(c.parts.length > 1 ? [`Total: ${format(totals[i])}`] : []),
                  ...(marker && c.marker != null ? [`${marker}: ${format(c.marker)}`] : []),
                ]}
              />
            )}
            {c.marker != null && (
              <div className="absolute inset-x-0 z-10 border-t-2 border-dashed border-foreground/70" style={{ bottom: `${(c.marker / max) * 100}%` }} />
            )}
            <div className={cn("mx-auto flex w-full max-w-10 flex-col-reverse gap-[2px]", c.muted && "opacity-45", hover === i && "brightness-110")} style={{ height: `${(totals[i] / max) * 100}%` }}>
              {c.parts
                .filter((p) => p.value > 0)
                .map((p, j, arr) => (
                  <div
                    key={p.key}
                    className={cn(SERIES[(order.get(p.key) ?? 0) % SERIES.length].bar, j === arr.length - 1 && "rounded-t-[4px]")}
                    style={{ height: `${(p.value / Math.max(1, totals[i])) * 100}%`, minHeight: 2 }}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {columns.map((c, i) => (
          <span key={c.label + i} className="flex-1 truncate text-center text-[10px] text-muted-foreground">{c.label}</span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bars for ranked categories (cost by department, branch…). */
export function BarList({ rows, format = compactNaira, emptyText = "Nothing to show." }: { rows: { label: string; value: number; sub?: string }[]; format?: (n: number) => string; emptyText?: string }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  if (!rows.length) return <p className="py-6 text-center text-xs text-muted-foreground">{emptyText}</p>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="group" title={`${r.label}: ${format(r.value)}${r.sub ? ` · ${r.sub}` : ""}`}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {format(r.value)}
              {r.sub && <span className="ml-1.5 text-[10px]">{r.sub}</span>}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-muted">
            <div className={cn("h-2 rounded-full transition group-hover:brightness-110", r.value < 0 ? "bg-pink-600 dark:bg-pink-500" : SERIES[0].bar)} style={{ width: `${(Math.abs(r.value) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A labelled figure, for the top of a chart card. */
export function Figure({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" | "warn" }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-semibold tabular-nums", tone === "bad" && "text-rose-600", tone === "good" && "text-emerald-700 dark:text-emerald-400", tone === "warn" && "text-amber-700 dark:text-amber-400")}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function ChartCard({ title, description, children, right, className }: { title: string; description?: string; children: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}
