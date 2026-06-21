/** Generic calendar event shared by the HR calendar and employee events modules. */
export interface CalEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  description?: string;
  /** Start time in "HH:mm" (24h). Omitted for all-day / date-only events. */
  startTime?: string;
  /** End time in "HH:mm" (24h). */
  endTime?: string;
  /** True when the event spans the whole day (no specific time slot). */
  allDay?: boolean;
}

export interface EventTypeOption {
  value: string;
  label: string;
}
