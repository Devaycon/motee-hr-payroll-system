"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  LeaveCalendar,
  COVER_COLOR,
  type CalendarLeave,
} from "@/src/components/shared/leave-calendar";
import { isOpenLeaveStatus } from "@/src/lib/types/leave";
import { DEPARTMENTS, LEAVE_TYPE_LABELS, LEAVE_TYPE_OPTIONS } from "../data";
import type { LeaveRequest, LeaveTypeName } from "../types";

const ALL = "all";

/**
 * Entry colour by leave type. The calendar applies these as raw CSS colours,
 * not Tailwind classes, so these must be literal values.
 */
const TYPE_COLORS: Record<string, string> = {
  annual: "#2563EB",
  sick: "#DC2626",
  maternity: "#DB2777",
  paternity: "#7C3AED",
  unpaid: "#64748B",
  compassionate: "#D97706",
  study: "#0D9488",
};

/**
 * Team leave calendar (client feedback round 2, §F9) — approved and pending
 * leave, public holidays and company shutdowns, filterable by department and
 * leave type. Reuses the shared `LeaveCalendar` that already backs the
 * employee-side view rather than introducing a second calendar.
 */
export function LeaveCalendarTab({
  requests,
  onSelectRequest,
}: {
  requests: LeaveRequest[];
  onSelectRequest?: (request: LeaveRequest) => void;
}) {
  const [department, setDepartment] = useState(ALL);
  const [leaveType, setLeaveType] = useState(ALL);

  /** Bookings that survive the department/type filters, shared by both views. */
  const visible = useMemo(
    () =>
      requests
        .filter((r) => r.status === "approved" || isOpenLeaveStatus(r.status))
        .filter((r) => department === ALL || r.department === department)
        .filter((r) => leaveType === ALL || r.leaveType === leaveType),
    [requests, department, leaveType],
  );

  const entries = useMemo<CalendarLeave[]>(() => {
    const absences: CalendarLeave[] = visible.map((r) => ({
      id: r.id,
      label: `${r.employeeName} · ${LEAVE_TYPE_LABELS[r.leaveType as LeaveTypeName]}`,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status === "approved" ? "approved" : "pending",
      color: TYPE_COLORS[r.leaveType],
    }));

    // A second entry per relief assignment, so the team calendar shows who is
    // holding the fort as well as who is away (client feedback §3.2).
    const cover: CalendarLeave[] = visible
      .filter((r) => r.reliefEmployeeName)
      .map((r) => ({
        id: `cover-${r.id}`,
        label: `${r.reliefEmployeeName} covering ${r.employeeName}`,
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status === "approved" ? "approved" : "pending",
        kind: "cover" as const,
        color: COVER_COLOR,
      }));

    return [...absences, ...cover];
  }, [visible]);

  const bookingCount = entries.filter((e) => e.kind !== "cover").length;

  return (
    <Card>
      <CardContent className="px-5 py-5 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-8 w-48 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className="text-xs">
                  All departments
                </SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Leave type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className="text-xs">
                  All types
                </SelectItem>
                {LEAVE_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {LEAVE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="ml-auto text-xs text-muted-foreground">
            {bookingCount} booking{bookingCount === 1 ? "" : "s"} shown
          </p>
          {/* The month grid can't show who is away next to whom — this opens
              the per-person view, carrying the filters on screen with it. */}
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Link
              href={{
                pathname: "/time-payroll/leave/timeline",
                query: {
                  ...(department !== ALL && { department }),
                  ...(leaveType !== ALL && { type: leaveType }),
                },
              }}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              View more
            </Link>
          </Button>
        </div>

        <LeaveCalendar
          leave={entries}
          showLabels
          onSelectEntry={
            onSelectRequest
              ? (id) => {
                  // Cover pills carry a `cover-` prefix but point at the same
                  // request, so both open the same review modal.
                  const requestId = id.replace(/^cover-/, "");
                  const req = requests.find((r) => r.id === requestId);
                  if (req) onSelectRequest(req);
                }
              : undefined
          }
        />
      </CardContent>
    </Card>
  );
}
