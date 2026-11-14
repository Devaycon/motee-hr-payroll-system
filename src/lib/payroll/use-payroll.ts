"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useUnscopedLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { applyCollection } from "@/src/lib/profile/collection-edits";
import { updateRecord } from "@/src/lib/stores/collection-edits-slice";
import { cancel as cancelApproval, submitApproval } from "@/src/lib/stores/approvals-slice";
import { updateClaim } from "@/src/lib/stores/expenses-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import { withApproval } from "@/src/lib/loans/loans";
import {
  addPayslips,
  addRateSet,
  addSalaryStructure,
  deleteRun,
  logPayroll,
  markRemitted,
  resetTenantPayroll,
  saveRun,
  seedTenantPayroll,
  setVerificationRevoked,
  updatePayrollSettings,
  updateTaxProfile,
  upsertElement,
  type TenantPayroll,
} from "@/src/lib/stores/payroll-slice";
import type { LocaleBundle, LocaleLoan } from "@/src/lib/types/locale";
import type { ApprovalRequest } from "@/src/lib/types/approvals";
import { store, type RootState } from "@/src/lib/stores/store";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { makePeriod, round2 } from "./ng/engine";
import {
  buildPayslips,
  calculateRun,
  newRun,
  previousComputation,
  previousSnapshot,
  seedHistory,
  seedProfile,
  seedStructure,
  type PayableExpense,
  type TenantPayrollData,
} from "./run-builder";
import { validateRun, blockingExceptions } from "./validation";
import { ESS_PAYSLIPS_HREF, PAYROLL_DOCUMENT_TYPE, SALARY_CHANGE_DOCUMENT_TYPE } from "./constants";
import type {
  EmployeeMode,
  EmployeeTaxProfile,
  PayComputation,
  PayElement,
  PayPeriod,
  PaymentSnapshot,
  PayrollRun,
  PayrollSettings,
  PayslipLine,
  PeriodInput,
  RunActor,
  SalaryStructure,
  StatutoryRateSet,
} from "./types";

/**
 * The only door the payroll screens use. Today it reads and writes the
 * demo slice; the integration swaps these bodies for RTK Query calls with
 * the same signatures (see the v2 spec's REST contract).
 *
 * Every action reads the LATEST store state when it runs (never a value
 * captured at render), so two quick edits can't overwrite each other.
 *
 * Payroll is company-wide, so it reads the raw tenant bundle rather than the
 * viewer's branch/role-scoped view. Who may SEE it is enforced by the
 * `time-payroll.payroll` permission and, for payslips, by ownership.
 */

const ngn = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const LOCKED: PayrollRun["status"][] = ["finalized", "disbursed"];
const periodKey = (p: Pick<PayPeriod, "year" | "month">) => p.year * 100 + p.month;

/** Loans with their approval outcome and any recorded repayments applied. */
export function resolvedLoans(state: RootState, bundle: LocaleBundle): LocaleLoan[] {
  const byDoc = new Map(state.approvals.requests.filter((r) => r.documentType === "loan_request").map((r) => [r.documentId, r]));
  return applyCollection(bundle.loans ?? [], "loans", state.collectionEdits).map((l) => withApproval(l, byDoc.get(l.id)));
}

/** Claims from the Expenses module, as payroll needs them. */
export function payableExpenses(state: RootState): PayableExpense[] {
  return state.expenses.claims.map((c) => ({
    id: c.id,
    employeeId: c.employeeId,
    amount: c.amount,
    status: c.status,
    dateSubmitted: c.dateSubmitted,
    title: c.title,
  }));
}

export function isPayrollCountry(bundle: LocaleBundle | null | undefined): boolean {
  return bundle?.tenant.countryCode === "NG";
}

/** Payroll approval requests for a run, newest first. */
export function requestsForRun(state: RootState, runId: string): ApprovalRequest[] {
  return state.approvals.requests.filter((r) => r.documentType === PAYROLL_DOCUMENT_TYPE && r.documentId === runId);
}

