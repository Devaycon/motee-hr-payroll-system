import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  UserCircle,
  Network,
  Megaphone,
  BookOpen,
  UsersRound,
  Users,
  LifeBuoy,
  CheckSquare,
  Receipt,
  FolderOpen,
  Plane,
  CalendarPlus,
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
  /** Only shown to users who manage at least one direct report. */
  managerOnly?: boolean;
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
    icon: UserCircle,
    label: "My Profile",
    link: "/profile/my-profile",
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
    label: "Calendar",
    link: "/employee/events",
  },
  {
    group: "Overview",
    icon: CheckSquare,
    label: "My Submissions",
    link: "/employee/submissions",
  },
  {
    group: "Overview",
    icon: Plane,
    label: "My Leave",
    link: "/time-off/balance",
  },
  {
    group: "Overview",
    icon: CalendarPlus,
    label: "Request Leave",
    link: "/time-off/request",
  },
  {
    group: "Overview",
    icon: Receipt,
    label: "My Expenses",
    link: "/employee/expenses",
  },
  {
    group: "Overview",
    icon: FolderOpen,
    label: "My Documents",
    link: "/employee/documents",
  },
  {
    group: "Overview",
    icon: Users,
    label: "My Team",
    link: "/employee/team",
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
