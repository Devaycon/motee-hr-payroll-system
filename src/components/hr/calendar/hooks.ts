"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
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
  if (t === "birthday" || t === "anniversary") return "reminder";
  return "meeting";
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

  return [...localeEvents, ...leaveEvents, ...trainingEvents];
}

export function useCalendarEvents() {
  return useLocaleSection<CalEvent[]>(buildEvents);
}
