"use client";

import { useState } from "react";
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import type { CalEvent } from "./types";

interface CalendarBreakdownProps {
  events: CalEvent[];
  selectedDay: Date | undefined;
  typeColors: Record<string, string>;
  typeLabels?: Record<string, string>;
}

const WEEK_OPTS = { weekStartsOn: 0 } as const; // Sunday-first, matching the design
const HOUR_WIDTH = 60; // px per hour column
const DAY_LABEL_WIDTH = 52; // px for the left day label column
const LANE_HEIGHT = 26; // px per stacked timed-event lane

/** "HH:mm" -> minutes since midnight. */
function toMinutes(t?: string): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
}

/** Greedy lane assignment so overlapping events stack instead of covering each other. */
function assignLanes(evs: CalEvent[]): Map<string, number> {
  const lanes: number[] = []; // lane -> end minute of last event
  const result = new Map<string, number>();
  for (const e of [...evs].sort(
    (a, b) => (toMinutes(a.startTime) ?? 0) - (toMinutes(b.startTime) ?? 0),
  )) {
    const start = toMinutes(e.startTime) ?? 0;
    const end = toMinutes(e.endTime) ?? start + 60;
    let lane = lanes.findIndex((endMin) => endMin <= start);
    if (lane === -1) {
      lane = lanes.length;
      lanes.push(end);
    } else {
      lanes[lane] = end;
    }
    result.set(e.id, lane);
  }
  return result;
}

