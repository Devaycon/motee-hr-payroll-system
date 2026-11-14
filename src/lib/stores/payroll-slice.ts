import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  EmployeeTaxProfile,
  PayElement,
  PayrollAuditEntry,
  PayrollRun,
  PayrollSettings,
  Payslip,
  SalaryStructure,
  StatutoryRateSet,
} from "@/src/lib/payroll/types";
import type { TenantPayrollData } from "@/src/lib/payroll/run-builder";

/**
 * Payroll — per-tenant state for the demo. In production every field here is
 * a backend resource (see MOTEE_Payroll_Module_Plan_v2.md §REST contract);
 * the screens only talk to this slice through `use-payroll.ts`, so swapping
 * it for RTK Query endpoints doesn't touch the UI.
 *
 * Immutability rule: once a run is finalized its employees, inputs and
 * figures can't change — the reducer refuses. Corrections go through an
 * Adjustment run.
 */

export interface RemittanceRecord {
  reference: string;
  date: string;
  by: string;
  at: string;
}

export type TenantPayroll = TenantPayrollData & {
  audit: PayrollAuditEntry[];
  /** "YYYY-MM:item" → proof the remittance was paid to the authority. */
  remittances?: Record<string, RemittanceRecord>;
};

export interface PayrollState {
  byTenant: Record<string, TenantPayroll>;
  seedVersion: number;
}

/** Bump to reseed every tenant (drops local payroll edits). */
export const PAYROLL_SEED_VERSION = 3;

const initialState: PayrollState = { byTenant: {}, seedVersion: PAYROLL_SEED_VERSION };

const LOCKED: PayrollRun["status"][] = ["finalized", "disbursed"];

