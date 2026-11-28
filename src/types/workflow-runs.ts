import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export type AssigneeKind =
  "accessLevel" | "employee";

export interface MyWorkDto {
  employeeId?: string | null;
  todo: WorkItemDto[];
  review: WorkItemDto[];
  others: WorkItemDto[];
}

export interface ReassignTaskRequest {
  employeeId: string;
}

export interface RunDto {
  run: RunRowDto;
  tasks: RunTaskDto[];
}

export interface RunRowDto {
  id: string;
  workflowId: string;
  workflowTitle: string;
  workflowVersion: number;
  trigger?: WorkflowTriggerEvent;
  subjectKind: RunSubjectKind;
  subjectId: string;
  subjectName: string;
  anchorOn: string;
  context: WorkflowCondition[];
  state: RunState;
  tally: RunTally;
  startedByUserId?: string | null;
  startedAt: string;
  cancelledAt?: string | null;
  nextDueOn?: string | null;
}

export type RunState =
  "active" | "completed" | "cancelled";

export type RunSubjectKind =
  "requisition" | "candidate" | "onboardingRecord" | "employee";

export interface RunTally {
  tasks: number;
  completed: number;
  skipped: number;
  awaitingApproval: number;
  blocked: number;
  overdue: number;
  percentComplete: number;
}

export type RunTaskAction =
  "start" | "submit" | "approve" | "reject" | "skip" | "reassign";

export interface RunTaskDto {
  id: string;
  templateTaskId: string;
  sequence: number;
  title: string;
  description?: string | null;
  priority: WorkflowTaskPriority;
  state: RunTaskState;
  status: RunTaskStatus;
  waitingOn: string[];
  daysOverdue: number;
  hasEscalated: boolean;
  assigneeKind: AssigneeKind;
  /** Set for role-based assignees; cleared when the task is reassigned to a person. */
  assigneeAccessLevelId?: string | null;
  assigneeEmployeeId?: string | null;
  assigneeName: string;
  hasReviewer: boolean;
  reviewerEmployeeId?: string | null;
  reviewerName?: string | null;
  dueOn: string;
  expectedDurationDays?: number | null;
  escalateAfterDays?: number | null;
  dependsOn: string[];
  parallelGroup?: string | null;
  condition?: WorkflowCondition;
  startedAt?: string | null;
  submittedAt?: string | null;
  completedAt?: string | null;
  completedByUserId?: string | null;
  note?: string | null;
  reassignedFrom?: string | null;
  available: RunTaskAction[];
}

export type RunTaskState =
  "notStarted" | "inProgress" | "awaitingApproval" | "completed" | "skipped";

export type RunTaskStatus =
  "notStarted" | "inProgress" | "awaitingApproval" | "completed" | "blocked" | "overdue" | "skipped";

export interface StartRunRequest {
  workflowId: string;
  subjectKind: RunSubjectKind;
  subjectId: string;
  subjectName?: string | null;
  anchorOn?: string | null;
  context?: WorkflowCondition[] | null;
  trigger?: WorkflowTriggerEvent;
}

export interface TaskNoteRequest {
  note?: string | null;
}

export interface WorkItemDto {
  runId: string;
  taskId: string;
  title: string;
  subtitle: string;
  subjectKind: RunSubjectKind;
  subjectId: string;
  priority: WorkflowTaskPriority;
  status: RunTaskStatus;
  dueOn: string;
  daysOverdue: number;
  hasEscalated: boolean;
  owner: string;
}

export type WorkflowCondition =
  "remoteWorker" | "companyCar" | "contractor" | "visaHolder";

export type WorkflowTaskPriority =
  "low" | "normal" | "high" | "critical";

export type WorkflowTriggerEvent =
  "recruitmentInitiated" | "preboardingInitiated" | "onboardingInitiated" | "offboardingInitiated";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/workflow-runs
export type GetWorkflowRunsResponse = ApiResponse<PagedResult<RunRowDto>>;
export interface GetWorkflowRunsParams {
  WorkflowId?: string;
  State?: RunState;
  SubjectKind?: RunSubjectKind;
  SubjectId?: string;
  AssigneeEmployeeId?: string;
  OverdueOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/workflow-runs
export type StartWorkflowRunResponse = ApiResponse<RunDto>;

// GET /api/v1/workflow-runs/my-work
export type GetMyWorkflowWorkResponse = ApiResponse<MyWorkDto>;

// GET /api/v1/workflow-runs/{id}
export type GetWorkflowRunResponse = ApiResponse<RunDto>;

// POST /api/v1/workflow-runs/{id}/tasks/{taskId}/start
export type StartWorkflowRunTaskResponse = ApiResponse<RunDto>;

// POST /api/v1/workflow-runs/{id}/tasks/{taskId}/submit
export type SubmitWorkflowRunTaskResponse = ApiResponse<RunDto>;
export type SubmitWorkflowRunTaskRequest = unknown | null | TaskNoteRequest;

// POST /api/v1/workflow-runs/{id}/tasks/{taskId}/approve
export type ApproveWorkflowRunTaskResponse = ApiResponse<RunDto>;
export type ApproveWorkflowRunTaskRequest = unknown | null | TaskNoteRequest;

// POST /api/v1/workflow-runs/{id}/tasks/{taskId}/reject
export type RejectWorkflowRunTaskResponse = ApiResponse<RunDto>;
export type RejectWorkflowRunTaskRequest = unknown | null | TaskNoteRequest;

// POST /api/v1/workflow-runs/{id}/tasks/{taskId}/skip
export type SkipWorkflowRunTaskResponse = ApiResponse<RunDto>;
export type SkipWorkflowRunTaskRequest = unknown | null | TaskNoteRequest;

// POST /api/v1/workflow-runs/{id}/tasks/{taskId}/reassign
export type ReassignWorkflowRunTaskResponse = ApiResponse<RunDto>;

// POST /api/v1/workflow-runs/{id}/cancel
export type CancelWorkflowRunResponse = ApiResponse<RunDto>;

