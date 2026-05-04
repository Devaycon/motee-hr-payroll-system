export type EventType = "meeting" | "deadline" | "reminder" | "holiday";

export type CalEvent = {
  id: string;
  title: string;
  date: string;
  type: EventType;
  description?: string;
};
