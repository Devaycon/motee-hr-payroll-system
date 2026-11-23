import type { LocaleEmployee } from "@/src/lib/types/locale";
import { round2 } from "./ng/engine";
import { structureOn } from "./run-builder";
import type { PayComputation, PayElement, PayrollAuditEntry, PayrollRun, PayslipLine, SalaryStructure } from "./types";

/**
 * Payroll comparison: one run against another (normally this month against
 * last), showing what moved and WHY. Every naira of the gross difference is
 * attributed to exactly one reason, so the bridge always adds up:
 *
 *   previous gross + Σ(reason amounts) = current gross
 *
 * Explanations are rule-based and built only from records: payslip lines,
 * salary structure versions, period inputs, imports and the audit log. When
 * no confirmed source exists the movement says "Reason requires
 * investigation" — the system never guesses a cause.
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
  other: "Unclassified — requires investigation",
};

export const REASON_ORDER: VarianceReason[] = ["joiner", "leaver", "salary_change", "proration", "overtime", "attendance", "one_off", "expenses", "other"];

/** Whether a movement will repeat next month on its own. */
export type ReasonNature = "recurring" | "non_recurring" | "unclassified";

export const REASON_NATURE: Record<VarianceReason, ReasonNature> = {
  joiner: "recurring",
  leaver: "recurring",
  salary_change: "recurring",
  proration: "non_recurring",
  overtime: "non_recurring",
  attendance: "non_recurring",
  one_off: "non_recurring",
  expenses: "non_recurring",
  other: "unclassified",
};

export const NATURE_LABELS: Record<ReasonNature, string> = { recurring: "Recurring", non_recurring: "Non-recurring", unclassified: "Unclassified" };

/**
 * What kind of movement a line is. A payment that didn't recur, a new
 * payment, a change in amount, and a reduction to pay all lower or raise
 * payroll, but they mean very different things.
 */
export type MovementKind = "new_payment" | "not_repeated" | "amount_changed" | "negative_earning" | "joined" | "left";

export const KIND_LABELS: Record<MovementKind, string> = {
  new_payment: "New payment",
  not_repeated: "Not repeated",
  amount_changed: "Amount changed",
  negative_earning: "Reduction to pay",
  joined: "Joined payroll",
  left: "Left payroll",
};

/** Where a movement came from. */
export type SourceType =
  | "salary_change"
  | "hr_import"
  | "hr_record"
  | "leave_attendance"
  | "timesheet"
  | "leave_allowance_policy"
  | "payroll_input"
  | "adjustment"
  | "expense"
  | "non_recurring_element"
  | "proration"
  | "unknown";

export const SOURCE_LABELS: Record<SourceType, string> = {
  salary_change: "Salary change",
  hr_import: "HR employee import",
  hr_record: "HR employee record",
  leave_attendance: "Leave & attendance",
  timesheet: "Timesheet / overtime",
  leave_allowance_policy: "Leave allowance policy",
  payroll_input: "Payroll input",
  adjustment: "Payroll adjustment",
  expense: "Expense claim",
  non_recurring_element: "Non-recurring pay element",
  proration: "Part-month pay",
  unknown: "Requires investigation",
};

export interface MovementSource {
  type: SourceType;
  /** Plain-English evidence, e.g. "Salary change effective 2026-11-01 — promotion". */
  detail: string;
  /** Originating record (structure id, import batch, expense id, input id). */
  ref?: string;
  initiatedBy?: string;
  approvedBy?: string;
  /** When payroll processed it (run calculated / finalized). */
  processedAt?: string;
  /** False when nothing on record explains it. */
  confirmed: boolean;
}

export interface Movement {
  code: string;
  name: string;
  reason: VarianceReason;
  kind: MovementKind;
  previous: number;
  current: number;
  change: number;
  /** Hours or days, when the line carries them. */
  previousUnits?: number;
  currentUnits?: number;
  source: MovementSource;
}

export const UNEXPLAINED_TEXT = "Reason requires investigation";

export interface TotalsLine {
  key: string;
  label: string;
  previous: number;
  current: number;
  change: number;
  /** null when the previous figure was zero. */
  pct: number | null;
}

