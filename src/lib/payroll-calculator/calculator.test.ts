import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { NIGERIA_TEMPLATE, nigeriaResults, parseNigeriaRow } from "./nigeria-bulk";
import { createRowReader, readSheetRows } from "./spreadsheet";
import { calculateSalary, DEFAULT_GROUP_LIFE_BASIS, DEFAULT_GROUP_LIFE_MONTHS_OF_COVER, DEFAULT_GROUP_LIFE_PREMIUM_RATE, type SalaryInputs } from "./tax-calculations";

/**
 * The dashboard Payroll Calculator runs the website calculator's own code.
 * These tests pin it to the figures the payroll engine's parity test uses
 * (src/lib/payroll/ng/engine.test.ts), so the calculator, the website and
 * payroll runs stay in agreement.
 */

const base: SalaryInputs = {
  basicSalary: 0,
  housingAllowance: 0,
  transportAllowance: 0,
  otherAllowances: 0,
  annualRentPaid: 0,
  annualMortgageInterest: 0,
  annualLifeInsurancePremium: 0,
  monthlyVoluntaryPension: 0,
  includeNHF: true,
  nhfBasis: "gross",
  includeNHIS: false,
  includeITF: true,
  groupLifePremiumRate: DEFAULT_GROUP_LIFE_PREMIUM_RATE,
  groupLifeMonthsOfCover: DEFAULT_GROUP_LIFE_MONTHS_OF_COVER,
  groupLifeBasis: DEFAULT_GROUP_LIFE_BASIS,
};
// Template row EMP001 with ₦600,000 rent — the payroll engine's parity case.
const EMP001: SalaryInputs = { ...base, basicSalary: 150_000, housingAllowance: 75_000, transportAllowance: 45_000, otherAllowances: 30_000, annualRentPaid: 600_000 };

describe("payroll calculator (ported from the website)", () => {
  it("matches the payroll engine to the kobo on the parity case", () => {
    const c = calculateSalary(EMP001);
    expect(c.monthlyGross).toBe(300_000);
    expect(c.employeePension).toBeCloseTo(21_600, 2);
    expect(c.nhf).toBeCloseTo(7_500, 2);
    expect(c.monthlyPAYE).toBeCloseTo(29_462, 2);
    expect(c.monthlyNetPay).toBeCloseTo(241_438, 2);
    expect(c.employerPension).toBeCloseTo(27_000, 2);
    expect(c.employerNSITF).toBeCloseTo(3_000, 2);
    expect(c.employerITF).toBeCloseTo(3_000, 2);
    expect(c.monthlyGroupLifePremium).toBeCloseTo(5_400, 2);
  });

  it("NHF on basic and group life on BHT match the engine too", () => {
    const basic = calculateSalary({ ...EMP001, nhfBasis: "basic" });
    expect(basic.nhf).toBeCloseTo(3_750, 2);
    expect(basic.monthlyPAYE).toBeCloseTo(30_137, 2);
    expect(basic.monthlyNetPay).toBeCloseTo(244_513, 2);
    expect(calculateSalary({ ...EMP001, groupLifeBasis: "bht" }).monthlyGroupLifePremium).toBeCloseTo(4_860, 2);
  });

  it("a zero salary gives zeros, not errors", () => {
    const c = calculateSalary(base);
    expect(c.monthlyNetPay).toBe(0);
    expect(c.annualPAYE).toBe(0);
    expect(c.effectiveTaxRate).toBe(0);
    expect(c.isMinimumTaxApplied).toBe(false);
  });

  it("the PAYE band breakdown adds up to annual PAYE, and rent relief is capped at ₦500,000", () => {
    const c = calculateSalary({ ...EMP001, basicSalary: 2_000_000, annualRentPaid: 10_000_000 });
    expect(c.taxBandBreakdown.reduce((s, b) => s + b.taxDue, 0)).toBeCloseTo(c.annualPAYE, 6);
    expect(c.rentRelief).toBe(500_000);
  });

  it("net pay is gross less every employee deduction; cost to company is gross plus employer contributions", () => {
    const c = calculateSalary({ ...EMP001, includeNHIS: true, monthlyVoluntaryPension: 20_000 });
    expect(c.monthlyNetPay).toBeCloseTo(c.monthlyGross - c.employeePension - c.voluntaryPension - c.nhf - c.employeeNHIS - c.monthlyPAYE, 6);
    expect(c.totalEmployerCost).toBeCloseTo(c.monthlyGross + c.employerPension + c.employerNHIS + c.employerNSITF + c.employerITF + c.monthlyGroupLifePremium, 6);
  });
});

describe("bulk spreadsheet", () => {
  // The template's sample rows, written to a workbook and read back as an upload would be.
  const headers = NIGERIA_TEMPLATE.columns.map((c) => c.header);
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...NIGERIA_TEMPLATE.rows.map((r) => headers.map((h) => r[h] ?? ""))]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Employee Salaries");
  const bytes = new Uint8Array(XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer);
  const parsed = readSheetRows(bytes).map((r) => parseNigeriaRow(createRowReader(r)));

  it("reads every template row back with its values", () => {
    expect(parsed).toHaveLength(NIGERIA_TEMPLATE.rows.length);
    NIGERIA_TEMPLATE.rows.forEach((row, i) => {
      expect(parsed[i].employeeId).toBe(row["Employee ID"]);
      expect(parsed[i].basicSalary).toBe(row["Basic Salary (Monthly)"]);
      expect(parsed[i].includeNHF).toBe(row["Include NHF"] === "Yes");
      expect(parsed[i].groupLifeBasis).toBe(row["Group Life Basis"] === "BHT" ? "bht" : "gross");
    });
  });

  it("the results workbook has one row per employee plus a TOTAL that adds up", () => {
    const res = nigeriaResults(parsed);
    const total = res.rows[res.rows.length - 1];
    expect(total["Employee ID"]).toBe("TOTAL");
    const net = parsed.reduce((s, e) => s + calculateSalary(e).monthlyNetPay, 0);
    expect(Number(total["Monthly Net Pay"])).toBeCloseTo(net, 6);
    expect(res.rows).toHaveLength(parsed.length + 1);
  });
});
