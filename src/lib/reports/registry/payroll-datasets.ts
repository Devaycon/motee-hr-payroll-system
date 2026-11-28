import { Banknote, Building2, ClipboardCheck, Coins, HandCoins, Landmark, LineChart, PiggyBank, ShieldCheck, TrendingUp, UserRound, Wallet } from "lucide-react";
import type { LocaleBundle, LocaleEmployee, LocaleLoan } from "@/src/lib/types/locale";
import type { TenantPayroll } from "@/src/lib/stores/payroll-slice";
import { repaymentSchedule, loanTypeLabel } from "@/src/lib/loans/loans";
import { compareRuns, defaultPreviousRun, type RunComparison } from "@/src/lib/payroll/comparison";
import { remittanceRows, type RemittanceRow } from "@/src/lib/payroll/remittance-centre";
import { resolveRateSet } from "@/src/lib/payroll/ng/rate-sets";
import { isValidNuban, structureOn } from "@/src/lib/payroll/run-builder";
import { budgetFor, buildForecast } from "@/src/lib/payroll/budget";
import { EXCEPTION_RULE_LABELS } from "@/src/lib/payroll/validation";
import type { EmployeeTaxProfile, PayrollRun, Payslip, PayslipLine, SalaryStructure, StatutoryRateSet } from "@/src/lib/payroll/types";
import { defineReport, type AnyReportDef, type FieldType, type ReportColumn, type ReportContext } from "../types";

/**
 * Payroll datasets for the custom report builders (client feedback B2, Nov
 * 2026 — the field catalogue in the appendix of the feedback document).
 *
 * One governed data layer: every payroll dataset reads the same fact — one
 * FINAL payslip, joined to the employee, their tax & statutory profile, the
 * salary structure in force, the run, loans, remittances and the previous
 * payslip. Because they share that row (`joinGroup: "payroll"`), Report
 * Studio can combine fields from any of them, keyed by employee + period.
 *
 * Values are read from the stored payslip — rates and amounts as they were
 * in that period, never recomputed with today's rules. Pay elements the
 * tenant creates become fields automatically (`dynamicColumns`).
 */

const round2 = (n: number) => Math.round(n * 100) / 100;
const sumLines = (lines: PayslipLine[], pred: (l: PayslipLine) => boolean) => round2(lines.filter(pred).reduce((s, l) => s + l.amount, 0));
const code = (lines: PayslipLine[], ...codes: string[]) => sumLines(lines, (l) => codes.includes(l.code));
const group = (lines: PayslipLine[], ...groups: string[]) => sumLines(lines, (l) => l.category === "earning" && groups.includes(l.group));
const pctOf = (part: number, whole: number) => (whole ? round2((part / whole) * 100) : 0);
const yesNo = (b: boolean) => (b ? "Yes" : "No");
const monthKey = (p: Pick<Payslip, "period">) => `${p.period.year}-${String(p.period.month).padStart(2, "0")}`;
const nextMonthTenth = (p: Pick<Payslip, "period">) => {
  const y = p.period.month === 12 ? p.period.year + 1 : p.period.year;
  const m = p.period.month === 12 ? 1 : p.period.month + 1;
  return `${y}-${String(m).padStart(2, "0")}-10`;
};

// ── The fact ────────────────────────────────────────────────────────────────

export interface PayrollFact {
  p: Payslip;
  c: Payslip["computation"];
  e?: LocaleEmployee;
  prof?: EmployeeTaxProfile;
  run?: PayrollRun;
  rs: StatutoryRateSet;
  structure: SalaryStructure | null;
  /** The structure version before the one in force, if the salary has changed. */
  prevStructure: SalaryStructure | null;
  /** The employee's previous final regular payslip. */
  prev?: Payslip;
  loans: LocaleLoan[];
  remit: (item: string) => RemittanceRow | undefined;
  cmp: () => RunComparison | null;
  ctx: { tenant: LocaleBundle["tenant"]; branches: Map<string, string>; costCentres: Map<string, string>; payroll: TenantPayroll; deptCost: (month: string, dept: string) => number };
}

const cache = new WeakMap<TenantPayroll, { bundle: LocaleBundle; facts: PayrollFact[] }>();

export function payrollFacts(bundle: LocaleBundle, payroll: TenantPayroll | null): PayrollFact[] {
  if (!payroll) return [];
  const hit = cache.get(payroll);
  if (hit && hit.bundle === bundle) return hit.facts;
  const people = new Map(bundle.employees.map((e) => [e.id, e]));
  const profiles = new Map(payroll.profiles.map((p) => [p.employeeId, p]));
  const runs = new Map(payroll.runs.map((r) => [r.id, r]));
  const today = new Date().toISOString().slice(0, 10);
  const remits = new Map(remittanceRows(payroll.runs, payroll.remittances, today).map((r) => [r.key, r]));
  const branches = new Map(((bundle as unknown as { branches?: { id: string; name: string }[] }).branches ?? []).map((b) => [b.id, b.name]));
  const costCentres = new Map(bundle.departments.map((d) => [d.name, d.costCenter]));
  const cmpCache = new Map<string, RunComparison | null>();
  const cmpCtx = { people, elements: payroll.elements, structures: payroll.structures, imports: payroll.imports, audit: payroll.audit, costCentres };
  const final = payroll.payslips.filter((p) => p.status === "final");
  const byEmployee = new Map<string, Payslip[]>();
  for (const p of final) byEmployee.set(p.employeeId, [...(byEmployee.get(p.employeeId) ?? []), p]);
  for (const list of byEmployee.values()) list.sort((a, b) => monthKey(a).localeCompare(monthKey(b)));
  const deptCostMemo = new Map<string, number>();
  const deptCost = (month: string, dept: string) => {
    const k = `${month}|${dept}`;
    if (!deptCostMemo.has(k)) deptCostMemo.set(k, round2(final.filter((p) => monthKey(p) === month && (p.employee.departmentName || "Unassigned") === dept).reduce((s, p) => s + p.computation.gross + p.computation.employerCost, 0)));
    return deptCostMemo.get(k)!;
  };
  const shared = { tenant: bundle.tenant, branches, costCentres, payroll, deptCost };

  const facts = final.map((p): PayrollFact => {
    const mine = byEmployee.get(p.employeeId) ?? [];
    const prev = [...mine].reverse().find((x) => x.runType === "regular" && monthKey(x) < monthKey(p));
    const versions = payroll.structures.filter((s) => s.employeeId === p.employeeId && (s.status ?? "approved") === "approved").sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
    const structure = structureOn(payroll.structures, p.employeeId, p.period.end);
    const idx = structure ? versions.findIndex((v) => v.id === structure.id) : -1;
    const run = runs.get(p.runId);
    return {
      p,
      c: p.computation,
      e: people.get(p.employeeId),
      prof: profiles.get(p.employeeId),
      run,
      rs: payroll.rateSets.find((r) => r.id === p.computation.rateSetId) ?? resolveRateSet(payroll.rateSets, p.period.end),
      structure,
      prevStructure: idx > 0 ? versions[idx - 1] : null,
      prev,
      loans: (bundle.loans ?? []).filter((l) => l.employeeId === p.employeeId),
      remit: (item) => remits.get(`${monthKey(p)}:${item}`),
      cmp: () => {
        if (!run || run.type !== "regular") return null;
        if (!cmpCache.has(run.id)) {
          const before = defaultPreviousRun(payroll.runs.filter((r) => r.status === "finalized" || r.status === "disbursed"), run);
          cmpCache.set(run.id, before ? compareRuns(run, before, cmpCtx) : null);
        }
        return cmpCache.get(run.id)!;
      },
      ctx: shared,
    };
  });
  cache.set(payroll, { bundle, facts });
  return facts;
}

