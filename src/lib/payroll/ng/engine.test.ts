import { describe, expect, it } from "vitest";
import { computeEmployeePay, makePeriod, bandTax, splitSalary, prorationFactor, sumYtd } from "./engine";
import { NG_RATE_SET_2026, DEFAULT_PAYROLL_SETTINGS, resolveRateSet, NG_RATE_SETS } from "./rate-sets";
import { SEED_PAY_ELEMENTS, elementMap } from "../elements-seed";
import { amountInWords } from "../amount-in-words";
import { sha256Hex, verificationCodeFrom, canonicalJson } from "../hash";
import type { EmployeeTaxProfile, PeriodInput, SalaryStructure, YtdTotals } from "../types";

/**
 * Golden vectors for the Nigeria engine. The backend implementation must
 * reproduce these to the kobo.
 */

const elements = elementMap(SEED_PAY_ELEMENTS);
// The original golden vectors below were worked with NHF on basic and no group
// life; they stay pinned to that so they keep guarding that mode. The tenant
// defaults (NHF on gross, group life on) are covered by the calculator-parity
// block at the end.
const settings = { ...DEFAULT_PAYROLL_SETTINGS, nhfBasis: "basic" as const, groupLife: { enabled: false, ratePct: 0.6, basis: "gross" as const } };
const rateSet = NG_RATE_SET_2026;

const employee = {
  id: "E1",
  startDate: "2020-01-01",
  employmentTypeId: "ET-FT",
  weeklyHours: 40,
};

function structure(lines: Record<string, number>): SalaryStructure {
  return {
    id: "S1",
    employeeId: "E1",
    effectiveFrom: "2020-01-01",
    effectiveTo: null,
    currency: "NGN",
    lines: Object.entries(lines).map(([code, amount]) => ({ code, amount })),
    reason: "test",
    approvedBy: "test",
    approvedAt: "2020-01-01",
  };
}

function profile(over: Partial<EmployeeTaxProfile> = {}): EmployeeTaxProfile {
  return {
    employeeId: "E1",
    tin: "123",
    stateOfResidence: "Lagos",
    pfaCode: "PFA1",
    pfaName: "Test PFA",
    rsaPin: "PEN100",
    nhfNumber: "NHF1",
    nhfEligible: true,
    nhisEnrolled: false,
    annualRentDeclared: 0,
    rentEvidence: null,
    rentEvidenceVerified: false,
    lifeAssurancePremiumAnnual: 0,
    mortgageInterestAnnual: 0,
    bankName: "Bank",
    bankCode: "011",
    accountNumber: "0000000001",
    accountName: "Test",
    bvn: "1",
    ...over,
  };
}

const jan = makePeriod(2026, 1);
const line = (c: ReturnType<typeof computeEmployeePay>, code: string) =>
  c.lines.find((l) => l.code === code)?.amount ?? 0;

// The plan's worked example, corrected: pension on basic+housing+transport,
// NHF on basic only.
const WORKED = { BASIC: 150_000, HOUSING: 75_000, TRANSPORT: 30_000, OTHER_ALLOW: 45_000 };
const WORKED_PROFILE = profile({ annualRentDeclared: 600_000, rentEvidenceVerified: true, rentEvidence: { fileName: "lease.pdf", uploadedAt: "2026-01-01" } });

