/**
 * The dashboard's tabs. Each answers one question, so a user looking for
 * headcount never has to scroll past attendance charts to reach it.
 */
export const DASHBOARD_TABS = [
  { key: "people", label: "Employees" },
  { key: "attendance", label: "Attendance" },
  { key: "sickness", label: "Sickness" },
  { key: "priorities", label: "Priorities" },
  { key: "events", label: "Events" },
  { key: "resourcing", label: "Resourcing" },
  { key: "engagement", label: "Engagement" },
] as const;

export type DashboardTabKey = (typeof DASHBOARD_TABS)[number]["key"];
