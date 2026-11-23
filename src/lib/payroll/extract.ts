import type { LocaleEmployee } from "@/src/lib/types/locale";
import { remittanceCalendar, type ExportCtx, type ExportTable } from "./exports";
import { round2 } from "./ng/engine";
import { paymentSnapshot } from "./run-builder";
import type { PayComputation, PayrollRun, PaymentSnapshot, RunEmployee } from "./types";

/**
 * Payroll extract — the month's payroll in the layout Nigerian payroll teams
 * already use (the client's "Head Office" template): one row per employee
 * with identity, bank and statutory IDs, attendance, every earning,
 * deductions shown as negatives, net pay, and every employer cost; then a
 * TOTAL row and the month's leavers under EXITED.
 *
 * Companion sheets follow the client's other schedules: PAYE by state, NHF,
 * NSITF @ 1%, PENSION (employee / employer / total / PEN / PFA / period),
 * NO PIN, the pension payment schedule per PFA, HMO by provider, and the
 * bank schedule with sort codes.
 */

type Cell = string | number;

export interface ExtractSheet {
  name: string;
  table: ExportTable;
}

export interface ExtractCtx extends ExportCtx {
  /** The previous regular run — leavers since then go under EXITED. */
  previous?: PayrollRun | null;
}

interface Row {
  n: number;
  re: RunEmployee;
  c: PayComputation;
  emp?: LocaleEmployee;
  snap: PaymentSnapshot;
}

const sum = (c: PayComputation, codes: string[]) => round2(c.lines.filter((l) => codes.includes(l.code)).reduce((s, l) => s + l.amount, 0));
const sumIf = (c: PayComputation, f: (l: PayComputation["lines"][number]) => boolean) => round2(c.lines.filter(f).reduce((s, l) => s + l.amount, 0));
const neg = (n: number) => (n ? round2(-n) : 0);
const upper = (s: string) => s.toUpperCase();

const NAMED_EARNINGS = ["BASIC", "CONSOLIDATED", "HOUSING", "TRANSPORT", "UTILITY", "MEAL", "EDUCATION", "LEAVE_ALLOW", "13TH_MONTH", "BACK_PAY", "SALARY_ADJ", "OT_NORMAL", "OT_REST", "OT_PUBLIC", "GRATUITY", "SEVERANCE", "REDUNDANCY", "PILON", "EXPENSE_REIMB"];
const SHIFT = ["NIGHT_SHIFT", "WEEKEND", "STANDBY", "CALL_OUT", "ON_CALL", "SHUTDOWN", "BREAKDOWN"];
const NAMED_DEDUCTIONS = ["PENSION_EE", "PAYE", "WHT", "NHF", "VOL_PENSION", "HMO_EE", "NHIS_EE", "UNION_DUES", "SALARY_ADVANCE", "STAFF_LOAN", "COOP_LOAN", "EMERGENCY_LOAN"];
const NAMED_EMPLOYER = ["PENSION_ER", "NSITF", "ITF", "HMO_ER", "NHIS_ER", "GROUP_LIFE"];

