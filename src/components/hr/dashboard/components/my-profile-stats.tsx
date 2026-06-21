"use client";

import {
  CalendarDays,
  ListTodo,
  Users,
  UserRound,
  Receipt,
  MapPin,
  FileText,
  GraduationCap,
} from "lucide-react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

interface Figures {
  leave: number;
  documents: number;
  expenses: number;
  expensesPending: number;
  courses: number;
  tasks: number;
  bookings: number;
  reports: number;
  years: number;
}

const EMPTY: Figures = {
  leave: 0,
  documents: 0,
  expenses: 0,
  expensesPending: 0,
  courses: 0,
  tasks: 0,
  bookings: 0,
  reports: 0,
  years: 0,
};

/** Personal figures for the logged-in user (falls back to a real employee). */
function useMyFigures(): Figures {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const { data } = useLocaleSection<Figures>((b) => {
    const me =
      (employeeId ? b.employees.find((e) => e.id === employeeId) : null) ??
      b.employees.find((e) => e.status === "active") ??
      b.employees[0] ??
      null;
    if (!me) return EMPTY;

    const balances = ((b.leaveBalances ?? []) as Array<{
      employeeId?: string;
      totalEntitlement?: number;
      daysUsed?: number;
    }>).filter((x) => x.employeeId === me.id);
    const leave = balances.reduce(
      (s, x) => s + ((x.totalEntitlement ?? 0) - (x.daysUsed ?? 0)),
      0,
    );

    const documents = ((b.documents ?? []) as Array<{ employeeId?: string }>).filter(
      (d) => d.employeeId === me.id,
    ).length;

    const myExpenses = (b.expenses ?? []).filter((x) => x.employeeId === me.id);
    const expenses = myExpenses.length;
    const expensesPending = myExpenses.filter(
      (x) => x.status === "submitted",
    ).length;

    const enrollments = (
      (b.learning as { enrollments?: Array<{ employeeId?: string; status?: string }> })
        ?.enrollments ?? []
    ).filter((x) => x.employeeId === me.id);
    const courses = enrollments.filter((x) => x.status !== "completed").length;

    const tasks = ((b.tasks ?? []) as Array<{ assigneeId?: string; status?: string }>).filter(
      (t) => t.assigneeId === me.id && t.status !== "done" && t.status !== "completed",
    ).length;

    const bookings = (b.locationBookings ?? []).filter(
      (x) => x.employeeId === me.id && x.status === "confirmed",
    ).length;

    const reports = b.employees.filter((e) => e.managerId === me.id).length;

    const ref = b._meta?.referenceDate ? new Date(b._meta.referenceDate) : new Date();
    const years = me.startDate
      ? Math.max(0, Math.floor((ref.getTime() - new Date(me.startDate).getTime()) / YEAR_MS))
      : 0;

    return {
      leave,
      documents,
      expenses,
      expensesPending,
      courses,
      tasks,
      bookings,
      reports,
      years,
    };
  });
  return data ?? EMPTY;
}

export function MyProfileStats() {
  const f = useMyFigures();
  const stats: HrStatCardItem[] = [
    {
      icon: CalendarDays,
      label: "My Leave",
      value: f.leave,
      sub: "days remaining",
      link: "/my-time-off/balance",
    },
    {
      icon: FileText,
      label: "My Documents",
      value: f.documents,
      sub: "personal documents",
      link: "/my-profile/documents",
    },
    {
      icon: Receipt,
      label: "My Expenses",
      value: f.expenses,
      sub: `${f.expensesPending} pending approval`,
      link: "/my-profile/expenses",
    },
    {
      icon: GraduationCap,
      label: "My Courses",
      value: f.courses,
      sub: "in progress / assigned",
      link: "/talent/training",
    },
    {
      icon: ListTodo,
      label: "Open Tasks",
      value: f.tasks,
      sub: "assigned to me",
      link: "/hr-action-center/tasks",
    },
    {
      icon: MapPin,
      label: "Location Bookings",
      value: f.bookings,
      sub: "confirmed bookings",
      link: "/my-profile/profile",
    },
    {
      icon: Users,
      label: "Direct Reports",
      value: f.reports,
      sub: "team members",
      link: "/hr-action-center/team",
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
