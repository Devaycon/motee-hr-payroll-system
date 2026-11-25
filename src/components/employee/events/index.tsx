"use client";

import { useMemo } from "react";
import { CalendarWorkspace } from "@/src/components/hr/calendar/workspace";
import { EVENT_TYPE_LABELS, INITIAL_EMPLOYEE_EVENTS } from "./data";
import { useEmployeeEvents } from "./hooks";
import { useIsLive } from "@/src/lib/live/use-is-live";
import type { EmployeeEventType } from "./types";

const TYPES = (Object.keys(EVENT_TYPE_LABELS) as EmployeeEventType[])
  .filter((t) => t !== "leave")
  .map((t) => ({ value: t, label: EVENT_TYPE_LABELS[t] }));

/** Employee calendar — the same workspace; employees add events to their own schedule. */
export function EmployeeEventsPage() {
  const { data } = useEmployeeEvents();
  // Signed in, the workspace reads events, holidays and celebrations from
  // the calendar API, so the sample events are not added on top.
  const live = useIsLive();
  const events = useMemo(
    () => (live ? [] : [...INITIAL_EMPLOYEE_EVENTS, ...(data ?? [])]),
    [live, data],
  );
  return <CalendarWorkspace companyEvents={events} companyTypes={TYPES} canCreateCompany={false} />;
}
