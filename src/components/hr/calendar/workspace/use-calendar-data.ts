"use client";

import { useCallback, useMemo, useState } from "react";
import { addYears, endOfYear, format, startOfYear } from "date-fns";
import { toast } from "sonner";
import { useUnscopedLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type { LocaleEmployee, LocaleWorkPattern } from "@/src/lib/types/locale";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  useCreateCalendarEventMutation,
  useDeleteCalendarEventMutation,
  useGetCalendarQuery,
} from "@/src/store/services/calendar";
import type {
  CalendarCategory,
  CalendarEventRequest,
  CalendarItemDto,
} from "@/src/types/calendar";
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

// ── Live calendar ────────────────────────────────────────────────────────────

/** The API spells two categories in camelCase; the legend keys are snake_case. */
const CATEGORY_FROM_API: Partial<Record<CalendarCategory, string>> = {
  oneToOne: "one_to_one",
  leaveRequest: "leave_request",
};

function categoryToApi(category: string): CalendarCategory {
  if (category === "one_to_one") return "oneToOne";
  if (category === "leave_request") return "leaveRequest";
  return category as CalendarCategory;
}

/**
 * Leave, cover and sickness are drawn from the live leave and sickness data
 * below, so the server's copies of them are not added a second time.
 */
const SCHEDULE_FROM_STORE = new Set(["leave", "leave_request", "cover", "sickness"]);

function toCalItem(dto: CalendarItemDto): CalItem {
  const deletable =
    dto.canDelete && dto.eventId
      ? dto.layer === "company"
        ? ("company" as const)
        : ("personal" as const)
      : undefined;
  return {
    // Deleting addresses the stored event, not the occurrence.
    id: deletable ? (dto.eventId as string) : dto.id,
    title: dto.title,
    date: dto.date.slice(0, 10),
    endDate: dto.endDate?.slice(0, 10) ?? undefined,
    startTime: dto.startTime?.slice(0, 5) ?? undefined,
    endTime: dto.endTime?.slice(0, 5) ?? undefined,
    allDay: dto.allDay,
    category: CATEGORY_FROM_API[dto.category] ?? dto.category,
    layer: dto.layer,
    description: dto.description ?? undefined,
    personId: dto.personId ?? undefined,
    personName: dto.personName ?? undefined,
    deletable,
    pending: dto.pending,
  };
}

/** The year before through the year after this one. */
function liveRange() {
  const now = new Date();
  return {
    from: isoDay(startOfYear(addYears(now, -1))),
    to: isoDay(endOfYear(addYears(now, 1))),
  };
}

function eventRequest(
  item: Omit<StoredEvent, "id" | "category">,
): Omit<CalendarEventRequest, "category" | "audience"> {
  return {
    title: item.title,
    description: item.description || null,
    date: item.date,
    allDay: item.allDay,
    startTime: item.allDay ? null : (item.startTime ?? null),
    endTime: item.allDay ? null : (item.endTime ?? null),
  };
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

  // Signed in, company events, holidays and people's own events come from the
  // API instead of this browser's storage.
  const live = useAppSelector((s) => s.session.is_loggedIn && !!s.session.tenant_id);
  const [range] = useState(liveRange);
  const calendar = useGetCalendarQuery(range, { skip: !live });
  const [createEvent] = useCreateCalendarEventMutation();
  const [deleteEvent] = useDeleteCalendarEventMutation();
  const liveItems = useMemo(
    () => (calendar.data?.data ?? []).map(toCalItem),
    [calendar.data],
  );

  const employees = useMemo(() => data?.employees ?? [], [data]);
  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const holidayItems = useMemo<CalItem[]>(
    () =>
      live
        ? liveItems.filter((i) => i.layer === "holidays")
        : (data?.holidays ?? []).map((h) => ({
        id: `hol-${h.id}`,
        title: h.title,
        date: h.date,
        allDay: true,
        category: "holiday",
        layer: "holidays" as const,
      })),
    [live, liveItems, data],
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
      if (live) {
        for (const item of liveItems) {
          if (item.layer !== "schedule" || item.personId !== personId) continue;
          if (SCHEDULE_FROM_STORE.has(item.category)) continue;
          out.push({ ...item, personName: item.personName ?? name });
        }
      }
      for (const e of live ? [] : personal.events) {
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
    [leave, sickness, personal.events, byId, live, liveItems],
  );

  const customCompany = useMemo<CalItem[]>(
    () =>
      live
        ? liveItems.filter((i) => i.layer === "company")
        : company.events.map((e) => ({
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
    [live, liveItems, company.events],
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

  // The create dialog confirms straight away, so a failed save says so after.
  const saveLive = (body: CalendarEventRequest) =>
    createEvent(body)
      .unwrap()
      .catch((err) => toast.error(getApiErrorMessage(err, "Could not save the event.")));

  return {
    ready: !!data && (!live || !!calendar.data),
    employees,
    byId,
    me,
    holidayItems,
    customCompany,
    scheduleFor,
    teamOf,
    reportsOf,
    addPersonal: (items: Omit<StoredEvent, "id" | "category">[]) => {
      if (live) {
        // One event, attended by everyone it was added for.
        if (items.length) {
          void saveLive({
            ...eventRequest(items[0]),
            category: "personal",
            audience: "people",
            employeeIds: items.flatMap((x) => (x.employeeId ? [x.employeeId] : [])),
          });
        }
        return;
      }
      personal.save([...personal.events, ...items.map((x) => ({ ...x, id: newId("pe"), category: "personal" }))]);
    },
    addCompany: (item: Omit<StoredEvent, "id">) => {
      if (live) {
        void saveLive({
          ...eventRequest(item),
          category: categoryToApi(item.category),
          audience: "company",
        });
        return;
      }
      company.save([...company.events, { ...item, id: newId("ce") }]);
    },
    remove: (item: CalItem) => {
      if (live) {
        if (item.deletable) {
          deleteEvent(item.id)
            .unwrap()
            .catch((err) => toast.error(getApiErrorMessage(err, "Could not delete the event.")));
        }
        return;
      }
      if (item.deletable === "personal") personal.save(personal.events.filter((e) => e.id !== item.id));
      if (item.deletable === "company") company.save(company.events.filter((e) => e.id !== item.id));
    },
  };
}

export type CalendarData = ReturnType<typeof useCalendarData>;
