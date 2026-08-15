import {
  LayoutDashboard,
  BriefcaseBusiness,
  Building2,
  Network,
  GitFork,
  Users,
  Layers,
  Globe2,
  ListOrdered,
  CalendarRange,
  UserRoundPlus,
  Timer,
  UserRoundMinus,
  TrendingUp,
  GraduationCap,
  Clock,
  CalendarDays,
  Package,
  Library,
  FileText,
  TrendingUpDown,
  BarChart3,
  Bell,
  Award,
  Lightbulb,
  BarChart2,
  LifeBuoy,
  BookOpen,
  UsersRound,
  ShieldCheck,
  ClipboardList,
  FileStack,
  Scale,
  Settings,
  LucideIcon,
  Hand,
  CheckSquare,
  Workflow,
  Stethoscope,
  UserCog,
  FolderKanban,
} from "lucide-react";

export interface RouteChild {
  label: string;
  link: string;
}

export interface Route {
  icon?: LucideIcon;
  label: string;
  link: string;
  group: string;
  badge?: number;
  exact?: boolean;
  children?: RouteChild[];
}

/**
 * HR/admin navigation.
 *
 * Self-service entries (My Profile, My Expenses, My Leave, Request Leave) used
 * to live here and duplicated the employee portal. They were removed in favour
 * of the Admin Service / Self-Service toggle in the navbar — the admin sidebar
 * now carries admin features only (client feedback §4.3).
 *
 * §4 / §4.15–4.16 — the information architecture is grouped by *what the user
 * is trying to do*, not by which team built the feature. The old "Talent",
 * "Time & Payroll" and "Operations" groups mixed unrelated jobs together:
 * Occupational Health sat under Time & Payroll, and Asset Management under
 * Operations alongside Reports. The groups below are the ones the client named.
 *
 * Group order in the sidebar follows first appearance in this array, so the
 * order here is the order on screen.
 */
