import type { LocaleEmployee } from "@/src/lib/types/locale";
import type { ExportTable } from "./exports";
import { round2 } from "./ng/engine";
import { paymentSnapshot } from "./run-builder";
import type { EmployeeTaxProfile, PayrollRun, PayslipLine } from "./types";

/**
 * Drill-downs behind the payroll stat cards: who makes up a run's gross pay,
 * deductions, net pay, PAYE, pension and third-party deductions — with the
 * bank and statutory details frozen on the run. Pure, so the page and its
 * download show the same numbers.
 */

export type BreakdownView = "gross" | "deductions" | "net" | "paye" | "pension" | "employer" | "third-party";

export const BREAKDOWN_VIEWS: { key: BreakdownView; label: string; groupBy: string | null; blurb: string }[] = [
  { key: "gross", label: "Gross pay", groupBy: "Department", blurb: "Employee earnings: basic salary, allowances, overtime and bonuses." },
  { key: "deductions", label: "Deductions", groupBy: null, blurb: "Pension, NHF, loans, salary advances and other deductions." },
  { key: "net", label: "Net pay", groupBy: "Bank", blurb: "Employee number, name, bank, masked account number and amount payable." },
  { key: "paye", label: "PAYE", groupBy: "State IRS", blurb: "Employee-level taxable income, reliefs, tax calculation and PAYE due." },
  { key: "pension", label: "Pension", groupBy: "PFA", blurb: "Employee, employer and voluntary contributions, by PFA." },
  { key: "employer", label: "Employer cost", groupBy: "Department", blurb: "What the company pays on top of gross pay: employer pension, NSITF, ITF, health insurance and group life — never deducted from employees." },
  { key: "third-party", label: "Third-party", groupBy: "Payee", blurb: "Deductions paid on to others — cooperatives, unions, lenders, courts." },
];

export const isBreakdownView = (v: string | null): v is BreakdownView => BREAKDOWN_VIEWS.some((x) => x.key === v);

export interface BreakdownColumn {
  key: string;
  label: string;
  numeric?: boolean;
  mono?: boolean;
}

export interface BreakdownRow {
  id: string;
  employeeId: string;
  name: string;
  employeeNumber: string;
  department: string;
  group: string;
  cells: Record<string, string | number>;
}

export interface Breakdown {
  view: BreakdownView;
  columns: BreakdownColumn[];
  rows: BreakdownRow[];
  /** Sum of each numeric column. */
  totals: Record<string, number>;
  /** The column whose total the card shows. */
  totalKey: string;
}

export interface BreakdownCtx {
  people: Map<string, LocaleEmployee>;
  profiles: Map<string, EmployeeTaxProfile>;
}

const amt = (lines: PayslipLine[], code: string) => lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0);

/** Payee for a third-party deduction code. */
export const THIRD_PARTY_PAYEE: Record<string, string> = {
  COOP_CONTRIB: "Staff cooperative",
  COOP_LOAN: "Staff cooperative",
  UNION_DUES: "Trade union",
  WELFARE: "Staff welfare fund",
  SAVINGS: "Staff savings scheme",
  COURT_ORDER: "Court-ordered payee",
  STAFF_LOAN: "Company (staff loan)",
  SALARY_ADVANCE: "Company (salary advance)",
  EMERGENCY_LOAN: "Company (emergency loan)",
  OVERPAYMENT: "Company (overpayment recovery)",
  OTHER_DED: "Other",
};

/** Deductions that are reductions of pay, not money paid on to anyone. */
const NOT_THIRD_PARTY = new Set(["UNPAID_LEAVE", "LATENESS"]);

/** Account number with all but the last four digits hidden. */
export function maskAccount(n: string | undefined): string {
  if (!n) return "MISSING";
  return n.length <= 4 ? n : `${"•".repeat(n.length - 4)}${n.slice(-4)}`;
}

