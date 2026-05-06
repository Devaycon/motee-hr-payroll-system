"use client";

import { useState } from "react";
import { INITIAL_EMPLOYEE_EVENTS } from "./data";
import type { EmployeeCalEvent } from "./types";
import { CalendarCard } from "./components/calendar-card";
import { AllEventsList } from "./components/all-events-list";

export function EmployeeEventsPage() {
  const [events, setEvents] = useState<EmployeeCalEvent[]>(
    INITIAL_EMPLOYEE_EVENTS,
  );
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
        />
        <AllEventsList events={events} onDelete={handleDelete} />
      </div>
    </div>
  );
}
