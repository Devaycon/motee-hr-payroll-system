import type { CountryKey } from "@/src/lib/types/locale";

/**
 * The benefit names HR can attach to an employment type, per country — the
 * vocabulary of the "Benefits Eligibility" column. Nigeria leads with the
 * statutory/expected set (Pension, HMO, Group Life, NHF…); the UK with
 * auto-enrolment pension, PMI and protection benefits.
 */
export const EMPLOYMENT_TYPE_BENEFIT_OPTIONS: Record<CountryKey, string[]> = {
  ng: [
    "HMO",
    "Pro-rated HMO",
    "Pension",
    "Group Life Insurance",
    "NHF",
    "Leave Allowance",
    "Pro-rated Leave Allowance",
    "13th Month",
    "Housing Allowance",
    "Transport Allowance",
    "Meal Subsidy",
    "Remote & Data Stipend",
    "Monthly Stipend",
    "Staff Loans",
    "Salary Advances",
    "Training Sponsorship",
  ],
  uk: [
    "Workplace Pension",
    "Private Medical Insurance",
    "Dental Cover",
    "Life Assurance",
    "Income Protection",
    "Critical Illness Cover",
    "Employee Assistance Programme",
    "Cycle to Work",
    "Season Ticket Loan",
    "Employee Loans",
    "Salary Advance",
    "Learning Sponsorship",
    "Gym Membership",
    "Home Office Allowance",
    "Travel Allowance",
    "Pro-rated Benefits",
  ],
};
