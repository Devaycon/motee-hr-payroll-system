/**
 * Ported unchanged from the MOTEE website calculator
 * (motee-solutions/components/calculator/utils/tax-calculations.ts) so the dashboard and the
 * website give the same figures to the kobo. Keep the two in sync: change the
 * website first, then copy the file here.
 */

export interface TaxBandBreakdown {
  band: string;
  taxableIncome: number;
  taxDue: number;
}

export function calculatePAYEWithBreakdown(taxableIncome: number): {
  totalTax: number;
  breakdown: TaxBandBreakdown[];
} {
  const bands = [
    { limit: 800000, rate: 0.0, label: "First ₦800,000 @ 0%" },
    { limit: 2200000, rate: 0.15, label: "Next ₦2,200,000 @ 15%" },
    { limit: 9000000, rate: 0.18, label: "Next ₦9,000,000 @ 18%" },
    { limit: 13000000, rate: 0.21, label: "Next ₦13,000,000 @ 21%" },
    { limit: 25000000, rate: 0.23, label: "Next ₦25,000,000 @ 23%" },
    { limit: Infinity, rate: 0.25, label: "Above ₦50,000,000 @ 25%" },
  ];

  let remainingIncome = taxableIncome;
  let totalTax = 0;
  const breakdown: TaxBandBreakdown[] = [];

  for (const band of bands) {
    const taxableInBand = Math.min(Math.max(0, remainingIncome), band.limit);
    const taxDue = taxableInBand * band.rate;
    totalTax += taxDue;

    breakdown.push({
      band: band.label,
      taxableIncome: taxableInBand,
      taxDue: taxDue,
    });

    remainingIncome -= taxableInBand;
    if (remainingIncome <= 0) break;
  }

  return { totalTax, breakdown };
}

export function calculatePAYE(taxableIncome: number): number {
  return calculatePAYEWithBreakdown(taxableIncome).totalTax;
}

export type NhfBasis = "gross" | "basic";
export const DEFAULT_NHF_BASIS: NhfBasis = "gross";

/** Base for the Group Life sum assured: annual gross, or annual BHT. */
export type GroupLifeBasis = "gross" | "bht";
export const DEFAULT_GROUP_LIFE_BASIS: GroupLifeBasis = "gross";

export interface SalaryInputs {
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  annualRentPaid: number;
  annualMortgageInterest: number;
  annualLifeInsurancePremium: number;
  /** Extra monthly RSA contribution on top of the mandatory 8% (PRA 2014 s.4(3)). */
  monthlyVoluntaryPension: number;
  includeNHF: boolean;
  /** Base for the 2.5% NHF deduction: monthly basic salary or monthly gross. */
  nhfBasis: NhfBasis;
  includeNHIS: boolean;
  includeITF: boolean;
  /** Insurer's premium rate as a percentage of sum assured, e.g. 0.6 for 0.6%. */
  groupLifePremiumRate: number;
  /** Months of cover in the policy year (12, or fewer for a mid-year joiner). */
  groupLifeMonthsOfCover: number;
  /** Base for the 3x Group Life sum assured: gross income or BHT. */
  groupLifeBasis: GroupLifeBasis;
}

export const DEFAULT_GROUP_LIFE_PREMIUM_RATE = 0.6;
export const DEFAULT_GROUP_LIFE_MONTHS_OF_COVER = 12;

export interface SalaryCalculations {
  monthlyGross: number;
  bht: number;
  employeePension: number;
  annualEmployeePension: number;
  voluntaryPension: number;
  annualVoluntaryPension: number;
  nhf: number;
  employeeNHIS: number;
  employerPension: number;
  employerNHIS: number;
  employerNSITF: number;
  employerITF: number;
  annualEmployerITF: number;
  monthlyGroupLifePremium: number;
  annualGroupLifePremium: number;
  groupLifeMinimumCover: number;
  /** Annual income the 3x sum assured is based on (gross or BHT). */
  groupLifeAnnualBase: number;
  totalEmployerContributions: number;
  annualGross: number;
  annualNHF: number;
  annualEmployeeNHIS: number;
  rentRelief: number;
  mortgageInterestRelief: number;
  lifeInsuranceRelief: number;
  totalAnnualRelief: number;
  annualTaxableIncome: number;
  annualPAYE: number;
  monthlyPAYE: number;
  totalMonthlyDeductions: number;
  monthlyNetPay: number;
  totalEmployerCost: number;
  annualEmployerCost: number;
  effectiveTaxRate: number;
  isMinimumTaxApplied: boolean;
  minimumTax: number;
  calculatedPAYE: number;
  taxBandBreakdown: TaxBandBreakdown[];
}

