import type { LocaleEmployee } from "@/src/lib/types/locale";
import { round2 } from "./ng/engine";
import { structureOn } from "./run-builder";
import type { PayComputation, PayElement, PayrollRun, PayslipLine, SalaryStructure } from "./types";

/**
 * Payroll comparison: one run against another (normally this month against
 * last), showing what moved and WHY. Every naira of the gross difference is
 * attributed to exactly one reason, so the bridge always adds up:
 *
 *   previous gross + Σ(reason amounts) = current gross
 */

export type VarianceReason = "joiner" | "leaver" | "salary_change" | "proration" | "overtime" | "attendance" | "one_off" | "expenses" | "other";

export const REASON_LABELS: Record<VarianceReason, string> = {
  joiner: "New joiner",
  leaver: "Leaver",
  salary_change: "Salary change",
  proration: "Part month (pro-rated)",
  overtime: "Overtime & shift pay",
  attendance: "Unpaid leave & lateness",
  one_off: "One-off payments",
  expenses: "Expense reimbursements",
  other: "Other",
};

export const REASON_ORDER: VarianceReason[] = ["joiner", "leaver", "salary_change", "proration", "overtime", "attendance", "one_off", "expenses", "other"];

export interface TotalsLine {
  key: string;
  label: string;
  previous: number;
  current: number;
  change: number;
  /** null when the previous figure was zero. */
  pct: number | null;
}

export interface EmployeeVariance {
  employeeId: string;
  name: string;
  employeeNumber: string;
  department: string;
  previousGross: number | null;
  currentGross: number | null;
  change: number;
  pct: number | null;
  /** Gross change by reason (non-zero only). */
  reasons: Partial<Record<VarianceReason, number>>;
  /** Plain-English explanation of the biggest movements. */
  notes: string[];
  previousNet: number | null;
  currentNet: number | null;
}

export interface RunComparison {
  current: Pick<PayrollRun, "id" | "title" | "period">;
  previous: Pick<PayrollRun, "id" | "title" | "period">;
  totals: TotalsLine[];
  /** Earnings element by element. */
  earnings: TotalsLine[];
  bridge: { reason: VarianceReason; amount: number; employees: number }[];
  employees: EmployeeVariance[];
}

export interface ComparisonCtx {
  people: Map<string, LocaleEmployee>;
  elements: PayElement[];
  structures: SalaryStructure[];
}

const sumCode = (lines: PayslipLine[], code: string) => lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0);
const pctOf = (prev: number, now: number) => (prev ? round2(((now - prev) / Math.abs(prev)) * 100) : null);
const line = (key: string, label: string, previous: number, current: number): TotalsLine => ({
  key,
  label,
  previous: round2(previous),
  current: round2(current),
  change: round2(current - previous),
  pct: pctOf(previous, current),
});

const ONE_OFF_GROUPS = new Set(["bonuses", "annual", "termination", "benefits_in_kind", "corrections"]);
const RECURRING_GROUPS = new Set(["core", "allowances"]);

/** The reason a change in one earning line belongs to. */
function reasonForLine(l: PayslipLine | undefined, p: PayslipLine | undefined, group: string | undefined, prorationMoved: boolean, recurring = true): VarianceReason {
  const source = l?.source ?? p?.source;
  if (source === "attendance") return "attendance";
  if (group === "overtime" || group === "manufacturing") return "overtime";
  if (group === "reimbursements" || source === "expense") return "expenses";
  // Non-recurring elements (leave allowance, bonuses…) are one-offs whatever their group.
  if (source === "manual" || source === "adjustment" || !recurring || (group && ONE_OFF_GROUPS.has(group))) return "one_off";
  if (group && RECURRING_GROUPS.has(group)) return prorationMoved ? "proration" : "salary_change";
  return "other";
}

const earnings = (c: PayComputation | null | undefined) => (c ? c.lines.filter((l) => l.category === "earning") : []);

