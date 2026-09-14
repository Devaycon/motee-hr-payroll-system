"use client";

import { useEffect } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { seed, reseed } from "@/src/lib/stores/offboarding-slice";
import {
  isOpenOffboardingStatus,
  type ClearanceItem,
  type ExitReason,
  type OffboardingRecord,
  type OffboardingStatus,
} from "@/src/lib/types/offboarding";
import type { LocaleBundle } from "@/src/lib/types/locale";

/** The fixture's `clearance` is a per-department status map, not a list. */
interface RawClearanceMap {
  it?: string;
  finance?: string;
  manager?: string;
  hr?: string;
  [dept: string]: string | undefined;
}
interface RawClearanceItem {
  item?: string;
  department?: string;
  completed?: boolean;
}
interface RawExitInterview {
  completedAt?: string;
  scheduledAt?: string;
  wouldRecommend?: boolean;
  primaryReason?: string;
  notes?: string;
}
interface RawOffboarding {
  id?: string;
  employeeId?: string;
  /** The fixture links by name, not id — see the employeeId resolution below. */
  employeeName?: string;
  jobTitle?: string;
  department?: string;
  lastWorkingDate?: string;
  lastDay?: string;
  reason?: string;
  status?: string;
  exitInterviewCompleted?: boolean;
  exitInterviewNotes?: string;
  exitInterview?: RawExitInterview;
  clearance?: RawClearanceMap | RawClearanceItem[];
  initiatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  disapprovedAt?: string;
  disapprovedBy?: string;
  disapprovalReason?: string;
  reactivatedAt?: string;
  reactivatedBy?: string;
  systemAccessRevokedAt?: string;
}

function mapReason(r?: string): ExitReason {
  switch (r) {
    case "resigned":
    case "resignation":
      return "resignation";
    case "terminated":
    case "termination":
      return "termination";
    case "redundancy":
      return "redundancy";
    case "retired":
    case "retirement":
      return "retirement";
    case "contract_end":
    case "contract":
      return "contract_end";
    default:
      return "other";
  }
}

const KNOWN_STATUSES: readonly string[] = [
  "pending",
  "approved",
  "disapproved",
  "in_progress",
  "completed",
  "reactivated",
  "cancelled",
];

const DEFAULT_CLEARANCE = [
  "Return company assets",
  "Revoke system access",
  "Handover documentation",
  "Final payroll settlement",
  "Manager sign-off",
];

