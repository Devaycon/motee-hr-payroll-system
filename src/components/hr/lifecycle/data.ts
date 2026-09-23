import {
  BarChart3,
  FileStack,
  Megaphone,
  Search,
  FileCheck2,
  DoorOpen,
  TrendingUp,
  LogOut,
  Handshake,
  CalendarClock,
  Umbrella,
  HeartPulse,
  Coins,
  GraduationCap,
  Target,
  Sparkles,
  Inbox,
  Workflow,
  FolderOpen,
  Package,
  ShieldCheck,
  BarChart2,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export type LifecycleStageColor =
  | "blue"
  | "emerald"
  | "violet"
  | "rose"
  | "amber"
  | "cyan"
  | "indigo"
  | "slate";

/** Tailwind classes per stage colour — kept as literal strings so the JIT scanner finds them. */
export const STAGE_COLOR_CLASSES: Record<
  LifecycleStageColor,
  { bg: string; text: string; ring: string; border: string; solid: string; gradient: string }
> = {
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/30",
    border: "border-blue-500/40",
    solid: "bg-blue-500",
    gradient: "from-blue-500",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
    border: "border-emerald-500/40",
    solid: "bg-emerald-500",
    gradient: "from-emerald-500",
  },
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/30",
    border: "border-violet-500/40",
    solid: "bg-violet-500",
    gradient: "from-violet-500",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-500/30",
    border: "border-rose-500/40",
    solid: "bg-rose-500",
    gradient: "from-rose-500",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/30",
    border: "border-amber-500/40",
    solid: "bg-amber-500",
    gradient: "from-amber-500",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    ring: "ring-cyan-500/30",
    border: "border-cyan-500/40",
    solid: "bg-cyan-500",
    gradient: "from-cyan-500",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    ring: "ring-indigo-500/30",
    border: "border-indigo-500/40",
    solid: "bg-indigo-500",
    gradient: "from-indigo-500",
  },
  slate: {
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    ring: "ring-slate-500/30",
    border: "border-slate-500/40",
    solid: "bg-slate-500",
    gradient: "from-slate-500",
  },
};

/**
 * The same eight colours as raw hex, for the one place a Tailwind class won't
 * do — the storyline's connecting thread, which needs real CSS colour stops
 * to build a `linear-gradient` that flows from stage to stage.
 */
export const STAGE_COLOR_HEX: Record<LifecycleStageColor, string> = {
  blue: "#3b82f6",
  emerald: "#10b981",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  amber: "#f59e0b",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  slate: "#64748b",
};

export interface LifecycleSubLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface LifecycleStage {
  id: string;
  step: number;
  label: string;
  question: string;
  description: string;
  icon: LucideIcon;
  color: LifecycleStageColor;
  /** Primary destination when the stage card itself is clicked. */
  href: string;
  /**
   * A broad stage (like "Develop, Perform & Retain") fans out into several
   * modules rather than having one number to show — shown as chips instead
   * of a single metric badge.
   */
  subLinks?: LifecycleSubLink[];
}

/**
 * The canonical 8-stage model — reconciled from the client's four
 * inconsistent versions (see MOTEE_Employee_Lifecycle_Feedback.md) by taking
 * the fullest, most descriptive label and grouping from the full poster.
 * Flag any rename back to the client before this ships as their language —
 * the source document explicitly disagreed with itself on stage names.
 */
