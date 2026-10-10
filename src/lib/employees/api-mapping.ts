import type { EmployeeRow } from "@/src/lib/types/employees";
import type { EmploymentType as UiEmploymentType } from "@/src/lib/constants/employment-types";
import type { EmploymentType as ApiEmploymentType } from "@/src/types/common";
import type {
  EmployeeDto,
  EmployeeListItemDto,
  EmployeeRequest,
  EmployeeStatus as ApiEmployeeStatus,
  WorkMode as ApiWorkMode,
} from "@/src/types/employees";

/**
 * Translation between the API's employee shapes and the row shape the screens
 * were built around. The API speaks camelCase enums (`fullTime`, `onLeave`);
 * the UI's own vocabulary is snake_case (`full_time`, `on_leave`).
 */

const EMPLOYMENT_TYPE_TO_UI: Record<ApiEmploymentType, UiEmploymentType> = {
  fullTime: "full_time",
  partTime: "part_time",
  temporary: "temporary",
  contract: "contract",
  freelance: "freelance",
  internship: "internship",
  apprenticeship: "apprenticeship",
  casual: "casual",
  seasonal: "seasonal",
  remote: "remote",
  fieldBased: "field_based",
};

const EMPLOYMENT_TYPE_TO_API = Object.fromEntries(
  Object.entries(EMPLOYMENT_TYPE_TO_UI).map(([api, ui]) => [ui, api]),
) as Record<UiEmploymentType, ApiEmploymentType>;

export function employmentTypeFromApi(
  type: ApiEmploymentType | null | undefined,
): UiEmploymentType {
  return (type && EMPLOYMENT_TYPE_TO_UI[type]) || "full_time";
}

export function employmentTypeToApi(type: UiEmploymentType): ApiEmploymentType {
  return EMPLOYMENT_TYPE_TO_API[type] ?? "fullTime";
}

export function employeeStatusFromApi(
  status: ApiEmployeeStatus,
): EmployeeRow["status"] {
  return status === "onLeave" ? "on_leave" : status;
}

export function employeeStatusToApi(
  status: EmployeeRow["status"],
): ApiEmployeeStatus {
  return status === "on_leave" ? "onLeave" : status;
}

const WORK_MODE_LABELS: Record<ApiWorkMode, string> = {
  remote: "Remotely",
  hybrid: "Hybrid",
  onsite: "At Office",
};

export function workModeFromApi(
  mode: ApiWorkMode | null | undefined,
): string | undefined {
  return mode ? WORK_MODE_LABELS[mode] : undefined;
}

export function workModeToApi(label: string | undefined): ApiWorkMode | undefined {
  const match = Object.entries(WORK_MODE_LABELS).find(
    ([api, ui]) => ui === label || api === label,
  );
  return match?.[0] as ApiWorkMode | undefined;
}

export function listItemToEmployeeRow(emp: EmployeeListItemDto): EmployeeRow {
  return {
    id: emp.id,
    referenceId: emp.employeeNumber ?? undefined,
    name: emp.name,
    initials: emp.initials,
    email: emp.email,
    phone: emp.phone ?? "",
    department: emp.department ?? "",
    jobTitle: emp.jobTitle ?? "",
    employmentType: employmentTypeFromApi(emp.employmentType),
    status: employeeStatusFromApi(emp.status),
    startDate: emp.startDate ?? "",
    // Pay is not part of the employee record on the API.
    salary: 0,
    managerId: emp.managerId ?? null,
    managerName: emp.managerName ?? null,
    directReportCount: emp.directReportCount,
    workMode: workModeFromApi(emp.workMode),
    branchId: emp.branchId ?? undefined,
    branchName: emp.branchName ?? emp.workLocation ?? undefined,
    workLocation: emp.workLocation ?? undefined,
  };
}

