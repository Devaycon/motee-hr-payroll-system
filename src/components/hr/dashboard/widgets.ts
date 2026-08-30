import type { ComponentType } from "react";
import { AttendanceChart } from "./components/attendance-chart";
import { UpcomingEventsCard } from "./components/upcoming-events-card";
import { UntakenLeaveCard } from "./components/employees-at-risk";
import { PeopleKpiRow, LeaveKpiRow } from "./components/stat-cards";
import { TurnoverGaugeCard } from "./components/turnover-gauge-card";
import {
  GenderSplitTile,
  HeadcountTrendTile,
  DeptHeadcountTile,
  EmploymentTypeTile,
} from "./components/people-tiles";
import {
  PresentWeeklyCard,
  LateWeeklyCard,
  AbsentWeeklyCard,
} from "./components/attendance-summary-cards";
import {
  SickDaysTile,
  AbsenceRateTile,
  AverageSpellTile,
  OhCasesTile,
  SicknessTrendTile,
  SicknessByReasonTile,
  OhFitnessTile,
  TopAbsenteesTile,
} from "./components/sickness-tiles";
import {
  ActionCentreTotal,
  CriticalAlertsTile,
  WarningAlertsTile,
  InfoAlertsTile,
  AlertsByCategoryTile,
} from "./components/action-centre-summary";
import {
  EventsThisWeekTile,
  EventsByTypeTile,
} from "./components/events-summary-card";
import { HrAlertsCard } from "@/src/components/hr/hr-alerts";

/**
 * The dashboard's four tabs. Each answers one question, so a user looking for
 * headcount never has to scroll past attendance charts to reach it.
 */
export const DASHBOARD_TABS = [
  { key: "people", label: "People" },
  { key: "attendance", label: "Attendance" },
  { key: "sickness", label: "Sickness" },
  { key: "priorities", label: "Priorities" },
  { key: "events", label: "Events" },
] as const;

export type DashboardTabKey = (typeof DASHBOARD_TABS)[number]["key"];

/**
 * The dashboard's customisable widgets (client feedback — dashboard
 * customisation). Registry order and `span` are the out-of-the-box layout;
 * `dashboard-layout-slice` stores any per-user departure from it.
 *
 * `span` is measured against a 12-column grid, which is what lets a widget be a
 * quarter (3), a third (4), a half (6) or full width (12) — the four widths the
 * mockup's rows are built from.
 *
 * `tab` decides which tab a widget belongs to. Keys stay unique across every
 * tab, which is what lets the saved layout stay a single flat list of keys.
 */
export interface DashboardWidget {
  key: string;
  label: string;
  component: ComponentType;
  /** Default column span out of 12. */
  span: number;
  tab: DashboardTabKey;
}

/** Spans a widget is allowed to take, in the order the width stepper cycles. */
export const WIDGET_SPANS = [3, 4, 6, 12] as const;

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  // People — who is here and how that is changing. The KPI tiles ship as one
  // full-width row so they are never stretched to a gauge's height; the three
  // gauge/chart tiles then share a row of their own.
  { key: "people-kpis", label: "Headcount KPIs", component: PeopleKpiRow, span: 12, tab: "people" },
  { key: "turnover", label: "Turnover Rate", component: TurnoverGaugeCard, span: 4, tab: "people" },
  { key: "employment-type", label: "Employment Type", component: EmploymentTypeTile, span: 4, tab: "people" },
  { key: "headcount", label: "Headcount Trend", component: HeadcountTrendTile, span: 4, tab: "people" },
  { key: "dept-headcount", label: "Dept. Headcount", component: DeptHeadcountTile, span: 6, tab: "people" },
  { key: "gender", label: "Gender Split", component: GenderSplitTile, span: 6, tab: "people" },

  // Attendance — who turned up, and who is off.
  { key: "att-present", label: "Present", component: PresentWeeklyCard, span: 4, tab: "attendance" },
  { key: "att-late", label: "Late Arrivals", component: LateWeeklyCard, span: 4, tab: "attendance" },
  { key: "att-absent", label: "Absent", component: AbsentWeeklyCard, span: 4, tab: "attendance" },
  { key: "leave-kpis", label: "Leave Requests", component: LeaveKpiRow, span: 12, tab: "attendance" },
  { key: "untaken-leave", label: "Untaken Leave", component: UntakenLeaveCard, span: 12, tab: "attendance" },
  // The full 30-day trend sits below the summary tiles — the tiles say what is
  // happening this week, this says how the month has gone.
  { key: "attendance", label: "Attendance Trends", component: AttendanceChart, span: 12, tab: "attendance" },

  // Sickness — absence and the occupational health cases it drives. Tiles link
  // into Leave Management and Occupational Health, the modules that own the data.
  { key: "sick-days", label: "Sick Days", component: SickDaysTile, span: 3, tab: "sickness" },
  { key: "sick-rate", label: "Absence Rate", component: AbsenceRateTile, span: 3, tab: "sickness" },
  { key: "sick-spell", label: "Average Spell", component: AverageSpellTile, span: 3, tab: "sickness" },
  { key: "sick-oh-cases", label: "OH Cases", component: OhCasesTile, span: 3, tab: "sickness" },
  { key: "sick-trend", label: "Sickness Trend", component: SicknessTrendTile, span: 4, tab: "sickness" },
  { key: "sick-reason", label: "By Reason", component: SicknessByReasonTile, span: 4, tab: "sickness" },
  { key: "sick-fitness", label: "Fitness for Work", component: OhFitnessTile, span: 4, tab: "sickness" },
  { key: "sick-top", label: "Highest Sickness Absence", component: TopAbsenteesTile, span: 12, tab: "sickness" },

  // Priorities — what needs doing.
  { key: "alerts-total", label: "HR Action Centre", component: ActionCentreTotal, span: 12, tab: "priorities" },
  { key: "alerts-critical", label: "Critical", component: CriticalAlertsTile, span: 4, tab: "priorities" },
  { key: "alerts-warning", label: "Warning", component: WarningAlertsTile, span: 4, tab: "priorities" },
  { key: "alerts-info", label: "Info", component: InfoAlertsTile, span: 4, tab: "priorities" },
  { key: "alerts-by-category", label: "By Category", component: AlertsByCategoryTile, span: 12, tab: "priorities" },
  // { key: "alerts", label: "HR Priorities Today", component: HrAlertsCard, span: 12, tab: "priorities" },

  // Events — what is coming up.
  { key: "events-week", label: "This Week", component: EventsThisWeekTile, span: 6, tab: "events" },
  { key: "events-type", label: "Events by Type", component: EventsByTypeTile, span: 6, tab: "events" },
  { key: "events", label: "Upcoming Events", component: UpcomingEventsCard, span: 12, tab: "events" },
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
