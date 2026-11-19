import type {
  EmploymentTypeRule,
  GroupLifeSettings,
  LeaveAllowancePolicy,
  NhfBasis,
  PayrollSettings,
  StatutoryRateSet,
} from "../types";
import { DEFAULT_ENABLED_GROUPS } from "../elements-seed";

/**
 * Nigeria statutory rate sets, effective-dated.
 *
 * The engine resolves the set from the PAY PERIOD's date, never today's,
 * so re-running or auditing an old period uses the rules then in force.
 * When the next Finance Act lands, add a new set with a new
 * `effectiveFrom` — no code change.
 *
 * ⚠ Figures below are from the Nigeria Tax Act 2025 as reported by
 * payroll-industry sources. Confirm against Nigeria Revenue Service (NRS)
 * guidance and a local accountant before go-live.
 */
export const NG_RATE_SET_2026: StatutoryRateSet = {
  id: "NG-RS-2026-01",
  country: "ng",
  label: "Nigeria Tax Act 2025 (from 1 Jan 2026)",
  effectiveFrom: "2026-01-01",
  legalBasis:
    "Nigeria Tax Act 2025; Pension Reform Act 2014; NHF Act; NHIA Act 2022; Employee's Compensation Act 2010; ITF (Amendment) Act 2011",
  payeBands: [
    { width: 800_000, rate: 0 },
    { width: 2_200_000, rate: 0.15 },
    { width: 9_000_000, rate: 0.18 },
    { width: 13_000_000, rate: 0.21 },
    { width: 25_000_000, rate: 0.23 },
    { width: null, rate: 0.25 },
  ],
  rentReliefRate: 0.2,
  rentReliefCap: 500_000,
  minimumWageMonthly: 70_000,
  employeePensionRate: 0.08,
  employerPensionRate: 0.1,
  pensionBaseCodes: ["BASIC", "CONSOLIDATED", "HOUSING", "TRANSPORT"],
  nhfRate: 0.025,
  nhfBaseCodes: ["BASIC", "CONSOLIDATED"],
  nhisEmployeeRate: 0.05,
  nhisEmployerRate: 0.1,
  nhisBaseCodes: ["BASIC", "CONSOLIDATED"],
  nsitfRate: 0.01,
  itfRate: 0.01,
  groupLifeMultiplier: 3,
  lossOfOfficeExemption: 50_000_000,
  whtRate: 0.05,
  createdBy: "System",
  createdAt: "2026-01-01",
};

export const NG_RATE_SETS: StatutoryRateSet[] = [NG_RATE_SET_2026];

/** The rate set in force on `date` (ISO). Falls back to the earliest set. */
export function resolveRateSet(
  sets: StatutoryRateSet[],
  date: string,
): StatutoryRateSet {
  const sorted = [...sets].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  let chosen = sorted[0];
  for (const s of sorted) if (s.effectiveFrom <= date) chosen = s;
  return chosen;
}

/** Band labels as printed: "First ₦800,000", "Next ₦2,200,000", "Above ₦50,000,000". */
export function bandLabel(index: number, bands: StatutoryRateSet["payeBands"], symbol = "₦"): string {
  const b = bands[index];
  if (b.width === null) {
    const floor = bands.slice(0, index).reduce((s, x) => s + (x.width ?? 0), 0);
    return `Above ${symbol}${floor.toLocaleString("en-NG")}`;
  }
  return `${index === 0 ? "First" : "Next"} ${symbol}${b.width.toLocaleString("en-NG")}`;
}

/**
 * Default treatment per employment type in the NG bundle. Fixed-term
 * "Contract" staff are employees and stay on PAYE; only the self-employed
 * are paid gross of PAYE with withholding tax.
 */
