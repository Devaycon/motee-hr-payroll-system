"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { Priority, Task } from "./types";

interface RawTask {
  id?: string;
  title?: string;
  label?: string;
  description?: string;
  assignee?: string;
  assigneeId?: string;
  dueDate?: string;
  due?: string;
  priority?: string;
  status?: string;
  done?: boolean;
  completed?: boolean;
  linkedTo?: string;
  link?: string;
}

function mapPriority(p?: string): Priority {
  if (p === "high" || p === "low") return p;
  return "medium";
}

function buildTasks(bundle: LocaleBundle): Task[] {
  return ((bundle.tasks ?? []) as RawTask[]).slice(0, 50).map((raw, i) => ({
    id: raw.id ?? `mt-${i + 1}`,
    label: raw.title ?? raw.label ?? "Task",
    description: raw.description,
    done: raw.done ?? raw.completed ?? raw.status === "completed",
    priority: mapPriority(raw.priority),
    due: raw.dueDate ?? raw.due ?? "No due date",
    link: raw.link ?? "#",
  }));
}

export function useHrTasks() {
  return useLocaleSection<Task[]>(buildTasks);
}
