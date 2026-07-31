import type { LocaleBundle, LocaleLeaveRequest } from "@/src/lib/types/locale";

/**
 * Employee status (`on_leave`) and leave requests (which carry the `type`) live
 * in two unjoined collections, so every "on leave" surface could only say *that*
 * someone was away, never *why*. This joins them — client feedback round 2, §C1.
 */
export interface ActiveLeave {
  type: string;
  label: string;
  startDate: string;
  endDate: string;
  /** Date the employee is next expected in, i.e. the day after `endDate`. */
  returnDate: string;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  unpaid: "Unpaid Leave",
  compassionate: "Compassionate Leave",
  study: "Study Leave",
  parental: "Parental Leave",
  bereavement: "Bereavement Leave",
};

export function leaveTypeLabel(type?: string | null): string {
  if (!type) return "Leave";
  return (
    LEAVE_TYPE_LABELS[type] ??
    type.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/** Tailwind classes per leave type, matching the employee-side badge palette. */
export const LEAVE_TYPE_TONES: Record<string, string> = {
  annual: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  sick: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  maternity: "border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400",
  paternity: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  unpaid: "border-slate-400/30 bg-slate-400/10 text-slate-500",
  compassionate: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  study: "border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

export function leaveTypeTone(type?: string | null): string {
  return (
    (type && LEAVE_TYPE_TONES[type]) ??
    "border-border bg-muted text-muted-foreground"
  );
}

const ACTIVE_STATUSES = new Set(["approved", "in_progress"]);

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Builds a lookup of employeeId → the leave they are on as of `asOf`.
 * Returns a Map so callers can resolve many employees in one pass.
 */
export function buildActiveLeaveMap(
  requests: readonly LocaleLeaveRequest[] | undefined,
  asOf: string,
): Map<string, ActiveLeave> {
  const map = new Map<string, ActiveLeave>();
  for (const r of requests ?? []) {
    if (!ACTIVE_STATUSES.has(r.status)) continue;
    if (!r.startDate || !r.endDate) continue;
    if (r.startDate > asOf || r.endDate < asOf) continue;
    map.set(r.employeeId, {
      type: r.type,
      label: leaveTypeLabel(r.type),
      startDate: r.startDate,
      endDate: r.endDate,
      returnDate: addDays(r.endDate, 1),
    });
  }
  return map;
}

/** Convenience wrapper for callers that already hold the whole bundle. */
export function activeLeaveFromBundle(
  bundle: Pick<LocaleBundle, "leaveRequests" | "_meta">,
  asOf?: string,
): Map<string, ActiveLeave> {
  const date =
    asOf ?? bundle._meta?.referenceDate ?? new Date().toISOString().slice(0, 10);
  return buildActiveLeaveMap(bundle.leaveRequests, date);
}
