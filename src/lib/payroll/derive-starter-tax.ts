/**
 * UK PAYE starter-tax derivation. Pure, framework-free — no React, no store.
 *
 * Derives the starting tax code & basis from a captured StarterTaxRecord. In a
 * real payroll system this feeds the first Full Payment Submission via RTI; here
 * the artifact is the record + derived code, computed locally.
 */

import type {
  DerivedTax,
  StarterTaxRecord,
  TaxBasis,
} from "@/src/lib/types/starter-tax";

/** The standard UK personal-allowance emergency tax code (£12,570). */
const STANDARD_TAX_CODE = "1257L";

/** Parse an ISO yyyy-mm-dd date as a calendar date (no timezone surprises). */
function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Start of the UK tax year containing `ref` — the 6 April boundary. For a date
 * on/after 6 April the year is `ref`'s year, otherwise the previous year.
 */
export function currentTaxYearStart(ref: Date): Date {
  const year = ref.getFullYear();
  const month = ref.getMonth(); // 0 = Jan, 3 = Apr
  const onOrAfterApril6 = month > 3 || (month === 3 && ref.getDate() >= 6);
  return new Date(onOrAfterApril6 ? year : year - 1, 3, 6);
}

/**
 * Records are kept for the current tax year + 3 years. Given an employment start
 * date, returns the tax-year end (5 April) of that year + 3 years.
 */
export function computeRetainUntil(startDate: string): string {
  const start = currentTaxYearStart(parseISODate(startDate));
  // Tax year end is 5 April of the following calendar year; + 3 years.
  return toISODate(new Date(start.getFullYear() + 1 + 3, 3, 5));
}

function basisFromWeek1Month1(week1Month1: boolean): TaxBasis {
  return week1Month1 ? "week1month1" : "cumulative";
}

function deriveFromChecklist(record: StarterTaxRecord): DerivedTax {
  const checklist = record.starterChecklist!;
  const sl = checklist.studentLoan;
  const common = {
    studentLoanDeduction: sl.hasPlan,
    studentLoanPlan: sl.plan,
    postgraduateLoan: sl.postgraduateLoan,
  };
  switch (checklist.starterDeclaration) {
    case "A":
      return {
        taxCode: STANDARD_TAX_CODE,
        basis: "cumulative",
        derivationSource: "starter_declaration_A",
        ...common,
      };
    case "B":
      return {
        taxCode: STANDARD_TAX_CODE,
        basis: "week1month1",
        derivationSource: "starter_declaration_B",
        ...common,
      };
    case "C":
      return {
        taxCode: "BR",
        basis: null, // flat 20% on all pay; basis not applicable
        derivationSource: "starter_declaration_C",
        ...common,
      };
  }
}

function noFormDefault(): DerivedTax {
  // Emergency-style default — over-taxes until corrected.
  return {
    taxCode: "0T",
    basis: "week1month1",
    studentLoanDeduction: false,
    derivationSource: "no_form_default_0T",
  };
}

/** Derive the starting tax position from a captured record. */
export function deriveStarterTaxCode(record: StarterTaxRecord): DerivedTax {
  if (record.source === "starter_checklist" && record.starterChecklist) {
    return deriveFromChecklist(record);
  }

  if (record.source === "p45" && record.p45) {
    const p45 = record.p45;
    const taxYearStart = currentTaxYearStart(
      parseISODate(record.employmentStartDate),
    );
    const leaving = parseISODate(p45.leavingDate);

    if (leaving >= taxYearStart) {
      // Current-year P45 — the accurate path: carry the code, basis and the
      // pay/tax to date forward.
      return {
        taxCode: p45.taxCodeAtLeaving,
        basis: basisFromWeek1Month1(p45.week1Month1),
        studentLoanDeduction: p45.continueStudentLoan,
        derivationSource: "p45_current_year",
      };
    }

    // Stale P45 — ignore it and fall through to the checklist if one is on
    // file, otherwise the no-form default.
    if (record.starterChecklist) {
      return {
        ...deriveFromChecklist(record),
        derivationSource: "p45_stale_ignored",
      };
    }
    return { ...noFormDefault(), derivationSource: "p45_stale_ignored" };
  }

  return noFormDefault();
}