// ── Field builder ───────────────────────────────────────────────────────────

type Col = ReportColumn<PayrollFact>;
interface FieldOpts {
  type?: FieldType;
  description: string;
  source: string;
  sensitive?: "identifier" | "bank";
}
const f = (key: string, header: string, value: (r: PayrollFact) => string | number, o: FieldOpts): Col => ({
  key,
  header,
  value,
  money: o.type === "money",
  type: o.type ?? "text",
  description: o.description,
  source: o.source,
  sensitive: o.sensitive,
});

const SRC = {
  hr: "HR — employee record",
  slip: "Payroll — final payslips",
  structure: "Payroll — salary structures",
  profile: "Payroll — tax & statutory profile",
  rates: "Payroll — statutory rate set",
  run: "Payroll — payroll run",
  loans: "Loans",
  remit: "Payroll — Remittance Centre",
  hmo: "Payroll — HMO plans",
  budget: "Payroll — Budget & Forecasting",
  audit: "Payroll — audit & change history",
  cmp: "Payroll — variance analysis",
};

const structureTotal = (s: SalaryStructure | null) => (s ? round2(s.lines.reduce((x, l) => x + l.amount, 0)) : 0);
const structureLine = (s: SalaryStructure | null, ...codes: string[]) => (s ? round2(s.lines.filter((l) => codes.includes(l.code)).reduce((x, l) => x + l.amount, 0)) : 0);
const otherDeductionLines = (c: Payslip["computation"]) => c.lines.filter((l) => l.category === "deduction" && !l.statutory && l.code !== "VOL_PENSION" && l.code !== "HMO_EE");

/** Every dataset starts with the keys that join them: period, employee ID, name. */
const KEYS: Col[] = [
  f("period", "Payroll Period", (r) => r.p.period.label, { description: "The pay month of the payslip.", source: SRC.slip }),
  f("employeeNumber", "Employee ID / Payroll Number", (r) => r.p.employee.employeeNumber, { description: "The employee's payroll number — the record key every payroll dataset joins on.", source: SRC.hr }),
  f("name", "Employee Full Name", (r) => r.p.employee.fullName, { description: "Name as printed on the payslip.", source: SRC.hr }),
];

// 01 Employee master data
const MASTER: Col[] = [
  f("company", "Legal Entity / Company", (r) => r.p.company.legalName, { description: "The employing company.", source: SRC.hr }),
  f("division", "Division", (r) => r.e?.departmentName?.split(/[ &]/)[0] ?? "—", { description: "Division (first segment of the department until divisions are configured).", source: SRC.hr }),
  f("department", "Department", (r) => r.p.employee.departmentName || "Unassigned", { description: "Department at the time of the payslip.", source: SRC.hr }),
  f("costCentre", "Cost Centre", (r) => r.ctx.costCentres.get(r.p.employee.departmentName) ?? "—", { description: "Cost centre of the department.", source: SRC.hr }),
  f("branch", "Branch / Location", (r) => (r.e?.branchId ? r.ctx.branches.get(r.e.branchId) : undefined) ?? r.e?.workLocation ?? "—", { description: "Branch the employee works out of.", source: SRC.hr }),
  f("employmentType", "Employment Type", (r) => r.p.employee.employmentType || "—", { description: "Permanent, contract, intern…", source: SRC.hr }),
  f("startDate", "Employment Start Date", (r) => r.p.employee.startDate, { type: "date", description: "Date the employee joined.", source: SRC.hr }),
  f("terminationDate", "Termination Date", (r) => r.e?.dateOfLeaving ?? "", { type: "date", description: "Leaving date, if the employee has left.", source: SRC.hr }),
  f("contractEnd", "Contract End Date", (r) => (r.e as unknown as { contractEndDate?: string })?.contractEndDate ?? "", { type: "date", description: "End date of a fixed-term contract.", source: SRC.hr }),
  f("payrollStatus", "Payroll Status", (r) => (r.e?.dateOfLeaving && r.e.dateOfLeaving <= r.p.period.end ? "Leaver" : r.e?.status === "active" || !r.e ? "Active" : r.e.status), { description: "Active or leaver at the period end.", source: SRC.hr }),
  f("hours", "Contracted Working Hours", (r) => r.e?.workPattern?.weeklyHours ?? 40, { type: "number", description: "Contracted hours per week.", source: SRC.hr }),
  f("fte", "Full-Time Equivalent (FTE)", (r) => round2((r.e?.workPattern?.weeklyHours ?? 40) / 40), { type: "number", description: "Contracted hours ÷ 40.", source: SRC.hr }),
  f("payFrequency", "Pay Frequency", () => "Monthly", { description: "How often the employee is paid.", source: SRC.run }),
  f("payrollGroup", "Payroll Group", (r) => (r.p.runType === "regular" ? "Monthly staff" : r.p.runType === "off_cycle" ? "Off-cycle" : "Adjustment"), { description: "The payroll the payslip was issued from.", source: SRC.run }),
  f("jurisdiction", "Country / Tax Jurisdiction", (r) => `Nigeria · ${r.p.employee.stateOfResidence || "—"} IRS`, { description: "Country and the state tax authority PAYE goes to.", source: SRC.profile }),
  f("jobTitle", "Job Title", (r) => r.p.employee.jobTitle, { description: "Job title on the payslip.", source: SRC.hr }),
  f("grade", "Grade", (r) => r.p.employee.grade || "—", { description: "Pay grade.", source: SRC.hr }),
];