describe("NG engine — worked example (₦300k/month)", () => {
  const c = computeEmployeePay({
    period: jan,
    employee,
    structure: structure(WORKED),
    elements,
    inputs: [],
    profile: WORKED_PROFILE,
    rateSet,
    settings,
    ytd: null,
  });

  it("computes gross and statutory bases on the legal definitions", () => {
    expect(c.gross).toBe(300_000);
    expect(c.bases.pensionable).toBe(255_000);
    expect(c.bases.nhf).toBe(150_000);
    expect(line(c, "PENSION_EE")).toBe(20_400);
    expect(line(c, "NHF")).toBe(3_750);
  });

  it("applies reliefs then bands — annual chargeable ₦3,190,200, PAYE ₦30,353", () => {
    expect(c.tax.annualisedChargeable).toBe(3_190_200);
    expect(c.tax.annualisedTax).toBe(364_236);
    expect(line(c, "PAYE")).toBe(30_353);
  });

  it("nets to ₦245,497 with employer costs alongside", () => {
    expect(c.totalDeductions).toBe(54_503);
    expect(c.net).toBe(245_497);
    expect(line(c, "PENSION_ER")).toBe(25_500);
    expect(line(c, "NSITF")).toBe(3_000);
    expect(line(c, "ITF")).toBe(3_000);
  });

  it("tax table sums to the annualised tax", () => {
    expect(c.tax.bands.reduce((s, b) => s + b.tax, 0)).toBeCloseTo(c.tax.annualisedTax, 2);
  });
});

describe("cumulative method", () => {
  it("steady pay gives the same PAYE every month", () => {
    let ytd: YtdTotals | null = null;
    const payes: number[] = [];
    for (let m = 1; m <= 12; m++) {
      const c = computeEmployeePay({
        period: makePeriod(2026, m),
        employee,
        structure: structure(WORKED),
        elements,
        inputs: [],
        profile: WORKED_PROFILE,
        rateSet,
        settings,
        ytd,
      });
      payes.push(line(c, "PAYE"));
      ytd = c.ytd;
    }
    expect(new Set(payes)).toEqual(new Set([30_353]));
    expect(ytd!.paye).toBe(364_236);
  });

  it("taxes a bonus month at the marginal rate instead of annualising it", () => {
    const base = { period: makePeriod(2026, 1), employee, structure: structure(WORKED), elements, profile: WORKED_PROFILE, rateSet, settings };
    const m1 = computeEmployeePay({ ...base, inputs: [], ytd: null });
    const bonus: PeriodInput[] = [{ id: "b", employeeId: "E1", code: "PERFORMANCE_BONUS", amount: 1_000_000, source: "manual" }];
    const m2 = computeEmployeePay({ ...base, period: makePeriod(2026, 2), inputs: bonus, ytd: m1.ytd });
    const m2annualised = computeEmployeePay({
      ...base,
      period: makePeriod(2026, 2),
      inputs: bonus,
      ytd: m1.ytd,
      settings: { ...settings, taxMethod: "annualised" },
    });
    // Bonus taxed at the 18% marginal rate = ₦180,000 on top of the regular ₦30,353.
    expect(line(m2, "PAYE")).toBe(210_353);
    // Annualising the bonus month (×12) pushes it into the 21% band.
    expect(line(m2annualised, "PAYE")).toBeCloseTo(218_328.5, 2);
  });
});

