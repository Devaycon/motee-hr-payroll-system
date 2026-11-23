import type { LocaleEmployee, LocaleLoan } from "@/src/lib/types/locale";
import { round2 } from "./ng/engine";
import { paymentSnapshot, previousComputation, type PayableExpense, type TenantPayrollData } from "./run-builder";
import type { EmployeeTaxProfile, PayComputation, PayrollAuditEntry, PayrollException, PayrollRun, PeriodInput } from "./types";

/**
 * Detail behind run rows the client drills into: an exception (what the
 * rule means, the figures that triggered it, how to clear it) and a pay input
 * (where it came from, who added it and when, who approved the source).
 * Pure functions over records, so every fact can be traced.
 */

export interface Fact {
  label: string;
  value: string;
  tone?: "good" | "bad" | "warn";
}

const ngn = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${n.toFixed(1)}%`;
const day = (iso?: string | null) => (iso ? new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", ...(iso.length > 10 ? { hour: "2-digit", minute: "2-digit" } : {}), timeZone: iso.length === 10 ? "UTC" : undefined }) : "—");

// ── Exceptions ──────────────────────────────────────────────────────────────

/** What each check means and how to clear it. */
export const EXCEPTION_RULE_GUIDE: Record<PayrollException["rule"], { what: string; fix: string }> = {
  duplicate_bank_account: { what: "Two or more employees are being paid into the same bank account.", fix: "Confirm with the employees (e.g. a joint account) and acknowledge, or correct the bank details on the profile." },
  leaver_in_run: { what: "The employee has a leaving date before this pay period but is still in the run.", fix: "Remove them from the run, or pay a final settlement through an off-cycle run." },
  negative_net: { what: "Deductions are larger than pay, so net pay is below zero.", fix: "Reduce or defer a deduction (loan instalment, advance) so net pay is positive." },
  zero_net: { what: "Net pay is exactly zero.", fix: "Check the employee should be paid this month; adjust deductions or exclude them." },
  missing_bank: { what: "No bank account on file — the employee can't be paid.", fix: "Add the bank details on the employee's profile, then recalculate." },
  missing_bank_code: { what: "The bank has no CBN/NIBSS code, so the payment file can't route it.", fix: "Choose the bank from the list on the profile so its code is set." },
  invalid_nuban: { what: "The account number fails the NUBAN check digit for the bank.", fix: "Correct the account number or the bank on the profile." },
  bank_changed: { what: "Bank details changed since the last payslip — a common fraud pattern.", fix: "Confirm the change with the employee through a known channel, then acknowledge." },
  missing_tin: { what: "No Tax Identification Number — PAYE can't be filed against the employee.", fix: "Add the TIN on the tax & statutory profile." },
  missing_rsa: { what: "No pension RSA PIN — the PFA can't credit the contribution.", fix: "Add the RSA PIN and PFA on the tax & statutory profile." },
  basic_out_of_range: { what: "Basic salary is outside the range set in payroll settings.", fix: "Check the salary structure, or widen the range in settings if it is correct." },
  variance: { what: "Net pay moved more than the variance threshold against the previous payslip.", fix: "Review the reasons (one-offs, salary change, unpaid days) and acknowledge if it is expected." },
  deductions_over_limit: { what: "Total deductions exceed two-thirds of pay.", fix: "Defer or reduce a voluntary deduction so the employee keeps at least a third of pay." },
  manual_missing_paye: { what: "Uploaded figures have pay but no PAYE.", fix: "Check the upload; add PAYE or let the engine calculate it." },
  rent_evidence_unverified: { what: "Rent was declared but the evidence isn't verified, so Rent Relief was not applied.", fix: "Verify the rent evidence on the tax profile, then recalculate to apply the relief." },
  input_held: { what: "A deduction looked unusual (for example over 10% of pay) and was held back from this run.", fix: "Confirm the amount with the source (union, cooperative, lender); release it by adding it as an input, or leave it held." },
  joiner_not_in_payroll: { what: "HR has a new hire who isn't set up in payroll yet.", fix: "Set them up from onboarding (Import starters) and add them to the run." },
  joiner_still_onboarding: { what: "The new hire hasn't cleared onboarding, so they aren't paid yet.", fix: "Complete onboarding, then add them to the run." },
  duplicate_employee: { what: "Two records look like the same person (name, bank, BVN or date of birth).", fix: "Check both records; remove the duplicate or acknowledge if they are different people." },
  unusual_salary_increase: { what: "Recurring pay rose above the unusual-increase threshold.", fix: "Check there is an approved salary change behind it." },
  deduction_change: { what: "A recurring deduction appeared, changed or stopped without a matching record.", fix: "Confirm with the source and acknowledge, or correct the deduction." },
  avc_no_mandate: { what: "A voluntary pension contribution is deducted without a signed mandate on file.", fix: "Record the mandate date on the employee's tax & statutory profile." },
};

export interface ExceptionDetail {
  title: string;
  what: string;
  fix: string;
  facts: Fact[];
  /** Pay lines most relevant to the rule (current vs previous). */
  lines: { label: string; previous: number | null; current: number }[];
  notes: string[];
}

export function exceptionDetail(
  e: PayrollException,
  run: PayrollRun,
  ctx: { data: TenantPayrollData; people: Map<string, LocaleEmployee>; profiles: Map<string, EmployeeTaxProfile>; ruleLabel: string },
): ExceptionDetail {
  const guide = EXCEPTION_RULE_GUIDE[e.rule];
  const re = e.employeeId ? run.employees.find((x) => x.employeeId === e.employeeId) : undefined;
  const c = re?.computation ?? null;
  const prev = e.employeeId ? previousComputation(ctx.data, e.employeeId, run.period, run.id) : null;
  const emp = e.employeeId ? ctx.people.get(e.employeeId) : undefined;
  const facts: Fact[] = [];
  const notes: string[] = [];
  if (emp) facts.push({ label: "Employee", value: `${emp.fullName} · ${emp.employeeNumber}` }, { label: "Department", value: emp.departmentName });
  facts.push({ label: "Severity", value: e.severity === "error" ? "Error — blocks submission" : "Warning — review", tone: e.severity === "error" ? "bad" : "warn" });
  facts.push({ label: "Status", value: e.acknowledged ? `Acknowledged by ${e.acknowledged.by}` : "Open", tone: e.acknowledged ? "good" : undefined });

  const sum = (cmp: PayComputation | null, f: (code: string, cat: string) => boolean) => (cmp ? round2(cmp.lines.filter((l) => f(l.code, l.category)).reduce((s, l) => s + l.amount, 0)) : null);
  const lines: ExceptionDetail["lines"] = [];
  if (c) {
    lines.push({ label: "Gross pay", previous: prev?.gross ?? null, current: c.gross });
    lines.push({ label: "PAYE", previous: sum(prev, (k) => k === "PAYE" || k === "WHT"), current: sum(c, (k) => k === "PAYE" || k === "WHT")! });
    lines.push({ label: "Total deductions", previous: prev?.totalDeductions ?? null, current: c.totalDeductions });
    lines.push({ label: "Net pay", previous: prev?.net ?? null, current: c.net });
  }

  switch (e.rule) {
    case "variance":
      if (c && prev?.net) {
        const d = c.net - prev.net;
        facts.push({ label: "Net pay change", value: `${d < 0 ? "−" : "+"}${ngn(Math.abs(d))} (${pct((d / prev.net) * 100)})`, tone: "warn" });
        notes.push("The payroll comparison explains which pay elements moved.");
      }
      break;
    case "deductions_over_limit":
      if (c) facts.push({ label: "Deductions / gross", value: pct((c.totalDeductions / Math.max(1, c.gross)) * 100), tone: "warn" });
      break;
    case "input_held": {
      for (const n of (run.inputNotes ?? []).filter((x) => x.employeeId === e.employeeId)) notes.push(n.message);
      if (c) facts.push({ label: "Gross pay this month", value: ngn(c.gross) });
      break;
    }
    case "duplicate_bank_account":
    case "missing_bank":
    case "missing_bank_code":
    case "invalid_nuban":
    case "bank_changed": {
      const snap = re?.snapshot ?? paymentSnapshot(ctx.profiles.get(e.employeeId ?? ""));
      facts.push({ label: "Bank", value: snap.bankName || "Not on file" }, { label: "Account", value: snap.accountNumber ? `•••• ${snap.accountNumber.slice(-4)}` : "Not on file" });
      break;
    }
    case "missing_tin":
    case "missing_rsa":
    case "avc_no_mandate":
    case "rent_evidence_unverified": {
      const p = ctx.profiles.get(e.employeeId ?? "");
      if (e.rule === "missing_tin") facts.push({ label: "TIN", value: p?.tin || "Missing", tone: "bad" });
      if (e.rule === "missing_rsa") facts.push({ label: "RSA PIN", value: p?.rsaPin || "Missing", tone: "bad" }, { label: "PFA", value: p?.pfaName || "—" });
      if (e.rule === "avc_no_mandate" && c) facts.push({ label: "Voluntary pension", value: ngn(sum(c, (k) => k === "VOL_PENSION") ?? 0) });
      break;
    }
    default:
      break;
  }
  if (e.acknowledged) notes.push(`Acknowledged by ${e.acknowledged.by} on ${day(e.acknowledged.at)}: “${e.acknowledged.reason}”`);
  return { title: ctx.ruleLabel, what: guide.what, fix: guide.fix, facts, lines, notes };
}

// ── Inputs ──────────────────────────────────────────────────────────────────

export const INPUT_MODULE_LABELS: Record<PeriodInput["source"], string> = {
  auto: "Recurring deduction",
  manual: "Added by hand",
  attendance: "Time & attendance",
  loan: "Loans",
  expense: "Expense claims",
  adjustment: "Payroll adjustment",
};

export interface InputOrigin {
  module: string;
  /** How it got onto the run. */
  how: string;
  addedBy: string;
  addedAt: string;
  facts: Fact[];
  history: { at: string; actor: string; action: string; detail?: string }[];
}

export function inputOrigin(
  i: PeriodInput,
  run: PayrollRun,
  ctx: { loans: LocaleLoan[]; expenses: PayableExpense[]; people: Map<string, LocaleEmployee>; audit: PayrollAuditEntry[]; profiles: Map<string, EmployeeTaxProfile> },
): InputOrigin {
  const pulledAt = run.calculatedAt ?? run.createdAt;
  const system = `System — pulled when ${run.preparedBy.name} built the run`;
  const facts: Fact[] = [];
  const history = ctx.audit
    .filter((a) => a.runId === run.id && (a.employeeId === i.employeeId || /input/i.test(a.action)) && (!a.detail || a.detail.includes(i.code) || /input/i.test(a.action)))
    .slice(0, 12)
    .map((a) => ({ at: a.at, actor: a.actor, action: a.action, detail: a.detail }));
  const nameOf = (id?: string | null) => (id ? ctx.people.get(id)?.fullName ?? id : undefined);

  switch (i.source) {
    case "loan": {
      const loan = ctx.loans.find((l) => l.id === i.refId);
      if (loan) {
        facts.push(
          { label: "Loan", value: `${loan.loanType} · ${loan.id}` },
          { label: "Amount", value: ngn(loan.amount) },
          { label: "Instalment", value: ngn(loan.fixedInstalment ?? loan.monthlyRepayment) },
          { label: "Repaid so far", value: ngn(loan.amountRepaid) },
          { label: "Requested", value: day(loan.requestedAt) },
          { label: "Issued", value: day(loan.issuedAt) },
          { label: "Approved by", value: nameOf(loan.approverId) ?? "—" },
        );
      }
      return { module: INPUT_MODULE_LABELS.loan, how: "The monthly instalment of an approved loan, deducted automatically while the loan is open.", addedBy: i.addedBy ?? system, addedAt: i.addedAt ?? pulledAt, facts, history };
    }
    case "expense": {
      const x = ctx.expenses.find((e) => e.id === i.refId);
      if (x) facts.push({ label: "Claim", value: `${x.title} · ${x.id}` }, { label: "Amount", value: ngn(x.amount) }, { label: "Submitted", value: day(x.dateSubmitted) }, { label: "Status", value: x.status });
      return { module: INPUT_MODULE_LABELS.expense, how: "An approved expense claim reimbursed through payroll. It is marked reimbursed when the run is finalized.", addedBy: i.addedBy ?? system, addedAt: i.addedAt ?? pulledAt, facts, history };
    }
    case "attendance":
      facts.push({ label: i.code === "UNPAID_LEAVE" || i.code === "LATENESS" ? "Days" : "Hours", value: String(i.units ?? "—") }, { label: "Period", value: run.period.label });
      return {
        module: INPUT_MODULE_LABELS.attendance,
        how: i.code.startsWith("OT_") ? "Overtime hours from approved timesheets for the period." : "Unpaid days or lateness from leave and attendance records for the period.",
        addedBy: i.addedBy ?? system,
        addedAt: i.addedAt ?? pulledAt,
        facts,
        history,
      };
    case "auto": {
      const p = ctx.profiles.get(i.employeeId);
      if (i.code === "VOL_PENSION" && p?.avc) facts.push({ label: "Mandate", value: p.avc.mandate ? `${p.avc.mandate.reference} · signed ${day(p.avc.mandate.signedOn)}` : "Not on file", tone: p.avc.mandate ? "good" : "warn" }, { label: "Contribution", value: p.avc.mode === "percent" ? `${p.avc.value}% of pensionable pay` : ngn(p.avc.value) });
      return { module: INPUT_MODULE_LABELS.auto, how: "A standing deduction on the employee's record (union dues, cooperative, voluntary pension, other agreed deductions), applied every month.", addedBy: i.addedBy ?? system, addedAt: i.addedAt ?? pulledAt, facts, history };
    }
    case "adjustment":
      if (i.refId) facts.push({ label: "Corrects", value: i.refId });
      return { module: INPUT_MODULE_LABELS.adjustment, how: "A correction carried from an adjustment run.", addedBy: i.addedBy ?? run.preparedBy.name, addedAt: i.addedAt ?? run.createdAt, facts, history };
    default: {
      // Manual: stamped when added; older inputs fall back to the audit entry that added them.
      const added = ctx.audit.find((a) => a.runId === run.id && /added pay input/i.test(a.action));
      return { module: INPUT_MODULE_LABELS.manual, how: "Entered on this run by a payroll user.", addedBy: i.addedBy ?? added?.actor ?? run.preparedBy.name, addedAt: i.addedAt ?? added?.at ?? run.createdAt, facts, history };
    }
  }
}

// ── Payroll cost year to date ───────────────────────────────────────────────

export interface CostMonth {
  month: string;
  label: string;
  /** Runs (regular, off-cycle, adjustment) finalized for the month. */
  runIds: string[];
  employees: number;
  gross: number;
  PENSION_ER: number;
  NSITF: number;
  ITF: number;
  health: number;
  GROUP_LIFE: number;
  other: number;
  employer: number;
  total: number;
}

export interface PayrollCostYtd {
  year: number;
  /** Brought forward from the previous payroll: gross and employer pension only. */
  opening: { employees: number; gross: number; pensionEmployer: number; total: number } | null;
  months: CostMonth[];
  totals: Omit<CostMonth, "month" | "label" | "runIds" | "employees">;
  byDepartment: { department: string; gross: number; employer: number; total: number; employees: number }[];
  /** Year-to-date cost: opening + every final payslip. */
  total: number;
}

const EMPLOYER_KNOWN = ["PENSION_ER", "NSITF", "ITF", "NHIS_ER", "HMO_ER", "GROUP_LIFE"];

/**
 * What payroll has cost the company this year: gross pay plus every employer
 * contribution, month by month, from final payslips — plus balances brought
 * forward from the previous payroll (gross and employer pension only).
 */
export function payrollCostYtd(
  year: number,
  payslips: { status: string; runId: string; employeeId: string; period: { year: number; month: number; label: string }; computation: PayComputation }[],
  opening: Record<string, { year: number; gross: number; pensionEmployer: number }>,
  people: Map<string, LocaleEmployee>,
): PayrollCostYtd {
  const months = new Map<string, CostMonth & { ids: Set<string> }>();
  const dept = new Map<string, { gross: number; employer: number; ids: Set<string> }>();
  const amt = (c: PayComputation, codes: string[]) => c.lines.filter((l) => l.category === "employer" && codes.includes(l.code)).reduce((s, l) => s + l.amount, 0);
  for (const p of payslips) {
    if (p.status !== "final" || p.period.year !== year) continue;
    const key = `${year}-${String(p.period.month).padStart(2, "0")}`;
    const m = months.get(key) ?? { month: key, label: p.period.label, runIds: [], employees: 0, gross: 0, PENSION_ER: 0, NSITF: 0, ITF: 0, health: 0, GROUP_LIFE: 0, other: 0, employer: 0, total: 0, ids: new Set<string>() };
    const c = p.computation;
    if (!m.runIds.includes(p.runId)) m.runIds.push(p.runId);
    m.ids.add(p.employeeId);
    m.gross += c.gross;
    m.PENSION_ER += amt(c, ["PENSION_ER"]);
    m.NSITF += amt(c, ["NSITF"]);
    m.ITF += amt(c, ["ITF"]);
    m.health += amt(c, ["NHIS_ER", "HMO_ER"]);
    m.GROUP_LIFE += amt(c, ["GROUP_LIFE"]);
    m.other += c.lines.filter((l) => l.category === "employer" && !EMPLOYER_KNOWN.includes(l.code)).reduce((s, l) => s + l.amount, 0);
    m.employer += c.employerCost;
    months.set(key, m);
    const d = people.get(p.employeeId)?.departmentName ?? "Unassigned";
    const dr = dept.get(d) ?? { gross: 0, employer: 0, ids: new Set<string>() };
    dr.gross += c.gross;
    dr.employer += c.employerCost;
    dr.ids.add(p.employeeId);
    dept.set(d, dr);
  }
  const rows: CostMonth[] = [...months.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(({ ids, ...m }) => {
      const r = { ...m, employees: ids.size } as CostMonth;
      for (const k of ["gross", "PENSION_ER", "NSITF", "ITF", "health", "GROUP_LIFE", "other", "employer"] as const) r[k] = round2(r[k]);
      r.total = round2(r.gross + r.employer);
      return r;
    });
  const op = Object.values(opening).filter((y) => y.year === year);
  const openingRow = op.length ? { employees: op.length, gross: round2(op.reduce((s, y) => s + y.gross, 0)), pensionEmployer: round2(op.reduce((s, y) => s + y.pensionEmployer, 0)), total: 0 } : null;
  if (openingRow) openingRow.total = round2(openingRow.gross + openingRow.pensionEmployer);
  const sumK = (k: keyof Omit<CostMonth, "month" | "label" | "runIds" | "employees">) => round2(rows.reduce((s, r) => s + r[k], 0));
  const totals = { gross: sumK("gross"), PENSION_ER: sumK("PENSION_ER"), NSITF: sumK("NSITF"), ITF: sumK("ITF"), health: sumK("health"), GROUP_LIFE: sumK("GROUP_LIFE"), other: sumK("other"), employer: sumK("employer"), total: sumK("total") };
  return {
    year,
    opening: openingRow,
    months: rows,
    totals,
    byDepartment: [...dept.entries()].map(([department, v]) => ({ department, gross: round2(v.gross), employer: round2(v.employer), total: round2(v.gross + v.employer), employees: v.ids.size })).sort((a, b) => b.total - a.total),
    total: round2(totals.total + (openingRow?.total ?? 0)),
  };
}
