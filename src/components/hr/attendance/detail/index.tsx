"use client";

import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Clock,
  MapPin,
  Building2,
  Briefcase,
  CalendarDays,
  StickyNote,
  ExternalLink,
  Percent,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import type { HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import { formatDate } from "@/src/lib/utils/format-date";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useAttendanceRecord } from "../hooks";
import { attendanceMapsUrl, openAttendanceLocation } from "../location";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_STYLES } from "../data";
import { deductionForStatus, DEMO_DAILY_RATE } from "../types";

export function AttendanceDetailPage({ recordId }: { recordId: string }) {
  const router = useRouter();
  const { record, loading } = useAttendanceRecord(recordId);
  const deductionPolicy = useAppSelector(
    (s) => s.attendanceDeductionPolicy.policy,
  );

  if (loading && !record) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-start gap-4 py-12">
        <h1 className="text-2xl font-semibold text-foreground">
          Record not found
        </h1>
        <p className="text-sm text-muted-foreground">
          It may belong to a different day, or the demo data has reset.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/time-payroll/attendance")}
        >
          <ChevronLeft className="size-4" /> Back to Attendance
        </Button>
      </div>
    );
  }

  const mapsUrl = attendanceMapsUrl(record);
  const deduction = deductionForStatus(
    record.status,
    deductionPolicy,
    DEMO_DAILY_RATE,
  );

  const stats: HrStatCardItem[] = [
    {
      icon: Clock,
      label: "Total Hours",
      value: record.totalHours ? `${record.totalHours}h` : "—",
      sub: "for the day",
      tone: "blue",
    },
    {
      icon: Clock,
      label: "Overtime",
      value: record.overtimeHours > 0 ? `+${record.overtimeHours}h` : "—",
      sub: record.overtimeHours > 0 ? "beyond schedule" : "none logged",
      tone: record.overtimeHours > 0 ? "amber" : undefined,
    },
    {
      icon: CalendarDays,
      label: "Break",
      value: `${record.breakMinutes}m`,
      sub: "unpaid break",
    },
    {
      icon: Percent,
      label: "Deduction Impact",
      value:
        deduction > 0
          ? `-${deductionPolicy.currency} ${deduction.toLocaleString()}`
          : "None",
      sub:
        deduction > 0
          ? "per the current deduction policy"
          : "no deduction applies today",
      tone: deduction > 0 ? "red" : "emerald",
    },
  ];

  const detail = [
    { icon: Building2, label: "Department", value: record.department },
    { icon: Briefcase, label: "Job Title", value: record.jobTitle },
    { icon: CalendarDays, label: "Date", value: formatDate(record.date) },
    {
      icon: MapPin,
      label: "Location",
      value: record.locationAddress || record.location || "—",
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="pt-6">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 -ml-2 mb-3 gap-1 text-muted-foreground"
          onClick={() => router.push("/time-payroll/attendance")}
        >
          <ChevronLeft className="size-4" /> Attendance
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
              {record.employeeInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">
                  {record.employeeName}
                </h1>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${ATTENDANCE_STATUS_STYLES[record.status]}`}
                >
                  {ATTENDANCE_STATUS_LABELS[record.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {record.jobTitle} · {record.department}
              </p>
            </div>
          </div>
        </div>
      </div>

      <HrStatCardsGrid stats={stats} columns={4} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Punch details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Clock className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Clock In</p>
                <p className="text-sm text-foreground font-mono">
                  {record.clockIn ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Clock Out</p>
                <p className="text-sm text-foreground font-mono">
                  {record.clockOut ?? "—"}
                </p>
              </div>
            </div>
            {detail.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="text-sm text-foreground break-words">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground break-words">
              {record.locationAddress || record.location || "No location captured for this punch."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              disabled={!mapsUrl}
              onClick={() => openAttendanceLocation(record)}
            >
              <ExternalLink className="size-3.5" />
              Open in Google Maps
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <StickyNote className="size-4 text-muted-foreground" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {record.notes || "No notes recorded for this punch."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
