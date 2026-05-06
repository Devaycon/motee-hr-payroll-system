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
};
