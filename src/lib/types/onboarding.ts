export type OnboardingStage =
  | "pre_boarding"
  | "day_one"
  | "first_week"
  | "thirty_day"
  | "sixty_day"
  | "ninety_day"
  | "completed";

export type OnboardingStatus = "not_started" | "in_progress" | "completed" | "overdue";

export type OnboardingTaskStatus = "pending" | "completed" | "overdue";

export type OnboardingTaskAssignee = "hr" | "manager" | "employee" | "it";

export type OnboardingMode = "manual" | "invited" | "bulk";

export interface OnboardingTask {
  id: string;
  taskName: string;
  assignee: OnboardingTaskAssignee;
  dueDay: number;
  status: OnboardingTaskStatus;
  isRequired: boolean;
}

export interface OnboardingRecord {
  id: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  startDate: string;
  stage: OnboardingStage;
  status: OnboardingStatus;
  tasks: OnboardingTask[];
  completedTasks: number;
  totalTasks: number;
  welcomeEmailSent: boolean;
  initiatedAt: string;
  mode?: OnboardingMode;
  email?: string;
}

export interface NewOnboardingRecord {
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  startDate: string;
}

export interface ManualOnboardingData {
  firstName: string;
  lastName: string;
  surname: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  maritalStatus: string;
  bloodType: string;
  address: string;
  state: string;
  country: string;
  employeeId: string;
  jobTitle: string;
  department: string;
  employmentType: string;
  manager: string;
  startDate: string;
  salary: string;
  workLocation: string;
  workMode: string;
  grade: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  ninNumber: string;
  passportNumber: string;
  passportExpiry: string;
  passportCountry: string;
  driverLicenseNumber: string;
  taxId: string;
  pensionId: string;
  nhfNumber: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

export interface InviteOnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  startDate: string;
}

export interface BulkOnboardingRow {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  startDate: string;
  employmentType: string;
  manager: string;
}
