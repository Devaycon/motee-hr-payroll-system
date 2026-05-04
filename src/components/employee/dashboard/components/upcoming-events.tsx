"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  List,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { cn } from "@/src/lib/utils";
import { EMPLOYEE_UPCOMING_EVENTS } from "@/src/data/employee-dashboard-demo";

const TODAY_ISO = "2026-04-23";

const EVENT_TYPE_STYLES: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  company: {
    bg: "bg-[#7F77DD]/10",
    text: "text-[#7F77DD]",
    dot: "bg-[#7F77DD]",
  },
  birthday: {
    bg: "bg-pink-500/10",
    text: "text-pink-600 dark:text-pink-400",
    dot: "bg-pink-500",
  },
  anniversary: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  training: {
    bg: "bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500",
  },
  leave: {
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  performance: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
};

const TYPE_LABELS: Record<string, string> = {
  company: "Company",
  birthday: "Birthday",
  anniversary: "Anniversary",
  training: "Training",
  leave: "Leave",
  performance: "Performance",
};

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type EventType = keyof typeof EVENT_TYPE_STYLES | "all";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function daysUntil(isoDate: string): string {
  const diff = Math.ceil(
    (new Date(isoDate).getTime() - new Date(TODAY_ISO).getTime()) / 86400000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  return `In ${diff}d`;
}

export function UpcomingEvents() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(3);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<EventType>("all");

  const visibleEvents = EMPLOYEE_UPCOMING_EVENTS.filter(
    (e) => typeFilter === "all" || e.type === typeFilter,
  );

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDow = getFirstDayOfWeek(calYear, calMonth);
  const monthName = new Date(calYear, calMonth, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const eventsByDate = EMPLOYEE_UPCOMING_EVENTS.reduce<
    Record<string, typeof EMPLOYEE_UPCOMING_EVENTS>
  >((acc, ev) => {
    if (!acc[ev.isoDate]) acc[ev.isoDate] = [];
    acc[ev.isoDate].push(ev);
    return acc;
  }, {});

  const selectedDayEvents = selectedDay
    ? (eventsByDate[selectedDay] ?? []).filter(
        (e) => typeFilter === "all" || e.type === typeFilter,
      )
    : [];

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else setCalMonth((m) => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else setCalMonth((m) => m + 1);
    setSelectedDay(null);
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center border rounded-md overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1 transition-colors",
                view === "list"
                  ? "bg-[#7F77DD] text-white"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <List className="w-3 h-3" />
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "p-1 transition-colors",
                view === "calendar"
                  ? "bg-[#7F77DD] text-white"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Calendar className="w-3 h-3" />
            </button>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-6 text-xs px-2 gap-0.5"
          >
            <Link href="/company/announcements">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex flex-col gap-3">
        <div className="flex gap-1 flex-wrap">
          {(["all", ...Object.keys(TYPE_LABELS)] as EventType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
                typeFilter === t
                  ? "bg-[#7F77DD] text-white border-[#7F77DD]"
                  : "border-border text-muted-foreground hover:border-[#7F77DD]/40",
              )}
            >
              {t === "all" ? "All" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {view === "list" ? (
          <ScrollArea className="h-56 pr-1">
            <div className="flex flex-col gap-1.5">
              {visibleEvents.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No events in this category.
                </p>
              )}
              {visibleEvents.map((ev) => {
                const style =
                  EVENT_TYPE_STYLES[ev.type] ?? EVENT_TYPE_STYLES.company;
                return (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-md shrink-0",
                        style.bg,
                      )}
                    >
                      <ev.icon className={cn("w-3.5 h-3.5", style.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">
                        {ev.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {ev.date}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium shrink-0",
                        ev.isoDate === TODAY_ISO
                          ? "text-[#7F77DD]"
                          : ev.isoDate < TODAY_ISO
                            ? "text-muted-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {daysUntil(ev.isoDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={prevMonth}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <span className="text-xs font-medium">{monthName}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={nextMonth}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-0">
              {DAYS_OF_WEEK.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] text-muted-foreground font-medium py-1"
                >
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDow }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const iso = toISO(calYear, calMonth, day);
                const dayEvents = eventsByDate[iso] ?? [];
                const isToday = iso === TODAY_ISO;
                const isSelected = iso === selectedDay;
                const hasEvents = dayEvents.length > 0;
                return (
                  <button
                    key={day}
                    onClick={() =>
                      setSelectedDay((prev) => (prev === iso ? null : iso))
                    }
                    className={cn(
                      "relative flex flex-col items-center justify-start pt-1 h-9 rounded-md text-xs transition-colors",
                      isSelected
                        ? "bg-[#7F77DD] text-white"
                        : isToday
                          ? "bg-[#7F77DD]/15 text-[#7F77DD] font-semibold"
                          : hasEvents
                            ? "hover:bg-muted/60"
                            : "text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    <span className="leading-none">{day}</span>
                    {hasEvents && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full px-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className={cn(
                              "w-1 h-1 rounded-full shrink-0",
                              isSelected
                                ? "bg-white/80"
                                : (
                                    EVENT_TYPE_STYLES[ev.type] ??
                                    EVENT_TYPE_STYLES.company
                                  ).dot,
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDay && (
              <div className="border-t pt-3 flex flex-col gap-1.5 max-h-28 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
                {selectedDayEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No events for this day.
                  </p>
                ) : (
                  selectedDayEvents.map((ev) => {
                    const style =
                      EVENT_TYPE_STYLES[ev.type] ?? EVENT_TYPE_STYLES.company;
                    return (
                      <div
                        key={ev.id}
                        className="flex items-center gap-2.5 py-1 px-2 rounded-md hover:bg-muted/40"
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-6 h-6 rounded shrink-0",
                            style.bg,
                          )}
                        >
                          <ev.icon className={cn("w-3 h-3", style.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">{ev.label}</p>
                          <p
                            className={cn(
                              "text-[10px] font-medium",
                              style.text,
                            )}
                          >
                            {TYPE_LABELS[ev.type]}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
