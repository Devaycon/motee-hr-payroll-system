/**
 * Ported unchanged from the MOTEE website calculator
 * (motee-solutions/components/calculator/utils/nigeria-bulk.ts) so the dashboard and the
 * website give the same figures to the kobo. Keep the two in sync: change the
 * website first, then copy the file here.
 */

import { RowReader, SheetColumn, SheetData, SheetRow } from "./spreadsheet";
import {
  calculateSalary,
  DEFAULT_GROUP_LIFE_BASIS,
  DEFAULT_GROUP_LIFE_MONTHS_OF_COVER,
  DEFAULT_GROUP_LIFE_PREMIUM_RATE,
  DEFAULT_NHF_BASIS,
  SalaryInputs,
} from "./tax-calculations";

export interface EmployeeData extends SalaryInputs {
  employeeId?: string;
}

const YES_NO = ["Yes", "No"];
const NHF_BASIS_OPTIONS = ["Gross", "Basic"];
const GROUP_LIFE_BASIS_OPTIONS = ["Gross", "BHT"];

export const NIGERIA_TEMPLATE: SheetData = {
  columns: [
    { header: "Employee ID" },
    { header: "Basic Salary (Monthly)", money: true },
    { header: "Housing Allowance (Monthly)", money: true },
    { header: "Transport Allowance (Monthly)", money: true },
    { header: "Other Allowances (Monthly)", money: true },
    { header: "Voluntary Pension (Monthly)", money: true },
    { header: "Annual Rent Paid", money: true },
    { header: "Annual Mortgage Interest", money: true },
    { header: "Annual Life Insurance Premium", money: true },
    { header: "Include NHF", options: YES_NO },
    { header: "NHF Basis", options: NHF_BASIS_OPTIONS },
    { header: "Include NHIS", options: YES_NO },
    { header: "Include ITF", options: YES_NO },
    { header: "Group Life Premium Rate (%)" },
    { header: "Group Life Months of Cover" },
    { header: "Group Life Basis", options: GROUP_LIFE_BASIS_OPTIONS },
  ],
  rows: [
    {
      "Employee ID": "EMP001",
      "Basic Salary (Monthly)": 150000,
      "Housing Allowance (Monthly)": 75000,
      "Transport Allowance (Monthly)": 45000,
      "Other Allowances (Monthly)": 30000,
      "Voluntary Pension (Monthly)": 0,
      "Annual Rent Paid": 600000,
      "Annual Mortgage Interest": 0,
      "Annual Life Insurance Premium": 0,
      "Include NHF": "Yes",
      "NHF Basis": "Gross",
      "Include NHIS": "Yes",
      "Include ITF": "Yes",
      "Group Life Premium Rate (%)": 0.6,
      "Group Life Months of Cover": 12,
      "Group Life Basis": "Gross",
    },
    {
      "Employee ID": "EMP002",
      "Basic Salary (Monthly)": 200000,
      "Housing Allowance (Monthly)": 100000,
      "Transport Allowance (Monthly)": 60000,
      "Other Allowances (Monthly)": 40000,
      "Voluntary Pension (Monthly)": 20000,
      "Annual Rent Paid": 800000,
      "Annual Mortgage Interest": 200000,
      "Annual Life Insurance Premium": 50000,
      "Include NHF": "Yes",
      "NHF Basis": "Gross",
      "Include NHIS": "Yes",
      "Include ITF": "Yes",
      "Group Life Premium Rate (%)": 0.6,
      "Group Life Months of Cover": 12,
      "Group Life Basis": "BHT",
    },
    {
      "Employee ID": "EMP003",
      "Basic Salary (Monthly)": 100000,
      "Housing Allowance (Monthly)": 50000,
      "Transport Allowance (Monthly)": 30000,
      "Other Allowances (Monthly)": 20000,
      "Voluntary Pension (Monthly)": 0,
      "Annual Rent Paid": 400000,
      "Annual Mortgage Interest": 0,
      "Annual Life Insurance Premium": 0,
      "Include NHF": "No",
      "NHF Basis": "Gross",
      "Include NHIS": "Yes",
      "Include ITF": "Yes",
      "Group Life Premium Rate (%)": 0.6,
      "Group Life Months of Cover": 12,
      "Group Life Basis": "Gross",
    },
  ],
};