// 02 Salary and earnings
const EARNINGS: Col[] = [
  f("annualBasic", "Annual Basic Salary", (r) => round2(structureLine(r.structure, "BASIC", "CONSOLIDATED") * 12), { type: "money", description: "Monthly basic in the salary structure × 12.", source: SRC.structure }),
  f("monthlyBasic", "Monthly Basic Salary", (r) => structureLine(r.structure, "BASIC", "CONSOLIDATED"), { type: "money", description: "Basic salary per month in the structure in force.", source: SRC.structure }),
  f("hourlyRate", "Hourly Rate", (r) => round2(structureLine(r.structure, "BASIC", "CONSOLIDATED") / (((r.e?.workPattern?.weeklyHours ?? 40) * 52) / 12)), { type: "money", description: "Monthly basic ÷ monthly contracted hours.", source: SRC.structure }),
  f("housing", "Housing Allowance", (r) => code(r.c.lines, "HOUSING"), { type: "money", description: "Housing allowance paid in the period.", source: SRC.slip }),
  f("transport", "Transport Allowance", (r) => code(r.c.lines, "TRANSPORT"), { type: "money", description: "Transport allowance paid in the period.", source: SRC.slip }),
  f("otherAllowances", "Other Allowances", (r) => round2(group(r.c.lines, "allowances") - code(r.c.lines, "HOUSING", "TRANSPORT")), { type: "money", description: "Every other recurring allowance.", source: SRC.slip }),
  f("otHours", "Overtime Hours", (r) => r.c.lines.filter((l) => l.code.startsWith("OT_")).reduce((s, l) => s + (l.units ?? 0), 0), { type: "number", description: "Approved overtime hours paid.", source: SRC.slip }),
  f("otPay", "Overtime Payments", (r) => group(r.c.lines, "overtime", "manufacturing"), { type: "money", description: "Overtime and shift pay.", source: SRC.slip }),
  f("bonus", "Bonus", (r) => sumLines(r.c.lines, (l) => l.category === "earning" && /BONUS/.test(l.code)), { type: "money", description: "Bonuses paid in the period.", source: SRC.slip }),
  f("commission", "Commission", (r) => code(r.c.lines, "COMMISSION"), { type: "money", description: "Sales commission.", source: SRC.slip }),
  f("arrears", "Arrears / Back Pay", (r) => code(r.c.lines, "BACK_PAY"), { type: "money", description: "Arrears from back-dated salary changes.", source: SRC.slip }),
  f("oneOff", "One-off Payments", (r) => round2(group(r.c.lines, "bonuses", "annual", "termination", "benefits_in_kind", "corrections") - sumLines(r.c.lines, (l) => /BONUS/.test(l.code) || l.code === "COMMISSION")), { type: "money", description: "Leave allowance and other one-off payments (bonuses and commission excluded).", source: SRC.slip }),
  f("gross", "Gross Pay", (r) => r.c.gross, { type: "money", description: "Total earnings in the period.", source: SRC.slip }),
  f("taxableGross", "Taxable Gross Pay", (r) => r.c.taxableGross, { type: "money", description: "Earnings that count for PAYE.", source: SRC.slip }),
  f("pensionable", "Pensionable Earnings", (r) => r.c.bases.pensionable, { type: "money", description: "Basic + housing + transport, the pension base.", source: SRC.slip }),
  f("nonTaxable", "Non-Taxable Earnings", (r) => round2(r.c.gross - r.c.taxableGross), { type: "money", description: "Earnings exempt from PAYE (reimbursements, exempt allowances).", source: SRC.slip }),
  f("previousSalary", "Previous Salary", (r) => structureTotal(r.prevStructure), { type: "money", description: "Monthly structure total before the latest change (0 if never changed).", source: SRC.structure }),
  f("increasePct", "Salary Increase Percentage", (r) => (r.prevStructure ? pctOf(structureTotal(r.structure) - structureTotal(r.prevStructure), structureTotal(r.prevStructure)) : 0), { type: "percent", description: "Change in monthly structure total at the latest change.", source: SRC.structure }),
  f("salaryChangeDate", "Salary Change Effective Date", (r) => (r.prevStructure ? r.structure?.effectiveFrom ?? "" : ""), { type: "date", description: "When the latest salary change took effect.", source: SRC.structure }),
];

// 03 Pension and voluntary contributions
const PENSION: Col[] = [
  f("pensionStatus", "Pension Scheme Status", (r) => (code(r.c.lines, "PENSION_EE") > 0 ? "Contributing" : "Not contributing"), { description: "Whether contributory pension was deducted this period.", source: SRC.slip }),
  f("pfa", "Pension Administrator (PFA)", (r) => r.p.employee.pfaName || "—", { description: "The employee's PFA.", source: SRC.profile }),
  f("rsaPin", "RSA PIN / Pension Number", (r) => r.p.employee.rsaPin || "", { description: "Retirement Savings Account PIN.", source: SRC.profile, sensitive: "identifier" }),
  f("eeRate", "Employee Pension Rate (%)", (r) => round2(r.rs.employeePensionRate * 100), { type: "percent", description: "Employee contribution rate in the period's rate set.", source: SRC.rates }),
  f("erRate", "Employer Pension Rate (%)", (r) => round2(r.rs.employerPensionRate * 100), { type: "percent", description: "Employer contribution rate in the period's rate set.", source: SRC.rates }),
  f("eePension", "Employee Pension Contribution", (r) => code(r.c.lines, "PENSION_EE"), { type: "money", description: "Deducted from pay.", source: SRC.slip }),
  f("erPension", "Employer Pension Contribution", (r) => code(r.c.lines, "PENSION_ER"), { type: "money", description: "Paid by the employer on top of pay.", source: SRC.slip }),
  f("avcRate", "Voluntary Pension Contribution Rate (%)", (r) => (r.prof?.avc?.mode === "percent" ? r.prof.avc.value : 0), { type: "percent", description: "The employee's voluntary rate, if set as a percentage.", source: SRC.profile }),
  f("avc", "Voluntary Pension Contribution Amount", (r) => code(r.c.lines, "VOL_PENSION"), { type: "money", description: "Voluntary contribution deducted.", source: SRC.slip }),
  f("pensionBasis", "Pensionable Earnings Basis", () => "Basic + Housing + Transport", { description: "What pension is charged on (PRA 2014).", source: SRC.rates }),
  f("pensionableAmount", "Pensionable Earnings Amount", (r) => r.c.bases.pensionable, { type: "money", description: "The pension base this period.", source: SRC.slip }),
  f("totalPension", "Total Pension Contribution", (r) => code(r.c.lines, "PENSION_EE", "PENSION_ER", "VOL_PENSION"), { type: "money", description: "Employee + employer + voluntary.", source: SRC.slip }),
  f("pensionEnrolment", "Pension Enrolment Date", (r) => r.p.employee.startDate, { type: "date", description: "Enrolled from the employment start date.", source: SRC.hr }),
  f("pensionExemption", "Pension Exemption Status and Reason", (r) => (code(r.c.lines, "PENSION_EE") > 0 ? "Not exempt" : "Exempt — employment type not pensionable"), { description: "Why pension wasn't deducted, if it wasn't.", source: SRC.slip }),
  f("pensionRateDate", "Pension Rate Effective Date", (r) => r.rs.effectiveFrom, { type: "date", description: "When the rate set in use took effect.", source: SRC.rates }),
  f("pensionArrears", "Pension Arrears", (r) => sumLines(r.c.lines, (l) => l.code === "PENSION_EE" && l.source === "adjustment"), { type: "money", description: "Pension on arrears/adjustments.", source: SRC.slip }),
  f("pensionRemitStatus", "Pension Remittance Status", (r) => remitStatus(r.remit("pension")), { description: "Remittance Centre status for this month's pension.", source: SRC.remit }),
  f("pensionRemitDate", "Pension Remittance Date", (r) => r.remit("pension")?.record?.date ?? "", { type: "date", description: "Date the pension was paid to the PFAs.", source: SRC.remit }),
];

function remitStatus(r?: RemittanceRow): string {
  if (!r) return "—";
  return { calculated: "Calculated", submitted: "Submitted", paid: "Paid", reconciled: "Reconciled", overdue: "Overdue", nothing_due: "Nothing due" }[r.status];
}

