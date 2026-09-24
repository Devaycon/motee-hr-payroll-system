"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Users,
  CalendarCheck2,
  BarChart3,
  XCircle,
  Ban,
  CalendarClock,
  LogIn,
  Timer,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import { isOpenLeaveStatus } from "@/src/lib/types/leave";
import { departmentLeaveReport } from "@/src/lib/leave/department-ranking";
import type { LeaveRequest } from "../types";

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number | null {
  const from = new Date(a).getTime();
  const to = new Date(b).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round((to - from) / 86_400_000);
}

export interface LeaveMetrics {
  pending: number;
  currentlyOnLeave: number;
  approvedThisMonth: number;
  totalDaysApprovedThisYear: number;
  rejected: number;
  cancelled: number;
  upcoming7: number;
  upcoming30: number;
  returningToday: number;
  avgApprovalDays: number | null;
  /**
   * Every department sharing the most approved days this year — more than one
   * on a tie, so the card never crowns one department on sort order alone.
   */
  topDepartments: { names: string[]; days: number } | null;
  monthName: string;
  year: string;
}

/**
 * All leave KPIs in one memoised pass. These were computed inline on every
 * render, and "Total Days Approved" was captioned "this year" while filtering
 * no year at all (client feedback round 2, §F1/F14/F15).
 */
export function useLeaveMetrics(requests: LeaveRequest[]): LeaveMetrics {
  return useMemo(() => {
    const today = isoToday();
    const thisMonth = today.slice(0, 7);
    const thisYear = today.slice(0, 4);
    const in7 = addDays(today, 7);
    const in30 = addDays(today, 30);

    const approved = requests.filter((r) => r.status === "approved");

    const deptReport = departmentLeaveReport(requests, thisYear);

    // Mean days from submission to approval, over requests we can date.
    const turnarounds = approved
      .map((r) =>
        r.approvedAt && r.submittedAt
          ? daysBetween(r.submittedAt, r.approvedAt)
          : null,
      )
      .filter((n): n is number => n != null && n >= 0);

    return {
      pending: requests.filter((r) => isOpenLeaveStatus(r.status)).length,
      currentlyOnLeave: approved.filter(
        (r) => r.startDate <= today && r.endDate >= today,
      ).length,
      approvedThisMonth: approved.filter(
        (r) =>
          r.approvedAt?.slice(0, 7) === thisMonth ||
          (!r.approvedAt && r.submittedAt.slice(0, 7) === thisMonth),
      ).length,
      totalDaysApprovedThisYear: approved
        .filter((r) => r.startDate.slice(0, 4) === thisYear)
        .reduce((sum, r) => sum + r.totalDays, 0),
      rejected: requests.filter((r) => r.status === "rejected").length,
      cancelled: requests.filter((r) => r.status === "cancelled").length,
      upcoming7: approved.filter(
        (r) => r.startDate > today && r.startDate <= in7,
      ).length,
      upcoming30: approved.filter(
        (r) => r.startDate > today && r.startDate <= in30,
      ).length,
      // Their last day off was yesterday, so they're back at work today.
      returningToday: approved.filter(
        (r) => r.endDate === addDays(today, -1),
      ).length,
      avgApprovalDays: turnarounds.length
        ? Math.round(
            (turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length) * 10,
          ) / 10
        : null,
      topDepartments: deptReport.leaders.length
        ? { names: deptReport.leaders, days: deptReport.leaderDays }
        : null,
      monthName: new Date().toLocaleString("en-GB", { month: "long" }),
      year: thisYear,
    };
  }, [requests]);
}

/** The slice of requests a KPI card drills into. "all" shows every row. */
export type LeaveCardFilter =
  | "all"
  | "pending"
  | "on_leave"
  | "approved_month"
  | "approved_year"
  | "upcoming"
  | "returning"
  | "rejected"
  | "cancelled"
  | "approved"
  | "department";

