import type { ApiResponse } from "./api";

export interface CalendarAttendeeDto {
  employeeId: string;
  name: string;
}

export type CalendarAudience =
  | "company"
  | "people";

export type CalendarCategory =
  | "meeting"
  | "oneToOne"
  | "company"
  | "deadline"
  | "reminder"
  | "training"
  | "performance"
  | "personal"
  | "holiday"
  | "birthday"
  | "anniversary"
  | "leave"
  | "leaveRequest"
  | "cover"
  | "interview"
  | "review";

export interface CalendarEventDto {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  endDate?: string | null;
  allDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  category: CalendarCategory;
  audience: CalendarAudience;
  createdByEmployeeId?: string | null;
  createdByName?: string | null;
  attendees: CalendarAttendeeDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventRequest {
  title: string;
  description?: string | null;
  date: string;
  endDate?: string | null;
  allDay?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  category?: CalendarCategory;
  audience?: CalendarAudience;
  employeeIds?: string[];
}

export interface CalendarItemDto {
  id: string;
  title: string;
  date: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  allDay: boolean;
  category: CalendarCategory;
  layer: CalendarLayer;
  description?: string | null;
  personId?: string | null;
  personName?: string | null;
  pending?: boolean;
  eventId?: string | null;
  canDelete?: boolean;
}

export type CalendarLayer =
  | "schedule"
  | "company"
  | "holidays";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/calendar
export type GetCalendarResponse = ApiResponse<CalendarItemDto[]>;

export interface GetCalendarParams {
  from?: string;
  to?: string;
  employeeIds?: string[];
}

// GET /api/v1/calendar/upcoming
export type GetUpcomingCalendarResponse = ApiResponse<CalendarItemDto[]>;

export interface GetUpcomingCalendarParams {
  days?: number;
}

// POST /api/v1/calendar/events
export type CreateCalendarEventResponse = ApiResponse<CalendarEventDto>;

// GET /api/v1/calendar/events/{id}
export type GetCalendarEventResponse = ApiResponse<CalendarEventDto>;

// PUT /api/v1/calendar/events/{id}
export type UpdateCalendarEventResponse = ApiResponse<CalendarEventDto>;

// DELETE /api/v1/calendar/events/{id}
export type DeleteCalendarEventResponse = ApiResponse<null>;
