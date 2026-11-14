import Papa from "papaparse";
import * as XLSX from "xlsx";
import { downloadFile } from "@/src/lib/download";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import type { EmployeeTaxProfile, PayrollRun, PayslipLine } from "./types";
import { round2 } from "./ng/engine";

/**
 * The files a Nigerian payroll actually has to produce every month:
 *   • Payroll register (internal / audit)
 *   • PAYE schedule per State IRS (state of residence, remit by the 10th)
 *   • Pension schedule per PFA, with RSA PINs (remit within 7 working days)
 *   • NHF schedule (FMBN)
 *   • NIBSS bulk-payment file for the bank
 */

export type ExportKind = "register" | "paye" | "pension" | "nhf" | "nibss";

export const EXPORT_LABELS: Record<ExportKind, string> = {
  register: "Payroll register",
  paye: "PAYE schedule (by State IRS)",
  pension: "Pension schedule (by PFA)",
  nhf: "NHF schedule",
  nibss: "NIBSS bulk payment file",
};

interface Ctx {
  run: PayrollRun;
  people: Map<string, LocaleEmployee>;
  profiles: Map<string, EmployeeTaxProfile>;
}

const amt = (lines: PayslipLine[], code: string) => round2(lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0));

function rows(ctx: Ctx) {
  return ctx.run.employees
    .filter((e) => e.included && e.computation)
    .map((e) => ({ re: e, c: e.computation!, emp: ctx.people.get(e.employeeId), p: ctx.profiles.get(e.employeeId) }));
}

export function buildExport(kind: ExportKind, ctx: Ctx): { headers: string[]; data: (string | number)[][] } {
  const r = rows(ctx);
  switch (kind) {
    case "register":
      return {
        headers: ["Employee ID", "Name", "Department", "Mode", "Gross", "Taxable", "PAYE", "Pension (EE)", "NHF", "Other deductions", "Total deductions", "Net pay", "Pension (ER)", "NSITF", "ITF", "Employer cost"],
        data: r.map(({ re, c, emp }) => [
          emp?.employeeNumber ?? re.employeeId,
          emp?.fullName ?? "",
          emp?.departmentName ?? "",
          re.mode,
          c.gross,
          c.taxableGross,
          amt(c.lines, "PAYE"),
          amt(c.lines, "PENSION_EE"),
          amt(c.lines, "NHF"),
          c.otherDeductions,
          c.totalDeductions,
          c.net,
          amt(c.lines, "PENSION_ER"),
          amt(c.lines, "NSITF"),
          amt(c.lines, "ITF"),
          c.employerCost,
        ]),
      };
    case "paye":
      return {
        headers: ["State IRS", "Employee ID", "Name", "TIN", "Gross pay", "Reliefs", "Chargeable income", "PAYE deducted", "YTD PAYE"],
        data: r
          .filter(({ c }) => c.tax.regime === "paye")
          .sort((a, b) => (a.p?.stateOfResidence ?? "").localeCompare(b.p?.stateOfResidence ?? ""))
          .map(({ re, c, emp, p }) => [
            p?.stateOfResidence ?? "",
            emp?.employeeNumber ?? re.employeeId,
            emp?.fullName ?? "",
            p?.tin ?? "",
            c.gross,
            round2(c.tax.reliefs.reduce((s, x) => s + x.period, 0)),
            c.tax.periodChargeable,
            amt(c.lines, "PAYE"),
            c.ytd.paye,
          ]),
      };
    case "pension":
      return {
        headers: ["PFA", "PFA code", "RSA PIN", "Employee ID", "Name", "Pensionable pay", "Employee (8%)", "Employer (10%)", "Voluntary", "Total remittance"],
        data: r
          .filter(({ c }) => amt(c.lines, "PENSION_EE") > 0 || amt(c.lines, "PENSION_ER") > 0)
          .sort((a, b) => (a.p?.pfaName ?? "").localeCompare(b.p?.pfaName ?? ""))
          .map(({ re, c, emp, p }) => {
            const ee = amt(c.lines, "PENSION_EE");
            const er = amt(c.lines, "PENSION_ER");
            const vol = amt(c.lines, "VOL_PENSION");
            return [p?.pfaName ?? "", p?.pfaCode ?? "", p?.rsaPin ?? "", emp?.employeeNumber ?? re.employeeId, emp?.fullName ?? "", c.bases.pensionable, ee, er, vol, round2(ee + er + vol)];
          }),
      };
    case "nhf":
      return {
        headers: ["NHF number", "Employee ID", "Name", "Basic salary", "NHF (2.5%)"],
        data: r
          .filter(({ c }) => amt(c.lines, "NHF") > 0)
          .map(({ re, c, emp, p }) => [p?.nhfNumber ?? "", emp?.employeeNumber ?? re.employeeId, emp?.fullName ?? "", c.bases.nhf, amt(c.lines, "NHF")]),
      };
    case "nibss":
      return {
        headers: ["Serial", "Account number", "Bank code", "Amount", "Account name", "Narration"],
        data: r
          .filter(({ c }) => c.net > 0)
          .map(({ c, emp, p }, i) => [
            i + 1,
            p?.accountNumber ?? "",
            p?.bankCode ?? "",
            c.net.toFixed(2),
            p?.accountName ?? emp?.fullName ?? "",
            `${ctx.run.period.label} salary`.slice(0, 30),
          ]),
      };
  }
}

