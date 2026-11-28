import { Banknote, Building2, Landmark, Layers, PiggyBank, Receipt } from "lucide-react";
import { remittanceAmounts, remittanceCalendar, type RemittanceItem } from "@/src/lib/payroll/exports";
import { lockedRunsByMonth } from "@/src/lib/payroll/remittances";
import type { PayslipLine } from "@/src/lib/payroll/types";
import { defineReport, type AnyReportDef, type ChartDetail, type ReportChartSpec } from "../types";
import { barSpec, monthLabel, multiBarSpec, lineSpec, pieSpec, sumBy, type Tally } from "../charts";

/**
 * Payroll in Analytics & Reports (Nigeria tenants, payroll viewers only).
 * Rows come from FINAL payslips, so every figure is what was approved and
 * paid — drafts never leak into reporting.
 */

// ── Shared helpers ──────────────────────────────────────────────────────────

const round = (n: number) => Math.round(n * 100) / 100;
const sum = <T,>(rows: T[], v: (r: T) => number) => round(rows.reduce((s, r) => s + v(r), 0));
const amt = (lines: PayslipLine[], ...codes: string[]) => lines.filter((l) => codes.includes(l.code)).reduce((s, l) => s + l.amount, 0);
const naira = (n: number) =>
  Math.abs(n) >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(2)}m` : Math.abs(n) >= 1_000 ? `₦${(n / 1_000).toFixed(1)}k` : `₦${Math.round(n).toLocaleString("en-NG")}`;
const pctText = (part: number, whole: number) => (whole ? `${((part / whole) * 100).toFixed(1)}%` : "0%");

/** Money pie: the donut renders currency, and its legend does too. */
function moneyPie(id: string, title: string, rows: Tally[], opts: { description?: string; footer?: string; centerLabel?: string } = {}): ReportChartSpec {
  const spec = pieSpec(id, title, rows.filter((r) => r.value > 0), opts);
  return { ...spec, money: true, details: (spec.details ?? []).map((d: ChartDetail) => ({ ...d, money: true, pct: false })) } as ReportChartSpec;
}

/** Sort "YYYY-MM" months and relabel them "Aug 26". */
function monthly<T extends { month: string }>(rows: T[], fields: Record<string, (r: T) => number>) {
  const months = [...new Set(rows.map((r) => r.month))].sort();
  return months.map((m) => {
    const inMonth = rows.filter((r) => r.month === m);
    const out: Record<string, unknown> = { month: `${monthLabel(m)} ${m.slice(2, 4)}` };
    for (const [k, f] of Object.entries(fields)) out[k] = sum(inMonth, f);
    return out;
  });
}

// ── Payroll register ────────────────────────────────────────────────────────

export interface PayrollRow {
  month: string;
  runId: string;
  period: string;
  runType: string;
  reference: string;
  employeeId: string;
  payslipId: string;
  employeeNumber: string;
  name: string;
  department: string;
  employmentType: string;
  state: string;
  bank: string;
  pfa: string;
  basic: number;
  allowances: number;
  overtime: number;
  oneOff: number;
  reimbursements: number;
  gross: number;
  taxable: number;
  paye: number;
  pensionEe: number;
  avc: number;
  nhf: number;
  otherDeductions: number;
  totalDeductions: number;
  net: number;
  pensionEr: number;
  nsitf: number;
  itf: number;
  hmoEe: number;
  hmoEr: number;
  groupLife: number;
  nhisEr: number;
  /** Any other employer line (custom elements) — keeps the components summing to Employer Cost. */
  otherEr: number;
  /** Basic + housing + transport: the base employer pension is charged on. */
  pensionable: number;
  employerCost: number;
  totalCost: number;
}

const RUN_TYPE_LABEL: Record<string, string> = { regular: "Regular", off_cycle: "Off-cycle", adjustment: "Adjustment" };

function selectPayroll(payroll: Parameters<AnyReportDef["select"]>[1]["payroll"]): PayrollRow[] {
  if (!payroll) return [];
  return payroll.payslips
    .filter((p) => p.status === "final")
    .map((p) => {
      const c = p.computation;
      const earn = c.lines.filter((l) => l.category === "earning");
      const byGroup = (...groups: string[]) => round(earn.filter((l) => groups.includes(l.group)).reduce((s, l) => s + l.amount, 0));
      const basic = round(amt(earn, "BASIC", "CONSOLIDATED"));
      const paye = round(amt(c.lines, "PAYE", "WHT"));
      const pensionEe = round(amt(c.lines, "PENSION_EE"));
      const avc = round(amt(c.lines, "VOL_PENSION"));
      const nhf = round(amt(c.lines, "NHF"));
      return {
        month: `${p.period.year}-${String(p.period.month).padStart(2, "0")}`,
        runId: p.runId,
        period: p.period.label,
        runType: RUN_TYPE_LABEL[p.runType] ?? p.runType,
        reference: p.reference,
        employeeId: p.employeeId,
        payslipId: p.id,
        employeeNumber: p.employee.employeeNumber,
        name: p.employee.fullName,
        department: p.employee.departmentName || "Unassigned",
        employmentType: p.employee.employmentType || "—",
        state: p.employee.stateOfResidence || "Unassigned",
        bank: p.employee.bankName || "No bank on file",
        pfa: p.employee.pfaName || "No PFA",
        basic,
        allowances: round(byGroup("core", "allowances") - basic),
        overtime: byGroup("overtime", "manufacturing"),
        oneOff: byGroup("bonuses", "annual", "termination", "benefits_in_kind", "corrections"),
        reimbursements: byGroup("reimbursements"),
        gross: c.gross,
        taxable: c.taxableGross,
        paye,
        pensionEe,
        avc,
        nhf,
        otherDeductions: round(c.totalDeductions - paye - pensionEe - avc - nhf - round(amt(c.lines, "NHIS_EE"))),
        totalDeductions: c.totalDeductions,
        net: c.net,
        pensionEr: round(amt(c.lines, "PENSION_ER")),
        nsitf: round(amt(c.lines, "NSITF")),
        hmoEe: round(amt(c.lines, "HMO_EE")),
        hmoEr: round(amt(c.lines, "HMO_ER")),
        itf: round(amt(c.lines, "ITF")),
        groupLife: round(amt(c.lines, "GROUP_LIFE")),
        nhisEr: round(amt(c.lines, "NHIS_ER")),
        otherEr: round(c.employerCost - amt(c.lines, "PENSION_ER", "NSITF", "ITF", "HMO_ER", "GROUP_LIFE", "NHIS_ER")),
        pensionable: c.bases.pensionable,
        employerCost: c.employerCost,
        totalCost: round(c.gross + c.employerCost),
      };
    })
    .sort((a, b) => b.month.localeCompare(a.month) || a.name.localeCompare(b.name));
}

/** Change in a figure between the last two months present in `rows`. */
function lastTwo(rows: PayrollRow[], v: (r: PayrollRow) => number): { trend?: string; up?: boolean; sub?: string } {
  const months = [...new Set(rows.map((r) => r.month))].sort();
  if (months.length < 2) return {};
  const [a, b] = months.slice(-2);
  const before = sum(rows.filter((r) => r.month === a), v);
  const now = sum(rows.filter((r) => r.month === b), v);
  if (!before) return {};
  const pct = ((now - before) / before) * 100;
  return { trend: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, up: pct >= 0, sub: `${monthLabel(b)} vs ${monthLabel(a)}` };
}

/** The rows' scope in words, so a card never silently aggregates several months. */
function scopeOf(rows: PayrollRow[]): string {
  const months = [...new Set(rows.map((r) => r.month))].sort();
  const label = (m: string) => `${monthLabel(m)} ${m.slice(0, 4)}`;
  const period = !months.length ? "No payslips" : months.length === 1 ? label(months[0]) : `${label(months[0])} – ${label(months[months.length - 1])} (${months.length} months)`;
  const depts = new Set(rows.map((r) => r.department)).size;
  const types = [...new Set(rows.map((r) => r.runType))];
  return `${period} · ${depts} department${depts === 1 ? "" : "s"} · ${types.length ? types.join(" + ") : "no"} run${types.length === 1 ? "" : "s"}`;
}

/** One line per employee (summed over the months in view), with the given money columns. */
function perEmployee(rows: PayrollRow[], cols: { header: string; v: (r: PayrollRow) => number }[], leading: { header: string; v: (rs: PayrollRow[]) => string | number }[] = []) {
  const by = new Map<string, PayrollRow[]>();
  for (const r of rows) by.set(r.employeeId, [...(by.get(r.employeeId) ?? []), r]);
  const list = [...by.values()].sort((a, b) => sum(b, cols[cols.length - 1].v) - sum(a, cols[cols.length - 1].v));
  const lead = [{ header: "Employee", v: (rs: PayrollRow[]) => rs[0].name }, { header: "Department", v: (rs: PayrollRow[]) => rs[0].department }, ...leading];
  return {
    headers: [...lead.map((l) => l.header), ...cols.map((c) => c.header)],
    money: [...lead.map(() => false), ...cols.map(() => true)],
    rows: list.map((rs) => [...lead.map((l) => l.v(rs)), ...cols.map((c) => sum(rs, c.v))]),
    footer: ["Total", ...lead.slice(1).map(() => ""), ...cols.map((c) => sum(rows, c.v))],
    hrefs: list.map((rs) => `/organization/employees/${rs[0].employeeId}`),
  };
}

/** Link to the run comparison for the last two months in view (the "Oct vs Sep" movement). */
function compareLink(rows: PayrollRow[]): { label: string; href: string }[] {
  const months = [...new Set(rows.filter((r) => r.runType === "Regular").map((r) => r.month))].sort();
  if (months.length < 2) return [];
  const [a, b] = months.slice(-2);
  const run = (m: string) => rows.find((r) => r.month === m && r.runType === "Regular")?.runId;
  const cur = run(b);
  const prev = run(a);
  if (!cur || !prev) return [];
  return [{ label: `Explain ${monthLabel(b)} vs ${monthLabel(a)}`, href: `/time-payroll/payroll/compare?current=${encodeURIComponent(cur)}&previous=${encodeURIComponent(prev)}` }];
}

const rate = (part: number, base: number) => (base ? `${((part / base) * 100).toFixed(2).replace(/\.?0+$/, "")}%` : "—");

const payrollReport = defineReport<PayrollRow>({
  id: "payroll",
  label: "Payroll Cost",
  description: "Gross to net for every final payslip — cost by month and department, deductions, banks, PAYE by state and pension by PFA.",
  icon: Banknote,
  group: "Payroll",
  permission: "time-payroll.payroll",
  countries: ["ng"],
  select: (_b, ctx) => selectPayroll(ctx.payroll),
  rowActions: (r) => [
    { label: "View payslip", href: `/organization/employees/${r.employeeId}/payslips/${encodeURIComponent(r.payslipId)}` },
    { label: "View profile", href: `/organization/employees/${r.employeeId}` },
  ],
  columns: [
    { key: "period", header: "Pay Month", value: (r) => r.period },
    { key: "runType", header: "Run", value: (r) => r.runType },
    { key: "reference", header: "Payslip", value: (r) => r.reference },
    { key: "employeeNumber", header: "Employee ID", value: (r) => r.employeeNumber },
    { key: "name", header: "Employee", value: (r) => r.name, href: (r) => (r.employeeId ? `/organization/employees/${r.employeeId}` : undefined) },
    { key: "department", header: "Department", value: (r) => r.department },
    { key: "employmentType", header: "Employment Type", value: (r) => r.employmentType },
    { key: "state", header: "Tax State", value: (r) => r.state },
    { key: "bank", header: "Bank", value: (r) => r.bank },
    { key: "pfa", header: "PFA", value: (r) => r.pfa },
    { key: "basic", header: "Basic", value: (r) => r.basic, money: true },
    { key: "allowances", header: "Allowances", value: (r) => r.allowances, money: true },
    { key: "overtime", header: "Overtime", value: (r) => r.overtime, money: true },
    { key: "oneOff", header: "Bonuses & One-offs", value: (r) => r.oneOff, money: true },
    { key: "reimbursements", header: "Reimbursements", value: (r) => r.reimbursements, money: true },
    { key: "gross", header: "Gross Pay", value: (r) => r.gross, money: true },
    { key: "paye", header: "PAYE", value: (r) => r.paye, money: true },
    { key: "pensionEe", header: "Pension (8%)", value: (r) => r.pensionEe, money: true },
    { key: "avc", header: "Voluntary Pension", value: (r) => r.avc, money: true },
    { key: "nhf", header: "NHF", value: (r) => r.nhf, money: true },
    { key: "otherDeductions", header: "Other Deductions", value: (r) => r.otherDeductions, money: true },
    { key: "totalDeductions", header: "Total Deductions", value: (r) => r.totalDeductions, money: true },
    { key: "net", header: "Net Pay", value: (r) => r.net, money: true },
    { key: "pensionEr", header: "Employer Pension", value: (r) => r.pensionEr, money: true },
    { key: "nsitf", header: "NSITF", value: (r) => r.nsitf, money: true },
    { key: "itf", header: "ITF", value: (r) => r.itf, money: true },
    { key: "hmoEe", header: "HMO (employee)", value: (r) => r.hmoEe, money: true },
    { key: "hmoEr", header: "HMO (employer)", value: (r) => r.hmoEr, money: true },
    { key: "groupLife", header: "Group Life", value: (r) => r.groupLife, money: true },
    { key: "nhisEr", header: "NHIS (employer)", value: (r) => r.nhisEr, money: true },
    { key: "otherEr", header: "Other Employer", value: (r) => r.otherEr, money: true },
    { key: "employerCost", header: "Employer Cost", value: (r) => r.employerCost, money: true },
    { key: "totalCost", header: "Total Cost", value: (r) => r.totalCost, money: true },
  ],
  filters: [
    { key: "period", label: "Pay month", options: (rows) => [...new Set(rows.map((r) => r.period))], match: (r, v) => r.period === v },
    { key: "department", label: "Department", options: (rows) => [...new Set(rows.map((r) => r.department))].sort(), match: (r, v) => r.department === v },
    { key: "runType", label: "Run type", options: (rows) => [...new Set(rows.map((r) => r.runType))], match: (r, v) => r.runType === v },
  ],
  searchText: (r) => `${r.name} ${r.employeeNumber} ${r.department} ${r.bank} ${r.pfa} ${r.state} ${r.reference}`,
  analytics: (rows) => {
    const gross = sum(rows, (r) => r.gross);
    const net = sum(rows, (r) => r.net);
    const paye = sum(rows, (r) => r.paye);
    const employer = sum(rows, (r) => r.employerCost);
    const people = new Set(rows.map((r) => r.employeeNumber)).size;
    const months = new Set(rows.map((r) => r.month)).size || 1;
    const scope = scopeOf(rows);
    const regular = rows.filter((r) => r.runType === "Regular");
    const avgNet = rows.length ? round(net / (regular.length || rows.length)) : 0;
    const pensionable = sum(rows, (r) => r.pensionable);
    const payrollGross = sum(rows.filter((r) => r.nsitf > 0), (r) => r.gross);
    // Every employer line, with its base and the rate it works out at — these add up to the card exactly.
    const employerParts = [
      { short: "Pension", label: "Employer pension", value: sum(rows, (r) => r.pensionEr), basis: `${rate(sum(rows, (r) => r.pensionEr), pensionable)} of pensionable pay (basic + housing + transport, ${naira(pensionable)})` },
      { short: "NSITF", label: "NSITF", value: sum(rows, (r) => r.nsitf), basis: `${rate(sum(rows, (r) => r.nsitf), payrollGross)} of gross pay (${naira(payrollGross)})` },
      { short: "ITF", label: "ITF", value: sum(rows, (r) => r.itf), basis: `${rate(sum(rows, (r) => r.itf), payrollGross)} of gross pay, accrued monthly` },
      { short: "Group life", label: "Group life assurance", value: sum(rows, (r) => r.groupLife), basis: `Premium on 3× annual pay cover, accrued monthly (${rate(sum(rows, (r) => r.groupLife), payrollGross)} of gross)` },
      { short: "HMO", label: "HMO (employer share)", value: sum(rows, (r) => r.hmoEr), basis: "Per the employee's HMO plan" },
      { short: "NHIS", label: "NHIS (employer)", value: sum(rows, (r) => r.nhisEr), basis: "Employer share of the NHIA contribution" },
      { short: "Other", label: "Other employer contributions", value: sum(rows, (r) => r.otherEr), basis: "Custom employer pay elements" },
    ];
    const deductions = [
      { label: "PAYE", value: paye },
      { label: "Pension (8%)", value: sum(rows, (r) => r.pensionEe) },
      { label: "Voluntary pension", value: sum(rows, (r) => r.avc) },
      { label: "NHF", value: sum(rows, (r) => r.nhf) },
      { label: "Other deductions", value: sum(rows, (r) => r.otherDeductions) },
    ];
    return {
      stats: [
        {
          label: "Gross Pay",
          value: gross,
          money: true,
          icon: Banknote,
          tone: "violet",
          ...lastTwo(rows, (r) => r.gross),
          drill: {
            title: "Gross pay — what it's made of",
            scope,
            components: [
              { label: "Basic", value: sum(rows, (r) => r.basic) },
              { label: "Allowances", value: sum(rows, (r) => r.allowances) },
              { label: "Overtime", value: sum(rows, (r) => r.overtime) },
              { label: "Bonuses & one-offs", value: sum(rows, (r) => r.oneOff) },
              { label: "Reimbursements", value: sum(rows, (r) => r.reimbursements) },
              { label: "Other earnings (arrears, adjustments)", value: round(gross - sum(rows, (r) => r.basic + r.allowances + r.overtime + r.oneOff + r.reimbursements)) },
            ].filter((c) => Math.abs(c.value) >= 0.005),
            table: perEmployee(rows, [
              { header: "Basic", v: (r) => r.basic },
              { header: "Allowances", v: (r) => r.allowances },
              { header: "Overtime", v: (r) => r.overtime },
              { header: "One-offs", v: (r) => r.oneOff },
              { header: "Gross", v: (r) => r.gross },
            ], [{ header: "Months", v: (rs) => new Set(rs.map((r) => r.month)).size }]),
            links: compareLink(rows),
          },
        },
        {
          label: "Net Pay",
          value: net,
          money: true,
          icon: Receipt,
          tone: "emerald",
          ...lastTwo(rows, (r) => r.net),
          drill: {
            title: "Net pay — gross less deductions",
            scope,
            components: [
              { label: "Gross pay", value: gross },
              { label: "less PAYE", value: -paye },
              { label: "less Pension (8%)", value: -sum(rows, (r) => r.pensionEe) },
              { label: "less Voluntary pension", value: -sum(rows, (r) => r.avc) },
              { label: "less NHF", value: -sum(rows, (r) => r.nhf) },
              { label: "less HMO (employee)", value: -sum(rows, (r) => r.hmoEe) },
              { label: "less Other deductions (loans, advances, dues)", value: round(-(sum(rows, (r) => r.totalDeductions) - paye - sum(rows, (r) => r.pensionEe + r.avc + r.nhf + r.hmoEe))) },
            ].filter((c) => Math.abs(c.value) >= 0.005),
            table: perEmployee(rows, [
              { header: "Gross", v: (r) => r.gross },
              { header: "Deductions", v: (r) => r.totalDeductions },
              { header: "Net", v: (r) => r.net },
            ], [{ header: "Bank", v: (rs) => rs[0].bank }]),
            links: compareLink(rows),
          },
        },
        {
          label: "PAYE",
          value: paye,
          money: true,
          icon: Landmark,
          tone: "amber",
          sub: `Effective rate ${pctText(paye, gross)} of gross`,
          drill: {
            title: "PAYE by tax state",
            description: "PAYE is remitted to the Internal Revenue Service of the state where each employee lives.",
            scope,
            components: sumBy(rows, (r) => r.state, (r) => r.paye).map((t) => ({ label: `${t.label} IRS`, value: t.value, basis: `${pctText(t.value, sum(rows.filter((r) => r.state === t.label), (r) => r.gross))} of gross` })),
            table: perEmployee(rows, [
              { header: "Taxable", v: (r) => r.taxable },
              { header: "PAYE", v: (r) => r.paye },
            ], [{ header: "Tax state", v: (rs) => rs[0].state }]),
          },
        },
        {
          label: "Employer Cost",
          value: employer,
          money: true,
          icon: Building2,
          tone: "blue",
          sub: `${scope.split(" · ")[0]} · ${employerParts.filter((c) => c.value > 0).map((c) => `${c.short} ${naira(c.value)}`).join(" · ")}`,
          drill: {
            title: "Employer cost — what the company pays on top of gross",
            description:
              "Paid by the employer, not deducted from pay. Employee pension (8%), voluntary pension and NHF are deductions from the employee and are NOT part of employer cost.",
            scope,
            components: employerParts.filter((c) => Math.abs(c.value) >= 0.005).map(({ label, value, basis }) => ({ label, value, basis })),
            table: perEmployee(rows, [
              { header: "Pension (ER)", v: (r) => r.pensionEr },
              { header: "NSITF", v: (r) => r.nsitf },
              { header: "ITF", v: (r) => r.itf },
              { header: "Group life", v: (r) => r.groupLife },
              { header: "HMO (ER)", v: (r) => r.hmoEr + r.nhisEr },
              { header: "Other", v: (r) => r.otherEr },
              { header: "Employer cost", v: (r) => r.employerCost },
            ]),
          },
        },
        {
          label: "Employees Paid",
          value: people,
          sub: `Across ${months} month${months === 1 ? "" : "s"}`,
          drill: {
            title: "Employees paid",
            scope,
            table: perEmployee(rows, [{ header: "Net paid", v: (r) => r.net }], [
              { header: "Employee ID", v: (rs) => rs[0].employeeNumber },
              { header: "Payslips", v: (rs) => rs.length },
            ]),
          },
        },
        {
          label: "Avg Net Pay",
          value: avgNet,
          money: true,
          sub: "Per employee, per month",
          drill: {
            title: "Average net pay",
            description: `Net pay on regular payslips ÷ regular payslips (${regular.length}). Off-cycle and adjustment payslips are left out of the average.`,
            scope,
            components: [{ label: `Net pay on ${regular.length} regular payslips ÷ ${regular.length}`, value: avgNet }],
            table: perEmployee(regular, [
              { header: "Total net", v: (r) => r.net },
              { header: "Avg per month", v: (r) => r.net / Math.max(1, regular.filter((x) => x.employeeId === r.employeeId).length) },
            ], [{ header: "Months", v: (rs) => rs.length }]),
          },
        },
      ],
      charts: [
        multiBarSpec(
          "Payroll Cost by Month",
          monthly(rows, { gross: (r) => r.gross, employer: (r) => r.employerCost }),
          [
            { key: "gross", label: "Gross pay", color: "#6366f1" },
            { key: "employer", label: "Employer contributions", color: "#0ea5e9" },
          ],
          "month",
          { stacked: true, money: true, fullWidth: true, description: "Gross pay plus what the employer pays on top", footer: `${naira(gross + employer)} total cost in view` },
        ),
        lineSpec(
          "Gross, Net & PAYE Trend",
          monthly(rows, { gross: (r) => r.gross, net: (r) => r.net, paye: (r) => r.paye }),
          [
            { key: "gross", label: "Gross", color: "#6366f1" },
            { key: "net", label: "Net", color: "#1baf7a" },
            { key: "paye", label: "PAYE", color: "#eb6834" },
          ],
          "month",
          "line",
          { money: true, fullWidth: true, description: "How pay and tax move month to month" },
        ),
        moneyPie("payroll-dept", "Cost by Department", sumBy(rows, (r) => r.department, (r) => r.totalCost), {
          description: "Gross pay + employer cost",
          centerLabel: "Total cost",
        }),
        moneyPie("payroll-deductions", "Deduction Mix", deductions, { description: "Where deductions from pay go", centerLabel: "Deducted" }),
        barSpec("Net Pay by Bank", sumBy(rows, (r) => r.bank, (r) => r.net), { layout: "horizontal", money: true, description: "What the bank file pays into each bank" }),
        barSpec("PAYE by State IRS", sumBy(rows, (r) => r.state, (r) => r.paye), { layout: "horizontal", money: true, description: "Remitted to the state where each employee lives" }),
        barSpec(
          "Average Gross Pay by Department",
          (() => {
            const by = new Map<string, { s: number; n: number }>();
            for (const r of rows.filter((x) => x.runType === "Regular")) {
              const c = by.get(r.department) ?? { s: 0, n: 0 };
              c.s += r.gross;
              c.n++;
              by.set(r.department, c);
            }
            return [...by].map(([label, c]) => ({ label, value: round(c.s / c.n) })).sort((a, b) => b.value - a.value);
          })(),
          { layout: "horizontal", money: true, description: "Monthly regular pay per employee" },
        ),
        barSpec("Pension by PFA", sumBy(rows, (r) => r.pfa, (r) => r.pensionEe + r.pensionEr + r.avc), {
          layout: "horizontal",
          money: true,
          description: "Employee, employer and voluntary contributions",
        }),
      ],
    };
  },
  breakdowns: [
    {
      id: "statutory",
      label: "Statutory Deductions",
      description: "PAYE, pension, AVC and NHF — who they're paid to and how they move.",
      icon: Landmark,
      analytics: (rows) => {
        const paye = sum(rows, (r) => r.paye);
        const ee = sum(rows, (r) => r.pensionEe);
        const er = sum(rows, (r) => r.pensionEr);
        const avc = sum(rows, (r) => r.avc);
        const nhf = sum(rows, (r) => r.nhf);
        const gross = sum(rows, (r) => r.gross);
        const pfaRows = [...new Set(rows.map((r) => r.pfa))].sort().map((pfa) => {
          const inPfa = rows.filter((r) => r.pfa === pfa);
          return { pfa, ee: sum(inPfa, (r) => r.pensionEe), er: sum(inPfa, (r) => r.pensionEr), avc: sum(inPfa, (r) => r.avc) };
        });
        return {
          stats: [
            { label: "PAYE", value: paye, money: true, icon: Landmark, tone: "amber", sub: `${pctText(paye, gross)} of gross` },
            { label: "Pension (employee)", value: ee, money: true, icon: PiggyBank, tone: "blue" },
            { label: "Pension (employer)", value: er, money: true, icon: Building2, tone: "violet" },
            { label: "Voluntary Pension", value: avc, money: true, icon: PiggyBank, tone: "emerald", sub: `${new Set(rows.filter((r) => r.avc > 0).map((r) => r.employeeNumber)).size} contributors` },
            { label: "NHF", value: nhf, money: true },
          ],
          charts: [
            multiBarSpec(
              "Statutory Deductions by Month",
              monthly(rows, { paye: (r) => r.paye, pension: (r) => r.pensionEe, avc: (r) => r.avc, nhf: (r) => r.nhf }),
              [
                { key: "paye", label: "PAYE", color: "#2a78d6" },
                { key: "pension", label: "Pension (8%)", color: "#eb6834" },
                { key: "avc", label: "Voluntary pension", color: "#1baf7a" },
                { key: "nhf", label: "NHF", color: "#eda100" },
              ],
              "month",
              { stacked: true, money: true, fullWidth: true },
            ),
            multiBarSpec(
              "Pension by PFA",
              pfaRows,
              [
                { key: "ee", label: "Employee 8%", color: "#2a78d6" },
                { key: "er", label: "Employer 10%", color: "#eb6834" },
                { key: "avc", label: "Voluntary", color: "#1baf7a" },
              ],
              "pfa",
              { stacked: true, money: true, fullWidth: true, description: "What each PFA receives" },
            ),
            moneyPie("paye-state", "PAYE by State IRS", sumBy(rows, (r) => r.state, (r) => r.paye), { centerLabel: "PAYE" }),
            barSpec(
              "Effective Tax Rate by Department",
              (() => {
                const depts = [...new Set(rows.map((r) => r.department))];
                return depts
                  .map((d) => {
                    const inD = rows.filter((r) => r.department === d);
                    const g = sum(inD, (r) => r.gross);
                    return { label: d, value: g ? Math.round((sum(inD, (r) => r.paye) / g) * 1000) / 10 : 0 };
                  })
                  .sort((a, b) => b.value - a.value);
              })(),
              { layout: "horizontal", valueLabel: "% of gross", description: "PAYE as a share of gross pay" },
            ),
          ],
        };
      },
    },
    {
      id: "pay-mix",
      label: "Pay Composition",
      description: "What gross pay is made of — basic, allowances, overtime and one-offs.",
      icon: Layers,
      analytics: (rows) => {
        const parts = [
          { label: "Basic", value: sum(rows, (r) => r.basic) },
          { label: "Allowances", value: sum(rows, (r) => r.allowances) },
          { label: "Overtime", value: sum(rows, (r) => r.overtime) },
          { label: "Bonuses & one-offs", value: sum(rows, (r) => r.oneOff) },
          { label: "Reimbursements", value: sum(rows, (r) => r.reimbursements) },
        ];
        const gross = sum(rows, (r) => r.gross);
        return {
          stats: parts.slice(0, 4).map((p, i) => ({
            label: p.label,
            value: p.value,
            money: true,
            sub: `${pctText(p.value, gross)} of gross`,
            tone: (["violet", "blue", "amber", "emerald"] as const)[i],
          })),
          charts: [
            multiBarSpec(
              "Pay Composition by Month",
              monthly(rows, { basic: (r) => r.basic, allowances: (r) => r.allowances, overtime: (r) => r.overtime, oneOff: (r) => r.oneOff }),
              [
                { key: "basic", label: "Basic", color: "#2a78d6" },
                { key: "allowances", label: "Allowances", color: "#eb6834" },
                { key: "overtime", label: "Overtime", color: "#1baf7a" },
                { key: "oneOff", label: "Bonuses & one-offs", color: "#eda100" },
              ],
              "month",
              { stacked: true, money: true, fullWidth: true },
            ),
            moneyPie("pay-mix", "Gross Pay Composition", parts, { centerLabel: "Gross" }),
            barSpec("Overtime by Department", sumBy(rows, (r) => r.department, (r) => r.overtime).filter((t) => t.value > 0), { layout: "horizontal", money: true }),
            barSpec("Bonuses & One-offs by Department", sumBy(rows, (r) => r.department, (r) => r.oneOff).filter((t) => t.value > 0), { layout: "horizontal", money: true }),
          ],
        };
      },
    },
  ],
});

// ── Statutory remittances ───────────────────────────────────────────────────

export interface RemittanceRow {
  month: string;
  period: string;
  item: string;
  key: RemittanceItem;
  payee: string;
  amount: number;
  due: string;
  status: "Paid" | "Overdue" | "Due" | "Nothing due";
  paidOn: string;
  reference: string;
}

const remittancesReport = defineReport<RemittanceRow>({
  id: "statutory-remittances",
  label: "Statutory Remittances",
  description: "PAYE, pension, AVC, NHF, NSITF and ITF owed for each pay month — due dates, what's paid and what's overdue.",
  icon: Landmark,
  group: "Payroll",
  permission: "time-payroll.payroll",
  countries: ["ng"],
  select: (_b, ctx) => {
    const payroll = ctx.payroll;
    if (!payroll) return [];
    const today = new Date().toISOString().slice(0, 10);
    const out: RemittanceRow[] = [];
    for (const [month, runs] of lockedRunsByMonth(payroll.runs)) {
      const reg = runs.find((r) => r.type === "regular") ?? runs[0];
      const amounts = remittanceAmounts(runs);
      for (const c of remittanceCalendar(reg.period)) {
        const paid = payroll.remittances?.[`${month}:${c.key}`];
        const amount = amounts[c.key];
        out.push({
          month,
          period: reg.period.label,
          item: c.item,
          key: c.key,
          payee: c.to,
          amount,
          due: c.due,
          status: paid ? "Paid" : amount <= 0 ? "Nothing due" : c.due < today ? "Overdue" : "Due",
          paidOn: paid?.date ?? "",
          reference: paid?.reference ?? "",
        });
      }
    }
    return out.sort((a, b) => b.month.localeCompare(a.month) || a.due.localeCompare(b.due));
  },
  columns: [
    { key: "period", header: "Pay Month", value: (r) => r.period },
    { key: "item", header: "Remittance", value: (r) => r.item },
    { key: "payee", header: "Paid To", value: (r) => r.payee },
    { key: "amount", header: "Amount", value: (r) => r.amount, money: true },
    { key: "due", header: "Due", value: (r) => r.due },
    { key: "status", header: "Status", value: (r) => r.status },
    { key: "paidOn", header: "Paid On", value: (r) => r.paidOn || "—" },
    { key: "reference", header: "Reference", value: (r) => r.reference || "—" },
  ],
  filters: [
    { key: "period", label: "Pay month", options: (rows) => [...new Set(rows.map((r) => r.period))], match: (r, v) => r.period === v },
    { key: "status", label: "Status", options: () => ["Overdue", "Due", "Paid", "Nothing due"], match: (r, v) => r.status === v },
    { key: "item", label: "Remittance", options: (rows) => [...new Set(rows.map((r) => r.item))], match: (r, v) => r.item === v },
  ],
  exportParams: [{ key: "outstanding", label: "Outstanding only", description: "Leave out what's already paid", predicate: (r) => r.status === "Overdue" || r.status === "Due" }],
  searchText: (r) => `${r.item} ${r.payee} ${r.period} ${r.status} ${r.reference}`,
  analytics: (rows) => {
    const owed = rows.filter((r) => r.status === "Overdue" || r.status === "Due");
    const overdue = rows.filter((r) => r.status === "Overdue");
    const paid = rows.filter((r) => r.status === "Paid");
    const total = sum(rows, (r) => r.amount);
    const statusTally = (["Paid", "Due", "Overdue"] as const).map((s) => ({ label: s, value: sum(rows.filter((r) => r.status === s), (r) => r.amount) }));
    return {
      stats: [
        { label: "Total Liability", value: total, money: true, icon: Landmark, tone: "violet", sub: `${new Set(rows.map((r) => r.month)).size} pay months` },
        { label: "Remitted", value: sum(paid, (r) => r.amount), money: true, icon: Receipt, tone: "emerald", sub: `${paid.length} payments recorded` },
        { label: "Outstanding", value: sum(owed, (r) => r.amount), money: true, icon: Banknote, tone: "amber", sub: `${owed.length} payments` },
        { label: "Overdue", value: sum(overdue, (r) => r.amount), money: true, tone: "red", sub: `${overdue.length} past their due date`, trend: overdue.length ? `${overdue.length}` : undefined, up: false },
      ],
      charts: [
        multiBarSpec(
          "Remitted vs Outstanding by Month",
          monthly(rows, { paid: (r) => (r.status === "Paid" ? r.amount : 0), due: (r) => (r.status === "Due" ? r.amount : 0), overdue: (r) => (r.status === "Overdue" ? r.amount : 0) }),
          [
            { key: "paid", label: "Remitted", color: "#1baf7a" },
            { key: "due", label: "Due", color: "#eda100" },
            { key: "overdue", label: "Overdue", color: "#e34948" },
          ],
          "month",
          { stacked: true, money: true, fullWidth: true },
        ),
        moneyPie("remit-item", "Liability by Remittance", sumBy(rows, (r) => r.item, (r) => r.amount), { centerLabel: "Total" }),
        moneyPie("remit-status", "Liability by Status", statusTally, { centerLabel: "Total" }),
        barSpec("Outstanding by Authority", sumBy(owed, (r) => r.item, (r) => r.amount), { layout: "horizontal", money: true, description: "Still to be paid, overdue included" }),
      ],
    };
  },
});

export const PAYROLL_REPORTS: AnyReportDef[] = [payrollReport, remittancesReport];
