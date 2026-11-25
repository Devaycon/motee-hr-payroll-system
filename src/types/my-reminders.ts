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

export type NoteAudience =
  "hrOnly" | "managerAndHr";

export type NoteKind =
  "note" | "reminder";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/my-reminders
export type GetMyRemindersResponse = ApiResponse<EmployeeNoteDto[]>;

