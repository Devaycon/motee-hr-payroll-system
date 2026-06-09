import type { EmployeeRow } from "@/src/lib/types/employees";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";

/** Map a fully-cleared onboarding record to an Employees-module row. */
export function onboardingRecordToEmployee(
  record: OnboardingRecord,
): EmployeeRow {
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
    status: "active",
    startDate: record.startDate,
    salary: 0,
    managerId: null,
    managerName: null,
  };
}
