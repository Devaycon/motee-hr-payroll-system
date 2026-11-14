import type {
  EmployeeTaxProfile,
  PayComputation,
  PayElement,
  PayPeriod,
  PayrollRunType,
  PayrollSettings,
  PayslipLine,
  PeriodFigures,
  PeriodInput,
  SalaryStructure,
  StatutoryRateSet,
  TaxBand,
  TaxBandLine,
  TaxBreakdown,
  TaxRelief,
  YtdTotals,
} from "../types";
import { bandLabel, ruleFor } from "./rate-sets";

/**
 * Nigeria gross-to-net engine. Pure: same inputs, same payslip, every time —
 * which is what lets the backend port it and check itself against the
 * golden tests in `engine.test.ts`.
 *
 * Order of operations
 *   1. Pro-rate recurring pay for joiners/leavers.
 *   2. Period inputs: overtime, bonuses, loans, expenses. Unpaid leave and
 *      lateness REDUCE earnings (a negative earning line), so gross, NSITF,
 *      ITF and every schedule see the pay actually earned.
 *   3. Gross, then taxable gross (non-taxable reimbursements and the
 *      once-per-termination loss-of-office exemption left out).
 *   4. Statutory bases: pension on pensionable emoluments (basic + housing +
 *      transport), NHF and NHIA on basic.
 *   5. Reliefs. Contributions (pension, NHF, NHIA, voluntary pension) as
 *      actually deducted; annual reliefs (rent, life assurance, mortgage
 *      interest) given cumulatively — annual × month/12 less what's already
 *      been given — so off-cycle runs never double them and a late-verified
 *      rent declaration catches up. CRA is repealed from 1 Jan 2026.
 *   6. PAYE. Cumulative (default): tax on chargeable income to date with the
 *      bands scaled to the calendar month (month/12), less PAYE already
 *      deducted this year. Off-cycle and adjustment runs use the same month,
 *      so a bonus is taxed at the marginal rate and never adds a "13th"
 *      tax period. Over-deductions come back as a refund when allowed.
 *      Annualised: this month × 12 through the bands, ÷ 12 (regular runs).
 *   7. Other deductions, net pay, employer costs (pension, NHIA, NSITF, ITF).
 *
 * Year-to-date is the SUM of every final payslip's own period figures (see
 * `sumYtd`), never a chained snapshot, so the order runs are issued in can't
 * corrupt it.
 */

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface EngineEmployee {
  id: string;
  startDate: string;
  dateOfLeaving?: string | null;
  employmentTypeId: string;
  weeklyHours: number;
}

export interface ComputeArgs {
  period: PayPeriod;
  /** Regular runs pay the salary structure; off-cycle/adjustment runs pay inputs only. */
  runType?: PayrollRunType;
  employee: EngineEmployee;
  /** Always pass it — off-cycle runs use it for hourly and daily rates only. */
  structure: SalaryStructure | null;
  elements: Map<string, PayElement>;
  inputs: PeriodInput[];
  profile: EmployeeTaxProfile | null;
  rateSet: StatutoryRateSet;
  settings: PayrollSettings;
  /** Year to date BEFORE this payslip (sum of final payslips this tax year). */
  ytd: YtdTotals | null;
  /**
   * Manual pathway. `as_uploaded` takes every line as given (statutory too);
   * `recalculate` keeps the uploaded earnings/deductions and recomputes the
   * statutory lines from them.
   */
  manual?: { lines: PayslipLine[]; statutory: "as_uploaded" | "recalculate" };
}

const LOSS_OF_OFFICE_CODES = new Set(["GRATUITY", "REDUNDANCY", "SEVERANCE"]);
/** Relief labels — also the keys of `YtdTotals.reliefs`. */
export const RELIEF = {
  pension: "Pension contribution (8%)",
  nhf: "National Housing Fund (2.5%)",
  nhis: "Health insurance (NHIA)",
  vol: "Voluntary pension",
  rent: "Rent relief (20% of rent, max ₦500k)",
  life: "Life assurance premium",
  mortgage: "Mortgage interest (owner-occupied)",
} as const;

