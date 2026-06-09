"use client";

import { format, isSameDay, parseISO } from "date-fns";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import type { CalEvent } from "./types";

interface CalendarCardProps {
  events: CalEvent[];
  selectedDay: Date | undefined;
  onSelectDay: (day: Date | undefined) => void;
  typeColors: Record<string, string>;
  typeLabels?: Record<string, string>;
}

export function CalendarCard({
  events,
  selectedDay,
  onSelectDay,
  typeColors,
  typeLabels,
}: CalendarCardProps) {
  const dayEvents = events.filter(
    (e) => selectedDay && isSameDay(parseISO(e.date), selectedDay),
  );

  // Paint each event day with its type's colour so the calendar clearly shows
  // which days have something happening (one modifier per event type).
  const eventsByType: Record<string, Date[]> = {};
  for (const e of events) {
    (eventsByType[e.type] ??= []).push(parseISO(e.date));
  }
  const modifiers: Record<string, Date[]> = {};
  const modifiersClassNames: Record<string, string> = {};
  for (const [type, days] of Object.entries(eventsByType)) {
    const key = `evt_${type}`;
    modifiers[key] = days;
    modifiersClassNames[key] = `rounded-md font-bold ${
      typeColors[type] ?? "bg-primary/10 text-primary"
    }`;
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card>
        <CardContent className="p-3">
          <Calendar
            mode="single"
            className="w-full [--cell-size:--spacing(9)]"
            classNames={{ root: "w-full" }}
            selected={selectedDay}
            onSelect={onSelectDay}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
          />

          {Object.keys(eventsByType).length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/50 pt-3">
              {Object.keys(eventsByType).map((type) => (
                <span key={type} className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-sm ${typeColors[type] ?? "bg-primary/10"}`}
                  />
                  <span className="text-[11px] capitalize text-muted-foreground">
                    {typeLabels?.[type] ?? type}
                  </span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader className="px-4 pt-3 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {selectedDay ? format(selectedDay, "EEEE, MMMM d") : "Select a day"}
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="px-4 py-3">
          {dayEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No events on this day.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {dayEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 shrink-0 ${typeColors[e.type] ?? ""}`}
                  >
                    {typeLabels?.[e.type] ?? e.type}
                  </Badge>
                  <p className="text-xs text-foreground">{e.title}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
