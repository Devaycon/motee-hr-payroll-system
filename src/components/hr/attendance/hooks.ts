"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  recordToLogRequest,
  scheduleToRequest,
  toAttendanceRecord,
  toTimesheetRecord,
  toWorkSchedule,
  todayIso,
} from "@/src/lib/attendance/api-mapping";
import type {
  AttendanceRecord,
  NewAttendanceRecord,
  NewWorkSchedule,
  TimesheetRecord,
  WorkSchedule,
} from "@/src/lib/types/attendance";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  useApproveTimesheetMutation,
  useCreateWorkScheduleMutation,
  useDeleteWorkScheduleMutation,
  useGetWorkSchedulesQuery,
  useLogAttendanceMutation,
  useRejectTimesheetMutation,
  useUpdateWorkScheduleMutation,
} from "@/src/store/services/attendance";
import {
  useGetAllTimesheetsQuery,
  useGetAttendanceForDateQuery,
} from "@/src/store/services/collections";

const useSkip = () =>
  useAppSelector((s) => !s.session.is_loggedIn || !s.session.tenant_id);

/** Today's attendance for everyone in the viewer's access scope. */
export function useAttendanceRecords() {
  const skip = useSkip();
  const { data, isLoading, error } = useGetAttendanceForDateQuery(todayIso(), {
    skip,
  });
  const records = useMemo<AttendanceRecord[] | null>(
    () => (data ? data.map(toAttendanceRecord) : null),
    [data],
  );
  return {
    data: records,
    loading: isLoading,
    error: error ? getApiErrorMessage(error) : null,
  };
}

/** A single Today record by id, for the read-only detail page. */
export function useAttendanceRecord(id: string) {
  const { data, loading, error } = useAttendanceRecords();
  const record = useMemo(
    () => data?.find((r) => r.id === id) ?? null,
    [data, id],
  );
  return { record, loading, error };
}

export function useTimesheets() {
  const skip = useSkip();
  const { data, isLoading } = useGetAllTimesheetsQuery(undefined, { skip });
  const timesheets = useMemo<TimesheetRecord[]>(
    () => (data ?? []).map(toTimesheetRecord),
    [data],
  );
  return { data: timesheets, loading: isLoading };
}

export function useWorkSchedules() {
  const skip = useSkip();
  const { data, isLoading } = useGetWorkSchedulesQuery(undefined, { skip });
  const records = useMemo(() => data?.data ?? [], [data]);
  const schedules = useMemo<WorkSchedule[]>(
    () => records.map(toWorkSchedule),
    [records],
  );
  return { data: schedules, records, loading: isLoading };
}

/** Each action resolves true once the server has accepted it. */
export function useAttendanceActions() {
  const { records: scheduleRecords } = useWorkSchedules();
  const [logAttendance] = useLogAttendanceMutation();
  const [approveTimesheet] = useApproveTimesheetMutation();
  const [rejectTimesheet] = useRejectTimesheetMutation();
  const [createSchedule] = useCreateWorkScheduleMutation();
  const [updateSchedule] = useUpdateWorkScheduleMutation();
  const [deleteSchedule] = useDeleteWorkScheduleMutation();

  return useMemo(() => {
    const attempt = async (
      run: () => Promise<unknown>,
      fallback: string,
      success?: string,
    ) => {
      try {
        await run();
        if (success) toast.success(success);
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, fallback));
        return false;
      }
    };

    return {
      /** A manual entry; logging the same person and day again replaces it. */
      logAttendance(record: NewAttendanceRecord) {
        const { employeeId } = record;
        if (!employeeId) {
          toast.error("Choose an employee.");
          return Promise.resolve(false);
        }
        return attempt(
          () => logAttendance(recordToLogRequest({ ...record, employeeId })).unwrap(),
          "Could not save the attendance record.",
          `Attendance saved for ${record.employeeName}.`,
        );
      },

      approveTimesheet(id: string) {
        return attempt(
          () => approveTimesheet(id).unwrap(),
          "Could not approve the timesheet.",
          "Timesheet approved.",
        );
      },

      rejectTimesheet(id: string, reason: string) {
        return attempt(
          () => rejectTimesheet({ id, body: { reason } }).unwrap(),
          "Could not reject the timesheet.",
          "Timesheet rejected.",
        );
      },

      saveSchedule(schedule: NewWorkSchedule, editingId?: string) {
        const existing = scheduleRecords.find((s) => s.id === editingId);
        const body = scheduleToRequest(schedule, existing);
        return attempt(
          () =>
            existing
              ? updateSchedule({ id: existing.id, body }).unwrap()
              : createSchedule(body).unwrap(),
          "Could not save the work pattern.",
          existing ? `${schedule.name} updated.` : `${schedule.name} added.`,
        );
      },

      deleteSchedule(id: string) {
        return attempt(
          () => deleteSchedule(id).unwrap(),
          "Could not delete the work pattern.",
          "Work pattern deleted.",
        );
      },
    };
  }, [
    scheduleRecords,
    logAttendance,
    approveTimesheet,
    rejectTimesheet,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  ]);
}
