import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  UserCircle,
  FileText,
  Receipt,
  Gift,
  CalendarOff,
  Clock,
  CalendarCheck,
  TrendingUp,
  GraduationCap,
  Network,
  Megaphone,
  BookOpen,
  UsersRound,
  LifeBuoy,
  Settings,
  Package2,
  ScrollText,
  LucideIcon,
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
  children?: RouteChild[];
}

export const routes: Route[] = [
  {
    group: "Overview",
    icon: LayoutDashboard,
    label: "Dashboard",
    link: "/employee/dashboard",
  },
  {
    group: "Overview",
    icon: ClipboardList,
    label: "My Tasks",
    link: "/employee/tasks",
  },
  {
    group: "Overview",
    icon: CalendarDays,
    label: "My Events",
    link: "/employee/events",
  },

  {
    group: "My Profile",
    icon: UserCircle,
    label: "Profile",
    link: "/profile/my-profile",
  },
  {
    group: "My Profile",
    icon: FileText,
    label: "Documents",
    link: "/profile/documents",
  },
  {
    group: "My Profile",
    icon: Receipt,
    label: "Payslips",
    link: "/profile/payslips",
  },
  {
    group: "My Profile",
    icon: Gift,
    label: "Benefits",
    link: "/profile/benefits",
  },
  {
    group: "My Profile",
    icon: Package2,
    label: "Assets",
    link: "/profile/assets",
  },
  {
    group: "My Profile",
    icon: ScrollText,
    label: "Contracts",
    link: "/profile/contracts",
  },

  {
    group: "Time Off",
    icon: CalendarOff,
    label: "Request Leave",
    link: "/time-off/request",
  },
  {
    group: "Time Off",
    icon: Clock,
    label: "Attendance",
    link: "/time-off/attendance",
  },
  {
    group: "Time Off",
    icon: CalendarCheck,
    label: "Leave Balance",
    link: "/time-off/balance",
  },

  {
    group: "Growth",
    icon: TrendingUp,
    label: "Performance",
    link: "/growth/performance",
  },
  {
    group: "Growth",
    icon: GraduationCap,
    label: "Training",
    link: "/growth/training",
  },

  {
    group: "Company",
    icon: Network,
    label: "Organisation",
    link: "/company/org-chart",
  },
  {
    group: "Company",
    icon: Megaphone,
    label: "Announcements",
    link: "/company/announcements",
  },
  {
    group: "Company",
    icon: BookOpen,
    label: "Knowledge Base",
    link: "/company/knowledge",
  },
  {
    group: "Company",
    icon: UsersRound,
    label: "Community",
    link: "/company/community",
  },
  {
    group: "Company",
    icon: LifeBuoy,
    label: "HR Help Desk",
    link: "/company/helpdesk",
  },
];
