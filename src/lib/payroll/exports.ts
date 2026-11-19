import Papa from "papaparse";
import * as XLSX from "xlsx";
import { downloadFile } from "@/src/lib/download";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import type { EmployeeTaxProfile, PayElement, PayrollRun, PayrollSettings, Payslip, PayslipLine } from "./types";
import { addWorkingDays } from "./ng/calendar";
import { round2 } from "./ng/engine";
import { paymentSnapshot } from "./run-builder";

/**
 * The files a Nigerian payroll actually has to produce:
 *   Monthly
 *   • Payroll register (internal / audit)
 *   • PAYE schedule per State IRS (state of residence, remit by the 10th)
 *   • Pension schedule per PFA, PenCom layout (remit within 7 working days)
 *   • NHF schedule (FMBN) and NSITF schedule
 *   • NIBSS bulk-payment file with batch header and control total
 *   • Payroll journal by cost centre, for the general ledger
 *   Annual
 *   • Form H1 — annual PAYE return per State IRS (by 31 January)
 *
 * Every schedule reads the bank and statutory IDs FROZEN on the run (what was
 * approved), never the live profile.
 */

export type ExportKind = "register" | "paye" | "pension" | "nhf" | "nsitf" | "nibss" | "journal";

export const EXPORT_LABELS: Record<ExportKind, string> = {
  register: "Payroll register",
  paye: "PAYE schedule (by State IRS)",
  pension: "Pension schedule (PenCom, by PFA)",
  nhf: "NHF schedule",
  nsitf: "NSITF schedule",
  nibss: "NIBSS bulk payment file",
  journal: "Payroll journal (by cost centre)",
};

export interface ExportCtx {
  run: PayrollRun;
  people: Map<string, LocaleEmployee>;
  profiles: Map<string, EmployeeTaxProfile>;
  settings?: PayrollSettings;
  company?: { legalName: string; taxId: string };
  /** Department name → cost centre code. */
  costCentres?: Map<string, string>;
  /** Element master — the journal posts elements with an accounting code to their own GL account. */
  elements?: PayElement[];
}

/** Default general-ledger codes for the standard payroll accounts (an element's own code overrides). */
export const DEFAULT_GL: Record<string, string> = {
  "Salaries & wages": "6100",
  "Staff expenses reimbursed": "6150",
  "Employer pension": "6200",
  NSITF: "6210",
  ITF: "6220",
  "Employer health insurance": "6230",
  "Group life assurance": "6240",
  "Net pay payable": "2100",
  "PAYE payable": "2210",
  "Pension payable": "2220",
  "NHF payable": "2230",
  "Health insurance payable": "2240",
  "NSITF payable": "2250",
  "ITF payable": "2260",
  "Group life premium payable": "2270",
  "Staff loans receivable": "1300",
  "Other deductions payable": "2290",
};

type Cell = string | number;
export interface ExportTable {
  headers: string[];
  data: Cell[][];
  /** Lines written above the column headers (file header / batch control). */
  preamble?: Cell[][];
  /** Lines written below the data (trailer / control totals). */
  trailer?: Cell[][];
  /** People left out of a payment file, with the reason — never silently dropped. */
  excluded?: string[];
}

const amt = (lines: PayslipLine[], code: string) => round2(lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0));
const reimbursed = (lines: PayslipLine[]) => round2(lines.filter((l) => l.group === "reimbursements").reduce((s, l) => s + l.amount, 0));
const sum = (xs: number[]) => round2(xs.reduce((s, x) => s + x, 0));
const monthLabel = (run: PayrollRun) => `${run.period.year}-${String(run.period.month).padStart(2, "0")}`;

function splitName(full: string): { surname: string; first: string; other: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { surname: parts[0], first: "", other: "" };
  return { surname: parts[parts.length - 1], first: parts[0], other: parts.slice(1, -1).join(" ") };
}

function rows(ctx: ExportCtx) {
  return ctx.run.employees
    .filter((e) => e.included && e.computation)
    .map((e) => ({ re: e, c: e.computation!, emp: ctx.people.get(e.employeeId), p: e.snapshot ?? paymentSnapshot(ctx.profiles.get(e.employeeId)) }));
}

