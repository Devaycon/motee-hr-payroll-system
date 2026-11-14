import type { LocaleBundle, LocaleEmployee, LocaleLoan } from "@/src/lib/types/locale";
import { repaymentSchedule, loanTypeLabel } from "@/src/lib/loans/loans";
import { LOAN_ELEMENT_BY_TYPE, elementMap } from "./elements-seed";
import { computeEmployeePay, makePeriod, prorationFactor, round2, splitSalary, sumYtd, workingDaysBetween } from "./ng/engine";
import { resolveRateSet, ruleFor } from "./ng/rate-sets";
import { buildInsights } from "./insights";
import { canonicalJson, sha256Hex, verificationCodeFrom } from "./hash";
import type {
  AttendanceSnapshot,
  EmployeeTaxProfile,
  PayComputation,
  PayElement,
  PayPeriod,
  PayrollRun,
  PayrollRunTotals,
  PayrollSettings,
  Payslip,
  PayslipCompanySnapshot,
  PeriodInput,
  RunActor,
  RunEmployee,
  SalaryStructure,
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
  structures: SalaryStructure[];
  profiles: EmployeeTaxProfile[];
  runs: PayrollRun[];
  payslips: Payslip[];
  /** YTD brought forward from the previous payroll system, per employee. */
  openingYtd: Record<string, YtdTotals>;
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
  // About half the staff rent; one declaration is left unverified so the
  // "rent evidence" warning has something to show.
  const rents = h % 2 === 0;
  const rent = rents ? 600_000 + (h % 7) * 150_000 : 0;
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
    bankCode: NG_BANK_CODES[bank.bankName ?? ""] ?? "",
    accountNumber: bank.accountNumber ?? "",
    accountName: bank.accountName ?? e.fullName,
    bvn: id.bvn ?? "",
  };
}

// ── Lookups ─────────────────────────────────────────────────────────────────

export function structureOn(structures: SalaryStructure[], employeeId: string, date: string): SalaryStructure | null {
  return (
    structures
      .filter((s) => s.employeeId === employeeId && s.effectiveFrom <= date && (!s.effectiveTo || s.effectiveTo >= date))
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ??
    structures
      .filter((s) => s.employeeId === employeeId)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ??
    null
  );
}

/** Employees paid in a period: started by its end, not gone before its start. */
export function eligibleForPeriod(e: LocaleEmployee, period: PayPeriod, settings: PayrollSettings): boolean {
  if (ruleFor(settings, e.employmentTypeId).excluded) return false;
  if (e.startDate > period.end) return false;
  if (e.dateOfLeaving && e.dateOfLeaving < period.start) return false;
  if (e.status === "terminated" && !e.dateOfLeaving) return false;
  return true;
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
    .filter(
      (p) =>
        p.employeeId === employeeId &&
        p.status === "final" &&
        p.runType === "regular" &&
        p.runId !== excludeRunId &&
        p.period.year * 100 + p.period.month < key,
    )
    .sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month));
  return prior[0]?.computation ?? null;
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

export interface InputSources {
  loans: LocaleLoan[];
  bundle: LocaleBundle;
  /** Expense claim ids already paid through an earlier run. */
  paidExpenseIds: Set<string>;
  today: Date;
}

const monthKey = (iso: string) => iso.slice(0, 7);

