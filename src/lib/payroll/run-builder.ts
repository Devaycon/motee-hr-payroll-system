import type { LocaleBundle, LocaleEmployee, LocaleLoan } from "@/src/lib/types/locale";
import { repaymentSchedule, loanTypeLabel } from "@/src/lib/loans/loans";
import { LOAN_ELEMENT_BY_TYPE } from "./elements-seed";
import { elementMapOn, settingsOn } from "./config";
import type { OpeningMonths } from "./ytd";
import { computeEmployeePay, makePeriod, prorationFactor, round2, splitSalary, sumYtd, workingDaysBetween } from "./ng/engine";
import { leaveAllowanceOf, resolveRateSet, ruleFor } from "./ng/rate-sets";
import { buildInsights } from "./insights";
import { canonicalJson, sha256Hex, verificationCodeFrom } from "./hash";
import type {
  AttendanceSnapshot,
  EmployeeTaxProfile,
  PayComputation,
  PayElement,
  PayPeriod,
  PaymentSnapshot,
  PayrollRun,
  PayrollRunTotals,
  PayrollSettings,
  Payslip,
  SalaryLine,
  PayslipCompanySnapshot,
  PeriodInput,
  RunActor,
  RunEmployee,
  SalaryStructure,
  SettingsVersion,
  StatutoryRateSet,
  YtdTotals,
} from "./types";

/**
 * Glue between the tenant's records (bundle + module state) and the pure
 * engine: builds salary structures and tax profiles, gathers each period's
 * inputs from Loans / Expenses / one-off pay, runs the calculation, and turns
 * a finalized run into immutable payslips.
 */

export interface TenantPayrollData {
  elements: PayElement[];
  rateSets: StatutoryRateSet[];
  settings: PayrollSettings;
  /** Earlier versions of the settings (effective-dated). Absent = the settings never changed. */
  settingsVersions?: SettingsVersion[];
  structures: SalaryStructure[];
  profiles: EmployeeTaxProfile[];
  runs: PayrollRun[];
  payslips: Payslip[];
  /** YTD brought forward from the previous payroll system, per employee. */
  openingYtd: Record<string, YtdTotals>;
  /** The months inside the opening balance, each with its own figures and lines (see ytd.ts). */
  openingMonths?: OpeningMonths;
}

// ── Seeding structures & profiles from the bundle ───────────────────────────

const PFAS = [
  { code: "PFA-STANBIC", name: "Stanbic IBTC Pension Managers" },
  { code: "PFA-ARM", name: "ARM Pension Managers" },
  { code: "PFA-LEADWAY", name: "Leadway Pensure PFA" },
  { code: "PFA-PREMIUM", name: "Premium Pension Limited" },
  { code: "PFA-CRUSADER", name: "Crusader Sterling Pensions" },
  { code: "PFA-FIDELITY", name: "FCMB Pensions" },
];

/** CBN / NIBSS institution codes for the banks in the demo bundle. */
export const NG_BANK_CODES: Record<string, string> = {
  "Access Bank": "044",
  "First Bank": "011",
  GTBank: "058",
  "Stanbic IBTC": "221",
  UBA: "033",
  "Zenith Bank": "057",
  Kuda: "50211",
};

/**
 * NUBAN check digit (CBN standard): weights 3,7,3,3,7,3,3,7,3,3,7,3 over the
 * 3-digit bank code followed by the first 9 digits of the account number.
 */
export function nubanCheckDigit(bankCode3: string, serial9: string): number {
  const digits = `${bankCode3}${serial9}`.split("").map(Number);
  const weights = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3];
  const sum = digits.reduce((s, d, i) => s + d * weights[i], 0);
  return (10 - (sum % 10)) % 10;
}

/**
 * True when the account number is a valid 10-digit NUBAN for the bank. Banks
 * with 5/6-digit NIP codes (microfinance, fintech) use an extended scheme the
 * check digit can't be verified against, so only the format is checked.
 */
export function isValidNuban(accountNumber: string, bankCode: string): boolean {
  if (!/^\d{10}$/.test(accountNumber)) return false;
  if (!/^\d{3}$/.test(bankCode)) return true;
  return nubanCheckDigit(bankCode, accountNumber.slice(0, 9)) === Number(accountNumber[9]);
}

export function normaliseState(region: string | undefined): string {
  if (!region) return "Lagos";
  const r = region.replace(/ State$/i, "").trim();
  if (/abuja|fct/i.test(r)) return "FCT";
  return r;
}

