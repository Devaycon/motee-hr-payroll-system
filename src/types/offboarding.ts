import type { ApiResponse, PagedResult } from "./api";

export interface ClearanceItemDto {
  id: string;
  label: string;
  department: string;
  sequence: number;
  completed: boolean;
  completedAt?: string | null;
  completedByUserId?: string | null;
  notes?: string | null;
}

export interface ClearanceNoteRequest {
  notes?: string | null;
}

export interface ExitInterviewNotesRequest {
  notes?: string | null;
}

export type ExitReason =
  | "resignation"
  | "termination"
  | "redundancy"
  | "retirement"
  | "contractEnd"
  | "other";

export interface InitiateOffboardingRequest {
  employeeId: string;
  exitReason: ExitReason;
  lastWorkingDate: string;
  notes?: string | null;
}

export type OffboardingAction =
  | "approve"
  | "disapprove"
  | "startClearance"
  | "complete"
  | "reactivate";

export interface OffboardingActionRequest {
  reason?: string | null;
}

export interface OffboardingDto {
  id: string;
  employeeId: string;
  employeeName: string;
  initials: string;
  jobTitle?: string | null;
  department?: string | null;
  status: OffboardingStatus;
  exitReason: ExitReason;
  lastWorkingDate: string;
  notes?: string | null;
  clearance: ClearanceItemDto[];
  availableActions: OffboardingAction[];
  initiatedByUserId?: string | null;
  initiatedAt: string;
  decidedByUserId?: string | null;
  decidedAt?: string | null;
  decisionReason?: string | null;
  completedAt?: string | null;
  reactivatedAt?: string | null;
  systemAccessRevokedAt?: string | null;
  exitInterviewScheduledAt?: string | null;
  exitInterviewCompletedAt?: string | null;
  exitInterviewNotes?: string | null;
  exitDocumentsGeneratedAt?: string | null;
}

export interface OffboardingListItemDto {
  id: string;
  employeeId: string;
  employeeName: string;
  initials: string;
  jobTitle?: string | null;
  department?: string | null;
  lastWorkingDate: string;
  exitReason: ExitReason;
  status: OffboardingStatus;
  clearanceCompleted: number;
  clearanceTotal: number;
  availableActions: OffboardingAction[];
  initiatedAt: string;
}

export interface OffboardingStatsDto {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  clearancePending: number;
}

export type OffboardingStatus =
  | "pending"
  | "approved"
  | "inProgress"
  | "completed"
  | "disapproved"
  | "reactivated";

export interface ScheduleInterviewRequest {
  scheduledAt: string;
}

export interface UpdateOffboardingRequest {
  exitReason: ExitReason;
  lastWorkingDate: string;
  notes?: string | null;
}

export type GetOffboardingsResponse = ApiResponse<PagedResult<OffboardingListItemDto>>;

export interface GetOffboardingsParams {
  Status?: OffboardingStatus;
  Statuses?: OffboardingStatus[];
  DepartmentId?: string;
  ExitReason?: ExitReason;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

export type InitiateOffboardingResponse = ApiResponse<OffboardingDto>;

export type GetOffboardingStatsResponse = ApiResponse<OffboardingStatsDto>;

export type GetOffboardingResponse = ApiResponse<OffboardingDto>;

export type UpdateOffboardingResponse = ApiResponse<OffboardingDto>;

export interface UpdateOffboardingParams {
  id: string;
  body: UpdateOffboardingRequest;
}

export type DeleteOffboardingResponse = ApiResponse<null>;

export type RunOffboardingActionResponse = ApiResponse<OffboardingDto>;

export interface RunOffboardingActionParams {
  id: string;
  action: OffboardingAction;
  body?: OffboardingActionRequest;
}

export type CompleteClearanceItemResponse = ApiResponse<OffboardingDto>;

export interface CompleteClearanceItemParams {
  id: string;
  itemId: string;
  body?: ClearanceNoteRequest;
}

export type RevokeOffboardingAccessResponse = ApiResponse<OffboardingDto>;

export type ScheduleExitInterviewResponse = ApiResponse<OffboardingDto>;

export interface ScheduleExitInterviewParams {
  id: string;
  body: ScheduleInterviewRequest;
}

export type CompleteExitInterviewResponse = ApiResponse<OffboardingDto>;

export interface CompleteExitInterviewParams {
  id: string;
  body?: ExitInterviewNotesRequest;
}

export type GenerateExitDocumentsResponse = ApiResponse<OffboardingDto>;
