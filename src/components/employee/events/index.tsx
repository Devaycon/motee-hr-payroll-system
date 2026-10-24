"use client";

import { useMemo } from "react";
import { CalendarWorkspace } from "@/src/components/hr/calendar/workspace";
import { EVENT_TYPE_LABELS, INITIAL_EMPLOYEE_EVENTS } from "./data";
import { useEmployeeEvents } from "./hooks";
import type { EmployeeEventType } from "./types";

const TYPES = (Object.keys(EVENT_TYPE_LABELS) as EmployeeEventType[])
  .filter((t) => t !== "leave")
  .map((t) => ({ value: t, label: EVENT_TYPE_LABELS[t] }));

/** Employee calendar — the same workspace; employees add events to their own schedule. */
export function EmployeeEventsPage() {
  const { data } = useEmployeeEvents();
  const events = useMemo(() => [...INITIAL_EMPLOYEE_EVENTS, ...(data ?? [])], [data]);
  return <CalendarWorkspace companyEvents={events} companyTypes={TYPES} canCreateCompany={false} />;
}