// 04 PAYE and tax
const TAX: Col[] = [
  f("tin", "Employee Tax Identification Number", (r) => r.p.employee.tin || "", { description: "TIN.", source: SRC.profile, sensitive: "identifier" }),
  f("taxState", "Tax Residence State", (r) => r.p.employee.stateOfResidence || "—", { description: "State of residence — decides the tax authority.", source: SRC.profile }),
  f("taxAuthority", "Relevant Tax Authority", (r) => `${r.p.employee.stateOfResidence || "—"} IRS`, { description: "Where PAYE is remitted.", source: SRC.profile }),
  f("taxableIncome", "Taxable Income", (r) => r.c.taxableGross, { type: "money", description: "Taxable earnings in the period.", source: SRC.slip }),
  f("nonTaxableIncome", "Non-Taxable Income", (r) => round2(r.c.gross - r.c.taxableGross), { type: "money", description: "Earnings not subject to PAYE.", source: SRC.slip }),
  f("bik", "Benefit in Kind (BIK)", (r) => group(r.c.lines, "benefits_in_kind"), { type: "money", description: "Taxable benefits in kind.", source: SRC.slip }),
  f("rentRelief", "Rent Relief", (r) => round2(r.c.tax.reliefs.filter((x) => /rent/i.test(x.label)).reduce((s, x) => s + x.period, 0)), { type: "money", description: "Rent relief given this period (evidence verified).", source: SRC.slip }),
  f("otherReliefs", "Other Allowable Tax Reliefs", (r) => round2(r.c.tax.reliefs.filter((x) => !/rent/i.test(x.label)).reduce((s, x) => s + x.period, 0)), { type: "money", description: "Pension, NHF, voluntary pension and other reliefs this period.", source: SRC.slip }),
  f("monthlyPaye", "Monthly PAYE", (r) => code(r.c.lines, "PAYE", "WHT"), { type: "money", description: "Tax deducted this period.", source: SRC.slip }),
  f("annualPaye", "Annual PAYE", (r) => r.c.tax.annualisedTax, { type: "money", description: "Tax for a full year at this month's pay (annualised view).", source: SRC.slip }),
  f("ytdPaye", "Year-to-Date PAYE", (r) => r.c.ytd.paye, { type: "money", description: "PAYE so far this tax year, including this payslip.", source: SRC.slip }),
  f("taxExempt", "Tax Exemption Status", (r) => r.c.tax.exemptReason ?? "Not exempt", { description: "Why no PAYE was charged, if none was.", source: SRC.slip }),
  f("taxAdjustment", "Tax Adjustment / Refund", (r) => (r.c.tax.taxThisPeriod < 0 ? r.c.tax.taxThisPeriod : 0), { type: "money", description: "A negative figure is a cumulative refund.", source: SRC.slip }),
  f("taxRemitStatus", "Tax Remittance Status", (r) => remitStatus(r.remit("paye")), { description: "Remittance Centre status for this month's PAYE.", source: SRC.remit }),
];

// 05 Statutory contributions and employer liabilities
const STATUTORY: Col[] = [
  f("nhfRate", "NHF Contribution Rate", (r) => round2(r.rs.nhfRate * 100), { type: "percent", description: "Employee NHF rate.", source: SRC.rates }),
  f("nhf", "NHF Contribution Amount", (r) => code(r.c.lines, "NHF"), { type: "money", description: "NHF deducted (employee deduction).", source: SRC.slip }),
  f("nsitfRate", "NSITF Contribution Rate", (r) => round2(r.rs.nsitfRate * 100), { type: "percent", description: "Employer NSITF rate.", source: SRC.rates }),
  f("nsitf", "NSITF Contribution Amount", (r) => code(r.c.lines, "NSITF"), { type: "money", description: "Employer liability.", source: SRC.slip }),
  f("nsitfBasis", "NSITF Calculation Basis", () => "Monthly gross pay", { description: "Employee's Compensation Act 2010.", source: SRC.rates }),
  f("itfRate", "ITF Contribution Rate", (r) => round2(r.rs.itfRate * 100), { type: "percent", description: "Employer ITF rate.", source: SRC.rates }),
  f("itf", "ITF Contribution Amount", (r) => code(r.c.lines, "ITF"), { type: "money", description: "Employer liability, accrued monthly.", source: SRC.slip }),
  f("groupLifeBasis", "Group Life Assurance Calculation Basis", (r) => r.c.lines.find((l) => l.code === "GROUP_LIFE")?.note ?? "—", { description: "Premium basis, as on the payslip.", source: SRC.slip }),
  f("groupLifeCover", "Group Life Sum Assured", (r) => round2(group(r.c.lines, "core", "allowances") * 12 * r.rs.groupLifeMultiplier), { type: "money", description: `Cover: annual regular pay × the statutory multiple.`, source: SRC.rates }),
  f("groupLife", "Group Life Insurance Premium", (r) => code(r.c.lines, "GROUP_LIFE"), { type: "money", description: "Employer premium accrued this month.", source: SRC.slip }),
  f("hmoProvider", "HMO Provider", (r) => r.c.lines.find((l) => l.code === "HMO_ER" || l.code === "HMO_EE")?.note?.split(" · ")[0] ?? "—", { description: "Private health insurer.", source: SRC.hmo }),
  f("hmoPlan", "HMO Plan", (r) => r.prof?.hmo?.planId ?? "—", { description: "HMO plan id on the employee's profile.", source: SRC.hmo }),
  f("hmoEe", "Employee HMO Contribution", (r) => code(r.c.lines, "HMO_EE"), { type: "money", description: "Employee deduction.", source: SRC.slip }),
  f("hmoEr", "Employer HMO Contribution", (r) => code(r.c.lines, "HMO_ER", "NHIS_ER"), { type: "money", description: "Employer liability (HMO and NHIA).", source: SRC.slip }),
  f("totalStatutory", "Total Statutory Liabilities", (r) => code(r.c.lines, "PAYE", "WHT", "PENSION_EE", "PENSION_ER", "VOL_PENSION", "NHF", "NSITF", "ITF", "NHIS_EE", "NHIS_ER"), { type: "money", description: "Everything owed to authorities and institutions for this payslip — employee deductions and employer liabilities together.", source: SRC.slip }),
  f("totalEmployer", "Total Employer Contributions", (r) => r.c.employerCost, { type: "money", description: "Employer liabilities only (pension, NSITF, ITF, group life, HMO/NHIA).", source: SRC.slip }),
  f("statDue", "Statutory Remittance Due Date", (r) => r.remit("paye")?.due ?? nextMonthTenth(r.p), { type: "date", description: "PAYE due date for the month.", source: SRC.remit }),
  f("statOutstanding", "Outstanding Statutory Liabilities", (r) => {
    const items: [string, string[]][] = [["paye", ["PAYE", "WHT"]], ["pension", ["PENSION_EE", "PENSION_ER"]], ["avc", ["VOL_PENSION"]], ["nhf", ["NHF"]], ["nsitf", ["NSITF"]], ["itf", ["ITF"]]];
    return round2(items.reduce((s, [item, codes]) => {
      const row = r.remit(item);
      return s + (row && row.outstanding > 0 && row.liability > 0 ? code(r.c.lines, ...codes) * (row.outstanding / row.liability) : 0);
    }, 0));
  }, { type: "money", description: "This employee's share of what's still unpaid to the authorities for the month.", source: SRC.remit }),
];

