import type { EmployeeRow, EmployeeStatus } from "@/src/lib/types/employees";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";

function toRow(record: OnboardingRecord, status: EmployeeStatus): EmployeeRow {
  return {
    id: `emp-${record.id}`,
    referenceId: record.referenceId,
    name: record.employeeName,
    initials: record.employeeInitials,
    email: record.email ?? "",
    phone: "",
    department: record.department,
    jobTitle: record.jobTitle,
    employmentType: "full_time",
    status,
    startDate: record.startDate,
    salary: 0,
    managerId: null,
    managerName: null,
  };
}

/**
 * Map a fully-cleared onboarding record to an Employees-module row.
 * Cleared hires land on the "Onboarded" tab rather than being folded straight
 * into Active, so HR can see who has just joined (client feedback §1.1).
 */
export function onboardingRecordToEmployee(
  record: OnboardingRecord,
): EmployeeRow {
  return toRow(record, "onboarded");
}

/**
 * Map an onboarding record that is still in flight to an Employees-module row,
 * so it shows on the "Pending" tab before the workflow completes.
 */
export function onboardingRecordToPendingEmployee(
  record: OnboardingRecord,
): EmployeeRow {
  return toRow(record, "pending");
}
