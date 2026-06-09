"use client";

import { useState } from "react";
import {
  CalendarCard,
  AllEventsList,
  NewEventDialog,
  type CalEvent,
} from "@/src/components/shared/calendar";
import { EVENT_TYPE_COLORS, EVENT_TYPE_OPTIONS } from "./data";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCalendarEvents } from "./hooks";

type NewEventData = Omit<CalEvent, "id">;

export function EventsPage() {
  const { data, loading } = useCalendarEvents();
  const [events, setEvents] = useState<CalEvent[]>([]);
  // Seed (and re-seed on country switch) without an effect.
  const [seeded, setSeeded] = useState<CalEvent[] | null>(null);
  if (data && data !== seeded) {
    setSeeded(data);
    setEvents(data);
  }
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

  function handleCreate(data: NewEventData) {
    setEvents((prev) => [...prev, { id: `ev-${Date.now()}`, ...data }]);
  }

  function handleDelete(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  if (loading && !events.length) {
    return (
      <div className="flex flex-col gap-5 pb-10">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Calender</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {events.length} scheduled events
          </p>
        </div>
        <NewEventDialog
          selectedDay={selectedDay}
          onConfirm={handleCreate}
          typeOptions={EVENT_TYPE_OPTIONS}
          defaultType="meeting"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 items-stretch">
        <CalendarCard
          events={events}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          typeColors={EVENT_TYPE_COLORS}
        />
        <AllEventsList
          events={events}
          onDelete={handleDelete}
          typeColors={EVENT_TYPE_COLORS}
          pageSize={6}
          emptyMessage="No events yet. Click New Event to create one."
        />
      </div>
    </div>
  );
}
