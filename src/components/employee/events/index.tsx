"use client";

import { useState } from "react";
import {
  INITIAL_EMPLOYEE_EVENTS,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
} from "./data";
import type { EmployeeCalEvent } from "./types";
import { CalendarCard, AllEventsList } from "@/src/components/shared/calendar";
import { useEmployeeEvents } from "./hooks";

export function EmployeeEventsPage() {
  const { data: localeEvents } = useEmployeeEvents();
  const [events, setEvents] = useState<EmployeeCalEvent[]>(
    INITIAL_EMPLOYEE_EVENTS,
  );
  // Seed (and re-seed on country switch) without an effect.
  const [seeded, setSeeded] = useState<EmployeeCalEvent[] | null>(null);
  if (localeEvents && localeEvents.length && localeEvents !== seeded) {
    setSeeded(localeEvents);
    setEvents(localeEvents);
  }
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

  function handleDelete(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6">
        <h1 className="text-4xl font-semibold">Events</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {events.length} scheduled event{events.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[min-content_1fr] gap-5 items-stretch">
        <CalendarCard
          events={events}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          typeColors={EVENT_TYPE_COLORS}
          typeLabels={EVENT_TYPE_LABELS}
        />
        <AllEventsList
          events={events}
          onDelete={handleDelete}
          typeColors={EVENT_TYPE_COLORS}
          typeLabels={EVENT_TYPE_LABELS}
          pageSize={6}
          emptyMessage="No events scheduled."
        />
      </div>
    </div>
  );
}
