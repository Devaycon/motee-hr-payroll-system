import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface CaseActivityDto {
  at: string;
  actorName?: string | null;
  action: string;
  detail?: string | null;
}

export type CaseComplaintType =
  "grievance" | "disciplinary" | "harassment" | "discrimination" | "payDispute" | "misconduct" | "attendance" | "policyViolation" | "workingConditions" | "bullyingHarassment" | "absenceManagement" | "performanceImprovement" | "capability" | "whistleblowing" | "healthSafety" | "equalityDiversity" | "appeal" | "investigation" | "safeguarding";

export interface CaseDto {
  case: CaseRowDto;
  description: string;
  investigationDueOn?: string | null;
  outcomeDueOn?: string | null;
  witnesses: CaseWitness[];
  hearingOn?: string | null;
  hearingPanel: PanelMemberDto[];
  suspensionDays?: number | null;
  appealReviewerEmployeeId?: string | null;
  appealReviewerName?: string | null;
  appealGrounds?: string | null;
  retentionPeriod?: string | null;
  notes: CaseNoteDto[];
  meetings: CaseMeetingDto[];
  evidence: CaseEvidenceDto[];
  flow: CaseStage[];
  stages: StageOptionDto[];
}

export interface CaseEvidenceDto {
  id: string;
  name: string;
  description?: string | null;
  storedFileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export type CaseGroup =
  "grievance" | "disciplinary";

export interface CaseMeetingDto {
  id: string;
  meetingKind: CaseMeetingKind;
  heldOn: string;
  heldAt?: string | null;
  attendees: string[];
  notes?: string | null;
  meetingOutcome?: string | null;
  createdAt: string;
}

export type CaseMeetingKind =
  "investigation" | "disciplinaryHearing" | "grievanceMeeting" | "appealHearing";

export interface CaseNoteDto {
  id: string;
  authorUserId?: string | null;
  authorName?: string | null;
  content: string;
  visibility: NoteVisibility;
  createdAt: string;
}

export type CaseOutcome =
  "verbalWarning" | "writtenWarning" | "finalWrittenWarning" | "suspension" | "demotion" | "termination" | "noAction" | "upheld" | "partiallyUpheld" | "notUpheld" | "resolved" | "noCaseToAnswer" | "informalResolution" | "mediation" | "trainingRequired" | "policyUpdate";

export type CasePriority =
  "low" | "medium" | "high" | "urgent";

export interface CaseRequest {
  complaintType?: CaseComplaintType;
  subjectEmployeeId?: string | null;
  incidentOn?: string | null;
  description: string;
  priority?: CasePriority;
  confidentialityLevel?: ConfidentialityLevel;
  investigatorEmployeeId?: string | null;
  caseOwnerEmployeeId?: string | null;
  targetResolutionOn?: string | null;
  investigationDueOn?: string | null;
  outcomeDueOn?: string | null;
  witnesses?: CaseWitness[] | null;
  hearingOn?: string | null;
  hearingPanelEmployeeIds?: string[] | null;
  outcome?: CaseOutcome;
  outcomeOn?: string | null;
  suspensionDays?: number | null;
  appealReviewerEmployeeId?: string | null;
  appealGrounds?: string | null;
  retentionPeriod?: string | null;
}

export interface CaseRowDto {
  id: string;
  caseNumber: string;
  complaintType: CaseComplaintType;
  subjectEmployeeId?: string | null;
  subjectName?: string | null;
  subjectDepartmentName?: string | null;
  raisedByEmployeeId?: string | null;
  raisedByName?: string | null;
  raisedOn: string;
  incidentOn?: string | null;
  stage: CaseStage;
  priority: CasePriority;
  confidentialityLevel: ConfidentialityLevel;
  investigatorEmployeeId?: string | null;
  investigatorName?: string | null;
  caseOwnerEmployeeId?: string | null;
  caseOwnerName?: string | null;
  targetResolutionOn?: string | null;
  slaState: SlaState;
  daysOpen: number;
  outcome?: CaseOutcome;
  outcomeOn?: string | null;
  hasAppeal: boolean;
  closedOn?: string | null;
  noteCount: number;
  meetingCount: number;
  evidenceCount: number;
  witnessCount: number;
  updatedAt: string;
}

export type CaseStage =
  "raised" | "triage" | "assigned" | "investigation" | "hearing" | "outcomeIssued" | "appeal" | "closed";

export interface CaseStageRequest {
  stage: CaseStage;
}

export interface CaseSummaryDto {
  total: number;
  open: number;
  overdue: number;
  dueSoon: number;
  unassigned: number;
  underAppeal: number;
  averageDaysToClose: number | null;
  byStage: Record<string, number>;
  byType: Record<string, number>;
}

export interface CaseWitness {
  name: string;
  statement?: string | null;
}

export type ConfidentialityLevel =
  "standard" | "confidential" | "highlyConfidential" | "restricted";

export interface MeetingRequest {
  meetingKind?: CaseMeetingKind;
  heldOn: string;
  heldAt?: string | null;
  attendees: string[];
  notes?: string | null;
  meetingOutcome?: string | null;
}

export interface NoteRequest {
  content: string;
  visibility?: NoteVisibility;
}

export type NoteVisibility =
  "hrOnly" | "caseTeam" | "employeeVisible";

export interface PanelMemberDto {
  employeeId: string;
  name?: string | null;
}

export type SlaState =
  "none" | "onTrack" | "dueSoon" | "overdue";

export interface StageOptionDto {
  stage: CaseStage;
  allowed: boolean;
  blockers: string[];
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/er-cases
export type GetErCasesResponse = ApiResponse<PagedResult<CaseRowDto>>;
export interface GetErCasesParams {
  ComplaintType?: CaseComplaintType;
  Group?: CaseGroup;
  Stage?: CaseStage;
  Priority?: CasePriority;
  ConfidentialityLevel?: ConfidentialityLevel;
  SubjectEmployeeId?: string;
  InvestigatorEmployeeId?: string;
  CaseOwnerEmployeeId?: string;
  DepartmentId?: string;
  OpenOnly?: boolean;
  OverdueOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/er-cases
export type CreateErCaseResponse = ApiResponse<CaseDto>;

// GET /api/v1/er-cases/summary
export type GetErCaseSummaryResponse = ApiResponse<CaseSummaryDto>;

// GET /api/v1/er-cases/mine
export type GetMyErCasesResponse = ApiResponse<PagedResult<CaseRowDto>>;
export interface GetMyErCasesParams {
  ComplaintType?: CaseComplaintType;
  Group?: CaseGroup;
  Stage?: CaseStage;
  Priority?: CasePriority;
  ConfidentialityLevel?: ConfidentialityLevel;
  SubjectEmployeeId?: string;
  InvestigatorEmployeeId?: string;
  CaseOwnerEmployeeId?: string;
  DepartmentId?: string;
  OpenOnly?: boolean;
  OverdueOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// GET /api/v1/er-cases/{id}
export type GetErCaseResponse = ApiResponse<CaseDto>;

// PUT /api/v1/er-cases/{id}
export type UpdateErCaseResponse = ApiResponse<CaseDto>;

// DELETE /api/v1/er-cases/{id}
export type DeleteErCaseResponse = ApiResponse<unknown | null>;

// GET /api/v1/er-cases/{id}/activity
export type GetErCaseActivityResponse = ApiResponse<CaseActivityDto[]>;

// PATCH /api/v1/er-cases/{id}/stage
export type MoveErCaseStageResponse = ApiResponse<CaseDto>;

// POST /api/v1/er-cases/{id}/notes
export type AddErCaseNoteResponse = ApiResponse<CaseDto>;

// DELETE /api/v1/er-cases/{id}/notes/{noteId}
export type DeleteErCaseNoteResponse = ApiResponse<CaseDto>;

// POST /api/v1/er-cases/{id}/meetings
export type AddErCaseMeetingResponse = ApiResponse<CaseDto>;

// DELETE /api/v1/er-cases/{id}/meetings/{meetingId}
export type DeleteErCaseMeetingResponse = ApiResponse<CaseDto>;

// POST /api/v1/er-cases/{id}/evidence
export type AddErCaseEvidenceResponse = ApiResponse<CaseDto>;
export type AddErCaseEvidenceRequest = {
  ContentType?: string;
  ContentDisposition?: string;
  Headers?: Record<string, string[]>;
  Length?: number;
  Name?: string;
  FileName?: string;
} & {
  name?: string;
} & {
  description?: string;
};

// GET /api/v1/er-cases/{id}/evidence/{evidenceId}/download

// DELETE /api/v1/er-cases/{id}/evidence/{evidenceId}
export type DeleteErCaseEvidenceResponse = ApiResponse<CaseDto>;

// GET /api/v1/employees/{employeeId}/grievances
export type GetEmployeeGrievancesResponse = ApiResponse<PagedResult<CaseRowDto>>;
export interface GetEmployeeGrievancesParams {
  ComplaintType?: CaseComplaintType;
  Group?: CaseGroup;
  Stage?: CaseStage;
  Priority?: CasePriority;
  ConfidentialityLevel?: ConfidentialityLevel;
  SubjectEmployeeId?: string;
  InvestigatorEmployeeId?: string;
  CaseOwnerEmployeeId?: string;
  DepartmentId?: string;
  OpenOnly?: boolean;
  OverdueOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// GET /api/v1/employees/{employeeId}/disciplinaries
export type GetEmployeeDisciplinariesResponse = ApiResponse<PagedResult<CaseRowDto>>;
export interface GetEmployeeDisciplinariesParams {
  ComplaintType?: CaseComplaintType;
  Group?: CaseGroup;
  Stage?: CaseStage;
  Priority?: CasePriority;
  ConfidentialityLevel?: ConfidentialityLevel;
  SubjectEmployeeId?: string;
  InvestigatorEmployeeId?: string;
  CaseOwnerEmployeeId?: string;
  DepartmentId?: string;
  OpenOnly?: boolean;
  OverdueOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