export function buildBreakdown(view: BreakdownView, run: PayrollRun, ctx: BreakdownCtx): Breakdown {
  const included = run.employees.filter((e) => e.included && e.computation);
  const base = (re: (typeof included)[number]) => {
    const emp = ctx.people.get(re.employeeId);
    return {
      employeeId: re.employeeId,
      name: emp?.fullName ?? re.employeeId,
      employeeNumber: emp?.employeeNumber ?? re.employeeId,
      department: emp?.departmentName ?? "Unassigned",
    };
  };
  const pay = (re: (typeof included)[number]) => re.snapshot ?? paymentSnapshot(ctx.profiles.get(re.employeeId));

  let columns: BreakdownColumn[] = [];
  let rows: BreakdownRow[] = [];
  let totalKey = "";

  switch (view) {
    case "gross": {
      // Grouped by kind of earning, so the columns read the same whatever elements a run uses.
      const bucket = (l: PayslipLine) =>
        l.code === "BASIC" || l.code === "CONSOLIDATED" ? "basic" : l.group === "allowances" || l.group === "benefits_in_kind" ? "allowances" : l.group === "overtime" || l.group === "manufacturing" ? "overtime" : l.group === "bonuses" || l.group === "annual" ? "bonuses" : "other";
      columns = [
        { key: "basic", label: "Basic salary", numeric: true },
        { key: "allowances", label: "Allowances", numeric: true },
        { key: "overtime", label: "Overtime & shift", numeric: true },
        { key: "bonuses", label: "Bonuses & annual pay", numeric: true },
        { key: "other", label: "Other earnings", numeric: true },
        { key: "gross", label: "Gross pay", numeric: true },
      ];
      rows = included.map((re) => {
        const c = re.computation!;
        const b = base(re);
        const cells: Record<string, number> = { basic: 0, allowances: 0, overtime: 0, bonuses: 0, other: 0, gross: c.gross };
        for (const l of c.lines) if (l.category === "earning") cells[bucket(l)] = round2(cells[bucket(l)] + l.amount);
        return { id: re.employeeId, ...b, group: b.department, cells };
      });
      totalKey = "gross";
      break;
    }
    case "deductions": {
      columns = [
        { key: "paye", label: "PAYE", numeric: true },
        { key: "pension", label: "Pension (8%)", numeric: true },
        { key: "avc", label: "Voluntary pension", numeric: true },
        { key: "nhf", label: "NHF", numeric: true },
        { key: "nhis", label: "Health insurance", numeric: true },
        { key: "loans", label: "Loans", numeric: true },
        { key: "advances", label: "Salary advances", numeric: true },
        { key: "other", label: "Other deductions", numeric: true },
        { key: "total", label: "Total deductions", numeric: true },
      ];
      rows = included.map((re) => {
        const c = re.computation!;
        const b = base(re);
        const advances = amt(c.lines, "SALARY_ADVANCE");
        const loans = c.lines.filter((l) => l.category === "deduction" && (l.source === "loan" || /LOAN/.test(l.code)) && l.code !== "SALARY_ADVANCE").reduce((s, l) => s + l.amount, 0);
        const named = amt(c.lines, "PAYE") + amt(c.lines, "WHT") + amt(c.lines, "PENSION_EE") + amt(c.lines, "VOL_PENSION") + amt(c.lines, "NHF") + amt(c.lines, "NHIS_EE") + advances + loans;
        return {
          id: re.employeeId,
          ...b,
          group: "",
          cells: {
            paye: round2(amt(c.lines, "PAYE") + amt(c.lines, "WHT")),
            pension: round2(amt(c.lines, "PENSION_EE")),
            avc: round2(amt(c.lines, "VOL_PENSION")),
            nhf: round2(amt(c.lines, "NHF")),
            nhis: round2(amt(c.lines, "NHIS_EE")),
            loans: round2(loans),
            advances: round2(advances),
            other: round2(c.totalDeductions - named),
            total: c.totalDeductions,
          },
        };
      });
      totalKey = "total";
      break;
    }
    case "net": {
      columns = [
        { key: "bank", label: "Bank" },
        { key: "account", label: "Account number", mono: true },
        { key: "accountName", label: "Account name" },
        { key: "net", label: "Net pay", numeric: true },
      ];
      rows = included.map((re) => {
        const p = pay(re);
        const b = base(re);
        return {
          id: re.employeeId,
          ...b,
          group: p.bankName || "No bank on file",
          cells: { bank: p.bankName || "—", account: maskAccount(p.accountNumber), accountName: p.accountName || b.name, net: re.computation!.net },
        };
      });
      totalKey = "net";
      break;
    }
    case "paye": {
      columns = [
        { key: "tin", label: "TIN", mono: true },
        { key: "state", label: "State of residence" },
        { key: "taxableIncome", label: "Taxable income", numeric: true },
        { key: "reliefs", label: "Reliefs", numeric: true },
        { key: "taxable", label: "Chargeable income", numeric: true },
        { key: "rate", label: "Effective rate %" },
        { key: "paye", label: "PAYE this month", numeric: true },
        { key: "ytd", label: "PAYE year to date", numeric: true },
      ];
      rows = included.map((re) => {
        const c = re.computation!;
        const p = pay(re);
        const state = p.stateOfResidence || "Unassigned";
        return {
          id: re.employeeId,
          ...base(re),
          group: state,
          cells: {
            tin: p.tin || "MISSING",
            state,
            taxableIncome: c.tax.periodTaxableGross,
            reliefs: round2(c.tax.reliefs.reduce((s, r) => s + r.period, 0)),
            rate: `${c.tax.effectiveRatePct.toFixed(1)}%`,
            taxable: c.tax.periodChargeable, paye: round2(amt(c.lines, "PAYE") + amt(c.lines, "WHT")), ytd: c.ytd.paye },
        };
      });
      totalKey = "paye";
      break;
    }
    case "pension": {
      columns = [
        { key: "pfa", label: "PFA" },
        { key: "rsa", label: "RSA PIN", mono: true },
        { key: "pensionable", label: "Pensionable pay", numeric: true },
        { key: "ee", label: "Employee (8%)", numeric: true },
        { key: "er", label: "Employer (10%)", numeric: true },
        { key: "avc", label: "Voluntary (AVC)", numeric: true },
        { key: "total", label: "Total to PFA", numeric: true },
      ];
      rows = included
        .map((re) => {
          const c = re.computation!;
          const p = pay(re);
          const ee = round2(amt(c.lines, "PENSION_EE"));
          const er = round2(amt(c.lines, "PENSION_ER"));
          const avc = round2(amt(c.lines, "VOL_PENSION"));
          return {
            id: re.employeeId,
            ...base(re),
            group: p.pfaName || "No PFA",
            cells: { pfa: p.pfaName || "—", rsa: p.rsaPin || "MISSING", pensionable: c.bases.pensionable, ee, er, avc, total: round2(ee + er + avc) },
          };
        })
        .filter((r) => Number(r.cells.total) > 0);
      totalKey = "total";
      break;
    }
    case "employer": {
      const known = ["PENSION_ER", "NSITF", "ITF", "NHIS_ER", "HMO_ER", "GROUP_LIFE"];
      columns = [
        { key: "gross", label: "Gross pay", numeric: true },
        { key: "PENSION_ER", label: "Employer pension (10%)", numeric: true },
        { key: "NSITF", label: "NSITF (1%)", numeric: true },
        { key: "ITF", label: "ITF (1%)", numeric: true },
        { key: "health", label: "Health insurance / HMO", numeric: true },
        { key: "GROUP_LIFE", label: "Group life", numeric: true },
        { key: "other", label: "Other employer", numeric: true },
        { key: "total", label: "Employer contributions", numeric: true },
        { key: "cost", label: "Total cost to employer", numeric: true },
      ];
      rows = included.map((re) => {
        const c = re.computation!;
        const b = base(re);
        const er = c.lines.filter((l) => l.category === "employer");
        return {
          id: re.employeeId,
          ...b,
          group: b.department,
          cells: {
            gross: c.gross,
            PENSION_ER: round2(amt(er, "PENSION_ER")),
            NSITF: round2(amt(er, "NSITF")),
            ITF: round2(amt(er, "ITF")),
            health: round2(amt(er, "NHIS_ER") + amt(er, "HMO_ER")),
            GROUP_LIFE: round2(amt(er, "GROUP_LIFE")),
            other: round2(er.filter((l) => !known.includes(l.code)).reduce((s, l) => s + l.amount, 0)),
            total: c.employerCost,
            cost: round2(c.gross + c.employerCost),
          },
        };
      });
      totalKey = "total";
      break;
    }
    case "third-party": {
      columns = [
        { key: "payee", label: "Payee" },
        { key: "item", label: "Deduction" },
        { key: "reference", label: "Reference", mono: true },
        { key: "amount", label: "Amount", numeric: true },
      ];
      for (const re of included) {
        const b = base(re);
        re.computation!.lines
          .filter((l) => l.category === "deduction" && l.group === "other_deductions" && !NOT_THIRD_PARTY.has(l.code) && l.amount > 0)
          .forEach((l, i) => {
            const payee = THIRD_PARTY_PAYEE[l.code] ?? "Other";
            rows.push({
              id: `${re.employeeId}:${l.code}:${i}`,
              ...b,
              group: payee,
              cells: { payee, item: l.note ? `${l.name} — ${l.note}` : l.name, reference: l.refId ?? "—", amount: l.amount },
            });
          });
      }
      totalKey = "amount";
      break;
    }
  }

  const totals: Record<string, number> = {};
  for (const col of columns.filter((c) => c.numeric)) totals[col.key] = round2(rows.reduce((s, r) => s + (Number(r.cells[col.key]) || 0), 0));
  return { view, columns, rows, totals, totalKey };
}

/** The breakdown as a downloadable table (identity columns first, totals last). */
export function breakdownTable(b: Breakdown, groupLabel: string | null): ExportTable {
  const headers = ["Employee ID", "Name", "Department", ...(groupLabel && !b.columns.some((c) => c.label === groupLabel) ? [groupLabel] : []), ...b.columns.map((c) => c.label)];
  const withGroup = headers.length > 3 + b.columns.length;
  const data = b.rows.map((r) => [r.employeeNumber, r.name, r.department, ...(withGroup ? [r.group] : []), ...b.columns.map((c) => r.cells[c.key] ?? "")]);
  const trailer = [["TOTAL", `${b.rows.length} rows`, "", ...(withGroup ? [""] : []), ...b.columns.map((c) => (c.numeric ? b.totals[c.key] : ""))]];
  return { headers, data, trailer };
}
