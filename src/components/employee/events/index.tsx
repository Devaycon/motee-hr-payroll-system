"use client";

import { useState } from "react";
import {
  INITIAL_EMPLOYEE_EVENTS,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
} from "./data";
import type { EmployeeCalEvent } from "./types";
import {
  CalendarCard,
  CalendarBreakdown,
  AllEventsList,
} from "@/src/components/shared/calendar";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";
import { useEmployeeEvents } from "./hooks";

export function EmployeeEventsPage() {
  const { data: localeEvents } = useEmployeeEvents();
  const [events, setEvents] = useState<EmployeeCalEvent[]>(
    INITIAL_EMPLOYEE_EVENTS,
  );
  // Seed (and re-seed on country switch) without an effect. Keep the generated
  // demo events so the calendar stays eventful, then merge in locale events.
  const [seeded, setSeeded] = useState<EmployeeCalEvent[] | null>(null);
  if (localeEvents && localeEvents.length && localeEvents !== seeded) {
    setSeeded(localeEvents);
    setEvents([...INITIAL_EMPLOYEE_EVENTS, ...localeEvents]);
  }
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

  function handleDelete(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {events.length} scheduled event{events.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-5 items-stretch">
        <CalendarCard
          events={events}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          typeColors={EVENT_TYPE_COLORS}
          typeLabels={EVENT_TYPE_LABELS}
        />
        <Tabs defaultValue="all" className="h-full">
          <TabsList>
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-[#ff8b2d]! data-[state=active]:text-white! data-[state=active]:shadow-none!"
            >
              All Events
            </TabsTrigger>
            <TabsTrigger
              value="breakdown"
              className="data-[state=active]:bg-[#ff8b2d]! data-[state=active]:text-white! data-[state=active]:shadow-none!"
            >
              Calendar Breakdown
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <AllEventsList
              events={events}
              onDelete={handleDelete}
              typeColors={EVENT_TYPE_COLORS}
              typeLabels={EVENT_TYPE_LABELS}
              pageSize={6}
              emptyMessage="No events scheduled."
            />
          </TabsContent>
          <TabsContent value="breakdown">
            <CalendarBreakdown
              events={events}
              selectedDay={selectedDay}
              typeColors={EVENT_TYPE_COLORS}
              typeLabels={EVENT_TYPE_LABELS}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