describe("edge cases", () => {
  it("minimum-wage earner pays no PAYE", () => {
    const c = computeEmployeePay({ period: jan, employee, structure: structure({ BASIC: 70_000 }), elements, inputs: [], profile: profile(), rateSet, settings, ytd: null });
    expect(line(c, "PAYE")).toBe(0);
    expect(c.tax.exemptReason).toMatch(/minimum wage/);
    expect(line(c, "PENSION_EE")).toBe(5_600);
  });

  it("caps rent relief at ₦500,000 a year and ignores unverified evidence", () => {
    const big = computeEmployeePay({ period: jan, employee, structure: structure(WORKED), elements, inputs: [], profile: profile({ annualRentDeclared: 6_000_000, rentEvidenceVerified: true }), rateSet, settings, ytd: null });
    expect(big.tax.reliefs.find((r) => r.label.startsWith("Rent"))?.annual).toBe(500_000);
    const unverified = computeEmployeePay({ period: jan, employee, structure: structure(WORKED), elements, inputs: [], profile: profile({ annualRentDeclared: 600_000 }), rateSet, settings, ytd: null });
    expect(unverified.tax.reliefs.some((r) => r.label.startsWith("Rent"))).toBe(false);
  });

  it("top-band earner reaches 25%", () => {
    const c = computeEmployeePay({ period: jan, employee, structure: structure({ BASIC: 3_000_000, HOUSING: 1_500_000, TRANSPORT: 500_000, OTHER_ALLOW: 1_000_000 }), elements, inputs: [], profile: profile(), rateSet, settings, ytd: null });
    const top = c.tax.bands[c.tax.bands.length - 1];
    expect(top.rate).toBe(0.25);
    expect(top.taxable).toBeGreaterThan(0);
    // 800k@0 + 2.2m@15% + 9m@18% + 13m@21% + 25m@23% = ₦10,430,000 on the first ₦50m
    const chargeable = c.tax.annualisedChargeable;
    expect(c.tax.annualisedTax).toBeCloseTo(10_430_000 + (chargeable - 50_000_000) * 0.25, 2);
  });

  it("pro-rates a mid-month joiner by calendar days", () => {
    const joiner = { ...employee, startDate: "2026-04-16" };
    const april = makePeriod(2026, 4);
    expect(prorationFactor(april, joiner, "calendar_days")).toBeCloseTo(15 / 30, 6);
    const c = computeEmployeePay({ period: april, employee: joiner, structure: structure(WORKED), elements, inputs: [], profile: profile(), rateSet, settings, ytd: null });
    expect(c.gross).toBe(150_000);
  });

  it("pro-rates a leaver and pays nothing after leaving", () => {
    const leaver = { ...employee, dateOfLeaving: "2026-03-10" };
    expect(prorationFactor(makePeriod(2026, 3), leaver, "calendar_days")).toBeCloseTo(10 / 31, 6);
    expect(prorationFactor(makePeriod(2026, 4), leaver, "calendar_days")).toBe(0);
  });

  it("deducts loan instalments after tax", () => {
    const inputs: PeriodInput[] = [{ id: "l", employeeId: "E1", code: "STAFF_LOAN", amount: 50_000, source: "loan", description: "Instalment 2 of 6" }];
    const withLoan = computeEmployeePay({ period: jan, employee, structure: structure(WORKED), elements, inputs, profile: WORKED_PROFILE, rateSet, settings, ytd: null });
    expect(line(withLoan, "PAYE")).toBe(30_353);
    expect(withLoan.net).toBe(195_497);
    expect(withLoan.otherDeductions).toBe(50_000);
  });

  it("unpaid leave reduces earnings (gross, tax base, pension base, NSITF)", () => {
    const inputs: PeriodInput[] = [{ id: "u", employeeId: "E1", code: "UNPAID_LEAVE", units: 2, source: "attendance" }];
    const c = computeEmployeePay({ period: jan, employee, structure: structure(WORKED), elements, inputs, profile: WORKED_PROFILE, rateSet, settings, ytd: null });
    // Calendar-day basis: January has 31 days.
    const cut = (300_000 / 31) * 2;
    expect(line(c, "UNPAID_LEAVE")).toBeCloseTo(-cut, 2);
    expect(c.lines.find((l) => l.code === "UNPAID_LEAVE")?.category).toBe("earning");
    expect(c.gross).toBeCloseTo(300_000 - cut, 1);
    expect(c.bases.pensionable).toBeCloseTo(255_000 - (255_000 / 31) * 2, 2);
    expect(line(c, "NSITF")).toBeCloseTo((300_000 - cut) * 0.01, 1);
    expect(line(c, "PAYE")).toBeLessThan(30_353);
  });

  it("flags negative net pay instead of hiding it", () => {
    const inputs: PeriodInput[] = [{ id: "o", employeeId: "E1", code: "OVERPAYMENT", amount: 400_000, source: "manual" }];
    const c = computeEmployeePay({ period: jan, employee, structure: structure(WORKED), elements, inputs, profile: WORKED_PROFILE, rateSet, settings, ytd: null });
    expect(c.net).toBeLessThan(0);
  });

  it("pays overtime at the hourly rate × multiplier", () => {
    const inputs: PeriodInput[] = [{ id: "ot", employeeId: "E1", code: "OT_NORMAL", units: 10, source: "attendance" }];
    const c = computeEmployeePay({ period: jan, employee, structure: structure(WORKED), elements, inputs, profile: WORKED_PROFILE, rateSet, settings, ytd: null });
    const hourly = (150_000 * 12) / (52 * 40);
    expect(line(c, "OT_NORMAL")).toBeCloseTo(hourly * 1.5 * 10, 2);
  });

  it("puts freelancers on withholding tax, not PAYE or pension", () => {
    const c = computeEmployeePay({ period: jan, employee: { ...employee, employmentTypeId: "ET-FL" }, structure: structure(WORKED), elements, inputs: [], profile: profile(), rateSet, settings, ytd: null });
    expect(line(c, "PAYE")).toBe(0);
    expect(line(c, "PENSION_EE")).toBe(0);
    expect(line(c, "WHT")).toBe(15_000);
  });

  it("keeps uploaded statutory lines as given in manual mode", () => {
    const c = computeEmployeePay({
      period: jan,
      employee,
      structure: null,
      elements,
      inputs: [],
      profile: profile(),
      rateSet,
      settings,
      ytd: null,
      manual: {
        statutory: "as_uploaded",
        lines: [
          { code: "BASIC", name: "Basic Salary", category: "earning", group: "core", amount: 200_000, source: "manual", statutory: false, taxable: true },
          { code: "PAYE", name: "PAYE Tax", category: "deduction", group: "statutory", amount: 12_345, source: "manual", statutory: true, taxable: false },
        ],
      },
    });
    expect(line(c, "PAYE")).toBe(12_345);
    expect(c.net).toBe(187_655);
  });
});

