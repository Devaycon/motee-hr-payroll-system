"use client";

import { useMemo } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { isOpenLeaveStatus } from "@/src/lib/types/leave";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { CalEvent, EventType } from "./types";

interface RawEvent {
  id?: string;
  title?: string;
  type?: string;
  start?: string;
  end?: string;
  date?: string;
  description?: string;
  location?: string;
  allDay?: boolean;
}

function mapType(t?: string): EventType {
  if (t === "deadline" || t === "reminder" || t === "holiday") return t;
  if (t === "training") return "training";
  if (t === "all-hands" || t === "meeting") return "meeting";
  if (t === "birthday" || t === "anniversary") return t;
  return "meeting";
}

/**
 * Recurring date (birthday / work anniversary) projected onto the years around
 * today, so the calendar actually contains the celebrations the dashboard's
 * "Upcoming Birthdays" card counts (client feedback round 2, §E2).
 */
function recurringDates(monthDay: string): string[] {
  const year = new Date().getFullYear();
  return [year - 1, year, year + 1].map((y) => `${y}-${monthDay}`);
}

/** Extract a local "HH:mm" from an ISO datetime, or undefined if it has no time part. */
function toTime(iso?: string): string | undefined {
  if (!iso || !iso.includes("T")) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function buildEvents(bundle: LocaleBundle): CalEvent[] {
  const localeEvents: CalEvent[] = ((bundle.events ?? []) as RawEvent[]).map(
    (raw, i) => {
      const timed = raw.allDay !== true;
      return {
        id: raw.id ?? `ev-${i + 1}`,
        title: raw.title ?? "Event",
        date: (raw.start ?? raw.date ?? bundle.tenant.createdAt).slice(0, 10),
        type: mapType(raw.type),
        description: raw.description ?? raw.location,
        startTime: timed ? toTime(raw.start) : undefined,
        endTime: timed ? toTime(raw.end) : undefined,
        allDay: raw.allDay,
      };
    },
  );

  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));

  // Leave: approved/in-progress → "On leave"; pending → "Leave request".
  const leaveEvents: CalEvent[] = (bundle.leaveRequests ?? []).map((lr): CalEvent => {
    const name = employeesById.get(lr.employeeId)?.fullName ?? "Employee";
    const pending = lr.status === "pending" || lr.status === "awaiting_approval";
    return {
      id: `leave-${lr.id}`,
      title: pending
        ? `${name} — leave request`
        : `${name} on leave`,
      date: (lr.startDate ?? "").slice(0, 10),
      type: pending ? "leave_request" : "leave",
      description: `${lr.type} leave · ${lr.startDate} → ${lr.endDate}`,
      allDay: true,
    };
  }).filter((e) => e.date);

  // Training due soon: enrollments with a due date that aren't completed.
  const learn = bundle.learning as {
    enrollments?: Array<{
      id?: string;
      courseName?: string;
      employeeName?: string;
      status?: string;
      dueDate?: string;
    }>;
  };
  const trainingEvents: CalEvent[] = (learn?.enrollments ?? [])
    .filter((e) => e.dueDate && e.status !== "completed" && e.status !== "dropped")
    .map((e, i) => ({
      id: `train-${e.id ?? i}`,
      title: `${e.courseName ?? "Training"} due${e.employeeName ? ` — ${e.employeeName}` : ""}`,
      date: (e.dueDate ?? "").slice(0, 10),
      type: "training" as EventType,
      description: "Training completion due.",
      allDay: true,
    }))
    .filter((e) => e.date);

  // Birthdays and work anniversaries, generated from the employee records.
  const celebrationEvents: CalEvent[] = bundle.employees.flatMap((e) => {
    const out: CalEvent[] = [];
    if (e.dateOfBirth) {
      for (const date of recurringDates(e.dateOfBirth.slice(5, 10))) {
        out.push({
          id: `bday-${e.id}-${date.slice(0, 4)}`,
          title: `${e.fullName}'s birthday`,
          date,
          type: "birthday",
          description: `${e.jobTitle} · ${e.departmentName}`,
          allDay: true,
        });
      }
    }
    if (e.startDate) {
      const startYear = Number(e.startDate.slice(0, 4));
      for (const date of recurringDates(e.startDate.slice(5, 10))) {
        const years = Number(date.slice(0, 4)) - startYear;
        if (years < 1) continue; // the start date itself isn't an anniversary
        out.push({
          id: `anniv-${e.id}-${date.slice(0, 4)}`,
          title: `${e.fullName} — ${years} year${years === 1 ? "" : "s"} of service`,
          date,
          type: "anniversary",
          description: `${e.jobTitle} · ${e.departmentName}`,
          allDay: true,
        });
      }
    }
    return out;
  });

  return [...localeEvents, ...leaveEvents, ...trainingEvents, ...celebrationEvents];
}

export function useCalendarEvents() {
  return useLocaleSection<CalEvent[]>(buildEvents);
}

/**
 * "Covering" events, one per leave request with a relief assignee
 * (client feedback §3.2).
 *
 * Sourced from the leave slice rather than the locale bundle — relief
 * assignments are captured in the app, and the bundle fixtures predate them.
 */
export function useCoverEvents(): CalEvent[] {
  const requests = useAppSelector((s) => s.leave.requests);
  return useMemo(
    () =>
      requests
        .filter(
          (r) =>
            r.reliefEmployeeName &&
            (r.status === "approved" || isOpenLeaveStatus(r.status)),
        )
        .map((r) => ({
          id: `cover-${r.id}`,
          title: `${r.reliefEmployeeName} covering ${r.employeeName}`,
          date: r.startDate,
          type: "cover" as const,
          description: `Relief cover · ${r.startDate} → ${r.endDate}`,
          allDay: true,
        }))
        .filter((e) => e.date),
    [requests],
  );
}
