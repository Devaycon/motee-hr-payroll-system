"use client";

import { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";
import { useUnscopedLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type { LocaleEmployee, LocaleWorkPattern } from "@/src/lib/types/locale";
import type { CalItem } from "./model";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export interface Shift {
  start: string;
  end: string;
  hours: number;
}

export function isoDay(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Working hours for a day, from the person's pattern (Mon–Fri 09:00–17:30 if none). */
export function shiftFor(pattern: LocaleWorkPattern | undefined, date: Date): Shift | null {
  const fallback = date.getDay() === 0 || date.getDay() === 6 ? null : { start: "09:00", end: "17:30" };
  const slot = pattern ? pattern.schedule[DAY_KEYS[date.getDay()]] ?? null : fallback;
  if (!slot) return null;
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const hours = Math.max(0, (toMin(slot.end) - toMin(slot.start) - (pattern?.breakMinutes ?? 60)) / 60);
  return { start: slot.start, end: slot.end, hours: Math.round(hours * 100) / 100 };
}

/** Diagonal hatching for non-working days. */
export const HATCH_STYLE: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklab, currentColor 10%, transparent) 6px 7px)",
};

// ── Locally stored events ────────────────────────────────────────────────────

export interface StoredEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  description?: string;
  category: string;
  /** Set for personal events; absent for company-wide events. */
  employeeId?: string;
}

function useStoredEvents(key: string) {
  const [events, setEvents] = useState<StoredEvent[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const save = useCallback(
    (next: StoredEvent[]) => {
      setEvents(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // storage unavailable — keep for this session
      }
    },
    [key],
  );
  return { events, save };
}

const LEAVE_LABELS: Record<string, string> = {
  annual: "Annual leave",
  maternity: "Maternity leave",
  paternity: "Paternity leave",
  unpaid: "Unpaid leave",
  compassionate: "Compassionate leave",
  study: "Study leave",
  religious: "Hajj / pilgrimage leave",
  sick: "Sickness absence",
};

/**
 * People, their schedules and the events the viewer has added. Sickness
 * is always shown as "Sickness absence" — never the reason.
 */
export function useCalendarData() {
  const { data } = useUnscopedLocaleSection((bundle) => ({
    employees: bundle.employees.filter((e) => e.status !== "terminated" && e.status !== "left"),
    holidays: (bundle.events ?? [])
      .filter((e) => e.type === "holiday")
      .map((e) => ({ id: e.id, title: e.title, date: e.start.slice(0, 10) })),
  }));
  const leave = useAppSelector((s) => s.leave.requests);
  const sickness = useAppSelector((s) => s.sickness.records);
  const me = useAppSelector((s) => s.auth.user?.employeeId);
  const personal = useStoredEvents("motee:personalCalendarEvents");
  const company = useStoredEvents("motee:companyCalendarEvents");

  const employees = useMemo(() => data?.employees ?? [], [data]);
  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const holidayItems = useMemo<CalItem[]>(
    () =>
      (data?.holidays ?? []).map((h) => ({
        id: `hol-${h.id}`,
        title: h.title,
        date: h.date,
        allDay: true,
        category: "holiday",
        layer: "holidays",
      })),
    [data],
  );

  /** Leave, sickness, cover and personal events for one person. */
  const scheduleFor = useCallback(
    (personId: string): CalItem[] => {
      const name = byId.get(personId)?.fullName;
      const out: CalItem[] = [];
      for (const r of leave) {
        if (r.status === "rejected" || r.status === "cancelled") continue;
        const pending = r.status !== "approved";
        if (r.employeeId === personId) {
          out.push({
            id: `lv-${r.id}`,
            title: `${LEAVE_LABELS[r.leaveType] ?? "Leave"}${pending ? " (pending)" : ""}`,
            date: r.startDate,
            endDate: r.endDate,
            allDay: true,
            category: pending ? "leave_request" : "leave",
            layer: "schedule",
            personId,
            personName: name,
            pending,
          });
        }
        if (r.reliefEmployeeId === personId) {
          out.push({
            id: `cv-${r.id}`,
            title: `Covering ${r.employeeName}`,
            date: r.startDate,
            endDate: r.endDate,
            allDay: true,
            category: "cover",
            layer: "schedule",
            personId,
            personName: name,
          });
        }
      }
      for (const r of sickness) {
        if (r.employeeId !== personId || r.approvalStatus === "rejected" || r.approvalStatus === "cancelled") continue;
        out.push({
          id: `sk-${r.id}`,
          title: r.kind === "medical_procedure" ? "Medical appointment" : "Sickness absence",
          date: r.startDate,
          endDate: r.endDate ?? r.expectedReturnDate ?? isoDay(new Date()),
          allDay: true,
          category: "sickness",
          layer: "schedule",
          personId,
          personName: name,
        });
      }
      for (const e of personal.events) {
        if (e.employeeId !== personId) continue;
        out.push({
          id: e.id,
          title: e.title,
          date: e.date,
          startTime: e.startTime,
          endTime: e.endTime,
          allDay: e.allDay,
          description: e.description,
          category: "personal",
          layer: "schedule",
          personId,
          personName: name,
          deletable: "personal",
        });
      }
      return out;
    },
    [leave, sickness, personal.events, byId],
  );

  const customCompany = useMemo<CalItem[]>(
    () =>
      company.events.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        allDay: e.allDay,
        description: e.description,
        category: e.category,
        layer: "company" as const,
        deletable: "company" as const,
      })),
    [company.events],
  );

  /** My team: people who share my manager (plus me); a top-level boss gets their reports. */
  const teamOf = useCallback(
    (personId: string): LocaleEmployee[] => {
      const self = byId.get(personId);
      if (!self) return [];
      if (!self.managerId) return [self, ...employees.filter((e) => e.managerId === self.id)];
      return employees.filter((e) => e.managerId === self.managerId);
    },
    [byId, employees],
  );
  const reportsOf = useCallback((id: string) => employees.filter((e) => e.managerId === id), [employees]);

  let seq = 0;
  const newId = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

  return {
    ready: !!data,
    employees,
    byId,
    me,
    holidayItems,
    customCompany,
    scheduleFor,
    teamOf,
    reportsOf,
    addPersonal: (items: Omit<StoredEvent, "id" | "category">[]) =>
      personal.save([...personal.events, ...items.map((x) => ({ ...x, id: newId("pe"), category: "personal" }))]),
    addCompany: (item: Omit<StoredEvent, "id">) => company.save([...company.events, { ...item, id: newId("ce") }]),
    remove: (item: CalItem) => {
      if (item.deletable === "personal") personal.save(personal.events.filter((e) => e.id !== item.id));
      if (item.deletable === "company") company.save(company.events.filter((e) => e.id !== item.id));
    },
  };
}

export type CalendarData = ReturnType<typeof useCalendarData>;
