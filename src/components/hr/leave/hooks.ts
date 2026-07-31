"use client";

import { useEffect, useMemo } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { seed, reseed } from "@/src/lib/stores/leave-slice";
import { stagesForTemplate, type LeaveStage } from "@/src/lib/leave/stages";
import type { ApprovalChainStep } from "@/src/lib/types/approvals";
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
  if (
    s === "approved" ||
    s === "rejected" ||
    s === "cancelled" ||
    s === "awaiting_manager" ||
    s === "awaiting_hr"
  ) {
    return s;
  }
  if (s === "in_progress") return "approved";
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
  carryOverDays?: number;
  maxCarryOverDays?: number;
  eligibility?: string;
  publicHolidayRule?: string;
  attachmentRequirement?: string;
  documentUrl?: string;
}

interface RawLeaveBalance {
  id?: string;
  employeeId?: string;
  leavePolicyId?: string;
  type?: string;
  balance?: number;
  entitlement?: number;
  totalEntitlement?: number;
  used?: number;
  daysUsed?: number;
  pending?: number;
  daysPending?: number;
  carriedOver?: number;
}

export interface LeaveData {
  requests: LeaveRequest[];
  balances: LeaveBalance[];
  policies: LeavePolicy[];
}

function buildLeave(bundle: LocaleBundle): LeaveData {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const empTypeNameById = new Map(
    bundle.employmentTypes.map((t) => [t.id, t.name]),
  );
  const policiesById = new Map(
    (bundle.leavePolicies as unknown as RawLeavePolicy[] | undefined)?.map(
      (p, i) => [p.id ?? `LP-${i}`, p],
    ) ?? [],
  );

  const requests: LeaveRequest[] = bundle.leaveRequests.map((r) => {
    const emp = employeesById.get(r.employeeId);
    const manager = emp?.managerId ? employeesById.get(emp.managerId) : null;
    return {
      id: r.id,
      employeeId: r.employeeId,
      employeeName: emp?.fullName ?? r.employeeId,
      employeeInitials: emp?.initials ?? "??",
      department: emp?.departmentName ?? "—",
      jobTitle: emp?.jobTitle ?? "",
      managerName: manager?.fullName,
      location: emp?.workLocation,
      employmentType: emp ? empTypeNameById.get(emp.employmentTypeId) : undefined,
      leaveType: mapLeaveType(r.type),
      startDate: r.startDate,
      endDate: r.endDate,
      totalDays: r.days ?? 1,
      isHalfDay: false,
      status: mapLeaveStatus(r.status),
      // The locale bundle's free text is the employee's reason for the leave,
      // not an internal note — keep the two distinct (§F3).
      reason: r.reason,
      submittedAt: r.startDate,
      submittedBy: emp?.fullName,
      createdAt: r.startDate,
      history: [],
      documents: [],
    };
  });

  const balances: LeaveBalance[] = (
    (bundle.leaveBalances as unknown as RawLeaveBalance[]) ?? []
  ).map((r, i) => {
    const emp = r.employeeId ? employeesById.get(r.employeeId) : null;
    const policy = r.leavePolicyId ? policiesById.get(r.leavePolicyId) : undefined;
    return {
      id: r.id ?? `LB-${i}`,
      employeeId: r.employeeId,
      employeeName: emp?.fullName ?? r.employeeId ?? "Unknown",
      employeeInitials: emp?.initials ?? "??",
      department: emp?.departmentName ?? "—",
      leaveType: mapLeaveType(policy?.type ?? r.type ?? "annual"),
      totalEntitlement: r.totalEntitlement ?? r.entitlement ?? r.balance ?? 21,
      daysUsed: r.daysUsed ?? r.used ?? 0,
      daysPending: r.daysPending ?? r.pending ?? 0,
      carriedOver: r.carriedOver ?? policy?.carryOverDays ?? 0,
    };
  });

  const policies: LeavePolicy[] = (
    (bundle.leavePolicies as unknown as RawLeavePolicy[]) ?? []
  ).map((r, i) => ({
    id: r.id ?? `LP-${i}`,
    name: r.name ?? `${mapLeaveType(r.type ?? "annual")} policy`,
    leaveType: mapLeaveType(r.type ?? "annual"),
    description: r.description,
    maxDaysPerYear: r.maxDaysPerYear ?? r.days ?? 21,
    minNoticeDays: r.minNoticeDays ?? 5,
    maxConsecutiveDays: r.maxConsecutiveDays ?? 14,
    requiresMedicalCertificate: r.requiresMedicalCertificate ?? false,
    carryOverAllowed: r.carryOverAllowed ?? (r.carryOverDays ?? 0) > 0,
    maxCarryOverDays: r.maxCarryOverDays ?? r.carryOverDays ?? 0,
    eligibility: r.eligibility,
    publicHolidayRule: r.publicHolidayRule,
    attachmentRequirement: r.attachmentRequirement,
    documentUrl: r.documentUrl,
    createdAt: bundle.tenant.createdAt.slice(0, 10),
  }));

  return { requests, balances, policies };
}

/**
 * Seeds the leave slice from the locale bundle on first load, then serves the
 * store. Switching tenant/locale reseeds, discarding demo edits — otherwise
 * rows from the previous country would linger.
 */
export function useLeaveData() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useLocaleSection<LeaveData>(buildLeave);
  const tenantId = useAppSelector((s) => s.locale.data?.tenant.id);
  const state = useAppSelector((s) => s.leave);

  useEffect(() => {
    if (!data) return;
    if (!state.seeded) {
      dispatch(seed(data));
    }
  }, [data, state.seeded, dispatch]);

  // Reseed when the demo tenant changes.
  const seededTenant = useAppSelector((s) => s.locale.data?.tenant.id);
  useEffect(() => {
    if (!data || !state.seeded) return;
    const marker = `motee:leave:tenant`;
    if (typeof window === "undefined") return;
    const prev = window.localStorage.getItem(marker);
    if (prev && prev !== tenantId) {
      dispatch(reseed(data));
    }
    if (tenantId) window.localStorage.setItem(marker, tenantId);
  }, [data, tenantId, seededTenant, state.seeded, dispatch]);

  return {
    data: state.seeded
      ? {
          requests: state.requests,
          balances: state.balances,
          policies: state.policies,
        }
      : data,
    loading,
    error,
  };
}

/**
 * The approval stages leave requests pass through, taken from whichever chain
 * template HR has made active for `leave_request` (§F4/F7).
 */
export function useLeaveStages(): LeaveStage[] {
  const templates = useAppSelector((s) => s.approvals.templates);
  const roles = useAppSelector((s) => s.accessLevels.levels);

  return useMemo(() => {
    const forLeave = templates.filter((t) => t.documentType === "leave_request");
    const active = forLeave.find((t) => t.isDefault) ?? forLeave[0];
    const label = (approver: ApprovalChainStep["approver"]): string => {
      if (approver === "LINE_MANAGER") return "Line manager";
      if (approver === "DEPARTMENT_HEAD") return "Department head";
      const roleId = approver.startsWith("ROLE:") ? approver.slice(5) : approver;
      return roles.find((r) => r.id === roleId)?.name ?? roleId;
    };
    return stagesForTemplate(active, label);
  }, [templates, roles]);
}
