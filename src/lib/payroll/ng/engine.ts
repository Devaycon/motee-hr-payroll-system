import type {
  EmployeeTaxProfile,
  PayComputation,
  PayElement,
  PayPeriod,
  PayrollSettings,
  PayslipLine,
  PeriodInput,
  SalaryStructure,
  StatutoryRateSet,
  TaxBandLine,
  TaxBand,
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
 *   2. Add period inputs (overtime, bonuses, unpaid leave, loans, expenses).
 *   3. Gross, then taxable gross (less pre-tax deductions and exempt items).
 *   4. Statutory bases: pension on pensionable emoluments (basic + housing +
 *      transport), NHF and NHIS on basic.
 *   5. Reliefs: pension, NHF, NHIS, voluntary pension, life assurance,
 *      mortgage interest, Rent Relief (20% of rent, capped, evidence verified).
 *      The Consolidated Relief Allowance was repealed from 1 Jan 2026.
 *   6. PAYE on chargeable income through the bands.
 *        cumulative: tax due on pay to date, with the bands spread over the
 *        employee's pay periods so far, minus tax already deducted. Steady
 *        pay gives exactly the annual tax ÷ 12; a bonus month is taxed at the
 *        marginal rate instead of being annualised ×12.
 *        annualised: this month × 12 through the bands, ÷ 12.
 *   7. Other deductions, net pay, employer costs (pension, NSITF, ITF, NHIS).
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
  employee: EngineEmployee;
  structure: SalaryStructure | null;
  elements: Map<string, PayElement>;
  inputs: PeriodInput[];
  profile: EmployeeTaxProfile | null;
  rateSet: StatutoryRateSet;
  settings: PayrollSettings;
  /** Year-to-date totals BEFORE this period. Ignored if from another tax year. */
  ytd: YtdTotals | null;
  /**
   * Manual pathway. `as_uploaded` takes every line as given (statutory too);
   * `recalculate` keeps the uploaded earnings/deductions and recomputes the
   * statutory lines from them.
   */
  manual?: { lines: PayslipLine[]; statutory: "as_uploaded" | "recalculate" };
}

const LOSS_OF_OFFICE_CODES = new Set(["GRATUITY", "REDUNDANCY", "SEVERANCE"]);

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
    lines.push({ label: bandLabel(i, bands, symbol), rate: b.rate, taxable: inBand, tax });
  });
  return { total, lines };
}

// ── Engine ──────────────────────────────────────────────────────────────────

function emptyYtd(year: number): YtdTotals {
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
  };
}

