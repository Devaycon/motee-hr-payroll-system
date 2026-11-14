/**
 * Payroll domain model (country-agnostic).
 *
 * Both input pathways — auto-calculation from the salary structure and manual
 * upload — normalise into `PayslipLine` rows. The payslip generator only ever
 * reads those rows, so it never knows (or cares) which pathway produced them.
 *
 * Statutory logic lives in a country module (`./ng` for Nigeria) behind the
 * same types, so UK payroll is a second module, not a rewrite.
 *
 * Every amount is in major units (₦), rounded to the kobo at line level.
 */

// ── Pay Element Master ──────────────────────────────────────────────────────

export type PayCategory = "earning" | "deduction" | "employer";

export type PayElementGroup =
  | "core"
  | "allowances"
  | "overtime"
  | "bonuses"
  | "manufacturing"
  | "annual"
  | "benefits_in_kind"
  | "termination"
  | "corrections"
  | "reimbursements"
  | "statutory"
  | "other_deductions"
  | "employer";

export type CalculationType =
  | "fixed"
  | "percent_of_basic"
  | "percent_of_gross"
  | "rate_x_units"
  | "formula"
  | "manual";

export interface PayElement {
  /** Stable identifier. Never rename once used — payslip history keys on it. */
  code: string;
  name: string;
  category: PayCategory;
  group: PayElementGroup;
  calculationType: CalculationType;
  /** Counts towards PAYE taxable income. */
  taxable: boolean;
  /** Counts towards pensionable emoluments (basic + housing + transport by law). */
  pensionable: boolean;
  /** Appears every period from the salary structure vs. one-off. */
  recurring: boolean;
  /** Pro-rated for mid-period joiners/leavers and unpaid leave. */
  proratable: boolean;
  /** System-owned statutory item — cannot be edited or disabled by a tenant. */
  statutory: boolean;
  active: boolean;
  /** Overtime multiplier for `rate_x_units` hourly elements (1.5×, 2×…). */
  multiplier?: number;
  /**
   * A deduction that reduces taxable pay before PAYE (unpaid leave, lateness).
   * Post-tax deductions (loans, union dues) leave the tax base alone.
   */
  preTax?: boolean;
  /** Added by the tenant rather than seeded. */
  custom?: boolean;
  description?: string;
}

// ── Salary structure (versioned) ────────────────────────────────────────────

export interface SalaryLine {
  code: string;
  /** Monthly amount for `fixed`; percentage (0–100) for `percent_of_*`. */
  amount: number;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  /** ISO date. A salary change is a new version, never an edit. */
  effectiveFrom: string;
  effectiveTo: string | null;
  currency: string;
  lines: SalaryLine[];
  reason: string;
  approvedBy: string;
  approvedAt: string;
}

// ── Employee tax & statutory profile ────────────────────────────────────────

export type TaxRegime = "paye" | "wht" | "exempt";

export interface EmployeeTaxProfile {
  employeeId: string;
  tin: string;
  /** State of residence — PAYE is remitted to that State IRS, not the employer's. */
  stateOfResidence: string;
  pfaCode: string;
  pfaName: string;
  rsaPin: string;
  nhfNumber: string;
  nhfEligible: boolean;
  nhisEnrolled: boolean;
  /** Annual rent paid — drives Rent Relief (20%, capped). */
  annualRentDeclared: number;
  rentEvidence: { fileName: string; uploadedAt: string } | null;
  /** HR has checked the tenancy agreement / receipt. Relief applies only when true. */
  rentEvidenceVerified: boolean;
  lifeAssurancePremiumAnnual: number;
  mortgageInterestAnnual: number;
  bankName: string;
  /** NIBSS / CBN bank code — needed for the bulk payment file. */
  bankCode: string;
  accountNumber: string;
  accountName: string;
  bvn: string;
}

// ── Statutory rate set (versioned, effective-dated) ─────────────────────────

export interface TaxBand {
  /** Width of the band in annual income; `null` = everything above. */
  width: number | null;
  rate: number;
}

export interface StatutoryRateSet {
  id: string;
  country: "ng";
  label: string;
  /** The rate set in force for a pay period is chosen by the period's date. */
  effectiveFrom: string;
  legalBasis: string;
  payeBands: TaxBand[];
  rentReliefRate: number;
  rentReliefCap: number;
  /** Monthly national minimum wage — earners at or below it pay no PAYE. */
  minimumWageMonthly: number;
  employeePensionRate: number;
  employerPensionRate: number;
  /** Element codes whose sum is the pension base (pensionable emoluments). */
  pensionBaseCodes: string[];
  nhfRate: number;
  nhfBaseCodes: string[];
  nhisEmployeeRate: number;
  nhisEmployerRate: number;
  nhisBaseCodes: string[];
  nsitfRate: number;
  itfRate: number;
  /** Group Life cover as a multiple of annual total emoluments. */
  groupLifeMultiplier: number;
  /** Compensation for loss of office exempt up to this amount. */
  lossOfOfficeExemption: number;
  /** Withholding tax on payments to self-employed / freelance individuals. */
  whtRate: number;
  createdBy: string;
  createdAt: string;
}

