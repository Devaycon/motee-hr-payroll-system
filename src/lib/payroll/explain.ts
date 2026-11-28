import { round2 } from "./ng/engine";
import { resolveRateSet } from "./ng/rate-sets";
import { structureOn, type TenantPayrollData } from "./run-builder";
import type { EmployeeTaxProfile, PayrollRun, Payslip, PayslipLine, StatutoryRateSet } from "./types";

/**
 * Click-to-explain payslip (client feedback B6, Nov 2026). For any line on a
 * payslip: the amount, the basis and rate, the formula, the period, where it
 * came from (HR record, attendance, payroll input, approved adjustment,
 * statutory configuration) with its approval or reference, and how it moved
 * month to month.
 *
 * Everything is read from the stored payslip and the records behind it —
 * nothing is recalculated, so the explanation always agrees with the slip.
 */

export type ExplainSourceKind = "hr_record" | "attendance" | "payroll_input" | "approved_adjustment" | "statutory_configuration" | "loan" | "expense" | "policy" | "employee_mandate";

export const EXPLAIN_SOURCE_LABELS: Record<ExplainSourceKind, string> = {
  hr_record: "HR record — salary structure",
  attendance: "Attendance record",
  payroll_input: "Payroll input",
  approved_adjustment: "Approved adjustment",
  statutory_configuration: "Statutory configuration",
  loan: "Loans module",
  expense: "Approved expense claim",
  policy: "Company pay policy",
  employee_mandate: "Employee's signed mandate",
};