// 06 Deductions and staff loans
const DEDUCTIONS: Col[] = [
  f("deductionTypes", "Deduction Type", (r) => [...new Set(otherDeductionLines(r.c).map((l) => l.name))].join(", ") || "—", { description: "Non-statutory deductions on the payslip.", source: SRC.slip }),
  f("recurringOneOff", "Recurring / One-off Deduction", (r) => otherDeductionLines(r.c).map((l) => `${l.name}: ${l.source === "loan" || l.source === "auto" ? "Recurring" : "One-off"}`).join("; ") || "—", { description: "Whether each deduction recurs.", source: SRC.slip }),
  f("loanType", "Loan Type", (r) => r.loans.filter((l) => l.status === "active" || l.status === "defaulted").map((l) => loanTypeLabel(l.loanType)).join(", ") || "—", { description: "Active loans.", source: SRC.loans }),
  f("loanAmount", "Original Loan Amount", (r) => round2(r.loans.filter((l) => l.status !== "rejected" && l.status !== "pending").reduce((s, l) => s + l.amount, 0)), { type: "money", description: "Amount lent (all issued loans).", source: SRC.loans }),
  f("loanStart", "Loan Start Date", (r) => r.loans.find((l) => l.issuedAt)?.issuedAt?.slice(0, 10) ?? "", { type: "date", description: "When the first issued loan started.", source: SRC.loans }),
  f("loanRepayment", "Monthly Loan Repayment", (r) => sumLines(r.c.lines, (l) => l.source === "loan"), { type: "money", description: "Loan instalments deducted this period.", source: SRC.slip }),
  f("loanBalance", "Outstanding Loan Balance", (r) => round2(r.loans.reduce((s, l) => {
    const inst = repaymentSchedule(l).filter((i) => i.dueDate <= r.p.period.end);
    return s + (inst.length ? inst[inst.length - 1].balanceAfter : l.status === "active" ? l.amount : 0);
  }, 0)), { type: "money", description: "Balance left after this period's instalment.", source: SRC.loans }),
  f("loanEnd", "Loan End Date", (r) => r.loans.map((l) => repaymentSchedule(l).at(-1)?.dueDate ?? "").filter(Boolean).sort().at(-1) ?? "", { type: "date", description: "Last instalment date.", source: SRC.loans }),
  f("advance", "Salary Advance", (r) => round2(r.loans.filter((l) => /advance/i.test(l.loanType)).reduce((s, l) => s + l.amount, 0)), { type: "money", description: "Salary advances issued.", source: SRC.loans }),
  f("advanceRecovery", "Salary Advance Recovery", (r) => code(r.c.lines, "SALARY_ADVANCE"), { type: "money", description: "Advance recovered this period.", source: SRC.slip }),
  f("unionDues", "Union Dues", (r) => code(r.c.lines, "UNION_DUES"), { type: "money", description: "Union dues deducted.", source: SRC.slip }),
  f("coop", "Cooperative Contributions", (r) => code(r.c.lines, "COOP_CONTRIB"), { type: "money", description: "Cooperative savings deducted.", source: SRC.slip }),
  f("otherVoluntary", "Other Voluntary Deductions", (r) => sumLines(r.c.lines, (l) => l.category === "deduction" && !l.statutory && !["SALARY_ADVANCE", "UNION_DUES", "COOP_CONTRIB", "VOL_PENSION", "HMO_EE"].includes(l.code) && l.source !== "loan"), { type: "money", description: "Every other non-statutory deduction.", source: SRC.slip }),
  f("deductionDate", "Deduction Effective Date", (r) => r.p.period.start, { type: "date", description: "Start of the period the deductions apply to.", source: SRC.slip }),
  f("totalDeductions", "Total Employee Deductions", (r) => r.c.totalDeductions, { type: "money", description: "Statutory and other deductions together.", source: SRC.slip }),
];

// 07 Banking and payments
const BANKING: Col[] = [
  f("bankName", "Bank Name", (r) => r.p.employee.bankName || "—", { description: "Bank paid into.", source: SRC.profile }),
  f("bankCode", "Bank Code", (r) => r.prof?.bankCode ?? "—", { description: "NIBSS bank code.", source: SRC.profile }),
  f("accountNumber", "Bank Account Number", (r) => r.prof?.accountNumber ?? "", { description: "NUBAN account number.", source: SRC.profile, sensitive: "bank" }),
  f("accountName", "Bank Account Holder Name", (r) => r.prof?.accountName ?? "", { description: "Name on the account.", source: SRC.profile, sensitive: "bank" }),
  f("bankValid", "Bank Account Validation Status", (r) => (r.prof?.accountNumber && r.prof.bankCode ? (isValidNuban(r.prof.bankCode, r.prof.accountNumber) ? "Passes NUBAN check" : "Fails NUBAN check") : "Missing"), { description: "NUBAN check digit validation.", source: SRC.profile }),
  f("paymentMethod", "Payment Method", () => "Bank transfer (NIBSS)", { description: "How net pay is paid.", source: SRC.run }),
  f("currency", "Payment Currency", (r) => r.structure?.currency ?? "NGN", { description: "Currency paid.", source: SRC.structure }),
  f("net", "Net Pay", (r) => r.c.net, { type: "money", description: "Take-home pay.", source: SRC.slip }),
  f("payDate", "Payment Date", (r) => r.p.period.payDate, { type: "date", description: "Pay day (moved to the previous working day if needed).", source: SRC.run }),
  f("paymentStatus", "Payment Status", (r) => {
    const res = r.run?.payment?.results?.[r.p.employeeId];
    return res ? (res.status === "rejected" ? (res.resolvedBy ? "Rejected — resolved" : "Rejected") : "Paid") : r.run?.payment ? r.run.payment.status : r.run?.status === "disbursed" ? "Paid" : "Not released";
  }, { description: "Bank result for this payment.", source: SRC.run }),
  f("paymentRef", "Payment Reference", (r) => r.run?.payment?.bankReference ?? r.p.reference, { description: "Bank batch reference (or the payslip reference).", source: SRC.run }),
  f("failedReason", "Failed Payment Reason", (r) => r.run?.payment?.results?.[r.p.employeeId]?.reason ?? "", { description: "Why the bank rejected it.", source: SRC.run }),
  f("dupAccount", "Duplicate Bank Account Indicator", (r) => yesNo(!!r.run?.exceptions.some((x) => x.rule === "duplicate_bank_account" && x.employeeId === r.p.employeeId)), { type: "boolean", description: "Flagged as sharing an account with someone else.", source: SRC.run }),
];

