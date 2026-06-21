export type EventType =
  | "meeting"
  | "deadline"
  | "reminder"
  | "holiday"
  | "leave"
  | "leave_request"
  | "training"
  | "one_to_one";

export type CalEvent = {
  id: string;
  title: string;
  date: string;
  type: EventType;
  description?: string;
  /** Start time in "HH:mm" (24h). Omitted for all-day / date-only events. */
  startTime?: string;
  /** End time in "HH:mm" (24h). */
  endTime?: string;
  /** True when the event spans the whole day (no specific time slot). */
  allDay?: boolean;
};