const CLEARANCE_DEPT_LABELS: Record<string, { label: string; department: string }> = {
  it: { label: "IT clearance", department: "IT" },
  finance: { label: "Finance clearance", department: "Finance" },
  manager: { label: "Manager sign-off", department: "Manager" },
  hr: { label: "HR clearance", department: "HR" },
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

function buildClearanceItems(raw: RawOffboarding, recordId: string): ClearanceItem[] {
  const c = raw.clearance;
  if (Array.isArray(c)) {
    return c.map((item, j) => ({
      id: `${recordId}-c${j}`,
      label: item.item ?? "Clearance step",
      department: item.department ?? "HR",
      completed: !!item.completed,
    }));
  }
  if (c && typeof c === "object") {
    // The fixture's real shape: a per-department status map, e.g.
    // { it: "completed", finance: "in_progress", manager: "not_started" }.
    return Object.entries(c).map(([dept, value], j) => {
      const known = CLEARANCE_DEPT_LABELS[dept];
      return {
        id: `${recordId}-c${j}`,
        label: known?.label ?? `${dept} clearance`,
        department: known?.department ?? "HR",
        completed: value === "completed",
      };
    });
  }
  return DEFAULT_CLEARANCE.map((label, j) => ({
    id: `${recordId}-c${j}`,
    label,
    department: j === 1 ? "IT" : j === 3 ? "Finance" : "HR",
    completed: raw.status === "completed",
  }));
}

/** Only used for the older fixture rows that don't carry an explicit `status`. */
function deriveStatus(
  raw: RawOffboarding,
  clearanceItems: ClearanceItem[],
  exitInterviewCompleted: boolean,
): OffboardingStatus {
  if (raw.status && KNOWN_STATUSES.includes(raw.status)) {
    return raw.status as OffboardingStatus;
  }
  const allDone =
    clearanceItems.length > 0 && clearanceItems.every((c) => c.completed);
  if (allDone && exitInterviewCompleted) return "completed";
  if (clearanceItems.some((c) => c.completed)) return "in_progress";
  return "pending";
}

function buildOffboarding(bundle: LocaleBundle): OffboardingRecord[] {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const employeesByName = new Map(bundle.employees.map((e) => [e.fullName, e]));

  return ((bundle.offboarding ?? []) as RawOffboarding[]).map((raw, i) => {
    const recordId = raw.id ?? `off-${i + 1}`;
    // The fixture links by name ("employeeName"), not id — resolve the real
    // employee record either way so the name/department/job title are
    // accurate and, where possible, the Employees table's "Offboarding
    // Notice" badge can link back to this record.
    const emp =
      (raw.employeeId ? employeesById.get(raw.employeeId) : undefined) ??
      (raw.employeeName ? employeesByName.get(raw.employeeName) : undefined);
    const employeeName = emp?.fullName ?? raw.employeeName ?? "Unknown";
    const clearanceItems = buildClearanceItems(raw, recordId);
    const exitInterviewCompleted =
      raw.exitInterviewCompleted ?? !!raw.exitInterview?.completedAt;
    const lastWorkingDate =
      raw.lastWorkingDate ?? raw.lastDay ?? bundle.tenant.createdAt.slice(0, 10);

    return {
      id: recordId,
      employeeId: raw.employeeId ?? emp?.id,
      employeeName,
      employeeInitials: emp?.initials ?? initialsFrom(employeeName),
      jobTitle: raw.jobTitle ?? emp?.jobTitle ?? "",
      department: raw.department ?? emp?.departmentName ?? "—",
      lastWorkingDate,
      exitReason: mapReason(raw.reason),
      status: deriveStatus(raw, clearanceItems, exitInterviewCompleted),
      clearanceItems,
      exitInterviewCompleted,
      exitInterviewNotes:
        raw.exitInterviewNotes ??
        raw.exitInterview?.notes ??
        raw.exitInterview?.primaryReason,
      // Default to a two-week notice period before the last working day
      // rather than stamping every record with the tenant's creation date.
      initiatedAt: raw.initiatedAt ?? shiftIso(lastWorkingDate, -14),
      approvedAt: raw.approvedAt,
      approvedBy: raw.approvedBy,
      disapprovedAt: raw.disapprovedAt,
      disapprovedBy: raw.disapprovedBy,
      disapprovalReason: raw.disapprovalReason,
      reactivatedAt: raw.reactivatedAt,
      reactivatedBy: raw.reactivatedBy,
      systemAccessRevokedAt: raw.systemAccessRevokedAt,
      exitInterviewScheduledAt: raw.exitInterview?.scheduledAt,
    };
  });
}

function shiftIso(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Seeds the offboarding slice from the locale bundle on first load, then serves
 * the store. Switching tenant/locale reseeds, discarding demo edits — mirrors
 * `useLeaveData`. Both the Offboarding page and the Employees table read
 * through this, so "Offboarding Notice" and the pipeline never disagree.
 */
export function useOffboardingRecords() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useLocaleSection<OffboardingRecord[]>(
    buildOffboarding,
  );
  const tenantId = useAppSelector((s) => s.locale.data?.tenant.id);
  const records = useAppSelector((s) => s.offboarding.records);
  const seeded = useAppSelector((s) => s.offboarding.seeded);

  useEffect(() => {
    if (data && !seeded) dispatch(seed(data));
  }, [data, seeded, dispatch]);

  // Reseed when the demo tenant changes.
  useEffect(() => {
    if (!data || !seeded) return;
    if (typeof window === "undefined") return;
    const marker = "motee:offboarding:tenant";
    const prev = window.localStorage.getItem(marker);
    if (prev && prev !== tenantId) dispatch(reseed(data));
    if (tenantId) window.localStorage.setItem(marker, tenantId);
  }, [data, tenantId, seeded, dispatch]);

  return { data: seeded ? records : data, loading, error };
}

/**
 * Employee ids with a live offboarding record — drives the Employees table's
 * "Offboarding Notice" tab (client feedback §2.1).
 */
export function offboardingEmployeeIds(
  records: readonly OffboardingRecord[],
): Set<string> {
  return new Set(
    records
      .filter((r) => isOpenOffboardingStatus(r.status) && r.employeeId)
      .map((r) => r.employeeId as string),
  );
}
