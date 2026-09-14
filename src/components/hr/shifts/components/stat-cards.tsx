"use client";

import { CalendarClock, Users, Moon, ListChecks } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { isoDateOf, parseIsoDate } from "@/src/lib/types/attendance";
import { resolveShiftForDate } from "@/src/lib/stores/shifts-selectors";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import type { ShiftAssignment, ShiftTemplate } from "@/src/lib/types/shifts";

interface StatCardsProps {
  employees: LocaleEmployee[];
  templates: ShiftTemplate[];
  assignments: ShiftAssignment[];
  weekStart: string;
}

export function StatCards({
  employees,
  templates,
  assignments,
  weekStart,
}: StatCardsProps) {
  const todayIso = isoDateOf(new Date());

  const onShiftToday = employees.filter((e) =>
    resolveShiftForDate(e.id, todayIso, e.workPattern, templates, assignments),
  ).length;

  const nightShiftToday = employees.filter((e) => {
    const resolved = resolveShiftForDate(
      e.id,
      todayIso,
      e.workPattern,
      templates,
      assignments,
    );
    return resolved?.template.id === "SHIFT-NIGHT";
  }).length;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = parseIsoDate(weekStart);
    d.setDate(d.getDate() + i);
    return isoDateOf(d);
  });
  const rosteredThisWeek = new Set(
    assignments
      .filter((a) => weekDays.includes(a.date))
      .map((a) => a.employeeId),
  ).size;

  const cards: HrStatCardItem[] = [
    {
      label: "Shift Templates",
      value: templates.length,
      sub: "active shift patterns",
      icon: ListChecks,
      tone: "violet",
    },
    {
      label: "On Shift Today",
      value: onShiftToday,
      sub: `out of ${employees.length} employees`,
      icon: Users,
      tone: "emerald",
    },
    {
      label: "Night Shift Today",
      value: nightShiftToday,
      sub: "employees on the night shift",
      icon: Moon,
      tone: "blue",
    },
    {
      label: "Manually Rostered",
      value: rosteredThisWeek,
      sub: "employees with an explicit shift this week",
      icon: CalendarClock,
      tone: "amber",
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
