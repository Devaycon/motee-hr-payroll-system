"use client";

import { useMemo } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { applyEmployeeOverrides } from "@/src/lib/profile/overrides";
import { employmentTypeFromName } from "@/src/lib/constants/employment-types";
import type { MyProfile } from "@/src/lib/types/employee.types";
import type {
  LocaleBundle,
  LocaleEmployee,
} from "@/src/lib/types/locale";

interface RawEmergency {
  name?: string;
  relationship?: string;
  phone?: string;
}

function toMyProfile(
  emp: LocaleEmployee,
  bundle: LocaleBundle,
): MyProfile {
  const empType = bundle.employmentTypes.find((t) => t.id === emp.employmentTypeId);
  const employmentType = employmentTypeFromName(empType?.name);
  const emergencyContact: RawEmergency =
    ((emp as unknown) as { emergencyContact?: RawEmergency }).emergencyContact ?? {};
  const manager = emp.managerId
    ? bundle.employees.find((e) => e.id === emp.managerId)
    : null;
  return {
    id: emp.id,
    name: emp.fullName,
    email: emp.email,
    phone: emp.phone,
    department: emp.departmentName,
    jobTitle: emp.jobTitle,
    employmentType,
    status: emp.status === "on_leave" || emp.status === "probation" ? emp.status : "active",
    startDate: emp.startDate,
    avatar: null,
    salary: emp.salary?.amount ?? 0,
    managerId: emp.managerId,
    managerName: manager?.fullName ?? null,
    dateOfBirth: emp.dateOfBirth,
    gender: emp.gender,
    nationality: emp.nationality,
    maritalStatus: emp.maritalStatus,
    workMode:
      emp.workMode === "remote"
        ? "Remotely"
        : emp.workMode === "hybrid"
          ? "Hybrid"
          : "At Office",
    workLocation: emp.workLocation,
    grade: emp.grade,
    identifiers: emp.identifiers,
    emergencyContact: {
      name: emergencyContact.name ?? "",
      relationship: emergencyContact.relationship ?? "",
      phone: emergencyContact.phone ?? "",
    },
    bankAccount: {
      bankName: emp.bankDetails?.bankName ?? "",
      accountNumber: emp.bankDetails?.accountNumber ?? "",
      accountName: emp.bankDetails?.accountName ?? emp.fullName,
    },
    address: {
      street: emp.address?.line1 ?? "",
      city: emp.address?.city ?? "",
      state: emp.address?.region ?? "",
      country: emp.address?.country ?? "",
      postalCode: emp.address?.postalCode ?? "",
    },
  };
}

export function useMyProfile() {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const overrides = useAppSelector((s) => s.profileEdits.overrides);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo<MyProfile | null>(() => {
    if (!bundle) return null;
    // Resolve the logged-in employee; fall back to the first employee in the
    // active locale so the portal still renders (country-correct) pre-login.
    const base =
      bundle.employees.find((e) => e.id === employeeId) ?? bundle.employees[0];
    if (!base) return null;
    return toMyProfile(applyEmployeeOverrides(base, overrides[base.id]), bundle);
  }, [bundle, employeeId, overrides]);
  return { data, loading, error };
}

/** Raw (override-applied) LocaleEmployee for the logged-in user + their id. */
export function useMyEmployeeRecord() {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const overrides = useAppSelector((s) => s.profileEdits.overrides);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo<{ employee: LocaleEmployee; id: string } | null>(() => {
    if (!bundle) return null;
    const base =
      bundle.employees.find((e) => e.id === employeeId) ?? bundle.employees[0];
    if (!base) return null;
    return { employee: applyEmployeeOverrides(base, overrides[base.id]), id: base.id };
  }, [bundle, employeeId, overrides]);
  return { data, loading, error };
}
