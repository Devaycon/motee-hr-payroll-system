"use client";

import { Skeleton } from "@/src/components/ui/skeleton";
import { isoDateOf } from "@/src/lib/types/attendance";
import { TodayShiftCard } from "./components/today-shift-card";
import { ShiftMonthCalendar } from "./components/shift-month-calendar";
import {
  useMyShiftIdentity,
  useShiftTemplates,
  useShiftAssignments,
} from "./hooks";

export function MyShiftsPage() {
  const { employeeId, workPattern, loading } = useMyShiftIdentity();
  const templates = useShiftTemplates();
  const assignments = useShiftAssignments();
  const todayIso = isoDateOf(new Date());

  if (loading && !employeeId) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-4xl font-semibold">My Shifts</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          See which shift you&apos;re on and what&apos;s coming up
        </p>
      </div>

      <TodayShiftCard />

      {employeeId && (
        <ShiftMonthCalendar
          employeeId={employeeId}
          workPattern={workPattern}
          templates={templates}
          assignments={assignments}
          todayIso={todayIso}
        />
      )}
    </div>
  );
}
