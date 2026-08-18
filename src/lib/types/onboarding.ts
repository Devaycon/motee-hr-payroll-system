import type { StarterTaxRecord } from "./starter-tax";
import type { FileAttachment } from "@/src/lib/utils/file-attachments";

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

/**
 * Where an invited joiner has got to (client feedback §2.1). "Sent" alone
 * can't distinguish an ignored invite from one in mid-flight, which is the
 * whole reason HR chase the wrong people.
 */
export type InvitationStatus =
  | "not_sent"
  | "sent"
  | "opened"
  | "in_progress"
  | "submitted"
  | "returned"
  | "expired";

export const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  not_sent: "Not Sent",
  sent: "Invitation Sent",
  opened: "Opened",
  in_progress: "In Progress",
  submitted: "Submitted",
  returned: "Returned for Changes",
  expired: "Expired",
};

export const INVITATION_STATUS_STYLES: Record<InvitationStatus, string> = {
  not_sent: "border-border bg-muted text-muted-foreground",
  sent: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  opened: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  in_progress:
    "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  submitted:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  returned:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  expired: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

/** Timestamps behind the invitation status, for the chase-up view (§2.1, §2.2). */
export interface InvitationTracking {
  status: InvitationStatus;
  sentAt?: string;
  openedAt?: string;
  startedAt?: string;
  submittedAt?: string;
  returnedAt?: string;
  /** Invitations go stale; past this the link should be reissued. */
  expiresAt?: string;
  /** How many reminders have gone out (§2.2). */
  remindersSent?: number;
  lastReminderAt?: string;
}

/**
 * Documents a joiner is asked to upload (client feedback §2.6). Only a profile
 * photo was collected before, which left Right to Work evidence to be chased
 * over email.
 */
export type JoinerDocumentKind =
  | "passport"
  | "driving_licence"
  | "right_to_work"
  | "visa"
  | "proof_of_address"
  | "qualifications"
  | "p45";

export interface JoinerDocumentSpec {
  kind: JoinerDocumentKind;
  label: string;
  hint: string;
  required: boolean;
}

export const JOINER_DOCUMENTS: JoinerDocumentSpec[] = [
  {
    kind: "passport",
    label: "Passport",
    hint: "Photo page showing your name, number and expiry",
    required: true,
  },
  {
    kind: "right_to_work",
    label: "Right to Work evidence",
    hint: "Share code, BRP or another accepted document",
    required: true,
  },
  {
    kind: "driving_licence",
    label: "Driving Licence",
    hint: "Both sides if you have a photocard",
    required: false,
  },
  {
    kind: "visa",
    label: "Visa",
    hint: "Only if your right to work depends on one",
    required: false,
  },
  {
    kind: "proof_of_address",
    label: "Proof of Address",
    hint: "Utility bill or bank statement from the last 3 months",
    required: true,
  },
  {
    kind: "qualifications",
    label: "Qualifications",
    hint: "Optional — certificates relevant to your role",
    required: false,
  },
];

/** An uploaded joiner document, keyed by what it evidences. */
export interface JoinerDocument {
  kind: JoinerDocumentKind;
  file: FileAttachment;
  uploadedAt: string;
}

/**
 * Consent captured before any personal data is collected (client feedback
 * §2.12 step 3). The Privacy Notice version is the point — proving *which*
 * wording someone agreed to is what makes the record defensible.
 */
export interface PrivacyConsent {
  acceptedAt: string;
  privacyNoticeVersion: string;
  /** Optional; only recorded where the deployment captures it. */
  ipAddress?: string;
}

/** HR's decision on a submitted onboarding pack (client feedback §2.8). */
export type OnboardingReviewStatus =
  | "not_submitted"
  | "awaiting_review"
  | "changes_requested"
  | "approved"
  | "rejected";

export const REVIEW_STATUS_LABELS: Record<OnboardingReviewStatus, string> = {
  not_submitted: "Not Submitted",
  awaiting_review: "Awaiting HR Review",
  changes_requested: "Changes Requested",
  approved: "Approved",
  rejected: "Rejected",
};

export interface OnboardingReview {
  status: OnboardingReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  /** Shown to the joiner when changes are requested. */
  comment?: string;
}

/** HR's post-submission checklist (client feedback §2.14). */
export type HrChecklistKey =
  | "personal_reviewed"
  | "right_to_work_verified"
  | "bank_verified"
  | "payroll_created"
  | "contract_issued"
  | "equipment_assigned"
  | "manager_notified"
  | "induction_booked";

export const HR_CHECKLIST_ITEMS: { key: HrChecklistKey; label: string }[] = [
  { key: "personal_reviewed", label: "Review personal information" },
  { key: "right_to_work_verified", label: "Verify Right to Work" },
  { key: "bank_verified", label: "Verify bank details" },
  { key: "payroll_created", label: "Payroll created" },
  { key: "contract_issued", label: "Contract issued" },
  { key: "equipment_assigned", label: "Equipment assigned" },
  { key: "manager_notified", label: "Manager notified" },
  { key: "induction_booked", label: "Induction booked" },
];

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
  /** Data the joiner submitted themselves via the invite onboarding wizard. */
  joinerData?: Partial<ManualOnboardingData>;
  /** UK PAYE starter-tax record captured by the joiner (UK tenants only). */
  starterTax?: StarterTaxRecord;
  /** Set when the joiner completes the self-service onboarding wizard. */
  selfOnboardingCompletedAt?: string;
  /** §2.1 — where an invited joiner has actually got to. */
  invitation?: InvitationTracking;
  /** §2.6 — identity and right-to-work evidence the joiner uploaded. */
  documents?: JoinerDocument[];
  /** §2.12 — the Privacy Notice version the joiner accepted, and when. */
  privacyConsent?: PrivacyConsent;
  /** §2.7 — the joiner's declaration that their details are true. */
  declaration?: {
    signedName: string;
    signedAt: string;
  };
  /** §2.8 — HR's decision on the submitted pack. */
  review?: OnboardingReview;
  /** §2.14 — HR's post-submission checklist. */
  hrChecklist?: Partial<Record<HrChecklistKey, boolean>>;
  /** §2.3 — a part-finished wizard the joiner can come back to. */
  draft?: {
    savedAt: string;
    stepKey: string;
    form: Partial<ManualOnboardingData>;
  };
}

export interface NewOnboardingRecord {
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  startDate: string;
}

export interface ManualOnboardingData {
  /** Profile photo as a data URL, supplied by the joiner during onboarding. */
  photoUrl?: string;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  maidenName: string;
  initials: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  ethnicity: string;
  maritalStatus: string;
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
  /**
   * §2.16 — the account holder's name. Previously this field doubled as
   * "Sort Code / Account Name" for UK joiners, which put two unrelated values
   * in one box and made either impossible to validate.
   */
  bankAccountName: string;
  /** §2.16 — UK sort code, its own field, validated as NN-NN-NN. */
  sortCode: string;
  ninNumber: string;
  /** UK National Insurance number (kept distinct from the NG-labelled NIN). */
  niNumber: string;
  passportNumber: string;
  passportExpiry: string;
  passportCountry: string;
  driverLicenseNumber: string;
  /** §2.17 — expiry belongs with the licence number, as passport expiry does. */
  driverLicenseExpiry: string;
  taxId: string;
  pensionId: string;
  nhfNumber: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  emergencyContactEmail: string;
  // Medical facts
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
