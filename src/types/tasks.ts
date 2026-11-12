import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface CompleteTaskRequest {
  completedOn?: string | null;
}

export interface ReorderTasksRequest {
  orderedIds?: string[] | null;
}

export type TaskDueState = "notDue" | "dueSoon" | "overdue";

export interface TaskItemDto {
  id: string;
  title: string;
  notes?: string | null;
  assigneeEmployeeId: string;
  assigneeName?: string | null;
  createdByEmployeeId?: string | null;
  createdByName?: string | null;
  priority: TaskPriority;
  category?: string | null;
  dueOn?: string | null;
  completedOn?: string | null;
  done: boolean;
  dueState: TaskDueState;
  source: TaskSource;
  link?: string | null;
  sequence: number;
  updatedAt: string;
}

export interface TaskItemRequest {
  title: string;
  notes?: string | null;
  assigneeEmployeeId?: string | null;
  priority?: TaskPriority;
  category?: string | null;
  dueOn?: string | null;
  link?: string | null;
}

export type TaskPriority = "high" | "medium" | "low";

export type TaskSource = "personal" | "assigned";

export interface TaskTally {
  total: number;
  done: number;
  outstanding: number;
  overdue: number;
  dueSoon: number;
  assigned: number;
  personal: number;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/tasks
export type GetTasksResponse = ApiResponse<PagedResult<TaskItemDto>>;

export interface GetTasksParams {
  Done?: boolean;
  Priority?: TaskPriority;
  Source?: TaskSource;
  Category?: string;
  OverdueOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/tasks
export type CreateTaskResponse = ApiResponse<TaskItemDto>;

// GET /api/v1/tasks/assigned-by-me
export type GetTasksAssignedByMeResponse = ApiResponse<
  PagedResult<TaskItemDto>
>;

export interface GetTasksAssignedByMeParams {
  Done?: boolean;
  Priority?: TaskPriority;
  Source?: TaskSource;
  Category?: string;
  OverdueOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// GET /api/v1/tasks/summary
export type GetTasksSummaryResponse = ApiResponse<TaskTally>;

// GET /api/v1/tasks/{id}
export type GetTaskResponse = ApiResponse<TaskItemDto>;

// PUT /api/v1/tasks/{id}
export type UpdateTaskResponse = ApiResponse<TaskItemDto>;

// DELETE /api/v1/tasks/{id}
export type DeleteTaskResponse = ApiResponse<null>;

// POST /api/v1/tasks/{id}/complete
export type CompleteTaskResponse = ApiResponse<TaskItemDto>;

// DELETE /api/v1/tasks/{id}/complete
export type ReopenTaskResponse = ApiResponse<TaskItemDto>;

// POST /api/v1/tasks/reorder
export type ReorderTasksResponse = ApiResponse<null>;
