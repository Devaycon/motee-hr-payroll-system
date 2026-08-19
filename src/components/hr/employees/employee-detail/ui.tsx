"use client";

import * as React from "react";
import Link from "next/link";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import { store } from "@/src/lib/stores/store";

/** Format a date with the active tenant locale. */
export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const loc = store.getState().locale.data?.tenant.locale ?? "en-GB";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(loc, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Duration from a past ISO date to now, e.g. "48 years 9 months". */
export function formatDuration(iso?: string | null): string {
  if (!iso) return "—";
  const from = new Date(iso);
  if (Number.isNaN(from.getTime())) return "—";
  const now = new Date();
  let months = (now.getFullYear() - from.getFullYear()) * 12 + (now.getMonth() - from.getMonth());
  if (now.getDate() < from.getDate()) months -= 1;
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const y = `${years} year${years === 1 ? "" : "s"}`;
  const m = `${rem} month${rem === 1 ? "" : "s"}`;
  return years > 0 ? `${y} ${m}` : m;
}

export function titleCase(v?: string | null): string {
  if (!v) return "—";
  return v
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // split camelCase
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Days until a date (negative = past). */
export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86400000);
}

export function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export interface StatStripItem {
  label: string;
  value: React.ReactNode;
  accent?: string;
  /** Navigates on activation. Takes precedence over `onClick`. */
  href?: string;
  /** Activates in place — e.g. switching to a module in the same workspace. */
  onClick?: () => void;
  /** Overrides the accessible name, which otherwise reads "<value> <label>". */
  ariaLabel?: string;
}

/**
 * Stat tiles. Items with `href`/`onClick` render as real controls with hover
 * and keyboard focus states — the client asked for these to be CTAs rather
 * than dead numbers (client feedback round 2, §B1).
 */
export function StatStrip({ items }: { items: StatStripItem[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((s) => {
        const interactive = !!(s.href || s.onClick);
        // Hover marks the tile with a blue outline only — tinting the fill made
        // the card read as transparent against the page background.
        const className = cn(
          "flex-1 min-w-fit rounded-xl bg-card px-4 py-3 text-left shadow-xs ring-1 ring-foreground/10 transition-colors",
          interactive &&
            "cursor-pointer hover:ring-2 hover:ring-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        );
        const body = (
          <>
            <p
              className={cn(
                "text-xl font-bold leading-none text-foreground whitespace-nowrap tabular-nums",
                s.accent,
              )}
            >
              {s.value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap">
              {s.label}
            </p>
          </>
        );

        if (s.href) {
          return (
            <Link
              key={s.label}
              href={s.href}
              className={className}
              aria-label={s.ariaLabel ?? `${s.label}: ${String(s.value)}`}
            >
              {body}
            </Link>
          );
        }
        if (s.onClick) {
          return (
            <button
              key={s.label}
              type="button"
              onClick={s.onClick}
              className={className}
              aria-label={s.ariaLabel ?? `${s.label}: ${String(s.value)}`}
            >
              {body}
            </button>
          );
        }
        return (
          <div key={s.label} className={className}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

/**
 * An empty state reads better as a statement plus an explanation than as one
 * flat sentence — `label` names what's missing, `description` says why that's
 * fine or what would fill it.
 */
export function Empty({
  label = "Nothing to show yet.",
  description,
}: {
  label?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border py-12 text-center">
      <p
        className={cn(
          "text-sm",
          description ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function LoadingPanel() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  clear: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  confirmed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  reimbursed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  submitted: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  in_progress: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  at_risk: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  expired: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  withdrawn: "border-slate-400/30 bg-slate-400/10 text-slate-500",
};

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  return (
    <Pill className={STATUS_TONES[status] ?? "border-border bg-muted text-muted-foreground"}>
      {titleCase(status)}
    </Pill>
  );
}

/** Minimal table primitives for the dense, read-only module tables. */
export function DataTable({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            {columns.map((c) => (
              <th
                key={c}
                className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-border/50 last:border-0">{children}</tr>;
}

export function Cell({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn("px-3 py-2 align-top text-foreground", className)}>
      {children}
    </td>
  );
}

export function InfoGrid({
  rows,
}: {
  rows: { label: string; value?: React.ReactNode }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-start gap-2 py-1.5 border-b border-border/50"
        >
          <span className="text-xs text-muted-foreground w-36 shrink-0">
            {r.label}:
          </span>
          <span className="text-xs font-medium text-foreground flex-1">
            {r.value ?? <span className="italic text-muted-foreground/50">—</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
