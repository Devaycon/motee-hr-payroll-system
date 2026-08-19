import type { ComponentType } from "react";
import { AttendanceChart } from "./components/attendance-chart";
import { SatisfactionCard } from "./components/satisfaction-card";
import { SalaryDistributionCard } from "./components/salary-distribution-card";
import { HeadcountTrendCard } from "./components/headcount-trend-card";
import { GenderSplitCard } from "./components/gender-split-card";
import { UpcomingEventsCard } from "./components/upcoming-events-card";
import { UntakenLeaveCard } from "./components/employees-at-risk";
import { HrAlertsCard } from "@/src/components/hr/hr-alerts";

/**
 * The dashboard's customisable widgets (client feedback — dashboard
 * customisation). Registry order and `span` are the out-of-the-box layout;
 * `dashboard-layout-slice` stores any per-user departure from it.
 *
 * `span` is measured against a 6-column grid, which is what lets a widget be a
 * third (2), a half (3), two thirds (4) or full width (6) — the widths the old
 * hardcoded `grid-cols-3` / `grid-cols-5` rows were approximating.
 */
export interface DashboardWidget {
  key: string;
  label: string;
  component: ComponentType;
  /** Default column span out of 6. */
  span: number;
}

/** Spans a widget is allowed to take, in the order the width stepper cycles. */
export const WIDGET_SPANS = [2, 3, 4, 6] as const;

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  { key: "attendance", label: "Attendance", component: AttendanceChart, span: 4 },
  { key: "satisfaction", label: "Satisfaction", component: SatisfactionCard, span: 2 },
  { key: "salary", label: "Salary Distribution", component: SalaryDistributionCard, span: 2 },
  { key: "headcount", label: "Headcount Trend", component: HeadcountTrendCard, span: 2 },
  { key: "gender", label: "Gender Split", component: GenderSplitCard, span: 2 },
  { key: "alerts", label: "HR Action Centre", component: HrAlertsCard, span: 4 },
  { key: "untaken-leave", label: "Untaken Leave", component: UntakenLeaveCard, span: 2 },
  { key: "events", label: "Upcoming Events", component: UpcomingEventsCard, span: 6 },
];

const BY_KEY = new Map(DASHBOARD_WIDGETS.map((w) => [w.key, w]));

/**
 * Resolve the saved preferences against the registry: saved order first (minus
 * anything since removed from the registry), then any widget the saved layout
 * has never seen, so a newly shipped widget appears rather than vanishing.
 */
export function resolveWidgetOrder(savedOrder: string[]): DashboardWidget[] {
  const seen = new Set<string>();
  const ordered: DashboardWidget[] = [];
  for (const key of savedOrder) {
    const widget = BY_KEY.get(key);
    if (widget && !seen.has(key)) {
      ordered.push(widget);
      seen.add(key);
    }
  }
  for (const widget of DASHBOARD_WIDGETS) {
    if (!seen.has(widget.key)) ordered.push(widget);
  }
  return ordered;
}