export function CalendarBreakdown({
  events,
  selectedDay,
  typeColors,
  typeLabels,
}: CalendarBreakdownProps) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(selectedDay ?? new Date(), WEEK_OPTS),
  );
  // Follow the left calendar's selected day without an effect (seed-on-render).
  const [seedDay, setSeedDay] = useState(selectedDay);
  if (selectedDay !== seedDay) {
    setSeedDay(selectedDay);
    if (selectedDay) {
      const ws = startOfWeek(selectedDay, WEEK_OPTS);
      if (!isSameDay(ws, weekStart)) setWeekStart(ws);
    }
  }

  const [viewEvent, setViewEvent] = useState<CalEvent | null>(null);

  const weekEnd = endOfWeek(weekStart, WEEK_OPTS);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Events that fall inside the visible week, grouped by day key.
  const eventsByDay = new Map<string, CalEvent[]>();
  for (const e of events) {
    const d = parseISO(e.date);
    if (d >= weekStart && d <= weekEnd) {
      const key = format(d, "yyyy-MM-dd");
      const list = eventsByDay.get(key);
      if (list) list.push(e);
      else eventsByDay.set(key, [e]);
    }
  }

  // Hour range derived from the week's timed events (fallback 08:00–18:00).
  let minHour = 8;
  let maxHour = 18;
  for (const list of eventsByDay.values()) {
    for (const e of list) {
      if (e.allDay) continue;
      const s = toMinutes(e.startTime);
      if (s == null) continue;
      const en = toMinutes(e.endTime);
      minHour = Math.min(minHour, Math.floor(s / 60));
      maxHour = Math.max(maxHour, Math.ceil((en ?? s + 60) / 60));
    }
  }
  const startHour = minHour;
  const endHour = maxHour;

  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  );
  const totalMinutes = (endHour - startHour) * 60;
  const trackWidth = hours.length * HOUR_WIDTH;

  const typeSet = new Set<string>();
  for (const list of eventsByDay.values())
    for (const e of list) typeSet.add(e.type);
  const typesPresent = [...typeSet];

  const hasAny = eventsByDay.size > 0;

  // Jump to the week of the event nearest the current week (for empty weeks).
  function jumpToNearest() {
    if (!events.length) return;
    const anchor = weekStart.getTime();
    const nearest = [...events].sort(
      (a, b) =>
        Math.abs(parseISO(a.date).getTime() - anchor) -
        Math.abs(parseISO(b.date).getTime() - anchor),
    )[0];
    setWeekStart(startOfWeek(parseISO(nearest.date), WEEK_OPTS));
  }

  const label = (type: string) => typeLabels?.[type] ?? type;

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-2 px-5 pt-4 pb-3">
          <CardTitle className="text-sm font-medium">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d")}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => setWeekStart((w) => subWeeks(w, 1))}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setWeekStart(startOfWeek(new Date(), WEEK_OPTS))}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="flex-1 px-0 py-0">
          {!hasAny ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <CalendarRange className="size-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                No events scheduled this week.
              </p>
              {events.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={jumpToNearest}
                >
                  Jump to nearest events
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ minWidth: DAY_LABEL_WIDTH + trackWidth }}>
                {/* Hour axis */}
                <div className="flex border-b border-border/50">
                  <div
                    className="shrink-0"
                    style={{ width: DAY_LABEL_WIDTH }}
                  />
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="shrink-0 border-l border-border/40 py-1.5 pl-1 text-[10px] text-muted-foreground"
                      style={{ width: HOUR_WIDTH }}
                    >
                      {String(h).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {/* Day rows */}
                {days.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayEvents = eventsByDay.get(key) ?? [];
                  const allDayEvents = dayEvents.filter((e) => e.allDay);
                  const timed = dayEvents.filter(
                    (e) => !e.allDay && e.startTime,
                  );
                  const lanes = assignLanes(timed);
                  const laneCount = Math.max(
                    1,
                    ...[...lanes.values()].map((l) => l + 1),
                  );
                  const isToday = isSameDay(day, new Date());
                  const allDayBand = allDayEvents.length * 20;
                  const rowHeight = allDayBand + laneCount * LANE_HEIGHT + 8;

                  return (
                    <div
                      key={key}
                      className="flex border-b border-border/40 last:border-0"
                    >
                      {/* Day label */}
                      <div
                        className="flex shrink-0 flex-col items-center justify-center border-r border-border/40 py-2"
                        style={{ width: DAY_LABEL_WIDTH }}
                      >
                        <span className="text-[9px] uppercase text-muted-foreground">
                          {format(day, "EEE")}
                        </span>
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            isToday
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {format(day, "d")}
                        </span>
                      </div>

                      {/* Time track */}
                      <div
                        className="relative"
                        style={{ width: trackWidth, height: rowHeight }}
                      >
                        {/* Hour grid lines */}
                        {hours.map((h, i) => (
                          <div
                            key={h}
                            className="absolute top-0 bottom-0 border-l border-border/20"
                            style={{ left: i * HOUR_WIDTH }}
                          />
                        ))}

                        {/* All-day band */}
                        {allDayEvents.map((e, idx) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => setViewEvent(e)}
                            className={`absolute left-1 right-1 flex items-center truncate rounded px-1.5 text-[10px] font-medium ${
                              typeColors[e.type] ?? "bg-primary/10 text-primary"
                            }`}
                            style={{ top: 2 + idx * 20, height: 18 }}
                            title={e.title}
                          >
                            <span className="truncate">{e.title}</span>
                          </button>
                        ))}

                        {/* Timed events */}
                        {timed.map((e) => {
                          const s = toMinutes(e.startTime) ?? 0;
                          const en = toMinutes(e.endTime) ?? s + 60;
                          const rangeStart = startHour * 60;
                          const left =
                            ((s - rangeStart) / totalMinutes) * trackWidth;
                          const width = Math.max(
                            ((en - s) / totalMinutes) * trackWidth,
                            28,
                          );
                          const lane = lanes.get(e.id) ?? 0;
                          const top =
                            (allDayBand || 4) + lane * LANE_HEIGHT;
                          return (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => setViewEvent(e)}
                              className={`absolute flex items-center gap-1 overflow-hidden rounded border px-1.5 text-left text-[10px] font-medium ${
                                typeColors[e.type] ??
                                "border-primary/30 bg-primary/10 text-primary"
                              }`}
                              style={{
                                left,
                                width,
                                top,
                                height: LANE_HEIGHT - 4,
                              }}
                              title={`${e.title} · ${e.startTime}–${e.endTime ?? ""}`}
                            >
                              <span className="truncate">{e.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          {typesPresent.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/50 px-5 py-3">
              {typesPresent.map((type) => (
                <span key={type} className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-sm ${typeColors[type] ?? "bg-primary/10"}`}
                  />
                  <span className="text-[11px] capitalize text-muted-foreground">
                    {label(type)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!viewEvent}
        onOpenChange={(open) => !open && setViewEvent(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{viewEvent?.title}</DialogTitle>
          </DialogHeader>
          {viewEvent && (
            <div className="flex flex-col gap-3 mt-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${typeColors[viewEvent.type] ?? ""}`}
                >
                  {label(viewEvent.type)}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(viewEvent.date), "EEEE, MMMM d, yyyy")}
                  {viewEvent.allDay
                    ? " · All day"
                    : viewEvent.startTime
                      ? ` · ${viewEvent.startTime}${viewEvent.endTime ? `–${viewEvent.endTime}` : ""}`
                      : ""}
                </p>
              </div>
              {viewEvent.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {viewEvent.description}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
