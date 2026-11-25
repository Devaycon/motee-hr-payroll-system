import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export type AssigneeKind =
  "accessLevel" | "employee";

export type ScheduleKind =
  "fixed" | "relative";

export type ScheduleOffsetUnit =
  "minutes" | "hours" | "days";

export type WorkflowCondition =
  "remoteWorker" | "companyCar" | "contractor" | "visaHolder";

export interface WorkflowDto {
  workflow: WorkflowRowDto;
  tasks: WorkflowTaskDto[];
}

export type WorkflowKind =
  "system" | "custom";

export interface WorkflowRequest {
  title: string;
  description?: string | null;
  triggerMode?: WorkflowTriggerMode;
  scheduleKind?: ScheduleKind;
  scheduleOn?: string | null;
  scheduleAt?: string | null;
  triggerEvent?: WorkflowTriggerEvent;
  offsetValue?: number | null;
  offsetUnit?: ScheduleOffsetUnit;
  scopeKind?: WorkflowScopeKind;
  scopeDepartmentId?: string | null;
  status?: WorkflowStatus;
  effectiveFrom?: string | null;
  ownerEmployeeId?: string | null;
  employmentType?: string | null;
  tasks: WorkflowTaskRequest[];
}

export interface WorkflowRowDto {
  id: string;
  title: string;
  description?: string | null;
  triggerMode: WorkflowTriggerMode;
  triggerEvent?: WorkflowTriggerEvent;
  scheduleKind?: ScheduleKind;
  scheduleOn?: string | null;
  scheduleAt?: string | null;
  offsetValue?: number | null;
  offsetUnit?: ScheduleOffsetUnit;
  scopeKind: WorkflowScopeKind;
  scopeDepartmentId?: string | null;
  scopeDepartmentName?: string | null;
  workflowKind: WorkflowKind;
  status: WorkflowStatus;
  version: number;
  effectiveFrom?: string | null;
  isRunnable: boolean;
  ownerEmployeeId?: string | null;
  ownerName?: string | null;
  employmentType?: string | null;
  taskCount: number;
  activeRuns: number;
  lastModifiedByUserId?: string | null;
  updatedAt: string;
}

export type WorkflowScopeKind =
  "all" | "department";

export type WorkflowStatus =
  "draft" | "active" | "archived";

export interface WorkflowStatusRequest {
  status: WorkflowStatus;
}

export interface WorkflowSummaryDto {
  total: number;
  draft: number;
  active: number;
  archived: number;
  notYetEffective: number;
  activeRuns: number;
  overdueTasks: number;
  tasksWithNoOwner: number;
}

export interface WorkflowTaskDto {
  id: string;
  sequence: number;
  title: string;
  description?: string | null;
  assigneeKind: AssigneeKind;
  assigneeAccessLevelId?: string | null;
  assigneeAccessLevelName?: string | null;
  assigneeEmployeeId?: string | null;
  assigneeEmployeeName?: string | null;
  wouldLandOn: string[];
  hasReviewer: boolean;
  reviewerAccessLevelId?: string | null;
  reviewerAccessLevelName?: string | null;
  dueDayOffset?: number | null;
  expectedDurationDays?: number | null;
  priority: WorkflowTaskPriority;
  escalateAfterDays?: number | null;
  dependsOn: string[];
  dependsOnPositions: number[];
  parallelGroup?: string | null;
  condition?: WorkflowCondition;
  conditionHolds: boolean;
}

export type WorkflowTaskPriority =
  "low" | "normal" | "high" | "critical";

export interface WorkflowTaskRequest {
  title: string;
  description?: string | null;
  assigneeKind?: AssigneeKind;
  assigneeAccessLevelId?: string | null;
  assigneeEmployeeId?: string | null;
  hasReviewer?: boolean;
  reviewerAccessLevelId?: string | null;
  dueDayOffset?: number | null;
  expectedDurationDays?: number | null;
  priority?: WorkflowTaskPriority;
  escalateAfterDays?: number | null;
  dependsOnPositions?: number[] | null;
  parallelGroup?: string | null;
  condition?: WorkflowCondition;
  conditionHolds?: boolean;
}

export type WorkflowTriggerEvent =
  "recruitmentInitiated" | "preboardingInitiated" | "onboardingInitiated" | "offboardingInitiated";

export type WorkflowTriggerMode =
  "manual" | "automatic";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/workflows
export type GetWorkflowsResponse = ApiResponse<PagedResult<WorkflowRowDto>>;
export interface GetWorkflowsParams {
  Status?: WorkflowStatus;
  WorkflowKind?: WorkflowKind;
  TriggerMode?: WorkflowTriggerMode;
  TriggerEvent?: WorkflowTriggerEvent;
  DepartmentId?: string;
  RunnableOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/workflows
export type CreateWorkflowResponse = ApiResponse<WorkflowDto>;

// GET /api/v1/workflows/summary
export type GetWorkflowSummaryResponse = ApiResponse<WorkflowSummaryDto>;

// GET /api/v1/workflows/{id}
export type GetWorkflowResponse = ApiResponse<WorkflowDto>;

// PUT /api/v1/workflows/{id}
export type UpdateWorkflowResponse = ApiResponse<WorkflowDto>;

// DELETE /api/v1/workflows/{id}
export type DeleteWorkflowResponse = ApiResponse<unknown | null>;

// PATCH /api/v1/workflows/{id}/status
export type SetWorkflowStatusResponse = ApiResponse<WorkflowDto>;

