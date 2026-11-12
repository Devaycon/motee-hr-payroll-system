"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  useGetAllTasksAssignedByMeQuery,
  useGetAllTasksQuery,
} from "@/src/store/services/collections";
import {
  useCompleteTaskMutation,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetTasksSummaryQuery,
  useLazyGetTaskQuery,
  useReopenTaskMutation,
  useReorderTasksMutation,
  useUpdateTaskMutation,
} from "@/src/store/services/tasks";
import type { TaskItemDto, TaskPriority } from "@/src/types/tasks";
import type { NewPersonalTask } from "./components/add-task-form";

export interface MyTask {
  id: string;
  label: string;
  done: boolean;
  priority: string;
  due: string;
  category: string;
  notes?: string;
}

export function taskFromApi(dto: TaskItemDto): MyTask {
  return {
    id: dto.id,
    label: dto.title,
    done: dto.done,
    priority: dto.priority,
    due: dto.dueOn ?? "",
    category: dto.category ?? (dto.source === "assigned" ? "Assigned" : "Personal"),
    notes: dto.notes ?? undefined,
  };
}

const PRIORITIES: TaskPriority[] = ["high", "medium", "low"];
const priorityOf = (p: string): TaskPriority =>
  PRIORITIES.includes(p as TaskPriority) ? (p as TaskPriority) : "medium";

/** The signed-in person's tasks: given to them by others, and their own. */
export function useMyTasks() {
  const { data, isLoading } = useGetAllTasksQuery();
  return useMemo(() => {
    const sorted = [...(data ?? [])].sort((a, b) => a.sequence - b.sequence);
    return {
      assigned: sorted.filter((t) => t.source === "assigned").map(taskFromApi),
      personal: sorted.filter((t) => t.source === "personal").map(taskFromApi),
      loading: isLoading,
    };
  }, [data, isLoading]);
}

/** Counts for the page header, as the server works them out. */
export function useMyTaskSummary() {
  return useGetTasksSummaryQuery().data?.data ?? null;
}

/** Tasks the signed-in person has given to someone else. */
export function useTasksAssignedByMe() {
  const { data } = useGetAllTasksAssignedByMeQuery();
  return useMemo(() => (data ?? []).map(taskFromApi), [data]);
}

export function useMyTaskActions() {
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [completeTask] = useCompleteTaskMutation();
  const [reopenTask] = useReopenTaskMutation();
  const [reorderTasks] = useReorderTasksMutation();
  const [loadTask] = useLazyGetTaskQuery();

  const guard = useCallback(async (call: () => Promise<unknown>, failure: string) => {
    try {
      await call();
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, failure));
      return false;
    }
  }, []);

  return {
    /** A personal task: no assignee, so the server gives it to the signed-in person. */
    add: (task: NewPersonalTask, assigneeEmployeeId?: string) =>
      guard(
        () =>
          createTask({
            title: task.label.trim(),
            notes: task.notes?.trim() || null,
            priority: priorityOf(task.priority),
            category: task.category || null,
            dueOn: task.due || null,
            assigneeEmployeeId: assigneeEmployeeId ?? null,
          }).unwrap(),
        "Could not add the task.",
      ),
    toggle: (id: string, done: boolean) =>
      guard(
        () =>
          done
            ? completeTask({
                id,
                body: { completedOn: new Date().toISOString().slice(0, 10) },
              }).unwrap()
            : reopenTask(id).unwrap(),
        "Could not update the task.",
      ),
    /** Edits keep whatever the form does not show, re-read from the server. */
    update: (id: string, patch: Partial<NewPersonalTask>) =>
      guard(async () => {
        const current = (await loadTask(id).unwrap()).data;
        await updateTask({
          id,
          body: {
            title: (patch.label ?? current.title).trim(),
            notes: patch.notes ?? current.notes ?? null,
            priority: patch.priority ? priorityOf(patch.priority) : current.priority,
            category: patch.category ?? current.category ?? null,
            dueOn: patch.due ?? current.dueOn ?? null,
            assigneeEmployeeId: current.assigneeEmployeeId,
            link: current.link ?? null,
          },
        }).unwrap();
      }, "Could not save the task."),
    remove: (id: string) => guard(() => deleteTask(id).unwrap(), "Could not delete the task."),
    reorder: (orderedIds: string[]) =>
      guard(() => reorderTasks({ orderedIds }).unwrap(), "Could not reorder the tasks."),
  };
}