export function buildExport(kind: ExportKind, ctx: ExportCtx): ExportTable {
  const r = rows(ctx);
  const ids = ctx.settings?.employerIds;
  switch (kind) {
    case "register": {
      const data = r.map(({ re, c, emp }) => [
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
        amt(c.lines, "GROUP_LIFE"),
        c.employerCost,
      ]);
      const totals = ["TOTAL", `${data.length} employees`, "", "", ...[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => sum(data.map((d) => Number(d[i]))))];
      return {
        headers: ["Employee ID", "Name", "Department", "Source", "Gross", "Taxable", "PAYE", "Pension (EE)", "NHF", "Other deductions", "Total deductions", "Net pay", "Pension (ER)", "NSITF", "ITF", "Group life", "Employer cost"],
        data: [...data, totals],
      };
    }

    case "paye": {
      const byState = new Map<string, typeof r>();
      for (const x of r.filter(({ c }) => c.tax.regime === "paye")) {
        const st = x.p.stateOfResidence || "Unassigned";
        byState.set(st, [...(byState.get(st) ?? []), x]);
      }
      const data: Cell[][] = [];
      for (const [state, list] of [...byState.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const payerId = ids?.stateTaxIds?.[state] || ctx.company?.taxId || "";
        for (const { re, c, emp, p } of list)
          data.push([
            state,
            payerId,
            monthLabel(ctx.run),
            emp?.employeeNumber ?? re.employeeId,
            emp?.fullName ?? "",
            p.tin,
            round2(c.gross - reimbursed(c.lines)),
            round2(c.tax.reliefs.reduce((s, x) => s + x.period, 0)),
            c.tax.periodChargeable,
            amt(c.lines, "PAYE"),
            c.ytd.paye,
          ]);
        data.push([`${state} — subtotal`, payerId, monthLabel(ctx.run), `${list.length} employees`, "", "", "", "", "", sum(list.map((x) => amt(x.c.lines, "PAYE"))), ""]);
      }
      return { headers: ["State IRS", "Employer payer ID", "Month", "Employee ID", "Name", "TIN", "Gross pay", "Reliefs", "Chargeable income", "PAYE deducted", "YTD PAYE"], data };
    }

    case "pension": {
      const list = r
        .filter(({ c }) => amt(c.lines, "PENSION_EE") > 0 || amt(c.lines, "PENSION_ER") > 0 || amt(c.lines, "VOL_PENSION") > 0)
        .sort((a, b) => a.p.pfaName.localeCompare(b.p.pfaName));
      const data: Cell[][] = list.map(({ re, c, emp, p }) => {
        const n = splitName(emp?.fullName ?? "");
        const ee = amt(c.lines, "PENSION_EE");
        const er = amt(c.lines, "PENSION_ER");
        const vol = amt(c.lines, "VOL_PENSION");
        return [p.pfaName, p.pfaCode, ids?.pencomEmployerCode ?? "", p.rsaPin || "MISSING RSA PIN", n.surname, n.first, n.other, emp?.employeeNumber ?? re.employeeId, c.bases.pensionable, ee, er, vol, round2(ee + er + vol)];
      });
      return {
        headers: ["PFA", "PFA code", "Employer code", "RSA PIN", "Surname", "First name", "Other names", "Staff ID", "Pensionable pay", "Employee (8%)", "Employer (10%)", "Voluntary", "Total remittance"],
        data,
        trailer: [["TOTAL", "", "", `${data.length} contributors`, "", "", "", "", "", sum(data.map((d) => Number(d[9]))), sum(data.map((d) => Number(d[10]))), sum(data.map((d) => Number(d[11]))), sum(data.map((d) => Number(d[12])))]],
        excluded: list.filter((x) => !x.p.rsaPin).map((x) => `${x.emp?.fullName}: no RSA PIN`),
      };
    }

    case "nhf": {
      const data = r.filter(({ c }) => amt(c.lines, "NHF") > 0).map(({ re, c, emp, p }) => [p.nhfNumber, emp?.employeeNumber ?? re.employeeId, emp?.fullName ?? "", c.bases.nhf, amt(c.lines, "NHF")]);
      return { headers: ["NHF number", "Employee ID", "Name", "Basic salary", "NHF (2.5%)"], data, trailer: [["TOTAL", "", `${data.length} contributors`, "", sum(data.map((d) => Number(d[4])))]] };
    }

    case "nsitf": {
      const data = r.filter(({ c }) => amt(c.lines, "NSITF") > 0).map(({ re, c, emp }) => [emp?.employeeNumber ?? re.employeeId, emp?.fullName ?? "", round2(c.gross - reimbursed(c.lines)), amt(c.lines, "NSITF")]);
      return {
        headers: ["Employee ID", "Name", "Monthly emoluments", "Employer contribution (1%)"],
        preamble: [["Employer", ctx.company?.legalName ?? "", "NSITF code", ids?.nsitfCode ?? ""], ["Month", monthLabel(ctx.run)], []],
        data,
        trailer: [["TOTAL", `${data.length} employees`, sum(data.map((d) => Number(d[2]))), sum(data.map((d) => Number(d[3])))]],
      };
    }

    case "nibss": {
      const payable = r.filter(({ c, p }) => c.net > 0 && p.accountNumber && p.bankCode);
      const excluded = r
        .filter((x) => !payable.includes(x))
        .map(({ c, emp, p }) => `${emp?.fullName ?? ""}: ${c.net <= 0 ? `net pay ₦${c.net.toLocaleString("en-NG")}` : !p.accountNumber ? "no account number" : "no bank code"}`);
      const data: Cell[][] = payable.map(({ c, emp, p }, i) => [
        i + 1,
        p.accountNumber,
        p.bankCode,
        c.net.toFixed(2),
        p.accountName || emp?.fullName || "",
        `${ctx.run.period.label} salary`.slice(0, 30),
      ]);
      const total = sum(payable.map((x) => x.c.net));
      return {
        headers: ["Serial", "Beneficiary account", "Beneficiary bank code", "Amount", "Beneficiary name", "Narration"],
        preamble: [
          ["HEADER", ctx.company?.legalName ?? "", "Debit account", ids?.debitAccount ?? "", "Debit bank code", ids?.debitBankCode ?? "", "Value date", ctx.run.period.payDate],
          ["BATCH", ctx.run.id, "Count", payable.length, "Control total", total.toFixed(2)],
          [],
        ],
        data,
        trailer: [["TRAILER", payable.length, total.toFixed(2)]],
        excluded,
      };
    }

    case "journal": {
      // Balanced journal per cost centre: debits are the cost, credits what's owed.
      const byCc = new Map<string, { dept: string; acc: Record<string, number> }>();
      const gl = new Map((ctx.elements ?? []).filter((e) => e.glCode).map((e) => [e.code, e]));
      const glOf: Record<string, string> = {};
      for (const { c, emp } of r) {
        const dept = emp?.departmentName ?? "Unassigned";
        const cc = ctx.costCentres?.get(dept) ?? "—";
        const row = byCc.get(cc) ?? { dept, acc: {} };
        const add = (k: string, v: number, code?: string) => {
          row.acc[k] = round2((row.acc[k] ?? 0) + v);
          glOf[k] ??= code ?? DEFAULT_GL[k.slice(3)] ?? "";
        };
        const reimb = reimbursed(c.lines);
        // Earnings mapped to their own GL account come out of the salaries line.
        let ownGl = 0;
        for (const l of c.lines) {
          const el = gl.get(l.code);
          if (!el || l.category !== "earning" || l.group === "reimbursements") continue;
          add(`DR ${el.name}`, l.amount, el.glCode);
          ownGl += l.amount;
        }
        add("DR Salaries & wages", c.gross - reimb - ownGl);
        add("DR Staff expenses reimbursed", reimb);
        add("DR Employer pension", amt(c.lines, "PENSION_ER"));
        add("DR NSITF", amt(c.lines, "NSITF"));
        add("DR ITF", amt(c.lines, "ITF"));
        add("DR Employer health insurance", amt(c.lines, "NHIS_ER"));
        add("DR Group life assurance", amt(c.lines, "GROUP_LIFE"));
        add("CR Net pay payable", c.net);
        add("CR PAYE payable", amt(c.lines, "PAYE") + amt(c.lines, "WHT"));
        add("CR Pension payable", amt(c.lines, "PENSION_EE") + amt(c.lines, "PENSION_ER") + amt(c.lines, "VOL_PENSION"));
        add("CR NHF payable", amt(c.lines, "NHF"));
        add("CR Health insurance payable", amt(c.lines, "NHIS_EE") + amt(c.lines, "NHIS_ER"));
        add("CR NSITF payable", amt(c.lines, "NSITF"));
        add("CR ITF payable", amt(c.lines, "ITF"));
        add("CR Group life premium payable", amt(c.lines, "GROUP_LIFE"));
        const loans = c.lines.filter((l) => l.source === "loan").reduce((s, l) => s + l.amount, 0);
        add("CR Staff loans receivable", loans);
        const statutory = ["PAYE", "WHT", "PENSION_EE", "VOL_PENSION", "NHF", "NHIS_EE"];
        let ownGlDed = 0;
        for (const l of c.lines) {
          const el = gl.get(l.code);
          if (!el || l.category !== "deduction" || l.source === "loan" || statutory.includes(l.code)) continue;
          add(`CR ${el.name} payable`, l.amount, el.glCode);
          ownGlDed += l.amount;
        }
        add("CR Other deductions payable", c.lines.filter((l) => l.category === "deduction" && l.source !== "loan" && !statutory.includes(l.code)).reduce((s, l) => s + l.amount, 0) - ownGlDed);
        byCc.set(cc, row);
      }
      const data: Cell[][] = [];
      for (const [cc, { dept, acc }] of [...byCc.entries()].sort()) {
        for (const [k, v] of Object.entries(acc)) {
          if (!v) continue;
          const dr = k.startsWith("DR ");
          data.push([cc, dept, glOf[k] ?? "", k.slice(3), dr ? v : "", dr ? "" : v]);
        }
      }
      const dr = sum(data.map((d) => Number(d[4]) || 0));
      const cr = sum(data.map((d) => Number(d[5]) || 0));
      return { headers: ["Cost centre", "Department", "GL account", "Account", "Debit", "Credit"], data, trailer: [["TOTAL", "", "", dr === cr ? "Balanced" : "OUT OF BALANCE", dr, cr]] };
    }
  }
}

export function writeTable(name: string, sheet: string, t: ExportTable, format: "csv" | "xlsx") {
  const aoa: Cell[][] = [...(t.preamble ?? []), t.headers, ...t.data, ...(t.trailer ?? [])];
  if (format === "xlsx") {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 31));
    XLSX.writeFile(wb, `${name}.xlsx`);
    return;
  }
  // Quote every field so account numbers keep their leading zeros.
  downloadFile(`${name}.csv`, Papa.unparse(aoa, { quotes: true }), "text/csv;charset=utf-8");
}