// 08 Payroll results and variance
const RESULTS: Col[] = [
  f("runId", "Payroll Run ID", (r) => r.p.runId, { description: "The run the payslip came from.", source: SRC.run }),
  f("prevGross", "Previous Month Gross Pay", (r) => r.prev?.computation.gross ?? 0, { type: "money", description: "Gross on the previous regular payslip.", source: SRC.slip }),
  f("curGross", "Current Month Gross Pay", (r) => r.c.gross, { type: "money", description: "Gross on this payslip.", source: SRC.slip }),
  f("grossVar", "Gross Pay Variance", (r) => round2(r.c.gross - (r.prev?.computation.gross ?? 0)), { type: "money", description: "Current − previous gross.", source: SRC.cmp }),
  f("prevNet", "Previous Month Net Pay", (r) => r.prev?.computation.net ?? 0, { type: "money", description: "Net on the previous regular payslip.", source: SRC.slip }),
  f("curNet", "Current Month Net Pay", (r) => r.c.net, { type: "money", description: "Net on this payslip.", source: SRC.slip }),
  f("netVar", "Net Pay Variance", (r) => round2(r.c.net - (r.prev?.computation.net ?? 0)), { type: "money", description: "Current − previous net.", source: SRC.cmp }),
  f("varPct", "Variance Percentage", (r) => (r.prev ? pctOf(r.c.gross - r.prev.computation.gross, r.prev.computation.gross) : 0), { type: "percent", description: "Gross variance as % of the previous gross.", source: SRC.cmp }),
  f("varReason", "Variance Reason", (r) => r.cmp()?.employees.find((x) => x.employeeId === r.p.employeeId)?.explanation ?? (r.prev ? "—" : "First payslip"), { description: "Explanation built from payroll records (never guessed).", source: SRC.cmp }),
  f("varConfidence", "Variance Confidence", (r) => ({ confirmed: "Confirmed", verification_required: "Verification required", unexplained: "Unexplained" })[r.cmp()?.employees.find((x) => x.employeeId === r.p.employeeId)?.confidence ?? "confirmed"], { description: "How sure the system is about the reason.", source: SRC.cmp }),
  f("prevPaye", "Previous Month PAYE", (r) => (r.prev ? code(r.prev.computation.lines, "PAYE", "WHT") : 0), { type: "money", description: "PAYE on the previous regular payslip.", source: SRC.slip }),
  f("curPaye", "Current Month PAYE", (r) => code(r.c.lines, "PAYE", "WHT"), { type: "money", description: "PAYE on this payslip.", source: SRC.slip }),
  f("pensionVar", "Pension Contribution Variance", (r) => round2(code(r.c.lines, "PENSION_EE") - (r.prev ? code(r.prev.computation.lines, "PENSION_EE") : 0)), { type: "money", description: "Change in employee pension.", source: SRC.cmp }),
  f("newStarter", "New Starter Indicator", (r) => yesNo(!r.prev), { type: "boolean", description: "No earlier regular payslip.", source: SRC.slip }),
  f("leaver", "Leaver Indicator", (r) => yesNo(!!r.e?.dateOfLeaving && r.e.dateOfLeaving <= r.p.period.end), { type: "boolean", description: "Left on or before the period end.", source: SRC.hr }),
  f("ytdGross", "Year-to-Date Gross Pay", (r) => r.c.ytd.gross, { type: "money", description: "Opening balance + final payslips this tax year.", source: SRC.slip }),
  f("ytdNet", "Year-to-Date Net Pay", (r) => r.c.ytd.net, { type: "money", description: "Net pay so far this tax year.", source: SRC.slip }),
  f("ytdDeductions", "Year-to-Date Deductions", (r) => r.c.ytd.totalDeductions, { type: "money", description: "Deductions so far this tax year.", source: SRC.slip }),
  f("exceptionStatus", "Payroll Exception Status", (r) => {
    const ex = r.run?.exceptions.filter((x) => x.employeeId === r.p.employeeId) ?? [];
    return ex.length ? `${ex.length} (${ex.filter((x) => x.acknowledged).length} acknowledged)` : "None";
  }, { description: "Exceptions on the run for this employee.", source: SRC.run }),
  f("approvalStatus", "Payroll Approval Status", (r) => (r.run?.approvedBy ? `Approved by ${r.run.approvedBy.name}` : r.run?.status ?? "—"), { description: "Who approved the run.", source: SRC.run }),
];

// 09 Employer costs and finance
const FINANCE: Col[] = [
  f("basicCost", "Basic Salary Cost", (r) => code(r.c.lines, "BASIC", "CONSOLIDATED"), { type: "money", description: "Basic paid.", source: SRC.slip }),
  f("allowancesCost", "Total Allowances", (r) => round2(group(r.c.lines, "core", "allowances") - code(r.c.lines, "BASIC", "CONSOLIDATED")), { type: "money", description: "Recurring allowances paid.", source: SRC.slip }),
  f("grossCost", "Gross Salary Cost", (r) => r.c.gross, { type: "money", description: "Gross pay.", source: SRC.slip }),
  f("erPensionCost", "Employer Pension Cost", (r) => code(r.c.lines, "PENSION_ER"), { type: "money", description: "Employer pension.", source: SRC.slip }),
  f("erHmoCost", "Employer HMO Cost", (r) => code(r.c.lines, "HMO_ER", "NHIS_ER"), { type: "money", description: "Employer health cover.", source: SRC.slip }),
  f("nsitfCost", "NSITF Cost", (r) => code(r.c.lines, "NSITF"), { type: "money", description: "NSITF.", source: SRC.slip }),
  f("itfCost", "ITF Cost", (r) => code(r.c.lines, "ITF"), { type: "money", description: "ITF.", source: SRC.slip }),
  f("groupLifeCost", "Group Life Insurance Cost", (r) => code(r.c.lines, "GROUP_LIFE"), { type: "money", description: "Group life premium.", source: SRC.slip }),
  f("ctc", "Total Cost to Company (CTC)", (r) => round2(r.c.gross + r.c.employerCost), { type: "money", description: "Gross + every employer contribution.", source: SRC.slip }),
  f("glCode", "General Ledger Code", (r) => {
    const gl = new Set(r.c.lines.map((l) => r.ctx.payroll.elements.find((e) => e.code === l.code)?.glCode).filter(Boolean));
    return [...gl].join(", ") || "—";
  }, { description: "GL accounts the payslip's lines post to.", source: "Payroll — pay elements" }),
  f("ccCode", "Cost Centre Code", (r) => r.ctx.costCentres.get(r.p.employee.departmentName) ?? "—", { description: "Cost centre the cost is allocated to.", source: SRC.hr }),
  f("projectCode", "Project Code", () => "—", { description: "Project allocation (not used until projects carry cost codes).", source: SRC.hr }),
  f("allocationPct", "Cost Allocation Percentage", () => 100, { type: "percent", description: "Share of cost allocated to the cost centre.", source: SRC.hr }),
  f("budgetCost", "Budgeted Payroll Cost", (r) => {
    const month = monthKey(r.p);
    const dept = r.p.employee.departmentName || "Unassigned";
    const b = budgetFor(r.ctx.payroll.budgets, r.ctx.payroll.settings, month, dept, (d) => r.ctx.costCentres.get(d) ?? d);
    const total = r.ctx.deptCost(month, dept);
    return b === null || !total ? 0 : round2(b * ((r.c.gross + r.c.employerCost) / total));
  }, { type: "money", description: "The department's monthly budget, shared by each employee's cost.", source: SRC.budget }),
  f("actualCost", "Actual Payroll Cost", (r) => round2(r.c.gross + r.c.employerCost), { type: "money", description: "Cost to company this period.", source: SRC.slip }),
  f("budgetVar", "Budget Variance", (r) => {
    const month = monthKey(r.p);
    const dept = r.p.employee.departmentName || "Unassigned";
    const b = budgetFor(r.ctx.payroll.budgets, r.ctx.payroll.settings, month, dept, (d) => r.ctx.costCentres.get(d) ?? d);
    const total = r.ctx.deptCost(month, dept);
    const cost = r.c.gross + r.c.employerCost;
    return b === null || !total ? 0 : round2(cost - b * (cost / total));
  }, { type: "money", description: "Actual − budgeted (positive = over budget).", source: SRC.budget }),
  f("forecastCost", "Forecast Payroll Cost", (r) => structureTotal(structureOn(r.ctx.payroll.structures, r.p.employeeId, "9999-12-31")), { type: "money", description: "Monthly gross on the latest approved structure (committed run-rate).", source: SRC.structure }),
];