export const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: "workforce-planning",
    step: 1,
    label: "Workforce Planning",
    question: "What people and skills do we need, now and next?",
    description:
      "Turn business strategy into workforce needs through headcount planning, skills-gap analysis, succession planning and workforce forecasting.",
    icon: BarChart3,
    color: "blue",
    href: "/talent/workforce-requests",
  },
  {
    id: "requisition",
    step: 2,
    label: "Requisition",
    question: "We're approved — ready to recruit.",
    description:
      "Turn an approved position into a recruitment-ready requisition, with the role details, job description and required approvals in place.",
    icon: FileStack,
    color: "emerald",
    href: "/talent/requisition",
  },
  {
    id: "attract",
    step: 3,
    label: "Attract",
    question: "How do we reach and engage the right talent?",
    description:
      "Publish and promote the vacancy across the right channels to attract suitable candidates and build the applicant pipeline.",
    icon: Megaphone,
    color: "violet",
    href: "/talent/recruitment",
  },
  {
    id: "select",
    step: 4,
    label: "Select",
    question: "Who is the best fit?",
    description:
      "Review, shortlist, interview and assess candidates using consistent criteria to make fair, evidence-based selection decisions.",
    icon: Search,
    color: "rose",
    href: "/talent/recruitment",
  },
  {
    id: "pre-employment",
    step: 5,
    label: "Pre-employment",
    question: "Secure the hire and confirm they're ready to join.",
    description:
      "Make the offer, capture acceptance and complete the required references, checks and approvals before onboarding begins.",
    icon: FileCheck2,
    color: "amber",
    // No dedicated page for this stage — Hire Tracker is where every hiring
    // effort, including this one, is actually tracked.
    href: "/talent/hire-tracker",
  },
  {
    id: "onboard",
    step: 6,
    label: "Onboard",
    question: "Set them up for success from day one.",
    description:
      "Welcome the new starter, complete their employee setup, documents and induction, and make sure everything is ready for a successful start.",
    icon: DoorOpen,
    color: "cyan",
    href: "/talent/onboarding",
  },
  {
    id: "develop-perform-retain",
    step: 7,
    label: "Develop, Perform & Retain",
    question: "How do we help our people grow, perform and stay?",
    description:
      "Support employees throughout their journey with continuous development, performance, recognition and engagement — helping people grow, succeed and stay.",
    icon: TrendingUp,
    color: "indigo",
    href: "/talent/performance",
    subLinks: [
      { label: "Performance", href: "/talent/performance", icon: Target },
      { label: "Learning & Development", href: "/talent/training", icon: GraduationCap },
      { label: "Engagement", href: "/workspace/surveys", icon: Sparkles },
    ],
  },
  {
    id: "offboard",
    step: 8,
    label: "Offboarding",
    question: "How do we manage a smooth and responsible transition?",
    description:
      "Coordinate the employee's departure through handover, knowledge transfer, asset return, access removal and final exit activities — with every action tracked through to completion.",
    icon: LogOut,
    color: "slate",
    href: "/talent/offboarding",
  },
];

export interface LifecycleBandItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** "Ongoing People Management" — continuous, not tied to one stage. */
export const ONGOING_MANAGEMENT_ITEMS: LifecycleBandItem[] = [
  { label: "Employee Relations", href: "/admin/grievance", icon: Handshake },
  { label: "Attendance", href: "/time-payroll/attendance", icon: CalendarClock },
  { label: "Leave", href: "/time-payroll/leave", icon: Umbrella },
  { label: "Wellbeing", href: "/time-payroll/occupational-health", icon: HeartPulse },
  { label: "Compensation & Benefits", href: "/organization/benefit-plans", icon: Coins },
  { label: "Learning & Development", href: "/talent/training", icon: GraduationCap },
  { label: "Performance", href: "/talent/performance", icon: Target },
  { label: "Engagement", href: "/workspace/surveys", icon: BarChart2 },
];

/** "Platform Foundations" — the shared capabilities that keep every stage connected, not tied to one stage. */
export const SUPPORTING_SERVICES_ITEMS: LifecycleBandItem[] = [
  { label: "HR Action Centre", href: "/hr-action-center", icon: Inbox },
  { label: "Workflows & Approvals", href: "/hr-action-center/workflows", icon: Workflow },
  { label: "Documents & E-signatures", href: "/operations/documents", icon: FolderOpen },
  { label: "Assets", href: "/operations/assets", icon: Package },
  { label: "Compliance", href: "/operations/documents", icon: ShieldCheck },
  { label: "Analytics & Insights", href: "/operations/analytics", icon: BarChart2 },
  { label: "Audit Trail", href: "/admin/audit-trail", icon: ClipboardList },
];