/** The extract's columns — the client's heading, adapted to what MOTEE calculates. */
const COLUMNS: { header: string; value: (r: Row, ctx: ExtractCtx) => Cell; total?: boolean }[] = [
  { header: "SN", value: (r) => r.n },
  { header: "Staff Number", value: (r) => r.emp?.employeeNumber ?? r.re.employeeId },
  { header: "Department", value: (r) => r.emp?.departmentName ?? "" },
  { header: "Staff Name", value: (r) => r.emp?.fullName ?? r.re.employeeId },
  { header: "Entry", value: (r) => r.emp?.startDate ?? "" },
  { header: "Position", value: (r) => r.emp?.jobTitle ?? "" },
  { header: "Grade", value: (r) => r.emp?.grade ?? "" },
  { header: "Cost Centre", value: (r, ctx) => ctx.costCentres?.get(r.emp?.departmentName ?? "") ?? "" },
  { header: "BANK", value: (r) => r.snap.bankName },
  { header: "BANK ACCOUNT", value: (r) => r.snap.accountNumber },
  { header: "PFA", value: (r) => r.snap.pfaName },
  { header: "PEN NUMBER", value: (r) => r.snap.rsaPin },
  { header: "PHONE NUMBER", value: (r) => r.emp?.phone ?? "" },
  { header: "OFFICIAL MAIL ADDRESS", value: (r) => r.emp?.email ?? "" },
  { header: "LOCATION", value: (r) => r.emp?.workLocation ?? "" },
  { header: "STATE", value: (r) => r.snap.stateOfResidence },
  { header: "TAX IDENTIFICATION NUMBER", value: (r) => r.snap.tin },
  { header: "D.O.B", value: (r) => r.emp?.dateOfBirth ?? "" },
  { header: "GENDER", value: (r) => (r.emp?.gender ? r.emp.gender[0].toUpperCase() + r.emp.gender.slice(1).toLowerCase() : "") },
  { header: "Days Present at Work", value: (r) => r.re.attendance?.daysWorked ?? "" },
  { header: "Pro-rating Factor", value: (r) => round2(r.c.prorationFactor * 10000) / 10000 },
  // Recurring monthly pay
  { header: "Basic Allowance", value: (r) => sum(r.c, ["BASIC", "CONSOLIDATED"]), total: true },
  { header: "Housing", value: (r) => sum(r.c, ["HOUSING"]), total: true },
  { header: "Transport", value: (r) => sum(r.c, ["TRANSPORT"]), total: true },
  { header: "Utility", value: (r) => sum(r.c, ["UTILITY"]), total: true },
  { header: "Meal Allowance", value: (r) => sum(r.c, ["MEAL"]), total: true },
  { header: "Education Allowance", value: (r) => sum(r.c, ["EDUCATION"]), total: true },
  { header: "Shift Allowance", value: (r) => sum(r.c, SHIFT), total: true },
  {
    header: "Other Allowances",
    value: (r) => sumIf(r.c, (l) => l.category === "earning" && l.group === "allowances" && !NAMED_EARNINGS.includes(l.code) && !SHIFT.includes(l.code)),
    total: true,
  },
  { header: "Total Monthly Gross", value: (r) => sumIf(r.c, (l) => l.category === "earning" && (l.group === "core" || l.group === "allowances") && l.code !== "LEAVE_ALLOW"), total: true },
  // Variable / one-off pay
  { header: "Annual Leave Allow", value: (r) => sum(r.c, ["LEAVE_ALLOW"]), total: true },
  { header: "13TH MONTH", value: (r) => sum(r.c, ["13TH_MONTH"]), total: true },
  { header: "Arrears", value: (r) => sum(r.c, ["BACK_PAY", "SALARY_ADJ"]), total: true },
  { header: "Bonus & Commission", value: (r) => sumIf(r.c, (l) => l.category === "earning" && (l.group === "bonuses" || l.group === "annual") && l.code !== "13TH_MONTH"), total: true },
  { header: "Weekday Overtime amt", value: (r) => sum(r.c, ["OT_NORMAL"]), total: true },
  { header: "Weekend & Public Holiday Overtime amt", value: (r) => sum(r.c, ["OT_REST", "OT_PUBLIC"]), total: true },
  { header: "Severance pkge & Gratuity", value: (r) => sum(r.c, ["GRATUITY", "SEVERANCE", "REDUNDANCY", "PILON"]), total: true },
  { header: "Expense Reimbursement", value: (r) => sum(r.c, ["EXPENSE_REIMB"]), total: true },
  { header: "Absence & Lateness", value: (r) => sumIf(r.c, (l) => l.category === "earning" && l.amount < 0), total: true },
  {
    header: "Other Earnings",
    value: (r) => {
      const named = sumIf(r.c, (l) => l.category === "earning" && (NAMED_EARNINGS.includes(l.code) || SHIFT.includes(l.code) || l.group === "core" || l.group === "allowances" || l.group === "bonuses" || l.group === "annual" || l.amount < 0));
      return round2(r.c.gross - named);
    },
    total: true,
  },
  { header: "Total Allowances (Gross Pay)", value: (r) => r.c.gross, total: true },
  // Deductions — negative, as in the template
  { header: "Pension", value: (r) => neg(sum(r.c, ["PENSION_EE"])), total: true },
  { header: "PAYE", value: (r) => neg(sum(r.c, ["PAYE", "WHT"])), total: true },
  { header: "NHF", value: (r) => neg(sum(r.c, ["NHF"])), total: true },
  { header: "Voluntary Pension (AVC)", value: (r) => neg(sum(r.c, ["VOL_PENSION"])), total: true },
  { header: "HMO / Health Insurance", value: (r) => neg(sum(r.c, ["HMO_EE", "NHIS_EE"])), total: true },
  { header: "Union dues", value: (r) => neg(sum(r.c, ["UNION_DUES"])), total: true },
  { header: "Loan deduction", value: (r) => neg(sum(r.c, ["SALARY_ADVANCE", "STAFF_LOAN", "COOP_LOAN", "EMERGENCY_LOAN"])), total: true },
  { header: "Other deductions", value: (r) => neg(sumIf(r.c, (l) => l.category === "deduction" && !NAMED_DEDUCTIONS.includes(l.code))), total: true },
  { header: "Crcy", value: () => "NGN" },
  { header: "Total Deductions", value: (r) => neg(r.c.totalDeductions), total: true },
  { header: "NET PAY", value: (r) => r.c.net, total: true },
  // Employer costs
  { header: "Employer Pension Con", value: (r) => sum(r.c, ["PENSION_ER"]), total: true },
  { header: "NSITF", value: (r) => sum(r.c, ["NSITF"]), total: true },
  { header: "ITF", value: (r) => sum(r.c, ["ITF"]), total: true },
  { header: "Medical (HMO / NHIA)", value: (r) => sum(r.c, ["HMO_ER", "NHIS_ER"]), total: true },
  { header: "Group Life Insurance", value: (r) => sum(r.c, ["GROUP_LIFE"]), total: true },
  { header: "Other Employer Costs", value: (r) => sumIf(r.c, (l) => l.category === "employer" && !NAMED_EMPLOYER.includes(l.code)), total: true },
  { header: "Total Employee Cost", value: (r) => round2(r.c.gross + r.c.employerCost), total: true },
  { header: "Crcy", value: () => "NGN" },
  { header: "REMARK", value: () => "" },
];

