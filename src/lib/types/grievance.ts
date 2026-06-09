// Unified "Employee Relations Cases" model.
// One case model covers grievance, disciplinary and all related complaint types,
// progressing through a single 8-stage workflow.

export type CaseComplaintType =
  | "grievance"
  | "disciplinary"
  | "harassment"
  | "discrimination"
  | "pay_dispute"
  | "misconduct"
  | "attendance"
  | "policy_violation"
  | "working_conditions";

export type CaseStage =
  | "raised"
  | "triage"
  | "assigned"
  | "investigation"
  | "hearing"
  | "outcome_issued"
  | "appeal"
  | "closed";

export type ConfidentialityLevel =
  | "standard"
  | "confidential"
  | "highly_confidential";

export type CaseOutcome =
  | "verbal_warning"
  | "written_warning"
  | "final_written_warning"
  | "suspension"
  | "demotion"
  | "termination"
  | "no_action"
  | "upheld"
  | "partially_upheld"
  | "not_upheld"
  | "resolved";

export type CasePriority = "low" | "medium" | "high" | "urgent";

export interface CaseNote {
  id: string;
  authorName: string;
  authorInitials: string;
  message?: string;
  content: string;
  createdAt: string;
  isPrivate?: boolean;
  isInternal?: boolean;
}

export interface CaseWitness {
  name: string;
  statement?: string;
}

export interface CaseEvidence {
  name: string;
  url?: string;
  uploadedAt: string;
}

export interface ERCase {
  id: string;
  /** Human-readable case ID, e.g. ERC-001. */
  caseNumber: string;
  complaintType: CaseComplaintType;
  employeeName: string;
  employeeInitials: string;
  employeeDept: string;
  dateRaised: string;
  incidentDate?: string;
  description: string;
  stage: CaseStage;
  priority: CasePriority;
  confidentialityLevel: ConfidentialityLevel;
  assignedTo?: string;
  assignedInitials?: string;
  // Investigation
  witnesses: CaseWitness[];
  evidence: CaseEvidence[];
  // Hearing
  hearingDate?: string;
  hearingPanel: string[];
  // Outcome
  outcome?: CaseOutcome | string;
  outcomeDate?: string;
  suspensionDays?: number;
  // Appeal
  hasAppeal: boolean;
  appealCaseId?: string;
  appealReviewer?: string;
  appealGrounds?: string;
  // Closure
  retentionPeriod?: string;
  closureDate?: string;
  // Trail
  notes: CaseNote[];
  createdAt: string;
  updatedAt: string;
}

/** Backwards-compatibility alias for consumers migrating to the unified model. */
export type AnyCase = ERCase;

export interface NewERCase {
  complaintType: CaseComplaintType;
  employeeName: string;
  employeeDept: string;
  incidentDate?: string;
  description: string;
  priority: CasePriority;
  confidentialityLevel: ConfidentialityLevel;
  assignedTo?: string;
  witnesses?: CaseWitness[];
  evidence?: CaseEvidence[];
}
