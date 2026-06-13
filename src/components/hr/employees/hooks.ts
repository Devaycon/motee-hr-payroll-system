"use client";

import { useMemo } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { applyBundleOverrides } from "@/src/lib/profile/overrides";
import type { EmployeeRow } from "@/src/lib/types/employees";
import { employmentTypeFromName } from "@/src/lib/constants/employment-types";
import type {
  LocaleBundle,
  LocaleEmployee,
} from "@/src/lib/types/locale";

function mapStatus(status: string): EmployeeRow["status"] {
  if (status === "on_leave" || status === "probation") return status;
  return "active";
}

function toEmployeeRow(
  emp: LocaleEmployee,
  empTypeName: string | undefined,
  managerName: string | null,
  directReportCount: number,
): EmployeeRow {
  return {
    id: emp.id,
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
  return bundle.employees.map((e) => {
    const manager = e.managerId ? employeesById.get(e.managerId) : null;
    return toEmployeeRow(
      e,
      empTypeNameById.get(e.employmentTypeId),
      manager?.fullName ?? null,
      directReportCounts.get(e.id) ?? 0,
    );
  });
}

export function useEmployees() {
  const overrides = useAppSelector((s) => s.profileEdits.overrides);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo(
    () => (bundle ? buildEmployees(applyBundleOverrides(bundle, overrides)) : null),
    [bundle, overrides],
  );
  return { data, loading, error };
}

export function useDepartmentOptions() {
  return useLocaleSection<string[]>((bundle) => [
    "all",
    ...bundle.departments.map((d) => d.name),
  ]);
}