export const LEAVE_CARD_FILTER_LABELS: Record<Exclude<LeaveCardFilter, "all">, string> = {
  pending: "Pending requests",
  on_leave: "Currently on leave",
  approved_month: "Approved this month",
  approved_year: "Approved leave this year",
  upcoming: "Starting in the next 7 days",
  returning: "Returning today",
  rejected: "Rejected requests",
  cancelled: "Cancelled leave",
  approved: "Approved requests",
  department: "Approved leave for department",
};

/**
 * The rows behind each card — the same rules `useLeaveMetrics` counts with,
 * so the list a card opens always has as many rows as the card says.
 */
export function matchesLeaveCardFilter(
  r: LeaveRequest,
  filter: LeaveCardFilter,
  m: Pick<LeaveMetrics, "year"> & { department?: string | null },
): boolean {
  const today = isoToday();
  const approved = r.status === "approved";
  switch (filter) {
    case "all":
      return true;
    case "pending":
      return isOpenLeaveStatus(r.status);
    case "on_leave":
      return approved && r.startDate <= today && r.endDate >= today;
    case "approved_month":
      return (
        approved &&
        (r.approvedAt?.slice(0, 7) === today.slice(0, 7) ||
          (!r.approvedAt && r.submittedAt.slice(0, 7) === today.slice(0, 7)))
      );
    case "approved_year":
      return approved && r.startDate.slice(0, 4) === m.year;
    case "upcoming":
      return approved && r.startDate > today && r.startDate <= addDays(today, 7);
    case "returning":
      return approved && r.endDate === addDays(today, -1);
    case "rejected":
      return r.status === "rejected";
    case "cancelled":
      return r.status === "cancelled";
    case "approved":
      return approved;
    case "department":
      return approved && r.startDate.slice(0, 4) === m.year && r.department === m.department;
  }
}

/** The department leave ranking — the report behind "Most Leave Taken". */
export const LEAVE_DEPARTMENTS_HREF = "/time-payroll/leave/departments";

interface StatCard {
  filter: Exclude<LeaveCardFilter, "all">;
  /** Opens a report page instead of filtering the Requests table. */
  href?: string;
  /** Full text for the tooltip when the value is truncated. */
  valueTitle?: string;
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  iconClass: string;
  bgClass: string;
}

interface StatCardsProps {
  requests: LeaveRequest[];
  /** The card drill-down currently applied. */
  cardFilter: LeaveCardFilter;
  /** Drill-down: filters the Requests tab to the rows a card counts. */
  onDrillDown: (filter: LeaveCardFilter) => void;
  /** Opens the "who is off today" panel (§F2). */
  onShowOnLeave?: () => void;
}

