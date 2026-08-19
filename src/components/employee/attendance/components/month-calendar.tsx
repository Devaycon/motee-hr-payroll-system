"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import type { AttendanceStatus } from "@/src/lib/types/attendance";
import { isoDateOf, scheduleForDay } from "@/src/lib/types/attendance";
import type { LocaleWorkPattern } from "@/src/lib/types/locale";
import { STATUS_DOT, STATUS_LABEL } from "./constants";
import { toHHMM, type TimeLogRow } from "../hooks";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MonthCalendarProps {
  logs: TimeLogRow[];
  workPattern: LocaleWorkPattern | undefined;
  todayIso: string;
}

/** Locale rows say "remote"; the calendar's vocabulary calls that present. */
function normalise(status: string): AttendanceStatus {
  if (status === "remote") return "present";
  return status as AttendanceStatus;
}

export function MonthCalendar({
  logs,
  workPattern,
  todayIso,
}: MonthCalendarProps) {
  // Anchor on the most recent month that actually has data, so the calendar
  // does not open on an empty month when the fixtures lag the real date.
  const initialAnchor = useMemo(() => {
    const latest = logs[0]?.date ?? todayIso;
    const d = new Date(latest);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, [logs, todayIso]);

  const [anchor, setAnchor] = useState(initialAnchor);
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(
    () => new Map(logs.map((l) => [l.date, l])),
    [logs],
  );

  const { cells, monthLabel } = useMemo(() => {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday-based leading blanks.
    const lead = (first.getDay() + 6) % 7;

    const out: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(isoDateOf(new Date(year, month, d)));
    }
    return {
      cells: out,
      monthLabel: first.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      }),
    };
  }, [anchor]);

  const detail = selected ? byDate.get(selected) : undefined;

  function shiftMonth(by: number) {
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + by, 1));
    setSelected(null);
  }

  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <p className="text-xs font-semibold text-foreground">{monthLabel}</p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[9px] font-semibold text-muted-foreground uppercase tracking-wide py-1"
            >
              {d}
            </div>
          ))}

          {cells.map((iso, i) => {
            if (!iso) return <div key={`pad-${i}`} />;
            const log = byDate.get(iso);
            const status = log ? normalise(log.status) : null;
            const working = Boolean(scheduleForDay(workPattern, iso));
            const isToday = iso === todayIso;
            const isSelected = iso === selected;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(isSelected ? null : iso)}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center gap-1 text-[11px] transition-all border",
                  isSelected
                    ? "border-[#7F77DD] bg-[#7F77DD]/10"
                    : "border-transparent hover:border-border",
                  !working && "opacity-45",
                  isToday && !isSelected && "ring-1 ring-[#7F77DD]/50",
                )}
              >
                <span
                  className={cn(
                    "tabular-nums",
                    isToday
                      ? "font-bold text-[#7F77DD]"
                      : "text-foreground",
                  )}
                >
                  {Number(iso.slice(8, 10))}
                </span>
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    status ? STATUS_DOT[status] : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 flex-wrap pt-1">
          {(
            ["present", "late", "absent", "on_leave"] as AttendanceStatus[]
          ).map((s) => (
            <span
              key={s}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[s])} />
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>

        {selected && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-foreground">
              {new Date(selected).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {detail ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Clock in",
                    value: detail.clockIn ? toHHMM(detail.clockIn) : "—",
                  },
                  {
                    label: "Clock out",
                    value: detail.clockOut ? toHHMM(detail.clockOut) : "—",
                  },
                  {
                    label: "Hours",
                    value:
                      detail.hoursWorked != null
                        ? `${detail.hoursWorked}h`
                        : "—",
                  },
                ].map((r) => (
                  <div key={r.label} className="flex flex-col gap-0.5">
                    <p className="text-[10px] text-muted-foreground">
                      {r.label}
                    </p>
                    <p className="text-xs font-semibold text-foreground tabular-nums">
                      {r.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                {scheduleForDay(workPattern, selected)
                  ? "No attendance recorded for this day."
                  : "Not a scheduled working day."}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
