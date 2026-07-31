"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  CalendarCard,
  CalendarBreakdown,
  AllEventsList,
  NewEventDialog,
  type CalEvent,
} from "@/src/components/shared/calendar";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";
import { EVENT_TYPE_COLORS, EVENT_TYPE_OPTIONS, INITIAL_EVENTS } from "./data";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCalendarEvents, useCoverEvents } from "./hooks";

type NewEventData = Omit<CalEvent, "id">;

export function EventsPage() {
  const searchParams = useSearchParams();
  // Deep-linkable so dashboard cards can land here scoped to one event type
  // (e.g. "Upcoming Birthdays" → ?type=birthday).
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get("type") ?? "all");
  const { data, loading } = useCalendarEvents();
  // Relief-cover entries come from the leave slice, so they stay live as
  // requests are raised (client feedback §3.2).
  const coverEvents = useCoverEvents();
  // Always include the generated demo events so the calendar stays eventful,
  // then merge in locale-specific events (holidays, etc.) when they load.
  const [events, setEvents] = useState<CalEvent[]>(INITIAL_EVENTS);
  // Seed (and re-seed on country switch) without an effect.
  const [seeded, setSeeded] = useState<CalEvent[] | null>(null);
  if (data && data !== seeded) {
    setSeeded(data);
    setEvents([...INITIAL_EVENTS, ...data]);
  }
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

  const visibleEvents = useMemo(() => {
    const all = [...events, ...coverEvents];
    return typeFilter === "all"
      ? all
      : all.filter((e) => e.type === typeFilter);
  }, [events, coverEvents, typeFilter]);
  const typeLabel = EVENT_TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label;

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
          <h1 className="text-4xl font-bold text-foreground">
            {typeFilter === "all" ? "Calendar" : `Calendar — ${typeLabel ?? typeFilter}`}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-muted-foreground">
              {visibleEvents.length} scheduled event{visibleEvents.length !== 1 ? "s" : ""}
            </p>
            {typeFilter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                onClick={() => setTypeFilter("all")}
              >
                <X className="w-3 h-3" />
                Clear filter
              </Button>
            )}
          </div>
        </div>
        <NewEventDialog
          selectedDay={selectedDay}
          onConfirm={handleCreate}
          typeOptions={EVENT_TYPE_OPTIONS}
          defaultType="meeting"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-5 items-stretch">
        <CalendarCard
          events={visibleEvents}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          typeColors={EVENT_TYPE_COLORS}
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
              events={visibleEvents}
              onDelete={handleDelete}
              typeColors={EVENT_TYPE_COLORS}
              pageSize={6}
              emptyMessage={
                typeFilter === "all"
                  ? "No events yet. Click New Event to create one."
                  : `No ${(typeLabel ?? typeFilter).toLowerCase()} events scheduled.`
              }
            />
          </TabsContent>
          <TabsContent value="breakdown">
            <CalendarBreakdown
              events={visibleEvents}
              selectedDay={selectedDay}
              typeColors={EVENT_TYPE_COLORS}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