export function compareRuns(current: PayrollRun, previous: PayrollRun, ctx: ComparisonCtx): RunComparison {
  const groupOf = new Map(ctx.elements.map((e) => [e.code, e.group as string]));
  const nameOf = new Map(ctx.elements.map((e) => [e.code, e.name]));
  const recurringOf = (code: string) => ctx.elements.find((e) => e.code === code)?.recurring !== false;
  const inc = (r: PayrollRun) => new Map(r.employees.filter((e) => e.included && e.computation).map((e) => [e.employeeId, e.computation!]));
  const cur = inc(current);
  const prev = inc(previous);

  // ── Totals ────────────────────────────────────────────────────────────────
  const T = (r: PayrollRun) => {
    let avc = 0;
    let nhf = 0;
    let other = 0;
    for (const e of r.employees) {
      const c = e.included ? e.computation : null;
      if (!c) continue;
      avc += sumCode(c.lines, "VOL_PENSION");
      nhf += sumCode(c.lines, "NHF");
      other += c.otherDeductions;
    }
    return { ...r.totals, avc, nhf, other };
  };
  const a = T(previous);
  const b = T(current);
  const totals: TotalsLine[] = [
    line("employees", "Employees paid", a.employees, b.employees),
    line("gross", "Gross pay", a.gross, b.gross),
    line("paye", "PAYE", a.paye, b.paye),
    line("pensionEmployee", "Pension — employee", a.pensionEmployee, b.pensionEmployee),
    line("avc", "Voluntary pension (AVC)", a.avc, b.avc),
    line("nhf", "NHF", a.nhf, b.nhf),
    line("other", "Other deductions", a.other, b.other),
    line("deductions", "Total deductions", a.deductions, b.deductions),
    line("net", "Net pay", a.net, b.net),
    line("pensionEmployer", "Pension — employer", a.pensionEmployer, b.pensionEmployer),
    line("employerCost", "Employer cost", a.employerCost, b.employerCost),
    line("totalCost", "Total payroll cost", a.gross + a.employerCost, b.gross + b.employerCost),
  ];

  // ── Earnings by element ───────────────────────────────────────────────────
  const elementTotals = new Map<string, { label: string; p: number; c: number }>();
  const addEl = (lines: PayslipLine[], side: "p" | "c") => {
    for (const l of lines) {
      const row = elementTotals.get(l.code) ?? { label: nameOf.get(l.code) ?? l.name, p: 0, c: 0 };
      row[side] += l.amount;
      elementTotals.set(l.code, row);
    }
  };
  for (const c of prev.values()) addEl(earnings(c), "p");
  for (const c of cur.values()) addEl(earnings(c), "c");
  const earningLines = [...elementTotals.entries()]
    .map(([code, r]) => line(code, r.label, r.p, r.c))
    .sort((x, y) => Math.abs(y.change) - Math.abs(x.change) || y.current - x.current);

  // ── Per employee, reason by reason ────────────────────────────────────────
  const ids = new Set([...cur.keys(), ...prev.keys()]);
  const employees: EmployeeVariance[] = [];
  for (const id of ids) {
    const c = cur.get(id) ?? null;
    const p = prev.get(id) ?? null;
    const emp = ctx.people.get(id);
    const reasons: Partial<Record<VarianceReason, number>> = {};
    const add = (r: VarianceReason, v: number) => {
      if (Math.abs(v) < 0.005) return;
      reasons[r] = round2((reasons[r] ?? 0) + v);
    };
    const notes: string[] = [];

    if (c && !p) {
      add("joiner", c.gross);
      notes.push(emp?.startDate && emp.startDate >= current.period.start ? `Joined ${emp.startDate}` : `Not paid in ${previous.period.label}`);
      if (c.prorationFactor < 1) notes.push(`Paid ${Math.round(c.prorationFactor * 100)}% of the month`);
    } else if (p && !c) {
      add("leaver", -p.gross);
      notes.push(emp?.dateOfLeaving ? `Left ${emp.dateOfLeaving}` : `Not paid in ${current.period.label}`);
    } else if (c && p) {
      const prorationMoved = Math.abs(c.prorationFactor - p.prorationFactor) > 0.0001;
      const codes = new Set([...earnings(c).map((l) => l.code), ...earnings(p).map((l) => l.code)]);
      for (const code of codes) {
        const lc = earnings(c).filter((l) => l.code === code);
        const lp = earnings(p).filter((l) => l.code === code);
        const diff = lc.reduce((s, l) => s + l.amount, 0) - lp.reduce((s, l) => s + l.amount, 0);
        if (Math.abs(diff) < 0.005) continue;
        add(reasonForLine(lc[0], lp[0], groupOf.get(code), prorationMoved, recurringOf(code)), diff);
      }
      if (prorationMoved) notes.push(`Paid ${Math.round(c.prorationFactor * 100)}% of the month (was ${Math.round(p.prorationFactor * 100)}%)`);
      if (reasons.salary_change) {
        const s = structureOn(ctx.structures, id, current.period.end);
        if (s && s.effectiveFrom > previous.period.start) notes.push(`New salary from ${s.effectiveFrom}${s.reason ? ` — ${s.reason}` : ""}`);
      }
      // Name the one-offs paid in only one of the two months ("Leave Allowance last month").
      const oneOff = (l: PayslipLine) => reasonForLine(l, undefined, groupOf.get(l.code), false, recurringOf(l.code)) === "one_off";
      const added = earnings(c).filter((l) => oneOff(l) && !earnings(p).some((x) => x.code === l.code));
      const dropped = earnings(p).filter((l) => oneOff(l) && !earnings(c).some((x) => x.code === l.code));
      if (added.length) notes.push(`Paid this month: ${added.map((l) => l.name).join(", ")}`);
      if (dropped.length) notes.push(`Paid last month only: ${dropped.map((l) => l.name).join(", ")}`);
      const ot = earnings(c).filter((l) => ["overtime", "manufacturing"].includes(groupOf.get(l.code) ?? ""));
      if (reasons.overtime && ot.length) notes.push(ot.map((l) => (l.units ? `${l.name} ${l.units}h` : l.name)).join(", "));
    }
    const change = round2((c?.gross ?? 0) - (p?.gross ?? 0));
    if (!c && !p) continue;
    employees.push({
      employeeId: id,
      name: emp?.fullName ?? id,
      employeeNumber: emp?.employeeNumber ?? id,
      department: emp?.departmentName ?? "Unassigned",
      previousGross: p?.gross ?? null,
      currentGross: c?.gross ?? null,
      change,
      pct: p ? pctOf(p.gross, c?.gross ?? 0) : null,
      reasons,
      notes,
      previousNet: p?.net ?? null,
      currentNet: c?.net ?? null,
    });
  }
  employees.sort((x, y) => Math.abs(y.change) - Math.abs(x.change) || x.name.localeCompare(y.name));

  const bridge = REASON_ORDER.map((reason) => ({
    reason,
    amount: round2(employees.reduce((s, e) => s + (e.reasons[reason] ?? 0), 0)),
    employees: employees.filter((e) => e.reasons[reason]).length,
  })).filter((x) => x.employees > 0);

  const pick = (r: PayrollRun) => ({ id: r.id, title: r.title, period: r.period });
  return { current: pick(current), previous: pick(previous), totals, earnings: earningLines, bridge, employees };
}

/** The run to compare against by default: the latest regular run before this one's month. */
export function defaultPreviousRun(runs: PayrollRun[], current: PayrollRun): PayrollRun | null {
  const key = (r: PayrollRun) => r.period.year * 100 + r.period.month;
  return (
    runs
      .filter((r) => r.id !== current.id && r.type === "regular" && key(r) < key(current))
      .sort((x, y) => key(y) - key(x))[0] ?? null
  );
}
