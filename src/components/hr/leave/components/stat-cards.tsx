"use client";

import { useMemo } from "react";
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
  topDepartment: { name: string; days: number } | null;
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

    const daysByDept = new Map<string, number>();
    for (const r of approved) {
      if (r.startDate.slice(0, 4) !== thisYear) continue;
      daysByDept.set(r.department, (daysByDept.get(r.department) ?? 0) + r.totalDays);
    }
    const topDepartmentEntry = [...daysByDept.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];

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
      topDepartment: topDepartmentEntry
        ? { name: topDepartmentEntry[0], days: topDepartmentEntry[1] }
        : null,
      monthName: new Date().toLocaleString("en-GB", { month: "long" }),
      year: thisYear,
    };
  }, [requests]);
}

interface StatCard {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  iconClass: string;
  bgClass: string;
}

interface StatCardsProps {
  requests: LeaveRequest[];
  /**
   * Opens the "who is off today" drill-down (§F2). Currently unused — the
   * tiles are deliberately not clickable; the prop and its wiring stay so the
   * drill-down can be switched back on without re-plumbing the page.
   */
  onShowOnLeave?: () => void;
}

export function StatCards({ requests }: StatCardsProps) {
  const m = useLeaveMetrics(requests);

  const cards: StatCard[] = [
    {
      label: "Pending Requests",
      value: m.pending,
      sub: "Awaiting approval",
      icon: Clock,
      iconClass: "text-amber-500",
      bgClass: "bg-amber-500/10",
    },
    {
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
      label: `Approved in ${m.monthName}`,
      value: m.approvedThisMonth,
      sub: `Requests approved this month`,
      icon: CalendarCheck2,
      iconClass: "text-emerald-500",
      bgClass: "bg-emerald-500/10",
    },
    {
      label: "Total Days Approved",
      value: m.totalDaysApprovedThisYear,
      sub: `Across all leave types in ${m.year}`,
      icon: BarChart3,
      iconClass: "text-violet-500",
      bgClass: "bg-violet-500/10",
    },
    {
      label: "Upcoming Leave",
      value: m.upcoming7,
      sub: `Starting in the next 7 days · ${m.upcoming30} in 30`,
      icon: CalendarClock,
      iconClass: "text-sky-500",
      bgClass: "bg-sky-500/10",
    },
    {
      label: "Returning Today",
      value: m.returningToday,
      sub: "Back at work today",
      icon: LogIn,
      iconClass: "text-teal-500",
      bgClass: "bg-teal-500/10",
    },
    {
      label: "Rejected Requests",
      value: m.rejected,
      sub: `${m.cancelled} cancelled`,
      icon: XCircle,
      iconClass: "text-rose-500",
      bgClass: "bg-rose-500/10",
    },
    {
      label: "Cancelled Leave",
      value: m.cancelled,
      sub: "Withdrawn after submission",
      icon: Ban,
      iconClass: "text-slate-500",
      bgClass: "bg-slate-500/10",
    },
    {
      label: "Average Approval Time",
      value: m.avgApprovalDays == null ? "—" : `${m.avgApprovalDays}d`,
      sub: "From submission to decision",
      icon: Timer,
      iconClass: "text-indigo-500",
      bgClass: "bg-indigo-500/10",
    },
    {
      label: "Most Leave Taken",
      value: m.topDepartment?.name ?? "—",
      sub: m.topDepartment
        ? `${m.topDepartment.days} days approved in ${m.year}`
        : "No approved leave yet",
      icon: Building2,
      iconClass: "text-fuchsia-500",
      bgClass: "bg-fuchsia-500/10",
    },
  ];

  // Every tile is inert for now — `Card`'s own `py-6` is dropped so the row
  // reads as a compact figure strip rather than ten full-height cards.
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="py-0">
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
                  title={String(card.value)}
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
      ))}
    </div>
  );
}
