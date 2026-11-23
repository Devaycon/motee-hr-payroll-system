import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ConfigChange,
  EmployeeTaxProfile,
  PayElement,
  PayrollAuditEntry,
  PayrollRun,
  PayrollSettings,
  Payslip,
  SalaryStructure,
  StatutoryRateSet,
  YtdTotals,
  PaymentBatch,
  VarianceInvestigation,
} from "@/src/lib/payroll/types";
import { CALC_SETTING_KEYS, diffSettings, versionElement } from "@/src/lib/payroll/config";
import type { TenantPayrollData } from "@/src/lib/payroll/run-builder";
import type { StarterImportBatch } from "@/src/lib/payroll/starter-import";

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

/**
 * What's been done about one statutory remittance. Absent = calculated only.
 * `submitted` = payment instruction sent; `paid` = confirmed by evidence;
 * `reconciled` = the amount paid matched against the liability.
 * Records saved before the lifecycle existed have no `status` and count as paid.
 */
export interface RemittanceRecord {
  status?: "submitted" | "paid" | "reconciled";
  reference: string;
  /** Date paid (or instructed, while submitted). */
  date: string;
  by: string;
  at: string;
  /** Amount actually paid. Absent on older records = the full liability. */
  amountPaid?: number;
  /** The bank receipt / authority acknowledgement. */
  receipt?: { fileName: string; uploadedAt: string; dataUrl?: string } | null;
  submittedAt?: string;
  reconciledBy?: string;
  reconciledAt?: string;
  note?: string;
}

export type TenantPayroll = TenantPayrollData & {
  audit: PayrollAuditEntry[];
  /** "YYYY-MM:item" → proof the remittance was paid to the authority. */
  remittances?: Record<string, RemittanceRecord>;
  /** Employees brought in through the new-starter template (payroll-only until the HR sync exists). */
  imports?: StarterImportBatch[];
  /** Every change to payroll configuration: who, what, when, effective date, approved by. */
  configChanges?: ConfigChange[];
  /** Remittance reminders already sent, by "YYYY-MM:item:daysBefore". */
  remindersSent?: Record<string, string>;
  /** Payroll movements under investigation: owner, evidence, resolution and sign-off. */
  investigations?: VarianceInvestigation[];
};

export interface PayrollState {
  byTenant: Record<string, TenantPayroll>;
  seedVersion: number;
}

