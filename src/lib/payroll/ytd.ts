import { round2, sumYtd } from "./ng/engine";
import type { PayrollRun, Payslip, PayslipLine, PeriodFigures, YtdTotals } from "./types";
import { structureOn, type TenantPayrollData } from "./run-builder";
import type { SalaryStructure } from "./types";

/**
 * Year to date, made traceable (client feedback A1, Nov 2026).
 *
 * YTD = the opening balance brought forward from the previous system + every
 * FINAL payslip in the tax year (regular, off-cycle and adjustment runs) up to
 * the period. Draft, cancelled and reversed-out runs never count — only final
 * payslips exist in `data.payslips` with status "final".
 *
 * The opening balance used to be one lump ("Jan–Jul brought forward"), so a
 * reviewer who expected 10 × the monthly salary couldn't see the leave
 * allowance, one-off payment and unpaid day sitting inside it. Opening months
 * now keep their own figures and lines (`openingMonths`), and every YTD figure
 * comes with the month-by-month rows behind it.
 */

/** One month brought forward from the previous payroll system. */
export interface OpeningMonth {
  figures: PeriodFigures;
  lines: PayslipLine[];
}

export type OpeningMonths = Record<string, OpeningMonth[]>;

export type YtdSource = "brought_forward" | "brought_forward_total" | "payslip";

export interface YtdVariation {
  code: string;
  label: string;
  /** Effect on gross pay (negative for unpaid leave / pro-ration). */
  amount: number;
  kind: "one_off" | "proration" | "change";
}

export interface YtdRow {
  key: string;
  month: number;
  /** "Apr 2026", or "Jan–Jul 2026" for a lump opening balance. */
  label: string;
  source: YtdSource;
  runId?: string;
  runType?: Payslip["runType"];
  reference?: string;
  payslipId?: string;
  gross: number;
  pensionEmployee: number;
  voluntaryPension: number;
  nhf: number;
  paye: number;
  pensionEmployer: number;
  totalDeductions: number;
  net: number;
  chargeable: number;
  reliefs: number;
  /** What made this month differ from the regular monthly salary. */
  variations: YtdVariation[];
}

