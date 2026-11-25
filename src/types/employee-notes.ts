import type { ApiResponse } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface EmployeeNoteDto {
  id: string;
  employeeId: string;
  authorName?: string | null;
  body: string;
  kind: NoteKind;
  audience: NoteAudience;
  pinned: boolean;
  remindAt?: string | null;
  reminderIsDue: boolean;
  createdAt: string;
}

export interface EmployeeNoteRequest {
  body: string;
  kind?: NoteKind;
  audience?: NoteAudience;
  pinned?: boolean;
  remindAt?: string | null;
}

export type NoteAudience =
  "hrOnly" | "managerAndHr";

export type NoteKind =
  "note" | "reminder";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/employees/{employeeId}/notes
export type GetEmployeeNotesResponse = ApiResponse<EmployeeNoteDto[]>;

// POST /api/v1/employees/{employeeId}/notes
export type AddEmployeeNoteResponse = ApiResponse<EmployeeNoteDto>;

// PUT /api/v1/employees/{employeeId}/notes/{noteId}
export type UpdateEmployeeNoteResponse = ApiResponse<EmployeeNoteDto>;

// DELETE /api/v1/employees/{employeeId}/notes/{noteId}
export type DeleteEmployeeNoteResponse = ApiResponse<unknown | null>;

// POST /api/v1/employees/{employeeId}/notes/{noteId}/pin
export type PinEmployeeNoteResponse = ApiResponse<EmployeeNoteDto>;
export interface PinEmployeeNoteParams {
  pinned?: boolean;
}