/** Close the employee's open approved version the day before `next` starts. */
function closePrevious(structures: SalaryStructure[], next: SalaryStructure) {
  for (const prev of structures) {
    if (prev.id === next.id || prev.employeeId !== next.employeeId || (prev.status ?? "approved") !== "approved") continue;
    if (!prev.effectiveTo && prev.effectiveFrom < next.effectiveFrom) {
      const d = new Date(`${next.effectiveFrom}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - 1);
      prev.effectiveTo = d.toISOString().slice(0, 10);
    }
  }
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function log(t: TenantPayroll, tenantId: string, actor: string, action: string, extra: Partial<PayrollAuditEntry> = {}) {
  t.audit.unshift({ id: uid("PAU"), tenantId, at: new Date().toISOString(), actor, action, ...extra });
  if (t.audit.length > 500) t.audit.length = 500;
}

interface Tenant {
  tenantId: string;
}
interface Actor {
  actor: string;
}

const slice = createSlice({
  name: "payroll",
  initialState,
  reducers: {
    hydratePayroll(state, action: PayloadAction<PayrollState>) {
      if (action.payload?.seedVersion !== PAYROLL_SEED_VERSION) return;
      state.byTenant = action.payload.byTenant ?? {};
    },

    seedTenantPayroll(state, action: PayloadAction<Tenant & { data: TenantPayroll }>) {
      if (state.byTenant[action.payload.tenantId]) return;
      state.byTenant[action.payload.tenantId] = action.payload.data;
    },

    resetTenantPayroll(state, action: PayloadAction<Tenant>) {
      delete state.byTenant[action.payload.tenantId];
    },

    updatePayrollSettings(state, action: PayloadAction<Tenant & Actor & { changes: Partial<PayrollSettings> }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      t.settings = { ...t.settings, ...action.payload.changes };
      log(t, action.payload.tenantId, action.payload.actor, "Updated payroll settings", { detail: Object.keys(action.payload.changes).join(", ") });
    },

    upsertElement(state, action: PayloadAction<Tenant & Actor & { element: PayElement }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      const el = action.payload.element;
      const i = t.elements.findIndex((e) => e.code === el.code);
      if (i >= 0) {
        // Statutory elements are system-owned.
        if (t.elements[i].statutory && !el.statutory) return;
        t.elements[i] = el;
      } else t.elements.push({ ...el, custom: true });
      log(t, action.payload.tenantId, action.payload.actor, i >= 0 ? "Edited pay element" : "Added pay element", { detail: `${el.code} — ${el.name}` });
    },

    /** A salary change: closes the current version and adds a new one. */
    addSalaryStructure(state, action: PayloadAction<Tenant & Actor & { structure: SalaryStructure }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      const s = action.payload.structure;
      // A pending change takes effect (closing the old version) only when approved.
      if ((s.status ?? "approved") === "approved") closePrevious(t.structures, s);
      t.structures.push(s);
      log(t, action.payload.tenantId, action.payload.actor, s.status === "pending" ? "Salary change sent for approval" : "New salary structure version", {
        employeeId: s.employeeId,
        detail: `Effective ${s.effectiveFrom} — ${s.reason}`,
      });
    },

    decideSalaryStructure(state, action: PayloadAction<Tenant & Actor & { structureId: string; approved: boolean }>) {
      const t = state.byTenant[action.payload.tenantId];
      const s = t?.structures.find((x) => x.id === action.payload.structureId);
      if (!t || !s || s.status !== "pending") return;
      s.status = action.payload.approved ? "approved" : "rejected";
      s.approvedBy = action.payload.actor;
      s.approvedAt = new Date().toISOString();
      if (action.payload.approved) closePrevious(t.structures, s);
      log(t, action.payload.tenantId, action.payload.actor, action.payload.approved ? "Salary change approved" : "Salary change rejected", {
        employeeId: s.employeeId,
        detail: `Effective ${s.effectiveFrom} — ${s.reason}`,
      });
    },

    markRemitted(state, action: PayloadAction<Tenant & Actor & { key: string; reference: string; date: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      t.remittances ??= {};
      t.remittances[action.payload.key] = { reference: action.payload.reference, date: action.payload.date, by: action.payload.actor, at: new Date().toISOString() };
      log(t, action.payload.tenantId, action.payload.actor, "Recorded statutory remittance", { detail: `${action.payload.key} · ${action.payload.reference}` });
    },

    updateTaxProfile(state, action: PayloadAction<Tenant & Actor & { employeeId: string; changes: Partial<EmployeeTaxProfile> }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      const p = t.profiles.find((x) => x.employeeId === action.payload.employeeId);
      if (!p) return;
      Object.assign(p, action.payload.changes);
      log(t, action.payload.tenantId, action.payload.actor, "Updated tax & statutory profile", { employeeId: p.employeeId, detail: Object.keys(action.payload.changes).join(", ") });
    },

    addRateSet(state, action: PayloadAction<Tenant & Actor & { rateSet: StatutoryRateSet }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      t.rateSets.push(action.payload.rateSet);
      log(t, action.payload.tenantId, action.payload.actor, "Added statutory rate set", { detail: `${action.payload.rateSet.label} from ${action.payload.rateSet.effectiveFrom}` });
    },

    /** Create or replace a run. Refuses to touch the figures of a locked run. */
    saveRun(state, action: PayloadAction<Tenant & Actor & { run: PayrollRun; note: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      const { run, actor, note } = action.payload;
      const i = t.runs.findIndex((r) => r.id === run.id);
      if (i >= 0) {
        const existing = t.runs[i];
        if (LOCKED.includes(existing.status)) {
          // Only the disbursement stamp may change after finalize.
          if (run.status === "disbursed" && existing.status === "finalized") {
            existing.status = "disbursed";
            existing.disbursedAt = run.disbursedAt;
            log(t, action.payload.tenantId, actor, note, { runId: run.id });
          }
          return;
        }
        t.runs[i] = run;
      } else {
        t.runs.unshift(run);
      }
      log(t, action.payload.tenantId, actor, note, { runId: run.id });
    },

    deleteRun(state, action: PayloadAction<Tenant & Actor & { runId: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      const run = t.runs.find((r) => r.id === action.payload.runId);
      if (!run || run.status !== "draft") return;
      t.runs = t.runs.filter((r) => r.id !== run.id);
      t.payslips = t.payslips.filter((p) => p.runId !== run.id);
      log(t, action.payload.tenantId, action.payload.actor, "Deleted draft run", { runId: run.id, detail: run.title });
    },

    addPayslips(state, action: PayloadAction<Tenant & { payslips: Payslip[] }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      const ids = new Set(action.payload.payslips.map((p) => p.id));
      t.payslips = [...action.payload.payslips, ...t.payslips.filter((p) => !ids.has(p.id))];
    },

    setVerificationRevoked(state, action: PayloadAction<Tenant & Actor & { payslipId: string; revoked: boolean }>) {
      const t = state.byTenant[action.payload.tenantId];
      const p = t?.payslips.find((x) => x.id === action.payload.payslipId);
      if (!t || !p) return;
      p.verification.revoked = action.payload.revoked;
      log(t, action.payload.tenantId, action.payload.actor, action.payload.revoked ? "Revoked payslip verification" : "Restored payslip verification", { employeeId: p.employeeId, detail: p.reference });
    },

    logPayroll(state, action: PayloadAction<Tenant & Actor & { action: string; runId?: string; employeeId?: string; detail?: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      const { tenantId, actor, action: what, ...rest } = action.payload;
      log(t, tenantId, actor, what, rest);
    },
  },
});

export const {
  hydratePayroll,
  seedTenantPayroll,
  resetTenantPayroll,
  updatePayrollSettings,
  upsertElement,
  addSalaryStructure,
  decideSalaryStructure,
  markRemitted,
  updateTaxProfile,
  addRateSet,
  saveRun,
  deleteRun,
  addPayslips,
  setVerificationRevoked,
  logPayroll,
} = slice.actions;

export default slice.reducer;
