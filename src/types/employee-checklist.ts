import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface ChecklistCompletionRequest {
  completedOn?: string | null;
  note?: string | null;
}

export interface ChecklistHireDto {
  employeeId: string;
  employeeName: string;
  jobTitle?: string | null;
  departmentName?: string | null;
  startDate?: string | null;
  progress: ChecklistProgress;
}

export interface ChecklistItemDto {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  responsibleParty: ResponsibleParty;
  dueDayOffset: number;
  isRequired: boolean;
  isActive: boolean;
  sequence: number;
  completions: number;
  canDelete: boolean;
  updatedAt: string;
}

export interface ChecklistItemRequest {
  title: string;
  description?: string | null;
  category?: string | null;
  responsibleParty?: ResponsibleParty;
  dueDayOffset?: number;
  isRequired?: boolean;
}

export interface ChecklistProgress {
  state: ChecklistProgressState;
  completed: number;
  total: number;
  requiredOutstanding: number;
  overdue: number;
}

export type ChecklistProgressState =
  "notStarted" | "inProgress" | "completed" | "overdue";

export interface ChecklistTaskDto {
  item: ChecklistItemDto;
  dueOn?: string | null;
  state: ChecklistTaskState;
  completedOn?: string | null;
  completedByName?: string | null;
  note?: string | null;
}

export type ChecklistTaskState = "done" | "overdue" | "outstanding";

export interface EmployeeChecklistDto {
  hire: ChecklistHireDto;
  tasks: ChecklistTaskDto[];
}

export interface MoveChecklistItemRequest {
  up: boolean;
}

export type ResponsibleParty = "hr" | "manager" | "it" | "employee" | "finance";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/employee-checklist/items
export type GetChecklistItemsResponse = ApiResponse<ChecklistItemDto[]>;

export interface GetChecklistItemsParams {
  includeRetired?: boolean;
}

// POST /api/v1/employee-checklist/items
export type CreateChecklistItemResponse = ApiResponse<ChecklistItemDto>;

// PUT /api/v1/employee-checklist/items/{id}
export type UpdateChecklistItemResponse = ApiResponse<ChecklistItemDto>;

// DELETE /api/v1/employee-checklist/items/{id}
export type DeleteChecklistItemResponse = ApiResponse<null>;

// POST /api/v1/employee-checklist/items/{id}/move
export type MoveChecklistItemResponse = ApiResponse<ChecklistItemDto>;

// POST /api/v1/employee-checklist/items/{id}/retire
export type RetireChecklistItemResponse = ApiResponse<ChecklistItemDto>;

// POST /api/v1/employee-checklist/items/{id}/restore
export type RestoreChecklistItemResponse = ApiResponse<ChecklistItemDto>;

// GET /api/v1/employee-checklist/hires
export type GetChecklistHiresResponse = ApiResponse<
  PagedResult<ChecklistHireDto>
>;

export interface GetChecklistHiresParams {
  StartedWithinDays?: number;
  State?: ChecklistProgressState;
  DepartmentId?: string;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// GET /api/v1/employee-checklist/me
export type GetMyChecklistResponse = ApiResponse<EmployeeChecklistDto>;

// GET /api/v1/employee-checklist/employees/{employeeId}
export type GetEmployeeChecklistResponse = ApiResponse<EmployeeChecklistDto>;

// POST /api/v1/employee-checklist/employees/{employeeId}/tasks/{itemId}
export type CompleteChecklistTaskResponse = ApiResponse<EmployeeChecklistDto>;

// DELETE /api/v1/employee-checklist/employees/{employeeId}/tasks/{itemId}
export type UncompleteChecklistTaskResponse = ApiResponse<EmployeeChecklistDto>;
