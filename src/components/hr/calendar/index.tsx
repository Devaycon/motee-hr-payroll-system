"use client";

import { useMemo } from "react";
import { EVENT_TYPE_OPTIONS, INITIAL_EVENTS } from "./data";
import { useCalendarEvents } from "./hooks";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { CalendarWorkspace } from "./workspace";

/** People-schedule types (leave, cover) live in the Team view, not the company calendar. */
const COMPANY_TYPES = EVENT_TYPE_OPTIONS.filter(
  (o) => !["leave", "leave_request", "cover"].includes(o.value),
);

/** HR calendar — company events, people's schedules and team availability in one place. */
export function EventsPage() {
  const { data, loading } = useCalendarEvents();
  // Signed in, the workspace reads company events, holidays and celebrations
  // from the calendar API, so the sample events are not added on top.
  const live = useAppSelector((s) => s.session.is_loggedIn && !!s.session.tenant_id);
  const events = useMemo(
    () => (live ? [] : [...INITIAL_EVENTS, ...(data ?? [])]),
    [live, data],
  );
  return (
    <CalendarWorkspace
      companyEvents={events}
      companyTypes={COMPANY_TYPES}
      canCreateCompany
      loading={loading && !data}
    />
  );
}
