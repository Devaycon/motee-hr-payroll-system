import {
  House,
  LayoutDashboard,
  BriefcaseBusiness,
  Building2,
  Network,
  GitFork,
  Users,
  Layers,
  ListOrdered,
  CalendarRange,
  UserRoundPlus,
  Timer,
  UserRoundMinus,
  ClipboardCheck,
  TrendingUp,
  GraduationCap,
  Clock,
  CalendarDays,
  Wallet,
  Star,
  CircleDollarSign,
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
  Scale,
  Settings,
  LucideIcon,
  Hand,
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
    group: "My Workspace",
    icon: BriefcaseBusiness,
    label: "Overview",
    link: "/my-workspace",
    badge: 10,
    exact: true,
  },
  {
    group: "My Workspace",
    icon: ClipboardList,
    label: "Tasks",
    link: "/my-workspace/tasks",
  },
  {
    group: "My Workspace",
    icon: CalendarDays,
    label: "Events",
    link: "/my-workspace/events",
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
    icon: Users,
    label: "Employees",
    link: "/organization/employees",
    badge: 247,
  },
  {
    group: "Organization",
    icon: Layers,
    label: "Employment Types",
    link: "/organization/employment-types",
  },
  {
    group: "Organization",
    icon: ClipboardList,
    label: "Employee Checklist",
    link: "/organization/employee-checklist",
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
    icon: UserRoundPlus,
    label: "Recruitment",
    link: "/talent/recruitment",
    badge: 12,
  },
  {
    group: "Talent",
    icon: Timer,
    label: "Onboarding",
    link: "/talent/onboarding",
    badge: 5,
  },
  {
    group: "Talent",
    icon: UserRoundMinus,
    label: "Offboarding",
    link: "/talent/offboarding",
  },
  {
    group: "Talent",
    icon: ClipboardCheck,
    label: "Employee Checklists",
    link: "/talent/checklists",
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
    icon: Wallet,
    label: "Payroll",
    link: "/time-payroll/payroll",
  },
  {
    group: "Time & Payroll",
    icon: Star,
    label: "Benefits",
    link: "/time-payroll/benefits",
  },
  {
    group: "Time & Payroll",
    icon: CircleDollarSign,
    label: "Compensation",
    link: "/time-payroll/compensation",
  },

  {
    group: "Operations",
    icon: Package,
    label: "Assets",
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
    group: "Operations",
    icon: BarChart3,
    label: "Workforce Planning",
    link: "/operations/workforce",
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
    icon: BookOpen,
    label: "Knowledge Base",
    link: "/workspace/knowledge",
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
    label: "Grievance & Disciplinary",
    link: "/admin/grievance",
  },
  {
    group: "Admin",
    icon: Settings,
    label: "Settings & Permissions",
    link: "/admin/settings",
  },
];
