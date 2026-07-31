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

interface RawOffboarding {
  id?: string;
  employeeId?: string;
  lastWorkingDate?: string;
  lastDay?: string;
  reason?: string;
  status?: string;
  exitInterviewCompleted?: boolean;
  exitInterviewNotes?: string;
  clearance?: { item?: string; department?: string; completed?: boolean }[];
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

function mapStatus(s?: string): OffboardingStatus {
  return s && KNOWN_STATUSES.includes(s)
    ? (s as OffboardingStatus)
    : "pending";
}

const DEFAULT_CLEARANCE = [
  "Return company assets",
  "Revoke system access",
  "Handover documentation",
  "Final payroll settlement",
  "Manager sign-off",
];

function buildOffboarding(bundle: LocaleBundle): OffboardingRecord[] {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  return ((bundle.offboarding ?? []) as RawOffboarding[]).map((raw, i) => {
    const emp = raw.employeeId ? employeesById.get(raw.employeeId) : null;
    const clearanceItems: ClearanceItem[] = raw.clearance
      ? raw.clearance.map((c, j) => ({
          id: `${raw.id ?? i}-c${j}`,
          label: c.item ?? "Clearance step",
          department: c.department ?? "HR",
          completed: !!c.completed,
        }))
      : DEFAULT_CLEARANCE.map((label, j) => ({
          id: `${raw.id ?? i}-c${j}`,
          label,
          department: j === 1 ? "IT" : j === 3 ? "Finance" : "HR",
          completed: raw.status === "completed",
        }));
    return {
      id: raw.id ?? `off-${i + 1}`,
      employeeId: raw.employeeId,
      employeeName: emp?.fullName ?? raw.employeeId ?? "Unknown",
      employeeInitials: emp?.initials ?? "??",
      jobTitle: emp?.jobTitle ?? "",
      department: emp?.departmentName ?? "—",
      lastWorkingDate:
        raw.lastWorkingDate ?? raw.lastDay ?? bundle.tenant.createdAt.slice(0, 10),
      exitReason: mapReason(raw.reason),
      status: mapStatus(raw.status),
      clearanceItems,
      exitInterviewCompleted: raw.exitInterviewCompleted ?? false,
      exitInterviewNotes: raw.exitInterviewNotes,
      initiatedAt: bundle.tenant.createdAt.slice(0, 10),
    };
  });
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
