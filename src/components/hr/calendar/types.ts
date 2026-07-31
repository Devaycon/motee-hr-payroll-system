export type EventType =
  | "meeting"
  | "deadline"
  | "reminder"
  | "holiday"
  | "leave"
  | "leave_request"
  /** Someone standing in for a colleague on leave (client feedback §3.2). */
  | "cover"
  | "training"
  | "one_to_one"
  | "birthday"
  | "anniversary";

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
