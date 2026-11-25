"use client";

/**
 * The signed-in employee's own leave: balances (`/leave/balances/mine`) and
 * requests (`/leave/requests/mine`). Both are null signed out, when the
 * self-service pages keep their demo copy.
 */
import { useMemo } from "react";
import { useIsLive } from "@/src/lib/live/use-is-live";
import { useGetMyLeaveBalancesQuery } from "@/src/store/services/leave-balances";
import { useGetMyLeaveRequestsQuery } from "@/src/store/services/leave";
import { leaveKindOf } from "./api-mapping";
import type { LeaveRequestDto } from "@/src/types/leave";
import type { LeaveStatus, LeaveTypeName } from "@/src/lib/types/leave";

export interface MyBalanceRow {
  type: LeaveTypeName;
  totalEntitlement: number;
  daysUsed: number;
  daysPending: number;
  carryOver?: number;
}

export interface MyRequestRow {
  id: string;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayPeriod?: "morning" | "afternoon";
  status: LeaveStatus;
  notes?: string;
  approvedBy?: string;
  rejectionReason?: string;
  submittedAt: string;
  reliefEmployeeId?: string;
  reliefEmployeeName?: string;
}

function requestRow(r: LeaveRequestDto): MyRequestRow {
  const half = r.halfDayPeriod?.toLowerCase();
  return {
    id: r.id,
    leaveType: leaveKindOf(r.leaveTypeName),
    startDate: r.startDate.slice(0, 10),
    endDate: r.endDate.slice(0, 10),
    totalDays: r.totalDays,
    isHalfDay: r.isHalfDay,
    halfDayPeriod: half === "morning" || half === "afternoon" ? half : undefined,
    status: r.status,
    notes: r.reason ?? r.notes ?? undefined,
    approvedBy:
      [...(r.approval?.steps ?? [])].reverse().find((s) => s.status === "approved")?.resolvedName ??
      undefined,
    rejectionReason:
      r.status === "rejected"
        ? (r.approval?.steps?.find((s) => s.status === "rejected")?.note ?? undefined)
        : undefined,
    submittedAt: r.submittedAt,
    reliefEmployeeId: r.reliefEmployeeId ?? undefined,
    reliefEmployeeName: r.reliefEmployeeName ?? undefined,
  };
}

export function useMyLeave() {
  const live = useIsLive();
  const balancesQ = useGetMyLeaveBalancesQuery(undefined, { skip: !live });
  const requestsQ = useGetMyLeaveRequestsQuery({ PageSize: 200 }, { skip: !live });
  return useMemo(() => {
    const balances: MyBalanceRow[] | null = balancesQ.data?.data
      ? Object.values(
          balancesQ.data.data.reduce<Record<string, MyBalanceRow>>((acc, b) => {
            const type = leaveKindOf(b.leaveTypeName);
            const row = (acc[type] ??= { type, totalEntitlement: 0, daysUsed: 0, daysPending: 0, carryOver: 0 });
            row.totalEntitlement += b.entitlement + b.adjustments;
            row.daysUsed += b.used;
            row.daysPending += b.pending;
            row.carryOver = (row.carryOver ?? 0) + b.carriedOverAvailable;
            return acc;
          }, {}),
        )
      : null;
    const requests: MyRequestRow[] | null = requestsQ.data?.data
      ? requestsQ.data.data.items
          .map(requestRow)
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      : null;
    return { live, balances, requests, version: requestsQ.fulfilledTimeStamp ?? 0 };
  }, [live, balancesQ.data, requestsQ.data, requestsQ.fulfilledTimeStamp]);
}