// ── Calendar helpers ────────────────────────────────────────────────────────

const toDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);
const DAY = 86_400_000;

export function daysBetweenInclusive(a: string, b: string): number {
  return Math.max(0, Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY) + 1);
}

export function workingDaysBetween(a: string, b: string): number {
  let n = 0;
  for (let t = toDate(a).getTime(); t <= toDate(b).getTime(); t += DAY) {
    const d = new Date(t).getUTCDay();
    if (d !== 0 && d !== 6) n++;
  }
  return n;
}

export function makePeriod(year: number, month: number, payDay = 25): PayPeriod {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  const day = Math.min(payDay, last);
  const payDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { year, month, label, start, end, payDate };
}

/** Share of the period the person was employed for (1 = whole period). */
export function prorationFactor(
  period: PayPeriod,
  employee: Pick<EngineEmployee, "startDate" | "dateOfLeaving">,
  basis: PayrollSettings["prorationBasis"],
): number {
  const from = employee.startDate > period.start ? employee.startDate : period.start;
  const leave = employee.dateOfLeaving ?? null;
  const to = leave && leave < period.end ? leave : period.end;
  if (from > to) return 0;
  const count = basis === "working_days" ? workingDaysBetween : daysBetweenInclusive;
  const total = count(period.start, period.end);
  return total ? Math.min(1, count(from, to) / total) : 0;
}

/** Days in the period on the tenant's proration basis — the divisor for a day's pay. */
export function periodDays(period: PayPeriod, basis: PayrollSettings["prorationBasis"]): number {
  return basis === "working_days" ? workingDaysBetween(period.start, period.end) : daysBetweenInclusive(period.start, period.end);
}

// ── Tax bands ───────────────────────────────────────────────────────────────

export function bandTax(
  income: number,
  bands: TaxBand[],
  scale = 1,
  symbol = "₦",
): { total: number; lines: TaxBandLine[] } {
  let remaining = Math.max(0, income);
  let total = 0;
  const lines: TaxBandLine[] = [];
  bands.forEach((b, i) => {
    const width = b.width === null ? Infinity : b.width * scale;
    const inBand = Math.min(remaining, width);
    const tax = inBand * b.rate;
    remaining -= inBand;
    total += tax;
    let label = bandLabel(i, bands, symbol);
    if (scale !== 1) {
      const floor = bands.slice(0, i).reduce((s, x) => s + (x.width ?? 0), 0) * scale;
      label =
        b.width === null
          ? `Above ${symbol}${Math.round(floor).toLocaleString("en-NG")}`
          : `${i === 0 ? "First" : "Next"} ${symbol}${Math.round(b.width * scale).toLocaleString("en-NG")}`;
    }
    lines.push({ label, rate: b.rate, taxable: inBand, tax });
  });
  return { total, lines };
}

// ── YTD ─────────────────────────────────────────────────────────────────────

export function emptyYtd(year: number): YtdTotals {
  return {
    year,
    months: 0,
    gross: 0,
    taxableGross: 0,
    chargeable: 0,
    paye: 0,
    pensionEmployee: 0,
    pensionEmployer: 0,
    nhf: 0,
    totalDeductions: 0,
    net: 0,
    reliefs: {},
    lossOfOfficeExempt: 0,
  };
}

