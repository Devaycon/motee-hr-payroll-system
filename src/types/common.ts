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
  /** Set on a request raised through POST /approvals. */
  title?: string | null;
  summary?: string | null;
  /** The intake form's answers, keyed by IntakeField.key. */
  fields?: Record<string, string>;
  fieldSchema?: IntakeField[];
  submittedByUserId?: string | null;
  submittedByEmployeeId?: string | null;
  submittedByName?: string | null;
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
  /** The approver's signature, when they signed their decision. */
  signatureFileId?: string | null;
  signatureUrl?: string | null;
  skippedReason?: string | null;
  delegation?: StepDelegation;
}

export type IntakeFieldKind = "text" | "number" | "date" | "choice";

/** One question on a raisable request type's intake form. */
export interface IntakeField {
  key: string;
  label: string;
  kind: IntakeFieldKind;
  options?: string[] | null;
  required: boolean;
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