// 10 Payroll compliance and audit
const latestChange = (r: PayrollFact) => r.prevStructure ? r.structure : null;
const COMPLIANCE: Col[] = [
  f("nin", "NIN Verification Status", (r) => (r.e?.identifiers?.nin || r.e?.identifiers?.NIN ? "Captured — not verified" : "Missing"), { description: "National Identification Number on file (MOTEE doesn't call NIMC).", source: SRC.hr, sensitive: "identifier" }),
  f("bvn", "BVN Verification Status", (r) => (r.prof?.bvn && /^\d{11}$/.test(r.prof.bvn) ? "Captured — not verified" : "Missing"), { description: "BVN on file (MOTEE doesn't call NIBSS BVN validation).", source: SRC.profile, sensitive: "identifier" }),
  f("bankVerified", "Bank Account Verification Status", (r) => (r.prof?.accountNumber && r.prof.bankCode && isValidNuban(r.prof.bankCode, r.prof.accountNumber) ? "Passes NUBAN check" : "Fails or missing"), { description: "NUBAN check digit validation.", source: SRC.profile }),
  f("dupEmployee", "Duplicate Employee Indicator", (r) => yesNo(!!r.run?.exceptions.some((x) => x.rule === "duplicate_employee" && x.employeeId === r.p.employeeId)), { type: "boolean", description: "Flagged as a possible duplicate.", source: SRC.run }),
  f("missingPension", "Missing Pension Details", (r) => yesNo(!r.p.employee.rsaPin || !r.p.employee.pfaName), { type: "boolean", description: "No RSA PIN or PFA.", source: SRC.profile }),
  f("missingTin", "Missing Tax Identification Number", (r) => yesNo(!r.p.employee.tin), { type: "boolean", description: "No TIN on file.", source: SRC.profile }),
  f("compliance", "Statutory Compliance Status", (r) => (!r.p.employee.tin || !r.p.employee.rsaPin ? "Incomplete records" : r.run?.exceptions.some((x) => x.employeeId === r.p.employeeId && x.severity === "error" && !x.acknowledged) ? "Open errors" : "Compliant"), { description: "TIN, RSA PIN and no open errors.", source: SRC.run }),
  f("exceptionDesc", "Payroll Exception Description", (r) => r.run?.exceptions.filter((x) => x.employeeId === r.p.employeeId).map((x) => `${EXCEPTION_RULE_LABELS[x.rule]}${x.acknowledged ? ` (acknowledged: ${x.acknowledged.reason})` : ""}`).join("; ") || "—", { description: "Each exception raised for the employee on the run.", source: SRC.run }),
  f("createdBy", "Record Created By", (r) => r.e?.onboardingMethod ? `HR (${r.e.onboardingMethod})` : "HR", { description: "How the employee record was created.", source: SRC.hr }),
  f("modifiedBy", "Record Modified By", (r) => latestChange(r)?.proposedBy ?? latestChange(r)?.approvedBy ?? "—", { description: "Who proposed the latest salary change.", source: SRC.audit }),
  f("prevValue", "Previous Value", (r) => (latestChange(r) ? structureTotal(r.prevStructure) : 0), { type: "money", description: "Monthly structure total before the latest change.", source: SRC.audit }),
  f("newValue", "New Value", (r) => (latestChange(r) ? structureTotal(r.structure) : 0), { type: "money", description: "Monthly structure total after it.", source: SRC.audit }),
  f("changeDate", "Date of Change", (r) => latestChange(r)?.approvedAt?.slice(0, 10) ?? "", { type: "date", description: "When the change was approved.", source: SRC.audit }),
  f("changeEffective", "Change Effective Date", (r) => latestChange(r)?.effectiveFrom ?? "", { type: "date", description: "When it took effect.", source: SRC.audit }),
  f("approvedBy", "Approved By", (r) => latestChange(r)?.approvedBy ?? r.run?.approvedBy?.name ?? "—", { description: "Approver of the latest change (or of the run).", source: SRC.audit }),
  f("approvalDate", "Approval Date", (r) => latestChange(r)?.approvedAt?.slice(0, 10) ?? r.run?.approvedAt?.slice(0, 10) ?? "", { type: "date", description: "When it was approved.", source: SRC.audit }),
];

/** Every pay element the tenant has — custom ones included — becomes a selectable field. */
function elementFields(categories: ("earning" | "deduction" | "employer")[], section: string) {
  return (ctx: ReportContext): Col[] =>
    (ctx.payroll?.elements ?? [])
      .filter((e) => categories.includes(e.category as "earning"))
      .map((e) => ({
        ...f(`el:${e.code}`, e.name, (r: PayrollFact) => code(r.c.lines, e.code), {
          type: "money",
          description: `${e.custom ? "Custom pay element" : "Pay element"} ${e.code}${e.description ? ` — ${e.description}` : ""}. Amount on the payslip.`,
          source: "Payroll — pay elements",
        }),
        section,
      }));
}

const sectioned = <T,>(section: string, cols: ReportColumn<T>[]): ReportColumn<T>[] => cols.map((c) => ({ ...c, section }));

interface DatasetSpec {
  id: string;
  num: string;
  label: string;
  description: string;
  icon: AnyReportDef["icon"];
  cols: Col[];
  dynamic?: (ctx: ReportContext) => Col[];
}

