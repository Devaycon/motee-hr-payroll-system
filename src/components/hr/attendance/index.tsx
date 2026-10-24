"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  useAttendanceActions,
  useAttendanceRecords,
  useTimesheets,
  useWorkSchedules,
} from "./hooks";
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
import { PresenceCheckPanel } from "./components/presence-check-panel";
import { DeductionPolicyPanel } from "./components/deduction-policy-panel";
import { NotIntegrated } from "@/src/components/shared/not-integrated";
import type {
  AttendanceRecord,
  NewAttendanceRecord,
  TimesheetRecord,
  WorkSchedule,
  NewWorkSchedule,
} from "./types";

export function AttendancePage() {
  // Today, timesheets and work patterns come from the API; every change is
  // sent there and the refetch that follows updates these lists.
  const { data, loading } = useAttendanceRecords();
  const records = data ?? [];
  const { data: timesheets } = useTimesheets();
  const { data: schedules } = useWorkSchedules();
  const actions = useAttendanceActions();

  // Controlled so the KPI cards can drill into a tab, not just a filter —
  // and so Settings' "Open Attendance" link can land directly on a tab.
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    () => searchParams.get("tab") ?? "today",
  );
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
    void actions.logAttendance(data);
  }

  function handleViewTimesheet(ts: TimesheetRecord) {
    setViewingTimesheet(ts);
    setTimesheetModalOpen(true);
  }

  function handleApproveTimesheet(id: string) {
    void actions.approveTimesheet(id);
  }

  function handleRejectTimesheet(id: string, reason: string) {
    void actions.rejectTimesheet(id, reason);
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
    void actions.saveSchedule(data, editingSchedule?.id);
  }

  function handleDeleteSchedule(id: string) {
    void actions.deleteSchedule(id);
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
            { value: "schedules", label: "Work Patterns" },
            { value: "deductions", label: "Deduction Policy" },
            { value: "presence", label: "Presence Checks" },
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

        <TabsContent value="deductions" className="mt-4 space-y-4">
          <NotIntegrated label="The deduction policy">
            <DeductionPolicyPanel />
          </NotIntegrated>
        </TabsContent>

        <TabsContent value="presence" className="mt-4 space-y-4">
          <NotIntegrated label="Presence checks">
            <PresenceCheckPanel />
          </NotIntegrated>
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
