"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { StatCards } from "./components/stat-cards";
import { OverviewTable } from "./components/overview-table";
import { TimesheetsTable } from "./components/timesheets-table";
import { SchedulesTable } from "./components/schedules-table";
import { LogModal } from "./components/log-modal";
import { TimesheetModal } from "./components/timesheet-modal";
import { ScheduleModal } from "./components/schedule-modal";
import { TODAY_ATTENDANCE, TIMESHEETS, WORK_SCHEDULES } from "./data";
import type {
  AttendanceRecord,
  NewAttendanceRecord,
  TimesheetRecord,
  WorkSchedule,
  NewWorkSchedule,
} from "./types";

export function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>(TODAY_ATTENDANCE);
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>(TIMESHEETS);
  const [schedules, setSchedules] = useState<WorkSchedule[]>(WORK_SCHEDULES);

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
    const now = new Date().toISOString();
    setTimesheets((prev) =>
      prev.map((ts) =>
        ts.id === id
          ? {
              ...ts,
              status: "approved" as const,
              approvedAt: now,
              approvedBy: "HR Manager",
            }
          : ts,
      ),
    );
  }

  function handleRejectTimesheet(id: string, reason: string) {
    setTimesheets((prev) =>
      prev.map((ts) =>
        ts.id === id
          ? {
              ...ts,
              status: "rejected" as const,
              rejectionReason: reason,
            }
          : ts,
      ),
    );
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-4xl font-semibold">Attendance</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track employee clock-ins, timesheets, and work schedules
        </p>
      </div>

      <StatCards records={records} timesheets={timesheets} />

      <Tabs defaultValue="today">
        <PageTabsList
          tabs={[
            { value: "today", label: "Today" },
            { value: "timesheets", label: "Timesheets" },
            { value: "schedules", label: "Schedules" },
          ]}
        />

        <TabsContent value="today" className="mt-4 space-y-4">
          <OverviewTable
            records={records}
            onEdit={handleEditRecord}
            onLogAttendance={handleLogAttendance}
          />
        </TabsContent>

        <TabsContent value="timesheets" className="mt-4 space-y-4">
          <TimesheetsTable
            timesheets={timesheets}
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
