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
// Self-service shows one person their own record, so it is never narrowed
// by the admin shell's branch switcher.
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
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

/**
 * The employee's own headline figures, each linking to the self-service page
 * that owns it. Sits below the day-at-a-glance row, which covers *today*;
 * this covers the standing picture of their record.
 */
export function MyProfileStats() {
  const f = useMyFigures();
  const stats: HrStatCardItem[] = [
    {
      icon: CalendarDays,
      label: "My Leave",
      value: f.leave,
      sub: "Days remaining",
      link: "/time-off/balance",
    },
    {
      icon: FileText,
      label: "My Documents",
      value: f.documents,
      sub: "Personal documents",
      link: "/employee/documents",
    },
    {
      icon: Receipt,
      label: "My Expenses",
      value: f.expenses,
      sub: `${f.expensesPending} Pending approval`,
      link: "/employee/expenses",
    },
    {
      icon: GraduationCap,
      label: "My Courses",
      value: f.courses,
      sub: "In progress / Assigned",
      link: "/growth/training",
    },
    {
      icon: ListTodo,
      label: "Open Tasks",
      value: f.tasks,
      sub: "Assigned to me",
      link: "/employee/tasks",
    },
    {
      icon: MapPin,
      label: "Location Bookings",
      value: f.bookings,
      sub: "Confirmed bookings",
      // No standalone bookings page — deep-link the profile module that owns it.
      link: "/profile/my-profile?module=bookings",
    },
    {
      icon: Users,
      label: "Direct Reports",
      value: f.reports,
      sub: "Team members",
      // My Team moved into the profile's Team module — deep-link it there.
      link: "/profile/my-profile?module=team",
    },
    {
      icon: UserRound,
      label: "Years of Service",
      value: f.years,
      sub: "With the company",
      link: "/profile/my-profile",
    },
  ];

  return (
    <section className="flex flex-col gap-3">
      {/* <h2 className="text-lg font-bold text-foreground">My Profile Stats</h2> */}
      <HrStatCardsGrid stats={stats} columns={4} />
    </section>
  );
}