export function employeeDtoToRow(emp: EmployeeDto): EmployeeRow {
  return {
    id: emp.id,
    referenceId: emp.employeeNumber ?? undefined,
    name: emp.fullName,
    initials:
      emp.initials ||
      `${emp.firstName[0] ?? ""}${emp.lastName[0] ?? ""}`.toUpperCase(),
    email: emp.email,
    phone: emp.phone ?? "",
    department: emp.department ?? "",
    jobTitle: emp.jobTitle ?? "",
    employmentType: employmentTypeFromApi(emp.employmentType),
    status: employeeStatusFromApi(emp.status),
    onboardingMethod: emp.onboardingMethod,
    startDate: emp.startDate ?? "",
    salary: 0,
    managerId: emp.managerId ?? null,
    managerName: emp.managerName ?? null,
    directReportCount: emp.directReportCount,
    dateOfBirth: emp.dateOfBirth ?? undefined,
    gender: emp.gender ?? undefined,
    nationality: emp.nationality ?? undefined,
    maritalStatus: emp.maritalStatus ?? undefined,
    address: emp.address ?? undefined,
    state: emp.state ?? undefined,
    country: emp.countryOfEmployment ?? undefined,
    workMode: workModeFromApi(emp.workMode),
    branchId: emp.branchId ?? undefined,
    branchName: emp.branchName ?? emp.workLocation ?? undefined,
    workLocation: emp.workLocation ?? undefined,
    grade: emp.grade ?? undefined,
    bankName: emp.bankDetails?.bankName ?? undefined,
    bankAccountNumber: emp.bankDetails?.accountNumber ?? undefined,
    bankAccountName: emp.bankDetails?.accountHolderName ?? undefined,
    emergencyContactName: emp.emergencyContactName ?? undefined,
    emergencyContactRelationship: emp.emergencyContactRelationship ?? undefined,
    emergencyContactPhone: emp.emergencyContactPhone ?? undefined,
    ninNumber: emp.identityDocuments?.nationalIdNumber ?? undefined,
    passportNumber: emp.identityDocuments?.passportNumber ?? undefined,
    passportExpiry: emp.identityDocuments?.passportExpiry ?? undefined,
    passportCountry: emp.identityDocuments?.passportIssuingCountry ?? undefined,
    driverLicenseNumber:
      emp.identityDocuments?.drivingLicenceNumber ?? undefined,
    taxId: emp.identityDocuments?.taxIdNumber ?? undefined,
    pensionId: emp.identityDocuments?.pensionId ?? undefined,
    nhfNumber: emp.identityDocuments?.housingFundNumber ?? undefined,
  };
}

/**
 * `PUT /employees/{id}` replaces the whole record, so a partial change (move
 * department, change manager) has to resend everything else as it stands.
 */
export function employeeDtoToRequest(
  emp: EmployeeDto,
  patch: Partial<EmployeeRequest> = {},
): EmployeeRequest {
  return {
    firstName: emp.firstName,
    middleName: emp.middleName,
    lastName: emp.lastName,
    email: emp.email,
    employeeNumber: emp.employeeNumber,
    jobTitle: emp.jobTitle ?? "",
    departmentId: emp.departmentId ?? "",
    branchId: emp.branchId,
    employmentType: emp.employmentType ?? "fullTime",
    managerId: emp.managerId,
    startDate: emp.startDate,
    workLocation: emp.workLocation,
    workMode: emp.workMode,
    grade: emp.grade,
    status: emp.status,
    title: emp.title,
    preferredName: emp.preferredName,
    maidenName: emp.maidenName,
    initials: emp.initials,
    phone: emp.phone,
    dateOfBirth: emp.dateOfBirth,
    gender: emp.gender,
    nationality: emp.nationality,
    ethnicity: emp.ethnicity,
    maritalStatus: emp.maritalStatus,
    address: emp.address,
    state: emp.state,
    countryOfEmployment: emp.countryOfEmployment,
    emergencyContactName: emp.emergencyContactName,
    emergencyContactRelationship: emp.emergencyContactRelationship,
    emergencyContactPhone: emp.emergencyContactPhone,
    emergencyContactEmail: emp.emergencyContactEmail,
    bankDetails: emp.bankDetails,
    identityDocuments: emp.identityDocuments,
    ...patch,
  };
}
