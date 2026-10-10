import type { EmploymentType as UiEmploymentType } from "@/src/lib/constants/employment-types";
import { employmentTypeToApi, workModeToApi } from "./api-mapping";
import type {
  EmployeeRequest,
  EmployeeStatus as ApiEmployeeStatus,
} from "@/src/types/employees";

/**
 * The profile screens edit an employee one dot-path at a time
 * (`bankDetails.accountNumber`). This is the table of which of those paths
 * the API stores, and how each lands on the `PUT /employees/{id}` body.
 */

/** Paths that map one-to-one onto a top-level request field. */
const DIRECT: Record<string, keyof EmployeeRequest> = {
  title: "title",
  firstName: "firstName",
  middleName: "middleName",
  lastName: "lastName",
  preferredName: "preferredName",
  maidenName: "maidenName",
  initials: "initials",
  dateOfBirth: "dateOfBirth",
  gender: "gender",
  maritalStatus: "maritalStatus",
  nationality: "nationality",
  ethnicity: "ethnicity",
  email: "email",
  phone: "phone",
  employeeNumber: "employeeNumber",
  jobTitle: "jobTitle",
  grade: "grade",
  startDate: "startDate",
  workLocation: "workLocation",
  managerId: "managerId",
  branchId: "branchId",
  departmentId: "departmentId",
  "addresses.home.line1": "address",
  "addresses.home.region": "state",
  "emergencyContacts.0.name": "emergencyContactName",
  "emergencyContacts.0.relationship": "emergencyContactRelationship",
  "emergencyContacts.0.phone": "emergencyContactPhone",
};

/** Fields the API refuses to have blanked. */
const REQUIRED = new Set<keyof EmployeeRequest>([
  "firstName",
  "lastName",
  "email",
  "jobTitle",
  "departmentId",
]);

const BANK: Record<string, keyof NonNullable<EmployeeRequest["bankDetails"]>> = {
  "bankDetails.bankName": "bankName",
  "bankDetails.accountName": "accountHolderName",
  "bankDetails.accountNumber": "accountNumber",
  "bankDetails.sortCode": "sortCode",
};

const IDENTITY: Record<
  string,
  keyof NonNullable<EmployeeRequest["identityDocuments"]>
> = {
  "identifiers.nin": "nationalIdNumber",
  "identifiers.tin": "taxIdNumber",
  "identifiers.pensionId": "pensionId",
  "identifiers.nhfNumber": "housingFundNumber",
  "identifiers.passport": "passportNumber",
  "identifiers.driversLicense": "drivingLicenceNumber",
};

/** Handled outside the record body. */
const SPECIAL = new Set([
  "status",
  "photoUrl",
  "departmentName",
  "workMode",
  "employmentTypeId",
]);

/** Whether an edit to this path is saved by the API at all. */
export function isServerField(field: string): boolean {
  return (
    field in DIRECT || field in BANK || field in IDENTITY || SPECIAL.has(field)
  );
}

const API_STATUSES: ApiEmployeeStatus[] = [
  "pending",
  "onboarded",
  "probation",
  "active",
  "onLeave",
  "offboarding",
  "inactive",
  "deleted",
];

/** `On Leave`, `on_leave` and `onLeave` all mean the same status. */
export function statusFromFieldValue(value: string): ApiEmployeeStatus | null {
  const key = value.replace(/[\s_-]/g, "").toLowerCase();
  return API_STATUSES.find((s) => s.toLowerCase() === key) ?? null;
}

export interface FieldSyncContext {
  departments: { id: string; name: string }[];
}

/**
 * Lays one edit over the request body. Returns false when the value cannot be
 * applied (an unknown department name, for instance).
 */
export function applyFieldToRequest(
  body: EmployeeRequest,
  field: string,
  value: string,
  ctx: FieldSyncContext,
): boolean {
  const trimmed = value.trim();

  if (field in DIRECT) {
    const key = DIRECT[field];
    if (!trimmed && REQUIRED.has(key)) return false;
    (body as unknown as Record<string, unknown>)[key] = trimmed || null;
    return true;
  }
  if (field in BANK) {
    body.bankDetails = { ...body.bankDetails, [BANK[field]]: trimmed || null };
    return true;
  }
  if (field in IDENTITY) {
    body.identityDocuments = {
      ...body.identityDocuments,
      [IDENTITY[field]]: trimmed || null,
    };
    return true;
  }
  if (field === "departmentName") {
    const match = ctx.departments.find(
      (d) => d.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!match) return false;
    body.departmentId = match.id;
    return true;
  }
  if (field === "workMode") {
    const mode = workModeToApi(trimmed);
    if (!mode) return false;
    body.workMode = mode;
    return true;
  }
  if (field === "employmentTypeId") {
    body.employmentType = employmentTypeToApi(trimmed as UiEmploymentType);
    return true;
  }
  return false;
}