const SPECS: DatasetSpec[] = [
  { id: "pd-employee", num: "01", label: "Employee master data", description: "Who was paid: entity, department, cost centre, branch, employment type, dates, hours and grade.", icon: UserRound, cols: MASTER },
  { id: "pd-earnings", num: "02", label: "Salary and earnings", description: "Basic, allowances, overtime, bonuses, commission, arrears, gross, taxable and pensionable pay, salary changes.", icon: Banknote, cols: EARNINGS, dynamic: elementFields(["earning"], "Pay elements") },
  { id: "pd-pension", num: "03", label: "Pension and voluntary contributions", description: "PFA, RSA PIN, rates, contributions, pensionable basis, remittance status.", icon: PiggyBank, cols: PENSION },
  { id: "pd-tax", num: "04", label: "PAYE and tax", description: "TIN, tax state and authority, taxable income, reliefs, monthly / annual / YTD PAYE, remittance status.", icon: Landmark, cols: TAX },
  { id: "pd-statutory", num: "05", label: "Statutory contributions & employer liabilities", description: "NHF, NSITF, ITF, group life, HMO — rates, bases, amounts, due dates and what's outstanding.", icon: ShieldCheck, cols: STATUTORY, dynamic: elementFields(["employer"], "Employer elements") },
  { id: "pd-deductions", num: "06", label: "Deductions and staff loans", description: "Every deduction, loans and balances, advances, union and cooperative contributions.", icon: HandCoins, cols: DEDUCTIONS, dynamic: elementFields(["deduction"], "Deduction elements") },
  { id: "pd-banking", num: "07", label: "Banking and payments", description: "Bank, account (restricted), validation, net pay, payment date, status, reference and failures.", icon: Wallet, cols: BANKING },
  { id: "pd-results", num: "08", label: "Payroll results and variance", description: "Current vs previous month, variances with reasons and confidence, starters, leavers, YTD, exceptions, approval.", icon: TrendingUp, cols: RESULTS },
  { id: "pd-finance", num: "09", label: "Employer costs and finance", description: "Cost to company line by line, GL and cost centre codes, budget, actual and variance.", icon: Building2, cols: FINANCE },
  { id: "pd-compliance", num: "10", label: "Payroll compliance and audit", description: "Identity and bank verification, missing details, exceptions, and the latest change with who approved it.", icon: ClipboardCheck, cols: COMPLIANCE },
];

const PAYROLL_FILTERS = [
  { key: "period", label: "Pay month", options: (rows: PayrollFact[]) => [...new Set(rows.map((r) => r.p.period.label))], match: (r: PayrollFact, v: string) => r.p.period.label === v },
  { key: "department", label: "Department", options: (rows: PayrollFact[]) => [...new Set(rows.map((r) => r.p.employee.departmentName || "Unassigned"))].sort(), match: (r: PayrollFact, v: string) => (r.p.employee.departmentName || "Unassigned") === v },
];

export const PAYROLL_DATASETS: AnyReportDef[] = SPECS.map((s) =>
  defineReport<PayrollFact>({
    id: s.id,
    label: `${s.num} · ${s.label}`,
    description: s.description,
    icon: s.icon,
    group: "Payroll datasets",
    permission: "time-payroll.payroll",
    countries: ["ng"],
    grain: "One row per employee per final payslip",
    joinGroup: "payroll",
    datasetOnly: true,
    select: (bundle, ctx) => payrollFacts(bundle, ctx.payroll),
    columns: [...sectioned("Keys", KEYS), ...sectioned(s.label, s.cols)],
    dynamicColumns: s.dynamic,
    filters: PAYROLL_FILTERS,
    searchText: (r) => `${r.p.employee.fullName} ${r.p.employee.employeeNumber} ${r.p.employee.departmentName} ${r.p.reference}`,
    analytics: () => ({ stats: [], charts: [] }),
  }),
);

// ── Payroll Budget & Forecast (department grain) ────────────────────────────

interface BudgetRow {
  department: string;
  costCentre: string;
  actualYtd: number;
  projected: number;
  budget: number | null;
  variance: number | null;
  variancePct: number | null;
  status: string;
  planned: number;
  drivers: string;
  fiscalYear: number;
}

const forecastCache = new WeakMap<TenantPayroll, BudgetRow[]>();

export const PAYROLL_BUDGET_DATASET: AnyReportDef = defineReport<BudgetRow>({
  id: "pd-budget",
  label: "11 · Payroll budget & forecast",
  description: "Per department for the fiscal year: actual to date, projected (committed + approved plans), budget, variance and the drivers behind it.",
  icon: LineChart,
  group: "Payroll datasets",
  permission: "time-payroll.payroll",
  countries: ["ng"],
  grain: "One row per department for the fiscal year",
  datasetOnly: true,
  select: (bundle, ctx) => {
    const payroll = ctx.payroll;
    if (!payroll) return [];
    const hit = forecastCache.get(payroll);
    if (hit) return hit;
    const fc = buildForecast({ data: payroll, bundle });
    const rows: BudgetRow[] = (fc?.departments ?? []).map((d) => ({
      department: d.department,
      costCentre: d.costCentre,
      actualYtd: d.actualYtd,
      projected: d.projected,
      budget: d.budget,
      variance: d.variance,
      variancePct: d.variancePct,
      status: { over: "Over budget", under: "Under budget", on_track: "On track", no_budget: "No budget" }[d.status],
      planned: d.plannedPositions,
      drivers: d.drivers.map((x) => `${x.label} ${x.amount >= 0 ? "+" : "−"}₦${Math.round(Math.abs(x.amount)).toLocaleString("en-NG")}`).join("; ") || "—",
      fiscalYear: fc!.fiscalYear,
    }));
    forecastCache.set(payroll, rows);
    return rows;
  },
  columns: sectioned("Budget & forecast", [
    { key: "fiscalYear", header: "Fiscal Year", value: (r: BudgetRow) => r.fiscalYear, type: "number", description: "Budget year.", source: SRC.budget },
    { key: "department", header: "Department", value: (r: BudgetRow) => r.department, description: "Department.", source: SRC.budget },
    { key: "costCentre", header: "Cost Centre", value: (r: BudgetRow) => r.costCentre, description: "Cost centre.", source: SRC.budget },
    { key: "actualYtd", header: "Actual to Date", value: (r: BudgetRow) => r.actualYtd, money: true, type: "money", description: "Committed expenditure already paid.", source: SRC.budget },
    { key: "projected", header: "Projected (Committed + Approved)", value: (r: BudgetRow) => r.projected, money: true, type: "money", description: "Actual + in progress + forecast of committed and approved planned expenditure.", source: SRC.budget },
    { key: "budget", header: "Budget", value: (r: BudgetRow) => r.budget ?? 0, money: true, type: "money", description: "Approved budget for the same months.", source: SRC.budget },
    { key: "variance", header: "Variance", value: (r: BudgetRow) => r.variance ?? 0, money: true, type: "money", description: "Projected − budget.", source: SRC.budget },
    { key: "variancePct", header: "Variance %", value: (r: BudgetRow) => r.variancePct ?? 0, type: "percent", description: "Variance as % of budget.", source: SRC.budget },
    { key: "status", header: "Status", value: (r: BudgetRow) => r.status, description: "Over, under or on track.", source: SRC.budget },
    { key: "planned", header: "Planned Positions", value: (r: BudgetRow) => r.planned, type: "number", description: "Approved requisitions and planned hires.", source: SRC.budget },
    { key: "drivers", header: "Forecast Drivers", value: (r: BudgetRow) => r.drivers, description: "What moves the forecast (hires, exits, salary changes).", source: SRC.budget },
  ] as ReportColumn<BudgetRow>[]).map((c) => ({ ...c, type: c.type ?? "text" })),
  searchText: (r) => `${r.department} ${r.costCentre}`,
  analytics: () => ({ stats: [], charts: [] }),
});

export const ALL_PAYROLL_DATASETS: AnyReportDef[] = [...PAYROLL_DATASETS, PAYROLL_BUDGET_DATASET];

/** Icon for the Payroll datasets group in pickers. */
export const PAYROLL_DATASET_ICON = Coins;