/** Year to date = opening balance + the sum of each payslip's own period figures. */
export function sumYtd(year: number, rows: PeriodFigures[], opening?: YtdTotals | null): YtdTotals {
  const y: YtdTotals = opening && opening.year === year
    ? { ...emptyYtd(year), ...opening, reliefs: { ...(opening.reliefs ?? {}) }, lossOfOfficeExempt: opening.lossOfOfficeExempt ?? 0 }
    : emptyYtd(year);
  for (const r of rows) {
    if (r.year !== year) continue;
    if (r.regular) y.months = Math.max(y.months, r.month);
    y.gross += r.gross;
    y.taxableGross += r.taxableGross;
    y.chargeable += r.chargeable;
    y.paye += r.paye;
    y.pensionEmployee += r.pensionEmployee;
    y.pensionEmployer += r.pensionEmployer;
    y.nhf += r.nhf;
    y.totalDeductions += r.totalDeductions;
    y.net += r.net;
    y.lossOfOfficeExempt += r.lossOfOfficeExempt;
    for (const [k, v] of Object.entries(r.reliefs)) y.reliefs[k] = (y.reliefs[k] ?? 0) + v;
  }
  for (const k of ["gross", "taxableGross", "chargeable", "paye", "pensionEmployee", "pensionEmployer", "nhf", "totalDeductions", "net", "lossOfOfficeExempt"] as const)
    y[k] = round2(y[k]);
  for (const k of Object.keys(y.reliefs)) y.reliefs[k] = round2(y.reliefs[k]);
  return y;
}

// ── Engine ──────────────────────────────────────────────────────────────────

function lineFor(el: PayElement | undefined, code: string, amount: number, extra: Partial<PayslipLine> = {}): PayslipLine {
  return {
    code,
    name: el?.name ?? code,
    category: el?.category ?? "earning",
    group: el?.group ?? "corrections",
    amount: round2(amount),
    source: "auto",
    statutory: el?.statutory ?? false,
    taxable: el?.taxable ?? true,
    ...extra,
  };
}

