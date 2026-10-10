// Shapes shared by more than one API module.

export type ApprovalAction =
  | "submit"
  | "approve"
  | "reject"
  | "return"
  | "resubmit"
  | "cancel";

export interface ApprovalAttachmentDto {
  id: string;
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url?: string | null;
  round: number;
  uploadedByName?: string | null;
  uploadedAt: string;
}

export interface ApprovalDto {
  id: string;
  documentType: string;
  subjectType: string;
  subjectId: string;
  subjectEmployeeId?: string | null;
  status: ApprovalStatus;
  round: number;
  steps: ApprovalStepDto[];
  currentStep?: ApprovalStepDto;
  isBlocked: boolean;
  blockedReason?: string | null;
  availableActions: ApprovalAction[];
  attachments: ApprovalAttachmentDto[];
  attachmentRules: AttachmentRules;
  history: ApprovalEventDto[];
  submittedAt?: string | null;
  decidedAt?: string | null;
}

export interface ApprovalEventDto {
  id: string;
  type: string;
  stepOrder?: number | null;
  actorName?: string | null;
  note?: string | null;
  at: string;
}

export type ApprovalStatus =
  | "draft"
  | "inProgress"
  | "approved"
  | "rejected"
  | "returned"
  | "cancelled";

export interface ApprovalStepDto {
  id: string;
  sequence: number;
  label: string;
  approver: ApproverResolver;
  required: boolean;
  resolvedEmployeeId?: string | null;
  resolvedRoleId?: string | null;
  resolvedName?: string | null;
  status: ApprovalStepStatus;
  decidedAt?: string | null;
  note?: string | null;
  skippedReason?: string | null;
  delegation?: StepDelegation;
}

export type ApprovalStepStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  | "skipped";

export type ApproverResolver =
  | "lineManager"
  | "departmentHead"
  | "role";

export interface AssetRequest {
  tag: string;
  name: string;
  category?: string | null;
  serialNumber?: string | null;
  notes?: string | null;
  assignedDate?: string | null;
}

export interface AttachmentRules {
  allowed?: boolean;
  required?: boolean;
  note?: string | null;
  permits?: boolean;
}

export interface BankDetailsRequest {
  bankName?: string | null;
  accountNumber?: string | null;
  sortCode?: string | null;
  accountHolderName?: string | null;
}

export type EmploymentType =
  | "fullTime"
  | "partTime"
  | "temporary"
  | "contract"
  | "freelance"
  | "internship"
  | "apprenticeship"
  | "casual"
  | "seasonal"
  | "remote"
  | "fieldBased";

export interface ExportJobDto {
  id: string;
  status: ExportStatus;
  kind: string;
  rowCount?: number;
  fileName?: string | null;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
  expiresAt?: string | null;
}

export type ExportStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

export interface IdentityDocumentsRequest {
  nationalIdNumber?: string | null;
  taxIdNumber?: string | null;
  pensionId?: string | null;
  housingFundNumber?: string | null;
  drivingLicenceNumber?: string | null;
  drivingLicenceExpiry?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  passportIssuingCountry?: string | null;
}

export interface MedicalRequest {
  allergies?: string | null;
  conditions?: string | null;
  medications?: string | null;
  dietaryRequirements?: string | null;
  accessibilityNeeds?: string | null;
}

export type OnboardingMethod =
  | "manual"
  | "invite"
  | "bulk";

export interface StepDelegation {
  fromEmployeeId: string;
  fromName: string;
  reason?: string | null;
  periodStart: string;
  periodEnd: string;
}
