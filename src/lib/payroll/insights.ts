import type { PayComputation, Payslip, PayslipInsight, PayslipLine } from "./types";
import { round2 } from "./ng/engine";

/**
 * The payslip's "intelligence panel" — deterministic rules over numbers the
 * payroll has already calculated. Generated ONCE when the payslip is made and
 * stored on it, so what the employee saw never silently changes later.
 * Deliberately nothing predictive and nothing framed as advice.
 */

const money = (n: number) =>
  `₦${Math.round(Math.abs(n)).toLocaleString("en-NG")}`;

function byCode(lines: PayslipLine[]): Map<string, { name: string; amount: number; category: string }> {
  const m = new Map<string, { name: string; amount: number; category: string }>();
  for (const l of lines) {
    if (l.category === "employer") continue;
    const k = `${l.category}:${l.code}`;
    const prev = m.get(k);
    m.set(k, { name: l.name, amount: (prev?.amount ?? 0) + l.amount, category: l.category });
  }
  return m;
}

export function netChangeInsight(
  current: PayComputation,
  previous: PayComputation | null,
): PayslipInsight | null {
  if (!previous) return null;
  const delta = round2(current.net - previous.net);
  if (Math.abs(delta) < 1) {
    return {
      type: "net_change",
      title: "Same as last month",
      message: `Your net pay is unchanged from last month at ${money(current.net)}.`,
      tone: "neutral",
    };
  }
  // Find the line whose change moved net pay the most (earnings +, deductions −).
  const now = byCode(current.lines);
  const before = byCode(previous.lines);
  const keys = new Set([...now.keys(), ...before.keys()]);
  let top: { key: string; name: string; category: string; effect: number } | null = null;
  for (const k of keys) {
    const a = now.get(k);
    const b = before.get(k);
    const change = (a?.amount ?? 0) - (b?.amount ?? 0);
    const ref = (a ?? b)!;
    const effect = ref.category === "earning" ? change : -change;
    if (!top || Math.abs(effect) > Math.abs(top.effect))
      top = { key: k, name: ref.name, category: ref.category, effect };
  }
  const direction = delta > 0 ? "higher" : "lower";
  let reason = "";
  if (top && Math.abs(top.effect) >= 1) {
    const what = top.name.toLowerCase();
    const isNew = now.has(top.key) && !before.has(top.key);
    const isGone = !now.has(top.key) && before.has(top.key);
    if (isNew) reason = `, mainly due to ${money(top.effect)} of ${what} this month`;
    else if (isGone) reason = `, mainly because last month's ${what} didn't recur`;
    else {
      const moved = top.category === "earning" ? (top.effect > 0 ? "higher" : "lower") : top.effect > 0 ? "lower" : "higher";
      reason = `, mainly due to ${moved} ${what}`;
    }
  }
  return {
    type: "net_change",
    title: `${money(delta)} ${direction} than last month`,
    message: `Your net pay is ${money(delta)} ${direction} than last month${reason}.`,
    tone: delta > 0 ? "positive" : "attention",
  };
}

export function deductionSplitInsight(c: PayComputation): PayslipInsight | null {
  if (!c.gross) return null;
  const pct = (n: number) => Math.round((n / c.gross) * 100);
  const tax = c.lines.filter((l) => l.code === "PAYE" || l.code === "WHT").reduce((s, l) => s + l.amount, 0);
  const pension = c.lines.filter((l) => l.code === "PENSION_EE" || l.code === "VOL_PENSION").reduce((s, l) => s + l.amount, 0);
  const other = c.totalDeductions - tax - pension;
  const parts = [`tax ${pct(tax)}%`, `pension ${pct(pension)}%`];
  if (other > 0) parts.push(`other ${pct(other)}%`);
  return {
    type: "deduction_split",
    title: `You keep ${pct(c.net)}% of your gross pay`,
    message: `Of every ₦100 you earned this month: ${parts.join(", ")} — and ₦${pct(c.net)} is yours.`,
    tone: "neutral",
  };
}

export function taxProgressInsight(c: PayComputation): PayslipInsight | null {
  if (c.tax.regime !== "paye") return null;
  const projected = c.tax.annualisedTax;
  return {
    type: "tax_progress",
    title: "Tax-year progress",
    message:
      c.ytd.paye > 0
        ? `You've paid ${money(c.ytd.paye)} in PAYE so far in ${c.ytd.year}. At this month's pay, your tax for a full year would be about ${money(projected)}.`
        : `You've paid no PAYE so far in ${c.ytd.year} — your chargeable income is within the tax-free band.`,
    tone: "neutral",
  };
}

export function pensionGrowthInsight(c: PayComputation, companyName: string): PayslipInsight | null {
  const ee = c.lines.filter((l) => l.code === "PENSION_EE" || l.code === "VOL_PENSION").reduce((s, l) => s + l.amount, 0);
  const er = c.lines.find((l) => l.code === "PENSION_ER")?.amount ?? 0;
  if (!ee && !er) return null;
  return {
    type: "pension_growth",
    title: `Your pension grew by ${money(ee + er)}`,
    message: `${money(ee)} from you and ${money(er)} from ${companyName} went to your RSA this month. Contributions this year: ${money(c.ytd.pensionEmployee + c.ytd.pensionEmployer)}.`,
    tone: "positive",
  };
}

export function leaveNudgeInsight(
  leave: Payslip["leave"],
  periodMonth: number,
): PayslipInsight | null {
  if (!leave) return null;
  const monthsLeft = 12 - periodMonth;
  return {
    type: "leave_nudge",
    title: "Annual leave",
    message: `You have ${leave.remaining} day${leave.remaining === 1 ? "" : "s"} of annual leave left with ${monthsLeft} month${monthsLeft === 1 ? "" : "s"} remaining in the leave year.`,
    tone: "neutral",
  };
}

export function buildInsights(args: {
  current: PayComputation;
  previous: PayComputation | null;
  leave: Payslip["leave"];
  periodMonth: number;
  companyName: string;
}): PayslipInsight[] {
  return [
    netChangeInsight(args.current, args.previous),
    deductionSplitInsight(args.current),
    taxProgressInsight(args.current),
    pensionGrowthInsight(args.current, args.companyName),
    leaveNudgeInsight(args.leave, args.periodMonth),
  ].filter((x): x is PayslipInsight => !!x);
}