const fmt = (n: number) => `₦${round2(n).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
const STATUTORY_DEDUCTION_CODES = new Set(["PAYE", "PENSION_EE", "NHF", "NHIS_EE", "WHT"]);

export function computeEmployeePay(args: ComputeArgs): PayComputation {
  const { period, employee, structure, elements, inputs, profile, rateSet, settings, manual } = args;
  const runType = args.runType ?? "regular";
  const regular = runType === "regular";
  const ytdBefore = args.ytd && args.ytd.year === period.year ? args.ytd : emptyYtd(period.year);
  const rule = ruleFor(settings, employee.employmentTypeId);
  const factor = prorationFactor(period, employee, settings.prorationBasis);
  const dayDivisor = periodDays(period, settings.prorationBasis);

  const lines: PayslipLine[] = [];
  /** Full-month recurring amounts — the basis for daily/hourly rates and the minimum-wage test. */
  const fullMonthly = new Map<string, number>();

  // 1 · Structure: full-month amounts always (rates), paid only on regular runs.
  if (structure) {
    const fixedRecurring = structure.lines.reduce((s, sl) => {
      const el = elements.get(sl.code);
      return el && el.calculationType === "fixed" ? s + sl.amount : s;
    }, 0);
    const basic = structure.lines.find((l) => l.code === "BASIC" || l.code === "CONSOLIDATED")?.amount ?? 0;
    for (const sl of structure.lines) {
      const el = elements.get(sl.code);
      if (!el || !el.active) continue;
      let monthly = sl.amount;
      if (el.calculationType === "percent_of_basic") monthly = (basic * sl.amount) / 100;
      if (el.calculationType === "percent_of_gross") monthly = (fixedRecurring * sl.amount) / 100;
      fullMonthly.set(sl.code, monthly);
      if (!regular || manual) continue;
      const amount = el.proratable ? monthly * factor : monthly;
      if (amount === 0) continue;
      lines.push(lineFor(el, sl.code, amount, factor < 1 && el.proratable ? { note: `Pro-rated ${Math.round(factor * 100)}% of period` } : {}));
    }
  }

  // 1b · Manual lines (uploaded): recognised by the element master, not the file's flags.
  if (manual) {
    for (const l of manual.lines) {
      const el = elements.get(l.code);
      const isStatutoryDeduction = STATUTORY_DEDUCTION_CODES.has(l.code) || (el?.statutory && el.category === "deduction");
      const isEmployer = l.category === "employer" || el?.category === "employer";
      if (isEmployer) continue; // employer costs are always computed
      if (manual.statutory === "recalculate" && isStatutoryDeduction) continue;
      lines.push({
        ...l,
        amount: round2(l.amount),
        category: el?.category ?? l.category,
        group: el?.group ?? l.group,
        statutory: !!isStatutoryDeduction,
        taxable: el?.taxable ?? l.taxable ?? true,
        source: "manual",
      });
      if ((el?.category ?? l.category) === "earning" && !structure) fullMonthly.set(l.code, (fullMonthly.get(l.code) ?? 0) + l.amount);
    }
  }

  const basicMonthly = fullMonthly.get("BASIC") ?? fullMonthly.get("CONSOLIDATED") ?? 0;
  const hourly = employee.weeklyHours > 0 ? (basicMonthly * 12) / (52 * employee.weeklyHours) : 0;

  // 2 · Period inputs
  let pensionableReduction = 0;
  let nhfBaseReduction = 0;
  let nhisBaseReduction = 0;
  for (const input of inputs) {
    const el = elements.get(input.code);
    if (!el) continue;
    // Unpaid leave / lateness: a reduction in earnings, not a deduction.
    if (el.preTax) {
      let amount = input.amount ?? 0;
      if (input.units && dayDivisor) {
        amount = 0;
        for (const [code, monthly] of fullMonthly) {
          const e = elements.get(code);
          if (!e?.proratable) continue;
          const cut = (monthly / dayDivisor) * input.units;
          amount += cut;
          if (e.pensionable) pensionableReduction += cut;
          if (rateSet.nhfBaseCodes.includes(code)) nhfBaseReduction += cut;
          if (rateSet.nhisBaseCodes.includes(code)) nhisBaseReduction += cut;
        }
      }
      if (!amount) continue;
      const days = input.units;
      lines.push({
        code: el.code,
        name: `Less: ${el.name.replace(/^Absence \/ /, "").toLowerCase()}${days ? ` (${days} day${days === 1 ? "" : "s"})` : ""}`,
        category: "earning",
        group: "core",
        amount: -round2(amount),
        source: input.source,
        statutory: false,
        taxable: true,
        units: days,
        note: input.description,
      });
      continue;
    }
    if (el.calculationType === "rate_x_units" && el.category === "earning") {
      const units = input.units ?? 0;
      const rate = hourly * (el.multiplier ?? 1);
      lines.push(lineFor(el, el.code, rate * units, { units, rate: round2(rate), source: input.source, note: input.description ?? `${units} hrs × ${fmt(rate)}` }));
      continue;
    }
    lines.push(
      lineFor(el, el.code, input.amount ?? 0, {
        source: input.source,
        note: input.description && input.description.toLowerCase() !== el.name.toLowerCase() && el.code !== "OTHER_DED" ? input.description : undefined,
        refId: input.refId,
        name: input.description && el.code === "OTHER_DED" ? input.description : el.name,
      }),
    );
  }

  // 3 · Gross & taxable gross
  const earnings = lines.filter((l) => l.category === "earning");
  const gross = round2(earnings.reduce((s, l) => s + l.amount, 0));
  const reimbursements = earnings.filter((l) => !l.taxable && l.group === "reimbursements").reduce((s, l) => s + l.amount, 0);
  /** Pay for statutory employer contributions and the minimum-wage test: excludes reimbursements. */
  const payrollGross = round2(gross - reimbursements);
  const lossOfOffice = earnings.filter((l) => LOSS_OF_OFFICE_CODES.has(l.code)).reduce((s, l) => s + l.amount, 0);
  const lossOfOfficeExempt = round2(Math.max(0, Math.min(lossOfOffice, rateSet.lossOfOfficeExemption - ytdBefore.lossOfOfficeExempt)));
  const taxableGross = round2(Math.max(0, earnings.filter((l) => l.taxable).reduce((s, l) => s + l.amount, 0) - lossOfOfficeExempt));

  // 4 · Statutory bases
  const sumBy = (pred: (l: PayslipLine) => boolean) => earnings.filter(pred).reduce((s, l) => s + l.amount, 0);
  const pensionable = round2(Math.max(0, sumBy((l) => l.amount > 0 && !!elements.get(l.code)?.pensionable) - pensionableReduction));
  const nhfBase = round2(Math.max(0, sumBy((l) => l.amount > 0 && rateSet.nhfBaseCodes.includes(l.code)) - nhfBaseReduction));
  const nhisBase = round2(Math.max(0, sumBy((l) => l.amount > 0 && rateSet.nhisBaseCodes.includes(l.code)) - nhisBaseReduction));

  const asUploaded = manual?.statutory === "as_uploaded";
  const uploaded = (code: string) => (asUploaded ? round2(lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0)) : 0);

  const statutory: PayslipLine[] = [];
  const employer: PayslipLine[] = [];
  const reliefs: TaxRelief[] = [];
  const periodReliefs: Record<string, number> = {};
  let paye = 0;
  let pensionEe = 0;
  let nhf = 0;
  let nhisEe = 0;

  const monthOfYear = period.month;
  const scale = monthOfYear / 12;
  const addRelief = (label: string, amount: number, annual: number) => {
    const a = round2(amount);
    periodReliefs[label] = a;
    reliefs.push({ label, period: a, toDate: round2((ytdBefore.reliefs[label] ?? 0) + a), annual: round2(annual) });
  };

  let breakdown: TaxBreakdown = {
    regime: rule.regime,
    method: settings.taxMethod,
    monthOfYear,
    periodTaxableGross: taxableGross,
    reliefs,
    periodChargeable: 0,
    annualisedChargeable: 0,
    bands: [],
    annualisedTax: 0,
    taxableToDate: round2(ytdBefore.taxableGross + taxableGross),
    cumulativeChargeable: ytdBefore.chargeable,
    bandsToDate: [],
    taxDueToDate: ytdBefore.paye,
    taxPaidBefore: ytdBefore.paye,
    taxThisPeriod: 0,
    effectiveRatePct: 0,
  };

  // Contributions (pension, NHF, NHIA) — computed for PAYE and exempt regimes alike.
  if (rule.regime !== "wht") {
    if (asUploaded) {
      pensionEe = uploaded("PENSION_EE");
      nhf = uploaded("NHF");
      nhisEe = uploaded("NHIS_EE");
    } else {
      pensionEe = rule.pension ? round2(pensionable * rateSet.employeePensionRate) : 0;
      nhf = rule.nhf && (profile?.nhfEligible ?? true) ? round2(nhfBase * rateSet.nhfRate) : 0;
      nhisEe = settings.nhisEnabled && profile?.nhisEnrolled ? round2(nhisBase * rateSet.nhisEmployeeRate) : 0;
      if (pensionEe)
        statutory.push(lineFor(elements.get("PENSION_EE"), "PENSION_EE", pensionEe, { note: `${rateSet.employeePensionRate * 100}% of ${fmt(pensionable)} pensionable pay` }));
      if (nhf) statutory.push(lineFor(elements.get("NHF"), "NHF", nhf, { note: `${rateSet.nhfRate * 100}% of ${fmt(nhfBase)} basic` }));
      if (nhisEe) statutory.push(lineFor(elements.get("NHIS_EE"), "NHIS_EE", nhisEe, { note: `${rateSet.nhisEmployeeRate * 100}% of basic` }));
    }
  }

  if (rule.regime === "wht") {
    const wht = asUploaded ? uploaded("WHT") : round2(payrollGross * rateSet.whtRate);
    if (wht && !asUploaded) statutory.push(lineFor(elements.get("WHT"), "WHT", wht, { note: `${rateSet.whtRate * 100}% of gross` }));
    breakdown = { ...breakdown, exemptReason: "Self-employed: withholding tax applies instead of PAYE." };
  } else if (rule.regime === "paye") {
    const volPension = lines.filter((l) => l.code === "VOL_PENSION").reduce((s, l) => s + l.amount, 0);
    if (pensionEe) addRelief(RELIEF.pension, pensionEe, pensionEe * 12);
    if (nhf) addRelief(RELIEF.nhf, nhf, nhf * 12);
    if (nhisEe) addRelief(RELIEF.nhis, nhisEe, nhisEe * 12);
    if (volPension) addRelief(RELIEF.vol, volPension, volPension * 12);

    // Annual reliefs, given cumulatively: entitled to annual × month/12 by now.
    const annualReliefs: [string, number][] = [
      [RELIEF.rent, profile && profile.rentEvidenceVerified && profile.annualRentDeclared > 0 ? Math.min(profile.annualRentDeclared * rateSet.rentReliefRate, rateSet.rentReliefCap) : 0],
      [RELIEF.life, profile?.lifeAssurancePremiumAnnual ?? 0],
      [RELIEF.mortgage, profile?.mortgageInterestAnnual ?? 0],
    ];
    for (const [label, annual] of annualReliefs) {
      if (!annual) continue;
      const give = Math.max(0, annual * scale - (ytdBefore.reliefs[label] ?? 0));
      if (give > 0 || (ytdBefore.reliefs[label] ?? 0) > 0) addRelief(label, give, annual);
    }

    const reliefTotal = Object.values(periodReliefs).reduce((s, v) => s + v, 0);
    const periodChargeable = round2(Math.max(0, taxableGross - reliefTotal));
    const annualisedChargeable = round2(periodChargeable * 12);
    const annual = bandTax(annualisedChargeable, rateSet.payeBands);
    const cumulativeChargeable = round2(ytdBefore.chargeable + periodChargeable);
    const toDate = bandTax(cumulativeChargeable, rateSet.payeBands, scale);

    // Minimum-wage exemption: on full-month recurring pay, regular runs only.
    const fullMonthPay = [...fullMonthly.values()].reduce((s, v) => s + v, 0);
    const minimumWageEarner = regular && fullMonthPay > 0 && fullMonthPay <= rateSet.minimumWageMonthly;

    let taxDueToDate: number;
    let taxThisPeriod: number;
    let exemptReason: string | undefined;
    if (asUploaded) {
      taxThisPeriod = uploaded("PAYE");
      taxDueToDate = round2(ytdBefore.paye + taxThisPeriod);
      exemptReason = "PAYE as uploaded — not recalculated by MOTEE.";
    } else if (minimumWageEarner) {
      taxThisPeriod = 0;
      taxDueToDate = ytdBefore.paye;
      exemptReason = `Pay at or below the national minimum wage (${fmt(rateSet.minimumWageMonthly)}/month) is exempt from PAYE.`;
    } else if (settings.taxMethod === "cumulative" || !regular) {
      taxDueToDate = round2(toDate.total);
      taxThisPeriod = round2(taxDueToDate - ytdBefore.paye);
      if (taxThisPeriod < 0 && !settings.allowPayeRefunds) taxThisPeriod = 0;
    } else {
      taxThisPeriod = round2(annual.total / 12);
      taxDueToDate = round2(ytdBefore.paye + taxThisPeriod);
    }
    if (!exemptReason && taxThisPeriod === 0 && periodChargeable > 0 && toDate.total === 0) exemptReason = "Chargeable income to date falls within the 0% band.";

    paye = taxThisPeriod;
    if (paye && !asUploaded)
      statutory.unshift(
        lineFor(elements.get("PAYE"), "PAYE", paye, {
          name: paye < 0 ? "PAYE refund" : "PAYE Tax",
          note: paye < 0 ? "Over-deducted earlier this year — returned to you" : `Tax month ${monthOfYear} · ${settings.taxMethod === "cumulative" || !regular ? "cumulative" : "annualised"}`,
        }),
      );

    breakdown = {
      ...breakdown,
      periodChargeable,
      annualisedChargeable,
      bands: annual.lines.map((b) => ({ ...b, taxable: round2(b.taxable), tax: round2(b.tax) })),
      annualisedTax: round2(annual.total),
      cumulativeChargeable,
      bandsToDate: toDate.lines.map((b) => ({ ...b, taxable: round2(b.taxable), tax: round2(b.tax) })),
      taxDueToDate,
      taxThisPeriod,
      effectiveRatePct: gross > 0 ? round2((paye / gross) * 100) : 0,
      exemptReason,
    };
  } else {
    breakdown = { ...breakdown, exemptReason: "Exempt from PAYE under the employee's tax profile." };
  }

  // 5 · Employer contributions — always computed by MOTEE, whatever the pathway.
  if (rule.regime !== "wht" && rule.pension && pensionable > 0) {
    const er = round2(pensionable * rateSet.employerPensionRate);
    if (er) employer.push(lineFor(elements.get("PENSION_ER"), "PENSION_ER", er, { note: `${rateSet.employerPensionRate * 100}% of pensionable pay` }));
  }
  if (settings.nhisEnabled && profile?.nhisEnrolled && rule.regime !== "wht") {
    const er = round2(nhisBase * rateSet.nhisEmployerRate);
    if (er) employer.push(lineFor(elements.get("NHIS_ER"), "NHIS_ER", er));
  }
  if (rule.regime !== "wht" && payrollGross > 0) {
    employer.push(lineFor(elements.get("NSITF"), "NSITF", payrollGross * rateSet.nsitfRate, { note: "1% of monthly payroll" }));
    if (settings.itfApplicable) employer.push(lineFor(elements.get("ITF"), "ITF", payrollGross * rateSet.itfRate, { note: "1% of payroll (accrued monthly)" }));
  }

  const allLines = [...lines.filter((l) => l.category !== "employer"), ...statutory, ...employer];
  const deductions = allLines.filter((l) => l.category === "deduction");
  const statutoryDeductions = round2(deductions.filter((l) => l.statutory || elements.get(l.code)?.group === "statutory").reduce((s, l) => s + l.amount, 0));
  const totalDeductions = round2(deductions.reduce((s, l) => s + l.amount, 0));
  const otherDeductions = round2(totalDeductions - statutoryDeductions);
  const net = round2(gross - totalDeductions);
  const employerCost = round2(employer.reduce((s, l) => s + l.amount, 0));
  const pensionEr = employer.find((l) => l.code === "PENSION_ER")?.amount ?? 0;

  const periodFigures: PeriodFigures = {
    year: period.year,
    month: period.month,
    regular,
    gross,
    taxableGross,
    chargeable: breakdown.periodChargeable,
    paye,
    pensionEmployee: pensionEe,
    pensionEmployer: pensionEr,
    nhf,
    totalDeductions,
    net,
    reliefs: periodReliefs,
    lossOfOfficeExempt,
  };

  return {
    lines: allLines,
    gross,
    taxableGross,
    statutoryDeductions,
    otherDeductions,
    totalDeductions,
    net,
    employerCost,
    bases: { pensionable, nhf: nhfBase, nhis: nhisBase },
    tax: breakdown,
    period: periodFigures,
    ytd: sumYtd(period.year, [periodFigures], ytdBefore),
    prorationFactor: round2(factor),
    rateSetId: rateSet.id,
  };
}

/** Annual salary → monthly structure lines using the tenant's default split. */
export function splitSalary(annual: number, split: PayrollSettings["defaultSplit"]): { code: string; amount: number }[] {
  const monthly = annual / 12;
  const lines = split.map((s) => ({ code: s.code, amount: round2((monthly * s.pct) / 100) }));
  // Put any rounding remainder on basic so the lines sum to the salary exactly.
  const diff = round2(monthly - lines.reduce((s, l) => s + l.amount, 0));
  if (diff && lines[0]) lines[0].amount = round2(lines[0].amount + diff);
  return lines;
}
