/**
 * The in-depth "how this stage works" content for the Stage Guide tab —
 * pulled from the client's lifecycle feedback document. This is the
 * educational read; `data.ts` holds the shorter, link-driven summaries used
 * on the Journey Map tab.
 */

export interface LifecycleGuideSection {
  heading: string;
  bullets: string[];
}

export interface LifecycleCallout {
  title: string;
  body: string;
}

export type LifecycleExample =
  | {
      kind: "checklist";
      title: string;
      subtitle?: string;
      items: { label: string; state: "done" | "pending" | "warning" }[];
    }
  | {
      kind: "scorecard";
      title: string;
      rows: { criteria: string; score: string }[];
      overall: string;
    }
  | {
      kind: "table";
      title: string;
      columns: string[];
      rows: string[][];
    };

export interface LifecycleStageGuide {
  stageId: string;
  overview: string;
  flow: string[];
  sections?: LifecycleGuideSection[];
  callout?: LifecycleCallout;
  example?: LifecycleExample;
}

export const LIFECYCLE_STAGE_GUIDES: LifecycleStageGuide[] = [
  {
    stageId: "workforce-planning",
    overview:
      "Before a single vacancy exists, workforce planning answers a harder question: what does the organisation actually need, this year and next? It turns strategy — growth targets, restructures, succession risk — into a concrete, costed request to hire.",
    flow: [
      "Workforce Analytics",
      "Headcount Planning",
      "Skills Gap Analysis",
      "Succession Planning",
      "Scenario Planning",
      "Budget & Cost Planning",
      "Identify Workforce Need",
    ],
    sections: [
      {
        heading: "A position request can arise from",
        bullets: [
          "New headcount",
          "Replacement",
          "Growth",
          "Restructure",
          "Succession",
          "Skills gap",
          "Temporary / project need",
        ],
      },
      {
        heading: "A position request captures",
        bullets: [
          "Job title, department, reporting manager",
          "Reason — new headcount or replacement",
          "Number of positions, employment type",
          "Proposed salary / band, location",
          "Target start date",
          "Business justification, budget / cost centre",
        ],
      },
    ],
    callout: {
      title: "Approval flow",
      body: "Position Request → HR Review → Budget/Finance Approval (if required) → Management Approval → Position Approved. If it's rejected or returned, the manager gets a reason and can amend and resubmit.",
    },
  },
  {
    stageId: "requisition",
    overview:
      "A position request asks \"can we hire this person?\" A requisition says \"we're authorised — start the process.\" Keeping these as two distinct records, rather than collapsing them into one, is deliberate: approval to hire and the act of recruiting are different decisions, often made by different people.",
    flow: [
      "Approved Position",
      "Create Requisition",
      "Complete Job Description",
      "Approve Requisition",
      "Publish",
    ],
  },
  {
    stageId: "attract",
    overview:
      "Once a requisition is published, the job goes out into the world — internally, externally, or both — and the funnel begins to fill. This stage is about reach: getting the vacancy in front of the right people and turning interest into applications.",
    flow: [
      "Vacancy Published",
      "Applications",
      "Screening",
      "Shortlist",
      "Interview",
      "Offer",
    ],
  },
  {
    stageId: "select",
    overview:
      "This is where structure matters most — a real pipeline with defined stages, not folders being manually moved around. Every candidate moves through the same stages, scored against the same criteria, so a decision can be explained later, not just remembered.",
    flow: [
      "Applied",
      "Under Review",
      "Shortlisted",
      "Interview",
      "Scored",
      "Decision",
    ],
    callout: {
      title: "Why a structured scorecard, not just \"successful\"",
      body: "A defensible record of why a candidate was selected — relevant for audit and compliance, not just a UX nicety. Unsuccessful candidates are handled appropriately (communication or talent pool) subject to applicable data-protection requirements.",
    },
    example: {
      kind: "scorecard",
      title: "Interview scorecard",
      rows: [
        { criteria: "Experience", score: "4 / 5" },
        { criteria: "Technical competency", score: "5 / 5" },
        { criteria: "Communication", score: "4 / 5" },
        { criteria: "Values / culture", score: "4 / 5" },
        { criteria: "Role-specific questions", score: "18 / 20" },
      ],
      overall: "88%",
    },
  },
  {
    stageId: "pre-employment",
    overview:
      "Between \"we want this candidate\" and \"this person is now an employee,\" a surprising amount happens — enough that it earns its own stage rather than being buried inside Select or Onboarding. The moment an offer is accepted, the right checks should trigger automatically.",
    flow: [
      "Offer Generated",
      "Sent for E-signature",
      "Candidate Signs",
      "References / Guarantor",
      "Role-specific Checks",
      "Ready to Onboard",
    ],
    sections: [
      {
        heading: "References",
        bullets: [
          "Candidate nominates referees",
          "Motee sends the reference request",
          "Referee completes the form",
          "HR reviews → Complete",
        ],
      },
      {
        heading: "Guarantors (where applicable)",
        bullets: [
          "Candidate nominates a guarantor",
          "Request sent, information returned",
          "HR verifies → Complete",
        ],
      },
      {
        heading: "Other checks — conditional by role, country or organisation",
        bullets: [
          "Right to Work",
          "DBS / background checks",
          "Professional registrations",
          "Qualifications",
          "Occupational health",
        ],
      },
    ],
    callout: {
      title: "Rules-based, not one-size-fits-all",
      body: "A care worker, an accountant and a software engineer may all need different checks. This needs a configurable rules engine behind it, not a fixed checklist everyone goes through regardless of role.",
    },
  },
  {
    stageId: "onboard",
    overview:
      "The moment an offer is accepted, status changes from Candidate to New Starter, and a secure employee-portal invitation goes out. Onboarding works best with a clear split in who owns which fields — the employee shouldn't be asked for their own salary, and HR shouldn't be guessing a home address.",
    flow: [
      "Portal Invitation",
      "Employee Details",
      "HR Setup",
      "Documents & Acknowledgements",
      "Assets & Induction",
    ],
    sections: [
      {
        heading: "Employee completes",
        bullets: [
          "Personal details, address",
          "Emergency contacts, next of kin",
          "Bank details, tax information",
          "Requested documents, acknowledgements",
        ],
      },
      {
        heading: "HR completes",
        bullets: [
          "Employee ID, position, department",
          "Reporting manager, salary, employment type",
          "Start date, probation period",
          "Working pattern, location, cost centre",
        ],
      },
    ],
    example: {
      kind: "checklist",
      title: "Sarah Johnson — Onboarding",
      subtitle: "76% complete",
      items: [
        { label: "Personal details", state: "done" },
        { label: "Contract signed", state: "done" },
        { label: "Right to Work", state: "done" },
        { label: "Bank details", state: "done" },
        { label: "Laptop allocation", state: "pending" },
        { label: "Mandatory training", state: "pending" },
        { label: "Manager induction", state: "pending" },
      ],
    },
  },
  {
    stageId: "develop-perform-retain",
    overview:
      "The lifecycle doesn't end at hire — the recruitment record becomes the employee record, and it keeps driving four things that run continuously rather than as one-off steps: what they're equipped with, what they learn, how they perform, and whether they stay.",
    flow: ["Learning", "Objectives", "Probation", "Performance", "Career Development", "Recognition", "Engagement", "Retention"],
    sections: [
      {
        heading: "Assets",
        bullets: [
          "Laptop, phone, keys, ID / access card, equipment, vehicle",
          "Each asset needs: owner, issue date, condition, serial number, expected return",
        ],
      },
      {
        heading: "Learning & Development",
        bullets: [
          "Mandatory training by role, department or location",
          "Induction training, skills development",
          "Certifications and renewals",
        ],
      },
      {
        heading: "Performance",
        bullets: [
          "Probation review → objectives → check-ins",
          "Performance reviews → development plans",
          "Promotion / career progression",
        ],
      },
      {
        heading: "Engagement & Retention",
        bullets: [
          "Recognition, surveys, employee feedback",
          "Wellbeing, attendance / absence trends",
          "Benefits, retention indicators",
        ],
      },
    ],
    callout: {
      title: "The pitch line worth remembering",
      body: "\"Motee doesn't stop once you've hired someone. Their recruitment record becomes their employee record, which then drives onboarding, assets, learning, performance, engagement and eventually offboarding.\"",
    },
  },
  {
    stageId: "offboard",
    overview:
      "Every exit is different, but the shape of a good one isn't: notify, plan, transfer knowledge, recover what belongs to the company, remove access, and close the record with care. The core principle — assets allocated at onboarding should automatically appear here, as the same record, not re-entered from scratch.",
    flow: [
      "Notification & Approval",
      "Handover Planning",
      "Knowledge Transfer",
      "Asset Return",
      "Access Removal",
      "Final Documents",
      "Exit Interview",
      "Complete & Archive",
    ],
    example: {
      kind: "checklist",
      title: "John Smith — Leaving 30 September",
      items: [
        { label: "Manager notified", state: "done" },
        { label: "Exit interview scheduled", state: "done" },
        { label: "MacBook Pro — return required", state: "warning" },
        { label: "Building pass — return required", state: "warning" },
        { label: "IT account closure", state: "pending" },
        { label: "Final payroll", state: "pending" },
        { label: "P45 / final documents", state: "pending" },
      ],
    },
    sections: [
      {
        heading: "Knowledge transfer — a formal stage, not a note that a handover happened",
        bullets: [
          "1. Define what must be transferred — manager and departing employee identify key responsibilities, critical info, open work, exposure risk",
          "2. Assign handover recipient(s) — different topics can go to different people",
          "3. Document the knowledge in a structured record, not just conversations or email",
          "4. Conduct handover meetings between the departing employee and recipients",
          "5. Recipient confirms the knowledge was received and gaps resolved",
          "6. Manager signs off that the stage is complete before offboarding closes",
        ],
      },
      {
        heading: "Knowledge transfer checklist",
        bullets: [
          "Current projects, status, priorities, next actions",
          "Outstanding tasks, deadlines, commitments",
          "Recurring processes, routines, procedures",
          "Key internal contacts and responsibilities",
          "Key clients, suppliers, partners, stakeholders",
          "Shared folders, files and document locations",
          "Systems and tools used — access transferred through approved IT processes, never a shared personal password",
          "Reports, templates, trackers, working documents",
          "Role-specific procedures and practical know-how",
          "Known issues, risks, workarounds, lessons learned",
          "Upcoming meetings, events, renewals, key dates",
          "Responsibilities that must be reassigned after departure",
        ],
      },
      {
        heading: "Offboarding status, as it actually runs today",
        bullets: [
          "Pending → Approved → clearance in progress → Completed, with Disapproved and Reactivated as the two ways a record leaves the pipeline without the employee actually exiting",
          "The employee's own status moves in step: Active → Offboarding Notice while clearance runs, then Inactive once every clearance item and the exit interview are done",
        ],
      },
    ],
    callout: {
      title: "Trackable, not something that quietly gets missed",
      body: "e.g. \"Knowledge transfer is 60% complete — 5 working days until James Carter's last day\" or \"2 critical handover items have no assigned recipient.\" Surfacing this in the Action Centre is what makes it trackable rather than easy to lose.",
    },
  },
];

export function guideForStage(stageId: string): LifecycleStageGuide | undefined {
  return LIFECYCLE_STAGE_GUIDES.find((g) => g.stageId === stageId);
}