describe("helpers", () => {
  it("bandTax sums correctly at a band edge", () => {
    expect(bandTax(3_000_000, rateSet.payeBands).total).toBe(330_000);
  });
  it("splits an annual salary so the lines sum exactly", () => {
    const lines = splitSalary(12_750_000, settings.defaultSplit);
    expect(lines.reduce((s, l) => s + l.amount, 0)).toBeCloseTo(1_062_500, 2);
  });
  it("resolves the rate set by period date", () => {
    expect(resolveRateSet(NG_RATE_SETS, "2026-06-01").id).toBe("NG-RS-2026-01");
  });
  it("writes amounts in words with kobo", () => {
    expect(amountInWords(245_497)).toBe("Two Hundred and Forty-Five Thousand, Four Hundred and Ninety-Seven Naira Only");
    expect(amountInWords(1_000_050.5)).toBe("One Million and Fifty Naira, Fifty Kobo Only");
  });
  it("hashes with standard SHA-256", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(canonicalJson({ b: 1, a: [2, { d: 3, c: 4 }] })).toBe('{"a":[2,{"c":4,"d":3}],"b":1}');
    expect(verificationCodeFrom(sha256Hex("x"))).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });
});

// ── Audit fixes: YTD as a sum, calendar tax months, cumulative reliefs ─────

