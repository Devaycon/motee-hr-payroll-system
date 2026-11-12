import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export type AbsenceState = "ongoing" | "returned";

export type BradfordAction =
  "monitor" | "managerReview" | "formalReview" | "seniorHrReview";

export interface BradfordDto {
  employeeId: string;
  employeeName: string;
  windowStart: string;
  windowEnd: string;
  spells: number;
  days: number;
  score: number;
  action: BradfordAction;
  band: string;
  episodes: BradfordEpisodeDto[];
  excluded: BradfordExclusionDto[];
}

export interface BradfordEpisodeDto {
  start: string;
  end: string;
  days: number;
  clipped: boolean;
}

export interface BradfordExclusionDto {
  recordId: string;
  reason: string;
}

export interface BradfordRowDto {
  employeeId: string;
  employeeName: string;
  departmentName?: string | null;
  spells: number;
  days: number;
  score: number;
  action: BradfordAction;
  band: string;
}

export interface CountAndDaysDto {
  count: number;
  days: number;
}

export type DayPortion = "full" | "am" | "pm";

export interface ExclusionRequest {
  category: ProtectedCategory;
  reason: string;
}

export type FitNoteStatus =
  "notRequired" | "selfCertified" | "awaiting" | "received" | "expired";

export type ProtectedCategory =
  | "disability"
  | "pregnancy"
  | "industrialInjury"
  | "adjustmentRelated"
  | "other";

export interface ReturnRequest {
  lastSickDay: string;
  lastDayPortion?: DayPortion;
  returnDate?: string | null;
}

export interface ReturnToWorkDto {
  status: RtwStatus;
  returnDate?: string | null;
  lastSickDay?: string | null;
  interviewRequired: boolean;
  interviewHeld: boolean;
  interviewDate?: string | null;
  interviewerEmployeeId?: string | null;
  interviewerName?: string | null;
  safeToReturn: boolean;
  notes?: string | null;
  adjustmentsRecommended: boolean;
  ohReferralRecommended: boolean;
  completedAt?: string | null;
  overdue: boolean;
}

export interface ReturnToWorkRequest {
  interviewHeld?: boolean;
  interviewDate?: string | null;
  interviewerEmployeeId?: string | null;
  safeToReturn: boolean;
  notes?: string | null;
  adjustmentsRecommended?: boolean;
  ohReferralRecommended?: boolean;
}

export type RtwStatus = "notDue" | "pending" | "completed";

export interface SicknessAlertDto {
  recordId: string;
  employeeId: string;
  employeeName: string;
  kind: SicknessAlertKind;
  message: string;
  urgent: boolean;
  startDate: string;
}

export type SicknessAlertKind =
  | "fitNoteOutstanding"
  | "returnToWorkOverdue"
  | "longTermAbsence"
  | "awaitingApproval";

export type SicknessApprovalStatus =
  "awaitingApproval" | "approved" | "rejected" | "cancelled";

export interface SicknessDocumentDto {
  id: string;
  kind: SicknessDocumentKind;
  name: string;
  fileId?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  uploadedAt: string;
}

export type SicknessDocumentKind =
  "fitNote" | "selfCertificate" | "hospitalLetter" | "other";

