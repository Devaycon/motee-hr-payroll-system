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
    question: "What workforce do we need, now and next?",
    description:
      "Headcount planning, skills-gap analysis and succession planning turn strategy into a position request.",
    icon: BarChart3,
    color: "blue",
    href: "/talent/workforce-requests",
  },
  {
    id: "requisition",
    step: 2,
    label: "Requisition",
    question: "We're authorised — start the process.",
    description:
      "An approved position becomes a requisition: job description drafted, approved and published.",
    icon: FileStack,
    color: "emerald",
    href: "/talent/requisition",
  },
  {
    id: "attract",
    step: 3,
    label: "Attract",
    question: "Reach and engage the right talent.",
    description:
      "The vacancy goes live, applications come in, and the field narrows to a shortlist.",
    icon: Megaphone,
    color: "violet",
    href: "/talent/recruitment",
  },
  {
    id: "select",
    step: 4,
    label: "Select",
    question: "Assess and choose the best fit.",
    description:
      "Structured interviews and scorecards build a defensible record of why a candidate was chosen.",
    icon: Search,
    color: "rose",
    href: "/talent/recruitment",
  },
  {
    id: "pre-employment",
    step: 5,
    label: "Pre-employment",
    question: "Make the offer, then confirm it.",
    description:
      "Offer, acceptance, references, guarantors and role-specific checks — rules-based, not one-size-fits-all.",
    icon: FileCheck2,
    color: "amber",
    href: "/talent/onboarding",
  },
  {
    id: "onboard",
    step: 6,
    label: "Onboard",
    question: "Welcome them, and set them up to succeed.",
    description:
      "Candidate becomes New Starter. Employee details, HR setup, documents and induction, tracked to 100%.",
    icon: DoorOpen,
    color: "cyan",
    href: "/talent/onboarding",
  },
  {
    id: "develop-perform-retain",
    step: 7,
    label: "Develop, Perform & Retain",
    question: "Help people grow, and want to stay.",
    description:
      "The lifecycle keeps running: assets, learning, performance and engagement, not a one-time step.",
    icon: TrendingUp,
    color: "indigo",
    href: "/talent/performance",
    subLinks: [
      { label: "Performance", href: "/talent/performance", icon: Target },
      { label: "Learning & Development", href: "/talent/training", icon: GraduationCap },
      { label: "Assets", href: "/operations/assets", icon: Package },
      { label: "Engagement", href: "/workspace/surveys", icon: Sparkles },
    ],
  },
  {
    id: "offboard",
    step: 8,
    label: "Offboard",
    question: "Manage the transition with care.",
    description:
      "Knowledge transfer, asset return and access removal — the same records, closed out with care.",
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

/** "Services Supporting Everything" — platform-level, not tied to one stage. */
export const SUPPORTING_SERVICES_ITEMS: LifecycleBandItem[] = [
  { label: "HR Action Centre", href: "/hr-action-center", icon: Inbox },
  { label: "Workflows", href: "/hr-action-center/workflows", icon: Workflow },
  { label: "Documents", href: "/operations/documents", icon: FolderOpen },
  { label: "Assets", href: "/operations/assets", icon: Package },
  { label: "Compliance", href: "/operations/documents", icon: ShieldCheck },
  { label: "Analytics", href: "/operations/analytics", icon: BarChart2 },
  { label: "Audit Trail", href: "/admin/audit-trail", icon: ClipboardList },
];
