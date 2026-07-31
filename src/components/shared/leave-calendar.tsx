"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  PUBLIC_HOLIDAYS_2026,
  COMPANY_SHUTDOWNS,
  type PublicHoliday,
  type CompanyShutdown,
} from "@/src/data/leave-calendar-demo";

export interface CalendarLeave {
  id: string;
  /** Who/what the entry represents (employee name, or leave type). */
  label: string;
  startDate: string; // ISO yyyy-mm-dd, inclusive
  endDate: string; // ISO, inclusive
  status: "approved" | "pending";
  /**
   * `"cover"` marks a relief assignment rather than the absence itself
   * (client feedback §3.2) — rendered dashed so it reads as a duty, not a
   * day off. Kept separate from `status`, which is a real approval state.
   */
  kind?: "leave" | "cover";
  color?: string;
}

/** Colour used for relief-cover entries across every calendar. */
export const COVER_COLOR = "#0D9488";

interface LeaveCalendarProps {
  leave: CalendarLeave[];
  publicHolidays?: PublicHoliday[];
  shutdowns?: CompanyShutdown[];
  initialMonth?: Date;
  /** Show each entry's label (team view) rather than only a status dot. */
  showLabels?: boolean;
  /** Makes entries clickable — receives the CalendarLeave id. */
  onSelectEntry?: (id: string) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function inRange(day: string, start: string, end: string): boolean {
  return day >= start && day <= end;
}

export function LeaveCalendar({
  leave,
  publicHolidays = PUBLIC_HOLIDAYS_2026,
  shutdowns = COMPANY_SHUTDOWNS,
  initialMonth,
  showLabels = false,
  onSelectEntry,
}: LeaveCalendarProps) {
  // Opens on the current month — this was pinned to a hardcoded demo month.
  const [cursor, setCursor] = useState(() => {
    if (initialMonth) return initialMonth;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    // Monday-first offset (JS getDay: 0=Sun).
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(iso(new Date(year, month, d)));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const todayIso = iso(new Date());

  const eventsFor = (day: string) => {
    const holiday = publicHolidays.find((h) => h.date === day);
    const shutdown = shutdowns.find((s) => inRange(day, s.startDate, s.endDate));
    const entries = leave.filter((l) => inRange(day, l.startDate, l.endDate));
    return { holiday, shutdown, entries };
  };

  const step = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(2026, 6, 1))}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-1 py-1.5 text-[11px] font-medium text-muted-foreground">
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {grid.map((day, i) => {
          if (!day) return <div key={`x-${i}`} className="min-h-16 border-b border-r border-border/50 bg-muted/20" />;
          const { holiday, shutdown, entries } = eventsFor(day);
          const dayNum = Number(day.slice(-2));
          const isToday = day === todayIso;
          return (
            <div
              key={day}
              className={cn(
                "min-h-16 border-b border-r border-border/50 p-1.5 last:border-r-0",
                shutdown && "bg-rose-500/5",
                holiday && "bg-indigo-500/5",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-[11px]",
                    isToday
                      ? "flex size-5 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {dayNum}
                </span>
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {holiday && (
                  <span className="truncate rounded bg-indigo-500/15 px-1 py-0.5 text-[9px] font-medium text-indigo-600" title={holiday.name}>
                    {holiday.name}
                  </span>
                )}
                {shutdown && (
                  <span className="truncate rounded bg-rose-500/15 px-1 py-0.5 text-[9px] font-medium text-rose-600" title={shutdown.name}>
                    {shutdown.name}
                  </span>
                )}
                {entries.slice(0, showLabels ? 3 : 4).map((e) =>
                  showLabels ? (
                    <span
                      key={e.id}
                      role={onSelectEntry ? "button" : undefined}
                      tabIndex={onSelectEntry ? 0 : undefined}
                      onClick={onSelectEntry ? () => onSelectEntry(e.id) : undefined}
                      onKeyDown={
                        onSelectEntry
                          ? (ev) => {
                              if (ev.key === "Enter" || ev.key === " ") {
                                ev.preventDefault();
                                onSelectEntry(e.id);
                              }
                            }
                          : undefined
                      }
                      className={cn(
                        "truncate rounded px-1 py-0.5 text-[9px] font-medium",
                        e.status === "pending" ? "opacity-60" : "",
                        e.kind === "cover" && "border border-dashed",
                        onSelectEntry &&
                          "cursor-pointer hover:brightness-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      )}
                      style={{
                        background:
                          e.kind === "cover"
                            ? "transparent"
                            : `${e.color ?? "#2563EB"}22`,
                        borderColor:
                          e.kind === "cover" ? e.color ?? COVER_COLOR : undefined,
                        color: e.color ?? "#2563EB",
                      }}
                      title={
                        e.kind === "cover"
                          ? e.label
                          : `${e.label} (${e.status})`
                      }
                    >
                      {e.label}
                    </span>
                  ) : (
                    <span
                      key={e.id}
                      className={cn(
                        "h-1.5 w-full rounded-full",
                        e.status === "pending" && "opacity-50",
                        e.kind === "cover" && "opacity-70",
                      )}
                      style={{ background: e.color ?? "#2563EB" }}
                      title={
                        e.kind === "cover"
                          ? e.label
                          : `${e.label} (${e.status})`
                      }
                    />
                  ),
                )}
                {entries.length > (showLabels ? 3 : 4) && (
                  <span className="text-[9px] text-muted-foreground">
                    +{entries.length - (showLabels ? 3 : 4)} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" /> Approved leave
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB] opacity-50" /> Pending leave
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full border border-dashed"
            style={{ borderColor: COVER_COLOR }}
          />{" "}
          Covering
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500/40" /> Public holiday
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-500/40" /> Company shutdown
        </span>
      </div>
    </div>
  );
}