export interface SicknessDocumentRequest {
  kind: SicknessDocumentKind;
  name: string;
  fileId?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

export type SicknessKind = "sickness" | "medicalProcedure";

export type SicknessReason =
  | "coldOrFlu"
  | "migraine"
  | "musculoskeletal"
  | "mentalHealth"
  | "medicalAppointment"
  | "surgeryRecovery"
  | "other";

export interface SicknessReasonRequest {
  reason: string;
}

export interface SicknessRecordDto {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string | null;
  managerId?: string | null;
  kind: SicknessKind;
  startDate: string;
  startPortion: DayPortion;
  leftWorkAt?: string | null;
  endDate?: string | null;
  endPortion: DayPortion;
  overnightShift: boolean;
  expectedReturnDate?: string | null;
  reason?: SicknessReason | null;
  reasonDetail?: string | null;
  medicalDetailWithheld: boolean;
  hospitalised: boolean;
  notifiedAt: string;
  source: SicknessSource;
  reportedByName?: string | null;
  reportedAt: string;
  approvalStatus: SicknessApprovalStatus;
  absenceState: AbsenceState;
  fitNoteStatus: FitNoteStatus;
  documents: SicknessDocumentDto[];
  spellDays: number;
  workingDaysLost: number;
  longTerm: boolean;
  exclusionCategory?: ProtectedCategory | null;
  exclusionReason?: string | null;
  returnToWork: ReturnToWorkDto;
  updatedAt: string;
}

export interface SicknessRequest {
  employeeId: string;
  kind?: SicknessKind;
  startDate: string;
  startPortion?: DayPortion;
  leftWorkAt?: string | null;
  endDate?: string | null;
  endPortion?: DayPortion;
  overnightShift?: boolean;
  expectedReturnDate?: string | null;
  reason?: SicknessReason;
  reasonDetail?: string | null;
  hospitalised?: boolean;
  notifiedAt?: string | null;
  source?: SicknessSource;
  linkedRecordId?: string | null;
}

export type SicknessSource = "self" | "manager" | "hr" | "timeAndAttendance";

export interface SicknessSummaryDto {
  asOf: string;
  from?: string | null;
  episodes: number;
  people: number;
  daysLost: number;
  averageSpellDays: number;
  absenceRatePercent: number;
  ongoing: number;
  awaitingApproval: number;
  fitNotesOutstanding: number;
  returnToWorkDue: number;
  longTerm: CountAndDaysDto;
  shortTerm: CountAndDaysDto;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/sickness
export type GetSicknessRecordsResponse = ApiResponse<
  PagedResult<SicknessRecordDto>
>;

export interface GetSicknessRecordsParams {
  EmployeeId?: string;
  DepartmentId?: string;
  ApprovalStatus?: SicknessApprovalStatus;
  AbsenceState?: AbsenceState;
  Kind?: SicknessKind;
  From?: string;
  To?: string;
  FitNoteOutstanding?: boolean;
  ReturnToWorkPending?: boolean;
  LongTerm?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/sickness
export type CreateSicknessRecordResponse = ApiResponse<SicknessRecordDto>;

// GET /api/v1/sickness/{id}
export type GetSicknessRecordResponse = ApiResponse<SicknessRecordDto>;

// PUT /api/v1/sickness/{id}
export type UpdateSicknessRecordResponse = ApiResponse<SicknessRecordDto>;

// GET /api/v1/sickness/summary
export type GetSicknessSummaryResponse = ApiResponse<SicknessSummaryDto>;

export interface GetSicknessSummaryParams {
  from?: string;
}

// GET /api/v1/sickness/alerts
export type GetSicknessAlertsResponse = ApiResponse<SicknessAlertDto[]>;

// POST /api/v1/sickness/{id}/approve
export type ApproveSicknessRecordResponse = ApiResponse<SicknessRecordDto>;

// POST /api/v1/sickness/{id}/reject
export type RejectSicknessRecordResponse = ApiResponse<SicknessRecordDto>;

// POST /api/v1/sickness/{id}/cancel
export type CancelSicknessRecordResponse = ApiResponse<SicknessRecordDto>;

// POST /api/v1/sickness/{id}/return
export type RecordSicknessReturnResponse = ApiResponse<SicknessRecordDto>;

// POST /api/v1/sickness/{id}/return-to-work
export type RecordReturnToWorkResponse = ApiResponse<SicknessRecordDto>;

// POST /api/v1/sickness/{id}/documents
export type AttachSicknessDocumentResponse = ApiResponse<SicknessRecordDto>;

// POST /api/v1/sickness/{id}/exclusion
export type SetSicknessExclusionResponse = ApiResponse<SicknessRecordDto>;

// DELETE /api/v1/sickness/{id}/exclusion
export type ClearSicknessExclusionResponse = ApiResponse<SicknessRecordDto>;

// GET /api/v1/sickness/bradford/{employeeId}
export type GetEmployeeBradfordResponse = ApiResponse<BradfordDto>;

// GET /api/v1/sickness/bradford
export type GetBradfordScoresResponse = ApiResponse<BradfordRowDto[]>;

export interface GetBradfordScoresParams {
  DepartmentId?: string;
  AtLeast?: BradfordAction;
  Limit?: number;
}
