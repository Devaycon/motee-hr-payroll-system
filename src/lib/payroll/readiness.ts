import type { RunComparison } from "./comparison";
import type { RemittanceRow } from "./remittance-centre";
import type { TenantPayrollData } from "./run-builder";
import type { ExceptionRule, PayrollException, PayrollRun, VarianceInvestigation } from "./types";
import { ytdIntegrity } from "./ytd";

/**
 * Payroll Control Centre — the pre-payment readiness score (client feedback
 * B1, Nov 2026).
 *
 * Every control is "passed", "review" or "failed". Critical controls are the
 * compliance and payment checks: while any of them has FAILED the run cannot
 * be submitted, approved or finalized (a hard block — `blocked`). "Review"
 * never blocks; it lowers the score and asks a person to look.
 *
 * An exception acknowledged with a written reason counts as rectified — the
 * reason stays on the run for audit.
 */

export type CheckState = "passed" | "review" | "failed";

export type CheckKey =
  | "calculated"
  | "months_in_order"
  | "bank_validation"
  | "duplicates"
  | "statutory_ids"
  | "net_pay"
  | "leavers"
  | "ytd_integrity"
  | "variances"
  | "investigations"
  | "errors"
  | "warnings"
  | "statutory_reconciliation"
  | "pending_changes";

export interface ReadinessCheck {
  key: CheckKey;
  label: string;
  critical: boolean;
  state: CheckState;
  detail: string;
  /** Items behind the state (exceptions, employees, remittances). */
  count: number;
  /** Where to fix it, relative to the run (e.g. "?tab=exceptions"). */
  fix?: "exceptions" | "compare" | "investigations" | "remittances" | "settings" | "run" | "earlier";
}

export interface Readiness {
  runId: string;
  score: number;
  checks: ReadinessCheck[];
  criticalPassed: number;
  criticalTotal: number;
  /** Open exceptions (errors and warnings not acknowledged). */
  unresolvedExceptions: number;
  /** True while any critical check has failed: no submit, approve or finalize. */
  blocked: boolean;
  blockers: ReadinessCheck[];
}

const open = (run: PayrollRun, rules: ExceptionRule[], severity?: PayrollException["severity"]) =>
  run.exceptions.filter((e) => rules.includes(e.rule) && !e.acknowledged && (!severity || e.severity === severity));

const plural = (n: number, s: string) => `${n} ${s}${n === 1 ? "" : "s"}`;

/** An investigation counts as closed once a second person has signed off its resolution. */
export const investigationClosed = (i: VarianceInvestigation) => i.status === "resolved" && i.signOff?.decision === "accepted";

export interface ReadinessInput {
  run: PayrollRun;
  data: Pick<TenantPayrollData, "payslips" | "openingYtd" | "structures"> & { investigations?: VarianceInvestigation[]; configChanges?: { status: string }[] };
  /** Earlier regular months still open. */
  earlierOpen: number;
  /** This run against the previous month (null for the first month or off-cycle runs). */
  comparison: RunComparison | null;
  /** Statutory remittances of finalized months (Remittance Centre rows). */
  remittances: RemittanceRow[];
}

