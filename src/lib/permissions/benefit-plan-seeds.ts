import type { BenefitPlan } from "@/src/lib/types/benefits";
import { SYSTEM_AUTHOR } from "./seeds";

/**
 * Pre-made benefit plans HR gets out of the box, so "set up benefits" doesn't
 * start from a blank slate. Modelled on what's standard across large Nigerian
 * employers (HMO, the statutory 10%/8% pension split, group life assurance,
 * 13th month, leave allowance) plus benefits common at multinationals/tech
 * employers (EAP, remote/data stipend, learning budget, gym subsidy).
 *
 * Regular staff — full-time, remote and field-based — get the full package;
 * contract/temporary/seasonal staff get a reduced set; casual, freelance,
 * internship and apprenticeship engagements sit outside most employer-funded
 * benefits, matching how those engagement types are treated under Nigerian
 * labour practice. A handful of benefits apply to literally everyone.
 */

const REGULAR = ["full_time", "remote", "field_based"] as const;
const REGULAR_PLUS_CONTRACT = [...REGULAR, "contract"] as const;
const REGULAR_PLUS_PART_TIME = [...REGULAR, "part_time"] as const;
const BROAD_EMPLOYMENT = [
  "full_time",
  "remote",
  "field_based",
  "contract",
  "temporary",
  "seasonal",
  "part_time",
] as const;

const SEED_DATE = "2026-01-01";

