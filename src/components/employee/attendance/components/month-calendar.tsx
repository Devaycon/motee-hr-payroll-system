"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import type { AttendanceStatus } from "@/src/lib/types/attendance";
import {
  MONTH_DEMO,
  MONTH_DETAILS,
  STATUS_DOT,
  STATUS_LABEL,
  STATUS_BADGE,
} from "./constants";

export function MonthCalendar() {
  const [month, setMonth] = useState(new Date(2026, 3, 1));
  const [selectedDay, setSelectedDay] = useState<{
    iso: string;
    status: AttendanceStatus;
  } | null>(null);

  const year = month.getFullYear();
  const mon = month.getMonth();
  const first = new Date(year, mon, 1).getDay();
  const days = new Date(year, mon + 1, 0).getDate();
  const startOffset = first === 0 ? 6 : first - 1;
  const today = "2026-04-23";

  const detail = selectedDay ? MONTH_DETAILS[selectedDay.iso] : undefined;

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Monthly Overview
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() =>
                setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] text-muted-foreground min-w-24 text-center font-medium">
              {month.toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() =>
                setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
              }
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div
                  key={d}
                  className="text-[10px] font-semibold text-muted-foreground text-center py-1"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {Array.from({ length: days }, (_, i) => {
                const d = i + 1;
                const iso = `${year}-${String(mon + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const status = MONTH_DEMO[iso];
                const dotColor = status ? STATUS_DOT[status] : null;
                const isToday = iso === today;
                const dayOfWeek = new Date(iso).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isFuture = iso > today;
                const isClickable = !!status && !isFuture;
                return (
                  <div
                    key={d}
                    onClick={() =>
                      isClickable ? setSelectedDay({ iso, status }) : undefined
                    }
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium relative transition-colors",
                      isClickable && "cursor-pointer",
                      isToday
                        ? "bg-[#7F77DD] text-white"
                        : isWeekend
                          ? "text-muted-foreground/40"
                          : isFuture
                            ? "text-muted-foreground/60"
                            : isClickable
                              ? "text-foreground hover:bg-muted/60"
                              : "text-foreground",
                    )}
                  >
                    {d}
                    {dotColor && !isToday && (
                      <div
                        className={cn(
                          "w-1 h-1 rounded-full absolute bottom-1",
                          dotColor,
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center flex-wrap gap-3 mt-4 pt-3 border-t border-border/50">
              {[
                { label: "Present", color: "bg-[#1D9E75]" },
                { label: "Late", color: "bg-amber-500" },
                { label: "On Leave", color: "bg-violet-500" },
                { label: "Absent", color: "bg-red-500" },
              ].map((l) => (
                <div
                  key={l.label}
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                >
                  <div className={cn("w-2 h-2 rounded-full", l.color)} />{" "}
                  {l.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedDay}
        onOpenChange={(o) => !o && setSelectedDay(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedDay
                ? new Date(selectedDay.iso).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : ""}
            </DialogTitle>
          </DialogHeader>

          {selectedDay && (
            <div className="flex flex-col gap-4 pt-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-1 rounded-full",
                    STATUS_BADGE[selectedDay.status],
                  )}
                >
                  {STATUS_LABEL[selectedDay.status]}
                </span>
              </div>

              {selectedDay.status !== "on_leave" &&
              selectedDay.status !== "absent" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 rounded-lg p-3 flex flex-col gap-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
                      Clock In
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {detail?.clockIn ?? "—"}
                    </p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 flex flex-col gap-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
                      Clock Out
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {detail?.clockOut ?? "—"}
                    </p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 flex flex-col gap-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
                      Break
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {detail?.breakMinutes != null
                        ? `${detail.breakMinutes} min`
                        : "—"}
                    </p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 flex flex-col gap-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
                      Hours Worked
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {detail?.totalHours != null
                        ? `${detail.totalHours}h`
                        : "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-[11px] text-muted-foreground">
                    {detail?.note ??
                      (selectedDay.status === "on_leave"
                        ? "On approved leave"
                        : "No attendance recorded")}
                  </p>
                </div>
              )}

              {detail?.note &&
                selectedDay.status !== "on_leave" &&
                selectedDay.status !== "absent" && (
                  <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2">
                    <p className="text-[11px] text-amber-700">{detail.note}</p>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDay(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