export function StatCards({
  requests,
  cardFilter,
  onDrillDown,
  onShowOnLeave,
}: StatCardsProps) {
  const m = useLeaveMetrics(requests);
  const router = useRouter();
  const leaders = m.topDepartments?.names ?? [];

  const cards: StatCard[] = [
    {
      filter: "pending",
      label: "Pending Requests",
      value: m.pending,
      sub: "Awaiting approval",
      icon: Clock,
      iconClass: "text-amber-500",
      bgClass: "bg-amber-500/10",
    },
    {
      filter: "on_leave",
      label: "Currently on Leave",
      value: m.currentlyOnLeave,
      sub:
        m.currentlyOnLeave === 1
          ? "1 employee absent today"
          : `${m.currentlyOnLeave} employees absent today`,
      icon: Users,
      iconClass: "text-blue-500",
      bgClass: "bg-blue-500/10",
    },
    {
      filter: "approved_month",
      label: `Approved in ${m.monthName}`,
      value: m.approvedThisMonth,
      sub: `Requests approved this month`,
      icon: CalendarCheck2,
      iconClass: "text-emerald-500",
      bgClass: "bg-emerald-500/10",
    },
    {
      filter: "approved_year",
      label: "Total Days Approved",
      value: m.totalDaysApprovedThisYear,
      sub: `Across all leave types in ${m.year}`,
      icon: BarChart3,
      iconClass: "text-violet-500",
      bgClass: "bg-violet-500/10",
    },
    {
      filter: "upcoming",
      label: "Upcoming Leave",
      value: m.upcoming7,
      sub: `Starting in the next 7 days · ${m.upcoming30} in 30`,
      icon: CalendarClock,
      iconClass: "text-sky-500",
      bgClass: "bg-sky-500/10",
    },
    {
      filter: "returning",
      label: "Returning Today",
      value: m.returningToday,
      sub: "Back at work today",
      icon: LogIn,
      iconClass: "text-teal-500",
      bgClass: "bg-teal-500/10",
    },
    {
      filter: "rejected",
      label: "Rejected Requests",
      value: m.rejected,
      sub: `${m.cancelled} cancelled`,
      icon: XCircle,
      iconClass: "text-rose-500",
      bgClass: "bg-rose-500/10",
    },
    {
      filter: "cancelled",
      label: "Cancelled Leave",
      value: m.cancelled,
      sub: "Withdrawn after submission",
      icon: Ban,
      iconClass: "text-slate-500",
      bgClass: "bg-slate-500/10",
    },
    {
      filter: "approved",
      label: "Average Approval Time",
      value: m.avgApprovalDays == null ? "—" : `${m.avgApprovalDays}d`,
      sub: "From submission to decision",
      icon: Timer,
      iconClass: "text-indigo-500",
      bgClass: "bg-indigo-500/10",
    },
    {
      filter: "department",
      href: `${LEAVE_DEPARTMENTS_HREF}?year=${m.year}`,
      label: "Most Leave Taken",
      value:
        leaders.length === 0
          ? "—"
          : leaders.length === 1
            ? leaders[0]
            : `${leaders.length} departments tied`,
      valueTitle: leaders.join(", "),
      sub: m.topDepartments
        ? leaders.length > 1
          ? `${leaders.join(", ")} · ${m.topDepartments.days} days each`
          : `${m.topDepartments.days} days approved in ${m.year}`
        : "No approved leave yet",
      icon: Building2,
      iconClass: "text-fuchsia-500",
      bgClass: "bg-fuchsia-500/10",
    },
  ];

  // Every tile is a drill-down (client feedback §F2, and the KPI-card rule
  // used across the app). `Card`'s own `py-6` is dropped so the row reads as
  // a compact figure strip rather than ten full-height cards.
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map((card) => {
        const active = !card.href && cardFilter === card.filter;
        const activate = () => {
          if (card.href) {
            router.push(card.href);
            return;
          }
          // Re-clicking the selected card clears back to the full list.
          onDrillDown(active ? "all" : card.filter);
          if (card.filter === "on_leave" && !active) onShowOnLeave?.();
        };
        return (
        <Card
          key={card.label}
          role="button"
          tabIndex={0}
          aria-pressed={active}
          title={
            card.href
              ? "Open the department leave ranking"
              : `Show ${LEAVE_CARD_FILTER_LABELS[card.filter].toLowerCase()}`
          }
          onClick={activate}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              activate();
            }
          }}
          className={cn(
            "py-0 cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active && "ring-2 ring-primary border-primary",
          )}
        >
          <CardContent className="px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground truncate">
                  {card.label}
                </p>
                <p
                  className={cn(
                    "font-bold mt-0.5 truncate leading-tight",
                    typeof card.value === "number" ? "text-xl" : "text-base",
                  )}
                  title={card.valueTitle || String(card.value)}
                >
                  {card.value}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {card.sub}
                </p>
              </div>
              <div
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-md shrink-0",
                  card.bgClass,
                )}
              >
                <card.icon className={cn("w-3.5 h-3.5", card.iconClass)} />
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