function buildTenantSeed(state: RootState, bundle: LocaleBundle): TenantPayroll {
  const settings = DEFAULT_PAYROLL_SETTINGS;
  const base = {
    elements: SEED_PAY_ELEMENTS,
    rateSets: NG_RATE_SETS,
    settings,
    structures: bundle.employees.map((e) => seedStructure(e, settings)),
    profiles: bundle.employees.map(seedProfile),
  };
  const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: resolvedLoans(state, bundle), today: new Date() });
  const data = { ...base, ...history };
  // Validate the seeded draft so the Exceptions tab is populated on first open.
  const runs = history.runs.map((r) => (r.status === "draft" ? withValidation(r, data, bundle) : r));
  return { ...data, runs, audit: [], remittances: {} };
}

export function withValidation(run: PayrollRun, data: TenantPayrollData, bundle: LocaleBundle): PayrollRun {
  const previous = new Map<string, PayComputation>();
  const previousPayment = new Map<string, PaymentSnapshot>();
  for (const re of run.employees) {
    const p = previousComputation(data, re.employeeId, run.period, run.id);
    if (p) previous.set(re.employeeId, p);
    const snap = previousSnapshot(data, re.employeeId, run.period);
    if (snap) previousPayment.set(re.employeeId, snap);
  }
  const exceptions = validateRun({
    run,
    employees: new Map(bundle.employees.map((e) => [e.id, e])),
    profiles: new Map(data.profiles.map((p) => [p.employeeId, p])),
    previous,
    previousPayment,
    settings: data.settings,
  });
  return { ...run, exceptions };
}

/** Earlier regular runs that aren't finalized yet — months must be closed in order. */
export function openEarlierRuns(data: Pick<TenantPayrollData, "runs">, run: Pick<PayrollRun, "id" | "period">): PayrollRun[] {
  return data.runs.filter((r) => r.id !== run.id && r.type === "regular" && !LOCKED.includes(r.status) && periodKey(r.period) < periodKey(run.period));
}

export interface TenantPayrollView {
  tenantId: string | null;
  bundle: LocaleBundle | null;
  data: TenantPayroll | null;
  loading: boolean;
  /** False for a tenant whose country has no statutory module yet (UK). */
  supported: boolean;
}

/** Tenants currently being seeded — the heavy seed runs once, whoever renders first. */
const seeding = new Set<string>();

/**
 * The current tenant's payroll, seeded on first use. Pass `enabled: false`
 * when the viewer has no right to see payroll — nothing is seeded or read.
 */
export function useTenantPayroll(opts: { enabled?: boolean } = {}): TenantPayrollView {
  const enabled = opts.enabled ?? true;
  const dispatch = useAppDispatch();
  // Triggers the locale load; payroll itself reads the raw, unscoped bundle.
  const { loading } = useUnscopedLocaleSection((b) => b.tenant.id);
  const bundle = useAppSelector((s) => s.locale.data);
  const tenantId = bundle?.tenant.id ?? null;
  const data = useAppSelector((s) => (enabled && tenantId ? s.payroll.byTenant[tenantId] ?? null : null));
  const supported = isPayrollCountry(bundle);

  useEffect(() => {
    if (!enabled || !bundle || !tenantId || data || !supported || seeding.has(tenantId)) return;
    seeding.add(tenantId);
    try {
      if (!store.getState().payroll.byTenant[tenantId]) {
        dispatch(seedTenantPayroll({ tenantId, data: buildTenantSeed(store.getState(), bundle) }));
      }
    } finally {
      seeding.delete(tenantId);
    }
  }, [enabled, bundle, tenantId, data, supported, dispatch]);

  return useMemo(
    () => ({ tenantId, bundle, data, loading: loading || (enabled && supported && !data), supported }),
    [tenantId, bundle, data, loading, enabled, supported],
  );
}

export function useCurrentActor(): RunActor & { roleId?: string } {
  const user = useAppSelector((s) => s.auth.user);
  return useMemo(() => ({ employeeId: user?.employeeId ?? "", name: user?.name ?? "HR Admin", roleId: user?.roleId }), [user]);
}

// ── Actions ─────────────────────────────────────────────────────────────────

export type ActionResult = { ok: true } | { ok: false; reason: string };

