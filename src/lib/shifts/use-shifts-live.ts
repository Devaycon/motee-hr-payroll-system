"use client";

/**
 * Signed in: mirrors shifts from the API into the shifts store the roster and
 * self-service screens read.
 *
 * - Templates are the attendance work schedules (`/attendance/schedules`);
 *   the API has no colour, so one is picked from the palette by position.
 * - Assignments come from the roster (`/shifts/roster`, HR) or your own
 *   (`/shifts/mine`), over a window from 4 weeks back to 12 weeks ahead.
 *
 * Writes go out through `shifts-api-listener`.
 */
import { useEffect, useMemo } from "react";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { useIsLive } from "@/src/lib/live/use-is-live";
import { replaceFromApi } from "@/src/lib/stores/shifts-slice";
import { toWorkSchedule } from "@/src/lib/attendance/api-mapping";
import { useGetWorkSchedulesQuery } from "@/src/store/services/attendance";
import { useGetMyShiftsQuery, useGetShiftRosterQuery } from "@/src/store/services/shifts";
import type { RosterResult } from "@/src/types/shifts";
import type { ShiftAssignment, ShiftTemplate } from "@/src/lib/types/shifts";

const PALETTE = ["#7F77DD", "#1D9E75", "#5B5FEF", "#D97706", "#E11D48", "#0EA5E9", "#65A30D"];

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function shiftWindow(now = new Date()): { from: string; to: string } {
  const from = new Date(now);
  from.setDate(from.getDate() - 28);
  const to = new Date(now);
  to.setDate(to.getDate() + 84);
  return { from: iso(from), to: iso(to) };
}

export function assignmentsFromRoster(roster: RosterResult | undefined): ShiftAssignment[] {
  if (!roster) return [];
  return roster.rows.flatMap((row) =>
    row.days
      .filter((d) => d.assignmentId && d.workScheduleId)
      .map((d) => ({
        id: d.assignmentId!,
        employeeId: row.employeeId,
        templateId: d.workScheduleId!,
        date: d.date.slice(0, 10),
        status:
          d.state === "cancelled" ? "cancelled" : d.state === "worked" ? "completed" : "scheduled",
        note: d.note ?? undefined,
      })),
  );
}

export function useShiftsLive(scope: "all" | "mine") {
  const live = useIsLive();
  const dispatch = useAppDispatch();
  const range = useMemo(() => shiftWindow(), []);
  const schedules = useGetWorkSchedulesQuery(undefined, { skip: !live });
  const roster = useGetShiftRosterQuery(
    { From: range.from, To: range.to },
    { skip: !live || scope !== "all" },
  );
  const mine = useGetMyShiftsQuery(range, { skip: !live || scope !== "mine" });
  const rosterData = scope === "all" ? roster.data?.data : mine.data?.data;

  // An employee may not be allowed to list every work schedule; their own
  // shifts still carry each shift's name and hours, so those stand in.
  const schedulesSettled = !!schedules.data || !!schedules.error;
  useEffect(() => {
    if (!live || !rosterData || !schedulesSettled) return;
    const templates: ShiftTemplate[] = schedules.data?.data
      ? schedules.data.data
          .filter((s) => s.isActive)
          .map((s, i) => {
            const w = toWorkSchedule(s);
            return {
              id: w.id,
              name: w.name,
              startTime: w.startTime,
              endTime: w.endTime,
              breakMinutes: w.breakMinutes,
              color: PALETTE[i % PALETTE.length]!,
              workDays: w.workDays,
              createdAt: w.createdAt,
            };
          })
      : templatesFromRoster(rosterData);
    dispatch(replaceFromApi({ templates, assignments: assignmentsFromRoster(rosterData) }));
  }, [live, schedules.data, schedulesSettled, rosterData, dispatch]);
}

/** One template per shift seen on the roster (name, hours and break as rostered). */
export function templatesFromRoster(roster: RosterResult): ShiftTemplate[] {
  const seen = new Map<string, ShiftTemplate>();
  for (const day of roster.rows.flatMap((r) => r.days)) {
    if (!day.workScheduleId || seen.has(day.workScheduleId)) continue;
    seen.set(day.workScheduleId, {
      id: day.workScheduleId,
      name: day.shiftName ?? "Shift",
      startTime: (day.startTime ?? "").slice(0, 5),
      endTime: (day.endTime ?? "").slice(0, 5),
      breakMinutes: day.breakMinutes ?? 0,
      color: PALETTE[seen.size % PALETTE.length]!,
      workDays: [],
      createdAt: "",
    });
  }
  return [...seen.values()];
}