// ── Payroll settings (per tenant) ───────────────────────────────────────────

export type TaxMethod = "cumulative" | "annualised";
export type ProrationBasis = "calendar_days" | "working_days";

export interface EmploymentTypeRule {
  regime: TaxRegime;
  pension: boolean;
  nhf: boolean;
  /** Left out of payroll entirely (paid elsewhere). */
  excluded?: boolean;
}

export interface PayslipDisplayOptions {
  showEmployerContributions: boolean;
  showTaxBreakdown: boolean;
  showLeaveBalance: boolean;
  insights: Record<InsightType, boolean>;
}

export interface PayrollSettings {
  taxMethod: TaxMethod;
  prorationBasis: ProrationBasis;
  /** Pay day of month (clamped to month end). */
  payDay: number;
  /** Day of month after which inputs for the period are locked. */
  inputCutoffDay: number;
  nhisEnabled: boolean;
  /** ITF applies to employers with 5+ staff or ≥ ₦50m turnover. */
  itfApplicable: boolean;
  deductLoansViaPayroll: boolean;
  payExpensesViaPayroll: boolean;
  /** Flag an employee whose net pay moves more than this % month on month. */
  varianceThresholdPct: number;
  /** Sanity range for basic salary (monthly). */
  basicMin: number;
  basicMax: number;
  /** Default split of an annual salary into structure lines, in % of gross. */
  defaultSplit: { code: string; pct: number }[];
  employmentTypeRules: Record<string, EmploymentTypeRule>;
  payslip: PayslipDisplayOptions;
  /** Enabled element groups — a services company switches manufacturing off. */
  enabledGroups: PayElementGroup[];
}

// ── Period inputs ───────────────────────────────────────────────────────────

export type LineSource = "auto" | "manual" | "attendance" | "loan" | "expense" | "adjustment";

/** A one-period input: overtime hours, a bonus, unpaid days, a deduction. */
export interface PeriodInput {
  id: string;
  employeeId: string;
  code: string;
  /** Fixed amount, when the element is amount-driven. */
  amount?: number;
  /** Hours (overtime) or days (unpaid leave, lateness). */
  units?: number;
  description?: string;
  source: LineSource;
  /** Reference back to the module record (loan id, expense id). */
  refId?: string;
}

// ── Calculation output ──────────────────────────────────────────────────────

export interface PayslipLine {
  code: string;
  name: string;
  category: PayCategory;
  group: PayElementGroup;
  amount: number;
  source: LineSource;
  statutory: boolean;
  taxable: boolean;
  units?: number;
  rate?: number;
  /** Extra context for the payslip, e.g. "Instalment 3 of 6 · ₦120,000 left". */
  note?: string;
  refId?: string;
}

export interface TaxRelief {
  label: string;
  /** Amount relieved this period. */
  period: number;
  /** The same relief on an annual basis, for the "how your tax was calculated" view. */
  annual: number;
}

export interface TaxBandLine {
  label: string;
  rate: number;
  /** Annual income falling in this band (annualised view). */
  taxable: number;
  tax: number;
}

export interface TaxBreakdown {
  regime: TaxRegime;
  method: TaxMethod;
  /** 1–12: month of the tax year (calendar year in Nigeria). */
  monthOfYear: number;
  periodTaxableGross: number;
  reliefs: TaxRelief[];
  periodChargeable: number;
  /** Chargeable income for the year at this month's rate (chargeable × 12). */
  annualisedChargeable: number;
  bands: TaxBandLine[];
  annualisedTax: number;
  cumulativeChargeable: number;
  taxDueToDate: number;
  taxPaidBefore: number;
  taxThisPeriod: number;
  effectiveRatePct: number;
  /** Why no PAYE was charged, when none was. */
  exemptReason?: string;
}

export interface YtdTotals {
  year: number;
  months: number;
  gross: number;
  taxableGross: number;
  chargeable: number;
  paye: number;
  pensionEmployee: number;
  pensionEmployer: number;
  nhf: number;
  totalDeductions: number;
  net: number;
}

export interface PayComputation {
  lines: PayslipLine[];
  gross: number;
  taxableGross: number;
  statutoryDeductions: number;
  otherDeductions: number;
  totalDeductions: number;
  net: number;
  employerCost: number;
  bases: { pensionable: number; nhf: number; nhis: number };
  tax: TaxBreakdown;
  ytd: YtdTotals;
  /** Pro-ration applied to recurring pay (1 = full period). */
  prorationFactor: number;
  rateSetId: string;
}

// ── Payroll run ─────────────────────────────────────────────────────────────

export type PayrollRunStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "finalized"
  | "disbursed";

