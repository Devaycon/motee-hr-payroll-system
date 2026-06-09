"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  LeaveBalance,
  LeavePolicy,
  LeaveRequest,
  LeaveStatus,
  LeaveTypeName,
} from "@/src/lib/types/leave";
import type { LocaleBundle } from "@/src/lib/types/locale";

function mapLeaveType(t: string): LeaveTypeName {
  if (
    t === "annual" ||
    t === "sick" ||
    t === "maternity" ||
    t === "paternity" ||
    t === "unpaid" ||
    t === "compassionate" ||
    t === "study"
  ) {
    return t;
  }
  return "annual";
}

function mapLeaveStatus(s: string): LeaveStatus {
  if (s === "approved" || s === "rejected" || s === "cancelled") return s;
  return "pending";
}

interface RawLeavePolicy {
  id?: string;
  name?: string;
  type?: string;
  description?: string;
  days?: number;
  maxDaysPerYear?: number;
  minNoticeDays?: number;
  maxConsecutiveDays?: number;
  requiresMedicalCertificate?: boolean;
  carryOverAllowed?: boolean;
  maxCarryOverDays?: number;
}

interface RawLeaveBalance {
  employeeId?: string;
  type?: string;
  balance?: number;
  totalEntitlement?: number;
  daysUsed?: number;
  daysPending?: number;
}

interface LeaveData {
  requests: LeaveRequest[];
  balances: LeaveBalance[];
  policies: LeavePolicy[];
}

function buildLeave(bundle: LocaleBundle): LeaveData {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));

  const requests: LeaveRequest[] = bundle.leaveRequests.map((r) => {
    const emp = employeesById.get(r.employeeId);
    return {
      id: r.id,
      employeeName: emp?.fullName ?? r.employeeId,
      employeeInitials: emp?.initials ?? "??",
      department: emp?.departmentName ?? "—",
      jobTitle: emp?.jobTitle ?? "",
      leaveType: mapLeaveType(r.type),
      startDate: r.startDate,
      endDate: r.endDate,
      totalDays: r.days ?? 1,
      isHalfDay: false,
      status: mapLeaveStatus(r.status),
      submittedAt: r.startDate,
      notes: r.reason,
    };
  });

  const balances: LeaveBalance[] = bundle.leaveBalances.map((raw, i) => {
    const r = raw as RawLeaveBalance;
    const emp = r.employeeId ? employeesById.get(r.employeeId) : null;
    return {
      id: `LB-${i}`,
      employeeName: emp?.fullName ?? r.employeeId ?? "Unknown",
      employeeInitials: emp?.initials ?? "??",
      department: emp?.departmentName ?? "—",
      leaveType: mapLeaveType(r.type ?? "annual"),
      totalEntitlement: r.totalEntitlement ?? r.balance ?? 21,
      daysUsed: r.daysUsed ?? 0,
      daysPending: r.daysPending ?? 0,
    };
  });

  const policies: LeavePolicy[] = bundle.leavePolicies.map((raw, i) => {
    const r = raw as RawLeavePolicy;
    return {
      id: r.id ?? `LP-${i}`,
      name: r.name ?? `${mapLeaveType(r.type ?? "annual")} policy`,
      leaveType: mapLeaveType(r.type ?? "annual"),
      description: r.description,
      maxDaysPerYear: r.maxDaysPerYear ?? r.days ?? 21,
      minNoticeDays: r.minNoticeDays ?? 5,
      maxConsecutiveDays: r.maxConsecutiveDays ?? 14,
      requiresMedicalCertificate: r.requiresMedicalCertificate ?? false,
      carryOverAllowed: r.carryOverAllowed ?? false,
      maxCarryOverDays: r.maxCarryOverDays ?? 0,
      createdAt: bundle.tenant.createdAt.slice(0, 10),
    };
  });

  return { requests, balances, policies };
}

export function useLeaveData() {
  return useLocaleSection<LeaveData>(buildLeave);
}
