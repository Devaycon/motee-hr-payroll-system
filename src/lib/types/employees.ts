import type { EmploymentType } from "@/src/lib/constants/employment-types";
import type { OnboardingMethod } from "@/src/lib/constants/onboarding-methods";
import type { Guarantor } from "@/src/lib/types/onboarding";
export type { EmploymentType };
/**
 * Lifecycle state of an employee record. Drives both the Employees table tabs
 * and which row actions are enabled (client feedback §1.1/§1.3).
 */
export type EmployeeStatus =
  | "active"
  | "on_leave"
  | "probation"
  /** Has an open offboarding record but has not yet left. */
  | "offboarding"
  /** Onboarding started but not yet completed. */
  | "pending"
  /** Onboarding completed — a recent joiner. */
  | "onboarded"
  /** Deactivated or exited. */
  | "inactive"
  /** Soft-deleted; recoverable from the Deleted tab. */
  | "deleted";

export interface EmployeeRow {
  id: string;
  /** Optional HR-provided / external identifier (the form's "Employee ID"). */
  referenceId?: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  /** How this record was created — see lib/constants/onboarding-methods. */
  onboardingMethod?: OnboardingMethod;
  /** Leave type the employee is currently on, when `status` is `on_leave`. */
  leaveType?: string;
  /** Human-readable form of `leaveType`, e.g. "Annual Leave". */
  leaveTypeLabel?: string;
  /** Date the employee is next expected back. */
  leaveReturnDate?: string;
  startDate: string;
  salary: number;
  managerId: string | null;
  managerName: string | null;
  /** Number of employees reporting to this person (0 = not a line manager). */
  directReportCount?: number;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  maritalStatus?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  /** Skills the person brings — one person can sit in several Workforce Lens groups. */
  skills?: string[];
  workMode?: string;
  /** Site the person works out of. Resolved from `LocaleEmployee.branchId`. */
  branchId?: string;
  /** Display name of `branchId`, resolved against `bundle.branches`. */
  branchName?: string;
  workLocation?: string;
  grade?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  /** Always required for NG hires; absent for UK ones. */
  guarantors?: Guarantor[];
  ninNumber?: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
  driverLicenseNumber?: string;
  taxId?: string;
  pensionId?: string;
  nhfNumber?: string;
}

export interface NewEmployee {
  name: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  startDate: string;
  salary: string;
  managerId: string;
}