export function usePayrollActions() {
  const dispatch = useAppDispatch();
  const view = useTenantPayroll();
  const actor = useCurrentActor();
  const user = useAppSelector((s) => s.auth.user);
  const { tenantId } = view;

  return useMemo(() => {
    /** Latest tenant payroll + bundle, read at call time (no stale closures). */
    const live = () => {
      const s = store.getState();
      const bundle = s.locale.data;
      const data = tenantId ? s.payroll.byTenant[tenantId] : undefined;
      return bundle && data ? { s, bundle, data } : null;
    };
    const find = (runId: string) => live()?.data.runs.find((r) => r.id === runId);
    const save = (run: PayrollRun, note: string) => tenantId && dispatch(saveRun({ tenantId, actor: actor.name, note, run }));
    const log = (action: string, extra: { runId?: string; employeeId?: string; detail?: string } = {}) =>
      tenantId && dispatch(logPayroll({ tenantId, actor: actor.name, action, ...extra }));

    /** Recalculate + revalidate a draft run and save it. */
    function recalc(run: PayrollRun, note: string): PayrollRun | undefined {
      const l = live();
      if (!l) return;
      const validated = withValidation(calculateRun({ ...run, status: "draft" }, l.data, l.bundle), l.data, l.bundle);
      save(validated, note);
      return validated;
    }

    function editDraft(runId: string, note: string, change: (r: PayrollRun) => PayrollRun) {
      const run = find(runId);
      if (!run || run.status !== "draft") return;
      return recalc(change(run), note);
    }

    function cancelOpenRequests(runId: string) {
      for (const r of requestsForRun(store.getState(), runId)) {
        if (r.status === "in_progress" || r.status === "returned") {
          dispatch(cancelApproval({ requestId: r.id, actorEmployeeId: actor.employeeId, actorName: actor.name }));
        }
      }
    }

    /**
     * Something the figures depend on changed. Unlocked runs are flagged stale
     * (they must be recalculated before submit/finalize); runs that were in
     * review or approved go back to draft, and their approval is withdrawn.
     */
    function markStale(reason: string, filter: (r: PayrollRun) => boolean = () => true) {
      const l = live();
      if (!l) return;
      for (const r of l.data.runs) {
        if (LOCKED.includes(r.status) || !filter(r)) continue;
        if (r.status === "in_review" || r.status === "approved") cancelOpenRequests(r.id);
        save({ ...r, status: "draft", approvedBy: undefined, approvedAt: undefined, submittedAt: undefined, stale: { reason, at: new Date().toISOString() } }, `Needs recalculation: ${reason}`);
      }
    }

    function createRun(
      type: PayrollRun["type"],
      period: PayPeriod,
      extra: { parentRunId?: string; adjustsPeriod?: PayPeriod } = {},
    ): { run?: PayrollRun; reason?: string } {
      const l = live();
      if (!l || !tenantId) return { reason: "Payroll isn't loaded yet." };
      if (type === "regular" && l.data.runs.some((r) => r.type === "regular" && periodKey(r.period) === periodKey(period)))
        return { reason: `A regular run for ${period.label} already exists.` };
      const run = newRun({
        tenantId,
        type,
        period,
        preparedBy: { employeeId: actor.employeeId, name: actor.name },
        bundle: l.bundle,
        data: l.data,
        loans: resolvedLoans(l.s, l.bundle),
        expenses: payableExpenses(l.s),
        today: new Date(),
        ...extra,
      });
      const validated = withValidation(run, l.data, l.bundle);
      save(validated, `Created ${run.title}`);
      return { run: validated };
    }

    /** Raises the payroll_run approval request for a run. Returns the new request id. */
    async function raiseApproval(run: PayrollRun, note?: string): Promise<string | null> {
      const t = run.totals;
      try {
        await dispatch(
          submitApproval({
            documentType: PAYROLL_DOCUMENT_TYPE,
            documentId: run.id,
            documentTitle: run.title,
            documentSummary: `${t.employees} employees · gross ₦${Math.round(t.gross).toLocaleString("en-NG")} · net ₦${Math.round(t.net).toLocaleString("en-NG")}${note ? ` · ${note}` : ""}`,
            payloadSnapshot: {
              "Pay period": run.period.label,
              "Run type": run.type === "regular" ? "Regular monthly" : run.type === "off_cycle" ? "Off-cycle" : `Adjustment to ${run.adjustsPeriod?.label ?? ""}`,
              "Prepared by": run.preparedBy.name,
              Employees: t.employees,
              "Gross pay": ngn(t.gross),
              "Total deductions": ngn(t.deductions),
              "Net pay (bank file)": ngn(t.net),
              "PAYE to remit": ngn(t.paye),
              "Pension (employee + employer)": ngn(t.pensionEmployee + t.pensionEmployer),
              "Employer cost": ngn(t.employerCost),
              "Exceptions acknowledged": run.exceptions.filter((e) => e.acknowledged).length,
              "Warnings to review": run.exceptions.filter((e) => e.severity === "warning").length,
            },
            submitter: {
              employeeId: actor.employeeId,
              name: actor.name,
              initials: user?.initials ?? "HR",
              departmentName: user?.departmentName ?? "Human Resources",
            },
            // Segregation of duties: neither the preparer nor the submitter may decide.
            excludedApproverIds: [run.preparedBy.employeeId, actor.employeeId].filter(Boolean),
          }),
        ).unwrap();
      } catch {
        return null;
      }
      return requestsForRun(store.getState(), run.id)[0]?.id ?? null;
    }

    return {
      ready: !!live(),
      createRun,

      /** Corrects a finalized period: the adjustment is paid in the next open month. */
      createAdjustmentRun(fromRunId: string) {
        const l = live();
        const src = find(fromRunId);
        if (!l || !src) return { reason: "Run not found." };
        const open = l.data.runs
          .filter((r) => r.type === "regular" && !LOCKED.includes(r.status))
          .sort((a, b) => periodKey(a.period) - periodKey(b.period))[0];
        const payIn = open?.period ?? nextPeriod(l.data, l.data.settings.payDay);
        return createRun("adjustment", payIn, { parentRunId: src.id, adjustsPeriod: src.period });
      },

      recalculate(runId: string) {
        const l = live();
        const run = find(runId);
        if (!l || !run || run.status !== "draft" || !tenantId) return;
        // Re-gather module inputs (loans, expenses) but keep manual inputs and people added by hand.
        const fresh = newRun({
          tenantId,
          type: run.type,
          period: run.period,
          preparedBy: run.preparedBy,
          bundle: l.bundle,
          data: l.data,
          loans: resolvedLoans(l.s, l.bundle),
          expenses: payableExpenses(l.s),
          today: new Date(),
          adjustsPeriod: run.adjustsPeriod,
          parentRunId: run.parentRunId,
          id: run.id,
        });
        const keepInputs = run.inputs.filter((i) => i.source === "manual" || i.source === "adjustment");
        const previous = new Map(run.employees.map((e) => [e.employeeId, e]));
        const freshIds = new Set(fresh.employees.map((e) => e.employeeId));
        return recalc(
          {
            ...run,
            seq: run.seq ?? fresh.seq,
            inputs: run.type === "regular" ? [...fresh.inputs, ...keepInputs] : run.inputs,
            inputNotes: fresh.inputNotes,
            employees: [
              ...fresh.employees.map((e) => {
                const k = previous.get(e.employeeId);
                return k ? { ...e, included: k.included, mode: k.mode, manualLines: k.manualLines, manualStatutory: k.manualStatutory } : e;
              }),
              ...run.employees.filter((e) => !freshIds.has(e.employeeId)),
            ],
          },
          "Recalculated run",
        );
      },

      setIncluded(runId: string, employeeId: string, included: boolean) {
        return editDraft(runId, `${included ? "Included" : "Excluded"} employee`, (r) => ({
          ...r,
          employees: r.employees.map((e) => (e.employeeId === employeeId ? { ...e, included } : e)),
        }));
      },

      /** Add people to an off-cycle run (recent leavers included). */
      addEmployees(runId: string, employeeIds: string[]) {
        return editDraft(runId, `Added ${employeeIds.length} employee${employeeIds.length === 1 ? "" : "s"}`, (r) => {
          const have = new Set(r.employees.map((e) => e.employeeId));
          return {
            ...r,
            employees: [
              ...r.employees.map((e) => (employeeIds.includes(e.employeeId) ? { ...e, included: true } : e)),
              ...employeeIds
                .filter((id) => !have.has(id))
                .map((id) => ({ employeeId: id, included: true, mode: "auto" as const, computation: null, attendance: { workingDays: 0, daysWorked: 0, paidLeaveDays: 0, unpaidLeaveDays: 0, overtimeHours: 0 } })),
            ],
          };
        });
      },

      setPayDate(runId: string, payDate: string) {
        return editDraft(runId, `Pay date set to ${payDate}`, (r) => ({ ...r, period: { ...r.period, payDate } }));
      },

      setMode(runId: string, employeeId: string, mode: EmployeeMode) {
        return editDraft(runId, `Switched employee to ${mode}`, (r) => ({
          ...r,
          employees: r.employees.map((e) =>
            e.employeeId === employeeId
              ? {
                  ...e,
                  mode,
                  manualLines: mode === "auto" ? undefined : e.manualLines ?? e.computation?.lines.filter((l) => l.category !== "employer" && !l.statutory),
                  manualStatutory: e.manualStatutory ?? "recalculate",
                }
              : e,
          ),
        }));
      },

      /** Replace a manual employee's lines (zero/empty lines dropped). */
      setManualLines(runId: string, employeeId: string, lines: PayslipLine[], statutory?: "as_uploaded" | "recalculate") {
        return editDraft(runId, "Edited manual figures", (r) => ({
          ...r,
          employees: r.employees.map((e) =>
            e.employeeId === employeeId
              ? { ...e, mode: "manual" as const, included: true, manualLines: lines.filter((l) => Number.isFinite(l.amount) && l.amount !== 0), manualStatutory: statutory ?? e.manualStatutory ?? "recalculate" }
              : e,
          ),
        }));
      },

      /**
       * Add a one-period input. After the month's input cut-off day a regular
       * run only takes it with an explicit override, which is logged.
       */
      addInput(runId: string, input: Omit<PeriodInput, "id">, opts: { override?: boolean } = {}): ActionResult {
        const run = find(runId);
        if (!run || run.status !== "draft") return { ok: false, reason: "Only a draft run can take new inputs." };
        const l = live();
        const cutoff = l ? inputCutoffDate(run.period, l.data.settings.inputCutoffDay) : null;
        if (run.type === "regular" && cutoff && new Date().toISOString().slice(0, 10) > cutoff && !opts.override)
          return { ok: false, reason: `The input cut-off for ${run.period.label} was ${cutoff}. Add it to next month's run, or override.` };
        editDraft(runId, `Added pay input${opts.override ? " after the input cut-off (override)" : ""}`, (r) => ({
          ...r,
          inputs: [...r.inputs, { ...input, id: `IN-${Date.now().toString(36)}-${r.inputs.length}` }],
          employees: r.employees.map((e) => (e.employeeId === input.employeeId ? { ...e, included: true } : e)),
        }));
        return { ok: true };
      },

      removeInput(runId: string, inputId: string) {
        return editDraft(runId, "Removed pay input", (r) => ({ ...r, inputs: r.inputs.filter((i) => i.id !== inputId) }));
      },

      /** Commit a staged manual upload: per-employee lines, switched to manual mode. */
      applyManualUpload(runId: string, rows: { employeeId: string; lines: PayslipLine[] }[], statutory: "as_uploaded" | "recalculate", fileName: string) {
        return editDraft(runId, `Manual upload: ${fileName} (${rows.length} employees)`, (r) => ({
          ...r,
          employees: [
            ...r.employees.map((e) => {
              const row = rows.find((x) => x.employeeId === e.employeeId);
              return row ? { ...e, included: true, mode: "manual" as const, manualLines: row.lines, manualStatutory: statutory } : e;
            }),
            ...rows
              .filter((x) => !r.employees.some((e) => e.employeeId === x.employeeId))
              .map((x) => ({
                employeeId: x.employeeId,
                included: true,
                mode: "manual" as const,
                manualLines: x.lines,
                manualStatutory: statutory,
                computation: null,
                attendance: { workingDays: 0, daysWorked: 0, paidLeaveDays: 0, unpaidLeaveDays: 0, overtimeHours: 0 },
              })),
          ],
        }));
      },

      acknowledge(runId: string, exceptionId: string, reason: string) {
        const run = find(runId);
        if (!run || run.status !== "draft") return;
        save(
          { ...run, exceptions: run.exceptions.map((e) => (e.id === exceptionId ? { ...e, acknowledged: { by: actor.name, at: new Date().toISOString(), reason } } : e)) },
          `Acknowledged exception: ${reason}`,
        );
      },

      /** Draft → In review. Raises the payroll_run approval request. */
      async submit(runId: string, note?: string): Promise<ActionResult> {
        const l = live();
        const run = find(runId);
        if (!l || !run || run.status !== "draft") return { ok: false, reason: "Only a draft run can be submitted." };
        if (!actor.employeeId) return { ok: false, reason: "Sign in with an employee account to submit payroll." };
        if (run.stale) return { ok: false, reason: `Recalculate first — ${run.stale.reason}.` };
        if (!run.employees.some((e) => e.included && e.computation)) return { ok: false, reason: "The run has no calculated employees." };
        const earlier = openEarlierRuns(l.data, run);
        if (earlier.length) return { ok: false, reason: `Finalize ${earlier.map((r) => r.period.label).join(", ")} first — months are closed in order.` };
        const blocking = blockingExceptions(run);
        if (blocking.length) return { ok: false, reason: `${blocking.length} error${blocking.length === 1 ? "" : "s"} must be resolved or acknowledged first.` };
        const requestId = await raiseApproval(run, note);
        if (!requestId) return { ok: false, reason: "No approval chain is set up for payroll runs. Add one in Submissions & Approvals." };
        // A chain where every step was skipped approves immediately.
        const req = store.getState().approvals.requests.find((r) => r.id === requestId);
        const approvedNow = req?.status === "approved";
        save(
          {
            ...run,
            status: approvedNow ? "approved" : "in_review",
            submittedAt: new Date().toISOString(),
            approvalRequestId: requestId,
            approvedBy: approvedNow ? { employeeId: "", name: "Approval chain (no reviewers)" } : undefined,
            approvedAt: approvedNow ? new Date().toISOString() : undefined,
          },
          approvedNow ? "Submitted — approved automatically (no reviewers on the chain)" : "Submitted for approval",
        );
        return { ok: true };
      },

      /** A run in review whose request is gone or closed: withdraw anything open and raise a fresh one. */
      async reraiseApproval(runId: string): Promise<ActionResult> {
        const run = find(runId);
        if (!run || run.status !== "in_review") return { ok: false, reason: "Only a run awaiting approval can be re-raised." };
        cancelOpenRequests(runId);
        const requestId = await raiseApproval(run, "re-raised");
        if (!requestId) return { ok: false, reason: "No approval chain is set up for payroll runs." };
        save({ ...run, approvalRequestId: requestId }, "Re-raised approval request");
        return { ok: true };
      },

      /** Approved → Finalized. Locks the run, issues payslips, posts loan repayments and expense reimbursements. */
      finalize(runId: string): ActionResult {
        const l = live();
        const run = find(runId);
        if (!l || !run || run.status !== "approved" || !tenantId) return { ok: false, reason: "Only an approved run can be finalized." };
        if (run.stale) return { ok: false, reason: `Recalculate and re-approve first — ${run.stale.reason}.` };
        const earlier = openEarlierRuns(l.data, run);
        if (earlier.length) return { ok: false, reason: `Finalize ${earlier.map((r) => r.period.label).join(", ")} first.` };

        const now = new Date().toISOString();
        const req = run.approvalRequestId ? l.s.approvals.requests.find((r) => r.id === run.approvalRequestId) : undefined;
        const roleName = (approver: string) => l.bundle.roles.find((r) => `ROLE:${r.id}` === approver)?.name;
        const approvers = (req?.steps ?? [])
          .filter((s) => s.status === "approved" && s.resolvedEmployeeName)
          .map((s) => `${s.resolvedEmployeeName}${roleName(s.approver) ? ` (${roleName(s.approver)})` : ""}`);
        const finalized: PayrollRun = { ...run, status: "finalized", finalizedAt: now, finalizedBy: { employeeId: actor.employeeId, name: actor.name } };
        const payslips = buildPayslips({ run: finalized, bundle: l.bundle, data: l.data, status: "final", approvedBy: approvers.join(" · ") || run.approvedBy?.name || null, generatedAt: now });
        save(finalized, `Finalized — ${payslips.length} payslips issued`);
        dispatch(addPayslips({ tenantId, payslips }));

        // Loans: post each payroll deduction as a repayment on the loan record.
        const loans = new Map(resolvedLoans(l.s, l.bundle).map((x) => [x.id, x]));
        for (const re of finalized.employees) {
          for (const line of re.computation?.lines ?? []) {
            if (line.source === "loan" && line.refId) {
              const loan = loans.get(line.refId);
              if (!loan) continue;
              const repaid = Math.min(loan.amount, round2(loan.amountRepaid + line.amount));
              dispatch(updateRecord({ key: "loans", id: loan.id, patch: { amountRepaid: repaid, status: repaid >= loan.amount ? "closed" : loan.status, issuedAt: loan.issuedAt } }));
              loans.set(loan.id, { ...loan, amountRepaid: repaid });
            }
            // Expenses: mark claims paid through payroll as reimbursed, so Finance can't pay them twice.
            if (line.source === "expense" && line.refId) {
              dispatch(updateClaim({ id: line.refId, changes: { status: "reimbursed" }, actor: actor.name, logLabel: `Reimbursed through ${run.title}` }));
            }
          }
        }

        // Tell each employee their payslip is ready.
        for (const p of payslips) {
          dispatch(
            pushNotification({
              title: `Your ${p.period.label} payslip is ready`,
              description: `Net pay ${ngn(p.computation.net)}, paid ${new Date(`${p.period.payDate}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}.`,
              type: "success",
              recipientEmployeeIds: [p.employeeId],
              href: `${ESS_PAYSLIPS_HREF}/${encodeURIComponent(p.id)}`,
            }),
          );
        }

        // Later runs were calculated without this run's figures in their YTD.
        markStale(`${run.title} was finalized after it was calculated`, (r) => r.id !== run.id && r.period.year === run.period.year && periodKey(r.period) >= periodKey(run.period));
        return { ok: true };
      },

      markDisbursed(runId: string) {
        const run = find(runId);
        if (!run || run.status !== "finalized") return;
        save({ ...run, status: "disbursed", disbursedAt: new Date().toISOString() }, "Marked as paid (bank file processed)");
      },

      deleteRun(runId: string) {
        if (!tenantId) return;
        cancelOpenRequests(runId);
        dispatch(deleteRun({ tenantId, actor: actor.name, runId }));
      },

      logExport(runId: string, what: string) {
        log(`Exported ${what}`, { runId });
      },

      markRemitted(key: string, reference: string, date: string) {
        if (!tenantId) return;
        dispatch(markRemitted({ tenantId, actor: actor.name, key, reference, date }));
      },

      updateSettings(changes: Partial<PayrollSettings>) {
        if (!tenantId) return;
        dispatch(updatePayrollSettings({ tenantId, actor: actor.name, changes }));
        const calcKeys: (keyof PayrollSettings)[] = ["taxMethod", "prorationBasis", "nhisEnabled", "itfApplicable", "deductLoansViaPayroll", "payExpensesViaPayroll", "allowPayeRefunds", "employmentTypeRules", "enabledGroups", "basicMin", "basicMax", "varianceThresholdPct"];
        if (Object.keys(changes).some((k) => calcKeys.includes(k as keyof PayrollSettings))) markStale("payroll settings changed");
      },

      upsertElement(element: PayElement) {
        if (!tenantId) return;
        dispatch(upsertElement({ tenantId, actor: actor.name, element }));
      },

      /**
       * A salary change is a new structure version that waits for approval
       * (the promotion / salary change chain) before payroll uses it.
       */
      async requestSalaryChange(structure: Omit<SalaryStructure, "id" | "approvedBy" | "approvedAt" | "effectiveTo" | "status">): Promise<ActionResult> {
        const l = live();
        if (!l || !tenantId) return { ok: false, reason: "Payroll isn't loaded yet." };
        const n = l.data.structures.filter((s) => s.employeeId === structure.employeeId).length + 1;
        const id = `SS-${structure.employeeId}-${n}-${Date.now().toString(36).slice(-4)}`;
        const emp = l.bundle.employees.find((e) => e.id === structure.employeeId);
        const monthly = round2(structure.lines.reduce((s, x) => s + x.amount, 0));
        dispatch(addSalaryStructure({ tenantId, actor: actor.name, structure: { ...structure, id, effectiveTo: null, status: "pending", approvedBy: "", approvedAt: "" } }));
        try {
          await dispatch(
            submitApproval({
              documentType: SALARY_CHANGE_DOCUMENT_TYPE,
              documentId: id,
              documentTitle: `Salary change — ${emp?.fullName ?? structure.employeeId}`,
              documentSummary: `New monthly pay ${ngn(monthly)} from ${structure.effectiveFrom} · ${structure.reason}`,
              payloadSnapshot: {
                Employee: emp?.fullName ?? structure.employeeId,
                "Effective from": structure.effectiveFrom,
                "New monthly gross": ngn(monthly),
                Reason: structure.reason,
                ...Object.fromEntries(structure.lines.map((x) => [l.data.elements.find((e) => e.code === x.code)?.name ?? x.code, ngn(x.amount)])),
              },
              submitter: { employeeId: actor.employeeId, name: actor.name, initials: user?.initials ?? "HR", departmentName: user?.departmentName ?? "Human Resources" },
            }),
          ).unwrap();
        } catch {
          return { ok: false, reason: "No approval chain is set up for salary changes." };
        }
        return { ok: true };
      },

      updateTaxProfile(employeeId: string, changes: Partial<EmployeeTaxProfile>) {
        if (!tenantId) return;
        dispatch(updateTaxProfile({ tenantId, actor: actor.name, employeeId, changes }));
        markStale("an employee's tax or bank details changed", (r) => r.employees.some((e) => e.employeeId === employeeId && e.included));
      },

      addRateSet(rateSet: StatutoryRateSet) {
        if (!tenantId) return;
        dispatch(addRateSet({ tenantId, actor: actor.name, rateSet }));
        markStale("a new statutory rate set was added", (r) => r.period.end >= rateSet.effectiveFrom);
      },

      setVerificationRevoked(payslipId: string, revoked: boolean) {
        if (!tenantId) return;
        dispatch(setVerificationRevoked({ tenantId, actor: actor.name, payslipId, revoked }));
      },

      /** Drop the tenant's payroll and reseed the demo history. */
      resetDemo() {
        if (!tenantId) return;
        dispatch(resetTenantPayroll({ tenantId }));
      },
    };
  }, [tenantId, actor, user, dispatch]);
}

// ── Read helpers ────────────────────────────────────────────────────────────

export function useRun(runId: string) {
  const view = useTenantPayroll();
  const run = view.data?.runs.find((r) => r.id === runId) ?? null;
  return { ...view, run };
}

/** Final payslips for one employee, newest first. */
export function useEmployeePayslipList(employeeId: string | undefined, opts: { enabled?: boolean } = {}) {
  const view = useTenantPayroll(opts);
  const payslips = useMemo(
    () =>
      (view.data?.payslips ?? [])
        .filter((p) => p.employeeId === employeeId && p.status === "final")
        .sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month) || b.generatedAt.localeCompare(a.generatedAt)),
    [view.data, employeeId],
  );
  return { ...view, payslips };
}

export function usePayslip(payslipId: string) {
  const view = useTenantPayroll();
  const payslip = view.data?.payslips.find((p) => p.id === payslipId) ?? null;
  return { ...view, payslip };
}

/** A draft preview payslip for one employee on a run that isn't finalized yet. */
export function useDraftPayslip(runId: string, employeeId: string) {
  const { data, bundle } = useTenantPayroll();
  return useMemo(() => {
    const run = data?.runs.find((r) => r.id === runId);
    if (!run || !bundle || !data) return null;
    const re = run.employees.find((e) => e.employeeId === employeeId);
    if (!re?.computation) return null;
    return (
      buildPayslips({
        run: { ...run, employees: [re] },
        bundle,
        data,
        status: LOCKED.includes(run.status) ? "final" : "draft",
        approvedBy: run.approvedBy?.name ?? null,
        generatedAt: run.calculatedAt ?? run.createdAt,
      })[0] ?? null
    );
  }, [data, bundle, runId, employeeId]);
}

/** The last day inputs are accepted for a period (the cut-off day, clamped to the month). */
export function inputCutoffDate(period: PayPeriod, day: number): string {
  const last = Number(period.end.slice(8, 10));
  return `${period.end.slice(0, 8)}${String(Math.min(Math.max(1, day), last)).padStart(2, "0")}`;
}

export function nextPeriod(data: Pick<TenantPayroll, "runs"> | null, payDay = 25): PayPeriod {
  const regular = (data?.runs ?? []).filter((r) => r.type === "regular");
  const latest = [...regular].sort((a, b) => periodKey(b.period) - periodKey(a.period))[0];
  if (!latest) {
    const d = new Date();
    return makePeriod(d.getFullYear(), d.getMonth() + 1, payDay);
  }
  const m = latest.period.month === 12 ? 1 : latest.period.month + 1;
  const y = latest.period.month === 12 ? latest.period.year + 1 : latest.period.year;
  return makePeriod(y, m, payDay);
}