describe("cumulative YTD across run types", () => {
  const base = { employee, structure: structure(WORKED), elements, profile: WORKED_PROFILE, rateSet, settings };
  /** Pays Jan..n regularly, returning the period rows (what final payslips store). */
  function regularRows(n: number) {
    const rows: ReturnType<typeof computeEmployeePay>["period"][] = [];
    for (let m = 1; m <= n; m++) {
      const c = computeEmployeePay({ ...base, period: makePeriod(2026, m), inputs: [], ytd: sumYtd(2026, rows) });
      rows.push(c.period);
    }
    return rows;
  }

  it("an off-cycle bonus in the same month is taxed at the marginal rate and adds no tax month", () => {
    const rows = regularRows(11);
    const bonus: PeriodInput[] = [{ id: "b", employeeId: "E1", code: "ANNUAL_BONUS", amount: 500_000, source: "manual" }];
    const oc = computeEmployeePay({ ...base, period: makePeriod(2026, 11), runType: "off_cycle", inputs: bonus, ytd: sumYtd(2026, rows) });
    expect(oc.gross).toBe(500_000);
    expect(oc.tax.reliefs.find((r) => r.label.startsWith("Rent"))?.period ?? 0).toBe(0);
    expect(line(oc, "PAYE")).toBe(90_000);
    rows.push(oc.period);
    const dec = computeEmployeePay({ ...base, period: makePeriod(2026, 12), inputs: [], ytd: sumYtd(2026, rows) });
    expect(dec.tax.monthOfYear).toBe(12);
    expect(dec.ytd.paye).toBeCloseTo(364_236 + 90_000, 1);
    expect(line(dec, "PAYE")).toBeCloseTo(30_353, 0);
  });

  it("the order payslips are issued in cannot change YTD", () => {
    const rows = regularRows(3);
    expect(sumYtd(2026, rows).paye).toBe(sumYtd(2026, [...rows].reverse()).paye);
  });

  it("an as-uploaded month still feeds chargeable income, so the next auto month is right", () => {
    const rows = regularRows(9);
    const mk = (code: string, amount: number, category: "earning" | "deduction") => ({
      code, name: code, category, group: category === "earning" ? ("core" as const) : ("statutory" as const), amount, source: "manual" as const, statutory: category === "deduction", taxable: category === "earning",
    });
    const uploadedOct = computeEmployeePay({
      ...base,
      period: makePeriod(2026, 10),
      structure: null,
      inputs: [],
      ytd: sumYtd(2026, rows),
      manual: {
        statutory: "as_uploaded",
        lines: [
          mk("BASIC", 150_000, "earning"),
          mk("HOUSING", 75_000, "earning"),
          mk("TRANSPORT", 30_000, "earning"),
          mk("OTHER_ALLOW", 45_000, "earning"),
          mk("PAYE", 30_353, "deduction"),
          mk("PENSION_EE", 20_400, "deduction"),
          mk("NHF", 3_750, "deduction"),
        ],
      },
    });
    expect(uploadedOct.tax.periodChargeable).toBe(265_850);
    expect(line(uploadedOct, "PENSION_ER")).toBe(25_500);
    rows.push(uploadedOct.period);
    const nov = computeEmployeePay({ ...base, period: makePeriod(2026, 11), inputs: [], ytd: sumYtd(2026, rows) });
    expect(line(nov, "PAYE")).toBe(30_353);
  });

  it("taxes a mid-year joiner on their actual annual liability", () => {
    const joiner = { ...employee, startDate: "2026-07-01" };
    const rows: ReturnType<typeof computeEmployeePay>["period"][] = [];
    for (let m = 7; m <= 12; m++) {
      const c = computeEmployeePay({ ...base, employee: joiner, period: makePeriod(2026, m), inputs: [], ytd: sumYtd(2026, rows) });
      rows.push(c.period);
    }
    const ytd = sumYtd(2026, rows);
    expect(ytd.paye).toBeCloseTo(bandTax(ytd.chargeable, rateSet.payeBands).total, 0);
  });

  it("refunds over-deducted tax when chargeable income falls", () => {
    const rows = regularRows(5);
    const longLeave: PeriodInput[] = [{ id: "u", employeeId: "E1", code: "UNPAID_LEAVE", units: 29, source: "attendance" }];
    const jun = computeEmployeePay({ ...base, period: makePeriod(2026, 6), inputs: longLeave, ytd: sumYtd(2026, rows) });
    expect(line(jun, "PAYE")).toBeLessThan(0);
    expect(jun.lines.find((l) => l.code === "PAYE")?.name).toBe("PAYE refund");
    const noRefund = computeEmployeePay({ ...base, settings: { ...settings, allowPayeRefunds: false }, period: makePeriod(2026, 6), inputs: longLeave, ytd: sumYtd(2026, rows) });
    expect(line(noRefund, "PAYE")).toBe(0);
  });

  it("catches up rent relief verified late in the year", () => {
    const unverified = profile({ annualRentDeclared: 600_000 });
    const rows: ReturnType<typeof computeEmployeePay>["period"][] = [];
    for (let m = 1; m <= 9; m++) {
      const c = computeEmployeePay({ ...base, profile: unverified, period: makePeriod(2026, m), inputs: [], ytd: sumYtd(2026, rows) });
      rows.push(c.period);
    }
    const oct = computeEmployeePay({ ...base, period: makePeriod(2026, 10), inputs: [], ytd: sumYtd(2026, rows) });
    const rent = oct.tax.reliefs.find((r) => r.label.startsWith("Rent"))!;
    expect(rent.period).toBe(100_000);
    expect(rent.toDate).toBe(100_000);
  });

  it("does not exempt a high earner who joins late in the month", () => {
    const lateJoiner = { ...employee, startDate: "2026-03-29" };
    const c = computeEmployeePay({ ...base, employee: lateJoiner, structure: structure({ BASIC: 600_000 }), period: makePeriod(2026, 3), inputs: [], ytd: null });
    expect(c.gross).toBeLessThan(70_000);
    expect(c.tax.exemptReason ?? "").not.toMatch(/minimum wage/);
  });

  it("uses the loss-of-office exemption once per termination", () => {
    const sev: PeriodInput[] = [{ id: "s", employeeId: "E1", code: "SEVERANCE", amount: 40_000_000, source: "manual" }];
    const a = computeEmployeePay({ ...base, period: makePeriod(2026, 3), runType: "off_cycle", inputs: sev, ytd: null });
    expect(a.period.lossOfOfficeExempt).toBe(40_000_000);
    const b = computeEmployeePay({ ...base, period: makePeriod(2026, 3), runType: "off_cycle", inputs: sev, ytd: sumYtd(2026, [a.period]) });
    expect(b.period.lossOfOfficeExempt).toBe(10_000_000);
  });

  it("pays overtime on an off-cycle run at the structure's hourly rate", () => {
    const c = computeEmployeePay({ ...base, period: makePeriod(2026, 3), runType: "off_cycle", inputs: [{ id: "o", employeeId: "E1", code: "OT_NORMAL", units: 10, source: "attendance" }], ytd: null });
    expect(line(c, "OT_NORMAL")).toBeCloseTo(((150_000 * 12) / (52 * 40)) * 1.5 * 10, 2);
    expect(line(c, "BASIC")).toBe(0);
  });
});

