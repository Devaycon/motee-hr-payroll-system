import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface AssignTicketRequest {
  assigneeEmployeeId?: string | null;
}

export type TicketCategory =
  "payroll" | "leave" | "itSupport" | "hrPolicy" | "benefits" | "onboarding" | "offboarding" | "other";

export interface TicketDto {
  id: string;
  reference: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  submitterEmployeeId: string;
  submitterName?: string | null;
  submitterDepartmentName?: string | null;
  assigneeEmployeeId?: string | null;
  assigneeName?: string | null;
  slaDueAt: string;
  isOverdue: boolean;
  metSla?: boolean | null;
  firstReplyAt?: string | null;
  hoursToFirstReply?: number | null;
  isWaitingOnMe: boolean;
  resolvedAt?: string | null;
  messages: TicketMessageDto[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessageDto {
  id: string;
  authorEmployeeId: string;
  authorName?: string | null;
  authorDepartmentName?: string | null;
  body: string;
  isFromAgent: boolean;
  isInternalNote: boolean;
  createdAt: string;
}

export type TicketPriority =
  "low" | "medium" | "high" | "urgent";

export interface TicketPriorityRequest {
  priority: TicketPriority;
}

export interface TicketReplyRequest {
  body: string;
  isInternalNote?: boolean;
  status?: TicketStatus;
}

export interface TicketRequest {
  subject: string;
  description: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  submitterEmployeeId?: string | null;
}

export type TicketStatus =
  "open" | "inProgress" | "pending" | "pendingResponse" | "resolved" | "closed";

export interface TicketStatusRequest {
  status: TicketStatus;
}

export interface TicketTally {
  total: number;
  open: number;
  inProgress: number;
  pending: number;
  awaitingEmployee: number;
  resolved: number;
  closed: number;
  overdue: number;
  slaCompliance?: number | null;
  averageHoursToFirstReply?: number | null;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/helpdesk
export type GetHelpdeskTicketsResponse = ApiResponse<PagedResult<TicketDto>>;
export interface GetHelpdeskTicketsParams {
  Status?: TicketStatus;
  Category?: TicketCategory;
  Priority?: TicketPriority;
  AssigneeEmployeeId?: string;
  UnassignedOnly?: boolean;
  OverdueOnly?: boolean;
  OpenOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/helpdesk
export type CreateHelpdeskTicketResponse = ApiResponse<TicketDto>;

// GET /api/v1/helpdesk/summary
export type GetHelpdeskSummaryResponse = ApiResponse<TicketTally>;

// GET /api/v1/helpdesk/mine
export type GetMyHelpdeskTicketsResponse = ApiResponse<TicketDto[]>;

// GET /api/v1/helpdesk/{id}
export type GetHelpdeskTicketResponse = ApiResponse<TicketDto>;

// DELETE /api/v1/helpdesk/{id}
export type DeleteHelpdeskTicketResponse = ApiResponse<unknown | null>;

// POST /api/v1/helpdesk/{id}/messages
export type ReplyToHelpdeskTicketResponse = ApiResponse<TicketDto>;

// POST /api/v1/helpdesk/{id}/status
export type SetHelpdeskTicketStatusResponse = ApiResponse<TicketDto>;

// POST /api/v1/helpdesk/{id}/priority
export type SetHelpdeskTicketPriorityResponse = ApiResponse<TicketDto>;

// POST /api/v1/helpdesk/{id}/assign
export type AssignHelpdeskTicketResponse = ApiResponse<TicketDto>;
export type AssignHelpdeskTicketRequest = unknown | null | AssignTicketRequest;