export function runReadiness({ run, data, earlierOpen, comparison, remittances }: ReadinessInput): Readiness {
  const checks: ReadinessCheck[] = [];
  const add = (c: ReadinessCheck) => checks.push(c);

  // 1 · Calculated and current
  add({
    key: "calculated",
    label: "Calculated and up to date",
    critical: true,
    state: run.stale || !run.calculatedAt ? "failed" : "passed",
    detail: run.stale ? `Recalculate — ${run.stale.reason}` : run.calculatedAt ? "Figures reflect the latest inputs" : "Not calculated yet",
    count: run.stale || !run.calculatedAt ? 1 : 0,
    fix: "run",
  });

  // 2 · Months close in order
  add({
    key: "months_in_order",
    label: "Earlier months closed",
    critical: true,
    state: earlierOpen ? "failed" : "passed",
    detail: earlierOpen ? `${plural(earlierOpen, "earlier month")} still open — months close in order` : "Every earlier month is finalized",
    count: earlierOpen,
    fix: "earlier",
  });

  // 3 · Bank account validation
  const bankBad = open(run, ["missing_bank", "missing_bank_code", "invalid_nuban"]);
  const bankChanged = open(run, ["bank_changed"]);
  add({
    key: "bank_validation",
    label: "Bank validation",
    critical: true,
    state: bankBad.length ? "failed" : bankChanged.length ? "review" : "passed",
    detail: bankBad.length
      ? `${plural(bankBad.length, "account")} missing or failing the NUBAN check`
      : bankChanged.length
        ? `${plural(bankChanged.length, "account")} changed since last pay — confirm before paying`
        : "Every account passes the NUBAN check",
    count: bankBad.length + bankChanged.length,
    fix: "exceptions",
  });

  // 4 · Duplicates
  const dupErr = open(run, ["duplicate_bank_account", "duplicate_employee"], "error");
  const dupWarn = open(run, ["duplicate_employee"], "warning");
  add({
    key: "duplicates",
    label: "Duplicate accounts & employees",
    critical: true,
    state: dupErr.length ? "failed" : dupWarn.length ? "review" : "passed",
    detail: dupErr.length ? `${plural(dupErr.length, "duplicate")} — the same account or identity paid twice` : dupWarn.length ? `${plural(dupWarn.length, "possible duplicate")} by name` : "No duplicate accounts or employees",
    count: dupErr.length + dupWarn.length,
    fix: "exceptions",
  });

  // 5 · TIN / RSA PIN
  const tinErr = open(run, ["missing_tin"], "error");
  const idWarn = [...open(run, ["missing_tin"], "warning"), ...open(run, ["missing_rsa"])];
  add({
    key: "statutory_ids",
    label: "TIN & RSA PIN on file",
    critical: true,
    state: tinErr.length ? "failed" : idWarn.length ? "review" : "passed",
    detail: tinErr.length ? `${plural(tinErr.length, "employee")} taxed with no TIN — PAYE can't be filed against them` : idWarn.length ? `${plural(idWarn.length, "record")} missing a TIN or RSA PIN` : "Every taxed or pensioned employee has a TIN and RSA PIN",
    count: tinErr.length + idWarn.length,
    fix: "exceptions",
  });

  // 6 · Net pay
  const netBad = open(run, ["negative_net", "zero_net"]);
  add({
    key: "net_pay",
    label: "No negative or zero net pay",
    critical: true,
    state: netBad.length ? "failed" : "passed",
    detail: netBad.length ? `${plural(netBad.length, "employee")} with deductions at or above gross pay` : "Every employee is paid a positive net",
    count: netBad.length,
    fix: "exceptions",
  });

  // 7 · Leavers
  const leavers = open(run, ["leaver_in_run"]);
  add({
    key: "leavers",
    label: "Leavers excluded",
    critical: true,
    state: leavers.length ? "failed" : "passed",
    detail: leavers.length ? `${plural(leavers.length, "leaver")} still in the run` : "No one who has left is being paid",
    count: leavers.length,
    fix: "exceptions",
  });

  // 8 · YTD integrity (A1)
  const ytd = run.calculatedAt ? ytdIntegrity(run, data) : [];
  const ytdPeople = new Set(ytd.map((i) => i.employeeId)).size;
  add({
    key: "ytd_integrity",
    label: "YTD integrity",
    critical: true,
    state: ytdPeople ? "failed" : "passed",
    detail: ytdPeople ? `${plural(ytdPeople, "employee")}'s YTD no longer matches their final payslips — recalculate` : "YTD equals opening balance + final payslips, to the kobo",
    count: ytdPeople,
    fix: "run",
  });

  // 9 · Variances (B4): unexplained movements must be investigated; verification-required ones lower the score.
  const invs = (data.investigations ?? []).filter((i) => i.runId === run.id);
  const covered = new Set(invs.map((i) => i.employeeId).filter(Boolean));
  const unexplained = (comparison?.employees ?? []).filter((e) => e.confidence === "unexplained" && !covered.has(e.employeeId));
  const verify = (comparison?.employees ?? []).filter((e) => e.confidence === "verification_required");
  add({
    key: "variances",
    label: "Variances explained",
    critical: true,
    state: unexplained.length ? "failed" : verify.length ? "review" : "passed",
    detail: !comparison
      ? "No previous month to compare with"
      : unexplained.length
        ? `${plural(unexplained.length, "employee")} with a movement no record explains — raise an investigation`
        : verify.length
          ? `${plural(verify.length, "employee")} with a likely reason that needs verifying`
          : "Every movement traced to a confirmed source",
    count: unexplained.length + verify.length,
    fix: "compare",
  });

  // 10 · Investigations (B5): every case on this run signed off by a second person.
  const openInv = invs.filter((i) => !investigationClosed(i));
  add({
    key: "investigations",
    label: "Investigations closed",
    critical: true,
    state: openInv.length ? "failed" : "passed",
    detail: openInv.length ? `${plural(openInv.length, "investigation")} not yet resolved and signed off` : invs.length ? `${plural(invs.length, "investigation")} closed with independent sign-off` : "No investigations on this run",
    count: openInv.length,
    fix: "investigations",
  });

  // 11 · Any other error
  const covers = new Set<ExceptionRule>(["missing_bank", "missing_bank_code", "invalid_nuban", "duplicate_bank_account", "duplicate_employee", "missing_tin", "negative_net", "zero_net", "leaver_in_run"]);
  const otherErr = run.exceptions.filter((e) => e.severity === "error" && !e.acknowledged && !covers.has(e.rule));
  add({
    key: "errors",
    label: "Other errors resolved",
    critical: true,
    state: otherErr.length ? "failed" : "passed",
    detail: otherErr.length ? `${plural(otherErr.length, "error")} to fix or acknowledge with a reason` : "No other open errors",
    count: otherErr.length,
    fix: "exceptions",
  });

  // 12 · Warnings
  const warn = run.exceptions.filter((e) => e.severity === "warning" && !e.acknowledged && !["bank_changed", "duplicate_employee", "missing_tin", "missing_rsa"].includes(e.rule));
  add({
    key: "warnings",
    label: "Warnings reviewed",
    critical: false,
    state: warn.length ? "review" : "passed",
    detail: warn.length ? `${plural(warn.length, "warning")} to review` : "No open warnings",
    count: warn.length,
    fix: "exceptions",
  });

  // 13 · Statutory reconciliation of earlier months (B3)
  const overdue = remittances.filter((r) => r.overdue);
  const unreconciled = remittances.filter((r) => !r.overdue && (r.status === "paid" || r.status === "submitted"));
  add({
    key: "statutory_reconciliation",
    label: "Statutory reconciliation",
    critical: false,
    state: overdue.length || unreconciled.length ? "review" : "passed",
    detail: overdue.length
      ? `${plural(overdue.length, "remittance")} overdue from earlier months`
      : unreconciled.length
        ? `${plural(unreconciled.length, "remittance")} paid but not yet reconciled`
        : "Earlier months' remittances paid and reconciled",
    count: overdue.length + unreconciled.length,
    fix: "remittances",
  });

  // 14 · Pending salary / configuration changes
  const pending = data.structures.filter((s) => s.status === "pending").length + (data.configChanges ?? []).filter((c) => c.status === "pending").length;
  add({
    key: "pending_changes",
    label: "Pending changes decided",
    critical: false,
    state: pending ? "review" : "passed",
    detail: pending ? `${plural(pending, "salary or configuration change")} awaiting approval — not in this run` : "No pending salary or configuration changes",
    count: pending,
    fix: "settings",
  });

  // Score: a critical control weighs three times a review control; "review" earns half.
  const weight = (c: ReadinessCheck) => (c.critical ? 3 : 1);
  const earned = checks.reduce((s, c) => s + weight(c) * (c.state === "passed" ? 1 : c.state === "review" ? 0.5 : 0), 0);
  const total = checks.reduce((s, c) => s + weight(c), 0);
  const critical = checks.filter((c) => c.critical);
  const blockers = critical.filter((c) => c.state === "failed");
  return {
    runId: run.id,
    score: Math.round((earned / total) * 100),
    checks,
    criticalPassed: critical.filter((c) => c.state === "passed").length,
    criticalTotal: critical.length,
    unresolvedExceptions: run.exceptions.filter((e) => !e.acknowledged).length,
    blocked: blockers.length > 0,
    blockers,
  };
}

/** One sentence for a refused action: "Approval blocked — 2 critical checks failed: Bank validation, Variances explained." */
export function blockedReason(r: Readiness, action: "submission" | "approval" | "finalizing"): string {
  return `${action[0].toUpperCase()}${action.slice(1)} blocked — ${plural(r.blockers.length, "critical check")} failed: ${r.blockers.map((b) => b.label).join(", ")}. Fix them in the Payroll Control Centre.`;
}
