import type { BulkOnboardingRow, OnboardingRecord } from "@/src/lib/types/onboarding";

/**
 * One bulk-upload row → an onboarding record. Shared by the import itself and
 * the upload preview, so the payroll checks the preview shows are run on
 * exactly what gets saved.
 */
export function bulkRowToRecord(row: BulkOnboardingRow, id: string, today: string): OnboardingRecord {
  const fullName = `${row.firstName} ${row.lastName}`;
  const initials = `${row.firstName[0] ?? ""}${row.lastName[0] ?? ""}`.toUpperCase();
  const p = row.payroll;
  return {
    id,
    referenceId: row.employeeId || undefined,
    employeeName: fullName,
    employeeInitials: initials,
    email: row.email,
    jobTitle: row.jobTitle,
    department: row.department,
    startDate: row.startDate,
    stage: "pre_boarding",
    status: "not_started",
    tasks: [],
    completedTasks: 0,
    totalTasks: 0,
    welcomeEmailSent: false,
    initiatedAt: today,
    mode: "bulk",
    // The rest of what the import row carries (employment type, manager,
    // medical facts, asset assignment, payroll details) used to be dropped
    // here, with no path back to the employee record once onboarding cleared.
    joinerData: {
      employmentType: row.employmentType,
      manager: row.manager,
      allergies: row.allergies,
      conditions: row.conditions,
      medications: row.medications,
      dietaryRequirements: row.dietaryRequirements,
      accessibilityNeeds: row.accessibilityNeeds,
      assetTag: row.assetTag,
      assetName: row.assetName,
      assetCategory: row.assetCategory,
      assetSerialNumber: row.assetSerialNumber,
      assetAssignedDate: row.assetAssignedDate,
      ...(p
        ? {
            salary: p.salary,
            monthlyBasic: p.monthlyBasic,
            monthlyHousing: p.monthlyHousing,
            monthlyTransport: p.monthlyTransport,
            state: p.state,
            taxId: p.taxId,
            pfaName: p.pfaName,
            pensionId: p.rsaPin,
            nhfNumber: p.nhfNumber,
            bankName: p.bankName,
            bankCode: p.bankCode,
            bankAccountNumber: p.accountNumber,
            bankAccountName: p.accountName,
            bvn: p.bvn,
          }
        : {}),
    } as OnboardingRecord["joinerData"],
  };
}

/** Payroll fields that are filled in (any one is enough to say the row carries payroll details). */
export const hasPayrollDetails = (row: BulkOnboardingRow) => !!row.payroll && Object.values(row.payroll).some((v) => v.trim() !== "");
