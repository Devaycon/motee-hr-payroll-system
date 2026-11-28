import type { RemittanceRecord } from "@/src/lib/stores/payroll-slice";
import { remittanceAmounts, remittanceCalendar, type RemittanceItem } from "./exports";
import { round2 } from "./ng/engine";
import { lockedRunsByMonth } from "./remittances";
import type { PayrollRun } from "./types";

/**
 * Statutory remittance management centre. Each remittance (one authority,
 * one pay month) moves through:
 *
 *   calculated → submitted → paid → reconciled
 *
 * and is `overdue` whenever its deadline passes without confirmed settlement.
 * A liability statement is never proof of payment: only a recorded payment
 * (reference + date, ideally the bank receipt) makes a remittance `paid`, and
 * only a full match of the amount paid against the liability, with evidence
 * on file, makes it `reconciled`.
 */

export type RemittanceStatus = "calculated" | "submitted" | "paid" | "reconciled" | "overdue" | "nothing_due";

export const REMITTANCE_STATUS_META: Record<RemittanceStatus, { label: string; hint: string; tone: "muted" | "blue" | "amber" | "emerald" | "rose" | "violet" }> = {
  calculated: { label: "Calculated", hint: "Liability established — not yet paid.", tone: "muted" },
  submitted: { label: "Submitted", hint: "Payment instruction sent — awaiting confirmation.", tone: "blue" },
  paid: { label: "Paid", hint: "Payment confirmed by a reference and date.", tone: "violet" },
  reconciled: { label: "Reconciled", hint: "Amount paid matched against the liability, evidence on file.", tone: "emerald" },
  overdue: { label: "Overdue", hint: "Deadline passed without confirmed settlement.", tone: "rose" },
  nothing_due: { label: "Nothing due", hint: "No liability this month.", tone: "muted" },
};

export interface RemittanceRow {
  /** "YYYY-MM:item" — the key remittance records are stored under. */
  key: string;
  month: string;
  monthLabel: string;
  item: RemittanceItem;
  title: string;
  to: string;
  basis: string;
  due: string;
  liability: number;
  paid: number;
  outstanding: number;
  status: RemittanceStatus;
  /** True when the deadline has passed without settlement, whatever the stage. */
  overdue: boolean;
  record?: RemittanceRecord;
  runs: PayrollRun[];
  daysToDue: number;
  /** Estimated from a run that isn't finalized yet — shown on the calendar only. */
  projected?: boolean;
}

const dayMs = 86_400_000;
const days = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / dayMs);

/**
 * A payment counts only with evidence on file (client feedback B3): a
 * liability is never paid just because it was calculated or scheduled.
 * Records from before the lifecycle existed (no `status`) are grandfathered.
 */
export const hasEvidence = (rec: RemittanceRecord | undefined) => !!rec && (rec.status === undefined || !!rec.receipt);

/** What has actually been paid against a record (old records without an amount count as paid in full). */
function paidOf(rec: RemittanceRecord | undefined, liability: number): number {
  if (!rec || rec.status === "submitted" || !hasEvidence(rec)) return 0;
  return round2(rec.amountPaid ?? liability);
}

export function statusOf(rec: RemittanceRecord | undefined, liability: number, due: string, today: string): { status: RemittanceStatus; overdue: boolean } {
  if (liability <= 0) return { status: "nothing_due", overdue: false };
  const paid = paidOf(rec, liability);
  const settled = paid >= liability - 0.5;
  const late = due < today && !settled;
  if (rec?.status === "reconciled" && settled) return { status: "reconciled", overdue: false };
  if (rec && rec.status !== "submitted" && settled) return { status: "paid", overdue: false };
  if (late) return { status: "overdue", overdue: true };
  // A payment recorded without evidence stays "submitted" until the receipt is on file.
  if (rec?.status === "submitted" || (rec && !hasEvidence(rec))) return { status: "submitted", overdue: false };
  if (rec && paid > 0) return { status: "paid", overdue: false };
  return { status: "calculated", overdue: false };
}

