"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { reseed } from "@/src/lib/stores/offboarding-slice";
import {
  isOpenOffboardingStatus,
  type ExitReason,
  type OffboardingRecord,
  type OffboardingStatus,
} from "@/src/lib/types/offboarding";
import { getApiErrorMessage } from "@/src/lib/utils";
import { useGetOffboardingRecordsQuery } from "@/src/store/services/collections";
import { useGetOffboardingStatsQuery } from "@/src/store/services/offboarding";
import type {
  ExitReason as ApiExitReason,
  OffboardingDto,
  OffboardingStatus as ApiOffboardingStatus,
} from "@/src/types/offboarding";

const STATUS_FROM_API: Record<ApiOffboardingStatus, OffboardingStatus> = {
  pending: "pending",
  approved: "approved",
  inProgress: "in_progress",
  completed: "completed",
  disapproved: "disapproved",
  reactivated: "reactivated",
};

export function exitReasonFromApi(reason: ApiExitReason): ExitReason {
  return reason === "contractEnd" ? "contract_end" : reason;
}

export function exitReasonToApi(reason: ExitReason): ApiExitReason {
  return reason === "contract_end" ? "contractEnd" : reason;
}

export function toOffboardingRecord(dto: OffboardingDto): OffboardingRecord {
  const status = STATUS_FROM_API[dto.status];
  const decided = dto.decidedAt ?? undefined;
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    employeeName: dto.employeeName,
    employeeInitials: dto.initials,
    jobTitle: dto.jobTitle ?? "",
    department: dto.department ?? "",
    lastWorkingDate: dto.lastWorkingDate,
    exitReason: exitReasonFromApi(dto.exitReason),
    status,
    clearanceItems: [...dto.clearance]
      .sort((a, b) => a.sequence - b.sequence)
      .map((item) => ({
        id: item.id,
        label: item.label,
        department: item.department,
        completed: item.completed,
        completedAt: item.completedAt ?? undefined,
        notes: item.notes ?? undefined,
      })),
    exitInterviewCompleted: Boolean(dto.exitInterviewCompletedAt),
    exitInterviewNotes: dto.exitInterviewNotes ?? dto.notes ?? undefined,
    initiatedAt: dto.initiatedAt.slice(0, 10),
    approvedAt: status === "disapproved" ? undefined : decided,
    disapprovedAt: status === "disapproved" ? decided : undefined,
    disapprovalReason:
      status === "disapproved" ? (dto.decisionReason ?? undefined) : undefined,
    reactivatedAt: dto.reactivatedAt ?? undefined,
    systemAccessRevokedAt: dto.systemAccessRevokedAt ?? undefined,
    exitInterviewScheduledAt: dto.exitInterviewScheduledAt ?? undefined,
    exitDocumentsGeneratedAt: dto.exitDocumentsGeneratedAt ?? undefined,
  };
}

/**
 * Every exit on the pipeline. The server's records are mirrored into the
 * offboarding slice the screens already read; writes are sent to the API by
 * `offboarding-listener`, and the refetch that follows lands back here.
 */
export function useOffboardingRecords() {
  const dispatch = useAppDispatch();
  const skip = useAppSelector(
    (s) => !s.session.is_loggedIn || !s.session.tenant_id,
  );
  const { data, isLoading, error } = useGetOffboardingRecordsQuery(undefined, {
    skip,
  });
  const records = useAppSelector((s) => s.offboarding.records);

  const mapped = useMemo(() => data?.map(toOffboardingRecord), [data]);

  useEffect(() => {
    if (mapped) dispatch(reseed(mapped));
  }, [mapped, dispatch]);

  return {
    data: mapped ? records : null,
    loading: isLoading,
    error: error ? getApiErrorMessage(error) : null,
  };
}

/** Pipeline totals as the server counts them. */
export function useOffboardingStats() {
  const { data } = useGetOffboardingStatsQuery();
  return data?.data ?? null;
}

/** Employee ids with an exit still in flight — drives the "Offboarding Notice" tab. */
export function offboardingEmployeeIds(
  records: readonly OffboardingRecord[],
): Set<string> {
  return new Set(
    records
      .filter((r) => isOpenOffboardingStatus(r.status) && r.employeeId)
      .map((r) => r.employeeId as string),
  );
}
