import type { PayElement, PayElementGroup } from "./types";

/**
 * Pay Element Master — seeded from the client's Nigeria Payroll Elements
 * workbook, grouped so nobody has to scroll a flat list of 100 items.
 * Tenants switch whole groups on/off (a services company never sees the
 * manufacturing cluster) and can add custom elements on top.
 *
 * Tax treatment defaults: every cash earning is taxable unless the law
 * says otherwise (expense reimbursements are not income). Pensionable is
 * limited to basic + housing + transport — the statutory minimum
 * definition of "monthly emoluments" under the Pension Reform Act 2014.
 */

export const ELEMENT_GROUP_LABELS: Record<PayElementGroup, string> = {
  core: "Core Pay",
  allowances: "General Allowances",
  overtime: "Overtime & Shift",
  bonuses: "Attendance & Performance Bonuses",
  manufacturing: "Manufacturing / Factory",
  annual: "Annual & Festive",
  benefits_in_kind: "Travel & Benefits-in-Kind",
  termination: "Termination",
  corrections: "Corrections",
  reimbursements: "Reimbursements",
  statutory: "Statutory Deductions",
  other_deductions: "Other Deductions",
  employer: "Employer Contributions",
};

export const ELEMENT_GROUP_ORDER: PayElementGroup[] = [
  "core",
  "allowances",
  "overtime",
  "bonuses",
  "manufacturing",
  "annual",
  "benefits_in_kind",
  "termination",
  "corrections",
  "reimbursements",
  "statutory",
  "other_deductions",
  "employer",
];

type Seed = Partial<PayElement> & Pick<PayElement, "code" | "name">;

function earning(group: PayElementGroup, items: Seed[], defaults: Partial<PayElement> = {}): PayElement[] {
  return items.map((s) => ({
    category: "earning",
    group,
    calculationType: "fixed",
    taxable: true,
    pensionable: false,
    recurring: false,
    proratable: false,
    statutory: false,
    active: true,
    ...defaults,
    ...s,
  }));
}

function deduction(group: PayElementGroup, items: Seed[], defaults: Partial<PayElement> = {}): PayElement[] {
  return items.map((s) => ({
    category: "deduction",
    group,
    calculationType: "fixed",
    taxable: false,
    pensionable: false,
    recurring: false,
    proratable: false,
    statutory: false,
    active: true,
    ...defaults,
    ...s,
  }));
}

const recurringAllowance = { recurring: true, proratable: true, calculationType: "fixed" as const };

