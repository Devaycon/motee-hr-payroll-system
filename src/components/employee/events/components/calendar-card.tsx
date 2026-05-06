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
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "../data";
import type { EmployeeCalEvent } from "../types";

interface CalendarCardProps {
  events: EmployeeCalEvent[];
  selectedDay: Date | undefined;
  onSelectDay: (day: Date | undefined) => void;
}

export function CalendarCard({
  events,
  selectedDay,
  onSelectDay,
}: CalendarCardProps) {
  const eventDays = events.map((e) => parseISO(e.date));
  const dayEvents = events.filter(
    (e) => selectedDay && isSameDay(parseISO(e.date), selectedDay),
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card>
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={selectedDay}
            onSelect={onSelectDay}
            modifiers={{ hasEvent: eventDays }}
            modifiersStyles={{
              hasEvent: {
                fontWeight: "bold",
                textDecoration: "underline",
                textDecorationColor: "hsl(var(--primary))",
              },
            }}
          />
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
                    className={`text-[10px] px-1.5 py-0 shrink-0 ${EVENT_TYPE_COLORS[e.type]}`}
                  >
                    {EVENT_TYPE_LABELS[e.type]}
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