// Parity with the client-approved MOTEE salary calculator
// (motee-solutions/components/calculator/utils/tax-calculations.ts), using its
// template row EMP001 and the tenant defaults: NHF 2.5% of gross, group life
// 0.6% of 3× annual gross. Figures are the calculator's own output.
describe("matches the client-approved MOTEE calculator (default settings)", () => {
  const EMP001 = { BASIC: 150_000, HOUSING: 75_000, TRANSPORT: 45_000, UTILITY: 30_000 };
  const run = (over: Partial<typeof DEFAULT_PAYROLL_SETTINGS> = {}) =>
    computeEmployeePay({
      period: jan,
      employee,
      structure: structure(EMP001),
      elements,
      inputs: [],
      profile: profile({ annualRentDeclared: 600_000, rentEvidenceVerified: true }),
      rateSet,
      settings: { ...DEFAULT_PAYROLL_SETTINGS, ...over },
      ytd: null,
    });

  it("NHF on gross, PAYE, net pay and employer costs", () => {
    const c = run();
    expect(c.gross).toBe(300_000);
    expect(line(c, "PENSION_EE")).toBe(21_600);
    expect(line(c, "NHF")).toBe(7_500);
    expect(line(c, "PAYE")).toBe(29_462);
    expect(c.net).toBe(241_438);
    expect(line(c, "PENSION_ER")).toBe(27_000);
    expect(line(c, "NSITF")).toBe(3_000);
    expect(line(c, "ITF")).toBe(3_000);
    expect(line(c, "GROUP_LIFE")).toBe(5_400);
  });

  it("NHF on basic when the tenant chooses it", () => {
    const c = run({ nhfBasis: "basic" });
    expect(line(c, "NHF")).toBe(3_750);
    expect(line(c, "PAYE")).toBe(30_137);
    expect(c.net).toBe(244_513);
  });

  it("group life on BHT, and none when switched off", () => {
    expect(line(run({ groupLife: { enabled: true, ratePct: 0.6, basis: "bht" } }), "GROUP_LIFE")).toBe(4_860);
    expect(line(run({ groupLife: { enabled: false, ratePct: 0.6, basis: "gross" } }), "GROUP_LIFE")).toBe(0);
  });

  it("settings saved before NHF basis / group life existed use the calculator defaults", () => {
    const legacy = { ...DEFAULT_PAYROLL_SETTINGS };
    delete legacy.nhfBasis;
    delete legacy.groupLife;
    const c = computeEmployeePay({
      period: jan, employee, structure: structure(EMP001), elements, inputs: [],
      profile: profile({ annualRentDeclared: 600_000, rentEvidenceVerified: true }), rateSet, settings: legacy, ytd: null,
    });
    expect(line(c, "NHF")).toBe(7_500);
    expect(line(c, "GROUP_LIFE")).toBe(5_400);
  });
});

