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
  UserCircle,
  CheckSquare,
  Workflow,
  Receipt,
  Stethoscope,
  Plane,
  CalendarPlus,
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

export const routes: Route[] = [
  { group: "Overview", icon: Hand, label: "Welcome", link: "/welcome" },
  { group: "Overview", icon: LayoutDashboard, label: "Dashboard", link: "/hr" },
  {
    group: "Overview",
    icon: UserCircle,
    label: "My Profile",
    link: "/my-profile/profile",
  },
  {
    group: "Overview",
    icon: CheckSquare,
    label: "Submissions & Approvals",
    link: "/hr-action-center/submissions",
    badge: 5,
    exact: true,
  },

  {
    group: "My Workspace",
    icon: BriefcaseBusiness,
    label: "HR Action Center",
    link: "/hr-action-center",
    badge: 47,
    exact: true,
  },
  {
    group: "My Workspace",
    icon: ClipboardList,
    label: "My Tasks",
    link: "/hr-action-center/tasks",
  },
  {
    group: "My Workspace",
    icon: CalendarDays,
    label: "Calendar",
    link: "/hr-action-center/events",
  },
  {
    group: "My Workspace",
    icon: Receipt,
    label: "My Expenses",
    link: "/my-profile/expenses",
  },
  {
    group: "My Workspace",
    icon: Plane,
    label: "My Leave",
    link: "/my-time-off/balance",
  },
  {
    group: "My Workspace",
    icon: CalendarPlus,
    label: "Request Leave",
    link: "/my-time-off/request",
  },
  {
    group: "My Workspace",
    icon: Workflow,
    label: "Workflows",
    link: "/hr-action-center/workflows",
  },
  {
    group: "My Workspace",
    icon: UsersRound,
    label: "My Team",
    link: "/hr-action-center/team",
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

  {
    group: "Talent",
    icon: TrendingUp,
    label: "Performance",
    link: "/talent/performance",
  },
  {
    group: "Talent",
    icon: GraduationCap,
    label: "Learning & Development",
    link: "/talent/training",
  },
  {
    group: "Talent",
    icon: BookOpen,
    label: "Knowledge Base",
    link: "/workspace/knowledge",
  },

  {
    group: "Time & Payroll",
    icon: Clock,
    label: "Attendance",
    link: "/time-payroll/attendance",
  },
  {
    group: "Time & Payroll",
    icon: CalendarDays,
    label: "Leave Management",
    link: "/time-payroll/leave",
    badge: 3,
  },
  {
    group: "Time & Payroll",
    icon: Stethoscope,
    label: "Occupational Health",
    link: "/time-payroll/occupational-health",
  },

  {
    group: "Operations",
    icon: Package,
    label: "Assets Tracking",
    link: "/operations/assets",
  },
  {
    group: "Operations",
    icon: Library,
    label: "Documents & Compliance",
    link: "/operations/documents",
  },
  {
    group: "Operations",
    icon: FileText,
    label: "Contracts",
    link: "/operations/contracts",
  },
  {
    group: "Operations",
    icon: TrendingUpDown,
    label: "Reports & Analytics",
    link: "/operations/reports",
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
    icon: LifeBuoy,
    label: "HR Help Desk",
    link: "/workspace/helpdesk",
  },

  {
    group: "Engagement",
    icon: UsersRound,
    label: "Community",
    link: "/workspace/community",
  },

  {
    group: "Admin",
    icon: ShieldCheck,
    label: "Access Levels",
    link: "/admin/access-levels",
  },
  {
    group: "Admin",
    icon: ClipboardList,
    label: "Audit Trail",
    link: "/admin/audit-trail",
  },
  {
    group: "Admin",
    icon: Scale,
    label: "Employee Relations Cases",
    link: "/admin/grievance",
  },
  {
    group: "Admin",
    icon: Settings,
    label: "Settings & Configuration",
    link: "/admin/settings",
  },
];
