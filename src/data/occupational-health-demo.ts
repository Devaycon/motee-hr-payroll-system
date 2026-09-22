import type { OHReferral } from "@/src/lib/types/occupational-health";

/**
 * Days of continuous absence before the system automatically flags a case
 * for HR/manager REVIEW — not an automatic referral (§10.1). A person
 * always decides whether a referral is appropriate; referrals can also be
 * initiated earlier where warranted. 28 is the UK convention;
 * tenant-configurable on a multi-tenant platform (§18).
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
    adjustments: [
      {
        id: "adj-001a",
        description: "Phased return over 4 weeks",
        dateRecommended: "2026-07-10",
        status: "proposed",
      },
      {
        id: "adj-001b",
        description: "Reduced hours (6/day) initially",
        dateRecommended: "2026-07-10",
        status: "proposed",
      },
      {
        id: "adj-001c",
        description: "Ergonomic chair and sit-stand desk",
        dateRecommended: "2026-07-10",
        status: "proposed",
      },
    ],
    equalityActConsidered: true,
    expectedReturnDate: "2026-07-27",
    caseNotes: "Awaiting HR review of recommended adjustments.",
    caseOwner: "Sarah Jones",
    // §10.10 — this is the client's own worked example for this exact case.
    nextAction: {
      label: "Manager to review recommended adjustments",
      owner: "Sarah Jones",
      due: "2026-09-21",
    },
    reviewDate: "2026-09-21",
    history: [
      { id: "evt-001a", at: "2026-06-01", actorName: "System", note: "Continuous absence recorded." },
      { id: "evt-001b", at: "2026-06-29", actorName: "System", note: "28-day threshold reached — review triggered." },
      { id: "evt-001c", at: "2026-06-30", actorName: "Sarah Jones (HR)", note: "Reviewed and referred to Occupational Health." },
      { id: "evt-001d", at: "2026-07-10", actorName: "Occupational Health", note: "Assessment completed — fit with adjustments." },
    ],
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
    adjustments: [],
    equalityActConsidered: false,
    caseNotes: "28-day threshold reached — awaiting HR review of whether a referral is appropriate.",
    caseOwner: "Line Manager",
    // §10.2 — the client's own worked example for this exact case.
    nextAction: {
      label: "Review OH referral",
      owner: "Line Manager",
      due: "2026-09-21",
    },
    history: [
      { id: "evt-002a", at: "2026-06-20", actorName: "System", note: "Continuous absence recorded." },
      { id: "evt-002b", at: "2026-07-18", actorName: "System", note: "28-day threshold reached — review triggered." },
    ],
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
    adjustments: [
      {
        id: "adj-003a",
        description: "No ongoing adjustments required",
        dateRecommended: "2026-05-28",
        agreedBy: "Priya Nair",
        implementationOwner: "Line Manager",
        effectiveDate: "2026-08-10",
        status: "closed",
      },
    ],
    equalityActConsidered: false,
    // §10.7 — the client's own worked example: a closed case shows a return
    // date, not a continuing absence-day counter.
    expectedReturnDate: "2026-08-10",
    caseNotes: "Returned to full duties. Return-to-work interview completed.",
    caseOwner: "Sarah Jones",
    history: [
      { id: "evt-003a", at: "2026-04-15", actorName: "System", note: "Continuous absence recorded." },
      { id: "evt-003b", at: "2026-05-14", actorName: "Sarah Jones (HR)", note: "Referred to Occupational Health." },
      { id: "evt-003c", at: "2026-05-28", actorName: "Occupational Health", note: "Assessment completed — fit for work." },
      { id: "evt-003d", at: "2026-08-10", actorName: "Sarah Jones (HR)", note: "Return-to-work interview completed. Case closed." },
    ],
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
    adjustments: [],
    equalityActConsidered: true,
    caseNotes: "Referred to Occupational Health — assessment scheduled.",
    caseOwner: "HR",
    nextAction: {
      label: "Await OH assessment outcome",
      owner: "HR",
      due: "2026-09-25",
    },
    history: [
      { id: "evt-004a", at: "2026-05-05", actorName: "System", note: "Continuous absence recorded." },
      { id: "evt-004b", at: "2026-06-02", actorName: "HR", note: "28-day review completed — referral to OH agreed." },
      { id: "evt-004c", at: "2026-06-03", actorName: "HR", note: "Referred to Occupational Health. Assessment scheduled." },
    ],
  },
];