function lineFor(
  el: PayElement | undefined,
  code: string,
  amount: number,
  extra: Partial<PayslipLine> = {},
): PayslipLine {
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

export function computeEmployeePay(args: ComputeArgs): PayComputation {
  const { period, employee, structure, elements, inputs, profile, rateSet, settings, manual } = args;
  const ytdBefore =
    args.ytd && args.ytd.year === period.year ? args.ytd : emptyYtd(period.year);
  const rule = ruleFor(settings, employee.employmentTypeId);
  const factor = prorationFactor(period, employee, settings.prorationBasis);
  const workingDays = workingDaysBetween(period.start, period.end);

  const lines: PayslipLine[] = [];
  /** Full-month recurring amounts, for daily/hourly rates. */
  const fullMonthly = new Map<string, number>();

  // 1 · Recurring pay from the structure (or uploaded earnings)
  if (manual) {
    const keep = manual.lines.filter((l) =>
      manual.statutory === "as_uploaded" ? true : !(l.statutory && l.category !== "earning"),
    );
    for (const l of keep) {
      const el = elements.get(l.code);
      lines.push({ ...l, source: "manual", taxable: l.taxable ?? el?.taxable ?? true });
      if (l.category === "earning") fullMonthly.set(l.code, (fullMonthly.get(l.code) ?? 0) + l.amount);
    }
  } else if (structure) {
    const basicLine = structure.lines.find((l) => l.code === "BASIC" || l.code === "CONSOLIDATED");
    const basic = basicLine?.amount ?? 0;
    for (const sl of structure.lines) {
      const el = elements.get(sl.code);
      if (!el || !el.active) continue;
      let monthly = sl.amount;
      if (el.calculationType === "percent_of_basic") monthly = (basic * sl.amount) / 100;
      fullMonthly.set(sl.code, monthly);
      const amount = el.proratable ? monthly * factor : monthly;
      if (amount === 0) continue;
      lines.push(
        lineFor(el, sl.code, amount, factor < 1 && el.proratable ? { note: `Pro-rated ${Math.round(factor * 100)}% of period` } : {}),
      );
    }
  }

  const basicMonthly = fullMonthly.get("BASIC") ?? fullMonthly.get("CONSOLIDATED") ?? 0;
  const hourly = employee.weeklyHours > 0 ? (basicMonthly * 12) / (52 * employee.weeklyHours) : 0;

  // 2 · Period inputs
  let pensionableReduction = 0;
  let nhfBaseReduction = 0;
  for (const input of inputs) {
    const el = elements.get(input.code);
    if (!el) continue;
    if (el.code === "UNPAID_LEAVE") {
      const days = input.units ?? 0;
      if (!days || !workingDays) continue;
      let total = 0;
      for (const [code, monthly] of fullMonthly) {
        const e = elements.get(code);
        if (!e?.proratable) continue;
        const cut = (monthly / workingDays) * days;
        total += cut;
        if (e.pensionable) pensionableReduction += cut;
        if (rateSet.nhfBaseCodes.includes(code)) nhfBaseReduction += cut;
      }
      lines.push(
        lineFor(el, el.code, total, {
          units: days,
          source: input.source,
          note: input.description ?? `${days} day${days === 1 ? "" : "s"} unpaid`,
        }),
      );
      continue;
    }
    if (el.calculationType === "rate_x_units" && el.category === "earning") {
      const units = input.units ?? 0;
      const rate = hourly * (el.multiplier ?? 1);
      lines.push(
        lineFor(el, el.code, rate * units, {
          units,
          rate: round2(rate),
          source: input.source,
          note: input.description ?? `${units} hrs × ${fmt(rate)}`,
        }),
      );
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
  const preTax = lines
    .filter((l) => l.category === "deduction" && elements.get(l.code)?.preTax)
    .reduce((s, l) => s + l.amount, 0);
  const lossOfOffice = earnings
    .filter((l) => LOSS_OF_OFFICE_CODES.has(l.code))
    .reduce((s, l) => s + l.amount, 0);
  const lossOfOfficeExempt = Math.min(lossOfOffice, rateSet.lossOfOfficeExemption);
  const taxableGross = round2(
    Math.max(
      0,
      earnings.filter((l) => l.taxable).reduce((s, l) => s + l.amount, 0) - preTax - lossOfOfficeExempt,
    ),
  );

  // 4 · Statutory bases
  const sumBy = (pred: (l: PayslipLine) => boolean) =>
    earnings.filter(pred).reduce((s, l) => s + l.amount, 0);
  const pensionable = round2(
    Math.max(0, sumBy((l) => !!elements.get(l.code)?.pensionable) - pensionableReduction),
  );
  const nhfBase = round2(Math.max(0, sumBy((l) => rateSet.nhfBaseCodes.includes(l.code)) - nhfBaseReduction));
  const nhisBase = round2(Math.max(0, sumBy((l) => rateSet.nhisBaseCodes.includes(l.code)) - nhfBaseReduction));

  const uploadedStatutory = (code: string) =>
    manual?.statutory === "as_uploaded"
      ? lines.find((l) => l.code === code)?.amount ?? 0
      : null;

  const statutory: PayslipLine[] = [];
  const employer: PayslipLine[] = [];
  const reliefs: TaxRelief[] = [];
  let paye = 0;
  let pensionEe = 0;
  let nhf = 0;
  let nhisEe = 0;

  const monthOfYear = ytdBefore.months + 1;
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
    cumulativeChargeable: ytdBefore.chargeable,
    taxDueToDate: ytdBefore.paye,
    taxPaidBefore: ytdBefore.paye,
    taxThisPeriod: 0,
    effectiveRatePct: 0,
  };

  if (manual?.statutory === "as_uploaded") {
    paye = uploadedStatutory("PAYE") ?? 0;
    pensionEe = uploadedStatutory("PENSION_EE") ?? 0;
    nhf = uploadedStatutory("NHF") ?? 0;
    breakdown = {
      ...breakdown,
      taxThisPeriod: paye,
      taxDueToDate: round2(ytdBefore.paye + paye),
      effectiveRatePct: gross ? round2((paye / gross) * 100) : 0,
      exemptReason: "Figures as uploaded — PAYE was not recalculated by MOTEE.",
    };
  } else if (rule.regime === "wht") {
    const wht = round2(gross * rateSet.whtRate);
    if (wht) statutory.push(lineFor(elements.get("WHT"), "WHT", wht, { note: `${rateSet.whtRate * 100}% of gross` }));
    breakdown = { ...breakdown, exemptReason: "Self-employed: withholding tax applies instead of PAYE." };
  } else if (rule.regime === "paye") {
    // Pension / NHF / NHIS
    pensionEe = rule.pension ? round2(pensionable * rateSet.employeePensionRate) : 0;
    nhf = rule.nhf && (profile?.nhfEligible ?? true) ? round2(nhfBase * rateSet.nhfRate) : 0;
    nhisEe = settings.nhisEnabled && profile?.nhisEnrolled ? round2(nhisBase * rateSet.nhisEmployeeRate) : 0;
    const volPension = lines.filter((l) => l.code === "VOL_PENSION").reduce((s, l) => s + l.amount, 0);

    if (pensionEe) {
      statutory.push(
        lineFor(elements.get("PENSION_EE"), "PENSION_EE", pensionEe, {
          note: `${rateSet.employeePensionRate * 100}% of ${fmt(pensionable)} pensionable pay`,
        }),
      );
      reliefs.push({ label: "Pension contribution (8%)", period: pensionEe, annual: pensionEe * 12 });
    }
    if (nhf) {
      statutory.push(
        lineFor(elements.get("NHF"), "NHF", nhf, { note: `${rateSet.nhfRate * 100}% of ${fmt(nhfBase)} basic` }),
      );
      reliefs.push({ label: "National Housing Fund (2.5%)", period: nhf, annual: nhf * 12 });
    }
    if (nhisEe) {
      statutory.push(lineFor(elements.get("NHIS_EE"), "NHIS_EE", nhisEe, { note: `${rateSet.nhisEmployeeRate * 100}% of basic` }));
      reliefs.push({ label: "Health insurance (NHIA)", period: nhisEe, annual: nhisEe * 12 });
    }
    if (volPension) reliefs.push({ label: "Voluntary pension", period: volPension, annual: volPension * 12 });

    const rentAnnual =
      profile && profile.rentEvidenceVerified && profile.annualRentDeclared > 0
        ? Math.min(profile.annualRentDeclared * rateSet.rentReliefRate, rateSet.rentReliefCap)
        : 0;
    if (rentAnnual) reliefs.push({ label: "Rent relief (20% of rent, max ₦500k)", period: rentAnnual / 12, annual: rentAnnual });
    if (profile?.lifeAssurancePremiumAnnual)
      reliefs.push({ label: "Life assurance premium", period: profile.lifeAssurancePremiumAnnual / 12, annual: profile.lifeAssurancePremiumAnnual });
    if (profile?.mortgageInterestAnnual)
      reliefs.push({ label: "Mortgage interest (owner-occupied)", period: profile.mortgageInterestAnnual / 12, annual: profile.mortgageInterestAnnual });
    const reliefTotal = reliefs.reduce((s, r) => s + r.period, 0);
    const periodChargeable = round2(Math.max(0, taxableGross - reliefTotal));
    const annualisedChargeable = round2(periodChargeable * 12);
    const annual = bandTax(annualisedChargeable, rateSet.payeBands);

    let taxThisPeriod: number;
    let taxDueToDate: number;
    let cumulativeChargeable = round2(ytdBefore.chargeable + periodChargeable);
    let exemptReason: string | undefined;

    if (gross > 0 && gross <= rateSet.minimumWageMonthly) {
      taxThisPeriod = 0;
      taxDueToDate = ytdBefore.paye;
      exemptReason = `Pay at or below the national minimum wage (${fmt(rateSet.minimumWageMonthly)}/month) is exempt from PAYE.`;
    } else if (settings.taxMethod === "cumulative") {
      const scale = monthOfYear / 12;
      const due = bandTax(cumulativeChargeable, rateSet.payeBands, scale).total;
      taxDueToDate = round2(due);
      taxThisPeriod = round2(Math.max(0, taxDueToDate - ytdBefore.paye));
    } else {
      taxThisPeriod = round2(annual.total / 12);
      taxDueToDate = round2(ytdBefore.paye + taxThisPeriod);
      cumulativeChargeable = round2(ytdBefore.chargeable + periodChargeable);
    }
    if (!exemptReason && taxThisPeriod === 0 && periodChargeable > 0 && annual.total === 0)
      exemptReason = "Chargeable income falls within the 0% band.";

    paye = taxThisPeriod;
    if (paye) statutory.unshift(lineFor(elements.get("PAYE"), "PAYE", paye, { note: `Tax month ${monthOfYear} · ${settings.taxMethod}` }));

    breakdown = {
      ...breakdown,
      periodChargeable,
      annualisedChargeable,
      bands: annual.lines.map((b) => ({ ...b, taxable: round2(b.taxable), tax: round2(b.tax) })),
      annualisedTax: round2(annual.total),
      cumulativeChargeable,
      taxDueToDate,
      taxThisPeriod,
      effectiveRatePct: gross ? round2((paye / gross) * 100) : 0,
      exemptReason,
      reliefs: reliefs.map((r) => ({ ...r, period: round2(r.period), annual: round2(r.annual) })),
    };
  } else {
    breakdown = { ...breakdown, exemptReason: "Exempt from PAYE under the employee's tax profile." };
  }

  // 5 · Employer contributions
  if (!manual || manual.statutory === "recalculate") {
    if (rule.regime === "paye" && rule.pension) {
      const er = round2(pensionable * rateSet.employerPensionRate);
      if (er) employer.push(lineFor(elements.get("PENSION_ER"), "PENSION_ER", er, { note: `${rateSet.employerPensionRate * 100}% of pensionable pay` }));
    }
    if (settings.nhisEnabled && profile?.nhisEnrolled && rule.regime === "paye") {
      const er = round2(nhisBase * rateSet.nhisEmployerRate);
      if (er) employer.push(lineFor(elements.get("NHIS_ER"), "NHIS_ER", er));
    }
    if (rule.regime !== "wht" && gross > 0) {
      employer.push(lineFor(elements.get("NSITF"), "NSITF", gross * rateSet.nsitfRate, { note: "1% of monthly payroll" }));
      if (settings.itfApplicable)
        employer.push(lineFor(elements.get("ITF"), "ITF", gross * rateSet.itfRate, { note: "1% of payroll (accrued monthly)" }));
    }
  } else {
    for (const l of lines.filter((x) => x.category === "employer")) employer.push(l);
  }

  // Assemble: uploaded-as-is lines already carry their own statutory rows.
  const allLines = [...lines.filter((l) => l.category !== "employer"), ...statutory, ...employer];

  const deductions = allLines.filter((l) => l.category === "deduction");
  const statutoryDeductions = round2(
    deductions.filter((l) => elements.get(l.code)?.group === "statutory" || l.statutory).reduce((s, l) => s + l.amount, 0),
  );
  const totalDeductions = round2(deductions.reduce((s, l) => s + l.amount, 0));
  const otherDeductions = round2(totalDeductions - statutoryDeductions);
  const net = round2(gross - totalDeductions);
  const employerCost = round2(employer.reduce((s, l) => s + l.amount, 0));
  const pensionEr = employer.find((l) => l.code === "PENSION_ER")?.amount ?? 0;

  const ytd: YtdTotals = {
    year: period.year,
    months: ytdBefore.months + 1,
    gross: round2(ytdBefore.gross + gross),
    taxableGross: round2(ytdBefore.taxableGross + taxableGross),
    chargeable: round2(ytdBefore.chargeable + breakdown.periodChargeable),
    paye: round2(ytdBefore.paye + paye),
    pensionEmployee: round2(ytdBefore.pensionEmployee + pensionEe),
    pensionEmployer: round2(ytdBefore.pensionEmployer + pensionEr),
    nhf: round2(ytdBefore.nhf + nhf),
    totalDeductions: round2(ytdBefore.totalDeductions + totalDeductions),
    net: round2(ytdBefore.net + net),
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
    ytd,
    prorationFactor: round2(factor),
    rateSetId: rateSet.id,
  };
}

/** Annual salary → monthly structure lines using the tenant's default split. */
export function splitSalary(
  annual: number,
  split: PayrollSettings["defaultSplit"],
): { code: string; amount: number }[] {
  const monthly = annual / 12;
  const lines = split.map((s) => ({ code: s.code, amount: round2((monthly * s.pct) / 100) }));
  // Put any rounding remainder on basic so the lines sum to the salary exactly.
  const diff = round2(monthly - lines.reduce((s, l) => s + l.amount, 0));
  if (diff && lines[0]) lines[0].amount = round2(lines[0].amount + diff);
  return lines;
}
