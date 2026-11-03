import { effectiveStatus, daysOverdue, type RunTask, type WorkflowRun } from "@/src/lib/types/workflow-runs";
import {
  RISK_PRIORITY_RANK,
  isRiskOpen,
  type RiskRecord,
  type RiskStatus,
  type WorkforceRisk,
} from "@/src/lib/types/workforce-risk";

/** One row of the register: the risk, what HR has done, and where it stands. */
export interface RiskEntry {
  key: string;
  risk: WorkforceRisk;
  record?: RiskRecord;
  run?: WorkflowRun;
  status: RiskStatus;
  /** Whether the rule still fires today. False for a risk kept only by its record. */
  detected: boolean;
  /** The recommendation in force: HR's edit when there is one. */
  recommendation: string;
  owner?: string;
  dueDate?: string;
  overdue: boolean;
  /** Days the lead action is overdue beyond its escalation window. */
  escalated: boolean;
}

/** The task that owns the outcome: the first one in the plan. */
export function leadTask(run: WorkflowRun | undefined): RunTask | undefined {
  return run?.tasks.slice().sort((a, b) => a.order - b.order)[0];
}

export function deriveStatus(
  detected: WorkforceRisk | undefined,
  record: RiskRecord | undefined,
  run: WorkflowRun | undefined,
): RiskStatus {
  if (record?.closure) {
    if (record.closure.outcome === "not_resolved") return "reopened";
    if (detected && detected.fingerprint !== record.closure.fingerprint) return "reopened";
    return "closed";
  }
  if (record?.dismissed) {
    if (detected && detected.fingerprint !== record.snapshot.fingerprint) return "reopened";
    return "dismissed";
  }
  if (run?.status === "completed") return "awaiting_closure";
  if (run?.status === "active") return "in_action";
  if (record && record.recurrenceCount > 0 && !run) return "reopened";
  if (record && record.history.length > 0) return "acknowledged";
  return "new";
}

/**
 * Merge today's detections with HR's records. A risk HR acted on stays in the
 * register after its rule stops firing — dropping it would erase the very
 * outcome the client wants recorded — but a closed or dismissed risk that no
 * longer fires is history, not work.
 */
export function buildRegister(
  detected: WorkforceRisk[],
  records: RiskRecord[],
  runs: WorkflowRun[],
  tenantId: string,
  now: Date = new Date(),
): RiskEntry[] {
  const runById = new Map(runs.map((r) => [r.id, r]));
  const recordById = new Map(records.filter((r) => r.tenantId === tenantId).map((r) => [r.riskId, r]));
  const seen = new Set<string>();
  const out: RiskEntry[] = [];

  const push = (risk: WorkforceRisk, isDetected: boolean) => {
    const record = recordById.get(risk.id);
    const run = record?.runId ? runById.get(record.runId) : undefined;
    const lead = leadTask(run);
    const leadStatus = lead ? effectiveStatus(lead, now) : undefined;
    const overdue = leadStatus === "overdue";
    out.push({
      key: `${tenantId}::${risk.id}`,
      risk,
      record,
      run,
      status: deriveStatus(isDetected ? risk : undefined, record, run),
      detected: isDetected,
      recommendation: record?.recommendation ?? risk.recommendedAction,
      owner: lead?.assigneeName,
      dueDate: lead?.dueDate,
      overdue,
      escalated:
        overdue && lead?.escalateAfterDays != null && daysOverdue(lead, now) > lead.escalateAfterDays,
    });
    seen.add(risk.id);
  };

  for (const risk of detected) push(risk, true);
  for (const record of recordById.values()) {
    if (seen.has(record.riskId)) continue;
    push(record.snapshot, false);
  }

  return out.sort(
    (a, b) =>
      Number(isRiskOpen(b.status)) - Number(isRiskOpen(a.status)) ||
      Number(b.overdue) - Number(a.overdue) ||
      RISK_PRIORITY_RANK[a.risk.priority] - RISK_PRIORITY_RANK[b.risk.priority],
  );
}

// ── Reporting ────────────────────────────────────────────────────────────────

export interface RiskReport {
  open: number;
  openByKind: Record<WorkforceRisk["kind"], number>;
  inAction: number;
  overdueActions: number;
  awaitingClosure: number;
  closed: number;
  /** Mean days from the first action on a risk to its closure. */
  meanDaysToResolve: number | null;
  recurring: RiskEntry[];
  /** Closed risks whose measured value moved the right way. */
  improvements: { entry: RiskEntry; before: number; after: number }[];
}

export function riskReport(entries: RiskEntry[]): RiskReport {
  const open = entries.filter((e) => isRiskOpen(e.status));
  const closed = entries.filter((e) => e.status === "closed" && e.record?.closure);
  const durations = closed
    .map((e) => {
      const first = e.record!.history[0]?.at;
      return first ? (Date.parse(e.record!.closure!.at) - Date.parse(first)) / 86_400_000 : null;
    })
    .filter((d): d is number => d != null);

  const improvements = closed.flatMap((e) => {
    const before = e.record!.snapshot.metric?.value;
    const after = e.record!.closure!.metricAtClose;
    const m = e.record!.snapshot.metric;
    if (before == null || after == null || !m) return [];
    // A target below the starting value means lower is better (overdue tasks, sickness).
    const lowerIsBetter = m.target != null ? m.target < before : false;
    const better = lowerIsBetter ? after < before : after > before;
    return better ? [{ entry: e, before, after }] : [];
  });

  return {
    open: open.length,
    openByKind: {
      existing_problem: open.filter((e) => e.risk.kind === "existing_problem").length,
      emerging_risk: open.filter((e) => e.risk.kind === "emerging_risk").length,
      improvement: open.filter((e) => e.risk.kind === "improvement").length,
    },
    inAction: entries.filter((e) => e.status === "in_action").length,
    overdueActions: entries.filter((e) => e.status === "in_action" && e.overdue).length,
    awaitingClosure: entries.filter((e) => e.status === "awaiting_closure").length,
    closed: closed.length,
    meanDaysToResolve:
      durations.length > 0 ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10 : null,
    recurring: entries.filter((e) => (e.record?.recurrenceCount ?? 0) > 0),
    improvements,
  };
}
