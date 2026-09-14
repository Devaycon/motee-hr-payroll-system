"use client";

// Self-service shows one person their own record, so it is never narrowed
// by the admin shell's branch switcher.
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type {
  LeaveBalance,
  LeaveBalanceType,
} from "@/src/lib/types/employee.types";
import type { LeaveRequest, LeaveStatus, LeaveType } from "@/src/lib/types/hr.types";

function mapLeaveType(t: string): LeaveBalanceType {
  if (
    t === "annual" ||
    t === "sick" ||
    t === "maternity" ||
    t === "paternity" ||
    t === "compassionate"
  )
    return t;
  return "annual";
}

function mapLeaveTypeFull(t: string): LeaveType {
  if (
    t === "annual" ||
    t === "sick" ||
    t === "maternity" ||
    t === "paternity" ||
    t === "compassionate"
  )
    return t;
  return "annual";
}

function mapStatus(s: string): LeaveStatus {
  if (s === "approved" || s === "rejected") return s;
  return "pending";
}

interface RawBalance {
  employeeId?: string;
  type?: string;
  leaveType?: string;
  totalEntitlement?: number;
  daysUsed?: number;
  balance?: number;
}

export function useMyLeaveBalances() {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  return useLocaleSection<LeaveBalance[]>((bundle) => {
    if (!employeeId) return [];
    const balances = (bundle.leaveBalances ?? []) as RawBalance[];
    return balances
      .filter((b) => b.employeeId === employeeId)
      .map((b) => ({
        type: mapLeaveType(b.type ?? b.leaveType ?? "annual"),
        total: b.totalEntitlement ?? 21,
        used: b.daysUsed ?? 0,
        remaining: (b.totalEntitlement ?? 21) - (b.daysUsed ?? 0),
      }));
  });
}

export function useMyLeaveHistory() {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const employeeName = useAppSelector((s) => s.auth.user?.name);
  return useLocaleSection<LeaveRequest[]>((bundle) => {
    if (!employeeId) return [];
    return bundle.leaveRequests
      .filter((r) => r.employeeId === employeeId)
      .map((r) => ({
        id: r.id,
        employeeId,
        employeeName: employeeName ?? employeeId,
        type: mapLeaveTypeFull(r.type),
        startDate: r.startDate,
        endDate: r.endDate,
        days: r.days ?? 1,
        status: mapStatus(r.status),
        reason: r.reason ?? "",
      }));
  });
}
