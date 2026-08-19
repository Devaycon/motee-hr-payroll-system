"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAttendanceRecords } from "./hooks";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  StatCards,
  matchesAttendanceCardFilter,
  ATTENDANCE_CARD_FILTER_LABELS,
  type AttendanceCardFilter,
} from "./components/stat-cards";
import { Button } from "@/src/components/ui/button";
import { OverviewTable } from "./components/overview-table";
import { TimesheetsTable } from "./components/timesheets-table";
import { SchedulesTable } from "./components/schedules-table";
import { LogModal } from "./components/log-modal";
import { TimesheetModal } from "./components/timesheet-modal";
import { ScheduleModal } from "./components/schedule-modal";
import { WORK_SCHEDULES } from "./data";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  approveTimesheet as approveTimesheetAction,
  rejectTimesheet as rejectTimesheetAction,
} from "@/src/lib/stores/attendance-slice";
import type {
  AttendanceRecord,
  NewAttendanceRecord,
  TimesheetRecord,
  WorkSchedule,
  NewWorkSchedule,
} from "./types";

export function AttendancePage() {
  const { data, loading } = useAttendanceRecords();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  useEffect(() => {
    if (data) setRecords(data);
  }, [data]);
  // Timesheets live in the shared attendance slice so a self-service submission
  // lands in this queue, and an approval here is visible back on the employee's
  // own timesheet. Schedules are still local — nothing submits them.
  const dispatch = useAppDispatch();
  const timesheets = useAppSelector((s) => s.attendance.timesheets);
  const [schedules, setSchedules] = useState<WorkSchedule[]>(WORK_SCHEDULES);

  // Controlled so the KPI cards can drill into a tab, not just a filter.
  const [activeTab, setActiveTab] = useState("today");
  /** Drill-down set by the KPI cards; "all" shows every row. */
  const [cardFilter, setCardFilter] = useState<AttendanceCardFilter>("all");

  /** The Today rows, narrowed to whichever KPI card is selected. */
  const visibleRecords = records.filter((r) =>
    matchesAttendanceCardFilter(r, cardFilter),
  );
  /** The Timesheets rows — only the Pending Approvals card narrows these. */
  const visibleTimesheets =
    cardFilter === "pending_timesheets"
      ? timesheets.filter((t) => t.status === "submitted")
      : timesheets;

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(
    null,
  );

  const [timesheetModalOpen, setTimesheetModalOpen] = useState(false);
  const [viewingTimesheet, setViewingTimesheet] =
    useState<TimesheetRecord | null>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(
    null,
  );

  function handleLogAttendance() {
    setEditingRecord(null);
    setLogModalOpen(true);
  }

  function handleEditRecord(record: AttendanceRecord) {
    setEditingRecord(record);
    setLogModalOpen(true);
  }

  function handleSaveRecord(data: NewAttendanceRecord) {
    if (editingRecord) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingRecord.id
            ? {
                ...r,
                ...data,
                overtimeHours:
                  data.totalHours && data.totalHours > 8
                    ? Math.round((data.totalHours - 8) * 10) / 10
                    : 0,
              }
            : r,
        ),
      );
    } else {
      const newRecord: AttendanceRecord = {
        ...data,
        id: `ATT-${Date.now()}`,
        overtimeHours:
          data.totalHours && data.totalHours > 8
            ? Math.round((data.totalHours - 8) * 10) / 10
            : 0,
      };
      setRecords((prev) => [newRecord, ...prev]);
    }
  }

  function handleViewTimesheet(ts: TimesheetRecord) {
    setViewingTimesheet(ts);
    setTimesheetModalOpen(true);
  }

  function handleApproveTimesheet(id: string) {
    dispatch(
      approveTimesheetAction({
        id,
        approvedBy: "HR Manager",
        at: new Date().toISOString(),
      }),
    );
  }

  function handleRejectTimesheet(id: string, reason: string) {
    dispatch(rejectTimesheetAction({ id, reason }));
  }

  function handleRejectClick(ts: TimesheetRecord) {
    setViewingTimesheet(ts);
    setTimesheetModalOpen(true);
  }

  function handleAddSchedule() {
    setEditingSchedule(null);
    setScheduleModalOpen(true);
  }

  function handleEditSchedule(schedule: WorkSchedule) {
    setEditingSchedule(schedule);
    setScheduleModalOpen(true);
  }

  function handleSaveSchedule(data: NewWorkSchedule) {
    if (editingSchedule) {
      setSchedules((prev) =>
        prev.map((s) => (s.id === editingSchedule.id ? { ...s, ...data } : s)),
      );
    } else {
      const newSchedule: WorkSchedule = {
        ...data,
        id: `SCH-${Date.now()}`,
        assignedCount: 0,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setSchedules((prev) => [...prev, newSchedule]);
    }
  }

  function handleDeleteSchedule(id: string) {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading && !records.length) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-4xl font-semibold">Attendance</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track employee clock-ins, timesheets, and work schedules
        </p>
      </div>

      <StatCards
        records={records}
        timesheets={timesheets}
        cardFilter={cardFilter}
        onDrillDown={(tab, filter) => {
          setActiveTab(tab);
          setCardFilter(filter);
        }}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {ATTENDANCE_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">
              (
              {cardFilter === "pending_timesheets"
                ? visibleTimesheets.length
                : visibleRecords.length}
              )
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← All records
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "today", label: `Today (${visibleRecords.length})` },
            {
              value: "timesheets",
              label: `Timesheets (${visibleTimesheets.length})`,
            },
            { value: "schedules", label: "Schedules" },
          ]}
        />

        <TabsContent value="today" className="mt-4 space-y-4">
          <OverviewTable
            records={visibleRecords}
            onEdit={handleEditRecord}
            onLogAttendance={handleLogAttendance}
          />
        </TabsContent>

        <TabsContent value="timesheets" className="mt-4 space-y-4">
          <TimesheetsTable
            timesheets={visibleTimesheets}
            onView={handleViewTimesheet}
            onApprove={handleApproveTimesheet}
            onRejectClick={handleRejectClick}
          />
        </TabsContent>

        <TabsContent value="schedules" className="mt-4 space-y-4">
          <SchedulesTable
            schedules={schedules}
            onEdit={handleEditSchedule}
            onDelete={handleDeleteSchedule}
            onAddSchedule={handleAddSchedule}
          />
        </TabsContent>
      </Tabs>

      <LogModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        editingRecord={editingRecord}
        onSave={handleSaveRecord}
      />

      <TimesheetModal
        open={timesheetModalOpen}
        onClose={() => setTimesheetModalOpen(false)}
        viewingTimesheet={viewingTimesheet}
        onApprove={handleApproveTimesheet}
        onReject={handleRejectTimesheet}
      />

      <ScheduleModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        editingSchedule={editingSchedule}
        onSave={handleSaveSchedule}
      />
    </div>
  );
}