export function gatherInputs(
  e: LocaleEmployee,
  period: PayPeriod,
  settings: PayrollSettings,
  src: InputSources,
  opts: { history?: boolean } = {},
): PeriodInput[] {
  const out: PeriodInput[] = [];
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

  // Approved expense claims reimbursed with pay
  if (settings.payExpensesViaPayroll) {
    for (const x of src.bundle.expenses ?? []) {
      if (x.employeeId !== e.id || x.status !== "approved" || src.paidExpenseIds.has(x.id)) continue;
      if (monthKey(x.date) !== pk) continue;
      out.push(mk("EXPENSE_REIMB", { amount: x.amount, source: "expense", refId: x.id, description: `Expense: ${x.description}` }));
    }
  }

  // One-off payments / deductions and recurring deductions on the employee record
  const rec = src.bundle as unknown as {
    recurringDeductions?: { employeeId: string; label: string; amount: number; frequency: string; startDate: string }[];
    oneTimePayments?: { id: string; employeeId: string; label: string; amount: number; date: string }[];
    oneTimeDeductions?: { id: string; employeeId: string; label: string; amount: number; date: string }[];
  };
  const monthlyGross = e.salary.amount / 12;
  for (const d of rec.recurringDeductions ?? []) {
    if (d.employeeId !== e.id || d.frequency !== "monthly" || d.startDate > period.end) continue;
    // Loans come from the Loans module; pension and health insurance are
    // statutory lines the engine calculates itself — never double-deduct them.
    if (/loan|pension contribution|health insurance|paye|tax|nhf/i.test(d.label)) continue;
    // Guard against implausible imported records (>10% of pay for a voluntary deduction).
    if (d.amount > monthlyGross * 0.1) continue;
    const code = /pension avc|voluntary pension/i.test(d.label) ? "VOL_PENSION" : /union/i.test(d.label) ? "UNION_DUES" : /cooperative/i.test(d.label) ? "COOP_CONTRIB" : "OTHER_DED";
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

  // Leave allowance — 10% of annual basic, paid in the employee's anniversary month
  const basicAnnual = (e.salary.amount * (settings.defaultSplit.find((s) => s.code === "BASIC")?.pct ?? 50)) / 100;
  if (Number(e.startDate.slice(5, 7)) === period.month && e.startDate < period.start) {
    out.push(mk("LEAVE_ALLOW", { amount: round2(basicAnnual * 0.1), description: "Annual leave allowance (10% of annual basic)" }));
  }

  // Demo variable pay — deterministic so every reload shows the same history
  const h = hashNum(`${e.id}-${pk}`);
  if (/engineer|devops|support/i.test(e.jobTitle) && h % 3 === 0) {
    out.push(mk("OT_NORMAL", { units: 4 + (h % 9), source: "attendance", description: undefined }));
  }
  if (/sales|growth|marketer/i.test(e.jobTitle) && h % 2 === 0) {
    out.push(mk("COMMISSION", { amount: 50_000 + (h % 6) * 25_000 }));
  }
  if (period.month === 9 && h % 4 === 0) {
    out.push(mk("PERFORMANCE_BONUS", { amount: round2(e.salary.amount * 0.05), description: "H1 performance bonus" }));
  }
  if (h % 17 === 0) {
    out.push(mk("UNPAID_LEAVE", { units: 1 + (h % 2), source: "attendance" }));
  }
  return out;
}

function attendanceFor(e: LocaleEmployee, period: PayPeriod, inputs: PeriodInput[], settings: PayrollSettings, bundle: LocaleBundle): AttendanceSnapshot {
  const workingDays = workingDaysBetween(period.start, period.end);
  const factor = prorationFactor(period, e, "working_days");
  const unpaid = inputs.filter((i) => i.code === "UNPAID_LEAVE").reduce((s, i) => s + (i.units ?? 0), 0);
  const paid = (bundle.leaveRequests ?? [])
    .filter((r) => r.employeeId === e.id && r.status === "approved" && r.startDate <= period.end && r.endDate >= period.start)
    .reduce((s, r) => s + Math.min(r.days ?? 0, workingDays), 0);
  const ot = inputs.filter((i) => i.code.startsWith("OT_")).reduce((s, i) => s + (i.units ?? 0), 0);
  void settings;
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

/** (Re)computes every included employee of a draft run. */
export function calculateRun(run: PayrollRun, data: TenantPayrollData, bundle: LocaleBundle): PayrollRun {
  const elements = elementMap(data.elements);
  const rateSet = resolveRateSet(data.rateSets, run.period.end);
  const people = new Map(bundle.employees.map((e) => [e.id, e]));
  const profiles = new Map(data.profiles.map((p) => [p.employeeId, p]));

  const employees: RunEmployee[] = run.employees.map((re) => {
    const e = people.get(re.employeeId);
    if (!e || !re.included) return { ...re, computation: null };
    const inputs = run.inputs.filter((i) => i.employeeId === re.employeeId);
    const ytd = ytdBefore(data, re.employeeId, run.period, run.id);
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
      settings: data.settings,
      ytd,
      manual:
        re.mode === "manual" && re.manualLines
          ? { lines: re.manualLines, statutory: re.manualStatutory ?? "recalculate" }
          : undefined,
    });
    return { ...re, computation, attendance: attendanceFor(e, run.period, inputs, data.settings, bundle) };
  });
  const next = { ...run, employees, calculatedAt: new Date().toISOString() };
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

export function newRun(args: {
  tenantId: string;
  type: PayrollRun["type"];
  period: PayPeriod;
  preparedBy: RunActor;
  bundle: LocaleBundle;
  data: TenantPayrollData;
  loans: LocaleLoan[];
  today: Date;
  parentRunId?: string;
  history?: boolean;
  id?: string;
}): PayrollRun {
  const { tenantId, type, period, preparedBy, bundle, data } = args;
  const paidExpenseIds = new Set(
    data.runs.filter((r) => r.status === "finalized" || r.status === "disbursed").flatMap((r) => r.inputs.filter((i) => i.source === "expense" && i.refId).map((i) => i.refId!)),
  );
  const eligible = bundle.employees.filter((e) => eligibleForPeriod(e, period, data.settings));
  const inputs =
    type === "regular"
      ? eligible.flatMap((e) => gatherInputs(e, period, data.settings, { loans: args.loans, bundle, paidExpenseIds, today: args.today }, { history: args.history }))
      : [];
  const title =
    type === "regular" ? `${period.label} Payroll` : type === "off_cycle" ? `${period.label} Off-cycle Payroll` : `${period.label} Adjustment Run`;
  const run: PayrollRun = {
    id: args.id ?? `PR-${period.year}${String(period.month).padStart(2, "0")}-${type === "regular" ? "R" : type === "off_cycle" ? "O" : "A"}-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    type,
    period,
    title,
    status: "draft",
    employees: eligible.map((e) => ({
      employeeId: e.id,
      included: type === "regular",
      mode: "auto",
      computation: null,
      attendance: { workingDays: 0, daysWorked: 0, paidLeaveDays: 0, unpaidLeaveDays: 0, overtimeHours: 0 },
    })),
    inputs,
    exceptions: [],
    totals: { employees: 0, gross: 0, deductions: 0, net: 0, paye: 0, pensionEmployee: 0, pensionEmployer: 0, nhf: 0, employerCost: 0 },
    preparedBy,
    createdAt: new Date().toISOString(),
    parentRunId: args.parentRunId,
  };
  return calculateRun(run, data, bundle);
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

export function payslipHashPayload(p: Pick<Payslip, "reference" | "tenantId" | "employeeId" | "period" | "computation">) {
  return canonicalJson({
    reference: p.reference,
    tenant: p.tenantId,
    employee: p.employeeId,
    period: `${p.period.year}-${p.period.month}`,
    lines: p.computation.lines.map((l) => [l.code, l.amount]),
    gross: p.computation.gross,
    deductions: p.computation.totalDeductions,
    net: p.computation.net,
  });
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
  const typeTag = run.type === "regular" ? "" : run.type === "off_cycle" ? "OC-" : "ADJ-";

  return run.employees
    .filter((re) => re.included && re.computation)
    .map((re, i) => {
      const e = people.get(re.employeeId)!;
      const p = profiles.get(re.employeeId);
      const lb = balances.find((b) => b.employeeId === re.employeeId && b.leavePolicyId === "LP-01");
      const leave = lb ? { entitlement: lb.entitlement, used: lb.used, remaining: lb.remaining, yearLabel: String(run.period.year) } : null;
      const reference = `PSL-${run.period.year}-${String(run.period.month).padStart(2, "0")}-${typeTag}${String(i + 1).padStart(4, "0")}`;
      const computation = re.computation!;
      const base = { reference, tenantId: run.tenantId, employeeId: re.employeeId, period: run.period, computation };
      const hash = sha256Hex(payslipHashPayload(base));
      return {
        ...base,
        id: `${run.id}-${re.employeeId}`,
        runId: run.id,
        runType: run.type,
        status,
        company,
        employee: {
          id: e.id,
          employeeNumber: e.employeeNumber,
          fullName: e.fullName,
          jobTitle: e.jobTitle,
          departmentName: e.departmentName,
          grade: e.grade ?? "",
          employmentType: types.get(e.employmentTypeId) ?? e.employmentTypeId,
          startDate: e.startDate,
          email: e.email,
          bankName: p?.bankName ?? "",
          accountMasked: mask(p?.accountNumber ?? ""),
          tin: p?.tin ?? "",
          rsaPin: p?.rsaPin ?? "",
          pfaName: p?.pfaName ?? "",
          stateOfResidence: p?.stateOfResidence ?? "",
        },
        attendance: re.attendance,
        leave,
        insights: buildInsights({
          current: computation,
          previous: previousComputation(data, re.employeeId, run.period),
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
 * Seeds a believable payroll history: Jan–Jul 2026 brought forward as opening
 * YTD (as if migrated from a previous system), Aug–Oct as finalized runs with
 * payslips, and the current month as a calculated draft ready for review.
 */
export function seedHistory(args: {
  tenantId: string;
  bundle: LocaleBundle;
  base: Omit<TenantPayrollData, "runs" | "payslips" | "openingYtd">;
  loans: LocaleLoan[];
  today: Date;
}): Pick<TenantPayrollData, "runs" | "payslips" | "openingYtd"> {
  const { tenantId, bundle, base, loans, today } = args;
  const year = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth() + 1;
  const fin = bundle.roles.find((r) => r.id === "ROLE-FIN");
  const hr = bundle.roles.find((r) => r.id === "ROLE-HRADMIN");
  const nameOf = (id?: string) => bundle.employees.find((e) => e.id === id)?.fullName ?? "System";
  const preparer: RunActor = { employeeId: hr?.linkedEmployeeId ?? "", name: nameOf(hr?.linkedEmployeeId) };
  const approver: RunActor = { employeeId: fin?.linkedEmployeeId ?? "", name: nameOf(fin?.linkedEmployeeId) };

  const data: TenantPayrollData = { ...base, runs: [], payslips: [], openingYtd: {} };
  const finalizedFrom = Math.max(1, currentMonth - 3);

  // Opening balances: months before the first finalized run, computed silently.
  for (let m = 1; m < finalizedFrom; m++) {
    const period = makePeriod(year, m, base.settings.payDay);
    const run = newRun({ tenantId, type: "regular", period, preparedBy: preparer, bundle, data, loans, today, history: true, id: `OPEN-${m}` });
    for (const re of run.employees) if (re.computation) data.openingYtd[re.employeeId] = re.computation.ytd;
  }

  for (let m = finalizedFrom; m <= currentMonth; m++) {
    const period = makePeriod(year, m, base.settings.payDay);
    const id = `PR-${year}${String(m).padStart(2, "0")}-R`;
    const run = newRun({ tenantId, type: "regular", period, preparedBy: preparer, bundle, data, loans, today, history: m < currentMonth, id });
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
    data.payslips.push(
      ...buildPayslips({ run: finalized, bundle, data, status: "final", approvedBy: approver.name, generatedAt: approvedAt }),
    );
  }
  return { runs: data.runs, payslips: data.payslips, openingYtd: data.openingYtd };
}