export function calculateSalary(inputs: SalaryInputs): SalaryCalculations {
  const {
    basicSalary,
    housingAllowance,
    transportAllowance,
    otherAllowances,
    annualRentPaid,
    annualMortgageInterest,
    annualLifeInsurancePremium,
    monthlyVoluntaryPension,
    includeNHF,
    nhfBasis,
    includeNHIS,
    includeITF,
    groupLifePremiumRate,
    groupLifeMonthsOfCover,
    groupLifeBasis,
  } = inputs;

  const monthlyGross =
    basicSalary + housingAllowance + transportAllowance + otherAllowances;
  const bht = basicSalary + housingAllowance + transportAllowance;

  const employeePension = bht * 0.08;
  const annualEmployeePension = employeePension * 12;

  // Voluntary contributions to the RSA (PRA 2014 s.4(3)) are deducted from
  // pay and, like the mandatory 8%, allowed as a relief from taxable income.
  const voluntaryPension = Math.max(monthlyVoluntaryPension || 0, 0);
  const annualVoluntaryPension = voluntaryPension * 12;

  // NHF is 2.5% of monthly income. The Business Facilitation (Misc.
  // Provisions) Act 2022 points to gross income, but many employers still
  // deduct on basic salary, so the user chooses the base.
  const nhfBase = nhfBasis === "basic" ? basicSalary : monthlyGross;
  const nhf = includeNHF ? nhfBase * 0.025 : 0;

  const employeeNHIS = includeNHIS ? basicSalary * 0.05 : 0;
  const employerNHIS = includeNHIS ? basicSalary * 0.1 : 0;

  const employerPension = bht * 0.1;

  const employerNSITF = monthlyGross * 0.01;

  // ITF is 1% of annual payroll, spread here as a monthly cost.
  const employerITF = includeITF ? monthlyGross * 0.01 : 0;
  const annualEmployerITF = employerITF * 12;

  const annualGross = monthlyGross * 12;

  // Pension Reform Act 2014 s.4(5): sum assured of at least 3x annual total
  // emolument. Employers differ on what counts as emolument, so the user
  // chooses the base: gross pay, or BHT (basic + housing + transport).
  // The employer's cost is the premium:
  //   annual premium = sum assured x premium rate
  // pro-rated by months of cover for staff joining mid-policy-year
  // (PenCom revised guidelines). Paid wholly by the employer.
  const groupLifeAnnualBase =
    (groupLifeBasis === "bht" ? bht : monthlyGross) * 12;
  const groupLifeMinimumCover = groupLifeAnnualBase * 3;
  const monthsOfCover = Math.min(Math.max(groupLifeMonthsOfCover || 0, 0), 12);
  const annualGroupLifePremium =
    groupLifeMinimumCover *
    (Math.max(groupLifePremiumRate || 0, 0) / 100) *
    (monthsOfCover / 12);
  const monthlyGroupLifePremium = annualGroupLifePremium / 12;
  const annualNHF = nhf * 12;
  const annualEmployeeNHIS = employeeNHIS * 12;

  const rentRelief = Math.min(annualRentPaid * 0.2, 500000);

  const mortgageInterestRelief = annualMortgageInterest;

  const lifeInsuranceRelief = annualLifeInsurancePremium;

  const totalAnnualRelief =
    annualEmployeePension +
    annualVoluntaryPension +
    annualNHF +
    annualEmployeeNHIS +
    rentRelief +
    mortgageInterestRelief +
    lifeInsuranceRelief;

  const annualTaxableIncome = Math.max(0, annualGross - totalAnnualRelief);

  const { totalTax: calculatedPAYE, breakdown: taxBandBreakdown } =
    calculatePAYEWithBreakdown(annualTaxableIncome);

  const minimumTax = annualGross * 0.01;
  const isMinimumTaxApplied =
    calculatedPAYE <= 0 && annualGross > 0 && annualTaxableIncome > 800000;

  const annualPAYE = isMinimumTaxApplied ? minimumTax : calculatedPAYE;

  const monthlyPAYE = annualPAYE / 12;

  const totalMonthlyDeductions =
    employeePension + voluntaryPension + nhf + employeeNHIS + monthlyPAYE;

  const monthlyNetPay = monthlyGross - totalMonthlyDeductions;

  const totalEmployerContributions =
    employerPension +
    employerNHIS +
    employerNSITF +
    employerITF +
    monthlyGroupLifePremium;
  const totalEmployerCost = monthlyGross + totalEmployerContributions;
  const annualEmployerCost = totalEmployerCost * 12;

  const effectiveTaxRate =
    monthlyGross > 0 ? (monthlyPAYE / monthlyGross) * 100 : 0;

  return {
    monthlyGross,
    bht,
    employeePension,
    annualEmployeePension,
    voluntaryPension,
    annualVoluntaryPension,
    nhf,
    employeeNHIS,
    employerPension,
    employerNHIS,
    employerNSITF,
    employerITF,
    annualEmployerITF,
    monthlyGroupLifePremium,
    annualGroupLifePremium,
    groupLifeMinimumCover,
    groupLifeAnnualBase,
    totalEmployerContributions,
    annualGross,
    annualNHF,
    annualEmployeeNHIS,
    rentRelief,
    mortgageInterestRelief,
    lifeInsuranceRelief,
    totalAnnualRelief,
    annualTaxableIncome,
    annualPAYE,
    monthlyPAYE,
    totalMonthlyDeductions,
    monthlyNetPay,
    totalEmployerCost,
    annualEmployerCost,
    effectiveTaxRate,
    isMinimumTaxApplied,
    minimumTax,
    calculatedPAYE,
    taxBandBreakdown,
  };
}