import type { LocaleEmployee } from "@/src/lib/types/locale";
import { remittanceAmounts, remittanceCalendar, writeTable, type ExportFormat, type ExportTable, type RemittanceItem } from "./exports";
import { round2 } from "./ng/engine";
import { previousWorkingDay } from "./ng/calendar";
import { paymentSnapshot } from "./run-builder";
import type { EmployeeTaxProfile, PayrollRun, PayrollSettings, PayslipLine } from "./types";
import type { RemittanceRecord } from "@/src/lib/stores/payroll-slice";

/**
 * Statutory remittance statements: for one pay month and one authority, what
 * is owed, by whom, to whom, and by when — combined across every finalized run
 * in the month (a regular run plus any off-cycle runs). Totals agree with
 * `remittanceAmounts`, which the Statutory Remittances tab shows.
 */

export const REMITTANCE_ITEMS: RemittanceItem[] = ["paye", "pension", "avc", "nhf", "nsitf", "itf", "hmo"];

export interface RemittanceCtx {
  people: Map<string, LocaleEmployee>;
  profiles: Map<string, EmployeeTaxProfile>;
  settings?: PayrollSettings;
}

export interface RemittanceGroup {
  /** The payee inside the authority: a State IRS, a PFA… */
  name: string;
  /** Employer reference with that payee, where there is one. */
  reference?: string;
  count: number;
  amount: number;
}

export interface RemittanceStatement {
  item: RemittanceItem;
  month: string;
  monthLabel: string;
  title: string;
  to: string;
  due: string;
  basis: string;
  total: number;
  contributors: number;
  groups: RemittanceGroup[];
  /** Per-employee schedule; `trailer` holds the total. */
  table: ExportTable;
  runs: { id: string; title: string }[];
}

type Cell = string | number;
const amt = (lines: PayslipLine[], code: string) => lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0);
const reimbursed = (lines: PayslipLine[]) => lines.filter((l) => l.group === "reimbursements").reduce((s, l) => s + l.amount, 0);

interface Acc {
  employeeId: string;
  group: string;
  cols: Cell[];
  nums: number[];
}

export const monthKeyOf = (r: Pick<PayrollRun, "period">) => `${r.period.year}-${String(r.period.month).padStart(2, "0")}`;

/** Finalized and paid runs, grouped by pay month ("YYYY-MM"). */
export function lockedRunsByMonth(runs: PayrollRun[]): Map<string, PayrollRun[]> {
  const m = new Map<string, PayrollRun[]>();
  for (const r of runs.filter((r) => r.status === "finalized" || r.status === "disbursed")) m.set(monthKeyOf(r), [...(m.get(monthKeyOf(r)) ?? []), r]);
  return m;
}