/** Every remittance for every month with finalized pay, newest month first. */
export function remittanceRows(runs: PayrollRun[], records: Record<string, RemittanceRecord> | undefined, today: string): RemittanceRow[] {
  const out: RemittanceRow[] = [];
  const months = [...lockedRunsByMonth(runs)].sort(([a], [b]) => b.localeCompare(a));
  for (const [month, monthRuns] of months) {
    const reg = monthRuns.find((r) => r.type === "regular") ?? monthRuns[0];
    const amounts = remittanceAmounts(monthRuns);
    for (const c of remittanceCalendar(reg.period)) {
      const key = `${month}:${c.key}`;
      const rec = records?.[key];
      const liability = amounts[c.key];
      const paid = Math.min(paidOf(rec, liability), liability);
      const { status, overdue } = statusOf(rec, liability, c.due, today);
      out.push({
        key,
        month,
        monthLabel: reg.period.label,
        item: c.key,
        title: c.item,
        to: c.to,
        basis: c.basis,
        due: c.due,
        liability,
        paid: rec ? paidOf(rec, liability) : 0,
        outstanding: round2(Math.max(0, liability - paid)),
        status,
        overdue,
        record: rec,
        runs: monthRuns,
        daysToDue: days(today, c.due),
      });
    }
  }
  return out;
}

/**
 * Obligations coming up from runs still being prepared, estimated from their
 * current figures, so the calendar shows next month's deadlines before the
 * run is finalized.
 */
export function projectedRows(runs: PayrollRun[], today: string): RemittanceRow[] {
  const open = runs.filter((r) => r.type === "regular" && r.status !== "finalized" && r.status !== "disbursed");
  return open.flatMap((run) => {
    const month = `${run.period.year}-${String(run.period.month).padStart(2, "0")}`;
    const amounts = remittanceAmounts([run]);
    return remittanceCalendar(run.period)
      .filter((c) => amounts[c.key] > 0)
      .map((c) => ({
        key: `${month}:${c.key}`,
        month,
        monthLabel: run.period.label,
        item: c.key,
        title: c.item,
        to: c.to,
        basis: c.basis,
        due: c.due,
        liability: amounts[c.key],
        paid: 0,
        outstanding: amounts[c.key],
        status: "calculated" as const,
        overdue: false,
        runs: [run],
        daysToDue: days(today, c.due),
        projected: true,
      }));
  });
}

export interface RemittanceSummary {
  outstanding: number;
  overdue: number;
  overdueCount: number;
  dueSoonCount: number;
  awaitingReconciliation: number;
  nextDue: RemittanceRow | null;
}

export function summarise(rows: RemittanceRow[], soonDays = 7): RemittanceSummary {
  const open = rows.filter((r) => r.outstanding > 0 && !r.projected);
  const overdue = open.filter((r) => r.overdue);
  const upcoming = rows.filter((r) => r.outstanding > 0 && !r.overdue).sort((a, b) => a.due.localeCompare(b.due));
  return {
    outstanding: round2(open.reduce((s, r) => s + r.outstanding, 0)),
    overdue: round2(overdue.reduce((s, r) => s + r.outstanding, 0)),
    overdueCount: overdue.length,
    dueSoonCount: upcoming.filter((r) => r.daysToDue >= 0 && r.daysToDue <= soonDays).length,
    awaitingReconciliation: rows.filter((r) => r.status === "paid").length,
    nextDue: upcoming.find((r) => r.daysToDue >= 0) ?? null,
  };
}

export type ReminderStage = "upcoming" | "today" | "overdue" | "escalated";

/** Days past the deadline after which an unpaid remittance is escalated to the Executive. */
export const ESCALATE_AFTER_DAYS = 5;

/**
 * Reminders to send now: obligations due within `leadDays`, overdue, or
 * overdue long enough to escalate — each stage sent once.
 */
export function remindersDue(rows: RemittanceRow[], leadDays: number, sent: Record<string, string> | undefined, escalateAfter = ESCALATE_AFTER_DAYS): { key: string; row: RemittanceRow; stage: ReminderStage }[] {
  const out: { key: string; row: RemittanceRow; stage: ReminderStage }[] = [];
  for (const row of rows) {
    if (row.outstanding <= 0 || (row.status === "submitted" && !row.overdue)) continue;
    const stage: ReminderStage | null = row.overdue ? (row.daysToDue <= -escalateAfter ? "escalated" : "overdue") : row.daysToDue === 0 ? "today" : row.daysToDue > 0 && row.daysToDue <= leadDays ? "upcoming" : null;
    if (!stage) continue;
    const key = `${row.key}:${stage}`;
    if (sent?.[key]) continue;
    out.push({ key, row, stage });
  }
  return out;
}