export const NG_EMPLOYMENT_TYPE_RULES: Record<string, EmploymentTypeRule> = {
  "ET-FT": { regime: "paye", pension: true, nhf: true },
  "ET-PT": { regime: "paye", pension: true, nhf: true },
  "ET-CT": { regime: "paye", pension: true, nhf: true },
  "ET-REM": { regime: "paye", pension: true, nhf: true },
  "ET-APP": { regime: "paye", pension: true, nhf: false },
  "ET-TEMP": { regime: "paye", pension: true, nhf: false },
  "ET-IN": { regime: "paye", pension: false, nhf: false },
  "ET-NYSC": { regime: "paye", pension: false, nhf: false },
  "ET-CAS": { regime: "paye", pension: false, nhf: false },
  "ET-SEA": { regime: "paye", pension: false, nhf: false },
  "ET-FL": { regime: "wht", pension: false, nhf: false },
};

/**
 * Defaults match the client-approved MOTEE salary calculator
 * (motee-solutions `tax-calculations.ts`): NHF on gross, group life at 0.6%
 * of 3× annual gross.
 */
export const DEFAULT_NHF_BASIS: NhfBasis = "gross";
export const DEFAULT_GROUP_LIFE: GroupLifeSettings = { enabled: true, ratePct: 0.6, basis: "gross" };

/** Matches what payroll did before the policy existed: 10% of annual basic in the anniversary month. */
export const DEFAULT_LEAVE_ALLOWANCE: LeaveAllowancePolicy = { mode: "anniversary", month: 12, ratePct: 10, basis: "basic", prorateFirstYear: false };

/** Settings saved before these fields existed fall back to the defaults. */
export const leaveAllowanceOf = (s: PayrollSettings): LeaveAllowancePolicy => ({ ...DEFAULT_LEAVE_ALLOWANCE, ...s.leaveAllowance });
export const nhfBasisOf = (s: PayrollSettings): NhfBasis => s.nhfBasis ?? DEFAULT_NHF_BASIS;
export const groupLifeOf = (s: PayrollSettings): GroupLifeSettings => ({ ...DEFAULT_GROUP_LIFE, ...s.groupLife });

export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  taxMethod: "cumulative",
  prorationBasis: "calendar_days",
  payDay: 25,
  inputCutoffDay: 18,
  nhisEnabled: false,
  nhfBasis: DEFAULT_NHF_BASIS,
  groupLife: DEFAULT_GROUP_LIFE,
  itfApplicable: true,
  deductLoansViaPayroll: true,
  payExpensesViaPayroll: true,
  varianceThresholdPct: 15,
  allowPayeRefunds: true,
  employeePreview: false,
  basicMin: 70_000,
  basicMax: 15_000_000,
  defaultSplit: [
    { code: "BASIC", pct: 50 },
    { code: "HOUSING", pct: 25 },
    { code: "TRANSPORT", pct: 10 },
    { code: "UTILITY", pct: 5 },
    { code: "MEAL", pct: 5 },
    { code: "COMMUNICATION", pct: 5 },
  ],
  employmentTypeRules: NG_EMPLOYMENT_TYPE_RULES,
  payslip: {
    showEmployerContributions: true,
    showTaxBreakdown: true,
    showLeaveBalance: true,
    insights: {
      net_change: true,
      tax_progress: true,
      deduction_split: true,
      pension_growth: true,
      leave_nudge: false,
    },
  },
  enabledGroups: DEFAULT_ENABLED_GROUPS,
  // Demo registrations — replace with the company's own in Payroll Settings.
  employerIds: {
    pencomEmployerCode: "PR0000184739",
    nsitfCode: "NSITF/LA/0042817",
    itfCode: "ITF/LAG/2023/0915",
    debitBankCode: "058",
    debitAccount: "0123456786",
    stateTaxIds: { Lagos: "LIRS-N-0184739", FCT: "FCT-IRS-77412", Kano: "KIRS-30918", Oyo: "OYIRS-11873", Enugu: "ESIRS-55120", Rivers: "RIRS-60334" },
  },
};

/** Rule for an employment type, defaulting to full PAYE treatment. */
export function ruleFor(
  settings: PayrollSettings,
  employmentTypeId: string,
): EmploymentTypeRule {
  return settings.employmentTypeRules[employmentTypeId] ?? { regime: "paye", pension: true, nhf: true };
}
