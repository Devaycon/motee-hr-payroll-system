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
  decideAvcRequest as decideAvcRequestAction,
  submitAvcRequest as submitAvcRequestAction,
  addForecastSnapshot as addForecastSnapshotAction,
  addPlannedHire as addPlannedHireAction,
  decideBudgetVersion as decideBudgetVersionAction,
  deleteBudgetVersion as deleteBudgetVersionAction,
  markBudgetAlertSent as markBudgetAlertSentAction,
  removePlannedHire as removePlannedHireAction,
  saveBudgetVersion as saveBudgetVersionAction,
  submitBudgetVersion as submitBudgetVersionAction,
  decideScenario as decideScenarioAction,
  deleteScenario as deleteScenarioAction,
  saveScenario as saveScenarioAction,
  submitScenario as submitScenarioAction,
  addInvestigationComment,
  attachInvestigationDocument,
  openInvestigation as openInvestigationAction,
  resolveInvestigation as resolveInvestigationAction,
  signOffInvestigation as signOffInvestigationAction,
  reviewInvestigation as reviewInvestigationAction,
  updateInvestigation,
  addConfigChange,
  clearRemittance,
  decideConfigChange,
  markReminderSent,
  setPayment,
  updateRemittance,
  type RemittanceRecord,
  addPayslips,
  addRateSet,
  addSalaryStructure,
  deleteRun,
  importStarters,
  logPayroll,
  recordImportedLoanRepayment,
  removeStarterImport,
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
import { seedRemittances } from "./remittances";
import { DEMO_HMO_SETTINGS, demoHmoEnrolment } from "./hmo";
import { seedBudgets, seedInvestigations, seedScenarios } from "./seed-intelligence";
import { toBatch, withImportedStaff, type ImportCtx, type StagedRow } from "./starter-import";
import { handoverQueue, hireRefs, hrHiresFrom, joinerExceptions, stageHandover, type HrHire } from "./onboarding-handover";
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
import { diffElement, diffRateSet } from "./config";
import { salaryImpact } from "./salary-impact";
import type { RemittanceRow } from "./remittance-centre";
import { ESS_PAYSLIPS_HREF, PAYROLL_DOCUMENT_TYPE, PAYROLL_HREF, SALARY_CHANGE_DOCUMENT_TYPE } from "./constants";
import type {
  ConfigChange,
  EmployeeMode,
  PaymentBatch,
  SalaryLine,
  EmployeeTaxProfile,
  PayComputation,
  PayElement,
  PayPeriod,
  PaymentSnapshot,
  PayrollRun,
  PayrollSettings,
  Payslip,
  PayslipLine,
  PeriodInput,
  RunActor,
  SalaryStructure,
  StatutoryRateSet,
  VarianceInvestigation,
  AvcRequest,
} from "./types";
import { compareRuns, defaultPreviousRun, type ComparisonCtx } from "./comparison";
import { blockedReason, runReadiness, type Readiness } from "./readiness";
import { detectUnexplained } from "./investigation-lifecycle";
import { remittanceRows } from "./remittance-centre";
import type { SavedScenario } from "./simulation";
import { buildForecast, snapshotOf, type BudgetVersion, type ForecastSnapshot, type PlannedHire, type RequisitionRef } from "./budget";

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

/** Roles that may release payment (Finance / Payment Authoriser). System administrators get no payroll approval rights by default. */
export const PAYMENT_AUTHORISER_ROLES = ["ROLE-FIN", "ROLE-EXEC"];

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
  const settings = { ...DEFAULT_PAYROLL_SETTINGS, hmo: DEMO_HMO_SETTINGS };
  // HMO cover starts this month, so finalized history is unchanged and the open run shows it.
  const now = new Date();
  const hmoFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const base = {
    elements: SEED_PAY_ELEMENTS,
    rateSets: NG_RATE_SETS,
    settings,
    structures: bundle.employees.map((e) => seedStructure(e, settings)),
    profiles: bundle.employees.map((e, i) => ({ ...seedProfile(e), hmo: demoHmoEnrolment(i, hmoFrom) })),
  };
  const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: resolvedLoans(state, bundle), today: new Date() });
  const data = { ...base, ...history };
  // Validate the seeded draft so the Exceptions tab is populated on first open.
  const runs = history.runs.map((r) => (r.status === "draft" ? withValidation(r, data, bundle, hrHiresOf(state)) : r));
  const finance = bundle.roles.find((r) => r.id === "ROLE-FIN")?.linkedEmployeeId;
  const remitter = bundle.employees.find((e) => e.id === finance)?.fullName ?? "Finance";
  return { ...data, runs, audit: [], remittances: seedRemittances(runs, remitter, new Date().toISOString().slice(0, 10)), investigations: seedInvestigations({ ...data, runs }, bundle, new Date()), scenarios: seedScenarios({ ...data, runs }, bundle, new Date()), ...seedBudgets({ ...data, runs }, bundle, new Date()) };
}

export const INVESTIGATIONS_HREF = `${PAYROLL_HREF}/investigations`;

/** Approved, still-open requisitions in Recruitment — planned hires the forecast should include. */
export function activeRequisitions(state: RootState): RequisitionRef[] {
  return activeRequisitionsFrom(state.requisitions.byCountry[state.locale.country], state.approvals.requests);
}

export function activeRequisitionsFrom(list: RootState["requisitions"]["byCountry"][string] | undefined, requests: ApprovalRequest[]): RequisitionRef[] {
  const approved = new Set(requests.filter((r) => r.status === "approved").map((r) => r.id));
  return (list ?? [])
    .filter((r) => r.lifecycleStatus === "active" && !!r.approvalRequestId && approved.has(r.approvalRequestId))
    .map((r) => ({ id: r.id, title: r.title, department: r.department, numberOfPositions: r.numberOfPositions, salaryMin: r.salaryMin, salaryMax: r.salaryMax, startDate: r.startDate }));
}

/** Everything a run comparison needs to attribute movements to their source. */
export function comparisonCtxOf(data: TenantPayroll, bundle: LocaleBundle): ComparisonCtx {
  return {
    people: new Map(bundle.employees.map((e) => [e.id, e])),
    elements: data.elements,
    structures: data.structures,
    imports: data.imports,
    audit: data.audit,
    costCentres: new Map(bundle.departments.map((d) => [d.name, d.costCenter])),
  };
}

/**
 * The pre-payment readiness score for a run (client feedback B1). Regular
 * runs are compared with the previous regular month for the variance check;
 * remittances are those of months already finalized.
 */
export function readinessFor(data: TenantPayroll, bundle: LocaleBundle, run: PayrollRun, today = new Date().toISOString().slice(0, 10)): Readiness {
  const previous = run.type === "regular" ? defaultPreviousRun(data.runs, run) : null;
  const comparison = previous && run.calculatedAt ? compareRuns(run, previous, comparisonCtxOf(data, bundle)) : null;
  const remittances = remittanceRows(data.runs.filter((r) => r.id !== run.id), data.remittances, today);
  return runReadiness({ run, data, earlierOpen: openEarlierRuns(data, run).length, comparison, remittances });
}

/** Readiness of one run, recomputed when payroll changes. */
export function useRunReadiness(runId: string | undefined): Readiness | null {
  const { data, bundle } = useTenantPayroll({ enabled: !!runId });
  return useMemo(() => {
    const run = runId ? data?.runs.find((r) => r.id === runId) : undefined;
    if (!data || !bundle || !run) return null;
    return readinessFor(data, bundle, run);
  }, [data, bundle, runId]);
}