/** Downloads a run export. Returns anyone left out of the file, so the UI can say so. */
export function downloadExport(kind: ExportKind, ctx: ExportCtx, format: "csv" | "xlsx" = "csv"): string[] {
  const t = buildExport(kind, ctx);
  writeTable(`${monthLabel(ctx.run)}-${kind}`, EXPORT_LABELS[kind], t, format);
  return t.excluded ?? [];
}

// ── Annual: Form H1 ─────────────────────────────────────────────────────────

/** Form H1: every employee's annual PAYE position, grouped by State IRS. */
export function buildFormH1(year: number, payslips: Payslip[], employerTaxId: string): ExportTable {
  const final = payslips.filter((p) => p.status === "final" && p.period.year === year);
  const byEmp = new Map<string, Payslip[]>();
  for (const p of final) byEmp.set(p.employeeId, [...(byEmp.get(p.employeeId) ?? []), p]);
  const data: Cell[][] = [...byEmp.values()]
    .map((list) => {
      const latest = [...list].sort((a, b) => a.period.month - b.period.month || a.generatedAt.localeCompare(b.generatedAt)).pop()!;
      const y = latest.computation.ytd;
      const reliefs = round2(Object.values(y.reliefs ?? {}).reduce((s, v) => s + v, 0));
      return [latest.employee.stateOfResidence, employerTaxId, latest.employee.employeeNumber, latest.employee.fullName, latest.employee.tin, y.gross, reliefs, y.chargeable, y.paye, y.months];
    })
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[3]).localeCompare(String(b[3])));
  return {
    headers: ["State IRS", "Employer TIN", "Employee ID", "Name", "TIN", "Annual gross", "Reliefs", "Chargeable income", "PAYE deducted", "Months paid"],
    preamble: [["FORM H1 — Employer's annual declaration of PAYE", `Tax year ${year}`], []],
    data,
    trailer: [["TOTAL", "", `${data.length} employees`, "", "", sum(data.map((d) => Number(d[5]))), sum(data.map((d) => Number(d[6]))), sum(data.map((d) => Number(d[7]))), sum(data.map((d) => Number(d[8]))), ""]],
  };
}

