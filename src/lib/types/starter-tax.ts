/**
 * UK PAYE new-starter tax capture — modelled on the official HMRC forms:
 * P45 (Continuous) and the Starter Checklist (HMRC 12/25).
 *
 * A new joiner declares their tax position via one of two mutually exclusive
 * paths — a P45 (issued by a previous employer) or a Starter Checklist (the
 * self-completed form, formerly P46). These are an XOR: a joiner has one or the
 * other, never both, sometimes neither (`source: "none"`).
 *
 * The two branches are intentionally asymmetric:
 *  - `starter_checklist` is form-native — pure structured fields, no attachment.
 *  - `p45` is document-derived — an optional uploaded PDF/scan plus transcribed fields.
 *
 * UK-only. Nigerian tenants use a different model (TIN + state IRS) and never
 * generate these records.
 */

export type StarterTaxSource = "p45" | "starter_checklist" | "none";

/** Formal RTI Starter Declaration field. */
export type StarterDeclaration = "A" | "B" | "C";

export type StudentLoanPlan = "PLAN_1" | "PLAN_2" | "PLAN_4" | "PLAN_5";

export type TaxBasis = "cumulative" | "week1month1";

/**
 * Document-derived branch — used when `source === "p45"`. Box numbers refer to
 * the official P45 (Continuous) form, Parts 2/3.
 */
export interface P45Details {
  /** Optional uploaded PDF/scan; the structured fields are what's required. */
  documentRef: string | null;
  /** Box 1 — Employer PAYE reference (left, e.g. "120"). */
  payeOfficeNumber: string;
  /** Box 1 — Employer PAYE reference (right, e.g. "AB456"). */
  payeReferenceNumber: string;
  /** Composed "120/AB456" — kept for display / back-compat. */
  previousEmployerPayeRef: string;
  /** Box 2 — Employee's National Insurance number. */
  niNumber: string;
  /** Box 4 — Leaving date (ISO yyyy-mm-dd). */
  leavingDate: string;
  /** Box 5 — Student Loan deductions to continue. */
  continueStudentLoan: boolean;
  /** Box 6 — Tax code at leaving date. */
  taxCodeAtLeaving: string;
  /** Box 6 — Week 1 / month 1 indicator ('X'). */
  week1Month1: boolean;
  /** Box 7 — Week number (cumulative only). */
  weekNumber: string;
  /** Box 7 — Month number (cumulative only). */
  monthNumber: string;
  /** Box 7 — Total pay to date. */
  totalPayToDate: number;
  /** Box 7 — Total tax to date. */
  totalTaxToDate: number;
}

/**
 * Raw answers to the official Starter Checklist Employee-statement questions
 * (Q8–Q10) that resolve to Statement A/B/C.
 */
export interface EmployeeStatementAnswers {
  /** Q8 — Do you have another job? */
  hasAnotherJob: boolean;
  /** Q9 — Do you receive a State, workplace or private pension? */
  receivesPension: boolean;
  /**
   * Q10 — Since 6 April, payments from another job that has ended, or JSA / ESA /
   * Incapacity Benefit?
   */
  recentPaymentsSince6April: boolean;
}

/** Form-native branch — used when `source === "starter_checklist"`. */
export interface StarterChecklistDetails {
  /** The guided Q8–Q10 answers. */
  employeeStatement: EmployeeStatementAnswers;
  /** Resolved from `employeeStatement` via `resolveStarterDeclaration`. */
  starterDeclaration: StarterDeclaration;
  studentLoan: {
    /** Q11 'yes' AND Q12 'no' — a deduction is actually due. */
    hasPlan: boolean;
    /** Q13 plan type. */
    plan: StudentLoanPlan | null;
    /** Q13 postgraduate loan box. */
    postgraduateLoan: boolean;
  };
}

/** Computed starting tax position derived from the captured record. */
export interface DerivedTax {
  taxCode: string;
  /** `null` when not applicable (e.g. BR flat rate). */
  basis: TaxBasis | null;
  studentLoanDeduction: boolean;
  /** Carried through for the payroll calc. */
  studentLoanPlan?: StudentLoanPlan | null;
  postgraduateLoan?: boolean;
  /** Short string explaining which derivation rule fired. */
  derivationSource: string;
}

/** One record per employee, discriminated on `source`. */
export interface StarterTaxRecord {
  employeeId: string;
  tenantId: string;
  source: StarterTaxSource;
  /** ISO yyyy-mm-dd. */
  employmentStartDate: string;
  /** Non-null only when `source === "p45"`. */
  p45: P45Details | null;
  /** Non-null only when `source === "starter_checklist"`. */
  starterChecklist: StarterChecklistDetails | null;
  derived: DerivedTax;
  /** Current tax year end (5 April) + 3 years. */
  retainUntil: string;
}

/**
 * Resolve the Starter Declaration (A/B/C) from the official guided answers,
 * following the Starter Checklist decision flow (Q8 → Q9 → Q10).
 */
export function resolveStarterDeclaration(
  a: EmployeeStatementAnswers,
): StarterDeclaration {
  if (a.hasAnotherJob || a.receivesPension) return "C";
  return a.recentPaymentsSince6April ? "B" : "A";
}

/**
 * Verbatim HMRC Starter Declaration statements + the resulting tax treatment,
 * for the resolved read-back card.
 */
export const STARTER_DECLARATION_STATEMENTS: Record<
  StarterDeclaration,
  { title: string; statement: string; result: string }
> = {
  A: {
    title: "Statement A",
    statement:
      "This is my first job since 6 April and since the 6 April I have not received payments from any of the following: Jobseeker's Allowance, Employment and Support Allowance, Incapacity Benefit.",
    result: "Current personal allowance.",
  },
  B: {
    title: "Statement B",
    statement:
      "Since 6 April I have had another job but I do not have a P45. And/or since the 6 April I have received payments from any of the following: Jobseeker's Allowance, Employment and Support Allowance, Incapacity Benefit.",
    result: "Current personal allowance on a Week 1 / Month 1 basis.",
  },
  C: {
    title: "Statement C",
    statement:
      "I have another job and/or I am in receipt of a State, workplace or private pension.",
    result: "Tax code BR.",
  },
};

export const STUDENT_LOAN_PLAN_OPTIONS: {
  value: StudentLoanPlan;
  label: string;
}[] = [
  { value: "PLAN_1", label: "Plan 1" },
  { value: "PLAN_2", label: "Plan 2" },
  { value: "PLAN_4", label: "Plan 4 (Scotland)" },
  { value: "PLAN_5", label: "Plan 5" },
];

/** Plan-type guidance copy from the Starter Checklist's right-hand panel. */
export const STUDENT_LOAN_PLAN_GUIDANCE: string[] = [
  "Student Finance England: Plan 5 (course started on/after 1 Aug 2023), Plan 2 (1 Sep 2012 – 31 Jul 2023), Plan 1 (before 1 Sep 2012), or Postgraduate loan.",
  "Student Finance Wales: Plan 2 (on/after 1 Sep 2012), Plan 1 (before 1 Sep 2012), or Postgraduate loan.",
  "Student Awards Agency Scotland: Plan 4.",
  "Student Finance Northern Ireland: Plan 1.",
];

export const TAX_BASIS_LABELS: Record<TaxBasis, string> = {
  cumulative: "Cumulative",
  week1month1: "Week 1 / Month 1",
};