/** Bump to reseed every tenant (drops local payroll edits). */
export const PAYROLL_SEED_VERSION = 8;

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

    /**
     * Settings change. Calculation settings are effective-dated: the old values
     * are kept as a version so periods before `effectiveFrom` keep them.
     */
    updatePayrollSettings(state, action: PayloadAction<Tenant & Actor & { changes: Partial<PayrollSettings>; effectiveFrom?: string; actorId?: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      const { changes, actor } = action.payload;
      const diff = diffSettings(t.settings, changes);
      const now = new Date().toISOString();
      const effectiveFrom = action.payload.effectiveFrom ?? now.slice(0, 10);
      const before = t.settings;
      t.settings = { ...t.settings, ...changes };
      if (Object.keys(changes).some((k) => CALC_SETTING_KEYS.includes(k as keyof PayrollSettings))) {
        // First change: the original settings applied from the beginning.
        t.settingsVersions ??= [{ effectiveFrom: "0000-01-01", settings: before, changedBy: "System", changedAt: "2026-01-01T00:00:00.000Z" }];
        // The change applies from its date onward, including to versions already dated later.
        t.settingsVersions = t.settingsVersions.map((v) => (v.effectiveFrom >= effectiveFrom ? { ...v, settings: { ...v.settings, ...changes } } : v));
        if (!t.settingsVersions.some((v) => v.effectiveFrom === effectiveFrom)) {
          const base = [...t.settingsVersions].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom)).filter((v) => v.effectiveFrom <= effectiveFrom).pop()?.settings ?? before;
          t.settingsVersions.push({ effectiveFrom, settings: { ...base, ...changes }, changedBy: actor, changedAt: now });
        }
      }
      if (diff.length) {
        t.configChanges ??= [];
        t.configChanges.unshift({
          id: uid("CFG"),
          area: "settings",
          target: "settings",
          summary: `Payroll settings: ${diff.map((d) => d.field).join(", ")}`,
          changes: diff,
          effectiveFrom,
          requestedBy: actor,
          requestedById: action.payload.actorId,
          requestedAt: now,
          status: "applied",
          approvedBy: actor,
          approvedAt: now,
          approvalNote: "Applied by a payroll settings administrator",
        });
      }
      log(t, action.payload.tenantId, actor, "Updated payroll settings", { detail: diff.map((d) => `${d.field}: ${d.before} → ${d.after}`).join("; ") || Object.keys(changes).join(", ") });
    },

    /** Add or change a pay element from `effectiveFrom`; earlier periods keep the old rules. */
    upsertElement(state, action: PayloadAction<Tenant & Actor & { element: PayElement; effectiveFrom?: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      const el = action.payload.element;
      const i = t.elements.findIndex((e) => e.code === el.code);
      if (i >= 0) {
        // Statutory elements are system-owned.
        if (t.elements[i].statutory && !el.statutory) return;
        t.elements[i] = versionElement(t.elements[i], el, action.payload.effectiveFrom ?? new Date().toISOString().slice(0, 10));
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
      t.remittances[action.payload.key] = { ...t.remittances[action.payload.key], status: "paid", reference: action.payload.reference, date: action.payload.date, by: action.payload.actor, at: new Date().toISOString() };
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
      t.rateSets = [...t.rateSets.filter((r) => r.id !== action.payload.rateSet.id), action.payload.rateSet];
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

    /** Bulk new-starter import: the people, their salary structures, profiles and year to date, in one step. */
    importStarters(
      state,
      action: PayloadAction<Tenant & Actor & { batch: StarterImportBatch; structures: SalaryStructure[]; profiles: EmployeeTaxProfile[]; openingYtd: Record<string, YtdTotals> }>,
    ) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      const { batch, structures, profiles, openingYtd } = action.payload;
      const ids = new Set(batch.employees.map((e) => e.id));
      t.imports = [...(t.imports ?? []), batch];
      t.structures = [...t.structures.filter((s) => !ids.has(s.employeeId)), ...structures];
      t.profiles = [...t.profiles.filter((p) => !ids.has(p.employeeId)), ...profiles];
      Object.assign(t.openingYtd, openingYtd);
      log(t, action.payload.tenantId, action.payload.actor, "Imported new starters", { detail: `${batch.employees.length} employees from ${batch.fileName}` });
    },

    /** A payroll deduction repaid part of a loan brought forward by the starter import. */
    recordImportedLoanRepayment(state, action: PayloadAction<Tenant & { loanId: string; amountRepaid: number }>) {
      const t = state.byTenant[action.payload.tenantId];
      for (const b of t?.imports ?? []) {
        const loan = (b.loans ?? []).find((l) => l.id === action.payload.loanId);
        if (!loan) continue;
        loan.amountRepaid = Math.min(loan.amount, action.payload.amountRepaid);
        if (loan.amountRepaid >= loan.amount) loan.status = "closed";
      }
    },

    /** Undo an import. The screen first takes the people out of open runs; locked runs block it. */
    removeStarterImport(state, action: PayloadAction<Tenant & Actor & { batchId: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      const batch = t?.imports?.find((b) => b.id === action.payload.batchId);
      if (!t || !batch) return;
      const ids = new Set(batch.employees.map((e) => e.id));
      if (t.runs.some((r) => LOCKED.includes(r.status) && r.employees.some((e) => ids.has(e.employeeId) && e.included))) return;
      t.imports = (t.imports ?? []).filter((b) => b.id !== batch.id);
      t.structures = t.structures.filter((s) => !ids.has(s.employeeId));
      t.profiles = t.profiles.filter((p) => !ids.has(p.employeeId));
      for (const id of ids) delete t.openingYtd[id];
      log(t, action.payload.tenantId, action.payload.actor, "Removed imported starters", { detail: `${batch.employees.length} employees from ${batch.fileName}` });
    },

    /** Record a configuration change (pending ones wait for a second person). */
    addConfigChange(state, action: PayloadAction<Tenant & { change: ConfigChange }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      t.configChanges ??= [];
      t.configChanges.unshift(action.payload.change);
      log(t, action.payload.tenantId, action.payload.change.requestedBy, action.payload.change.status === "pending" ? "Configuration change sent for approval" : "Configuration changed", { detail: action.payload.change.summary });
    },

    /** A second person decides a pending change. Never the person who asked for it. */
    decideConfigChange(state, action: PayloadAction<Tenant & Actor & { id: string; actorId?: string; approved: boolean; note?: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      const c = t?.configChanges?.find((x) => x.id === action.payload.id);
      if (!t || !c || c.status !== "pending") return;
      if (c.requestedBy === action.payload.actor || (c.requestedById && c.requestedById === action.payload.actorId)) return;
      c.status = action.payload.approved ? "applied" : "rejected";
      c.approvedBy = action.payload.actor;
      c.approvedAt = new Date().toISOString();
      c.approvalNote = action.payload.note;
      log(t, action.payload.tenantId, action.payload.actor, action.payload.approved ? "Approved configuration change" : "Rejected configuration change", { detail: c.summary });
    },

    /** Remittance lifecycle: submitted, then paid (with evidence), then reconciled. */
    updateRemittance(state, action: PayloadAction<Tenant & Actor & { key: string; patch: Partial<RemittanceRecord>; note: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      t.remittances ??= {};
      const cur = t.remittances[action.payload.key];
      t.remittances[action.payload.key] = { ...(cur ?? { reference: "", date: "", by: action.payload.actor, at: new Date().toISOString() }), ...action.payload.patch };
      log(t, action.payload.tenantId, action.payload.actor, action.payload.note, { detail: action.payload.key });
    },

    /** Remove a remittance record entered in error (never once reconciled). */
    clearRemittance(state, action: PayloadAction<Tenant & Actor & { key: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      const cur = t?.remittances?.[action.payload.key];
      if (!t || !cur || cur.status === "reconciled") return;
      delete t.remittances![action.payload.key];
      log(t, action.payload.tenantId, action.payload.actor, "Cleared remittance record", { detail: action.payload.key });
    },

    markReminderSent(state, action: PayloadAction<Tenant & { key: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      t.remindersSent ??= {};
      t.remindersSent[action.payload.key] = new Date().toISOString();
    },

    /** Payment batch on a locked run: authorisation, submission, settlement. Figures never change. */
    setPayment(state, action: PayloadAction<Tenant & Actor & { runId: string; payment: PaymentBatch; note: string; disbursed?: boolean }>) {
      const t = state.byTenant[action.payload.tenantId];
      const run = t?.runs.find((r) => r.id === action.payload.runId);
      if (!t || !run || !LOCKED.includes(run.status)) return;
      run.payment = action.payload.payment;
      if (action.payload.disbursed && run.status === "finalized") {
        run.status = "disbursed";
        run.disbursedAt = new Date().toISOString();
      }
      log(t, action.payload.tenantId, action.payload.actor, action.payload.note, { runId: run.id });
    },

    // ── Variance investigations ───────────────────────────────────────────────

    openInvestigation(state, action: PayloadAction<Tenant & Actor & { investigation: VarianceInvestigation }>) {
      const t = state.byTenant[action.payload.tenantId];
      if (!t) return;
      const inv = action.payload.investigation;
      t.investigations ??= [];
      if (t.investigations.some((x) => x.id === inv.id)) return;
      t.investigations.unshift(inv);
      log(t, action.payload.tenantId, action.payload.actor, "Opened variance investigation", { runId: inv.runId, employeeId: inv.employeeId, detail: `${inv.id} — ${inv.title} (owner ${inv.ownerName})` });
    },

    /** Owner, due date or status (open ↔ investigating). Resolution has its own step. */
    updateInvestigation(state, action: PayloadAction<Tenant & Actor & { id: string; patch: Partial<Pick<VarianceInvestigation, "status" | "ownerId" | "ownerName" | "dueDate">>; note: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      const inv = t?.investigations?.find((x) => x.id === action.payload.id);
      if (!t || !inv || inv.status === "resolved" || action.payload.patch.status === "resolved") return;
      Object.assign(inv, action.payload.patch);
      inv.history.push({ at: new Date().toISOString(), actor: action.payload.actor, action: action.payload.note });
      log(t, action.payload.tenantId, action.payload.actor, "Updated variance investigation", { runId: inv.runId, employeeId: inv.employeeId, detail: `${inv.id} — ${action.payload.note}` });
    },

    addInvestigationComment(state, action: PayloadAction<Tenant & Actor & { id: string; commentId: string; text: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      const inv = t?.investigations?.find((x) => x.id === action.payload.id);
      if (!t || !inv || !action.payload.text.trim()) return;
      const at = new Date().toISOString();
      inv.comments.push({ id: action.payload.commentId, at, by: action.payload.actor, text: action.payload.text.trim() });
      inv.history.push({ at, actor: action.payload.actor, action: "Commented" });
      if (inv.status === "open") {
        inv.status = "investigating";
        inv.history.push({ at, actor: action.payload.actor, action: "Moved to Under investigation" });
      }
    },

    attachInvestigationDocument(state, action: PayloadAction<Tenant & Actor & { id: string; document: VarianceInvestigation["documents"][number] }>) {
      const t = state.byTenant[action.payload.tenantId];
      const inv = t?.investigations?.find((x) => x.id === action.payload.id);
      if (!t || !inv) return;
      inv.documents.push(action.payload.document);
      inv.history.push({ at: action.payload.document.uploadedAt, actor: action.payload.actor, action: `Attached ${action.payload.document.fileName}` });
    },

    resolveInvestigation(state, action: PayloadAction<Tenant & Actor & { id: string; actorId?: string; note: string; outcome: "legitimate" | "error" }>) {
      const t = state.byTenant[action.payload.tenantId];
      const inv = t?.investigations?.find((x) => x.id === action.payload.id);
      if (!t || !inv || inv.status === "resolved" || !action.payload.note.trim()) return;
      const at = new Date().toISOString();
      inv.status = "resolved";
      inv.resolutionNote = action.payload.note.trim();
      inv.outcome = action.payload.outcome;
      inv.resolvedBy = action.payload.actor;
      inv.resolvedById = action.payload.actorId;
      inv.resolvedAt = at;
      inv.signOff = undefined;
      inv.history.push({ at, actor: action.payload.actor, action: `Resolved — ${action.payload.outcome === "legitimate" ? "movement is legitimate" : "payroll error, correction needed"}`, note: inv.resolutionNote });
      log(t, action.payload.tenantId, action.payload.actor, "Resolved variance investigation", { runId: inv.runId, employeeId: inv.employeeId, detail: `${inv.id} — ${inv.resolutionNote}` });
    },

    /** A second person accepts the resolution or reopens it. Never the person who resolved it. */
    signOffInvestigation(state, action: PayloadAction<Tenant & Actor & { id: string; actorId?: string; decision: "accepted" | "reopened"; note?: string }>) {
      const t = state.byTenant[action.payload.tenantId];
      const inv = t?.investigations?.find((x) => x.id === action.payload.id);
      if (!t || !inv || inv.status !== "resolved" || inv.signOff?.decision === "accepted") return;
      if (inv.resolvedBy === action.payload.actor || (inv.resolvedById && inv.resolvedById === action.payload.actorId)) return;
      const at = new Date().toISOString();
      inv.signOff = { by: action.payload.actor, byId: action.payload.actorId, at, decision: action.payload.decision, note: action.payload.note };
      if (action.payload.decision === "reopened") {
        inv.status = "investigating";
        inv.history.push({ at, actor: action.payload.actor, action: "Reopened the investigation", note: action.payload.note });
      } else {
        inv.history.push({ at, actor: action.payload.actor, action: "Signed off the resolution", note: action.payload.note });
      }
      log(t, action.payload.tenantId, action.payload.actor, action.payload.decision === "accepted" ? "Signed off variance investigation" : "Reopened variance investigation", { runId: inv.runId, employeeId: inv.employeeId, detail: inv.id });
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
  openInvestigation,
  updateInvestigation,
  addInvestigationComment,
  attachInvestigationDocument,
  resolveInvestigation,
  signOffInvestigation,
  addConfigChange,
  decideConfigChange,
  updateRemittance,
  clearRemittance,
  markReminderSent,
  setPayment,
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
  importStarters,
  removeStarterImport,
  recordImportedLoanRepayment,
} = slice.actions;

export default slice.reducer;