export function downloadFormH1(year: number, payslips: Payslip[], employerTaxId: string) {
  writeTable(`${year}-form-h1`, `Form H1 ${year}`, buildFormH1(year, payslips, employerTaxId), "xlsx");
}

// ── Manual upload templates ────────────────────────────────────────────────

export function downloadTemplate(layout: "long" | "wide", employees: { employeeNumber: string; fullName: string }[], codes: string[]) {
  if (layout === "long") {
    const data = employees.flatMap((e) => codes.slice(0, 3).map((c) => [e.employeeNumber, e.fullName, c, ""]));
    downloadFile("payroll-upload-template-long.csv", Papa.unparse({ fields: ["Employee ID", "Name", "Pay element code", "Amount"], data }), "text/csv;charset=utf-8");
  } else {
    const data = employees.map((e) => [e.employeeNumber, e.fullName, ...codes.map(() => "")]);
    downloadFile("payroll-upload-template-wide.csv", Papa.unparse({ fields: ["Employee ID", "Name", ...codes], data }), "text/csv;charset=utf-8");
  }
}

// ── Remittances ─────────────────────────────────────────────────────────────

export type RemittanceItem = "pension" | "avc" | "paye" | "nhf" | "nsitf" | "itf";

/** Statutory remittance due dates for a pay month. */
export function remittanceCalendar(period: Pick<PayrollRun["period"], "year" | "month" | "payDate">) {
  const next = period.month === 12 ? { y: period.year + 1, m: 1 } : { y: period.year, m: period.month + 1 };
  const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  // 7 working days after pay day — weekends and public holidays don't count.
  const pensionDue = addWorkingDays(period.payDate, 7);
  return [
    { key: "pension" as const, item: "Pension (employee + employer)", to: "Each employee's PFA", due: pensionDue, basis: "Within 7 working days of paying salaries (PRA 2014 s.11)" },
    { key: "avc" as const, item: "Voluntary pension (AVC)", to: "Each employee's PFA", due: pensionDue, basis: "With the mandatory contribution, within 7 working days (PRA 2014 s.4(3))" },
    { key: "paye" as const, item: "PAYE", to: "State IRS of each employee's residence", due: iso(next.y, next.m, 10), basis: "By the 10th of the following month" },
    { key: "nhf" as const, item: "NHF", to: "Federal Mortgage Bank of Nigeria", due: iso(next.y, next.m, Math.min(28, new Date(Date.UTC(next.y, next.m, 0)).getUTCDate())), basis: "Within one month of deduction" },
    { key: "nsitf" as const, item: "NSITF", to: "Nigeria Social Insurance Trust Fund", due: iso(next.y, next.m, 16), basis: "Monthly, by the 16th" },
    { key: "itf" as const, item: "ITF", to: "Industrial Training Fund", due: iso(period.year + 1, 4, 1), basis: "Annual — by 1 April for the previous year" },
  ];
}

/** What each remittance amounts to for a month, summed across every finalized run in it. */
export function remittanceAmounts(runs: PayrollRun[]): Record<RemittanceItem, number> {
  const t: Record<RemittanceItem, number> = { pension: 0, avc: 0, paye: 0, nhf: 0, nsitf: 0, itf: 0 };
  for (const run of runs) {
    for (const e of run.employees) {
      const c = e.included ? e.computation : null;
      if (!c) continue;
      t.pension += amt(c.lines, "PENSION_EE") + amt(c.lines, "PENSION_ER");
      t.avc += amt(c.lines, "VOL_PENSION");
      t.paye += amt(c.lines, "PAYE");
      t.nhf += amt(c.lines, "NHF");
      t.nsitf += amt(c.lines, "NSITF");
      t.itf += amt(c.lines, "ITF");
    }
  }
  for (const k of Object.keys(t) as RemittanceItem[]) t[k] = round2(t[k]);
  return t;
}
