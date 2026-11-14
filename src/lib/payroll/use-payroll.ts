"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useUnscopedLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { applyCollection } from "@/src/lib/profile/collection-edits";
import { updateRecord } from "@/src/lib/stores/collection-edits-slice";
import { submitApproval } from "@/src/lib/stores/approvals-slice";
import { withApproval } from "@/src/lib/loans/loans";
import {
  addPayslips,
  addRateSet,
  addSalaryStructure,
  deleteRun,
  logPayroll,
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
import { store, type RootState } from "@/src/lib/stores/store";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { makePeriod, round2 } from "./ng/engine";
import {
  buildPayslips,
  calculateRun,
  newRun,
  previousComputation,
  seedHistory,
  seedProfile,
  seedStructure,
  type TenantPayrollData,
} from "./run-builder";
import { validateRun, blockingExceptions } from "./validation";
import { PAYROLL_DOCUMENT_TYPE } from "./constants";
import type {
  EmployeeMode,
  EmployeeTaxProfile,
  PayComputation,
  PayElement,
  PayPeriod,
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
 * the same signatures (see the v2 plan's REST contract).
 *
 * Payroll is company-wide, so it reads the raw tenant bundle rather than the
 * viewer's branch/role-scoped view. Who may SEE it is enforced by the
 * `time-payroll.payroll` permission and, for payslips, by ownership.
 */

const ngn = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Loans with their approval outcome and any recorded repayments applied. */
export function resolvedLoans(state: RootState, bundle: LocaleBundle): LocaleLoan[] {
  const byDoc = new Map(
    state.approvals.requests.filter((r) => r.documentType === "loan_request").map((r) => [r.documentId, r]),
  );
  return applyCollection(bundle.loans ?? [], "loans", state.collectionEdits).map((l) =>
    withApproval(l, byDoc.get(l.id)),
  );
}

export function isPayrollCountry(bundle: LocaleBundle | null | undefined): boolean {
  return bundle?.tenant.countryCode === "NG";
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
  const history = seedHistory({
    tenantId: bundle.tenant.id,
    bundle,
    base,
    loans: resolvedLoans(state, bundle),
    today: new Date(),
  });
  const data = { ...base, ...history };
  // Validate the seeded draft so the Exceptions tab is populated on first open.
  const runs = history.runs.map((r) => (r.status === "draft" ? withValidation(r, data, bundle) : r));
  return { ...data, runs, audit: [] };
}

function withValidation(run: PayrollRun, data: TenantPayrollData, bundle: LocaleBundle): PayrollRun {
  const previous = new Map<string, PayComputation>();
  for (const re of run.employees) {
    const p = previousComputation(data, re.employeeId, run.period);
    if (p) previous.set(re.employeeId, p);
  }
  const exceptions = validateRun({
    run,
    employees: new Map(bundle.employees.map((e) => [e.id, e])),
    profiles: new Map(data.profiles.map((p) => [p.employeeId, p])),
    previous,
    settings: data.settings,
  });
  return { ...run, exceptions };
}

export interface TenantPayrollView {
  tenantId: string | null;
  bundle: LocaleBundle | null;
  data: TenantPayroll | null;
  loading: boolean;
  /** False for a tenant whose country has no statutory module yet (UK). */
  supported: boolean;
}

/** The current tenant's payroll, seeded on first use. */
export function useTenantPayroll(): TenantPayrollView {
  const dispatch = useAppDispatch();
  // Triggers the locale load; payroll itself reads the raw, unscoped bundle.
  const { loading } = useUnscopedLocaleSection((b) => b.tenant.id);
  const bundle = useAppSelector((s) => s.locale.data);
  const tenantId = bundle?.tenant.id ?? null;
  const data = useAppSelector((s) => (tenantId ? s.payroll.byTenant[tenantId] ?? null : null));
  const supported = isPayrollCountry(bundle);

  useEffect(() => {
    if (!bundle || !tenantId || data || !supported) return;
    dispatch(seedTenantPayroll({ tenantId, data: buildTenantSeed(store.getState(), bundle) }));
  }, [bundle, tenantId, data, supported, dispatch]);

  return { tenantId, bundle, data, loading: loading || (supported && !data), supported };
}

export function useCurrentActor(): RunActor & { roleId?: string } {
  const user = useAppSelector((s) => s.auth.user);
  return { employeeId: user?.employeeId ?? "", name: user?.name ?? "HR Admin", roleId: user?.roleId };
}

// ── Actions ─────────────────────────────────────────────────────────────────

export function usePayrollActions() {
  const dispatch = useAppDispatch();
  const view = useTenantPayroll();
  const actor = useCurrentActor();
  const user = useAppSelector((s) => s.auth.user);

  return useMemo(() => {
    const { tenantId, bundle, data } = view;
    const ready = !!(tenantId && bundle && data);
    const find = (runId: string) => data?.runs.find((r) => r.id === runId);
    const loansNow = () => resolvedLoans(store.getState(), bundle!);

    /** Recalculate + revalidate a draft run and save it. */
    function recalc(run: PayrollRun, note: string) {
      if (!ready) return;
      const calculated = calculateRun({ ...run, status: "draft" }, data!, bundle!);
      const validated = withValidation(calculated, data!, bundle!);
      dispatch(saveRun({ tenantId: tenantId!, actor: actor.name, note, run: validated }));
      return validated;
    }

    function editDraft(runId: string, note: string, change: (r: PayrollRun) => PayrollRun) {
      const run = find(runId);
      if (!run || run.status !== "draft") return;
      return recalc(change(run), note);
    }

    function createRun(type: PayrollRun["type"], period: PayPeriod, parentRunId?: string): PayrollRun | undefined {
        if (!ready) return;
        const run = newRun({
          tenantId: tenantId!,
          type,
          period,
          preparedBy: { employeeId: actor.employeeId, name: actor.name },
          bundle: bundle!,
          data: data!,
          loans: loansNow(),
          today: new Date(),
          parentRunId,
        });
        const validated = withValidation(run, data!, bundle!);
        dispatch(saveRun({ tenantId: tenantId!, actor: actor.name, note: `Created ${run.title}`, run: validated }));
        return validated;
    }

    /** Raises the payroll_run approval request for a run. */
    function raiseApproval(run: PayrollRun, note?: string) {
      const t = run.totals;
        dispatch(
        submitApproval({
          documentType: PAYROLL_DOCUMENT_TYPE,
          documentId: run.id,
          documentTitle: run.title,
          documentSummary: `${t.employees} employees · gross ₦${Math.round(t.gross).toLocaleString("en-NG")} · net ₦${Math.round(t.net).toLocaleString("en-NG")}${note ? ` · ${note}` : ""}`,
          payloadSnapshot: {
            "Pay period": run.period.label,
            "Run type": run.type === "regular" ? "Regular monthly" : run.type === "off_cycle" ? "Off-cycle" : "Adjustment",
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
        }),
      );
    }

    return {
      ready,
      createRun,

      /** An adjustment run correcting a finalized period: back pay / salary adjustments only. */
      createAdjustmentRun(fromRunId: string): PayrollRun | undefined {
        const src = find(fromRunId);
        if (!src) return;
        return createRun("adjustment", src.period, src.id);
      },

      recalculate(runId: string) {
        const run = find(runId);
        if (!run || run.status !== "draft") return;
        // Re-gather module inputs (loans, expenses) but keep manual inputs.
        const fresh = newRun({
          tenantId: tenantId!,
          type: run.type,
          period: run.period,
          preparedBy: run.preparedBy,
          bundle: bundle!,
          data: data!,
          loans: loansNow(),
          today: new Date(),
          id: run.id,
        });
        const manualInputs = run.inputs.filter((i) => i.source === "manual" || i.source === "adjustment");
        const keepEmployees = new Map(run.employees.map((e) => [e.employeeId, e]));
        return recalc(
          {
            ...run,
            inputs: run.type === "regular" ? [...fresh.inputs.filter((i) => i.source !== "manual"), ...manualInputs] : run.inputs,
            employees: fresh.employees.map((e) => {
              const k = keepEmployees.get(e.employeeId);
              return k ? { ...e, included: k.included, mode: k.mode, manualLines: k.manualLines, manualStatutory: k.manualStatutory } : e;
            }),
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

      setMode(runId: string, employeeId: string, mode: EmployeeMode) {
        return editDraft(runId, `Switched employee to ${mode}`, (r) => ({
          ...r,
          employees: r.employees.map((e) => (e.employeeId === employeeId ? { ...e, mode, manualLines: mode === "auto" ? undefined : e.manualLines ?? e.computation?.lines.filter((l) => l.category !== "employer" && !l.statutory), manualStatutory: e.manualStatutory ?? "recalculate" } : e)),
        }));
      },

      addInput(runId: string, input: Omit<PeriodInput, "id">) {
        return editDraft(runId, "Added pay input", (r) => ({
          ...r,
          inputs: [...r.inputs, { ...input, id: `IN-${Date.now().toString(36)}-${r.inputs.length}` }],
          employees: r.employees.map((e) => (e.employeeId === input.employeeId ? { ...e, included: true } : e)),
        }));
      },

      removeInput(runId: string, inputId: string) {
        return editDraft(runId, "Removed pay input", (r) => ({ ...r, inputs: r.inputs.filter((i) => i.id !== inputId) }));
      },

      /** Commit a staged manual upload: per-employee lines, switched to manual mode. */
      applyManualUpload(runId: string, rows: { employeeId: string; lines: PayslipLine[] }[], statutory: "as_uploaded" | "recalculate", fileName: string) {
        const ids = new Set(rows.map((r) => r.employeeId));
        const result = editDraft(runId, `Manual upload: ${fileName} (${rows.length} employees)`, (r) => ({
          ...r,
          employees: [
            ...r.employees.map((e) => {
              const row = rows.find((x) => x.employeeId === e.employeeId);
              return row ? { ...e, included: true, mode: "manual" as const, manualLines: row.lines, manualStatutory: statutory } : e;
            }),
            // Uploaded people not yet on the run (e.g. an off-cycle run) are added.
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
        void ids;
        return result;
      },

      acknowledge(runId: string, exceptionId: string, reason: string) {
        const run = find(runId);
        if (!run || run.status !== "draft") return;
        dispatch(
          saveRun({
            tenantId: tenantId!,
            actor: actor.name,
            note: `Acknowledged exception: ${reason}`,
            run: {
              ...run,
              exceptions: run.exceptions.map((e) =>
                e.id === exceptionId ? { ...e, acknowledged: { by: actor.name, at: new Date().toISOString(), reason } } : e,
              ),
            },
          }),
        );
      },

      /** Draft → In review. Raises the payroll_run approval request. */
      submit(runId: string, note?: string): { ok: boolean; reason?: string } {
        const run = find(runId);
        if (!run || run.status !== "draft") return { ok: false, reason: "Only a draft run can be submitted." };
        if (!run.employees.some((e) => e.included && e.computation)) return { ok: false, reason: "The run has no calculated employees." };
        const blocking = blockingExceptions(run);
        if (blocking.length) return { ok: false, reason: `${blocking.length} error${blocking.length === 1 ? "" : "s"} must be resolved or acknowledged first.` };
        raiseApproval(run, note);
        dispatch(
          saveRun({
            tenantId: tenantId!,
            actor: actor.name,
            note: "Submitted for approval",
            run: { ...run, status: "in_review", submittedAt: new Date().toISOString(), approvalRequestId: run.id, preparedBy: run.preparedBy.employeeId ? run.preparedBy : { employeeId: actor.employeeId, name: actor.name } },
          }),
        );
        return { ok: true };
      },

      /**
       * A run is in review but its approval request is gone (the demo keeps
       * requests in memory, so a full reload drops them). Raise it again
       * rather than leave the run stranded.
       */
      reraiseApproval(runId: string) {
        const run = find(runId);
        if (!run || run.status !== "in_review") return;
        raiseApproval(run, "re-raised");
        if (tenantId) dispatch(logPayroll({ tenantId, actor: actor.name, action: "Re-raised approval request", runId }));
      },


      /** Approved → Finalized. Locks the run, issues payslips, posts loan repayments. */
      finalize(runId: string): { ok: boolean; reason?: string } {
        const run = find(runId);
        if (!run || run.status !== "approved") return { ok: false, reason: "Only an approved run can be finalized." };
        const now = new Date().toISOString();
        const finalized: PayrollRun = { ...run, status: "finalized", finalizedAt: now, finalizedBy: { employeeId: actor.employeeId, name: actor.name } };
        const payslips = buildPayslips({ run: finalized, bundle: bundle!, data: data!, status: "final", approvedBy: run.approvedBy?.name ?? null, generatedAt: now });
        dispatch(saveRun({ tenantId: tenantId!, actor: actor.name, note: `Finalized — ${payslips.length} payslips issued`, run: finalized }));
        dispatch(addPayslips({ tenantId: tenantId!, payslips }));

        // Loans: post each payroll deduction as a repayment on the loan record.
        const loans = new Map(loansNow().map((l) => [l.id, l]));
        for (const re of finalized.employees) {
          for (const l of re.computation?.lines ?? []) {
            if (l.source !== "loan" || !l.refId) continue;
            const loan = loans.get(l.refId);
            if (!loan) continue;
            const repaid = Math.min(loan.amount, round2(loan.amountRepaid + l.amount));
            dispatch(
              updateRecord({
                key: "loans",
                id: loan.id,
                patch: { amountRepaid: repaid, status: repaid >= loan.amount ? "closed" : loan.status, issuedAt: loan.issuedAt },
              }),
            );
            loans.set(loan.id, { ...loan, amountRepaid: repaid });
          }
        }
        return { ok: true };
      },

      markDisbursed(runId: string) {
        const run = find(runId);
        if (!run || run.status !== "finalized") return;
        dispatch(saveRun({ tenantId: tenantId!, actor: actor.name, note: "Marked as paid (bank file processed)", run: { ...run, status: "disbursed", disbursedAt: new Date().toISOString() } }));
      },

      deleteRun(runId: string) {
        if (!tenantId) return;
        dispatch(deleteRun({ tenantId, actor: actor.name, runId }));
      },

      logExport(runId: string, what: string) {
        if (!tenantId) return;
        dispatch(logPayroll({ tenantId, actor: actor.name, action: `Exported ${what}`, runId }));
      },

      updateSettings(changes: Partial<PayrollSettings>) {
        if (!tenantId) return;
        dispatch(updatePayrollSettings({ tenantId, actor: actor.name, changes }));
      },

      upsertElement(element: PayElement) {
        if (!tenantId) return;
        dispatch(upsertElement({ tenantId, actor: actor.name, element }));
      },

      addSalaryStructure(structure: Omit<SalaryStructure, "id" | "approvedBy" | "approvedAt" | "effectiveTo">) {
        if (!tenantId) return;
        const n = (data?.structures.filter((s) => s.employeeId === structure.employeeId).length ?? 0) + 1;
        dispatch(
          addSalaryStructure({
            tenantId,
            actor: actor.name,
            structure: { ...structure, id: `SS-${structure.employeeId}-${n}`, effectiveTo: null, approvedBy: actor.name, approvedAt: new Date().toISOString() },
          }),
        );
      },

      updateTaxProfile(employeeId: string, changes: Partial<EmployeeTaxProfile>) {
        if (!tenantId) return;
        dispatch(updateTaxProfile({ tenantId, actor: actor.name, employeeId, changes }));
      },

      addRateSet(rateSet: StatutoryRateSet) {
        if (!tenantId) return;
        dispatch(addRateSet({ tenantId, actor: actor.name, rateSet }));
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
  }, [view, actor, user, dispatch]);
}

// ── Read helpers ────────────────────────────────────────────────────────────

export function useRun(runId: string) {
  const view = useTenantPayroll();
  const run = view.data?.runs.find((r) => r.id === runId) ?? null;
  return { ...view, run };
}

/** Final payslips for one employee, newest first. */
export function useEmployeePayslipList(employeeId: string | undefined) {
  const view = useTenantPayroll();
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
  const view = useTenantPayroll();
  return useMemo(() => {
    const run = view.data?.runs.find((r) => r.id === runId);
    if (!run || !view.bundle || !view.data) return null;
    const re = run.employees.find((e) => e.employeeId === employeeId);
    if (!re?.computation) return null;
    return (
      buildPayslips({
        run: { ...run, employees: [re] },
        bundle: view.bundle,
        data: view.data,
        status: run.status === "finalized" || run.status === "disbursed" ? "final" : "draft",
        approvedBy: run.approvedBy?.name ?? null,
        generatedAt: run.calculatedAt ?? run.createdAt,
      })[0] ?? null
    );
  }, [view, runId, employeeId]);
}

export function nextPeriod(data: TenantPayroll | null, payDay = 25): PayPeriod {
  const regular = (data?.runs ?? []).filter((r) => r.type === "regular");
  const latest = regular.sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month))[0];
  if (!latest) {
    const d = new Date();
    return makePeriod(d.getFullYear(), d.getMonth() + 1, payDay);
  }
  const m = latest.period.month === 12 ? 1 : latest.period.month + 1;
  const y = latest.period.month === 12 ? latest.period.year + 1 : latest.period.year;
  return makePeriod(y, m, payDay);
}