const BASE_PLANS: BenefitPlan[] = [
  {
    id: "BEN-HMO",
    name: "Group Health Insurance (HMO)",
    category: "health",
    description:
      "Comprehensive in-patient and out-patient medical cover through a licensed HMO, extending to immediate family.",
    provider: "AXA Mansard HMO",
    coverageDetails:
      "Employee + spouse + up to 4 children · in-patient, out-patient, dental and optical care",
    costNote: "Fully employer-funded",
    waitingPeriodDays: 90,
    scope: { kind: "employmentType", types: [...REGULAR_PLUS_CONTRACT] },
    status: "active",
    enrollment: "core",
    country: "ng",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-PENSION",
    name: "Contributory Pension Scheme",
    category: "retirement",
    description:
      "Retirement savings account with a licensed Pension Fund Administrator, per the Pension Reform Act.",
    provider: "Employee's chosen PenCom-licensed PFA",
    coverageDetails: "Minimum statutory contribution split",
    employerContributionPct: 10,
    employeeContributionPct: 8,
    scope: { kind: "employmentType", types: [...REGULAR] },
    status: "active",
    enrollment: "core",
    country: "ng",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-LIFE",
    name: "Group Life Assurance",
    category: "insurance",
    description:
      "Statutory life cover paying out at least three times annual gross salary to a nominated beneficiary.",
    provider: "Group life insurer",
    coverageDetails: "Minimum 3x annual gross salary",
    costNote: "Fully employer-funded",
    scope: { kind: "employmentType", types: [...REGULAR] },
    status: "active",
    enrollment: "core",
    country: "ng",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-PA",
    name: "Group Personal Accident Cover",
    category: "insurance",
    description:
      "Covers accidental death, and permanent or temporary disability, arising in the course of employment.",
    costNote: "Fully employer-funded",
    scope: { kind: "all" },
    status: "active",
    enrollment: "core",
    country: "ng",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-LEAVE",
    name: "Annual Leave",
    category: "leave",
    description:
      "Paid time off every year, pro-rated by employment type and increasing with tenure.",
    coverageDetails: "21–30 working days/year depending on grade and tenure",
    scope: { kind: "all" },
    status: "active",
    enrollment: "core",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-LEAVE-ALLOWANCE",
    name: "Leave Allowance",
    category: "financial",
    description:
      "One-off cash allowance paid alongside annual leave, standard practice across Nigerian employers.",
    coverageDetails: "10% of annual basic salary, paid once per year",
    scope: { kind: "employmentType", types: [...REGULAR_PLUS_CONTRACT] },
    status: "active",
    enrollment: "core",
    country: "ng",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-13TH",
    name: "13th Month Bonus",
    category: "financial",
    description:
      "Not a statutory requirement, but near-universal across corporate Nigeria — one month's basic salary paid every December.",
    coverageDetails: "One month's basic salary, pro-rated for partial years",
    scope: { kind: "employmentType", types: [...REGULAR_PLUS_CONTRACT] },
    status: "active",
    enrollment: "core",
    country: "ng",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-PARENTAL",
    name: "Paid Parental Leave",
    category: "leave",
    description:
      "Fully paid time off around the birth or adoption of a child.",
    coverageDetails: "16 weeks maternity · 4 weeks paternity, at full pay",
    scope: { kind: "employmentType", types: [...REGULAR] },
    status: "active",
    enrollment: "core",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-TRANSPORT",
    name: "Transport & Housing Allowance",
    category: "financial",
    description:
      "Monthly allowance paid alongside salary to offset commuting and housing costs.",
    coverageDetails: "₦20,000–₦50,000/month depending on grade",
    scope: { kind: "employmentType", types: [...BROAD_EMPLOYMENT] },
    status: "active",
    enrollment: "core",
    country: "ng",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-MEAL",
    name: "Meal Subsidy",
    category: "perks",
    description:
      "Subsidised meals on-site, or a daily meal allowance for remote and field-based staff.",
    scope: { kind: "all" },
    status: "active",
    enrollment: "core",
    country: "ng",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-REMOTE-STIPEND",
    name: "Remote Work & Data Stipend",
    category: "perks",
    description:
      "Monthly stipend toward internet/data and home-office costs for staff who work outside a fixed office.",
    scope: { kind: "employmentType", types: ["remote", "field_based", "full_time"] },
    status: "active",
    enrollment: "core",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-EAP",
    name: "Employee Assistance Program",
    category: "wellness",
    description:
      "Confidential counselling, mental health support and a wellness helpline, open to every employee and their immediate family.",
    costNote: "Fully employer-funded",
    scope: { kind: "all" },
    status: "active",
    enrollment: "core",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-GYM",
    name: "Wellness & Gym Membership Subsidy",
    category: "wellness",
    description: "Partial reimbursement of gym or fitness membership fees.",
    coverageDetails: "Up to 50% reimbursed, capped monthly",
    scope: { kind: "employmentType", types: [...REGULAR_PLUS_PART_TIME] },
    status: "active",
    enrollment: "optional",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-LND",
    name: "Learning & Development Budget",
    category: "development",
    description:
      "Annual budget toward courses, certifications and conferences, plus access to internal training programmes.",
    scope: { kind: "all" },
    status: "active",
    enrollment: "optional",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
  {
    id: "BEN-LONG-SERVICE",
    name: "Long Service Award",
    category: "financial",
    description:
      "One-off cash award and recognition at 5, 10 and 15-year work anniversaries.",
    scope: { kind: "employmentType", types: [...REGULAR] },
    status: "active",
    enrollment: "core",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  },
];

/** Compact seed constructor for the country catalogues below. */
function seedPlan(
  p: Omit<BenefitPlan, "status" | "kind" | "lastModifiedBy" | "lastModifiedAt" | "createdAt">,
): BenefitPlan {
  return {
    status: "active",
    kind: "system",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
    ...p,
  };
}

/**
 * Nigeria — completes the eight benefits most Nigerian employers expect:
 * Pension, HMO, Group Life and allowances above, plus NHF, staff loans,
 * salary advances and training sponsorship.
 */
const NG_PLANS: BenefitPlan[] = [
  seedPlan({
    id: "BEN-NG-NHF",
    name: "National Housing Fund (NHF)",
    category: "retirement",
    country: "ng",
    enrollment: "core",
    description:
      "Statutory contribution to the Federal Mortgage Bank's National Housing Fund, giving access to low-interest mortgage loans.",
    provider: "Federal Mortgage Bank of Nigeria",
    employeeContributionPct: 2.5,
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
  seedPlan({
    id: "BEN-NG-STAFF-LOAN",
    name: "Staff Loans",
    category: "financial",
    country: "ng",
    enrollment: "optional",
    description:
      "Low-interest loans for rent, school fees, a car or home renovation, repaid in monthly instalments. Tracked in Employee Loans.",
    coverageDetails: "Up to 12× monthly gross, repaid over 6–24 months",
    costNote: "5% p.a. flat",
    waitingPeriodDays: 180,
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
  seedPlan({
    id: "BEN-NG-SALARY-ADVANCE",
    name: "Salary Advance",
    category: "financial",
    country: "ng",
    enrollment: "optional",
    description: "Part of next month's salary paid early for emergencies, recovered over 1–3 months.",
    coverageDetails: "Up to 50% of monthly net pay",
    costNote: "Interest-free",
    waitingPeriodDays: 90,
    scope: { kind: "employmentType", types: [...REGULAR_PLUS_CONTRACT] },
  }),
  seedPlan({
    id: "BEN-NG-COOPERATIVE",
    name: "Staff Cooperative Scheme",
    category: "financial",
    country: "ng",
    enrollment: "optional",
    description:
      "Voluntary savings through payroll into the staff cooperative, with access to cooperative loans at member rates.",
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
  seedPlan({
    id: "BEN-NG-TRAINING",
    name: "Training & Exam Sponsorship",
    category: "development",
    country: "ng",
    enrollment: "optional",
    description:
      "Sponsorship of professional exams and certifications — ICAN, ACCA, CIPM, PMP — with a service bond on completion.",
    coverageDetails: "Exam fees + study materials; 12-month bond",
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
];

/** United Kingdom — the package UK employers use to attract and retain talent. */
const UK_PLANS: BenefitPlan[] = [
  seedPlan({
    id: "BEN-UK-PENSION",
    name: "Workplace Pension (Auto-enrolment)",
    category: "retirement",
    country: "uk",
    enrollment: "core",
    description: "Defined-contribution workplace pension under auto-enrolment, on qualifying earnings.",
    provider: "NEST",
    employerContributionPct: 5,
    employeeContributionPct: 3,
    scope: { kind: "employmentType", types: [...BROAD_EMPLOYMENT] },
  }),
  seedPlan({
    id: "BEN-UK-PMI",
    name: "Private Medical Insurance",
    category: "health",
    country: "uk",
    enrollment: "core",
    description: "Fast-track private diagnosis and treatment, with the option to add partner and children.",
    provider: "Bupa",
    costNote: "Employer-funded; P11D taxable benefit",
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
  seedPlan({
    id: "BEN-UK-DENTAL",
    name: "Dental Cover",
    category: "health",
    country: "uk",
    enrollment: "optional",
    description: "Cash-back towards routine and emergency dental treatment.",
    provider: "Simplyhealth",
    scope: { kind: "employmentType", types: [...REGULAR_PLUS_PART_TIME] },
  }),
  seedPlan({
    id: "BEN-UK-SCREENING",
    name: "Health Screening & Optical Cover",
    category: "health",
    country: "uk",
    enrollment: "optional",
    description: "Annual health assessment and a contribution towards eye tests and glasses.",
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
  seedPlan({
    id: "BEN-UK-LIFE",
    name: "Life Assurance",
    category: "insurance",
    country: "uk",
    enrollment: "core",
    description: "Tax-free lump sum to your nominated beneficiaries if you die in service.",
    provider: "Legal & General",
    coverageDetails: "4× basic salary",
    costNote: "Fully employer-funded",
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
  seedPlan({
    id: "BEN-UK-INCOME-PROTECTION",
    name: "Income Protection",
    category: "insurance",
    country: "uk",
    enrollment: "core",
    description: "Replaces part of your salary if long-term illness or injury stops you working.",
    provider: "Aviva",
    coverageDetails: "75% of salary after a 26-week deferred period",
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
  seedPlan({
    id: "BEN-UK-CRITICAL-ILLNESS",
    name: "Critical Illness Cover",
    category: "insurance",
    country: "uk",
    enrollment: "optional",
    description: "Lump sum on diagnosis of a specified serious illness.",
    costNote: "Employee-paid via salary deduction",
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
  seedPlan({
    id: "BEN-UK-CYCLE",
    name: "Cycle to Work Scheme",
    category: "wellness",
    country: "uk",
    enrollment: "optional",
    description: "Tax-efficient bike and safety equipment through salary sacrifice.",
    provider: "Cyclescheme",
    costNote: "Salary sacrifice over 12 months",
    scope: { kind: "employmentType", types: [...REGULAR_PLUS_PART_TIME] },
  }),
  seedPlan({
    id: "BEN-UK-EV",
    name: "Electric Vehicle Salary Sacrifice",
    category: "perks",
    country: "uk",
    enrollment: "optional",
    description: "Lease a fully electric car through salary sacrifice, with insurance and maintenance included.",
    provider: "Octopus EV",
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
  seedPlan({
    id: "BEN-UK-SEASON-TICKET",
    name: "Season Ticket Loan",
    category: "financial",
    country: "uk",
    enrollment: "optional",
    description: "Interest-free loan for an annual rail or travel season ticket, repaid through monthly instalments.",
    costNote: "Interest-free, repaid over 10–12 months",
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
  seedPlan({
    id: "BEN-UK-EMPLOYEE-LOAN",
    name: "Employee Loans & Salary Advance",
    category: "financial",
    country: "uk",
    enrollment: "optional",
    description: "Short-term employee loans and earned-wage salary advances. Tracked in Employee Loans.",
    coverageDetails: "Loans up to £5,000; advances up to 50% of earned pay",
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
  seedPlan({
    id: "BEN-UK-LEARNING",
    name: "Learning Sponsorship & Professional Memberships",
    category: "development",
    country: "uk",
    enrollment: "optional",
    description:
      "Study support, certification sponsorship and paid professional body memberships (CIPD, ICAEW, BCS…).",
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
  seedPlan({
    id: "BEN-UK-FLEX",
    name: "Flexible Benefits Allowance",
    category: "perks",
    country: "uk",
    enrollment: "optional",
    description: "Annual allowance to spend on the benefits that suit you, plus an employee discount platform.",
    provider: "Perkbox",
    scope: { kind: "employmentType", types: [...REGULAR] },
  }),
  seedPlan({
    id: "BEN-UK-FLEXIBLE-WORKING",
    name: "Hybrid & Flexible Working",
    category: "leave",
    country: "uk",
    enrollment: "core",
    description:
      "Hybrid working, flexible start and finish times, and a statutory right to request flexible working.",
    scope: { kind: "all" },
  }),
];

export const DEFAULT_BENEFIT_PLANS: BenefitPlan[] = [...BASE_PLANS, ...NG_PLANS, ...UK_PLANS];
