import {
  Briefcase,
  CalendarCheck,
  CalendarDays,
  Flag,
  Heart,
  Stethoscope,
  Users,
} from "lucide-react";

/**
 * The dashboard's tabs. Each answers one question, so a user looking for
 * headcount never has to scroll past attendance charts to reach it.
 */
export const DASHBOARD_TABS = [
  { key: "people", label: "Employees", icon: Users },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "sickness", label: "Sickness", icon: Stethoscope },
  { key: "priorities", label: "Priorities", icon: Flag },
  { key: "events", label: "Events", icon: CalendarDays },
  { key: "resourcing", label: "Resourcing", icon: Briefcase },
  { key: "engagement", label: "Engagement", icon: Heart },
] as const;

export type DashboardTabKey = (typeof DASHBOARD_TABS)[number]["key"];