export const routes: Route[] = [
  { group: "Overview", icon: Hand, label: "Welcome", link: "/welcome" },
  { group: "Overview", icon: LayoutDashboard, label: "Dashboard", link: "/hr" },
  {
    group: "Overview",
    icon: CheckSquare,
    label: "Submissions & Approvals",
    link: "/hr-action-center/submissions",
    badge: 5,
    exact: true,
  },

  {
    group: "Workspace",
    icon: BriefcaseBusiness,
    label: "HR Action Center",
    link: "/hr-action-center",
    badge: 47,
    exact: true,
  },
  {
    group: "Workspace",
    icon: ClipboardList,
    label: "My Tasks",
    link: "/hr-action-center/tasks",
  },
  {
    group: "Workspace",
    icon: CalendarDays,
    label: "Calendar",
    link: "/hr-action-center/events",
  },
  {
    group: "Workspace",
    icon: Workflow,
    label: "Workflows",
    link: "/hr-action-center/workflows",
  },
  {
    group: "Workspace",
    icon: FolderKanban,
    label: "Projects",
    link: "/workspace/projects",
  },
  {
    group: "Employee Management",
    icon: Users,
    label: "Employees",
    link: "/organization/employees",
  },
  {
    group: "Employee Management",
    icon: Globe2,
    label: "Employer of Record",
    link: "/organization/eor",
  },
  {
    group: "Employee Management",
    icon: Layers,
    label: "Employment Types",
    link: "/organization/employment-types",
  },
    {
    group: "Employee Management",
    icon: Scale,
    label: "Employee Relations Cases",
    link: "/admin/grievance",
  },
  {
    group: "Employee Management",
    icon: BarChart3,
    label: "Workforce Planning",
    link: "/operations/workforce",
  },
  {
    group: "Employee Management",
    icon: ClipboardList,
    label: "Workforce Requests",
    link: "/talent/workforce-requests",
    badge: 6,
    exact: true,
  },
  {
    group: "Employee Management",
    icon: FileStack,
    label: "Requisition",
    link: "/talent/requisition",
    badge: 4,
    exact: true,
  },
  {
    group: "Employee Management",
    icon: UserRoundPlus,
    label: "Recruitment",
    link: "/talent/recruitment",
    badge: 10,
  },
  {
    group: "Employee Management",
    icon: Timer,
    label: "Onboarding",
    link: "/talent/onboarding",
    badge: 5,
  },
  {
    group: "Employee Management",
    icon: UserRoundMinus,
    label: "Offboarding",
    link: "/talent/offboarding",
  },
  {
    group: "Organization",
    icon: Building2,
    label: "Company Profile",
    link: "/organization/company",
  },
  {
    group: "Organization",
    icon: Network,
    label: "Departments",
    link: "/organization/departments",
  },
  {
    group: "Organization",
    icon: GitFork,
    label: "Structure & Hierarchy",
    link: "/organization/structure",
  },
  {
    group: "Organization",
    icon: ListOrdered,
    label: "Roles & Positions",
    link: "/organization/roles",
  },
  {
    group: "Organization",
    icon: CalendarRange,
    label: "Headcount Planning",
    link: "/organization/headcount",
  },

  // §4.16 — what the company does *for* an employee across their time here:
  // how they're developed, and how their time is accounted for.
  {
    group: "Employee Services",
    icon: TrendingUp,
    label: "Performance",
    link: "/talent/performance",
  },
  {
    group: "Employee Services",
    icon: GraduationCap,
    label: "Learning & Development",
    link: "/talent/training",
  },
  {
    group: "Employee Services",
    icon: Clock,
    label: "Attendance",
    link: "/time-payroll/attendance",
  },
  {
    group: "Employee Services",
    icon: CalendarDays,
    label: "Leave Management",
    link: "/time-payroll/leave",
    badge: 3,
  },

  // §4.16 — Occupational Health was buried under "Time & Payroll", which is
  // not where anyone would look for it.
  {
    group: "Health & Wellbeing",
    icon: Stethoscope,
    label: "Occupational Health",
    link: "/time-payroll/occupational-health",
  },
  {
    group: "Health & Wellbeing",
    icon: LifeBuoy,
    label: "HR Help Desk",
    link: "/workspace/helpdesk",
  },

  // §4.15 — the reference material and company property an employee needs
  // access to, rather than a person-shaped record.
  {
    group: "Knowledge & Resources",
    icon: BookOpen,
    label: "Knowledge Base",
    link: "/workspace/knowledge",
  },
  {
    group: "Knowledge & Resources",
    icon: Library,
    label: "Documents & Compliance",
    link: "/operations/documents",
  },
  {
    group: "Knowledge & Resources",
    icon: FileText,
    label: "Contracts",
    link: "/operations/contracts",
  },
  {
    group: "Knowledge & Resources",
    icon: Package,
    label: "Asset Management",
    link: "/operations/assets",
  },

  {
    group: "Engagement",
    icon: Bell,
    label: "Announcements",
    link: "/workspace/announcements",
    badge: 2,
  },
  {
    group: "Engagement",
    icon: Award,
    label: "Kudos & Recognition",
    link: "/workspace/kudos",
  },
  {
    group: "Engagement",
    icon: Lightbulb,
    label: "Employee Suggestions",
    link: "/workspace/suggestions",
  },
  {
    group: "Engagement",
    icon: BarChart2,
    label: "Surveys & Engagement",
    link: "/workspace/surveys",
  },
  {
    group: "Engagement",
    icon: UsersRound,
    label: "Community",
    link: "/workspace/community",
  },

  // Reports sat under "Operations" next to Assets and Contracts, which said
  // nothing about what it is. It is the only reporting surface, so it gets
  // named as one.
  {
    group: "Insights",
    icon: TrendingUpDown,
    label: "Reports & Analytics",
    link: "/operations/reports",
  },

  {
    group: "Admin",
    icon: ShieldCheck,
    label: "Roles & Permissions",
    link: "/admin/access-levels",
  },
  {
    group: "Admin",
    icon: UserCog,
    label: "User Management",
    link: "/admin/users",
  },
  {
    group: "Admin",
    icon: ClipboardList,
    label: "Audit Trail",
    link: "/admin/audit-trail",
  },
  {
    group: "Admin",
    icon: Settings,
    label: "Settings & Configuration",
    link: "/admin/settings",
  },
];
