"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Calendar,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
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

export function EmployeeEventsPage() {
  const router = useRouter();
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
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </Button>
        <span className="text-muted-foreground text-xs">/</span>
        <span className="text-xs text-foreground font-medium">My Events</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Events</h1>
            <p className="text-xs text-muted-foreground">
              {visibleEvents.length} upcoming events
            </p>
          </div>
        </div>
        <div className="flex items-center border rounded-md overflow-hidden">
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors",
              view === "list"
                ? "bg-[#7F77DD] text-white"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button
            onClick={() => setView("calendar")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors",
              view === "calendar"
                ? "bg-[#7F77DD] text-white"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Calendar className="w-3.5 h-3.5" /> Calendar
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", ...Object.keys(TYPE_LABELS)] as EventType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
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
        <Card>
          <CardContent className="px-5 py-4">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="flex flex-col gap-1.5 pr-2">
                {visibleEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">
                    No events in this category.
                  </p>
                )}
                {visibleEvents.map((ev) => {
                  const style =
                    EVENT_TYPE_STYLES[ev.type] ?? EVENT_TYPE_STYLES.company;
                  return (
                    <div
                      key={ev.id}
                      className="flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                          style.bg,
                        )}
                      >
                        <ev.icon className={cn("w-4 h-4", style.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{ev.label}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {ev.date}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                              style.bg,
                              style.text,
                            )}
                          >
                            {TYPE_LABELS[ev.type]}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground shrink-0">
                        {daysUntil(ev.isoDate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 items-start">
          <Card>
            <CardContent className="px-5 py-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={prevMonth}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-sm font-semibold">{monthName}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={nextMonth}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-0">
                {DAYS_OF_WEEK.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[11px] text-muted-foreground font-medium py-1.5"
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
                        "relative flex flex-col items-center justify-start pt-1.5 h-11 rounded-lg text-sm transition-colors",
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
                        <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full px-0.5">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full shrink-0",
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

              <div className="flex flex-wrap gap-2 pt-1 border-t">
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        EVENT_TYPE_STYLES[key].dot,
                      )}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="px-5 py-4">
              {!selectedDay ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Select a day to see events.
                </p>
              ) : selectedDayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  No events for this day.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {new Date(selectedDay).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {selectedDayEvents.map((ev) => {
                    const style =
                      EVENT_TYPE_STYLES[ev.type] ?? EVENT_TYPE_STYLES.company;
                    return (
                      <div
                        key={ev.id}
                        className="flex items-center gap-3 py-3 px-3 rounded-lg border hover:bg-muted/40 transition-colors"
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
                            style.bg,
                          )}
                        >
                          <ev.icon className={cn("w-4 h-4", style.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{ev.label}</p>
                          <p
                            className={cn(
                              "text-xs font-medium mt-0.5",
                              style.text,
                            )}
                          >
                            {TYPE_LABELS[ev.type]}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
