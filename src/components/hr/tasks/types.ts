export type Priority = "high" | "medium" | "low";

export type Task = {
  id: string;
  label: string;
  description?: string;
  done: boolean;
  priority: Priority;
  due: string;
  link: string;
};
