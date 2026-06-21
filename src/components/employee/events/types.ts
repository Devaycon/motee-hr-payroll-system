export type EmployeeEventType =
  | "company"
  | "training"
  | "birthday"
  | "anniversary"
  | "leave"
  | "performance";

export type EmployeeCalEvent = {
  id: string;
  title: string;
  date: string;
  type: EmployeeEventType;
  description?: string;
  /** Start time in "HH:mm" (24h). Omitted for all-day / date-only events. */
  startTime?: string;
  /** End time in "HH:mm" (24h). */
  endTime?: string;
  /** True when the event spans the whole day (no specific time slot). */
  allDay?: boolean;
};
