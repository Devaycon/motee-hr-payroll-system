/** Generic calendar event shared by the HR calendar and employee events modules. */
export interface CalEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  description?: string;
}

export interface EventTypeOption {
  value: string;
  label: string;
}