export interface LineExplanation {
  code: string;
  name: string;
  amount: number;
  category: PayslipLine["category"];
  period: string;
  /** "Pensionable pay (basic + housing + transport)". */
  basis?: { label: string; amount: number };
  /** "8%". */
  rate?: string;
  /** Each step of the calculation, ending with the amount on the slip. */
  formula: { label: string; value: string }[];
  source: { kind: ExplainSourceKind; detail: string; reference?: string; approvedBy?: string };
  /** The same line in every month of the tax year so far. */
  history: { month: number; label: string; amount: number; current: boolean }[];
  /** This month against the last month that paid any amount on this line. */
  change?: { previousLabel: string; previous: number; delta: number };
  /** Anything a reader should know ("pro-rated for 12 of 22 working days"). */
  notes: string[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const naira = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (r: number) => `${Math.round(r * 10000) / 100}%`;
const fmtDay = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export interface ExplainCtx {
  data: Pick<TenantPayrollData, "payslips" | "openingYtd" | "structures" | "rateSets" | "runs"> & { openingMonths?: TenantPayrollData["openingMonths"] };
  profile?: EmployeeTaxProfile | null;
}

/** The line's amount in each month of the year up to the payslip (brought-forward months included). */
export function lineHistory(ctx: ExplainCtx, p: Payslip, code: string): LineExplanation["history"] {
  const { year, month } = p.period;
  const byMonth = new Map<number, number>();
  for (const m of ctx.data.openingMonths?.[p.employeeId] ?? []) {
    if (m.figures.year !== year) continue;
    byMonth.set(m.figures.month, (byMonth.get(m.figures.month) ?? 0) + m.lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0));
  }
  for (const s of ctx.data.payslips) {
    if (s.employeeId !== p.employeeId || s.status !== "final" || s.period.year !== year || s.period.month > month || s.id === p.id) continue;
    byMonth.set(s.period.month, (byMonth.get(s.period.month) ?? 0) + s.computation.lines.filter((l) => l.code === code).reduce((x, l) => x + l.amount, 0));
  }
  byMonth.set(month, (byMonth.get(month) ?? 0) + p.computation.lines.filter((l) => l.code === code).reduce((x, l) => x + l.amount, 0));
  return [...byMonth.entries()].sort((a, b) => a[0] - b[0]).map(([m, amount]) => ({ month: m, label: MONTHS[m - 1], amount: round2(amount), current: m === month }));
}

function inputFor(run: PayrollRun | undefined, p: Payslip, line: PayslipLine) {
  return run?.inputs.find((i) => i.employeeId === p.employeeId && i.code === line.code && (!line.refId || i.refId === line.refId));
}

export function explainLine(p: Payslip, line: PayslipLine, ctx: ExplainCtx): LineExplanation {
  const c = p.computation;
  const rs: StatutoryRateSet = ctx.data.rateSets.find((r) => r.id === c.rateSetId) ?? resolveRateSet(ctx.data.rateSets, p.period.end);
  const run = ctx.data.runs.find((r) => r.id === p.runId);
  const history = lineHistory(ctx, p, line.code);
  const before = history.filter((h) => !h.current && Math.abs(h.amount) >= 0.005);
  const last = before[before.length - 1];
  const notes: string[] = [];
  const out: LineExplanation = {
    code: line.code,
    name: line.name,
    amount: line.amount,
    category: line.category,
    period: p.period.label,
    formula: [],
    source: { kind: "payroll_input", detail: line.note ?? "Entered on the payroll run" },
    history,
    change: last ? { previousLabel: `${last.label} ${p.period.year}`, previous: last.amount, delta: round2(line.amount - last.amount) } : undefined,
    notes,
  };
  const legal = rs.legalBasis;
  const amountStep = { label: `${line.name} on this payslip`, value: naira(line.amount) };

  switch (line.code) {
    case "PENSION_EE":
    case "PENSION_ER": {
      const rate = line.code === "PENSION_EE" ? rs.employeePensionRate : rs.employerPensionRate;
      out.basis = { label: "Pensionable pay (basic + housing + transport)", amount: c.bases.pensionable };
      out.rate = pct(rate);
      out.formula = [{ label: "Pensionable pay", value: naira(c.bases.pensionable) }, { label: `× ${line.code === "PENSION_EE" ? "employee" : "employer"} rate`, value: pct(rate) }, amountStep];
      out.source = { kind: "statutory_configuration", detail: `Pension Reform Act 2014 — rate set “${rs.label}”`, reference: rs.id };
      if (line.code === "PENSION_ER") notes.push("Paid by your employer into your RSA on top of your pay — not deducted from you.");
      notes.push("Pension is tax-relieved: it reduces the income PAYE is charged on.");
      break;
    }
    case "VOL_PENSION": {
      const avc = ctx.profile?.avc;
      out.basis = avc?.mode === "percent" ? { label: "Pensionable pay", amount: c.bases.pensionable } : undefined;
      out.rate = avc?.mode === "percent" ? `${avc.value}%` : undefined;
      out.formula = avc?.mode === "percent" ? [{ label: "Pensionable pay", value: naira(c.bases.pensionable) }, { label: "× your voluntary rate", value: `${avc.value}%` }, amountStep] : [{ label: "Fixed monthly amount you chose", value: naira(line.amount) }];
      out.source = { kind: "employee_mandate", detail: avc?.mandate ? `Your voluntary pension instruction signed ${fmtDay(avc.mandate.signedOn)}` : "Voluntary pension on your tax & statutory profile", reference: avc?.mandate?.reference };
      notes.push("Voluntary contributions are tax-relieved, and go to your RSA with your PFA.");
      break;
    }
    case "NHF": {
      out.basis = { label: "NHF base", amount: c.bases.nhf };
      out.rate = pct(rs.nhfRate);
      out.formula = [{ label: "NHF base", value: naira(c.bases.nhf) }, { label: "× NHF rate", value: pct(rs.nhfRate) }, amountStep];
      out.source = { kind: "statutory_configuration", detail: `National Housing Fund Act — rate set “${rs.label}”`, reference: rs.id };
      break;
    }
    case "NHIS_EE":
    case "NHIS_ER": {
      const rate = line.code === "NHIS_EE" ? rs.nhisEmployeeRate : rs.nhisEmployerRate;
      out.basis = { label: "NHIA base", amount: c.bases.nhis };
      out.rate = pct(rate);
      out.formula = [{ label: "NHIA base", value: naira(c.bases.nhis) }, { label: "× rate", value: pct(rate) }, amountStep];
      out.source = { kind: "statutory_configuration", detail: "National Health Insurance Authority Act", reference: rs.id };
      break;
    }
    case "NSITF":
    case "ITF": {
      const rate = line.code === "NSITF" ? rs.nsitfRate : rs.itfRate;
      out.basis = { label: "Gross pay", amount: c.gross };
      out.rate = pct(rate);
      out.formula = [{ label: "Gross pay", value: naira(c.gross) }, { label: "× rate", value: pct(rate) }, amountStep];
      out.source = { kind: "statutory_configuration", detail: line.code === "NSITF" ? "Employee's Compensation Act 2010" : "Industrial Training Fund Act", reference: rs.id };
      notes.push("Paid by your employer — not deducted from your pay.");
      break;
    }
    case "PAYE":
    case "WHT": {
      const t = c.tax;
      out.source = { kind: "statutory_configuration", detail: `${legal} — ${t.method} method, tax month ${t.monthOfYear}`, reference: rs.id };
      if (t.method === "cumulative") {
        out.basis = { label: `Taxable pay to date (${t.monthOfYear} months)`, amount: t.taxableToDate };
        out.formula = [
          { label: `Taxable pay to date`, value: naira(t.taxableToDate) },
          ...t.reliefs.map((r) => ({ label: `− ${r.label}`, value: naira(r.toDate) })),
          { label: "Chargeable income to date", value: naira(t.cumulativeChargeable) },
          { label: `Tax on it (bands × ${t.monthOfYear}/12)`, value: naira(t.taxDueToDate) },
          { label: "− tax already paid this year", value: naira(t.taxPaidBefore) },
          amountStep,
        ];
      } else {
        out.basis = { label: "Taxable pay × 12", amount: round2(t.periodTaxableGross * 12) };
        out.formula = [
          { label: "Taxable pay × 12", value: naira(t.periodTaxableGross * 12) },
          ...t.reliefs.map((r) => ({ label: `− ${r.label}`, value: naira(r.annual) })),
          { label: "Chargeable income", value: naira(t.annualisedChargeable) },
          { label: "Annual tax ÷ 12", value: naira(t.annualisedTax / 12) },
          amountStep,
        ];
      }
      out.rate = `${t.effectiveRatePct.toFixed(1)}% effective`;
      if (t.exemptReason) notes.push(t.exemptReason);
      notes.push(`Remitted to the ${p.employee.stateOfResidence || "State"} Internal Revenue Service.`);
      break;
    }
    default: {
      const s = structureOn(ctx.data.structures, p.employeeId, p.period.end);
      const structureLine = s?.lines.find((l) => l.code === line.code);
      const input = inputFor(run, p, line);
      if (line.source === "attendance" || line.code.startsWith("OT_") || line.code === "UNPAID_LEAVE" || line.code === "LATENESS") {
        out.basis = line.rate ? { label: line.code.startsWith("OT_") ? "Hourly rate" : "Daily rate", amount: line.rate } : undefined;
        out.formula = line.units && line.rate ? [{ label: line.code.startsWith("OT_") ? "Hours" : "Days", value: String(line.units) }, { label: "× rate", value: naira(line.rate) }, amountStep] : [amountStep];
        out.source = { kind: "attendance", detail: line.code.startsWith("OT_") ? "Approved timesheet hours" : "Leave & attendance records for the period", reference: input?.id };
      } else if (line.source === "loan") {
        out.formula = [amountStep];
        out.source = { kind: "loan", detail: line.note ?? "Loan repayment schedule", reference: line.refId };
      } else if (line.source === "expense") {
        out.formula = [amountStep];
        out.source = { kind: "expense", detail: line.note ?? "Reimbursement of an approved expense claim", reference: line.refId };
      } else if (line.source === "adjustment") {
        out.formula = [amountStep];
        out.source = { kind: "approved_adjustment", detail: line.note ?? "Correction approved on an adjustment run", reference: line.refId ?? p.runId, approvedBy: run?.approvedBy?.name };
      } else if (line.code === "LEAVE_ALLOW") {
        out.formula = [amountStep];
        out.source = { kind: "policy", detail: line.note ?? "Annual leave allowance under the company policy (once per tax year)" };
      } else if (structureLine && line.category === "earning") {
        const full = structureLine.amount;
        out.basis = { label: "Monthly amount in your salary structure", amount: full };
        out.formula = [{ label: "Annual", value: naira(full * 12) }, { label: "÷ 12", value: naira(full) }];
        if (Math.abs(full - line.amount) >= 0.005) {
          out.formula.push({ label: `× pay for the period (${Math.round(c.prorationFactor * 10000) / 100}%)`, value: naira(line.amount) });
          notes.push(c.prorationFactor < 1 ? "Pro-rated: you were paid for part of the period (start date, leaving date or unpaid days)." : "Differs from the structure amount for this period.");
        }
        out.formula.push(amountStep);
        out.source = {
          kind: "hr_record",
          detail: `Salary structure effective ${fmtDay(s!.effectiveFrom)}${s!.reason ? ` — ${s!.reason}` : ""}`,
          reference: s!.id,
          approvedBy: s!.approvedBy || undefined,
        };
      } else {
        out.formula = line.units && line.rate ? [{ label: "Units", value: String(line.units) }, { label: "× rate", value: naira(line.rate) }, amountStep] : [amountStep];
        out.source = {
          kind: line.source === "manual" ? "payroll_input" : input ? "payroll_input" : "hr_record",
          detail: input ? `${input.description || line.name}${input.addedBy ? ` — added by ${input.addedBy}` : ""}${input.addedAt ? ` on ${fmtDay(input.addedAt)}` : ""}` : line.note ?? "On your employee record",
          reference: input?.refId ?? input?.id ?? line.refId,
          approvedBy: run?.approvedBy?.name,
        };
      }
      if (line.note && !notes.includes(line.note) && out.source.detail !== line.note) notes.push(line.note);
    }
  }
  if (run?.approvedBy && !out.source.approvedBy && out.source.kind !== "statutory_configuration") out.source.approvedBy = `${run.approvedBy.name} (payroll approval)`;
  return out;
}