export type PayrollRunType = "regular" | "off_cycle" | "adjustment";

export interface PayPeriod {
  year: number;
  /** 1–12 */
  month: number;
  label: string;
  start: string;
  end: string;
  payDate: string;
}

export type EmployeeMode = "auto" | "manual";

export interface RunEmployee {
  employeeId: string;
  included: boolean;
  mode: EmployeeMode;
  /** For manual employees: the uploaded lines. */
  manualLines?: PayslipLine[];
  /** Manual employees: take statutory lines as uploaded, or recompute them from the uploaded earnings. */
  manualStatutory?: "as_uploaded" | "recalculate";
  computation: PayComputation | null;
  attendance: AttendanceSnapshot;
}

export interface AttendanceSnapshot {
  workingDays: number;
  daysWorked: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  overtimeHours: number;
}

export type ExceptionSeverity = "error" | "warning";

export interface PayrollException {
  id: string;
  rule: ExceptionRule;
  severity: ExceptionSeverity;
  employeeId?: string;
  message: string;
  acknowledged?: { by: string; at: string; reason: string };
}

export type ExceptionRule =
  | "duplicate_bank_account"
  | "leaver_in_run"
  | "negative_net"
  | "zero_net"
  | "missing_bank"
  | "missing_tin"
  | "missing_rsa"
  | "basic_out_of_range"
  | "variance"
  | "manual_missing_paye"
  | "rent_evidence_unverified";

export interface RunActor {
  employeeId: string;
  name: string;
}

export interface PayrollRunTotals {
  employees: number;
  gross: number;
  deductions: number;
  net: number;
  paye: number;
  pensionEmployee: number;
  pensionEmployer: number;
  nhf: number;
  employerCost: number;
}

export interface PayrollRun {
  id: string;
  tenantId: string;
  type: PayrollRunType;
  period: PayPeriod;
  title: string;
  status: PayrollRunStatus;
  employees: RunEmployee[];
  inputs: PeriodInput[];
  exceptions: PayrollException[];
  totals: PayrollRunTotals;
  preparedBy: RunActor;
  createdAt: string;
  calculatedAt?: string;
  submittedAt?: string;
  approvalRequestId?: string;
  approvedBy?: RunActor;
  approvedAt?: string;
  finalizedBy?: RunActor;
  finalizedAt?: string;
  disbursedAt?: string;
  /** Adjustment runs point at the finalized run they correct. */
  parentRunId?: string;
  notes?: string;
}

export function inputSourceOf(run: Pick<PayrollRun, "employees">): "auto" | "manual" | "mixed" {
  const included = run.employees.filter((e) => e.included);
  const manual = included.filter((e) => e.mode === "manual").length;
  if (manual === 0) return "auto";
  if (manual === included.length) return "manual";
  return "mixed";
}

// ── Payslip (immutable once finalized) ──────────────────────────────────────

export type InsightType =
  | "net_change"
  | "deduction_split"
  | "tax_progress"
  | "pension_growth"
  | "leave_nudge";

export interface PayslipInsight {
  type: InsightType;
  title: string;
  message: string;
  tone: "positive" | "neutral" | "attention";
}

export interface PayslipEmployeeSnapshot {
  id: string;
  employeeNumber: string;
  fullName: string;
  jobTitle: string;
  departmentName: string;
  grade: string;
  employmentType: string;
  startDate: string;
  email: string;
  bankName: string;
  accountMasked: string;
  tin: string;
  rsaPin: string;
  pfaName: string;
  stateOfResidence: string;
}

export interface PayslipCompanySnapshot {
  legalName: string;
  tradingName: string;
  registrationNumber: string;
  taxId: string;
  address: string;
  logoUrl: string;
  primaryColor: string;
  currency: string;
  currencySymbol: string;
}

export interface Payslip {
  id: string;
  /** Human reference printed on the slip, e.g. "PSL-2026-11-0007". */
  reference: string;
  tenantId: string;
  runId: string;
  runType: PayrollRunType;
  employeeId: string;
  period: PayPeriod;
  status: "draft" | "final";
  company: PayslipCompanySnapshot;
  employee: PayslipEmployeeSnapshot;
  computation: PayComputation;
  attendance: AttendanceSnapshot;
  leave: { entitlement: number; used: number; remaining: number; yearLabel: string } | null;
  /** Generated once, stored, never recomputed on view. */
  insights: PayslipInsight[];
  verification: { code: string; hash: string; revoked: boolean };
  approvedBy: string | null;
  generatedAt: string;
  /** "From your employer" lines shown only when the tenant allows. */
  display: PayslipDisplayOptions;
}

// ── Audit ───────────────────────────────────────────────────────────────────

export interface PayrollAuditEntry {
  id: string;
  tenantId: string;
  at: string;
  actor: string;
  action: string;
  runId?: string;
  employeeId?: string;
  detail?: string;
}
