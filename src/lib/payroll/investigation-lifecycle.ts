import { REASON_LABELS, type RunComparison, type VarianceReason } from "./comparison";
import type { VarianceInvestigation } from "./types";

/**
 * Variance investigation lifecycle (client feedback B5, Nov 2026):
 *
 *   1 Detection → 2 Investigation → 3 Assignment → 4 Resolution →
 *   5 Independent sign-off → 6 Closure
 *
 * Stages are read from the record, never stored as a separate status, so an
 * investigation can't claim a stage its evidence doesn't support. Closure
 * happens only on a second person's accepted sign-off, and a closed case is
 * a permanent audit record: the slice refuses any further change.
 */

export type LifecycleKey = "detection" | "investigation" | "assignment" | "resolution" | "signoff" | "closure";

export const LIFECYCLE: { key: LifecycleKey; label: string; description: string }[] = [
  { key: "detection", label: "Detection", description: "The system, or a person, identifies an unusual or unexplained movement." },
  { key: "investigation", label: "Investigation", description: "The payroll administrator reviews the originating transaction." },
  { key: "assignment", label: "Assignment", description: "A responsible person receives the case." },
  { key: "resolution", label: "Resolution", description: "Supporting evidence and the explanation are recorded." },
  { key: "signoff", label: "Independent sign-off", description: "A second authorised person reviews the resolution." },
  { key: "closure", label: "Closure", description: "The case is closed with a permanent audit record." },
];

export interface LifecycleStage {
  key: LifecycleKey;
  label: string;
  description: string;
  state: "done" | "current" | "todo";
  at?: string;
  by?: string;
  note?: string;
}

export const isClosed = (i: VarianceInvestigation) => !!i.closedAt || (i.status === "resolved" && i.signOff?.decision === "accepted");

export function lifecycleOf(inv: VarianceInvestigation): { stages: LifecycleStage[]; current: LifecycleKey | null; closed: boolean } {
  const assignedAt = inv.history.find((h) => /assign/i.test(h.action))?.at;
  const closed = isClosed(inv);
  const done: Record<LifecycleKey, { ok: boolean; at?: string; by?: string; note?: string }> = {
    detection: { ok: true, at: inv.createdAt, by: inv.detectedBy === "system" ? "MOTEE (automatic)" : inv.createdBy, note: inv.finding },
    // Older cases have no review record: being worked on counts as reviewed.
    investigation: { ok: !!inv.review || inv.status !== "open", at: inv.review?.at, by: inv.review?.by, note: inv.review?.note },
    assignment: { ok: !!inv.ownerId, at: assignedAt, by: inv.ownerName || undefined },
    resolution: { ok: inv.status === "resolved", at: inv.resolvedAt, by: inv.resolvedBy, note: inv.resolutionNote },
    signoff: { ok: inv.signOff?.decision === "accepted", at: inv.signOff?.at, by: inv.signOff?.by, note: inv.signOff?.note },
    closure: { ok: closed, at: inv.closedAt ?? inv.signOff?.at },
  };
  let current: LifecycleKey | null = null;
  const stages = LIFECYCLE.map((s) => {
    const d = done[s.key];
    let state: LifecycleStage["state"] = d.ok ? "done" : "todo";
    if (!d.ok && !current) {
      current = s.key;
      state = "current";
    }
    return { ...s, state, at: d.ok ? d.at : undefined, by: d.ok ? d.by : undefined, note: d.ok ? d.note : undefined };
  });
  return { stages, current, closed };
}

/** The stage label for a list ("Assignment", "Closed"). */
export function stageLabel(inv: VarianceInvestigation): string {
  const { current, closed } = lifecycleOf(inv);
  if (closed) return "Closed";
  return LIFECYCLE.find((s) => s.key === current)?.label ?? "—";
}

/**
 * Stage 1, automatic: one case per employee whose movement no record
 * explains (B4 "Unexplained"), unless a case for that employee and month
 * already exists. Cases start unassigned.
 */
export function detectUnexplained(cmp: RunComparison, existing: VarianceInvestigation[]): Omit<VarianceInvestigation, "id" | "createdBy" | "createdAt" | "history" | "comments" | "documents" | "status" | "ownerId" | "ownerName">[] {
  const covered = new Set(existing.filter((i) => i.runId === cmp.current.id).map((i) => i.employeeId));
  return cmp.employees
    .filter((e) => e.confidence === "unexplained" && !covered.has(e.employeeId))
    .map((e) => {
      const reason = (Object.entries(e.reasons).find(([, v]) => v !== undefined)?.[0] ?? "other") as VarianceReason;
      const amount = e.unexplained || e.change;
      return {
        runId: cmp.current.id,
        previousRunId: cmp.previous.id,
        periodLabel: cmp.current.period.label,
        employeeId: e.employeeId,
        employeeName: e.name,
        reason,
        amount,
        title: `${e.name}: unexplained ${REASON_LABELS[reason].toLowerCase()} ${amount < 0 ? "−" : "+"}₦${Math.round(Math.abs(amount)).toLocaleString("en-NG")}`,
        finding: e.explanation,
        detectedBy: "system" as const,
      };
    });
}
