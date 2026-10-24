"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { SICKNESS_REASON_REDACTED } from "@/src/lib/constants/sickness";
import {
  BRADFORD_ACTION_LABELS,
  BRADFORD_ACTION_STYLES,
  FIT_NOTE_STATUS_LABELS,
  FIT_NOTE_STATUS_STYLES,
  type BradfordAction,
  type FitNoteStatus,
  type RtwStatus,
  type SicknessRecord,
} from "@/src/lib/types/sickness";

/**
 * Client-side paging for the module's tables. The page resets when `resetKey`
 * changes (a filter), and is clamped so a shrinking list never strands you.
 */
export function usePaged<T>(items: T[], pageSize: number, resetKey: string) {
  const [page, setPage] = useState(1);
  const [key, setKey] = useState(resetKey);
  if (key !== resetKey) {
    setKey(resetKey);
    setPage(1);
  }
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, totalPages);
  const slice = items.slice((current - 1) * pageSize, current * pageSize);
  return { page: current, setPage, totalPages, slice, total: items.length, pageSize };
}

/** "Showing 11–20 of 73" plus page controls, in a solid footer. */
export function Pager({ pager, noun = "records" }: { pager: ReturnType<typeof usePaged<unknown>>; noun?: string }) {
  const { page, totalPages, total, pageSize, setPage } = pager;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border bg-card px-3 py-2">
      <span className="text-[11px] text-muted-foreground">
        {total === 0 ? `No ${noun}` : `Showing ${from}–${to} of ${total} ${noun}`}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-7" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="px-1.5 text-[11px] tabular-nums text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="icon" className="size-7" disabled={page === totalPages} onClick={() => setPage(page + 1)} aria-label="Next page">
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function fmtDate(d?: string | null, pattern = "d MMM yyyy"): string {
  if (!d) return "—";
  try {
    return format(parseISO(d), pattern);
  } catch {
    return d;
  }
}

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium", className)}>
      {children}
    </span>
  );
}

const APPROVAL: Record<SicknessRecord["approvalStatus"], [string, string]> = {
  draft: ["Draft", "border-border bg-muted text-muted-foreground"],
  awaiting_approval: ["Awaiting approval", "border-amber-500/30 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400"],
  approved: ["Approved", "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"],
  rejected: ["Rejected", "border-rose-500/30 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400"],
  cancelled: ["Cancelled", "border-border bg-muted text-muted-foreground"],
};

export function ApprovalBadge({ status }: { status: SicknessRecord["approvalStatus"] }) {
  const [label, cls] = APPROVAL[status];
  return <Pill className={cls}>{label}</Pill>;
}

export function AbsenceStateBadge({ record }: { record: SicknessRecord }) {
  return record.absenceState === "ongoing" ? (
    <Pill className="border-rose-500/30 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">Off sick</Pill>
  ) : (
    <Pill className="border-border bg-muted text-muted-foreground">Returned</Pill>
  );
}

export function FitNoteBadge({ status }: { status: FitNoteStatus }) {
  return <Pill className={FIT_NOTE_STATUS_STYLES[status]}>{FIT_NOTE_STATUS_LABELS[status]}</Pill>;
}

const RTW: Record<RtwStatus, [string, string]> = {
  not_due: ["Not due", "border-border bg-muted text-muted-foreground"],
  pending: ["RTW due", "border-amber-500/30 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400"],
  completed: ["RTW done", "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"],
};

export function RtwBadge({ status }: { status: RtwStatus }) {
  const [label, cls] = RTW[status];
  return <Pill className={cls}>{label}</Pill>;
}

export function BradfordBadge({ action, score }: { action: BradfordAction; score?: number }) {
  return (
    <Pill className={BRADFORD_ACTION_STYLES[action]}>
      {score != null ? `${score} · ` : ""}
      {BRADFORD_ACTION_LABELS[action]}
    </Pill>
  );
}

/** Category for authorised viewers, a neutral label for everyone else. */
export function reasonFor(r: SicknessRecord, canViewMedical: boolean): string {
  return canViewMedical ? r.reasonCategory : SICKNESS_REASON_REDACTED;
}

export function StatTile({
  label,
  value,
  sub,
  tone,
  onClick,
  active,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "amber" | "rose" | "emerald";
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex h-full flex-col rounded-xl border bg-card p-3 text-left transition-colors",
        onClick && "hover:bg-muted",
        active ? "border-primary ring-1 ring-primary" : "border-border",
      )}
    >
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-2xl font-bold tabular-nums",
          tone === "amber" && "text-amber-600",
          tone === "rose" && "text-rose-600",
          tone === "emerald" && "text-emerald-600",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </button>
  );
}

/**
 * A chart card that grows with its row: the chart takes whatever height the
 * card is given (never less than `minHeight`), so a taller neighbour doesn't
 * leave blank space under the chart.
 */
export function ChartPanel({
  title,
  description,
  minHeight = 240,
  className,
  children,
}: {
  title: string;
  description?: string;
  minHeight?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex h-full flex-col rounded-xl border border-border bg-card p-4", className)}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="relative mt-3 flex-1" style={{ minHeight }}>
        <div className="absolute inset-0">{children}</div>
      </div>
    </div>
  );
}
