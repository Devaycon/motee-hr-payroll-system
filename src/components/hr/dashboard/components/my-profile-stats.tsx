"use client";

import { CalendarDays, ListTodo, Users, UserRound } from "lucide-react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

interface Figures {
  leave: number;
  tasks: number;
  reports: number;
  years: number;
}

/** Personal figures for the logged-in user (falls back to a real employee). */
function useMyFigures(): Figures {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const { data } = useLocaleSection<Figures>((b) => {
    const me =
      (employeeId ? b.employees.find((e) => e.id === employeeId) : null) ??
      b.employees.find((e) => e.status === "active") ??
      b.employees[0] ??
      null;
    if (!me) return { leave: 0, tasks: 0, reports: 0, years: 0 };

    const balances = ((b.leaveBalances ?? []) as Array<{
      employeeId?: string;
      totalEntitlement?: number;
      daysUsed?: number;
    }>).filter((x) => x.employeeId === me.id);
    const leave = balances.reduce(
      (s, x) => s + ((x.totalEntitlement ?? 0) - (x.daysUsed ?? 0)),
      0,
    );

    const tasks = ((b.tasks ?? []) as Array<{ assigneeId?: string; status?: string }>).filter(
      (t) => t.assigneeId === me.id && t.status !== "done" && t.status !== "completed",
    ).length;

    const reports = b.employees.filter((e) => e.managerId === me.id).length;

    const ref = b._meta?.referenceDate ? new Date(b._meta.referenceDate) : new Date();
    const years = me.startDate
      ? Math.max(0, Math.floor((ref.getTime() - new Date(me.startDate).getTime()) / YEAR_MS))
      : 0;

    return { leave, tasks, reports, years };
  });
  return data ?? { leave: 0, tasks: 0, reports: 0, years: 0 };
}

export function MyProfileStats() {
  const f = useMyFigures();
  const stats: HrStatCardItem[] = [
    {
      icon: CalendarDays,
      label: "Leave Balance",
      value: f.leave,
      sub: "days remaining",
      link: "/my-time-off/balance",
    },
    {
      icon: ListTodo,
      label: "Open Tasks",
      value: f.tasks,
      sub: "assigned to me",
      link: "/hr-action-center/tasks",
    },
    {
      icon: Users,
      label: "Direct Reports",
      value: f.reports,
      sub: "team members",
      link: "/organization/employees",
    },
    {
      icon: UserRound,
      label: "Years of Service",
      value: f.years,
      sub: "with the company",
      link: "/my-profile/profile",
    },
  ];
  return <HrStatCardsGrid stats={stats} columns={4} />;
}