// ── Voluntary pension (AVC) from the employee profile ───────────────────────

describe("NG engine — voluntary pension contribution (AVC)", () => {
  const run = (avc: EmployeeTaxProfile["avc"], inputs: PeriodInput[] = [], runType?: "regular" | "off_cycle") =>
    computeEmployeePay({ period: jan, employee, structure: structure(WORKED), elements, inputs, profile: profile({ avc }), rateSet, settings, ytd: null, runType });
  const none = run(null);

  it("deducts a % of pensionable pay and relieves it from PAYE", () => {
    const c = run({ mode: "percent", value: 5 });
    expect(line(c, "VOL_PENSION")).toBe(12_750); // 5% of ₦255,000
    expect(c.tax.reliefs.find((r) => /voluntary/i.test(r.label))?.period).toBe(12_750);
    expect(line(c, "PAYE")).toBeLessThan(line(none, "PAYE"));
    expect(c.gross).toBe(none.gross);
    expect(Math.round((c.gross - c.totalDeductions) * 100) / 100).toBe(c.net);
    expect(c.net).toBeGreaterThan(none.net - 12_750); // the tax saving cushions the deduction
  });

  it("deducts a fixed monthly amount", () => {
    expect(line(run({ mode: "fixed", value: 25_000 }), "VOL_PENSION")).toBe(25_000);
  });

  it("respects the start and end dates", () => {
    expect(line(run({ mode: "fixed", value: 25_000, startDate: "2026-02-01" }), "VOL_PENSION")).toBe(0);
    expect(line(run({ mode: "fixed", value: 25_000, endDate: "2025-12-31" }), "VOL_PENSION")).toBe(0);
  });

  it("never doubles up with an AVC input, and skips off-cycle runs", () => {
    const input: PeriodInput = { id: "I1", employeeId: "E1", code: "VOL_PENSION", amount: 10_000, source: "manual" };
    expect(run({ mode: "fixed", value: 25_000 }, [input]).lines.filter((l) => l.code === "VOL_PENSION").map((l) => l.amount)).toEqual([10_000]);
    expect(line(run({ mode: "fixed", value: 25_000 }, [], "off_cycle"), "VOL_PENSION")).toBe(0);
  });
});