/** Plain-English remark: joiner, part month, unpaid days, new salary. */
function remarkFor(r: Row, run: PayrollRun, previous?: PayrollRun | null): string {
  const out: string[] = [];
  const wasPaid = previous?.employees.some((e) => e.employeeId === r.re.employeeId && e.included && e.computation);
  if (previous && !wasPaid) out.push(r.emp?.startDate && r.emp.startDate >= run.period.start ? `New joiner (${r.emp.startDate})` : "Not paid last month");
  if (r.c.prorationFactor < 1) out.push(`Part month (${Math.round(r.c.prorationFactor * 100)}%)`);
  if (r.re.attendance?.unpaidLeaveDays) out.push(`${r.re.attendance.unpaidLeaveDays} unpaid day${r.re.attendance.unpaidLeaveDays === 1 ? "" : "s"}`);
  if (r.emp?.dateOfLeaving && r.emp.dateOfLeaving <= run.period.end) out.push(`Leaving ${r.emp.dateOfLeaving}`);
  return out.join("; ");
}

const titleFor = (ctx: ExtractCtx) => upper(ctx.company?.legalName ?? "Payroll");
const monthOf = (run: PayrollRun) => upper(run.period.label);

export function buildPayrollExtract(ctx: ExtractCtx): ExtractSheet[] {
  const { run } = ctx;
  const rows: Row[] = run.employees
    .filter((e) => e.included && e.computation)
    .map((re) => ({ re, c: re.computation!, emp: ctx.people.get(re.employeeId), snap: re.snapshot ?? paymentSnapshot(ctx.profiles.get(re.employeeId)) }))
    .sort((a, b) => (a.emp?.departmentName ?? "").localeCompare(b.emp?.departmentName ?? "") || (a.emp?.employeeNumber ?? "").localeCompare(b.emp?.employeeNumber ?? ""))
    .map((r, i) => ({ ...r, n: i + 1 }));
  const company = titleFor(ctx);
  const month = monthOf(run);

  // ── Main extract ──
  const remarkIdx = COLUMNS.length - 1;
  const data: Cell[][] = rows.map((r) => {
    const cells = COLUMNS.map((col) => col.value(r, ctx));
    cells[remarkIdx] = remarkFor(r, run, ctx.previous);
    return cells;
  });
  const totals: Cell[] = COLUMNS.map((col, i) => (i === 0 ? "" : i === 3 ? `TOTAL — ${rows.length} staff` : col.total ? round2(data.reduce((s, d) => s + (Number(d[i]) || 0), 0)) : ""));
  const exited: Cell[][] = [];
  if (ctx.previous) {
    const now = new Set(rows.map((r) => r.re.employeeId));
    const gone = ctx.previous.employees.filter((e) => e.included && e.computation && !now.has(e.employeeId));
    if (gone.length) {
      exited.push([], ["", "EXITED"]);
      gone.forEach((e, i) => {
        const emp = ctx.people.get(e.employeeId);
        const cells: Cell[] = COLUMNS.map(() => "");
        cells[0] = i + 1;
        cells[1] = emp?.employeeNumber ?? e.employeeId;
        cells[2] = emp?.departmentName ?? "";
        cells[3] = emp?.fullName ?? e.employeeId;
        cells[4] = emp?.startDate ?? "";
        cells[5] = emp?.jobTitle ?? "";
        cells[remarkIdx] = `${emp?.dateOfLeaving ? `Left ${emp.dateOfLeaving}` : "Not paid this month"} · last gross ${e.computation!.gross.toLocaleString("en-NG", { maximumFractionDigits: 2 })} in ${ctx.previous!.period.label}`;
        exited.push(cells);
      });
    }
  }
  const main: ExtractSheet = {
    name: `${month.split(" ")[0].slice(0, 3)} ${run.period.year} PAYROLL`,
    table: {
      preamble: [[`${company} - ${month} PAYROLL`], [`${run.title} · ${run.status === "draft" ? "DRAFT — figures can still change" : run.status.toUpperCase()} · pay day ${run.period.payDate}`]],
      headers: COLUMNS.map((c) => c.header),
      data,
      trailer: [totals, ...exited],
    },
  };

  // ── PAYE by state ──
  const payeRows = rows.filter((r) => sum(r.c, ["PAYE", "WHT"]) !== 0).sort((a, b) => a.snap.stateOfResidence.localeCompare(b.snap.stateOfResidence) || (a.emp?.fullName ?? "").localeCompare(b.emp?.fullName ?? ""));
  const payeData: Cell[][] = [];
  let state = "";
  let stateTotal = 0;
  const flushState = () => {
    if (state) payeData.push(["", `${state} TOTAL`, "", "", "", round2(stateTotal)]);
  };
  payeRows.forEach((r, i) => {
    const st = r.snap.stateOfResidence || "UNASSIGNED";
    if (st !== state) {
      flushState();
      state = st;
      stateTotal = 0;
    }
    const tax = sum(r.c, ["PAYE", "WHT"]);
    stateTotal += tax;
    payeData.push([i + 1, upper(r.emp?.fullName ?? ""), upper(st), r.snap.tin || "MISSING TIN", r.c.gross, tax]);
  });
  flushState();
  const paye: ExtractSheet = {
    name: "PAYE",
    table: {
      preamble: [[company], [`PAYE SCHEDULE FOR THE MONTH OF ${month}`]],
      headers: ["S/N", "NAME", "STATE", "TIN", "MONTHLY GROSS", "TAX"],
      data: payeData,
      trailer: [["", "TOTAL", "", "", round2(payeRows.reduce((s, r) => s + r.c.gross, 0)), round2(payeRows.reduce((s, r) => s + sum(r.c, ["PAYE", "WHT"]), 0))]],
    },
  };

  // ── NHF ──
  const nhfRows = rows.filter((r) => sum(r.c, ["NHF"]) > 0);
  const nhf: ExtractSheet = {
    name: "NHF",
    table: {
      preamble: [[company], [`NHF SCHEDULE FOR THE MONTH OF ${month}`]],
      headers: ["S/N", "Staff ID Number", "NAME", "NHF NUMBER", "NHF"],
      data: nhfRows.map((r, i) => [i + 1, r.emp?.employeeNumber ?? "", upper(r.emp?.fullName ?? ""), r.snap.nhfNumber || "—", sum(r.c, ["NHF"])]),
      trailer: [["", "", "TOTAL", "", round2(nhfRows.reduce((s, r) => s + sum(r.c, ["NHF"]), 0))]],
    },
  };

  // ── NSITF ──
  const nsRows = rows.filter((r) => sum(r.c, ["NSITF"]) > 0);
  const nsitf: ExtractSheet = {
    name: "NSITF",
    table: {
      preamble: [[company], [`NSITF SCHEDULE FOR THE MONTH OF ${month}`]],
      headers: ["S/N", "Staff ID Number", "NAME", "GROSS INCOME", "NSITF @ 1% of Gross Income"],
      data: nsRows.map((r, i) => [i + 1, r.emp?.employeeNumber ?? "", upper(r.emp?.fullName ?? ""), r.c.gross, sum(r.c, ["NSITF"])]),
      trailer: [["", "", "TOTAL", round2(nsRows.reduce((s, r) => s + r.c.gross, 0)), round2(nsRows.reduce((s, r) => s + sum(r.c, ["NSITF"]), 0))]],
    },
  };

  // ── Pension (with PIN) and NO PIN ──
  const penRows = rows.filter((r) => sum(r.c, ["PENSION_EE", "PENSION_ER", "VOL_PENSION"]) > 0);
  const period = run.period.end;
  const penLine = (r: Row): Cell[] => {
    const ee = sum(r.c, ["PENSION_EE"]);
    const er = sum(r.c, ["PENSION_ER"]);
    const avc = sum(r.c, ["VOL_PENSION"]);
    return [upper(r.emp?.fullName ?? ""), ee, er, avc, round2(ee + er + avc), r.snap.rsaPin || "", r.snap.pfaName || "", period];
  };
  const withPin = penRows.filter((r) => r.snap.rsaPin).sort((a, b) => a.snap.pfaName.localeCompare(b.snap.pfaName));
  const noPin = penRows.filter((r) => !r.snap.rsaPin);
  const penTotal = (rs: Row[]): Cell[] => ["TOTAL", ...[0, 1, 2, 3].map((k) => round2(rs.reduce((s, r) => s + Number(penLine(r)[k + 1]), 0))), "", "", ""];
  const penHeaders = ["NAME", "EMPLOYEE PEN", "EMPLOYER PEN", "VOLUNTARY (AVC)", "TOTAL", "PEN", "PFA", "PERIOD"];
  const pension: ExtractSheet = {
    name: "PENSION",
    table: { preamble: [[company], [`PENSION SCHEDULE FOR THE MONTH OF ${month}`]], headers: penHeaders, data: withPin.map(penLine), trailer: [penTotal(withPin)] },
  };
  const noPinSheet: ExtractSheet = {
    name: "NO PIN",
    table: { preamble: [[company], [`PENSION SCHEDULE FOR THE MONTH OF ${month}`], ["EMPLOYEES WITHOUT PIN — contributions held until an RSA PIN is on file"]], headers: penHeaders, data: noPin.map(penLine), trailer: [penTotal(noPin)] },
  };

  // ── Pension payment schedule — one instruction per PFA ──
  const due = remittanceCalendar(run.period).find((c) => c.key === "pension")?.due ?? "";
  const byPfa = new Map<string, { amount: number; code: string }>();
  for (const r of withPin) {
    const k = r.snap.pfaName || "Unknown PFA";
    const cur = byPfa.get(k) ?? { amount: 0, code: r.snap.pfaCode };
    cur.amount += Number(penLine(r)[4]);
    byPfa.set(k, cur);
  }
  const payment: ExtractSheet = {
    name: "PENSION PYMT SCHEDULE",
    table: {
      preamble: [[company], [`PENSION PAYMENT SCHEDULE — ${month}`], ["Fill in each PFA's custodian account and sort code before sending to the bank."]],
      headers: ["AMOUNT", "PAYMENT DATE", "REFERENCE", "REMARK", "VENDOR CODE", "VENDOR NAME", "PFA CODE", "ACCOUNT NO", "VENDOR BANK SORT CODE"],
      data: [...byPfa.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([pfa, v], i) => [round2(v.amount), due, `PEN-${run.period.year}${String(run.period.month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`, `${company} ${month} PENSION`, ctx.settings?.employerIds?.pencomEmployerCode ?? "", upper(pfa), v.code || "", "", ""]),
      trailer: [[round2([...byPfa.values()].reduce((s, v) => s + v.amount, 0)), "", "", "TOTAL", "", "", "", "", ""]],
    },
  };

  // ── HMO by provider ──
  const hmoRows = rows.filter((r) => sum(r.c, ["HMO_EE", "HMO_ER"]) > 0);
  const planOf = (r: Row) => ctx.settings?.hmo?.plans.find((p) => p.id === r.c.lines.find((l) => l.code === "HMO_EE" || l.code === "HMO_ER")?.refId);
  const providerOf = (r: Row) => ctx.settings?.hmo?.providers.find((p) => p.id === planOf(r)?.providerId)?.name ?? "HMO";
  const hmo: ExtractSheet = {
    name: "HMO",
    table: {
      preamble: [[company], [`HMO SCHEDULE FOR THE MONTH OF ${month}`]],
      headers: ["S/N", "HMO PROVIDER", "Staff ID Number", "NAME", "PLAN", "EMPLOYEE SHARE", "EMPLOYER SHARE", "PREMIUM"],
      data: hmoRows
        .sort((a, b) => providerOf(a).localeCompare(providerOf(b)))
        .map((r, i) => [i + 1, upper(providerOf(r)), r.emp?.employeeNumber ?? "", upper(r.emp?.fullName ?? ""), planOf(r)?.name ?? "", sum(r.c, ["HMO_EE"]), sum(r.c, ["HMO_ER"]), sum(r.c, ["HMO_EE", "HMO_ER"])]),
      trailer: [["", "", "", "TOTAL", "", round2(hmoRows.reduce((s, r) => s + sum(r.c, ["HMO_EE"]), 0)), round2(hmoRows.reduce((s, r) => s + sum(r.c, ["HMO_ER"]), 0)), round2(hmoRows.reduce((s, r) => s + sum(r.c, ["HMO_EE", "HMO_ER"]), 0))]],
    },
  };

  // ── Bank schedule (net pay with sort codes) ──
  const bank: ExtractSheet = {
    name: "BANK SCHEDULE",
    table: {
      preamble: [[company], [`SALARY PAYMENT SCHEDULE — ${month}`]],
      headers: ["S/N", "Staff ID Number", "NAME", "BANK", "ACCOUNT NO", "VENDOR BANK SORT CODE", "NET PAY"],
      data: rows.map((r, i) => [i + 1, r.emp?.employeeNumber ?? "", upper(r.emp?.fullName ?? ""), r.snap.bankName, r.snap.accountNumber, r.snap.bankCode, r.c.net]),
      trailer: [["", "", "TOTAL", "", "", "", round2(rows.reduce((s, r) => s + r.c.net, 0))]],
    },
  };

  return [main, paye, nhf, nsitf, pension, noPinSheet, payment, ...(hmoRows.length ? [hmo] : []), bank];
}