export function remittanceStatement(item: RemittanceItem, runs: PayrollRun[], ctx: RemittanceCtx): RemittanceStatement | null {
  const regular = runs.find((r) => r.type === "regular") ?? runs[0];
  if (!regular) return null;
  const cal = remittanceCalendar(regular.period).find((c) => c.key === item)!;
  const ids = ctx.settings?.employerIds;

  // One row per employee, summed across the month's runs.
  const acc = new Map<string, Acc>();
  for (const run of runs) {
    for (const re of run.employees) {
      const c = re.included ? re.computation : null;
      if (!c) continue;
      const emp = ctx.people.get(re.employeeId);
      const p = re.snapshot ?? paymentSnapshot(ctx.profiles.get(re.employeeId));
      const gross = c.gross - reimbursed(c.lines);
      let group = "";
      let nums: number[] = [];
      let cols: Cell[] = [];
      switch (item) {
        case "paye":
          if (!amt(c.lines, "PAYE")) continue;
          group = p.stateOfResidence || "Unassigned";
          cols = [p.tin || "MISSING TIN"];
          nums = [gross, c.tax.periodChargeable, amt(c.lines, "PAYE")];
          break;
        case "pension": {
          const ee = amt(c.lines, "PENSION_EE");
          const er = amt(c.lines, "PENSION_ER");
          if (!ee && !er) continue;
          group = p.pfaName || "No PFA";
          cols = [p.rsaPin || "MISSING RSA PIN"];
          nums = [c.bases.pensionable, ee, er, ee + er];
          break;
        }
        case "avc": {
          const v = amt(c.lines, "VOL_PENSION");
          if (!v) continue;
          group = p.pfaName || "No PFA";
          cols = [p.rsaPin || "MISSING RSA PIN"];
          nums = [v];
          break;
        }
        case "nhf":
          if (!amt(c.lines, "NHF")) continue;
          group = "Federal Mortgage Bank of Nigeria";
          cols = [p.nhfNumber || "—"];
          nums = [c.bases.nhf, amt(c.lines, "NHF")];
          break;
        case "nsitf":
          if (!amt(c.lines, "NSITF")) continue;
          group = "NSITF";
          nums = [gross, amt(c.lines, "NSITF")];
          break;
        case "itf":
          if (!amt(c.lines, "ITF")) continue;
          group = "Industrial Training Fund";
          nums = [gross, amt(c.lines, "ITF")];
          break;
        case "hmo": {
          const ee = amt(c.lines, "HMO_EE");
          const er = amt(c.lines, "HMO_ER");
          if (!ee && !er) continue;
          // Grouped by provider: the plan id rides on the line's refId.
          const planId = c.lines.find((l) => l.code === "HMO_EE" || l.code === "HMO_ER")?.refId;
          const plan = ctx.settings?.hmo?.plans.find((x) => x.id === planId);
          group = ctx.settings?.hmo?.providers.find((x) => x.id === plan?.providerId)?.name ?? "HMO provider";
          cols = [plan?.name ?? "—"];
          nums = [ee, er, ee + er];
          break;
        }
      }
      const key = `${group}|${re.employeeId}`;
      const prev = acc.get(key);
      if (prev) prev.nums = prev.nums.map((n, i) => n + nums[i]);
      else acc.set(key, { employeeId: re.employeeId, group, cols: [emp?.employeeNumber ?? re.employeeId, emp?.fullName ?? "", ...cols], nums });
    }
  }

  const headersByItem: Record<RemittanceItem, string[]> = {
    paye: ["State IRS", "Employee ID", "Name", "TIN", "Gross pay", "Chargeable income", "PAYE"],
    pension: ["PFA", "Employee ID", "Name", "RSA PIN", "Pensionable pay", "Employee (8%)", "Employer (10%)", "Total"],
    avc: ["PFA", "Employee ID", "Name", "RSA PIN", "Voluntary contribution"],
    nhf: ["Payee", "Employee ID", "Name", "NHF number", "NHF base", "NHF (2.5%)"],
    nsitf: ["Payee", "Employee ID", "Name", "Monthly emoluments", "Employer contribution (1%)"],
    itf: ["Payee", "Employee ID", "Name", "Monthly emoluments", "Employer contribution (1%)"],
    hmo: ["HMO provider", "Employee ID", "Name", "Plan", "Employee share", "Employer share", "Premium"],
  };
  const groupRef = (g: string): string | undefined =>
    item === "paye" ? ids?.stateTaxIds?.[g] : item === "pension" || item === "avc" ? ids?.pencomEmployerCode : item === "nsitf" ? ids?.nsitfCode : undefined;

  const rows = [...acc.values()].sort((a, b) => a.group.localeCompare(b.group) || String(a.cols[1]).localeCompare(String(b.cols[1])));
  const data: Cell[][] = rows.map((r) => [r.group, ...r.cols, ...r.nums.map(round2)]);
  const groups = new Map<string, RemittanceGroup>();
  for (const r of rows) {
    const g = groups.get(r.group) ?? { name: r.group, reference: groupRef(r.group), count: 0, amount: 0 };
    g.count++;
    g.amount = round2(g.amount + r.nums[r.nums.length - 1]);
    groups.set(r.group, g);
  }
  const width = headersByItem[item].length;
  const numCount = rows[0]?.nums.length ?? 1;
  const totals = Array.from({ length: numCount }, (_, i) => round2(rows.reduce((s, r) => s + r.nums[i], 0)));
  const trailer: Cell[][] = [["TOTAL", `${rows.length} employees`, ...Array(width - 2 - numCount).fill(""), ...totals]];
  const total = remittanceAmounts(runs)[item];

  return {
    item,
    month: monthKeyOf(regular),
    monthLabel: regular.period.label,
    title: cal.item,
    to: cal.to,
    due: cal.due,
    basis: cal.basis,
    total,
    contributors: rows.length,
    groups: [...groups.values()],
    table: { headers: headersByItem[item], data, trailer },
    runs: runs.map((r) => ({ id: r.id, title: r.title })),
  };
}