export function parseNigeriaRow(row: RowReader): EmployeeData {
  return {
    employeeId: row.text(["employee id", "staff id"]),
    basicSalary: row.number(["basic salary", "basic"]),
    housingAllowance: row.number(["housing"]),
    transportAllowance: row.number(["transport"]),
    otherAllowances: row.number(["other allowances", "other"]),
    annualRentPaid: row.number(["annual rent", "rent paid"]),
    annualMortgageInterest: row.number(["mortgage"]),
    annualLifeInsurancePremium: row.number(["life insurance", "insurance"]),
    monthlyVoluntaryPension: row.number(["voluntary pension", "voluntary"]),
    includeNHF: row.bool(["include nhf", "nhf"]),
    nhfBasis: /basic/i.test(row.text(["nhf basis", "nhf base"]) ?? "")
      ? "basic"
      : DEFAULT_NHF_BASIS,
    includeNHIS: row.bool(["nhis"]),
    includeITF: row.bool(["itf"]),
    groupLifePremiumRate: row.number(
      ["group life premium rate", "premium rate", "group life rate"],
      DEFAULT_GROUP_LIFE_PREMIUM_RATE
    ),
    groupLifeMonthsOfCover: row.number(
      ["group life months of cover", "months of cover", "cover months"],
      DEFAULT_GROUP_LIFE_MONTHS_OF_COVER
    ),
    groupLifeBasis: /bht/i.test(
      row.text(["group life basis", "group life base"]) ?? ""
    )
      ? "bht"
      : DEFAULT_GROUP_LIFE_BASIS,
  };
}

const RESULT_COLUMNS: SheetColumn[] = [
  { header: "Employee ID" },
  { header: "Monthly Basic Salary", money: true },
  { header: "Monthly Housing Allowance", money: true },
  { header: "Monthly Transport Allowance", money: true },
  { header: "Monthly Other Allowances", money: true },
  { header: "Monthly Gross", money: true },
  { header: "Pension (8%)", money: true },
  { header: "Voluntary Pension", money: true },
  { header: "NHF", money: true },
  { header: "NHIS", money: true },
  { header: "PAYE", money: true },
  { header: "Total Deductions", money: true },
  { header: "Monthly Net Pay", money: true },
  { header: "Annual Gross", money: true },
  { header: "Annual Reliefs", money: true },
  { header: "Annual Taxable Income", money: true },
  { header: "Annual PAYE", money: true },
  { header: "Effective Tax Rate (%)", money: true },
  { header: "Employer Pension (10%)", money: true },
  { header: "Employer NHIS", money: true },
  { header: "NSITF (1%)", money: true },
  { header: "ITF (1%)", money: true },
  { header: "Group Life Premium", money: true },
  { header: "Total Employer Contributions", money: true },
  { header: "Monthly CTC", money: true },
  { header: "Annual CTC", money: true },
  { header: "Group Life Basis" },
  { header: "Group Life Sum Assured (3x)", money: true },
  { header: "Annual Group Life Premium", money: true },
  { header: "Notes" },
];

// Columns left out of the TOTAL row because a sum would mean nothing.
const UNSUMMED = new Set([
  "Employee ID",
  "Effective Tax Rate (%)",
  "Group Life Basis",
  "Notes",
]);

export function nigeriaResults(employees: EmployeeData[]): SheetData {
  const rows: SheetRow[] = employees.map((employee, i) => {
    const result = calculateSalary(employee);
    return {
      "Employee ID": employee.employeeId || `Employee ${i + 1}`,
      "Monthly Basic Salary": employee.basicSalary,
      "Monthly Housing Allowance": employee.housingAllowance,
      "Monthly Transport Allowance": employee.transportAllowance,
      "Monthly Other Allowances": employee.otherAllowances,
      "Monthly Gross": result.monthlyGross,
      "Pension (8%)": result.employeePension,
      "Voluntary Pension": result.voluntaryPension,
      NHF: result.nhf,
      NHIS: result.employeeNHIS,
      PAYE: result.monthlyPAYE,
      "Total Deductions": result.totalMonthlyDeductions,
      "Monthly Net Pay": result.monthlyNetPay,
      "Annual Gross": result.annualGross,
      "Annual Reliefs": result.totalAnnualRelief,
      "Annual Taxable Income": result.annualTaxableIncome,
      "Annual PAYE": result.annualPAYE,
      "Effective Tax Rate (%)": result.effectiveTaxRate,
      "Employer Pension (10%)": result.employerPension,
      "Employer NHIS": result.employerNHIS,
      "NSITF (1%)": result.employerNSITF,
      "ITF (1%)": result.employerITF,
      "Group Life Premium": result.monthlyGroupLifePremium,
      "Total Employer Contributions": result.totalEmployerContributions,
      "Monthly CTC": result.totalEmployerCost,
      "Annual CTC": result.annualEmployerCost,
      "Group Life Basis": employee.groupLifeBasis === "bht" ? "BHT" : "Gross",
      "Group Life Sum Assured (3x)": result.groupLifeMinimumCover,
      "Annual Group Life Premium": result.annualGroupLifePremium,
      Notes: result.isMinimumTaxApplied ? "Minimum tax (1% of gross) applied" : "",
    };
  });

  const total: SheetRow = { "Employee ID": "TOTAL" };
  for (const { header } of RESULT_COLUMNS) {
    if (UNSUMMED.has(header)) continue;
    total[header] = rows.reduce((sum, row) => sum + (Number(row[header]) || 0), 0);
  }
  const totalGross = Number(total["Monthly Gross"]);
  total["Effective Tax Rate (%)"] =
    totalGross > 0 ? (Number(total.PAYE) / totalGross) * 100 : 0;

  return { columns: RESULT_COLUMNS, rows: rows.length > 1 ? [...rows, total] : rows };
}
