import { describe, expect, it } from "vitest";
import { computeEmployeePay, makePeriod, bandTax, splitSalary, prorationFactor } from "./engine";
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
const settings = DEFAULT_PAYROLL_SETTINGS;
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

  it("unpaid leave reduces pay, the tax base and the pension base", () => {
    const inputs: PeriodInput[] = [{ id: "u", employeeId: "E1", code: "UNPAID_LEAVE", units: 2, source: "attendance" }];
    const c = computeEmployeePay({ period: jan, employee, structure: structure(WORKED), elements, inputs, profile: WORKED_PROFILE, rateSet, settings, ytd: null });
    // January 2026 has 22 working days.
    expect(line(c, "UNPAID_LEAVE")).toBeCloseTo((300_000 / 22) * 2, 2);
    expect(c.bases.pensionable).toBeCloseTo(255_000 - (255_000 / 22) * 2, 2);
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