export function downloadExport(kind: ExportKind, ctx: Ctx, format: "csv" | "xlsx" = "csv") {
  const { headers, data } = buildExport(kind, ctx);
  const name = `${ctx.run.period.year}-${String(ctx.run.period.month).padStart(2, "0")}-${kind}`;
  if (format === "xlsx") {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, EXPORT_LABELS[kind].slice(0, 31));
    XLSX.writeFile(wb, `${name}.xlsx`);
    return;
  }
  downloadFile(`${name}.csv`, Papa.unparse({ fields: headers, data }), "text/csv;charset=utf-8");
}

// ── Manual upload templates ────────────────────────────────────────────────

export function downloadTemplate(
  layout: "long" | "wide",
  employees: { employeeNumber: string; fullName: string }[],
  codes: string[],
) {
  if (layout === "long") {
    const data = employees.flatMap((e) => codes.slice(0, 3).map((c) => [e.employeeNumber, e.fullName, c, ""]));
    downloadFile("payroll-upload-template-long.csv", Papa.unparse({ fields: ["Employee ID", "Name", "Pay element code", "Amount"], data }), "text/csv;charset=utf-8");
  } else {
    const data = employees.map((e) => [e.employeeNumber, e.fullName, ...codes.map(() => "")]);
    downloadFile("payroll-upload-template-wide.csv", Papa.unparse({ fields: ["Employee ID", "Name", ...codes], data }), "text/csv;charset=utf-8");
  }
}

/** Statutory remittance due dates for a pay period. */
export function remittanceCalendar(period: PayrollRun["period"]) {
  const next = period.month === 12 ? { y: period.year + 1, m: 1 } : { y: period.year, m: period.month + 1 };
  const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  // 7 working days after pay day
  const pay = new Date(`${period.payDate}T00:00:00Z`);
  let added = 0;
  while (added < 7) {
    pay.setUTCDate(pay.getUTCDate() + 1);
    const d = pay.getUTCDay();
    if (d !== 0 && d !== 6) added++;
  }
  return [
    { item: "Pension (employee + employer)", to: "Each employee's PFA", due: pay.toISOString().slice(0, 10), basis: "Within 7 working days of paying salaries (PRA 2014 s.11)" },
    { item: "PAYE", to: "State IRS of each employee's residence", due: iso(next.y, next.m, 10), basis: "By the 10th of the following month" },
    { item: "NHF", to: "Federal Mortgage Bank of Nigeria", due: iso(next.y, next.m, Math.min(28, new Date(Date.UTC(next.y, next.m, 0)).getUTCDate())), basis: "Within one month of deduction" },
    { item: "NSITF", to: "Nigeria Social Insurance Trust Fund", due: iso(next.y, next.m, 16), basis: "Monthly, by the 16th" },
    { item: "ITF", to: "Industrial Training Fund", due: iso(period.year + 1, 4, 1), basis: "Annual — by 1 April for the previous year" },
    { item: "Annual PAYE return (Form H1)", to: "State IRS", due: iso(period.year + 1, 1, 31), basis: "By 31 January for the year" },
  ];
}
