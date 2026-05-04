"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCard } from "./components/calendar-card";
import { AllEventsList } from "./components/all-events-list";
import { NewEventDialog } from "./components/new-event-dialog";
import { INITIAL_EVENTS } from "./data";
import type { CalEvent } from "./types";

type NewEventData = Omit<CalEvent, "id">;

export function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalEvent[]>(INITIAL_EVENTS);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

  function handleCreate(data: NewEventData) {
    setEvents((prev) => [...prev, { id: `ev-${Date.now()}`, ...data }]);
  }

  function handleDelete(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {events.length} scheduled events
          </p>
        </div>
        <NewEventDialog selectedDay={selectedDay} onConfirm={handleCreate} />
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
