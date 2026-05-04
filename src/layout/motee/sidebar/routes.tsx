import {
  LayoutDashboard,
  Building2,
  Receipt,
  FileBarChart,
  CreditCard,
  TrendingUp,
  Flag,
  Boxes,
  Megaphone,
  Activity,
  Ticket,
  ScrollText,
  UserRoundCog,
  Settings,
  ClipboardList,
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
    link: "/motee",
  },

  { group: "Tenants", icon: Building2, label: "All Tenants", link: "/tenants" },
  {
    group: "Tenants",
    icon: Building2,
    label: "Tenant Profiles",
    link: "/tenants/profiles",
  },
  {
    group: "Tenants",
    icon: Building2,
    label: "Onboard New Tenant",
    link: "/tenants/onboard",
  },
  {
    group: "Tenants",
    icon: Building2,
    label: "Suspend / Offboard",
    link: "/tenants/suspend-offboard",
  },

  { group: "Billing", icon: Receipt, label: "Overview", link: "/billing" },
  {
    group: "Billing",
    icon: FileBarChart,
    label: "Invoices",
    link: "/billing/invoices",
  },
  {
    group: "Billing",
    icon: CreditCard,
    label: "Plans",
    link: "/billing/plans",
  },
  {
    group: "Billing",
    icon: TrendingUp,
    label: "Revenue",
    link: "/billing/revenue",
  },

  {
    group: "Platform",
    icon: Flag,
    label: "Feature Flags",
    link: "/platform/feature-flags",
  },
  {
    group: "Platform",
    icon: Boxes,
    label: "Modules",
    link: "/platform/modules",
  },
  {
    group: "Platform",
    icon: Megaphone,
    label: "Notices",
    link: "/platform/notices",
  },
  {
    group: "Platform",
    icon: Activity,
    label: "Health",
    link: "/platform/health",
  },

  {
    group: "Support",
    icon: Ticket,
    label: "Tickets",
    link: "/support/tickets",
  },
  {
    group: "Support",
    icon: ScrollText,
    label: "Activity Logs",
    link: "/support/activity-logs",
  },
  {
    group: "Support",
    icon: UserRoundCog,
    label: "Impersonate",
    link: "/support/impersonate",
  },

  { group: "Settings", icon: Settings, label: "Settings", link: "/settings" },
  {
    group: "Settings",
    icon: ClipboardList,
    label: "Audit Trail",
    link: "/settings/audit-trail",
  },
];
