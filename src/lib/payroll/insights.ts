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
  if (c.gross <= 0 || c.net < 0) return null;
  const tax = Math.max(0, c.lines.filter((l) => l.code === "PAYE" || l.code === "WHT").reduce((s, l) => s + l.amount, 0));
  const pension = c.lines.filter((l) => l.code === "PENSION_EE" || l.code === "VOL_PENSION").reduce((s, l) => s + l.amount, 0);
  const other = Math.max(0, c.gross - c.net - tax - pension);
  // Largest-remainder rounding so the four shares always add up to exactly 100.
  const parts = [c.net, tax, pension, other].map((v) => (v / c.gross) * 100);
  const floors = parts.map(Math.floor);
  let left = 100 - floors.reduce((s, v) => s + v, 0);
  const order = parts.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) if (left-- > 0) floors[i] += 1;
  const [keep, t, p, o] = floors;
  const bits = [`tax ₦${t}`, `pension ₦${p}`];
  if (o > 0) bits.push(`other ₦${o}`);
  return {
    type: "deduction_split",
    title: `You keep ${keep}% of your gross pay`,
    message: `Of every ₦100 you earned this month: ${bits.join(", ")} — and ₦${keep} is yours.`,
    tone: "neutral",
  };
}

export function taxProgressInsight(c: PayComputation): PayslipInsight | null {
  if (c.tax.regime !== "paye") return null;
  // Projection from tax due to date (cumulative), so one bonus month doesn't inflate it ×12.
  const month = Math.max(1, c.tax.monthOfYear);
  const projected = c.tax.taxDueToDate > 0 ? (c.tax.taxDueToDate * 12) / month : c.tax.annualisedTax;
  return {
    type: "tax_progress",
    title: "Tax-year progress",
    message:
      c.ytd.paye > 0
        ? `You've paid ${money(c.ytd.paye)} in PAYE so far in ${c.ytd.year}. At your pay so far this year, a full year's tax comes to about ${money(projected)}.`
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
  const days = `${leave.remaining} day${leave.remaining === 1 ? "" : "s"} of annual leave left`;
  return {
    type: "leave_nudge",
    title: "Annual leave",
    message:
      monthsLeft <= 0
        ? `You have ${days}, and the leave year ends this month.`
        : `You have ${days} with ${monthsLeft} month${monthsLeft === 1 ? "" : "s"} remaining in the leave year.`,
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