/** Pay components compared one by one — catches what a gross-only comparison misses. */
export type ComponentKey =
  | "basic"
  | "housing"
  | "transport"
  | "otherAllowances"
  | "overtime"
  | "bonuses"
  | "attendance"
  | "otherEarnings"
  | "gross"
  | "paye"
  | "pensionEmployee"
  | "nhf"
  | "otherDeductions"
  | "net"
  | "employerContributions"
  | "costToEmployer";

export const COMPONENT_ROWS: { key: ComponentKey; label: string; section: "earnings" | "deductions" | "employer"; total?: boolean }[] = [
  { key: "basic", label: "Basic salary", section: "earnings" },
  { key: "housing", label: "Housing allowance", section: "earnings" },
  { key: "transport", label: "Transport allowance", section: "earnings" },
  { key: "otherAllowances", label: "Other allowances", section: "earnings" },
  { key: "overtime", label: "Overtime & shift pay", section: "earnings" },
  { key: "bonuses", label: "Bonuses & one-off payments", section: "earnings" },
  { key: "attendance", label: "Unpaid leave & lateness", section: "earnings" },
  { key: "otherEarnings", label: "Other earnings", section: "earnings" },
  { key: "gross", label: "Gross pay", section: "earnings", total: true },
  { key: "paye", label: "PAYE", section: "deductions" },
  { key: "pensionEmployee", label: "Pension — employee (incl. AVC)", section: "deductions" },
  { key: "nhf", label: "NHF", section: "deductions" },
  { key: "otherDeductions", label: "Other deductions", section: "deductions" },
  { key: "net", label: "Net pay", section: "deductions", total: true },
  { key: "employerContributions", label: "Employer contributions", section: "employer" },
  { key: "costToEmployer", label: "Total cost to employer", section: "employer", total: true },
];

export interface EmployeeVariance {
  employeeId: string;
  name: string;
  employeeNumber: string;
  department: string;
  costCentre: string;
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
  /** Line-level movements behind the gross change. */
  movements: Movement[];
  /** Every pay component, previous against current. */
  components: TotalsLine[];
  /** One sentence, built from the records. */
  explanation: string;
  /** Sum of movements no record explains. */
  unexplained: number;
}

export interface BridgeStep {
  reason: VarianceReason;
  amount: number;
  employees: number;
  nature: ReasonNature;
}

export interface WaterfallStep {
  key: string;
  label: string;
  /** For totals the level itself; for steps the movement. */
  value: number;
  /** Where the bar starts and ends (equal to value / 0 for totals). */
  start: number;
  end: number;
  type: "total" | "step";
  reason?: VarianceReason;
  employees?: number;
}

export interface Reconciliation {
  opening: number;
  closing: number;
  change: number;
  /** Σ of every bridge step — equals `change` when balanced. */
  attributed: number;
  /** Movements traced to a confirmed source. */
  explained: number;
  /** Movements with no confirmed source (signed). */
  unexplained: number;
  unexplainedEmployees: number;
  /** Bridge adds up to the register to the kobo. */
  balanced: boolean;
  difference: number;
}

export interface RunComparison {
  current: Pick<PayrollRun, "id" | "title" | "period">;
  previous: Pick<PayrollRun, "id" | "title" | "period">;
  totals: TotalsLine[];
  /** Earnings element by element. */
  earnings: TotalsLine[];
  /** Basic → net → cost to employer, company-wide. */
  componentTotals: TotalsLine[];
  bridge: BridgeStep[];
  waterfall: WaterfallStep[];
  reconciliation: Reconciliation;
  employees: EmployeeVariance[];
}

/** The fields of a starter-import batch the comparison needs (kept minimal to avoid an import cycle). */
export interface ImportRef {
  id: string;
  fileName: string;
  importedBy: string;
  importedAt: string;
  employees: { id: string }[];
}

