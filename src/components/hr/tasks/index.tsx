"use client";

import { useEffect, useState } from "react";
import { TaskList } from "./components/task-list";
import { NewTaskForm } from "./components/new-task-form";
import type { Task, Priority } from "./types";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useHrTasks } from "./hooks";

export function TasksPage() {
  const { data, loading } = useHrTasks();
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    if (data) setTasks(data);
  }, [data]);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newDue, setNewDue] = useState("");

  function handleAdd() {
    if (!newLabel.trim()) return;
    setTasks((prev) => [
      {
        id: `mt-${Date.now()}`,
        label: newLabel.trim(),
        description: newDescription.trim() || undefined,
        done: false,
        priority: newPriority,
        due: newDue || "No due date",
        link: "#",
      },
      ...prev,
    ]);
    setNewLabel("");
    setNewDescription("");
    setNewDue("");
    setNewPriority("medium");
  }

  const doneCount = tasks.filter((t) => t.done).length;

  if (loading && !tasks.length) {
    return (
      <div className="flex flex-col gap-5 pb-10">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">Tasks</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {doneCount}/{tasks.length} completed
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-stretch">
        <TaskList
          tasks={tasks}
          setTasks={setTasks}
          filter={filter}
          setFilter={setFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
        />
        <NewTaskForm
          newLabel={newLabel}
          setNewLabel={setNewLabel}
          newDescription={newDescription}
          setNewDescription={setNewDescription}
          newPriority={newPriority}
          setNewPriority={setNewPriority}
          newDue={newDue}
          setNewDue={setNewDue}
          onAdd={handleAdd}
        />
      </div>
    </div>
  );
}