export function downloadRemittanceSchedule(st: RemittanceStatement, format: ExportFormat = "xlsx") {
  writeTable(`${st.month}-${st.item}-remittance`, `${st.title} ${st.month}`, st.table, format);
}

/** Every remittance for the month in one workbook-style CSV/XLSX download, one after the other. */
export function downloadAllRemittances(statements: RemittanceStatement[], month: string, format: ExportFormat = "xlsx") {
  const data: Cell[][] = [];
  for (const st of statements) {
    data.push([`${st.title} — ${st.to}`, `Due ${st.due}`, `Total ${st.total}`], st.table.headers, ...st.table.data, ...(st.table.trailer ?? []), []);
  }
  writeTable(`${month}-statutory-remittances`, `Remittances ${month}`, { headers: [`Statutory remittances — ${month}`], data }, format);
}

const REF_PREFIX: Record<RemittanceItem, string> = { paye: "IRS", pension: "PEN", avc: "AVC", nhf: "NHF", nsitf: "NSITF", itf: "ITF", hmo: "HMO" };

/**
 * Demo history: every finalized month except the latest has its remittances
 * recorded as paid a couple of working days before they fell due, so the
 * Statutory Remittances tab shows a realistic mix of paid, due and overdue.
 * ITF is annual, so it stays outstanding. Only remittances already past due
 * on `today` are marked paid.
 */
export function seedRemittances(runs: PayrollRun[], by: string, today: string): Record<string, RemittanceRecord> {
  const out: Record<string, RemittanceRecord> = {};
  const months = [...lockedRunsByMonth(runs)].sort(([a], [b]) => a.localeCompare(b)).slice(0, -1);
  months.forEach(([month, monthRuns], mi) => {
    // Older months are reconciled with the receipt on file; the most recent paid month awaits reconciliation.
    const reconciled = mi < months.length - 1;
    const reg = monthRuns.find((r) => r.type === "regular") ?? monthRuns[0];
    const amounts = remittanceAmounts(monthRuns);
    remittanceCalendar(reg.period).forEach((c, i) => {
      if (c.key === "itf" || amounts[c.key] <= 0 || c.due >= today) return;
      const twoBefore = new Date(Date.UTC(+c.due.slice(0, 4), +c.due.slice(5, 7) - 1, +c.due.slice(8, 10) - 2)).toISOString().slice(0, 10);
      const date = previousWorkingDay(twoBefore);
      const serial = String(((+month.replace("-", "") * 37 + i * 911) % 900000) + 100000);
      const reference = `${REF_PREFIX[c.key]}-${month.replace("-", "")}-${serial}`;
      out[`${month}:${c.key}`] = {
        status: reconciled ? "reconciled" : "paid",
        reference,
        date,
        by,
        at: `${date}T15:00:00.000Z`,
        amountPaid: amounts[c.key],
        receipt: { fileName: `${reference}-receipt.pdf`, uploadedAt: `${date}T15:05:00.000Z` },
        ...(reconciled ? { reconciledBy: by, reconciledAt: `${date}T16:00:00.000Z` } : {}),
      };
    });
  });
  return out;
}