export interface YtdBreakdown {
  year: number;
  uptoMonth: number;
  rows: YtdRow[];
  totals: Omit<YtdRow, "key" | "month" | "label" | "source" | "variations" | "runId" | "runType" | "reference" | "payslipId">;
  /** The regular monthly gross from the salary structure (latest month). */
  regularMonthlyGross: number;
  /** Months of regular pay included. */
  regularMonths: number;
  /** What a reviewer expects if nothing varied: months × the regular monthly gross. */
  expectedIfUnchanged: number;
  /** gross − expectedIfUnchanged, fully explained by the variations below when `explained`. */
  difference: number;
  variations: (YtdVariation & { month: number; monthLabel: string })[];
  explained: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const VOL = "Voluntary pension";

/** Recurring structure lines: the regular monthly pay. */
const REGULAR_GROUPS = new Set(["core", "allowances"]);

function rowFrom(
  key: string,
  label: string,
  source: YtdSource,
  f: Pick<PeriodFigures, "month" | "gross" | "pensionEmployee" | "nhf" | "paye" | "pensionEmployer" | "totalDeductions" | "net" | "chargeable" | "reliefs">,
  variations: YtdVariation[],
  extra: Partial<YtdRow> = {},
): YtdRow {
  return {
    key,
    month: f.month,
    label,
    source,
    gross: f.gross,
    pensionEmployee: f.pensionEmployee,
    voluntaryPension: f.reliefs?.[VOL] ?? 0,
    nhf: f.nhf,
    paye: f.paye,
    pensionEmployer: f.pensionEmployer,
    totalDeductions: f.totalDeductions,
    net: f.net,
    chargeable: f.chargeable,
    reliefs: Object.values(f.reliefs ?? {}).reduce((s, v) => s + v, 0),
    variations,
    ...extra,
  };
}

/**
 * Lines that aren't the regular monthly salary: one-offs (leave allowance,
 * bonus, one-off payments, arrears, overtime, commission) and regular lines
 * paid at less than the full amount (unpaid leave, pro-ration).
 */
export function variationsOf(lines: PayslipLine[], regular: Record<string, number>, runType: Payslip["runType"] = "regular"): YtdVariation[] {
  const out: YtdVariation[] = [];
  for (const l of lines) {
    if (l.category !== "earning" || Math.abs(l.amount) < 0.005) continue;
    const base = regular[l.code];
    if (runType === "regular" && base !== undefined && REGULAR_GROUPS.has(l.group)) {
      const d = round2(l.amount - base);
      if (Math.abs(d) >= 0.01) out.push({ code: l.code, label: `${l.name} ${d < 0 ? "reduced" : "increased"}`, amount: d, kind: d < 0 ? "proration" : "change" });
      continue;
    }
    // Negative earning lines (e.g. unpaid leave) are pro-ration of regular pay.
    out.push({ code: l.code, label: l.note ? `${l.name} — ${l.note}` : l.name, amount: round2(l.amount), kind: l.amount < 0 ? "proration" : "one_off" });
  }
  // Regular lines missing altogether (e.g. a full month of unpaid leave on that line).
  if (runType === "regular") {
    for (const [code, amount] of Object.entries(regular)) {
      if (!lines.some((l) => l.code === code && l.category === "earning")) out.push({ code, label: `${code} not paid`, amount: -amount, kind: "proration" });
    }
  }
  return out;
}

export interface YtdCtx {
  /** Regular monthly salary lines (code → amount) for the employee in a month. */
  regularFor: (month: number) => Record<string, number>;
}

/**
 * Every row behind an employee's YTD for `year` up to and including
 * `uptoMonth`. `excludeRunId` mirrors `ytdBefore` so a draft run's own figures
 * can be added on top by the caller.
 */
export function ytdBreakdown(
  data: Pick<TenantPayrollData, "payslips" | "openingYtd"> & { openingMonths?: OpeningMonths },
  employeeId: string,
  year: number,
  uptoMonth: number,
  ctx: YtdCtx,
  opts: { includePayslipId?: string; extra?: Payslip | null } = {},
): YtdBreakdown {
  const rows: YtdRow[] = [];
  const opening = data.openingYtd[employeeId];
  const months = data.openingMonths?.[employeeId]?.filter((m) => m.figures.year === year) ?? [];
  if (opening && opening.year === year) {
    if (months.length) {
      for (const m of months) {
        const f = m.figures;
        rows.push(rowFrom(`open-${f.month}`, `${MONTHS[f.month - 1]} ${year}`, "brought_forward", f, variationsOf(m.lines, ctx.regularFor(f.month))));
      }
    } else if (opening.months > 0 || opening.gross > 0) {
      // Imported balances arrive as one total — say so rather than invent months.
      rows.push(
        rowFrom(
          "open-total",
          opening.months > 0 ? `Jan–${MONTHS[opening.months - 1]} ${year}` : `Brought forward ${year}`,
          "brought_forward_total",
          { ...opening, month: opening.months || 0 },
          [],
        ),
      );
    }
  }
  const slips = data.payslips
    .filter((p) => p.employeeId === employeeId && p.status === "final" && p.period.year === year && p.period.month <= uptoMonth && p.computation.period)
    .concat(opts.extra && !data.payslips.some((p) => p.id === opts.extra!.id) ? [opts.extra] : [])
    .sort((a, b) => a.period.month - b.period.month || a.generatedAt.localeCompare(b.generatedAt));
  for (const p of slips) {
    const f = p.computation.period;
    const typeLabel = p.runType === "regular" ? "" : p.runType === "off_cycle" ? " · off-cycle" : " · adjustment";
    rows.push(
      rowFrom(`slip-${p.id}`, `${MONTHS[f.month - 1]} ${year}${typeLabel}`, "payslip", f, variationsOf(p.computation.lines, ctx.regularFor(f.month), p.runType), {
        runId: p.runId,
        runType: p.runType,
        reference: p.reference,
        payslipId: p.id,
      }),
    );
  }

  const sum = (k: keyof YtdBreakdown["totals"]) => round2(rows.reduce((s, r) => s + (r[k] as number), 0));
  const totals: YtdBreakdown["totals"] = {
    gross: sum("gross"),
    pensionEmployee: sum("pensionEmployee"),
    voluntaryPension: sum("voluntaryPension"),
    nhf: sum("nhf"),
    paye: sum("paye"),
    pensionEmployer: sum("pensionEmployer"),
    totalDeductions: sum("totalDeductions"),
    net: sum("net"),
    chargeable: sum("chargeable"),
    reliefs: sum("reliefs"),
  };
  const regularMonthlyGross = round2(Object.values(ctx.regularFor(uptoMonth)).reduce((s, v) => s + v, 0));
  const regularMonths = rows.reduce((n, r) => n + (r.source === "brought_forward_total" ? r.month : r.runType && r.runType !== "regular" ? 0 : 1), 0);
  // Months on different structures count at their own regular gross.
  const expectedIfUnchanged = round2(
    rows.reduce((s, r) => {
      if (r.source === "brought_forward_total") return s + r.gross;
      if (r.runType && r.runType !== "regular") return s;
      return s + Object.values(ctx.regularFor(r.month)).reduce((a, v) => a + v, 0);
    }, 0),
  );
  const variations = rows.flatMap((r) => r.variations.map((v) => ({ ...v, month: r.month, monthLabel: r.label })));
  const difference = round2(totals.gross - expectedIfUnchanged);
  const explainedBy = round2(variations.reduce((s, v) => s + v.amount, 0));
  return {
    year,
    uptoMonth,
    rows,
    totals,
    regularMonthlyGross,
    regularMonths,
    expectedIfUnchanged,
    difference,
    variations,
    explained: Math.abs(difference - explainedBy) < 1,
  };
}

export interface YtdIntegrityIssue {
  employeeId: string;
  field: "gross" | "paye" | "pensionEmployee" | "nhf" | "net";
  shown: number;
  recomputed: number;
}

/**
 * Re-adds YTD from source for every employee in a run and compares it with
 * the YTD the run will print. A mismatch means the run was calculated against
 * a different history (a payslip finalized or reversed since) — recalculate.
 */
export function ytdIntegrity(run: PayrollRun, data: Pick<TenantPayrollData, "payslips" | "openingYtd">): YtdIntegrityIssue[] {
  const issues: YtdIntegrityIssue[] = [];
  for (const re of run.employees) {
    const c = re.computation;
    if (!re.included || !c) continue;
    const rows = data.payslips
      .filter((p) => p.employeeId === re.employeeId && p.status === "final" && p.runId !== run.id && p.period.year === run.period.year && p.period.month <= run.period.month && p.computation.period)
      .map((p) => p.computation.period);
    const y: YtdTotals = sumYtd(run.period.year, [...rows, c.period], data.openingYtd[re.employeeId]);
    for (const field of ["gross", "paye", "pensionEmployee", "nhf", "net"] as const) {
      if (Math.abs(y[field] - c.ytd[field]) >= 0.01) issues.push({ employeeId: re.employeeId, field, shown: c.ytd[field], recomputed: y[field] });
    }
  }
  return issues;
}

/** Regular monthly salary lines from the structure in force at each month end. */
export function ytdCtxFor(structures: SalaryStructure[], employeeId: string, year: number): YtdCtx {
  return {
    regularFor: (month) => {
      const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
      const s = structureOn(structures, employeeId, end);
      return Object.fromEntries((s?.lines ?? []).map((l) => [l.code, l.amount]));
    },
  };
}