export const SEED_PAY_ELEMENTS: PayElement[] = [
  // Core
  ...earning("core", [
    { code: "BASIC", name: "Basic Salary", pensionable: true, description: "Contractual basic pay." },
    { code: "CONSOLIDATED", name: "Consolidated Salary", pensionable: true, description: "All-in salary for tenants that don't split pay." },
  ], recurringAllowance),

  // General allowances
  ...earning("allowances", [
    { code: "HOUSING", name: "Housing Allowance", pensionable: true },
    { code: "TRANSPORT", name: "Transport Allowance", pensionable: true },
    { code: "MEAL", name: "Meal / Lunch Allowance" },
    { code: "UTILITY", name: "Utility Allowance" },
    { code: "MEDICAL", name: "Medical Allowance" },
    { code: "EDUCATION", name: "Education Allowance" },
    { code: "LEAVE_ALLOW", name: "Leave Allowance", recurring: false, proratable: false },
    { code: "ENTERTAINMENT", name: "Entertainment Allowance" },
    { code: "DOMESTIC", name: "Domestic Staff Allowance" },
    { code: "FURNITURE", name: "Furniture Allowance" },
    { code: "CLOTHING", name: "Clothing Allowance" },
    { code: "COMMUNICATION", name: "Communication Allowance" },
    { code: "PROFESSIONAL", name: "Professional Allowance" },
    { code: "RESPONSIBILITY", name: "Responsibility Allowance" },
    { code: "ACTING", name: "Acting Allowance" },
    { code: "LOCATION", name: "Location Allowance" },
    { code: "COLA", name: "Cost of Living Allowance" },
    { code: "OTHER_ALLOW", name: "Other Allowances" },
  ], recurringAllowance),

  // Overtime & shift
  ...earning("overtime", [
    { code: "OT_NORMAL", name: "Overtime — Normal Day", multiplier: 1.5 },
    { code: "OT_REST", name: "Overtime — Rest Day", multiplier: 2 },
    { code: "OT_PUBLIC", name: "Overtime — Public Holiday", multiplier: 2.5 },
  ], { calculationType: "rate_x_units" }),
  ...earning("overtime", [
    { code: "NIGHT_SHIFT", name: "Night Shift Allowance" },
    { code: "WEEKEND", name: "Weekend Allowance" },
    { code: "STANDBY", name: "Standby Allowance" },
    { code: "CALL_OUT", name: "Call-Out Allowance" },
    { code: "ON_CALL", name: "On-Call Allowance" },
  ]),

  // Bonuses
  ...earning("bonuses", [
    { code: "ATTENDANCE_BONUS", name: "Attendance Bonus" },
    { code: "PUNCTUALITY_BONUS", name: "Punctuality Bonus" },
    { code: "PRODUCTIVITY_BONUS", name: "Productivity Bonus" },
    { code: "PERFORMANCE_BONUS", name: "Performance Bonus" },
    { code: "COMMISSION", name: "Sales Commission" },
    { code: "REFERRAL_BONUS", name: "Referral Bonus" },
    { code: "RETENTION_BONUS", name: "Retention Bonus" },
    { code: "PROJECT_BONUS", name: "Project Completion Bonus" },
  ]),

  // Manufacturing (off by default for non-manufacturing tenants)
  ...earning("manufacturing", [
    { code: "FACTORY", name: "Factory Allowance", recurring: true },
    { code: "PRODUCTION", name: "Production Bonus" },
    { code: "OUTPUT", name: "Output-Based Pay" },
    { code: "PIECE_RATE", name: "Piece Rate Pay", calculationType: "rate_x_units" },
    { code: "ASSEMBLY", name: "Assembly Line Allowance" },
    { code: "MACHINE_OP", name: "Machine Operator Allowance" },
    { code: "MAINTENANCE", name: "Machine Maintenance Allowance" },
    { code: "MULTI_SKILL", name: "Multi-Skilling Allowance" },
    { code: "QC", name: "Quality Control Allowance" },
    { code: "HAZARD", name: "Hazard / Risk Allowance" },
    { code: "HEAT", name: "Heat Allowance" },
    { code: "COLD_ROOM", name: "Cold Room Allowance" },
    { code: "CHEMICAL", name: "Chemical Exposure Allowance" },
    { code: "DUST_NOISE", name: "Dust / Noise Allowance" },
    { code: "CONFINED", name: "Confined Space Allowance" },
    { code: "SHUTDOWN", name: "Shutdown / Restart Premium" },
    { code: "BREAKDOWN", name: "Breakdown Premium" },
  ]),

  // Annual & festive
  ...earning("annual", [
    { code: "13TH_MONTH", name: "13th Month Pay" },
    { code: "ANNUAL_BONUS", name: "Annual Bonus" },
    { code: "FESTIVE_BONUS", name: "Christmas / Eid Bonus" },
    { code: "LONG_SERVICE", name: "Long Service Award" },
    { code: "PROFIT_SHARE", name: "Profit Sharing" },
    { code: "SIGN_ON", name: "Sign-On Bonus" },
  ]),

  // Travel & benefits-in-kind
  ...earning("benefits_in_kind", [
    { code: "RELOCATION", name: "Relocation Allowance" },
    { code: "TRAVEL", name: "Travel Allowance" },
    { code: "PER_DIEM", name: "Per Diem" },
    { code: "CAR", name: "Car Allowance", recurring: true, proratable: true },
    { code: "FUEL", name: "Fuel Allowance", recurring: true, proratable: true },
    { code: "SCHOOL_FEES", name: "School Fees Allowance" },
    { code: "ACCOMMODATION", name: "Accommodation Benefit" },
    { code: "COMPANY_CAR", name: "Company Car Benefit" },
    { code: "HEALTH_BENEFIT", name: "Health Insurance Benefit" },
  ]),

  // Termination
  ...earning("termination", [
    { code: "GRATUITY", name: "Gratuity", description: "Loss-of-office exemption applies up to the rate-set threshold." },
    { code: "REDUNDANCY", name: "Redundancy Pay" },
    { code: "SEVERANCE", name: "Severance Pay" },
    { code: "PILON", name: "Payment in Lieu of Notice" },
    { code: "ACCRUED_LEAVE", name: "Accrued Leave Payment" },
    { code: "DEATH_IN_SERVICE", name: "Death-in-Service Benefit", taxable: false },
  ]),

  // Corrections
  ...earning("corrections", [
    // Arrears of salary are emoluments for the months they relate to, so they
    // attract pension like the pay they replace.
    { code: "BACK_PAY", name: "Back Pay / Arrears", pensionable: true },
    { code: "SALARY_ADJ", name: "Salary Adjustment", pensionable: true },
    { code: "ONE_OFF", name: "One-Off Payment" },
  ]),

  // Reimbursements — repaying the employee's own money is not income
  ...earning("reimbursements", [
    { code: "EXPENSE_REIMB", name: "Expense Reimbursement", taxable: false, description: "Approved expense claims paid through payroll." },
  ]),

  // Statutory deductions — system-owned
  ...deduction("statutory", [
    { code: "PAYE", name: "PAYE Tax", calculationType: "formula" },
    { code: "PENSION_EE", name: "Pension (Employee)", calculationType: "formula" },
    { code: "NHF", name: "National Housing Fund", calculationType: "formula" },
    { code: "NHIS_EE", name: "Health Insurance (NHIA)", calculationType: "formula" },
    { code: "WHT", name: "Withholding Tax", calculationType: "formula" },
  ], { statutory: true }),
  ...deduction("statutory", [
    { code: "VOL_PENSION", name: "Voluntary Pension Contribution", description: "Additional voluntary contribution to the RSA — tax-deductible." },
  ]),

  // Other deductions
  ...deduction("other_deductions", [
    { code: "SALARY_ADVANCE", name: "Salary Advance Recovery" },
    { code: "STAFF_LOAN", name: "Staff Loan Repayment" },
    { code: "COOP_CONTRIB", name: "Cooperative Contribution", recurring: true },
    { code: "COOP_LOAN", name: "Cooperative Loan Repayment" },
    { code: "EMERGENCY_LOAN", name: "Emergency Loan Repayment" },
    { code: "UNION_DUES", name: "Union Dues", recurring: true },
    { code: "WELFARE", name: "Staff Welfare", recurring: true },
    { code: "SAVINGS", name: "Savings Scheme", recurring: true },
    { code: "UNPAID_LEAVE", name: "Absence / Unpaid Leave", calculationType: "rate_x_units", preTax: true },
    { code: "LATENESS", name: "Lateness Deduction", preTax: true },
    { code: "OVERPAYMENT", name: "Overpayment Recovery" },
    { code: "COURT_ORDER", name: "Court-Ordered Deduction" },
    { code: "OTHER_DED", name: "Other Deduction", recurring: true },
  ]),

  // Employer contributions — a cost to the employer, never deducted from pay
  ...[
    { code: "PENSION_ER", name: "Pension (Employer)" },
    { code: "NHIS_ER", name: "Health Insurance (Employer)" },
    { code: "NSITF", name: "NSITF (Employee Compensation)" },
    { code: "ITF", name: "Industrial Training Fund" },
    { code: "GROUP_LIFE", name: "Group Life Assurance" },
  ].map<PayElement>((s) => ({
    ...s,
    category: "employer",
    group: "employer",
    calculationType: "formula",
    taxable: false,
    pensionable: false,
    recurring: true,
    proratable: false,
    statutory: true,
    active: true,
  })),
];

/** Groups a tenant gets out of the box. Manufacturing is opt-in. */
export const DEFAULT_ENABLED_GROUPS: PayElementGroup[] = ELEMENT_GROUP_ORDER.filter(
  (g) => g !== "manufacturing",
);

/** Loan product → the deduction element that repays it. */
export const LOAN_ELEMENT_BY_TYPE: Record<string, string> = {
  staff_loan: "STAFF_LOAN",
  employee_loan: "STAFF_LOAN",
  salary_advance: "SALARY_ADVANCE",
  cooperative_loan: "COOP_LOAN",
  emergency_loan: "EMERGENCY_LOAN",
  season_ticket_loan: "STAFF_LOAN",
};

export function elementMap(elements: PayElement[]): Map<string, PayElement> {
  return new Map(elements.map((e) => [e.code, e]));
}