function hashNum(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Short, URL-safe tenant prefix for run ids, e.g. tenant_ng_001 → NG001. */
export function tenantPrefix(tenantId: string): string {
  return tenantId.replace(/^tenant_/i, "").replace(/[^a-z0-9]/gi, "").toUpperCase().slice(-8) || "T";
}

export function seedStructure(e: LocaleEmployee, settings: PayrollSettings): SalaryStructure {
  return {
    id: `SS-${e.id}-1`,
    employeeId: e.id,
    effectiveFrom: e.startDate,
    effectiveTo: null,
    currency: e.salary.currency,
    lines: splitSalary(e.salary.amount, settings.defaultSplit),
    reason: "Opening salary structure (migrated from employee record)",
    approvedBy: "System",
    approvedAt: "2026-01-01",
  };
}

export function seedProfile(e: LocaleEmployee): EmployeeTaxProfile {
  const id = e.identifiers ?? {};
  const bank = e.bankDetails ?? {};
  const h = hashNum(e.id);
  const pfa = PFAS[h % PFAS.length];
  const bankCode = NG_BANK_CODES[bank.bankName ?? ""] ?? "";
  // Demo bank numbers are random; give them a valid NUBAN check digit so the
  // NUBAN validation only fires on numbers people actually mistype.
  let accountNumber = (bank.accountNumber ?? "").replace(/\D/g, "");
  if (accountNumber.length === 10 && /^\d{3}$/.test(bankCode)) {
    accountNumber = accountNumber.slice(0, 9) + nubanCheckDigit(bankCode, accountNumber.slice(0, 9));
  }
  // About half the staff rent; one declaration is left unverified so the
  // "rent evidence" warning has something to show.
  const rent = h % 2 === 0 ? 600_000 + (h % 7) * 150_000 : 0;
  // A few staff save extra for retirement: some a % of pensionable pay, some a fixed sum.
  // Each is backed by the employee's signed mandate.
  const mandate = { reference: `AVC-${e.employeeNumber}`, signedOn: "2025-12-15", fileName: `avc-mandate-${e.employeeNumber}.pdf` };
  const avc = h % 6 === 1 ? { mode: "percent" as const, value: 2 + (h % 4), startDate: "2026-01-01", mandate } : h % 6 === 4 && h % 4 === 0 ? { mode: "fixed" as const, value: 25_000, startDate: "2026-01-01", mandate } : null;
  return {
    employeeId: e.id,
    tin: id.tin ?? "",
    stateOfResidence: normaliseState(e.address?.region),
    pfaCode: pfa.code,
    pfaName: pfa.name,
    rsaPin: id.pensionId ? `PEN${id.pensionId.replace(/\D/g, "").padStart(12, "1")}` : "",
    nhfNumber: id.nhfNumber ?? "",
    nhfEligible: true,
    nhisEnrolled: false,
    annualRentDeclared: rent,
    rentEvidence: rent ? { fileName: `tenancy-agreement-${e.lastName.toLowerCase()}.pdf`, uploadedAt: "2026-01-20" } : null,
    rentEvidenceVerified: rent > 0 && h % 5 !== 0,
    lifeAssurancePremiumAnnual: h % 4 === 0 ? 120_000 : 0,
    mortgageInterestAnnual: 0,
    bankName: bank.bankName ?? "",
    bankCode,
    accountNumber,
    accountName: bank.accountName ?? e.fullName,
    bvn: id.bvn ?? "",
    avc,
  };
}

export function paymentSnapshot(p: EmployeeTaxProfile | undefined | null): PaymentSnapshot {
  return {
    bankName: p?.bankName ?? "",
    bankCode: p?.bankCode ?? "",
    accountNumber: p?.accountNumber ?? "",
    accountName: p?.accountName ?? "",
    tin: p?.tin ?? "",
    rsaPin: p?.rsaPin ?? "",
    pfaName: p?.pfaName ?? "",
    pfaCode: p?.pfaCode ?? "",
    nhfNumber: p?.nhfNumber ?? "",
    stateOfResidence: p?.stateOfResidence ?? "",
  };
}

// ── Lookups ─────────────────────────────────────────────────────────────────

/** The structure in force on `date`. Never falls forward to a future-dated version. */
export function structureOn(structures: SalaryStructure[], employeeId: string, date: string): SalaryStructure | null {
  const mine = structures.filter((s) => s.employeeId === employeeId && s.effectiveFrom <= date && (s.status ?? "approved") === "approved");
  return (
    mine.filter((s) => !s.effectiveTo || s.effectiveTo >= date).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ??
    mine.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ??
    null
  );
}

/** Employees paid in a regular period: started by its end, not gone before its start. */
export function eligibleForPeriod(e: LocaleEmployee, period: PayPeriod, settings: PayrollSettings): boolean {
  if (ruleFor(settings, e.employmentTypeId).excluded) return false;
  if (e.startDate > period.end) return false;
  if (e.dateOfLeaving && e.dateOfLeaving < period.start) return false;
  if (e.status === "terminated" && !e.dateOfLeaving) return false;
  return true;
}

/** Off-cycle runs can also pay people who left recently (final settlement, missed pay). */
export function eligibleForOffCycle(e: LocaleEmployee, period: PayPeriod, settings: PayrollSettings): boolean {
  if (eligibleForPeriod(e, period, settings)) return true;
  if (!e.dateOfLeaving || ruleFor(settings, e.employmentTypeId).excluded) return false;
  const cutoff = new Date(`${period.start}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 180);
  return e.dateOfLeaving >= cutoff.toISOString().slice(0, 10);
}

/** The previous REGULAR finalized computation for an employee — for variance and insights. */
export function previousComputation(
  data: Pick<TenantPayrollData, "payslips">,
  employeeId: string,
  period: PayPeriod,
  excludeRunId?: string,
): PayComputation | null {
  const key = period.year * 100 + period.month;
  const prior = data.payslips
    .filter((p) => p.employeeId === employeeId && p.status === "final" && p.runType === "regular" && p.runId !== excludeRunId && p.period.year * 100 + p.period.month < key)
    .sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month));
  return prior[0]?.computation ?? null;
}

/** The previous finalized regular run's payment snapshot for an employee — to spot bank changes. */
export function previousSnapshot(data: Pick<TenantPayrollData, "runs">, employeeId: string, period: PayPeriod): PaymentSnapshot | null {
  const key = period.year * 100 + period.month;
  const run = data.runs
    .filter((r) => r.type === "regular" && (r.status === "finalized" || r.status === "disbursed") && r.period.year * 100 + r.period.month < key)
    .sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month))
    .find((r) => r.employees.some((e) => e.employeeId === employeeId && e.included && e.snapshot));
  return run?.employees.find((e) => e.employeeId === employeeId)?.snapshot ?? null;
}

/**
 * Year to date before a run: the opening balance plus every final payslip in
 * the same tax year up to and including this month (off-cycle runs already
 * paid this month count), excluding the run being calculated.
 */
export function ytdBefore(
  data: Pick<TenantPayrollData, "payslips" | "openingYtd">,
  employeeId: string,
  period: PayPeriod,
  excludeRunId?: string,
): YtdTotals | null {
  const rows = data.payslips
    .filter(
      (p) =>
        p.employeeId === employeeId &&
        p.status === "final" &&
        p.runId !== excludeRunId &&
        p.period.year === period.year &&
        p.period.month <= period.month &&
        p.computation.period,
    )
    .map((p) => p.computation.period);
  const opening = data.openingYtd[employeeId];
  if (!rows.length && !(opening && opening.year === period.year)) return null;
  return sumYtd(period.year, rows, opening);
}

// ── Period inputs gathered from other modules ───────────────────────────────

/** An expense claim as the Expenses module holds it (only what payroll needs). */
export interface PayableExpense {
  id: string;
  employeeId?: string;
  amount: number;
  status: string;
  dateSubmitted: string;
  title: string;
}

export interface InputSources {
  loans: LocaleLoan[];
  bundle: LocaleBundle;
  /** Claims from the Expenses module. Approved, not yet reimbursed claims are paid with salary. */
  expenses: PayableExpense[];
  /** Expense claim ids already paid through an earlier run. */
  paidExpenseIds: Set<string>;
  /** Current monthly basic per employee (from the salary structure). */
  basicFor: (employeeId: string) => number;
  /** True when the employee's payroll profile sets a voluntary pension — it replaces any AVC on the HR record. */
  hasProfileAvc?: (employeeId: string) => boolean;
  /** The employee's salary lines in force for the period (for leave allowance on basic / BHT / gross). */
  linesFor?: (employeeId: string) => SalaryLine[];
  /** Leave allowance already paid in this tax year (an earlier payslip, or the previous payroll). */
  leaveAllowancePaid?: (employeeId: string, year: number) => boolean;
  /** Arrears owed from back-dated salary changes, per employee. */
  backPayFor?: (employeeId: string) => { amount: number; refId: string; description: string }[];
  today: Date;
}

export interface GatherResult {
  inputs: PeriodInput[];
  /** Records the payroll deliberately didn't pay — surfaced as warnings, never dropped silently. */
  notes: { employeeId: string; message: string }[];
}

const monthKey = (iso: string) => iso.slice(0, 7);

export function gatherInputs(
  e: LocaleEmployee,
  period: PayPeriod,
  settings: PayrollSettings,
  src: InputSources,
  /** `history`: seeding past months. `demo`: add the demo tenant's illustrative variable pay. */
  opts: { history?: boolean; demo?: boolean } = {},
): GatherResult {
  const out: PeriodInput[] = [];
  const notes: GatherResult["notes"] = [];
  const pk = `${period.year}-${String(period.month).padStart(2, "0")}`;
  const mk = (code: string, rest: Partial<PeriodInput>): PeriodInput => ({
    id: `IN-${e.id}-${pk}-${code}-${out.length}`,
    employeeId: e.id,
    code,
    source: "auto",
    ...rest,
  });

  // Loans repaid through payroll
  if (settings.deductLoansViaPayroll) {
    for (const loan of src.loans.filter((l) => l.employeeId === e.id && (l.status === "active" || l.status === "defaulted"))) {
      const schedule = repaymentSchedule(loan, src.today);
      const inst = opts.history
        ? schedule.find((i) => monthKey(i.dueDate) === pk)
        : schedule.find((i) => i.status !== "paid" && i.dueDate <= period.end);
      if (!inst) continue;
      const outstanding = round2(loan.amount - loan.amountRepaid);
      const amount = opts.history ? inst.amount : Math.min(inst.amount, outstanding);
      if (amount <= 0) continue;
      out.push(
        mk(LOAN_ELEMENT_BY_TYPE[loan.loanType] ?? "STAFF_LOAN", {
          amount,
          source: "loan",
          refId: loan.id,
          description: `${loanTypeLabel(loan.loanType)} · instalment ${inst.number} of ${schedule.length} · ₦${Math.round(inst.balanceAfter).toLocaleString("en-NG")} left after`,
        }),
      );
    }
  }

  // Approved, unpaid expense claims — any date up to the period end.
  if (settings.payExpensesViaPayroll && !opts.history) {
    for (const x of src.expenses) {
      if (x.employeeId !== e.id || x.status !== "approved" || src.paidExpenseIds.has(x.id)) continue;
      if (x.dateSubmitted.slice(0, 10) > period.end) continue;
      out.push(mk("EXPENSE_REIMB", { amount: x.amount, source: "expense", refId: x.id, description: `Expense: ${x.title}` }));
    }
  }

  // Recurring deductions and one-off items on the employee record
  const rec = src.bundle as unknown as {
    /** `code` is set on deductions imported through the starter template: the pay element is known, no guessing. */
    recurringDeductions?: { employeeId: string; label: string; amount: number; frequency: string; startDate: string; endDate?: string; code?: string }[];
    oneTimePayments?: { id: string; employeeId: string; label: string; amount: number; date: string }[];
    oneTimeDeductions?: { id: string; employeeId: string; label: string; amount: number; date: string }[];
  };
  const monthlyBasic = src.basicFor(e.id);
  const monthlyPay = e.salary.amount / 12;
  for (const d of rec.recurringDeductions ?? []) {
    if (d.employeeId !== e.id || d.frequency !== "monthly" || d.startDate > period.end) continue;
    if (d.endDate && d.endDate < period.start) continue;
    if (d.code) {
      out.push(mk(d.code, { amount: d.amount, description: d.label }));
      continue;
    }
    const isVoluntaryPension = /pension avc|voluntary pension|additional voluntary/i.test(d.label);
    // The payroll profile's AVC is the one that counts; the engine adds it.
    if (isVoluntaryPension && src.hasProfileAvc?.(e.id)) continue;
    // Loans come from the Loans module; statutory pension and health insurance
    // are calculated by the engine — never deduct them twice.
    // These records describe deductions payroll already makes itself (the
    // statutory pension, health insurance, PAYE, NHF, or a Loans-module loan),
    // so skipping them is correct — informational, not a warning.
    if (!isVoluntaryPension && /loan|pension contribution|health insurance|paye|\btax\b|nhf/i.test(d.label)) continue;
    if (d.amount > monthlyPay * 0.1) {
      notes.push({ employeeId: e.id, message: `“${d.label}” (₦${Math.round(d.amount).toLocaleString("en-NG")}/month) is over 10% of pay and was held back for review.` });
      continue;
    }
    const code = isVoluntaryPension ? "VOL_PENSION" : /union/i.test(d.label) ? "UNION_DUES" : /cooperative/i.test(d.label) ? "COOP_CONTRIB" : "OTHER_DED";
    out.push(mk(code, { amount: d.amount, description: d.label }));
  }
  for (const p of rec.oneTimePayments ?? []) {
    if (p.employeeId !== e.id || monthKey(p.date) !== pk) continue;
    out.push(mk("ONE_OFF", { amount: p.amount, description: p.label }));
  }
  for (const d of rec.oneTimeDeductions ?? []) {
    if (d.employeeId !== e.id || monthKey(d.date) !== pk) continue;
    out.push(mk("OTHER_DED", { amount: d.amount, description: d.label }));
  }

  // Back pay from back-dated salary changes (arrears for months already paid at the old rate)
  if (!opts.history) {
    for (const b of src.backPayFor?.(e.id) ?? []) {
      if (b.amount > 0) out.push(mk("BACK_PAY", { amount: b.amount, source: "adjustment", refId: b.refId, description: b.description }));
    }
  }

  // Leave allowance — per the company policy, once per tax year
  const la = leaveAllowanceFor({
    startDate: e.startDate,
    period,
    settings,
    lines: src.linesFor?.(e.id) ?? (monthlyBasic ? [{ code: "BASIC", amount: monthlyBasic }] : []),
  });
  if (la && !src.leaveAllowancePaid?.(e.id, period.year)) out.push(mk("LEAVE_ALLOW", { amount: la.amount, description: la.description }));

  // Demo tenant only: illustrative variable pay so the seeded history looks
  // like a real company's. Never added to runs people create themselves.
  if (opts.demo) {
    const h = hashNum(`${e.id}-${pk}`);
    if (/engineer|devops|support/i.test(e.jobTitle) && h % 3 === 0) out.push(mk("OT_NORMAL", { units: 4 + (h % 9), source: "attendance" }));
    if (/sales|growth|marketer/i.test(e.jobTitle) && h % 2 === 0) out.push(mk("COMMISSION", { amount: 50_000 + (h % 6) * 25_000 }));
    if (period.month === 9 && h % 4 === 0) out.push(mk("PERFORMANCE_BONUS", { amount: round2(monthlyBasic * 12 * 0.05), description: "H1 performance bonus" }));
    if (h % 17 === 0) out.push(mk("UNPAID_LEAVE", { units: 1 + (h % 2), source: "attendance" }));
  }
  return { inputs: out, notes };
}

const BASIS_LABEL = { basic: "annual basic", bht: "annual basic + housing + transport", gross: "annual gross" } as const;

/**
 * The leave allowance due in `period` under the company policy, or null.
 * Anniversary: the month the employee joined, from their first anniversary.
 * Fixed month: everyone employed by then, pro-rated in the year they joined
 * when the policy says so.
 */
export function leaveAllowanceFor(args: {
  startDate: string;
  period: Pick<PayPeriod, "year" | "month" | "start" | "end">;
  settings: PayrollSettings;
  lines: SalaryLine[];
}): { amount: number; description: string } | null {
  const p = leaveAllowanceOf(args.settings);
  if (p.mode === "none" || p.ratePct <= 0) return null;
  const sum = (codes: string[] | null) => args.lines.filter((l) => !codes || codes.includes(l.code)).reduce((s, l) => s + l.amount, 0);
  const monthly = p.basis === "gross" ? sum(null) : sum(p.basis === "bht" ? ["BASIC", "CONSOLIDATED", "HOUSING", "TRANSPORT"] : ["BASIC", "CONSOLIDATED"]);
  if (monthly <= 0) return null;
  const full = (monthly * 12 * p.ratePct) / 100;
  const label = `Annual leave allowance (${p.ratePct}% of ${BASIS_LABEL[p.basis]})`;
  if (p.mode === "anniversary") {
    if (Number(args.startDate.slice(5, 7)) !== args.period.month || args.startDate >= args.period.start) return null;
    return { amount: round2(full), description: label };
  }
  if (args.period.month !== p.month || args.startDate > args.period.end) return null;
  if (p.prorateFirstYear && Number(args.startDate.slice(0, 4)) === args.period.year) {
    const months = 12 - Number(args.startDate.slice(5, 7)) + 1;
    return { amount: round2((full * months) / 12), description: `${label}, pro-rated ${months}/12 for joining in ${args.period.year}` };
  }
  return { amount: round2(full), description: label };
}

function attendanceFor(e: LocaleEmployee, period: PayPeriod, inputs: PeriodInput[], bundle: LocaleBundle): AttendanceSnapshot {
  const workingDays = workingDaysBetween(period.start, period.end);
  const factor = prorationFactor(period, e, "working_days");
  const unpaid = inputs.filter((i) => i.code === "UNPAID_LEAVE").reduce((s, i) => s + (i.units ?? 0), 0);
  const paid = (bundle.leaveRequests ?? [])
    .filter((r) => r.employeeId === e.id && r.status === "approved" && r.startDate <= period.end && r.endDate >= period.start)
    .reduce((s, r) => s + Math.min(r.days ?? 0, workingDays), 0);
  const ot = inputs.filter((i) => i.code.startsWith("OT_")).reduce((s, i) => s + (i.units ?? 0), 0);
  return {
    workingDays,
    daysWorked: Math.max(0, Math.round(workingDays * factor) - unpaid - paid),
    paidLeaveDays: paid,
    unpaidLeaveDays: unpaid,
    overtimeHours: ot,
  };
}

// ── Calculating a run ───────────────────────────────────────────────────────

export function engineEmployee(e: LocaleEmployee) {
  return {
    id: e.id,
    startDate: e.startDate,
    dateOfLeaving: e.dateOfLeaving ?? null,
    employmentTypeId: e.employmentTypeId,
    weeklyHours: e.workPattern?.weeklyHours ?? 40,
  };
}

/** (Re)computes every included employee of a draft run, snapshotting bank details as of now. */
export function calculateRun(run: PayrollRun, data: TenantPayrollData, bundle: LocaleBundle): PayrollRun {
  // Every rule as it stood in the period being paid, not as it is today — so re-running
  // September 2026 in January 2027 uses September's elements, rates and settings.
  const date = run.period.end;
  const elements = elementMapOn(data.elements, date);
  const rateSet = resolveRateSet(data.rateSets, date);
  const settings = settingsOn(data.settings, data.settingsVersions, date);
  const people = new Map(bundle.employees.map((e) => [e.id, e]));
  const profiles = new Map(data.profiles.map((p) => [p.employeeId, p]));

  const employees: RunEmployee[] = run.employees.map((re) => {
    const e = people.get(re.employeeId);
    if (!e || !re.included) return { ...re, computation: null };
    const inputs = run.inputs.filter((i) => i.employeeId === re.employeeId);
    const computation = computeEmployeePay({
      period: run.period,
      runType: run.type,
      employee: engineEmployee(e),
      // Off-cycle and adjustment runs don't pay the structure, but use it for rates.
      structure: structureOn(data.structures, e.id, run.period.end),
      elements,
      inputs,
      profile: profiles.get(e.id) ?? null,
      rateSet,
      settings,
      ytd: ytdBefore(data, re.employeeId, run.period, run.id),
      manual: re.mode === "manual" && re.manualLines ? { lines: re.manualLines, statutory: re.manualStatutory ?? "recalculate" } : undefined,
    });
    return {
      ...re,
      computation,
      attendance: attendanceFor(e, run.period, inputs, bundle),
      snapshot: paymentSnapshot(profiles.get(e.id)),
    };
  });
  const next = { ...run, employees, calculatedAt: new Date().toISOString(), stale: undefined };
  return { ...next, totals: runTotals(next) };
}

export function runTotals(run: Pick<PayrollRun, "employees">): PayrollRunTotals {
  const t: PayrollRunTotals = { employees: 0, gross: 0, deductions: 0, net: 0, paye: 0, pensionEmployee: 0, pensionEmployer: 0, nhf: 0, employerCost: 0 };
  for (const re of run.employees) {
    const c = re.computation;
    if (!re.included || !c) continue;
    const amt = (code: string) => c.lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0);
    t.employees += 1;
    t.gross += c.gross;
    t.deductions += c.totalDeductions;
    t.net += c.net;
    t.paye += amt("PAYE");
    t.pensionEmployee += amt("PENSION_EE");
    t.pensionEmployer += amt("PENSION_ER");
    t.nhf += amt("NHF");
    t.employerCost += c.employerCost;
  }
  for (const k of Object.keys(t) as (keyof PayrollRunTotals)[]) t[k] = round2(t[k]);
  return t;
}

export interface NewRunArgs {
  tenantId: string;
  type: PayrollRun["type"];
  period: PayPeriod;
  preparedBy: RunActor;
  bundle: LocaleBundle;
  data: TenantPayrollData;
  loans: LocaleLoan[];
  expenses?: PayableExpense[];
  today: Date;
  parentRunId?: string;
  adjustsPeriod?: PayPeriod;
  history?: boolean;
  demo?: boolean;
  id?: string;
}

export function newRun(args: NewRunArgs): PayrollRun {
  const { tenantId, type, period, preparedBy, bundle, data } = args;
  const paidExpenseIds = new Set(
    data.runs
      .filter((r) => r.status === "finalized" || r.status === "disbursed")
      .flatMap((r) => r.inputs.filter((i) => i.source === "expense" && i.refId).map((i) => i.refId!)),
  );
  const people = bundle.employees.filter((e) =>
    type === "regular" ? eligibleForPeriod(e, period, data.settings) : eligibleForOffCycle(e, period, data.settings),
  );
  const basicFor = (id: string) => {
    const s = structureOn(data.structures, id, period.end);
    return s?.lines.find((l) => l.code === "BASIC" || l.code === "CONSOLIDATED")?.amount ?? 0;
  };
  const backPayFor = (employeeId: string) => backPayOwed(data, employeeId, period);
  const linesFor = (id: string) => structureOn(data.structures, id, period.end)?.lines ?? [];
  const leaveAllowancePaid = (id: string, year: number) =>
    data.profiles.find((p) => p.employeeId === id)?.leaveAllowancePaidYear === year ||
    data.payslips.some((p) => p.employeeId === id && p.status === "final" && p.period.year === year && p.computation.lines.some((l) => l.code === "LEAVE_ALLOW" && l.amount > 0));
  const gathered =
    type === "regular"
      ? people.map((e) =>
          gatherInputs(
            e,
            period,
            data.settings,
            { loans: args.loans, bundle, expenses: args.expenses ?? [], paidExpenseIds, basicFor, backPayFor, linesFor, leaveAllowancePaid, hasProfileAvc: (id) => !!data.profiles.find((p) => p.employeeId === id)?.avc?.value, today: args.today },
            { history: args.history, demo: args.demo },
          ),
        )
      : [];
  const seq = data.runs.filter((r) => r.period.year === period.year && r.period.month === period.month && r.id !== args.id).length + 1;
  const title =
    type === "regular"
      ? `${period.label} Payroll`
      : type === "off_cycle"
        ? `${period.label} Off-cycle Payroll`
        : `Adjustment to ${args.adjustsPeriod?.label ?? period.label} (paid ${period.label})`;
  const tag = type === "regular" ? "R" : type === "off_cycle" ? "O" : "A";
  const run: PayrollRun = {
    id: args.id ?? `${tenantPrefix(tenantId)}-PR-${period.year}${String(period.month).padStart(2, "0")}-${tag}${seq}-${Date.now().toString(36).toUpperCase().slice(-4)}`,
    tenantId,
    type,
    period,
    title,
    status: "draft",
    seq,
    employees: people.map((e) => ({
      employeeId: e.id,
      included: type === "regular",
      mode: "auto",
      computation: null,
      attendance: { workingDays: 0, daysWorked: 0, paidLeaveDays: 0, unpaidLeaveDays: 0, overtimeHours: 0 },
    })),
    inputs: gathered.flatMap((g) => g.inputs),
    inputNotes: gathered.flatMap((g) => g.notes),
    exceptions: [],
    totals: { employees: 0, gross: 0, deductions: 0, net: 0, paye: 0, pensionEmployee: 0, pensionEmployer: 0, nhf: 0, employerCost: 0 },
    preparedBy,
    createdAt: new Date().toISOString(),
    parentRunId: args.parentRunId,
    adjustsPeriod: args.adjustsPeriod,
  };
  return calculateRun(run, data, bundle);
}

/**
 * Arrears from approved salary versions dated before `period` that earlier
 * finalized months paid at the old rate. Each version's arrears are paid
 * once: a finalized run carrying a BACK_PAY input for it settles it.
 */
export function backPayOwed(data: Pick<TenantPayrollData, "structures" | "runs" | "elements">, employeeId: string, period: PayPeriod) {
  const locked = data.runs.filter((r) => r.status === "finalized" || r.status === "disbursed");
  const settled = new Set(locked.flatMap((r) => r.inputs.filter((i) => i.code === "BACK_PAY" && i.refId).map((i) => i.refId!)));
  const recurring = new Set(data.elements.filter((e) => e.recurring && e.category === "earning").map((e) => e.code));
  const out: { amount: number; refId: string; description: string }[] = [];
  for (const s of data.structures) {
    if (s.employeeId !== employeeId || (s.status ?? "approved") !== "approved" || s.effectiveFrom >= period.start || settled.has(s.id)) continue;
    if (s.approvedBy === "System") continue; // opening structures, not a raise
    const monthly = s.lines.reduce((t, l) => t + l.amount, 0);
    let arrears = 0;
    const months: string[] = [];
    for (const r of locked) {
      if (r.type !== "regular" || r.period.end < s.effectiveFrom || r.period.start >= period.start) continue;
      const re = r.employees.find((e) => e.employeeId === employeeId && e.included && e.computation);
      if (!re?.computation) continue;
      const paid = re.computation.lines.filter((l) => recurring.has(l.code) && l.amount > 0).reduce((t, l) => t + l.amount, 0);
      const from = s.effectiveFrom > r.period.start ? s.effectiveFrom : r.period.start;
      const share = (Date.parse(r.period.end) - Date.parse(from) + 86_400_000) / (Date.parse(r.period.end) - Date.parse(r.period.start) + 86_400_000);
      const owed = round2(monthly * share * re.computation.prorationFactor - paid * share);
      if (owed > 0) {
        arrears += owed;
        months.push(r.period.label.split(" ")[0].slice(0, 3));
      }
    }
    if (arrears > 0) out.push({ amount: round2(arrears), refId: s.id, description: `Arrears from ${s.effectiveFrom} (${months.join(", ")}) · ${s.reason}` });
  }
  return out;
}

// ── Payslips ────────────────────────────────────────────────────────────────

export function companySnapshot(bundle: LocaleBundle): PayslipCompanySnapshot {
  const cp = bundle.companyProfile as {
    legalName?: string;
    registrationNumber?: string;
    taxId?: string;
    headquarters?: { addressLines?: string[]; city?: string; region?: string; country?: string };
  };
  const hq = cp.headquarters;
  return {
    legalName: cp.legalName ?? bundle.tenant.name,
    tradingName: bundle.tenant.name,
    registrationNumber: cp.registrationNumber ?? "",
    taxId: cp.taxId ?? "",
    address: hq ? [...(hq.addressLines ?? []), hq.city, hq.region].filter(Boolean).join(", ") : "",
    logoUrl: bundle.tenant.logoUrl,
    primaryColor: bundle.tenant.primaryColor,
    currency: bundle.tenant.currency,
    currencySymbol: bundle.tenant.currencySymbol,
  };
}

const mask = (acct: string) => (acct ? `•••• ${acct.slice(-4)}` : "—");

/** What the verification fingerprint covers: every figure plus where the money went. */
export function payslipHashPayload(p: Pick<Payslip, "reference" | "tenantId" | "employeeId" | "runId" | "runType" | "period" | "computation" | "employee">) {
  return canonicalJson({
    reference: p.reference,
    tenant: p.tenantId,
    employee: p.employeeId,
    run: p.runId,
    runType: p.runType,
    period: `${p.period.year}-${p.period.month}`,
    lines: p.computation.lines.map((l) => [l.code, l.category, l.amount]),
    gross: p.computation.gross,
    deductions: p.computation.totalDeductions,
    net: p.computation.net,
    ytd: [p.computation.ytd.gross, p.computation.ytd.paye, p.computation.ytd.net],
    paidTo: [p.employee.bankName, p.employee.accountMasked],
  });
}

export function payslipReference(run: Pick<PayrollRun, "period" | "seq" | "type">, index: number): string {
  const seq = run.seq ?? 1;
  const runPart = run.type === "regular" && seq === 1 ? "" : `${String(seq).padStart(2, "0")}-`;
  return `PSL-${run.period.year}-${String(run.period.month).padStart(2, "0")}-${runPart}${String(index + 1).padStart(4, "0")}`;
}

export function buildPayslips(args: {
  run: PayrollRun;
  bundle: LocaleBundle;
  data: TenantPayrollData;
  status: Payslip["status"];
  approvedBy: string | null;
  generatedAt: string;
}): Payslip[] {
  const { run, bundle, data, status } = args;
  const people = new Map(bundle.employees.map((e) => [e.id, e]));
  const profiles = new Map(data.profiles.map((p) => [p.employeeId, p]));
  const types = new Map(bundle.employmentTypes.map((t) => [t.id, t.name]));
  const company = companySnapshot(bundle);
  const balances = (bundle.leaveBalances ?? []) as { employeeId: string; leavePolicyId: string; entitlement: number; used: number; remaining: number; year: number }[];

  return run.employees
    .filter((re) => re.included && re.computation)
    .map((re, i) => {
      const e = people.get(re.employeeId)!;
      // Pay details as approved (the run's frozen snapshot), not as edited since.
      const pay = re.snapshot ?? paymentSnapshot(profiles.get(re.employeeId));
      const lb = balances.find((b) => b.employeeId === re.employeeId && b.leavePolicyId === "LP-01");
      const leave = lb ? { entitlement: lb.entitlement, used: lb.used, remaining: lb.remaining, yearLabel: String(run.period.year) } : null;
      const computation = re.computation!;
      const employee = {
        id: e.id,
        employeeNumber: e.employeeNumber,
        fullName: e.fullName,
        jobTitle: e.jobTitle,
        departmentName: e.departmentName,
        grade: e.grade ?? "",
        employmentType: types.get(e.employmentTypeId) ?? e.employmentTypeId,
        startDate: e.startDate,
        email: e.email,
        bankName: pay.bankName,
        accountMasked: mask(pay.accountNumber),
        tin: pay.tin,
        rsaPin: pay.rsaPin,
        pfaName: pay.pfaName,
        stateOfResidence: pay.stateOfResidence,
      };
      const base = {
        reference: payslipReference(run, i),
        tenantId: run.tenantId,
        employeeId: re.employeeId,
        runId: run.id,
        runType: run.type,
        period: run.period,
        computation,
        employee,
      };
      const hash = sha256Hex(payslipHashPayload(base));
      return {
        ...base,
        id: `${run.id}-${re.employeeId}`,
        status,
        company,
        attendance: re.attendance,
        leave,
        insights: buildInsights({
          current: computation,
          previous: run.type === "regular" ? previousComputation(data, re.employeeId, run.period, run.id) : null,
          leave,
          periodMonth: run.period.month,
          companyName: company.tradingName,
        }).filter((x) => data.settings.payslip.insights[x.type]),
        verification: { code: verificationCodeFrom(hash), hash, revoked: false },
        approvedBy: args.approvedBy,
        generatedAt: args.generatedAt,
        display: data.settings.payslip,
      } satisfies Payslip;
    });
}

// ── Demo history ────────────────────────────────────────────────────────────

/**
 * Seeds a believable payroll history: Jan–(current−4) brought forward as
 * opening YTD (as if migrated from a previous system), the three months
 * before the current one as finalized runs with payslips, and the current
 * month as a calculated draft ready for review.
 */
export function seedHistory(args: {
  tenantId: string;
  bundle: LocaleBundle;
  base: Omit<TenantPayrollData, "runs" | "payslips" | "openingYtd" | "openingMonths">;
  loans: LocaleLoan[];
  today: Date;
}): Pick<TenantPayrollData, "runs" | "payslips" | "openingYtd" | "openingMonths"> {
  const { tenantId, bundle, base, loans, today } = args;
  const year = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth() + 1;
  const role = (id: string) => bundle.roles.find((r) => r.id === id);
  const nameOf = (id?: string) => bundle.employees.find((e) => e.id === id)?.fullName ?? "System";
  const hr = role("ROLE-HRADMIN");
  const fin = role("ROLE-FIN");
  const exec = role("ROLE-EXEC");
  const preparer: RunActor = { employeeId: hr?.linkedEmployeeId ?? "", name: nameOf(hr?.linkedEmployeeId) };
  const approver: RunActor = { employeeId: exec?.linkedEmployeeId ?? fin?.linkedEmployeeId ?? "", name: nameOf(exec?.linkedEmployeeId ?? fin?.linkedEmployeeId) };
  const approvedByLine = [fin && `${nameOf(fin.linkedEmployeeId)} (Finance)`, exec && `${nameOf(exec.linkedEmployeeId)} (Executive)`].filter(Boolean).join(" · ");

  const data: TenantPayrollData = { ...base, runs: [], payslips: [], openingYtd: {} };
  const openingMonths: OpeningMonths = {};
  const finalizedFrom = Math.max(1, currentMonth - 3);
  const prefix = tenantPrefix(tenantId);

  // Opening balances: months before the first finalized run, computed silently.
  for (let m = 1; m < finalizedFrom; m++) {
    const period = makePeriod(year, m, base.settings.payDay);
    const run = newRun({ tenantId, type: "regular", period, preparedBy: preparer, bundle, data, loans, today, history: true, demo: true, id: `OPEN-${m}` });
    for (const re of run.employees) {
      if (!re.computation) continue;
      data.openingYtd[re.employeeId] = re.computation.ytd;
      // Keep each month, so the balance can be explained line by line (client feedback A1).
      (openingMonths[re.employeeId] ??= []).push({ figures: re.computation.period, lines: re.computation.lines });
    }
  }

  for (let m = finalizedFrom; m <= currentMonth; m++) {
    const period = makePeriod(year, m, base.settings.payDay);
    const id = `${prefix}-PR-${year}${String(m).padStart(2, "0")}-R1`;
    const run = newRun({ tenantId, type: "regular", period, preparedBy: preparer, bundle, data, loans, today, history: m < currentMonth, demo: true, id });
    run.createdAt = `${period.start}T09:00:00.000Z`;
    if (m === currentMonth) {
      data.runs.push(run);
      continue;
    }
    const approvedAt = `${year}-${String(m).padStart(2, "0")}-${String(Math.min(22, base.settings.payDay - 3)).padStart(2, "0")}T14:30:00.000Z`;
    const finalized: PayrollRun = {
      ...run,
      status: "disbursed",
      submittedAt: approvedAt,
      approvedBy: approver,
      approvedAt,
      finalizedBy: preparer,
      finalizedAt: approvedAt,
      disbursedAt: `${period.payDate}T08:00:00.000Z`,
    };
    data.runs.push(finalized);
    data.payslips.push(...buildPayslips({ run: finalized, bundle, data, status: "final", approvedBy: approvedByLine || approver.name, generatedAt: approvedAt }));
  }
  return { runs: data.runs, payslips: data.payslips, openingYtd: data.openingYtd, openingMonths };
}
