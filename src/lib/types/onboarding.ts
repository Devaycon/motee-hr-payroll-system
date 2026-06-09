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

export type OnboardingPhase = "preboarding" | "pre_onboarding" | "onboarding";

/** A lightweight asset captured during preboarding. */
export interface PreboardAsset {
  assetType: string;
  serialNumber: string;
  condition: string;
  notes: string;
}

export interface OnboardingTask {
  id: string;
  taskName: string;
  assignee: OnboardingTaskAssignee;
  /** Resolved reviewer who approves this task (e.g. "Line Manager", "IT Admin"). */
  reviewer: string;
  dueDay: number;
  status: OnboardingTaskStatus;
  isRequired: boolean;
  /** Set when the task was approved by its reviewer. */
  approvedAt?: string;
  note?: string;
}

export interface OnboardingHistoryEvent {
  id: string;
  at: string;
  actorName: string;
  type: "submitted" | "approved" | "completed";
  taskName?: string;
  note?: string;
}

export interface OnboardingSubmission {
  id: string;
  label: string;
  /** "document" = uploaded file, "field" = a submitted value. */
  kind: "document" | "field";
  value: string;
  submittedAt: string;
}

export interface OnboardingRecord {
  id: string;
  /** Optional HR-provided / external identifier carried into the employee record. */
  referenceId?: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  startDate: string;
  stage: OnboardingStage;
  status: OnboardingStatus;
  /** Which tab the record lives in. */
  phase: OnboardingPhase;
  tasks: OnboardingTask[];
  completedTasks: number;
  totalTasks: number;
  welcomeEmailSent: boolean;
  initiatedAt: string;
  mode?: OnboardingMode;
  email?: string;
  /** The onboarding workflow (ApprovalChainTemplate) driving this record. */
  workflowTemplateId?: string;
  workflowName?: string;
  /** Items the hire has submitted (docs / form values). */
  submissions?: OnboardingSubmission[];
  history?: OnboardingHistoryEvent[];
  /** Lightweight data captured during preboarding, used to prefill full onboarding. */
  preboardingData?: Partial<ManualOnboardingData>;
  /** Assets captured during preboarding. */
  assets?: PreboardAsset[];
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
  // Medical facts (blood type already captured in Personal)
  allergies: string;
  conditions: string;
  medications: string;
  dietaryRequirements: string;
  accessibilityNeeds: string;
  // Asset to assign at onboarding
  assetTag: string;
  assetName: string;
  assetCategory: string;
  assetSerialNumber: string;
  assetAssignedDate: string;
  workflowTemplateId?: string;
}

export interface InviteOnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  startDate: string;
  workflowTemplateId?: string;
}

export interface BulkOnboardingRow {
  /** Optional HR-provided / external identifier ("Employee ID" column). */
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  startDate: string;
  employmentType: string;
  manager: string;
  // Medical facts
  allergies: string;
  conditions: string;
  medications: string;
  dietaryRequirements: string;
  accessibilityNeeds: string;
  // Asset to assign
  assetTag: string;
  assetName: string;
  assetCategory: string;
  assetSerialNumber: string;
  assetAssignedDate: string;
  workflowTemplateId?: string;
}