export interface ComparisonCtx {
  people: Map<string, LocaleEmployee>;
  elements: PayElement[];
  structures: SalaryStructure[];
  /** Starter-import batches, to trace joiners to the import. */
  imports?: ImportRef[];
  /** Payroll audit log, to name who entered a one-off input. */
  audit?: PayrollAuditEntry[];
  /** Department name → cost centre code. */
  costCentres?: Map<string, string>;
}

const sumCode = (lines: PayslipLine[], code: string) => lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0);
const sumCodes = (lines: PayslipLine[], codes: string[]) => lines.filter((l) => codes.includes(l.code)).reduce((s, l) => s + l.amount, 0);
const pctOf = (prev: number, now: number) => (prev ? round2(((now - prev) / Math.abs(prev)) * 100) : null);
const line = (key: string, label: string, previous: number, current: number): TotalsLine => ({
  key,
  label,
  previous: round2(previous),
  current: round2(current),
  change: round2(current - previous),
  pct: pctOf(previous, current),
});

/** ₦1,234,567.89 — exact figures for explanations. */
export const naira2 = (n: number) => `₦${Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDay = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const ONE_OFF_GROUPS = new Set(["bonuses", "annual", "termination", "benefits_in_kind", "corrections"]);
const RECURRING_GROUPS = new Set(["core", "allowances"]);
const OVERTIME_GROUPS = new Set(["overtime", "manufacturing"]);

/** The reason a change in one earning line belongs to. */
function reasonForLine(l: PayslipLine | undefined, p: PayslipLine | undefined, group: string | undefined, prorationMoved: boolean, recurring = true): VarianceReason {
  const source = l?.source ?? p?.source;
  // Overtime first: timesheet hours arrive with source "attendance" but are pay, not a deduction.
  if (group && OVERTIME_GROUPS.has(group)) return "overtime";
  if (source === "attendance") return "attendance";
  if (group === "reimbursements" || source === "expense") return "expenses";
  // Non-recurring elements (leave allowance, bonuses…) are one-offs whatever their group.
  if (source === "manual" || source === "adjustment" || !recurring || (group && ONE_OFF_GROUPS.has(group))) return "one_off";
  if (group && RECURRING_GROUPS.has(group)) return prorationMoved ? "proration" : "salary_change";
  return "other";
}

const earnings = (c: PayComputation | null | undefined) => (c ? c.lines.filter((l) => l.category === "earning") : []);

/** Split a computation into the components finance reads. Earnings always add back to gross. */
export function componentsOf(c: PayComputation | null | undefined, groupOf: Map<string, string>, recurringOf: (code: string) => boolean): Record<ComponentKey, number> {
  const z = Object.fromEntries(COMPONENT_ROWS.map((r) => [r.key, 0])) as Record<ComponentKey, number>;
  if (!c) return z;
  for (const l of earnings(c)) {
    const g = groupOf.get(l.code) ?? l.group;
    if (l.code === "BASIC" || l.code === "CONSOLIDATED") z.basic += l.amount;
    else if (l.code === "HOUSING") z.housing += l.amount;
    else if (l.code === "TRANSPORT") z.transport += l.amount;
    else if (OVERTIME_GROUPS.has(g)) z.overtime += l.amount;
    else if (l.source === "attendance" || l.amount < 0) z.attendance += l.amount;
    else if (ONE_OFF_GROUPS.has(g) || !recurringOf(l.code) || l.source === "manual" || l.source === "adjustment") z.bonuses += l.amount;
    else if (g === "allowances") z.otherAllowances += l.amount;
  }
  const named = z.basic + z.housing + z.transport + z.otherAllowances + z.overtime + z.bonuses + z.attendance;
  z.otherEarnings = c.gross - named;
  z.gross = c.gross;
  z.paye = sumCodes(c.lines, ["PAYE", "WHT"]);
  z.pensionEmployee = sumCodes(c.lines, ["PENSION_EE", "VOL_PENSION"]);
  z.nhf = sumCode(c.lines, "NHF");
  z.net = c.net;
  z.otherDeductions = c.gross - c.net - z.paye - z.pensionEmployee - z.nhf;
  z.employerContributions = c.employerCost;
  z.costToEmployer = c.gross + c.employerCost;
  for (const k of Object.keys(z) as ComponentKey[]) z[k] = round2(z[k]);
  return z;
}

const componentLines = (p: Record<ComponentKey, number>, c: Record<ComponentKey, number>) => COMPONENT_ROWS.map((r) => line(r.key, r.label, p[r.key], c[r.key]));

export function compareRuns(current: PayrollRun, previous: PayrollRun, ctx: ComparisonCtx): RunComparison {
  const groupOf = new Map(ctx.elements.map((e) => [e.code, e.group as string]));
  const nameOf = new Map(ctx.elements.map((e) => [e.code, e.name]));
  const recurringOf = (code: string) => ctx.elements.find((e) => e.code === code)?.recurring !== false;
  const inc = (r: PayrollRun) => new Map(r.employees.filter((e) => e.included && e.computation).map((e) => [e.employeeId, e.computation!]));
  const cur = inc(current);
  const prev = inc(previous);
  const processedAt = current.finalizedAt ?? current.calculatedAt ?? current.createdAt;
  const runApprover = current.approvedBy?.name;

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

  // ── Sources ───────────────────────────────────────────────────────────────
  const importOf = (id: string) => (ctx.imports ?? []).find((bt) => bt.employees.some((e) => e.id === id));
  const enteredBy = (id: string, code: string) =>
    (ctx.audit ?? []).find((x) => x.runId === current.id && x.employeeId === id && (!x.detail || x.detail.includes(code)))?.actor ?? current.preparedBy?.name;
  const inputFor = (id: string, code: string) => current.inputs.find((i) => i.employeeId === id && i.code === code);

  function sourceFor(id: string, reason: VarianceReason, code: string, l: PayslipLine | undefined, p: PayslipLine | undefined, emp: LocaleEmployee | undefined): MovementSource {
    const base = { processedAt, approvedBy: runApprover };
    const ln = l ?? p;
    switch (reason) {
      case "salary_change": {
        const s = structureOn(ctx.structures, id, current.period.end);
        if (s && s.effectiveFrom > previous.period.start) {
          return {
            type: "salary_change",
            detail: `Salary revised from ${fmtDay(s.effectiveFrom)}${s.reason ? ` — ${s.reason}` : ""}${s.batchId ? ` (salary review ${s.batchId})` : ""}`,
            ref: s.id,
            initiatedBy: s.proposedBy,
            approvedBy: s.approvedBy || undefined,
            processedAt,
            confirmed: true,
          };
        }
        return { type: "unknown", detail: `Recurring pay changed with no salary change on record — ${UNEXPLAINED_TEXT.toLowerCase()}`, ...base, confirmed: false };
      }
      case "proration":
        return { type: "proration", detail: "Part-month pay (start date, leaving date or unpaid days)", ...base, confirmed: true };
      case "overtime":
        if (ln?.source === "attendance") return { type: "timesheet", detail: `Overtime from approved timesheets${l?.units ? ` — ${l.units} hrs` : ""}`, ...base, confirmed: true };
        if (inputFor(id, code)) return { type: "payroll_input", detail: "Overtime entered on the run", ref: inputFor(id, code)!.id, initiatedBy: enteredBy(id, code), ...base, confirmed: true };
        if (!l && p) return { type: "non_recurring_element", detail: "No overtime this month", ...base, confirmed: true };
        return { type: "unknown", detail: UNEXPLAINED_TEXT, ...base, confirmed: false };
      case "attendance":
        return { type: "leave_attendance", detail: `${ln?.name ?? "Unpaid leave / lateness"} from leave & attendance records${l?.units ? ` — ${l.units} day${l.units === 1 ? "" : "s"}` : ""}`, ...base, confirmed: true };
      case "expenses":
        return { type: "expense", detail: `Approved expense claim${ln?.refId ? ` ${ln.refId}` : ""}`, ref: ln?.refId, ...base, confirmed: true };
      case "one_off": {
        if (!l && p) return { type: "non_recurring_element", detail: `${p.name} was paid in ${previous.period.label} only — it is not a recurring payment`, ...base, confirmed: true };
        if (code === "LEAVE_ALLOW") return { type: "leave_allowance_policy", detail: "Leave allowance policy (paid once per tax year)", ...base, confirmed: true };
        if (ln?.source === "adjustment") return { type: "adjustment", detail: `Payroll adjustment${ln.refId ? ` ${ln.refId}` : ""}`, ref: ln.refId, ...base, confirmed: true };
        const input = inputFor(id, code);
        if (input) return { type: "payroll_input", detail: `${input.description || ln?.name || code} entered on the ${current.period.label} run`, ref: input.id, initiatedBy: enteredBy(id, code), ...base, confirmed: true };
        return { type: "unknown", detail: UNEXPLAINED_TEXT, ...base, confirmed: false };
      }
      case "joiner": {
        const bt = importOf(id);
        if (bt) return { type: "hr_import", detail: `Added by starter import ${bt.fileName}`, ref: bt.id, initiatedBy: bt.importedBy, ...base, confirmed: true };
        if (emp?.startDate && emp.startDate >= previous.period.start) return { type: "hr_record", detail: `Started ${fmtDay(emp.startDate)} (HR record)`, ...base, confirmed: true };
        return { type: "unknown", detail: `Not paid in ${previous.period.label} — ${UNEXPLAINED_TEXT.toLowerCase()}`, ...base, confirmed: false };
      }
      case "leaver":
        if (emp?.dateOfLeaving) return { type: "hr_record", detail: `Left ${fmtDay(emp.dateOfLeaving)} (HR record)`, ...base, confirmed: true };
        return { type: "unknown", detail: `Not paid in ${current.period.label} — ${UNEXPLAINED_TEXT.toLowerCase()}`, ...base, confirmed: false };
      default:
        return { type: "unknown", detail: UNEXPLAINED_TEXT, ...base, confirmed: false };
    }
  }

  // ── Per employee, reason by reason ────────────────────────────────────────
  const ids = new Set([...cur.keys(), ...prev.keys()]);
  const employees: EmployeeVariance[] = [];
  for (const id of ids) {
    const c = cur.get(id) ?? null;
    const p = prev.get(id) ?? null;
    if (!c && !p) continue;
    const emp = ctx.people.get(id);
    const reasons: Partial<Record<VarianceReason, number>> = {};
    const add = (r: VarianceReason, v: number) => {
      if (Math.abs(v) < 0.005) return;
      reasons[r] = round2((reasons[r] ?? 0) + v);
    };
    const notes: string[] = [];
    const movements: Movement[] = [];

    if (c && !p) {
      add("joiner", c.gross);
      notes.push(emp?.startDate && emp.startDate >= current.period.start ? `Joined ${emp.startDate}` : `Not paid in ${previous.period.label}`);
      if (c.prorationFactor < 1) notes.push(`Paid ${Math.round(c.prorationFactor * 100)}% of the month`);
      movements.push({ code: "*", name: "Whole salary", reason: "joiner", kind: "joined", previous: 0, current: c.gross, change: round2(c.gross), source: sourceFor(id, "joiner", "*", undefined, undefined, emp) });
    } else if (p && !c) {
      add("leaver", -p.gross);
      notes.push(emp?.dateOfLeaving ? `Left ${emp.dateOfLeaving}` : `Not paid in ${current.period.label}`);
      movements.push({ code: "*", name: "Whole salary", reason: "leaver", kind: "left", previous: p.gross, current: 0, change: round2(-p.gross), source: sourceFor(id, "leaver", "*", undefined, undefined, emp) });
    } else if (c && p) {
      const prorationMoved = Math.abs(c.prorationFactor - p.prorationFactor) > 0.0001;
      const codes = new Set([...earnings(c).map((l) => l.code), ...earnings(p).map((l) => l.code)]);
      for (const code of codes) {
        const lc = earnings(c).filter((l) => l.code === code);
        const lp = earnings(p).filter((l) => l.code === code);
        const now = lc.reduce((s, l) => s + l.amount, 0);
        const was = lp.reduce((s, l) => s + l.amount, 0);
        const diff = now - was;
        if (Math.abs(diff) < 0.005) continue;
        const reason = reasonForLine(lc[0], lp[0], groupOf.get(code), prorationMoved, recurringOf(code));
        add(reason, diff);
        const kind: MovementKind = now < 0 || was < 0 ? "negative_earning" : !lp.length || Math.abs(was) < 0.005 ? "new_payment" : !lc.length || Math.abs(now) < 0.005 ? "not_repeated" : "amount_changed";
        const units = (ls: PayslipLine[]) => (ls.some((l) => l.units) ? ls.reduce((s, l) => s + (l.units ?? 0), 0) : undefined);
        movements.push({
          code,
          name: lc[0]?.name ?? lp[0]?.name ?? nameOf.get(code) ?? code,
          reason,
          kind,
          previous: round2(was),
          current: round2(now),
          change: round2(diff),
          previousUnits: units(lp),
          currentUnits: units(lc),
          source: sourceFor(id, reason, code, lc[0], lp[0], emp),
        });
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
      const ot = earnings(c).filter((l) => OVERTIME_GROUPS.has(groupOf.get(l.code) ?? ""));
      if (reasons.overtime && ot.length) notes.push(ot.map((l) => (l.units ? `${l.name} ${l.units}h` : l.name)).join(", "));
    }
    movements.sort((x, y) => Math.abs(y.change) - Math.abs(x.change));
    const change = round2((c?.gross ?? 0) - (p?.gross ?? 0));
    const department = emp?.departmentName ?? "Unassigned";
    employees.push({
      employeeId: id,
      name: emp?.fullName ?? id,
      employeeNumber: emp?.employeeNumber ?? id,
      department,
      costCentre: ctx.costCentres?.get(department) ?? "—",
      previousGross: p?.gross ?? null,
      currentGross: c?.gross ?? null,
      change,
      pct: p ? pctOf(p.gross, c?.gross ?? 0) : null,
      reasons,
      notes,
      previousNet: p?.net ?? null,
      currentNet: c?.net ?? null,
      movements,
      components: componentLines(componentsOf(p, groupOf, recurringOf), componentsOf(c, groupOf, recurringOf)),
      explanation: explainEmployee(change, movements, previous.period.label),
      unexplained: round2(movements.filter((m) => !m.source.confirmed).reduce((s, m) => s + m.change, 0)),
    });
  }
  employees.sort((x, y) => Math.abs(y.change) - Math.abs(x.change) || x.name.localeCompare(y.name));

  const bridge: BridgeStep[] = REASON_ORDER.map((reason) => ({
    reason,
    amount: round2(employees.reduce((s, e) => s + (e.reasons[reason] ?? 0), 0)),
    employees: employees.filter((e) => e.reasons[reason]).length,
    nature: REASON_NATURE[reason],
  })).filter((x) => x.employees > 0);

  // ── Company components & reconciliation ───────────────────────────────────
  const sumComponents = (m: Map<string, PayComputation>) => {
    const t = componentsOf(null, groupOf, recurringOf);
    for (const c of m.values()) {
      const x = componentsOf(c, groupOf, recurringOf);
      for (const k of Object.keys(t) as ComponentKey[]) t[k] += x[k];
    }
    return t;
  };
  const componentTotals = componentLines(sumComponents(prev), sumComponents(cur));

  const opening = round2([...prev.values()].reduce((s, c) => s + c.gross, 0));
  const closing = round2([...cur.values()].reduce((s, c) => s + c.gross, 0));
  const attributed = round2(bridge.reduce((s, x) => s + x.amount, 0));
  const unexplained = round2(employees.reduce((s, e) => s + e.unexplained, 0));
  const difference = round2(closing - opening - attributed);
  const reconciliation: Reconciliation = {
    opening,
    closing,
    change: round2(closing - opening),
    attributed,
    explained: round2(attributed - unexplained),
    unexplained,
    unexplainedEmployees: employees.filter((e) => Math.abs(e.unexplained) >= 0.005).length,
    balanced: Math.abs(difference) < 0.01,
    difference,
  };

  // ── Waterfall: opening → every reason → closing ───────────────────────────
  const waterfall: WaterfallStep[] = [{ key: "opening", label: `${previous.period.label}`, value: opening, start: 0, end: opening, type: "total" }];
  let level = opening;
  for (const s of bridge) {
    waterfall.push({ key: s.reason, label: REASON_LABELS[s.reason], value: s.amount, start: level, end: round2(level + s.amount), type: "step", reason: s.reason, employees: s.employees });
    level = round2(level + s.amount);
  }
  if (!reconciliation.balanced) {
    waterfall.push({ key: "difference", label: "Unreconciled difference", value: difference, start: level, end: round2(level + difference), type: "step" });
  }
  waterfall.push({ key: "closing", label: `${current.period.label}`, value: closing, start: 0, end: closing, type: "total" });

  const pick = (r: PayrollRun) => ({ id: r.id, title: r.title, period: r.period });
  return { current: pick(current), previous: pick(previous), totals, earnings: earningLines, componentTotals, bridge, waterfall, reconciliation, employees };
}

/** One movement as a clause: "the Leave Allowance paid in October did not recur". */
function movementClause(m: Movement, previousLabel: string): string {
  const amt = naira2(m.change);
  const units = (n?: number) => (n ? `${n} hrs` : "");
  if (!m.source.confirmed) return `${m.name.toLowerCase() === "whole salary" ? "pay" : m.name} moved by ${amt} — ${UNEXPLAINED_TEXT.toLowerCase()}`;
  switch (m.kind) {
    case "joined":
      return `they joined payroll this month (${m.source.detail})`;
    case "left":
      return `they left payroll (${m.source.detail})`;
    case "not_repeated":
      return m.reason === "overtime" ? `no overtime was paid this month (${units(m.previousUnits) || naira2(m.previous)} in ${previousLabel})` : `the ${m.name} paid in ${previousLabel} (${naira2(m.previous)}) did not recur`;
    case "new_payment":
      return m.reason === "overtime" ? `overtime${units(m.currentUnits) ? ` of ${units(m.currentUnits)}` : ""} was paid (${amt})` : `a ${m.name} of ${naira2(m.current)} was paid this month`;
    case "negative_earning":
      if (Math.abs(m.current) < 0.005) return `no unpaid leave or lateness deduction was made this month (${naira2(m.previous)} in ${previousLabel})`;
      if (Math.abs(m.previous) < 0.005) return `unpaid leave or lateness reduced pay by ${amt}`;
      return `unpaid leave and lateness deductions ${m.change > 0 ? "fell" : "rose"} by ${amt}`;
    default:
      if (m.reason === "salary_change") return `${m.name.toLowerCase()} was revised (${m.source.detail.replace(/^Salary revised /, "")})`;
      if (m.reason === "overtime" && m.previousUnits !== undefined && m.currentUnits !== undefined) return `overtime changed from ${m.previousUnits} to ${m.currentUnits} hrs`;
      if (m.reason === "proration") return `${m.name.toLowerCase()} was pro-rated for part of the month`;
      return `${m.name} changed by ${amt}`;
  }
}

/** "Gross pay decreased by ₦1,332,499.99 because the Leave Allowance paid in October 2026 did not recur." */
export function explainEmployee(change: number, movements: Movement[], previousLabel: string): string {
  if (Math.abs(change) < 0.005 || !movements.length) return "No change in gross pay.";
  const dir = change > 0 ? "increased" : "decreased";
  const main = movements.filter((m) => Math.sign(m.change) === Math.sign(change));
  const offsets = movements.filter((m) => Math.sign(m.change) !== Math.sign(change));
  const lead = (main.length ? main : movements).slice(0, 2).map((m) => movementClause(m, previousLabel));
  let s = `Gross pay ${dir} by ${naira2(change)} because ${lead.join(" and ")}`;
  if (main.length > 2) s += `, with ${main.length - 2} smaller movement${main.length - 2 === 1 ? "" : "s"}`;
  if (offsets.length) s += `; partly offset as ${movementClause(offsets[0], previousLabel)}`;
  return `${s}.`;
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
