"use client";

import { useMemo } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { applyBundleOverrides } from "@/src/lib/profile/overrides";
import { onboardingRecordToPendingEmployee } from "@/src/lib/demo/pending-employees";
import {
  offboardingEmployeeIds,
  useOffboardingRecords,
} from "@/src/components/hr/offboarding/hooks";
import type { EmployeeRow } from "@/src/lib/types/employees";
import { employmentTypeFromName } from "@/src/lib/constants/employment-types";
import {
  activeLeaveFromBundle,
  type ActiveLeave,
} from "@/src/lib/utils/active-leave";
import type {
  LocaleBundle,
  LocaleEmployee,
} from "@/src/lib/types/locale";

/**
 * Bundle status values that mean the person has left. Kept in step with the
 * vocabulary the dashboard already uses (`hr/dashboard/hooks.ts`).
 */
const LEAVER_STATUSES = [
  "terminated",
  "resigned",
  "offboarded",
  "left",
  "inactive",
  "deactivated",
];

function mapStatus(status: string): EmployeeRow["status"] {
  if (status === "on_leave" || status === "probation") return status;
  // Leavers used to be silently coerced to "active", which hid every exited
  // employee from the table (client feedback §1.1).
  if (LEAVER_STATUSES.includes(status)) return "inactive";
  return "active";
}

function toEmployeeRow(
  emp: LocaleEmployee,
  empTypeName: string | undefined,
  managerName: string | null,
  directReportCount: number,
  branchName: string | undefined,
  activeLeave?: ActiveLeave,
): EmployeeRow {
  return {
    id: emp.id,
    leaveType: activeLeave?.type,
    leaveTypeLabel: activeLeave?.label,
    leaveReturnDate: activeLeave?.returnDate,
    referenceId: emp.employeeNumber,
    name: emp.fullName,
    initials: emp.initials,
    email: emp.email,
    phone: emp.phone,
    department: emp.departmentName,
    jobTitle: emp.jobTitle,
    employmentType: employmentTypeFromName(empTypeName),
    status: mapStatus(emp.status),
    startDate: emp.startDate,
    salary: emp.salary?.amount ?? 0,
    managerId: emp.managerId,
    managerName,
    directReportCount,
    dateOfBirth: emp.dateOfBirth,
    gender: emp.gender,
    nationality: emp.nationality,
    maritalStatus: emp.maritalStatus,
    address: emp.address?.line1,
    state: emp.address?.region,
    country: emp.address?.country,
    workMode:
      emp.workMode === "remote"
        ? "Remotely"
        : emp.workMode === "hybrid"
          ? "Hybrid"
          : "At Office",
    branchId: emp.branchId,
    // Falls back to the denormalised name so a record predating branches still
    // shows something rather than an empty cell.
    branchName: branchName ?? emp.workLocation,
    workLocation: emp.workLocation,
    grade: emp.grade,
    bankName: emp.bankDetails?.bankName,
    bankAccountNumber: emp.bankDetails?.accountNumber,
    bankAccountName: emp.bankDetails?.accountName,
    ninNumber: emp.identifiers?.nin,
    passportNumber: emp.identifiers?.passport,
    driverLicenseNumber: emp.identifiers?.driversLicense,
    taxId: emp.identifiers?.tin,
    pensionId: emp.identifiers?.pensionId,
    nhfNumber: emp.identifiers?.nhfNumber,
  };
}

function buildEmployees(bundle: LocaleBundle): EmployeeRow[] {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const empTypeNameById = new Map(
    bundle.employmentTypes.map((t) => [t.id, t.name]),
  );
  const branchNameById = new Map(
    (bundle.branches ?? []).map((b) => [b.id, b.name]),
  );
  // Count direct reports per manager so the table can flag line managers.
  const directReportCounts = new Map<string, number>();
  for (const e of bundle.employees) {
    if (e.managerId) {
      directReportCounts.set(
        e.managerId,
        (directReportCounts.get(e.managerId) ?? 0) + 1,
      );
    }
  }
  // Joins leave requests onto employees so "On Leave" can say which kind (§C1).
  const activeLeave = activeLeaveFromBundle(bundle);
  return bundle.employees.map((e) => {
    const manager = e.managerId ? employeesById.get(e.managerId) : null;
    return toEmployeeRow(
      e,
      empTypeNameById.get(e.employmentTypeId),
      manager?.fullName ?? null,
      directReportCounts.get(e.id) ?? 0,
      e.branchId ? branchNameById.get(e.branchId) : undefined,
      activeLeave.get(e.id),
    );
  });
}

/**
 * The full employee list, with lifecycle state layered on in precedence order:
 *
 *   locale bundle status
 *     → live offboarding record  ("offboarding")
 *     → HR status override       (deactivate / exit / reactivate)
 *     → soft delete              ("deleted", always wins)
 *
 * In-flight and cleared onboarding records are folded in as "pending" and
 * "onboarded" rows so every tab in the Employees table has a source
 * (client feedback §1.1).
 */
export function useEmployees() {
  const overrides = useAppSelector((s) => s.profileEdits.overrides);
  const statusOverrides = useAppSelector((s) => s.employees.statusOverrides);
  const deleted = useAppSelector((s) => s.employees.deleted);
  const onboardingRecords = useAppSelector((s) => s.onboardingRecords.records);
  const cleared = useAppSelector((s) => s.onboardingRecords.cleared);
  // Reading through the hook also seeds the offboarding slice, so the
  // "Offboarding Notice" tab works without visiting /talent/offboarding first.
  const { data: offboarding } = useOffboardingRecords();

  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);

  const data = useMemo(() => {
    if (!bundle) return null;
    const onNotice = offboardingEmployeeIds(offboarding ?? []);
    const deletedIds = new Set(deleted);

    const applyLifecycle = (row: EmployeeRow): EmployeeRow => {
      let status = row.status;
      if (onNotice.has(row.id)) status = "offboarding";
      const override = statusOverrides[row.id];
      if (override) status = override;
      if (deletedIds.has(row.id)) status = "deleted";
      return status === row.status ? row : { ...row, status };
    };

    const fromBundle = buildEmployees(
      applyBundleOverrides(bundle, overrides),
    ).map(applyLifecycle);

    // Hires still working through an onboarding workflow.
    const pending = onboardingRecords
      .map(onboardingRecordToPendingEmployee)
      .map(applyLifecycle);

    return [...cleared.map(applyLifecycle), ...pending, ...fromBundle];
  }, [
    bundle,
    overrides,
    statusOverrides,
    deleted,
    offboarding,
    onboardingRecords,
    cleared,
  ]);

  return { data, loading, error };
}

export function useDepartmentOptions() {
  return useLocaleSection<string[]>((bundle) => [
    "all",
    ...bundle.departments.map((d) => d.name),
  ]);
}
