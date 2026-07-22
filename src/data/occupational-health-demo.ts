import type { OHReferral } from "@/src/lib/types/occupational-health";

/**
 * Days of continuous absence before the system automatically flags an OH
 * referral. 28 is the UK convention; tenant-configurable on a multi-tenant
 * platform (§18).
 */
export const OH_REFERRAL_THRESHOLD_DAYS = 28;

export const OH_REFERRALS: OHReferral[] = [
  {
    id: "oh-001",
    employeeId: "emp-201",
    employeeName: "Grace Adeyemi",
    employeeInitials: "GA",
    department: "Operations",
    absenceStartDate: "2026-06-01",
    referralDate: "2026-06-30",
    assessmentDate: "2026-07-10",
    status: "recommendations_received",
    fitnessStatus: "fit_with_adjustments",
    recommendedAdjustments: [
      "Phased return over 4 weeks",
      "Reduced hours (6/day) initially",
      "Ergonomic chair and sit-stand desk",
    ],
    equalityActConsidered: true,
    expectedReturnDate: "2026-07-27",
    caseNotes: "Awaiting HR review of recommended adjustments.",
  },
  {
    id: "oh-002",
    employeeId: "emp-202",
    employeeName: "Daniel Okoro",
    employeeInitials: "DO",
    department: "Engineering",
    absenceStartDate: "2026-06-20",
    status: "threshold_reached",
    fitnessStatus: "pending",
    recommendedAdjustments: [],
    equalityActConsidered: false,
    caseNotes: "28-day threshold reached — awaiting HR referral to OH.",
  },
  {
    id: "oh-003",
    employeeId: "emp-203",
    employeeName: "Priya Nair",
    employeeInitials: "PN",
    department: "Finance",
    absenceStartDate: "2026-04-15",
    referralDate: "2026-05-14",
    assessmentDate: "2026-05-28",
    status: "closed",
    fitnessStatus: "fit",
    recommendedAdjustments: ["No ongoing adjustments required"],
    equalityActConsidered: false,
    expectedReturnDate: "2026-06-02",
    caseNotes: "Returned to full duties. Return-to-work interview completed.",
  },
  {
    id: "oh-004",
    employeeId: "emp-204",
    employeeName: "Marcus Bello",
    employeeInitials: "MB",
    department: "Sales",
    absenceStartDate: "2026-05-05",
    referralDate: "2026-06-03",
    status: "referred",
    fitnessStatus: "pending",
    recommendedAdjustments: [],
    equalityActConsidered: true,
    caseNotes: "Referred to Occupational Health — assessment scheduled.",
  },
];
