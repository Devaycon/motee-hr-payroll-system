import type {
  Suggestion,
  SuggestionCategory,
  SuggestionPriority,
  SuggestionStats,
  SuggestionStatus,
} from "@/src/lib/types/suggestions";

export const SUGGESTION_CATEGORY_CONFIG: Record<
  SuggestionCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  culture: {
    label: "Culture",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  process: {
    label: "Process",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  benefits: {
    label: "Benefits",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  tools: {
    label: "Tools",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  wellbeing: {
    label: "Wellbeing",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  management: {
    label: "Management",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  other: {
    label: "Other",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
};

export const SUGGESTION_STATUS_CONFIG: Record<
  SuggestionStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  submitted: {
    label: "Submitted",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
  under_review: {
    label: "Under Review",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  accepted: {
    label: "Accepted",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  in_progress: {
    label: "In Progress",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  implemented: {
    label: "Implemented",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  declined: {
    label: "Declined",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
};

export const SUGGESTION_PRIORITY_CONFIG: Record<
  SuggestionPriority,
  { label: string; color: string; bg: string; border: string }
> = {
  low: {
    label: "Low",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
  medium: {
    label: "Medium",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  high: {
    label: "High",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
};

export const SUGGESTION_CATEGORY_OPTIONS: SuggestionCategory[] = [
  "culture",
  "process",
  "benefits",
  "tools",
  "wellbeing",
  "management",
  "other",
];

export const SUGGESTION_STATUS_OPTIONS: SuggestionStatus[] = [
  "submitted",
  "under_review",
  "accepted",
  "in_progress",
  "implemented",
  "declined",
];

export const SUGGESTION_PRIORITY_OPTIONS: SuggestionPriority[] = [
  "low",
  "medium",
  "high",
];

export const SUGGESTIONS: Suggestion[] = [
  {
    id: "SUG-001",
    title: "Introduce a flexible work-from-home allowance",
    description:
      "Provide employees with a monthly allowance specifically for home office setup to improve remote working conditions.",
    category: "benefits",
    status: "implemented",
    priority: "high",
    isAnonymous: false,
    submitterName: "Adaeze Okonkwo",
    submitterInitials: "AO",
    submitterDept: "Engineering",
    upvotes: 47,
    upvotedBy: ["emp-001", "emp-002", "emp-003"],
    comments: [
      {
        id: "c-001",
        authorName: "HR Admin",
        authorInitials: "HA",
        authorDept: "Human Resources",
        message: "Great idea! We will review the feasibility and budget impact.",
        createdAt: "2026-02-14",
        isAdmin: true,
      },
      {
        id: "c-002",
        authorName: "Chidinma Okeke",
        authorInitials: "CO",
        authorDept: "HR",
        message: "This was discussed in last week's leadership meeting.",
        createdAt: "2026-02-18",
        isAdmin: true,
      },
    ],
    adminResponse:
      "We are pleased to confirm this will be rolled out in Q2. Monthly reimbursement of ₦15,000 will be added to payroll.",
    implementationNotes: "Added to April payroll cycle. Finance sign-off completed.",
    createdAt: "2026-02-10",
    updatedAt: "2026-03-25",
    resolvedAt: "2026-03-25",
    isFeatured: true,
    isTrending: false,
  },
  {
    id: "SUG-002",
    title: "Add a peer recognition wall in the company Slack",
    description:
      "Create a dedicated Slack channel where employees can publicly recognise and appreciate their peers.",
    category: "culture",
    status: "in_progress",
    priority: "medium",
    isAnonymous: false,
    submitterName: "Ibrahim Suleiman",
    submitterInitials: "IS",
    submitterDept: "Operations",
    upvotes: 31,
    upvotedBy: ["emp-002", "emp-004"],
    comments: [
      {
        id: "c-003",
        authorName: "HR Admin",
        authorInitials: "HA",
        authorDept: "Human Resources",
        message: "We love this idea. Setting up the channel now.",
        createdAt: "2026-03-10",
        isAdmin: true,
      },
    ],
    adminResponse: "Channel will be live by end of April.",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-10",
    isFeatured: false,
    isTrending: true,
  },
  {
    id: "SUG-003",
    title: "Reduce the number of status meetings per week",
    description:
      "We currently have too many recurring status meetings. Replacing some with async updates would increase productivity.",
    category: "process",
    status: "under_review",
    priority: "high",
    isAnonymous: false,
    submitterName: "Blessing Okafor",
    submitterInitials: "BO",
    submitterDept: "Finance",
    upvotes: 28,
    upvotedBy: ["emp-001", "emp-005"],
    comments: [],
    createdAt: "2026-03-15",
    updatedAt: "2026-03-15",
    isFeatured: false,
    isTrending: false,
  },
  {
    id: "SUG-004",
    title: "Provide access to a company mental health app",
    description:
      "Partner with a mental health platform to offer employees subsidised or free access to therapy and wellness tools.",
    category: "wellbeing",
    status: "accepted",
    priority: "high",
    isAnonymous: true,
    upvotes: 22,
    upvotedBy: ["emp-003"],
    comments: [
      {
        id: "c-004",
        authorName: "HR Admin",
        authorInitials: "HA",
        authorDept: "Human Resources",
        message: "We have shortlisted two platforms for negotiation.",
        createdAt: "2026-03-28",
        isAdmin: true,
      },
    ],
    adminResponse: "Evaluation in progress. Decision expected by end of Q2.",
    createdAt: "2026-03-18",
    updatedAt: "2026-03-28",
    isFeatured: false,
    isTrending: true,
  },
  {
    id: "SUG-005",
    title: "Upgrade the company's project management tooling",
    description:
      "The current project tracking tools are outdated. Migrating to a modern platform would improve visibility and reduce duplication.",
    category: "tools",
    status: "submitted",
    priority: "medium",
    isAnonymous: false,
    submitterName: "Mariam Yusuf",
    submitterInitials: "MY",
    submitterDept: "Product",
    upvotes: 14,
    upvotedBy: [],
    comments: [],
    createdAt: "2026-04-01",
    updatedAt: "2026-04-01",
    isFeatured: false,
    isTrending: false,
  },
  {
    id: "SUG-006",
    title: "Introduce 360-degree feedback for all managers",
    description:
      "Regular upward feedback would help managers grow and improve team morale significantly.",
    category: "management",
    status: "declined",
    priority: "low",
    isAnonymous: false,
    submitterName: "Yusuf Garba",
    submitterInitials: "YG",
    submitterDept: "HR",
    upvotes: 9,
    upvotedBy: ["emp-005"],
    comments: [
      {
        id: "c-005",
        authorName: "HR Admin",
        authorInitials: "HA",
        authorDept: "Human Resources",
        message:
          "We appreciate the idea but our current review cycle already covers this.",
        createdAt: "2026-03-22",
        isAdmin: true,
      },
    ],
    adminResponse:
      "After review, we have decided not to proceed at this time as it overlaps with our existing performance management process.",
    createdAt: "2026-03-10",
    updatedAt: "2026-03-22",
    resolvedAt: "2026-03-22",
    isFeatured: false,
    isTrending: false,
  },
];

export function computeSuggestionStats(suggestions: Suggestion[]): SuggestionStats {
  const total = suggestions.length;
  const implemented = suggestions.filter((s) => s.status === "implemented").length;
  const underReview = suggestions.filter(
    (s) => s.status === "under_review" || s.status === "accepted",
  ).length;
  const avgUpvotes =
    total > 0
      ? Math.round(suggestions.reduce((sum, s) => sum + s.upvotes, 0) / total)
      : 0;
  return { total, implemented, underReview, avgUpvotes };
}

export function getCategoryBreakdown(
  suggestions: Suggestion[],
): Record<SuggestionCategory, number> {
  const counts = {} as Record<SuggestionCategory, number>;
  for (const s of suggestions) {
    counts[s.category] = (counts[s.category] ?? 0) + 1;
  }
  return counts;
}

export function getStatusBreakdown(
  suggestions: Suggestion[],
): Record<SuggestionStatus, number> {
  const counts = {} as Record<SuggestionStatus, number>;
  for (const s of suggestions) {
    counts[s.status] = (counts[s.status] ?? 0) + 1;
  }
  return counts;
}