/** Staff the new-starter import brought onto payroll for the current tenant (not in the HR bundle). */
export function selectPayrollImportedStaff(s: RootState) {
  const tenantId = s.locale.data?.tenant.id;
  return tenantId ? s.payroll.byTenant[tenantId]?.imports?.flatMap((b) => b.employees) : undefined;
}

/** Everyone HR is onboarding or has onboarded — the joiners check and the hand-over read this. */
export function hrHiresOf(state: RootState): HrHire[] {
  return hrHiresFrom(state.onboardingRecords.records, state.onboardingRecords.cleared);
}

export function withValidation(run: PayrollRun, data: TenantPayrollData, bundle: LocaleBundle, hires: HrHire[] = []): PayrollRun {
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
    joiners: run.status === "draft" ? joinerExceptions(run, hires, new Set(bundle.employees.map((e) => e.id))) : [],
  });
  return { ...run, exceptions };
}

/** Earlier regular runs that aren't finalized yet — months must be closed in order. */
export function openEarlierRuns(data: Pick<TenantPayrollData, "runs">, run: Pick<PayrollRun, "id" | "period">): PayrollRun[] {
  return data.runs.filter((r) => r.id !== run.id && r.type === "regular" && !LOCKED.includes(r.status) && periodKey(r.period) < periodKey(run.period));
}

