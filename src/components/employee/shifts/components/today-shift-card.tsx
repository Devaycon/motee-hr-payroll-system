"use client";

import { CalendarClock, Coffee } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { shiftDurationHours } from "@/src/lib/types/shifts";
import { useMyTodayShift } from "../hooks";

export function TodayShiftCard() {
  const { shift, loading } = useMyTodayShift();

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
          style={{
            backgroundColor: shift ? `${shift.template.color}1A` : undefined,
          }}
        >
          {shift ? (
            <CalendarClock
              className="w-5 h-5"
              style={{ color: shift.template.color }}
            />
          ) : (
            <Coffee className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading shift...</p>
          ) : shift ? (
            <>
              <p className="text-sm font-semibold text-foreground">
                On {shift.template.name} today
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {shift.template.startTime} – {shift.template.endTime} (
                {shiftDurationHours(shift.template)}h)
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">
                You&apos;re off today
              </p>
              <p className="text-xs text-muted-foreground">
                No shift scheduled for today
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
