"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  ClearanceItem,
  ExitReason,
  OffboardingRecord,
  OffboardingStatus,
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

function mapStatus(s?: string): OffboardingStatus {
  if (s === "in_progress" || s === "completed" || s === "cancelled") return s;
  return "pending";
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

export function useOffboardingRecords() {
  return useLocaleSection<OffboardingRecord[]>(buildOffboarding);
}