/** The earliest regular run before `period` that's still open — a new month can't start until it closes. */
export function openRegularRunBefore(data: Pick<TenantPayrollData, "runs"> | null, period: Pick<PayPeriod, "year" | "month">): PayrollRun | null {
  return (
    (data?.runs ?? [])
      .filter((r) => r.type === "regular" && !LOCKED.includes(r.status) && periodKey(r.period) < periodKey(period))
      .sort((a, b) => periodKey(a.period) - periodKey(b.period))[0] ?? null
  );
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
  const rawBundle = useAppSelector((s) => s.locale.data);
  const tenantId = rawBundle?.tenant.id ?? null;
  const data = useAppSelector((s) => (enabled && tenantId ? s.payroll.byTenant[tenantId] ?? null : null));
  const supported = isPayrollCountry(rawBundle);
  const imports = data?.imports;
  // Payroll works from the HR records plus anyone imported through the starter template.
  const bundle = useMemo(() => (rawBundle ? withImportedStaff(rawBundle, imports) : rawBundle), [rawBundle, imports]);

  useEffect(() => {
    if (!enabled || !rawBundle || !tenantId || data || !supported || seeding.has(tenantId)) return;
    seeding.add(tenantId);
    try {
      if (!store.getState().payroll.byTenant[tenantId]) {
        dispatch(seedTenantPayroll({ tenantId, data: buildTenantSeed(store.getState(), rawBundle) }));
      }
    } finally {
      seeding.delete(tenantId);
    }
  }, [enabled, rawBundle, tenantId, data, supported, dispatch]);

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
      const data = tenantId ? s.payroll.byTenant[tenantId] : undefined;
      const bundle = s.locale.data && data ? withImportedStaff(s.locale.data, data.imports) : null;
      return bundle && data ? { s, bundle, data, hires: hrHiresOf(s) } : null;
    };
    const find = (runId: string) => live()?.data.runs.find((r) => r.id === runId);
    const save = (run: PayrollRun, note: string) => tenantId && dispatch(saveRun({ tenantId, actor: actor.name, note, run }));
    const log = (action: string, extra: { runId?: string; employeeId?: string; detail?: string } = {}) =>
      tenantId && dispatch(logPayroll({ tenantId, actor: actor.name, action, ...extra }));

    /**
     * Re-run the checks on a draft without recalculating — used when something
     * outside payroll changes (a hire clears onboarding). Saves only on change.
     */
    function revalidate(runId: string): void {
      const l = live();
      const run = l?.data.runs.find((r) => r.id === runId);
      if (!l || !run || run.status !== "draft") return;
      const next = withValidation(run, l.data, l.bundle, l.hires);
      const key = (r: PayrollRun) => r.exceptions.map((e) => e.id).sort().join("|");
      if (key(next) !== key(run)) save(next, "Re-checked joiners from onboarding");
    }

    /** Recalculate + revalidate a draft run and save it. */
    function recalc(run: PayrollRun, note: string): PayrollRun | undefined {
      const l = live();
      if (!l) return;
      const validated = withValidation(calculateRun({ ...run, status: "draft" }, l.data, l.bundle), l.data, l.bundle, l.hires);
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
      const blocking = type === "regular" ? openRegularRunBefore(l.data, period) : null;
      if (blocking) return { reason: `Finish ${blocking.period.label} first — months are paid and closed in order.` };
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
      const validated = withValidation(run, l.data, l.bundle, l.hires);
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

    /** Adds imported people to a draft run with their period inputs (recurring deductions etc.). */
    function addStartersToRun(runId: string, employeeIds: string[]) {
      const l = live();
      const run = find(runId);
      if (!l || !run || run.status !== "draft" || !tenantId) return;
      const ids = new Set(employeeIds);
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
        id: run.id,
      });
      const have = new Set(run.employees.map((e) => e.employeeId));
      const joining = fresh.employees.filter((e) => ids.has(e.employeeId) && !have.has(e.employeeId));
      if (!joining.length) return;
      return recalc(
        {
          ...run,
          employees: [...run.employees, ...joining],
          inputs: [...run.inputs, ...fresh.inputs.filter((i) => ids.has(i.employeeId) && !have.has(i.employeeId))],
          inputNotes: [...(run.inputNotes ?? []), ...(fresh.inputNotes ?? []).filter((n) => ids.has(n.employeeId) && !have.has(n.employeeId))],
        },
        `Added ${joining.length} imported starter${joining.length === 1 ? "" : "s"}`,
      );
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

      /** Include or exclude many employees at once — one recalculation, one audit entry. */
      setIncludedMany(runId: string, employeeIds: string[], included: boolean) {
        const ids = new Set(employeeIds);
        return editDraft(runId, `${included ? "Included" : "Excluded"} ${ids.size} employee${ids.size === 1 ? "" : "s"}`, (r) => ({
          ...r,
          employees: r.employees.map((e) => (ids.has(e.employeeId) ? { ...e, included } : e)),
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
        return editDraft(runId, `Pay date set to ${payDate}`, (r) => ({ ...r, period: { ...r.period, payDate, scheduledPayDate: undefined, payDateNote: undefined } }));
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
          inputs: [...r.inputs, { ...input, id: `IN-${Date.now().toString(36)}-${r.inputs.length}`, addedBy: input.addedBy ?? actor.name, addedAt: input.addedAt ?? new Date().toISOString() }],
          employees: r.employees.map((e) => (e.employeeId === input.employeeId ? { ...e, included: true } : e)),
        }));
        return { ok: true };
      },

      /**
       * Reversal: on an adjustment run, back out everything an employee was
       * paid in the period being corrected — each earning reversed under its
       * own element, so tax and pension reverse with the same treatment.
       */
      reversePay(runId: string, employeeId: string): ActionResult {
        const l = live();
        const run = find(runId);
        if (!l || !run || run.status !== "draft" || run.type !== "adjustment" || !run.parentRunId) return { ok: false, reason: "Reversals are made on a draft adjustment run." };
        const parent = l.data.runs.find((r) => r.id === run.parentRunId);
        const paid = parent?.employees.find((e) => e.employeeId === employeeId && e.included)?.computation;
        if (!parent || !paid) return { ok: false, reason: "That employee wasn't paid in the run being corrected." };
        if (run.inputs.some((i) => i.employeeId === employeeId && i.refId === `REV:${parent.id}`)) return { ok: false, reason: "Already reversed on this run." };
        const elements = new Map(l.data.elements.map((e) => [e.code, e]));
        const inputs: PeriodInput[] = paid.lines
          .filter((x) => x.category === "earning" && x.amount > 0 && !elements.get(x.code)?.preTax)
          .map((x, i) => {
            const el = elements.get(x.code);
            const byUnits = el?.calculationType === "rate_x_units" && x.units;
            return {
              id: `IN-REV-${Date.now().toString(36)}-${i}`,
              employeeId,
              code: x.code,
              ...(byUnits ? { units: -x.units! } : { amount: -x.amount }),
              description: `Reversal of ${x.name} — ${parent.title}`,
              source: "adjustment" as const,
              refId: `REV:${parent.id}`,
            };
          });
        if (!inputs.length) return { ok: false, reason: "Nothing to reverse." };
        editDraft(runId, `Reversed ${parent.title} pay for an employee`, (r) => {
          const have = r.employees.some((e) => e.employeeId === employeeId);
          return {
            ...r,
            inputs: [...r.inputs, ...inputs],
            employees: have
              ? r.employees.map((e) => (e.employeeId === employeeId ? { ...e, included: true } : e))
              : [...r.employees, { employeeId, included: true, mode: "auto" as const, computation: null, attendance: { workingDays: 0, daysWorked: 0, paidLeaveDays: 0, unpaidLeaveDays: 0, overtimeHours: 0 } }],
          };
        });
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
        // Hard block (B1): no submission while a critical compliance or payment check has failed.
        const readiness = readinessFor(l.data, l.bundle, run);
        if (readiness.blocked) return { ok: false, reason: blockedReason(readiness, "submission") };
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
        // Re-checked at the last gate: something may have changed since approval.
        const readiness = readinessFor(l.data, l.bundle, run);
        if (readiness.blocked) return { ok: false, reason: blockedReason(readiness, "finalizing") };

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
        if (finalized.type === "regular") {
          const after = live();
          const f = after ? buildForecast({ data: after.data, bundle: after.bundle, requisitions: activeRequisitions(after.s), alertPct: after.data.settings.budgetAlertPct }) : null;
          if (f) dispatch(addForecastSnapshotAction({ tenantId, snapshot: snapshotOf(f, "month_closed", actor.name) }));
        }

        // Loans: post each payroll deduction as a repayment on the loan record.
        const loans = new Map(resolvedLoans(l.s, l.bundle).map((x) => [x.id, x]));
        // Loans brought forward by the starter import live in payroll, not in the HR loan records.
        const importedLoans = new Set((l.data.imports ?? []).flatMap((b) => (b.loans ?? []).map((x) => x.id)));
        for (const re of finalized.employees) {
          for (const line of re.computation?.lines ?? []) {
            if (line.source === "loan" && line.refId) {
              const loan = loans.get(line.refId);
              if (!loan) continue;
              const repaid = Math.min(loan.amount, round2(loan.amountRepaid + line.amount));
              if (importedLoans.has(loan.id)) dispatch(recordImportedLoanRepayment({ tenantId, loanId: loan.id, amountRepaid: repaid }));
              else dispatch(updateRecord({ key: "loans", id: loan.id, patch: { amountRepaid: repaid, status: repaid >= loan.amount ? "closed" : loan.status, issuedAt: loan.issuedAt } }));
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

      // ── Voluntary pension requests ──────────────────────────────────────────

      /** The signed-in employee asks to start, change or stop their AVC. HR and Payroll are notified. */
      requestAvcChange(input: Pick<AvcRequest, "action" | "mode" | "value" | "effectiveFrom" | "note">): ActionResult {
        const l = live();
        if (!tenantId || !l || !actor.employeeId) return { ok: false, reason: "Sign in as an employee to make a request." };
        if (input.action === "set" && !(input.value > 0)) return { ok: false, reason: "Enter the amount or percentage." };
        const now = new Date().toISOString();
        const request: AvcRequest = {
          ...input,
          id: `AVC-${Date.now().toString(36).toUpperCase()}`,
          employeeId: actor.employeeId,
          employeeName: actor.name,
          mandate: { reference: `MANDATE-${actor.employeeId}-${now.slice(0, 10)}`, signedOn: now.slice(0, 10) },
          requestedAt: now,
          status: "pending",
        };
        dispatch(submitAvcRequestAction({ tenantId, actor: actor.name, request }));
        dispatch(
          pushNotification({
            title: `Voluntary pension request from ${actor.name}`,
            description: input.action === "stop" ? `Stop from ${input.effectiveFrom}.` : `${input.mode === "percent" ? `${input.value}% of pensionable pay` : ngn(input.value)} a month from ${input.effectiveFrom}.`,
            type: "info",
            recipientRoleIds: ["ROLE-HRADMIN", "ROLE-FIN"],
            href: `${PAYROLL_HREF}/settings?tab=profiles`,
          }),
        );
        return { ok: true };
      },

      decideAvcRequest(id: string, approved: boolean, note?: string): ActionResult {
        const l = live();
        const r = l?.data.avcRequests?.find((x) => x.id === id);
        if (!tenantId || !r) return { ok: false, reason: "Request not found." };
        if (r.employeeId === actor.employeeId) return { ok: false, reason: "You can't approve your own request." };
        if (!approved && !note?.trim()) return { ok: false, reason: "Give a reason for rejecting it." };
        dispatch(decideAvcRequestAction({ tenantId, actor: actor.name, actorId: actor.employeeId, id, approved, note }));
        if (approved) markStale("an employee's voluntary pension changed", (run) => run.employees.some((e) => e.employeeId === r.employeeId && e.included) && run.period.end >= r.effectiveFrom);
        dispatch(
          pushNotification({
            title: approved ? "Your voluntary pension request was approved" : "Your voluntary pension request was not approved",
            description: approved ? (r.action === "stop" ? `It stops from ${r.effectiveFrom}.` : `It starts from ${r.effectiveFrom} and is relieved from PAYE.`) : note ?? "",
            type: approved ? "success" : "warning",
            recipientEmployeeIds: [r.employeeId],
            href: ESS_PAYSLIPS_HREF,
          }),
        );
        return { ok: true };
      },

      // ── Budget & forecasting ────────────────────────────────────────────────

      saveBudgetVersion(version: BudgetVersion) {
        if (tenantId) dispatch(saveBudgetVersionAction({ tenantId, actor: actor.name, version }));
      },

      submitBudgetVersion(id: string) {
        if (!tenantId) return;
        dispatch(submitBudgetVersionAction({ tenantId, actor: actor.name, actorId: actor.employeeId, id }));
        const v = live()?.data.budgets?.find((x) => x.id === id);
        dispatch(pushNotification({ title: `Payroll budget to approve: ${v?.name ?? id}`, description: `${actor.name} submitted it. A second person must approve it.`, type: "info", recipientRoleIds: ["ROLE-FIN", "ROLE-EXEC"], href: `${PAYROLL_HREF}/budget/edit?version=${id}` }));
      },

      decideBudgetVersion(id: string, approved: boolean, note?: string): ActionResult {
        const v = live()?.data.budgets?.find((x) => x.id === id);
        if (!tenantId || !v) return { ok: false, reason: "Budget not found." };
        if (v.status !== "submitted") return { ok: false, reason: "Only a submitted budget can be approved." };
        if (v.submittedBy === actor.name || (v.submittedById && v.submittedById === actor.employeeId)) return { ok: false, reason: "You submitted this budget, so another person must approve it." };
        dispatch(decideBudgetVersionAction({ tenantId, actor: actor.name, actorId: actor.employeeId, id, approved, note }));
        if (v.createdById) dispatch(pushNotification({ title: approved ? `Payroll budget approved: ${v.name}` : `Payroll budget returned: ${v.name}`, description: approved ? `Approved by ${actor.name}.` : `${actor.name}: ${note ?? ""}`, type: approved ? "success" : "warning", recipientEmployeeIds: [v.createdById], href: `${PAYROLL_HREF}/budget/edit?version=${id}` }));
        return { ok: true };
      },

      deleteBudgetVersion(id: string) {
        if (tenantId) dispatch(deleteBudgetVersionAction({ tenantId, actor: actor.name, id }));
      },

      addPlannedHire(hire: Omit<PlannedHire, "id" | "addedBy" | "addedAt">) {
        if (tenantId) dispatch(addPlannedHireAction({ tenantId, actor: actor.name, hire: { ...hire, id: `PH-${Date.now().toString(36)}`, addedBy: actor.name, addedAt: new Date().toISOString() } }));
      },

      removePlannedHire(id: string) {
        if (tenantId) dispatch(removePlannedHireAction({ tenantId, actor: actor.name, id }));
      },

      /** Freeze the current forecast for later comparison. */
      takeForecastSnapshot(trigger: ForecastSnapshot["trigger"] = "manual"): boolean {
        const l = live();
        if (!tenantId || !l) return false;
        const f = buildForecast({ data: l.data, bundle: l.bundle, requisitions: activeRequisitions(l.s), alertPct: l.data.settings.budgetAlertPct });
        if (!f) return false;
        dispatch(addForecastSnapshotAction({ tenantId, snapshot: snapshotOf(f, trigger, actor.name) }));
        return true;
      },

      /** Alert department heads and Finance, once per breach, when a department is forecast over budget. */
      sendBudgetAlerts(alerts: { key: string; department: string; variance: number; variancePct: number }[]) {
        const l = live();
        if (!tenantId || !l) return;
        for (const a of alerts) {
          if (l.data.budgetAlertsSent?.[a.key]) continue;
          const head = l.bundle.departments.find((d) => d.name === a.department)?.headEmployeeId;
          dispatch(
            pushNotification({
              title: `${a.department} is forecast over its payroll budget`,
              description: `Projected ${ngn(a.variance)} (${a.variancePct.toFixed(1)}%) over budget for the year. Review the drivers in Budget & Forecasting.`,
              type: "warning",
              recipientRoleIds: ["ROLE-FIN", "ROLE-HRADMIN"],
              recipientEmployeeIds: head ? [head] : undefined,
              href: `${PAYROLL_HREF}/budget?department=${encodeURIComponent(a.department)}`,
            }),
          );
          dispatch(markBudgetAlertSentAction({ tenantId, key: a.key }));
        }
      },

      // ── Saved simulation scenarios ──────────────────────────────────────────

      /** Save (create or update) a scenario. Returns its id. */
      saveScenario(input: Pick<SavedScenario, "name" | "description" | "scenario" | "baseRunId" | "snapshot"> & { id?: string }): string | null {
        if (!tenantId) return null;
        const now = new Date().toISOString();
        const prev = input.id ? live()?.data.scenarios?.find((x) => x.id === input.id) : undefined;
        const id = prev?.id ?? `SCN-${Date.now().toString(36).toUpperCase()}`;
        const scenario: SavedScenario = {
          id,
          name: input.name.trim() || "Untitled scenario",
          description: input.description,
          scenario: input.scenario,
          baseRunId: input.baseRunId,
          snapshot: input.snapshot,
          createdBy: prev?.createdBy ?? actor.name,
          createdById: prev?.createdById ?? actor.employeeId,
          createdAt: prev?.createdAt ?? now,
          updatedAt: now,
          status: "draft",
          history: prev?.history ?? [],
        };
        dispatch(saveScenarioAction({ tenantId, actor: actor.name, scenario }));
        return id;
      },

      deleteScenario(id: string) {
        if (tenantId) dispatch(deleteScenarioAction({ tenantId, actor: actor.name, id }));
      },

      /** Send a scenario for management review; Finance and the Executive are notified. */
      submitScenario(id: string, note?: string) {
        if (!tenantId) return;
        dispatch(submitScenarioAction({ tenantId, actor: actor.name, actorId: actor.employeeId, id, note }));
        const sc = live()?.data.scenarios?.find((x) => x.id === id);
        dispatch(
          pushNotification({
            title: `Payroll scenario for review: ${sc?.name ?? id}`,
            description: `${actor.name} submitted a simulation for management review. It is not committed to payroll.`,
            type: "info",
            recipientRoleIds: ["ROLE-FIN", "ROLE-EXEC"],
            href: `${PAYROLL_HREF}/simulate?scenario=${id}`,
          }),
        );
      },

      /** Approve for planning or reject. The person who submitted it cannot decide it. */
      decideScenario(id: string, approved: boolean, note?: string): ActionResult {
        const sc = live()?.data.scenarios?.find((x) => x.id === id);
        if (!tenantId || !sc) return { ok: false, reason: "Scenario not found." };
        if (sc.status !== "submitted") return { ok: false, reason: "Only a submitted scenario can be reviewed." };
        if (sc.submittedBy === actor.name || (sc.submittedById && sc.submittedById === actor.employeeId)) return { ok: false, reason: "You submitted this scenario, so another person must review it." };
        if (!approved && !note?.trim()) return { ok: false, reason: "Give a reason for rejecting it." };
        dispatch(decideScenarioAction({ tenantId, actor: actor.name, actorId: actor.employeeId, id, approved, note }));
        if (sc.createdById) {
          dispatch(
            pushNotification({
              title: approved ? `Scenario approved for planning: ${sc.name}` : `Scenario rejected: ${sc.name}`,
              description: approved ? `${actor.name} approved it for planning. Live payroll is unchanged.` : `${actor.name}: ${note}`,
              type: approved ? "success" : "warning",
              recipientEmployeeIds: [sc.createdById],
              href: `${PAYROLL_HREF}/simulate?scenario=${id}`,
            }),
          );
        }
        return { ok: true };
      },

      // ── Variance investigations ───────────────────────────────────────────

      /** Raise an investigation on a payroll movement and tell the owner. Returns its id. */
      openInvestigation(input: Pick<VarianceInvestigation, "runId" | "previousRunId" | "periodLabel" | "employeeId" | "employeeName" | "reason" | "amount" | "title" | "finding" | "ownerId" | "ownerName" | "dueDate">): string | null {
        if (!tenantId) return null;
        const now = new Date().toISOString();
        const id = `INV-${Date.now().toString(36).toUpperCase()}`;
        const investigation: VarianceInvestigation = {
          ...input,
          id,
          status: "open",
          createdBy: actor.name,
          createdById: actor.employeeId,
          createdAt: now,
          comments: [],
          documents: [],
          history: [{ at: now, actor: actor.name, action: `Opened and assigned to ${input.ownerName}`, note: input.finding }],
        };
        dispatch(openInvestigationAction({ tenantId, actor: actor.name, investigation }));
        if (input.ownerId && input.ownerId !== actor.employeeId) {
          dispatch(
            pushNotification({
              title: `Payroll variance assigned to you: ${input.title}`,
              description: `${input.periodLabel} · ${ngn(input.amount)} — raised by ${actor.name}.`,
              type: "warning",
              recipientEmployeeIds: [input.ownerId],
              href: `${INVESTIGATIONS_HREF}/${id}`,
            }),
          );
        }
        return id;
      },

      /** Stage 2: record what the originating transaction shows. */
      reviewInvestigation(id: string, note: string): ActionResult {
        if (!tenantId) return { ok: false, reason: "No tenant." };
        if (!note.trim()) return { ok: false, reason: "Say what you found in the originating transaction." };
        dispatch(reviewInvestigationAction({ tenantId, actor: actor.name, actorId: actor.employeeId, id, note }));
        return { ok: true };
      },

      /**
       * Stage 1, automatic: raise an unassigned case for every employee whose
       * movement no record explains. Returns how many were raised.
       */
      detectUnexplainedMovements(runId: string): number {
        const l = live();
        const run = l?.data.runs.find((r) => r.id === runId);
        if (!l || !run || !tenantId || run.type !== "regular" || !run.calculatedAt) return 0;
        const previous = defaultPreviousRun(l.data.runs, run);
        if (!previous) return 0;
        const found = detectUnexplained(compareRuns(run, previous, comparisonCtxOf(l.data, l.bundle)), l.data.investigations ?? []);
        const now = new Date().toISOString();
        found.forEach((f, i) => {
          const investigation: VarianceInvestigation = {
            ...f,
            id: `INV-${Date.now().toString(36).toUpperCase()}${i}`,
            status: "open",
            ownerId: "",
            ownerName: "",
            createdBy: "MOTEE",
            createdAt: now,
            comments: [],
            documents: [],
            history: [{ at: now, actor: "MOTEE", action: "Detected an unexplained movement", note: f.finding }],
          };
          dispatch(openInvestigationAction({ tenantId, actor: "MOTEE", investigation }));
        });
        if (found.length) {
          dispatch(
            pushNotification({
              title: `${found.length} unexplained payroll movement${found.length === 1 ? "" : "s"} detected`,
              description: `${run.period.label}: cases opened in the investigations register — review and assign them.`,
              type: "warning",
              recipientRoleIds: ["ROLE-HRADMIN", "ROLE-FIN"],
              href: `${INVESTIGATIONS_HREF}?run=${runId}`,
            }),
          );
        }
        return found.length;
      },

      assignInvestigation(id: string, ownerId: string, ownerName: string) {
        if (!tenantId) return;
        const had = !!live()?.data.investigations?.find((x) => x.id === id)?.ownerId;
        dispatch(updateInvestigation({ tenantId, actor: actor.name, id, patch: { ownerId, ownerName }, note: `${had ? "Reassigned" : "Assigned"} to ${ownerName}` }));
        if (ownerId !== actor.employeeId) {
          dispatch(pushNotification({ title: "Payroll variance investigation assigned to you", description: `${id} — reassigned by ${actor.name}.`, type: "warning", recipientEmployeeIds: [ownerId], href: `${INVESTIGATIONS_HREF}/${id}` }));
        }
      },

      setInvestigationStatus(id: string, status: "open" | "investigating") {
        if (!tenantId) return;
        dispatch(updateInvestigation({ tenantId, actor: actor.name, id, patch: { status }, note: status === "investigating" ? "Moved to Under investigation" : "Moved back to Open" }));
      },

      commentOnInvestigation(id: string, text: string) {
        if (!tenantId || !text.trim()) return;
        dispatch(addInvestigationComment({ tenantId, actor: actor.name, id, commentId: `C-${Date.now().toString(36)}`, text }));
        const inv = live()?.data.investigations?.find((x) => x.id === id);
        const to = [inv?.ownerId, inv?.createdById].filter((x): x is string => !!x && x !== actor.employeeId);
        if (inv && to.length) {
          dispatch(pushNotification({ title: `New comment on ${inv.title}`, description: `${actor.name}: ${text.trim().slice(0, 120)}`, type: "info", recipientEmployeeIds: [...new Set(to)], href: `${INVESTIGATIONS_HREF}/${id}` }));
        }
      },

      attachToInvestigation(id: string, file: { fileName: string; dataUrl?: string }) {
        if (!tenantId) return;
        dispatch(attachInvestigationDocument({ tenantId, actor: actor.name, id, document: { id: `D-${Date.now().toString(36)}`, fileName: file.fileName, dataUrl: file.dataUrl, uploadedAt: new Date().toISOString(), uploadedBy: actor.name } }));
      },

      /** Record the finding; Finance (and whoever raised it) is asked to sign it off. */
      resolveInvestigation(id: string, note: string, outcome: "legitimate" | "error"): ActionResult {
        if (!tenantId) return { ok: false, reason: "No tenant." };
        if (!live()?.data.investigations?.find((x) => x.id === id)?.ownerId) return { ok: false, reason: "Assign the case to a responsible person first." };
        if (!note.trim()) return { ok: false, reason: "Write a resolution note first." };
        dispatch(resolveInvestigationAction({ tenantId, actor: actor.name, actorId: actor.employeeId, id, note, outcome }));
        const inv = live()?.data.investigations?.find((x) => x.id === id);
        dispatch(
          pushNotification({
            title: `Sign-off needed: ${inv?.title ?? id}`,
            description: `${actor.name} resolved it as ${outcome === "legitimate" ? "a legitimate movement" : "a payroll error"}. A second person must sign it off.`,
            type: "info",
            recipientRoleIds: ["ROLE-FIN"],
            recipientEmployeeIds: inv?.createdById && inv.createdById !== actor.employeeId ? [inv.createdById] : undefined,
            href: `${INVESTIGATIONS_HREF}/${id}`,
          }),
        );
        return { ok: true };
      },

      /** Accept or reopen a resolution. The person who resolved it cannot sign it off. */
      signOffInvestigation(id: string, decision: "accepted" | "reopened", note?: string): ActionResult {
        const inv = live()?.data.investigations?.find((x) => x.id === id);
        if (!tenantId || !inv) return { ok: false, reason: "Investigation not found." };
        if (inv.status !== "resolved") return { ok: false, reason: "Only a resolved investigation can be signed off." };
        if (inv.resolvedBy === actor.name || (inv.resolvedById && inv.resolvedById === actor.employeeId)) return { ok: false, reason: "You resolved this investigation, so another person must sign it off." };
        if (decision === "reopened" && !note?.trim()) return { ok: false, reason: "Give a reason for reopening it." };
        dispatch(signOffInvestigationAction({ tenantId, actor: actor.name, actorId: actor.employeeId, id, decision, note }));
        dispatch(
          pushNotification({
            title: decision === "accepted" ? `Resolution signed off: ${inv.title}` : `Investigation reopened: ${inv.title}`,
            description: decision === "accepted" ? `Signed off by ${actor.name}.` : `${actor.name}: ${note}`,
            type: decision === "accepted" ? "success" : "warning",
            recipientEmployeeIds: [inv.ownerId],
            href: `${INVESTIGATIONS_HREF}/${id}`,
          }),
        );
        return { ok: true };
      },

      /** Re-notifies the employee that an issued payslip is ready (demo: in-app notification). */
      resendPayslip(p: Payslip) {
        dispatch(
          pushNotification({
            title: `Your ${p.period.label} payslip has been resent`,
            description: `Net pay ${ngn(p.computation.net)} · ${p.reference}.`,
            type: "info",
            recipientEmployeeIds: [p.employeeId],
            href: `${ESS_PAYSLIPS_HREF}/${encodeURIComponent(p.id)}`,
          }),
        );
        log("Resent payslip", { runId: p.runId, employeeId: p.employeeId, detail: `${p.reference} to ${p.employee.email || p.employee.fullName}` });
      },

      markRemitted(key: string, reference: string, date: string) {
        if (!tenantId) return;
        dispatch(markRemitted({ tenantId, actor: actor.name, key, reference, date }));
      },

      /**
       * Change settings. Calculation settings apply from `effectiveFrom`
       * (default: the earliest open pay period), so finalized history and
       * any re-run of an earlier month keep the rules they were paid under.
       */
      updateSettings(changes: Partial<PayrollSettings>, opts: { effectiveFrom?: string } = {}) {
        if (!tenantId) return;
        const l = live();
        const effectiveFrom = opts.effectiveFrom ?? (l ? earliestOpenRun(l.data)?.period.start : undefined) ?? new Date().toISOString().slice(0, 10);
        dispatch(updatePayrollSettings({ tenantId, actor: actor.name, actorId: actor.employeeId, changes, effectiveFrom }));
        const calcKeys: (keyof PayrollSettings)[] = ["taxMethod", "prorationBasis", "nhisEnabled", "nhfBasis", "groupLife", "itfApplicable", "deductLoansViaPayroll", "payExpensesViaPayroll", "allowPayeRefunds", "employmentTypeRules", "enabledGroups", "basicMin", "basicMax", "varianceThresholdPct", "leaveAllowance", "hmo"];
        if (Object.keys(changes).some((k) => calcKeys.includes(k as keyof PayrollSettings))) markStale("payroll settings changed", (r) => r.period.end >= effectiveFrom);
      },

      /**
       * Add or change a pay element from `effectiveFrom`. Elements marked
       * "second approver" (and every change to one) wait for another payroll
       * settings user to approve; the rest apply at once and are logged.
       */
      upsertElement(element: PayElement, opts: { effectiveFrom?: string } = {}): { pending: boolean } {
        const l = live();
        if (!tenantId || !l) return { pending: false };
        const before = l.data.elements.find((e) => e.code === element.code) ?? null;
        const effectiveFrom = opts.effectiveFrom ?? element.effectiveFrom ?? earliestOpenRun(l.data)?.period.start ?? new Date().toISOString().slice(0, 10);
        const needsSecond = element.approval === "two_person" || before?.approval === "two_person";
        const now = new Date().toISOString();
        const change: ConfigChange = {
          id: `CFG-${Date.now().toString(36)}`,
          area: "element",
          target: element.code,
          summary: `${before ? "Changed" : "New"} pay element ${element.code} — ${element.name}`,
          changes: diffElement(before, element),
          effectiveFrom,
          requestedBy: actor.name,
          requestedById: actor.employeeId,
          requestedAt: now,
          status: needsSecond ? "pending" : "applied",
          ...(needsSecond ? { payload: { element } } : { approvedBy: actor.name, approvedAt: now, approvalNote: "Applied by a payroll settings administrator" }),
        };
        dispatch(addConfigChange({ tenantId, change }));
        if (!needsSecond) {
          dispatch(upsertElement({ tenantId, actor: actor.name, element, effectiveFrom }));
          markStale(`pay element ${element.code} changed`, (r) => r.period.end >= effectiveFrom);
        }
        return { pending: needsSecond };
      },

      /** Approve or reject someone else's pending configuration change. Approving applies it. */
      decideConfigChange(id: string, approved: boolean, note?: string): ActionResult {
        const l = live();
        const c = l?.data.configChanges?.find((x) => x.id === id);
        if (!tenantId || !l || !c || c.status !== "pending") return { ok: false, reason: "That change is no longer waiting for approval." };
        if (c.requestedBy === actor.name || (c.requestedById && c.requestedById === actor.employeeId)) return { ok: false, reason: "A second person must approve a change you made." };
        dispatch(decideConfigChange({ tenantId, actor: actor.name, actorId: actor.employeeId, id, approved, note }));
        if (!approved) return { ok: true };
        if (c.payload?.element) {
          dispatch(upsertElement({ tenantId, actor: actor.name, element: c.payload.element, effectiveFrom: c.effectiveFrom }));
          markStale(`pay element ${c.payload.element.code} changed`, (r) => r.period.end >= c.effectiveFrom);
        }
        if (c.payload?.rateSet) {
          dispatch(addRateSet({ tenantId, actor: actor.name, rateSet: { ...c.payload.rateSet, createdBy: `${c.requestedBy} · approved by ${actor.name}` } }));
          markStale("a new statutory rate set was approved", (r) => r.period.end >= c.effectiveFrom);
        }
        return { ok: true };
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
        const impact = structure.impact ?? (emp ? salaryImpact(l.data, emp, structure.lines, structure.effectiveFrom) : undefined);
        const diff = (k: "gross" | "net" | "paye" | "employerCost") => (impact ? `${ngn(impact.before[k])} → ${ngn(impact.after[k])}` : "—");
        dispatch(
          addSalaryStructure({
            tenantId,
            actor: actor.name,
            structure: { ...structure, id, effectiveTo: null, status: "pending", approvedBy: "", approvedAt: "", proposedBy: actor.name, proposedAt: new Date().toISOString(), impact },
          }),
        );
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
                "Gross pay (monthly)": diff("gross"),
                "PAYE (monthly)": diff("paye"),
                "Net pay (monthly)": diff("net"),
                "Cost to employer (monthly)": diff("employerCost"),
                ...(structure.evidence ? { "Supporting evidence": structure.evidence.fileName } : {}),
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

      /** A new statutory rate set. Statutory changes always need a second person to approve. */
      addRateSet(rateSet: StatutoryRateSet) {
        const l = live();
        if (!tenantId || !l) return;
        const before = [...l.data.rateSets].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
        dispatch(
          addConfigChange({
            tenantId,
            change: {
              id: `CFG-${Date.now().toString(36)}`,
              area: "rate_set",
              target: rateSet.id,
              summary: `New statutory rate set — ${rateSet.label}`,
              changes: diffRateSet(before, rateSet),
              effectiveFrom: rateSet.effectiveFrom,
              requestedBy: actor.name,
              requestedById: actor.employeeId,
              requestedAt: new Date().toISOString(),
              status: "pending",
              payload: { rateSet },
            },
          }),
        );
      },

      /**
       * A bulk salary review (annual review, promotions, restructuring): one
       * new structure version per employee, all approved together through a
       * single salary change request.
       */
      async requestBulkSalaryChange(args: {
        items: { employeeId: string; lines: SalaryLine[] }[];
        effectiveFrom: string;
        reason: string;
        evidence?: { fileName: string; uploadedAt: string } | null;
      }): Promise<ActionResult> {
        const l = live();
        if (!l || !tenantId) return { ok: false, reason: "Payroll isn't loaded yet." };
        if (!args.items.length) return { ok: false, reason: "Nobody is selected." };
        const batchId = `SSB-${Date.now().toString(36).toUpperCase()}`;
        const people = new Map(l.bundle.employees.map((e) => [e.id, e]));
        let before = 0, after = 0, costBefore = 0, costAfter = 0;
        args.items.forEach((it, i) => {
          const emp = people.get(it.employeeId);
          const cur = l.data.structures.filter((s) => s.employeeId === it.employeeId);
          const impact = emp ? salaryImpact(l.data, emp, it.lines, args.effectiveFrom) : undefined;
          before += impact?.before.gross ?? 0;
          after += impact?.after.gross ?? 0;
          costBefore += impact?.before.employerCost ?? 0;
          costAfter += impact?.after.employerCost ?? 0;
          dispatch(
            addSalaryStructure({
              tenantId,
              actor: actor.name,
              structure: {
                id: `SS-${it.employeeId}-${cur.length + 1}-${batchId.slice(-4)}${i}`,
                employeeId: it.employeeId,
                effectiveFrom: args.effectiveFrom,
                effectiveTo: null,
                currency: cur[0]?.currency ?? "NGN",
                lines: it.lines,
                reason: args.reason,
                approvedBy: "",
                approvedAt: "",
                status: "pending",
                proposedBy: actor.name,
                proposedAt: new Date().toISOString(),
                evidence: args.evidence ?? null,
                impact,
                batchId,
              },
            }),
          );
        });
        try {
          await dispatch(
            submitApproval({
              documentType: SALARY_CHANGE_DOCUMENT_TYPE,
              documentId: batchId,
              documentTitle: `Salary review — ${args.items.length} employee${args.items.length === 1 ? "" : "s"}`,
              documentSummary: `${args.reason} · effective ${args.effectiveFrom} · monthly gross ${ngn(before)} → ${ngn(after)}`,
              payloadSnapshot: {
                Employees: args.items.length,
                "Effective from": args.effectiveFrom,
                Reason: args.reason,
                "Monthly gross": `${ngn(before)} → ${ngn(after)}`,
                "Monthly increase": ngn(round2(after - before)),
                "Monthly cost to employer": `${ngn(costBefore)} → ${ngn(costAfter)}`,
                "Annual cost increase": ngn(round2((costAfter - costBefore) * 12)),
                ...(args.evidence ? { "Supporting evidence": args.evidence.fileName } : {}),
              },
              submitter: { employeeId: actor.employeeId, name: actor.name, initials: user?.initials ?? "HR", departmentName: user?.departmentName ?? "Human Resources" },
            }),
          ).unwrap();
        } catch {
          return { ok: false, reason: "No approval chain is set up for salary changes." };
        }
        log("Bulk salary review sent for approval", { detail: `${batchId} · ${args.items.length} employees · ${args.reason}` });
        return { ok: true };
      },

      // ── Statutory remittances ─────────────────────────────────────────────

      /** Payment instruction sent to the bank / authority (not yet confirmed). */
      submitRemittance(key: string, reference: string, date: string) {
        if (!tenantId) return;
        dispatch(updateRemittance({ tenantId, actor: actor.name, key, note: "Remittance payment instruction sent", patch: { status: "submitted", reference, date, submittedAt: new Date().toISOString(), by: actor.name, at: new Date().toISOString() } }));
      },

      /** Payment confirmed: reference, date, amount actually paid and the evidence (bank receipt or acknowledgement) — required. */
      recordRemittancePayment(key: string, p: { reference: string; date: string; amountPaid: number; receipt?: RemittanceRecord["receipt"]; note?: string }): ActionResult {
        if (!p.receipt) return { ok: false, reason: "Attach the bank receipt or the authority's acknowledgement — a payment can't be recorded without evidence." };
        if (p.reference.trim().length < 3) return { ok: false, reason: "Enter the payment reference." };
        if (!tenantId) return { ok: false, reason: "No tenant." };
        dispatch(updateRemittance({ tenantId, actor: actor.name, key, note: "Recorded statutory remittance payment", patch: { status: "paid", reference: p.reference, date: p.date, amountPaid: p.amountPaid, receipt: p.receipt ?? null, note: p.note, by: actor.name, at: new Date().toISOString() } }));
        return { ok: true };
      },

      attachRemittanceReceipt(key: string, receipt: NonNullable<RemittanceRecord["receipt"]>) {
        if (!tenantId) return;
        dispatch(updateRemittance({ tenantId, actor: actor.name, key, note: "Uploaded remittance receipt", patch: { receipt } }));
      },

      /** Match the amount paid against the liability. Needs the receipt and a full payment. */
      reconcileRemittance(row: RemittanceRow): ActionResult {
        if (!tenantId) return { ok: false, reason: "Payroll isn't loaded yet." };
        if (!row.record || row.record.status === "submitted") return { ok: false, reason: "Record the payment first." };
        if (!row.record.receipt) return { ok: false, reason: "Upload the bank receipt or authority acknowledgement first." };
        if (row.outstanding > 0.5) return { ok: false, reason: `₦${row.outstanding.toLocaleString("en-NG")} is still outstanding — record the balance before reconciling.` };
        dispatch(updateRemittance({ tenantId, actor: actor.name, key: row.key, note: "Remittance reconciled", patch: { status: "reconciled", reconciledBy: actor.name, reconciledAt: new Date().toISOString() } }));
        return { ok: true };
      },

      clearRemittance(key: string) {
        if (!tenantId) return;
        dispatch(clearRemittance({ tenantId, actor: actor.name, key }));
      },

      /** Remind payroll and finance users of upcoming and overdue remittances (once per stage). */
      sendRemittanceReminders(due: { key: string; row: RemittanceRow; stage: "upcoming" | "today" | "overdue" | "escalated" }[]) {
        if (!tenantId) return;
        for (const { key, row, stage } of due) {
          dispatch(
            pushNotification({
              title:
                stage === "escalated"
                  ? `Escalated: ${row.title} for ${row.monthLabel} is ${-row.daysToDue} days overdue`
                  : stage === "overdue"
                    ? `Overdue: ${row.title} for ${row.monthLabel}`
                    : stage === "today"
                      ? `Due today: ${row.title} for ${row.monthLabel}`
                      : `${row.title} due in ${row.daysToDue} day${row.daysToDue === 1 ? "" : "s"}`,
              description: `${ngn(row.outstanding)} to ${row.to} — due ${row.due}.${stage === "escalated" ? " Late statutory payments attract penalties and interest." : ""}`,
              type: stage === "overdue" || stage === "escalated" ? "warning" : "info",
              // Missed deadlines escalate to the Executive as well.
              recipientRoleIds: stage === "escalated" ? ["ROLE-HRADMIN", "ROLE-FIN", "ROLE-EXEC"] : ["ROLE-HRADMIN", "ROLE-FIN"],
              href: `${PAYROLL_HREF}?tab=remittances`,
            }),
          );
          dispatch(markReminderSent({ tenantId, key }));
        }
      },

      // ── Payment release ───────────────────────────────────────────────────

      /**
       * Payment authorisation: a Finance / Payment Authoriser who neither
       * prepared, submitted, finalized nor approved the run releases the money.
       */
      authorisePayment(runId: string): ActionResult {
        const l = live();
        const run = find(runId);
        if (!l || !run || !tenantId || run.status !== "finalized") return { ok: false, reason: "Only a finalized run can be released for payment." };
        if (!actor.employeeId) return { ok: false, reason: "Sign in with an employee account to authorise payment." };
        if (!PAYMENT_AUTHORISER_ROLES.includes(actor.roleId ?? "")) return { ok: false, reason: "Only a Finance / Payment Authoriser can release payment." };
        const req = run.approvalRequestId ? l.s.approvals.requests.find((r) => r.id === run.approvalRequestId) : undefined;
        const approvers = new Set((req?.history ?? []).filter((h) => h.type === "approved").map((h) => h.actorEmployeeId));
        if (run.approvedBy?.employeeId) approvers.add(run.approvedBy.employeeId);
        const conflicted = [run.preparedBy.employeeId, run.finalizedBy?.employeeId, req?.submittedBy.employeeId].includes(actor.employeeId) || approvers.has(actor.employeeId);
        if (conflicted) return { ok: false, reason: "You prepared or approved this run — someone else must release the payment (segregation of duties)." };
        const payable = run.employees.filter((e) => e.included && e.computation && e.computation.net > 0);
        const payment: PaymentBatch = {
          status: "authorised",
          amount: round2(payable.reduce((s, e) => s + e.computation!.net, 0)),
          count: payable.length,
          authorisedBy: { employeeId: actor.employeeId, name: actor.name },
          authorisedAt: new Date().toISOString(),
          results: {},
        };
        dispatch(setPayment({ tenantId, actor: actor.name, runId, payment, note: `Payment batch authorised — ${ngn(payment.amount)} to ${payment.count} accounts` }));
        return { ok: true };
      },

      /** The NIBSS file was sent to the bank. */
      submitPayment(runId: string, bankReference: string): ActionResult {
        const run = find(runId);
        if (!tenantId || !run?.payment || run.payment.status !== "authorised") return { ok: false, reason: "Authorise the payment batch first." };
        dispatch(setPayment({ tenantId, actor: actor.name, runId, payment: { ...run.payment, status: "submitted", submittedAt: new Date().toISOString(), bankReference }, note: `Payment file submitted to the bank (${bankReference})` }));
        return { ok: true };
      },

      /**
       * The bank's settlement report: every account paid except the listed
       * rejections. Settled = reconciled when what the bank paid equals the
       * approved net pay of the accounts it paid.
       */
      recordSettlement(runId: string, rejected: { employeeId: string; reason: string }[]): ActionResult {
        const run = find(runId);
        if (!tenantId || !run?.payment || run.payment.status === "awaiting_authorisation" || run.payment.status === "authorised") return { ok: false, reason: "Submit the payment file to the bank first." };
        const rej = new Map(rejected.map((r) => [r.employeeId, r.reason]));
        const results: PaymentBatch["results"] = {};
        let settled = 0;
        for (const e of run.employees.filter((x) => x.included && x.computation && x.computation.net > 0)) {
          const reason = rej.get(e.employeeId);
          const prev = run.payment.results[e.employeeId];
          results[e.employeeId] = reason ? { status: "rejected", reason, resolvedBy: prev?.resolvedBy } : { status: "paid" };
          if (!reason) settled += e.computation!.net;
        }
        dispatch(
          setPayment({
            tenantId,
            actor: actor.name,
            runId,
            payment: { ...run.payment, status: "settled", results, settledAmount: round2(settled), reconciledAt: new Date().toISOString(), reconciledBy: actor.name },
            note: `Bank settlement reconciled — ${ngn(round2(settled))} paid${rejected.length ? `, ${rejected.length} rejected` : ""}`,
            disbursed: true,
          }),
        );
        return { ok: true };
      },

      /** A rejected payment was paid another way (corrected account, off-cycle run). */
      resolveRejectedPayment(runId: string, employeeId: string, how: string) {
        const run = find(runId);
        const r = run?.payment?.results[employeeId];
        if (!tenantId || !run?.payment || r?.status !== "rejected") return;
        dispatch(setPayment({ tenantId, actor: actor.name, runId, payment: { ...run.payment, results: { ...run.payment.results, [employeeId]: { ...r, resolvedBy: how } } }, note: `Rejected payment resolved — ${how}` }));
      },

      setVerificationRevoked(payslipId: string, revoked: boolean) {
        if (!tenantId) return;
        dispatch(setVerificationRevoked({ tenantId, actor: actor.name, payslipId, revoked }));
      },

      /**
       * Bulk new-starter import: saves every row that passed the checks and,
       * when `runId` is an open draft, adds the starters to it straight away
       * (their recurring deductions gathered like anyone else's).
       */
      importStarters(rows: StagedRow[], fileName: string, opts: { runId?: string } = {}): { ok: true; batchId: string; count: number } | { ok: false; reason: string } {
        const l = live();
        if (!l || !tenantId) return { ok: false, reason: "Payroll isn't loaded yet." };
        const ready = rows.filter((r) => r.record);
        if (!ready.length) return { ok: false, reason: "No rows are ready to import." };
        const run = opts.runId ? l.data.runs.find((r) => r.id === opts.runId && r.status === "draft") : undefined;
        const batchId = `IMP-${Date.now().toString(36).toUpperCase()}`;
        const { batch, structures, profiles, openingYtd } = toBatch(ready, { id: batchId, fileName, importedBy: actor.name, runId: run?.id });
        dispatch(importStarters({ tenantId, actor: actor.name, batch, structures, profiles, openingYtd }));
        if (run) addStartersToRun(run.id, batch.employees.map((e) => e.id));
        // Joiners set up now no longer count as "not in payroll" on open drafts.
        for (const r of live()?.data.runs ?? []) if (r.status === "draft" && r.id !== run?.id) revalidate(r.id);
        return { ok: true, batchId, count: batch.employees.length };
      },

      revalidate,

      addStartersToRun,

      /** Undo an import: takes the people out of open runs, then drops them. Blocked once any of them was paid. */
      removeStarterImport(batchId: string): ActionResult {
        const l = live();
        const batch = l?.data.imports?.find((b) => b.id === batchId);
        if (!l || !tenantId || !batch) return { ok: false, reason: "Import not found." };
        const ids = new Set(batch.employees.map((e) => e.id));
        const paid = l.data.runs.find((r) => LOCKED.includes(r.status) && r.employees.some((e) => ids.has(e.employeeId) && e.included));
        if (paid) return { ok: false, reason: `${paid.title} already paid some of these employees — correct them with an adjustment instead.` };
        for (const r of l.data.runs) {
          if (LOCKED.includes(r.status) || !r.employees.some((e) => ids.has(e.employeeId))) continue;
          if (r.status === "in_review" || r.status === "approved") cancelOpenRequests(r.id);
          recalc(
            { ...r, employees: r.employees.filter((e) => !ids.has(e.employeeId)), inputs: r.inputs.filter((i) => !ids.has(i.employeeId)), inputNotes: (r.inputNotes ?? []).filter((n) => !ids.has(n.employeeId)) },
            `Removed ${ids.size} imported starters`,
          );
        }
        dispatch(removeStarterImport({ tenantId, actor: actor.name, batchId }));
        return { ok: true };
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

/** The earliest open regular run — the month new starters join. */
export function earliestOpenRun(data: Pick<TenantPayroll, "runs"> | null): PayrollRun | null {
  return (
    [...(data?.runs ?? [])].filter((r) => r.type === "regular" && !LOCKED.includes(r.status)).sort((a, b) => periodKey(a.period) - periodKey(b.period))[0] ?? null
  );
}

/** Build the starter-import check context for the current tenant. */
export function importCtxFor(view: Pick<TenantPayrollView, "data" | "bundle">, importedBy: string, hires: HrHire[] = []): ImportCtx | null {
  const { data, bundle } = view;
  if (!data || !bundle) return null;
  const openRun = earliestOpenRun(data);
  return {
    bundle,
    elements: data.elements,
    settings: data.settings,
    rateSets: data.rateSets,
    structures: data.structures,
    period: openRun?.period ?? null,
    year: openRun?.period.year ?? new Date().getFullYear(),
    importedBy,
    batchId: "",
    hrHires: hireRefs(hires),
  };
}

/**
 * HR onboarding → payroll hand-over: everyone HR hired, who of them payroll
 * still has to set up, and their onboarding details already run through the
 * starter checks.
 */
export function useOnboardingHandover(opts: { enabled?: boolean } = {}) {
  const view = useTenantPayroll(opts);
  const actor = useCurrentActor();
  const records = useAppSelector((s) => s.onboardingRecords.records);
  const cleared = useAppSelector((s) => s.onboardingRecords.cleared);
  const hires = useMemo(() => hrHiresFrom(records, cleared), [records, cleared]);
  return useMemo(() => {
    const ctx = importCtxFor(view, actor.name);
    if (!ctx || !view.bundle) return { hires, queue: [] as HrHire[], staged: [] as StagedRow[], ctx: null };
    const queue = handoverQueue(hires, new Set(view.bundle.employees.map((e) => e.id)), ctx.period);
    return { hires, queue, staged: stageHandover(queue, ctx), ctx };
  }, [view, actor.name, hires]);
}

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
