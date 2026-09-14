import type { EmployeeRow, EmployeeStatus } from "@/src/lib/types/employees";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";
import { employmentTypeFromName } from "@/src/lib/constants/employment-types";

/**
 * Everything the onboarding forms actually collect (employee-owned fields
 * from the joiner's self-service wizard, HR-owned fields from the manual and
 * bulk entry paths) lives on `record.joinerData`. This used to be read for
 * branch/work-location only and hardcoded away everywhere else — an employee
 * who fully onboarded (bank details verified, salary agreed, manager picked)
 * showed up here looking like a same-day walk-in with no salary and no
 * manager. Map through everything `EmployeeRow` already has a field for.
 */
function toRow(record: OnboardingRecord, status: EmployeeStatus): EmployeeRow {
  const jd = record.joinerData;
  return {
    id: `emp-${record.id}`,
    referenceId: record.referenceId,
    name: record.employeeName,
    initials: record.employeeInitials,
    email: record.email ?? "",
    phone: jd?.phone || "",
    department: record.department,
    jobTitle: record.jobTitle,
    employmentType: employmentTypeFromName(jd?.employmentType),
    status,
    startDate: record.startDate,
    salary: jd?.salary ? Number(jd.salary) || 0 : 0,
    managerId: jd?.managerId || null,
    managerName: jd?.manager || null,
    dateOfBirth: jd?.dateOfBirth || undefined,
    gender: jd?.gender || undefined,
    nationality: jd?.nationality || undefined,
    maritalStatus: jd?.maritalStatus || undefined,
    address: jd?.address || undefined,
    state: jd?.state || undefined,
    country: jd?.country || undefined,
    workMode: jd?.workMode || undefined,
    // Carried through so a hire still in onboarding answers the branch filter
    // the same way an active employee does.
    branchId: jd?.branchId,
    branchName: jd?.workLocation,
    grade: jd?.grade || undefined,
    bankName: jd?.bankName || undefined,
    bankAccountNumber: jd?.bankAccountNumber || undefined,
    bankAccountName: jd?.bankAccountName || undefined,
    emergencyContactName: jd?.emergencyContactName || undefined,
    emergencyContactRelationship: jd?.emergencyContactRelationship || undefined,
    emergencyContactPhone: jd?.emergencyContactPhone || undefined,
    guarantors: jd?.guarantors || undefined,
    // EmployeeRow doesn't distinguish the NG NIN from the UK NI number.
    ninNumber: jd?.ninNumber || jd?.niNumber || undefined,
    passportNumber: jd?.passportNumber || undefined,
    passportExpiry: jd?.passportExpiry || undefined,
    passportCountry: jd?.passportCountry || undefined,
    driverLicenseNumber: jd?.driverLicenseNumber || undefined,
    taxId: jd?.taxId || undefined,
    pensionId: jd?.pensionId || undefined,
    nhfNumber: jd?.nhfNumber || undefined,
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
