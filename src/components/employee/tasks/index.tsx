"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { AssignedTasks } from "./components/assigned-tasks";
import { PersonalTasks } from "./components/personal-tasks";
import { TaskFilter } from "./components/task-filters";
import { NewPersonalTask } from "./components/add-task-form";
import { getDueStatus } from "./components/task-utils";
import { EMPLOYEE_TASKS } from "@/src/data/employee-dashboard-demo";
import { useMyAssignedTasks } from "./hooks";

type PersonalTask = {
  id: string;
  label: string;
  done: boolean;
  priority: string;
  due: string;
  category: string;
  notes?: string;
};

let taskCounter = 200;

export function EmployeeTasksPage() {
  const { data: localeTasks } = useMyAssignedTasks();
  const [assignedTasks] = useState(
    localeTasks && localeTasks.length ? localeTasks : EMPLOYEE_TASKS,
  );
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([
    {
      id: "pt-demo-001",
      label: "Buy a birthday gift for Tunde",
      done: false,
      priority: "medium",
      due: "2026-05-10",
      category: "Personal",
      notes: "He likes tech accessories.",
    },
    {
      id: "pt-demo-002",
      label: "Renew car insurance",
      done: false,
      priority: "high",
      due: "2026-05-08",
      category: "Personal",
    },
    {
      id: "pt-demo-003",
      label: "Read 'Atomic Habits' — Chapter 5",
      done: true,
      priority: "low",
      due: "2026-05-06",
      category: "Personal",
      notes: "Library copy due back by weekend.",
    },
    {
      id: "pt-demo-004",
      label: "Book doctor appointment",
      done: false,
      priority: "high",
      due: "2026-05-07",
      category: "Personal",
    },
    {
      id: "pt-demo-005",
      label: "Prepare presentation slides for team sync",
      done: false,
      priority: "medium",
      due: "2026-05-12",
      category: "HR",
      notes: "Focus on Q2 metrics.",
    },
    {
      id: "pt-demo-006",
      label: "Complete online React advanced course",
      done: false,
      priority: "medium",
      due: "2026-05-20",
      category: "Training",
    },
  ]);
  const [filter, setFilter] = useState<TaskFilter>("all");

  const assignedDone = assignedTasks.filter((t) => t.done).length;
  const assignedOverdue = assignedTasks.filter(
    (t) => !t.done && getDueStatus(t.due, t.done) === "overdue",
  ).length;
  const personalDone = personalTasks.filter((t) => t.done).length;

  function handleAddPersonal(task: NewPersonalTask) {
    taskCounter += 1;
    setPersonalTasks((prev) => [
      ...prev,
      { id: `pt-${taskCounter}`, done: false, ...task },
    ]);
  }

  function handleTogglePersonal(id: string, done: boolean) {
    setPersonalTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done } : t)),
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-4xl font-bold text-foreground">My Tasks</h1>
          <p className="text-xs text-muted-foreground">
            {assignedDone + personalDone}/
            {assignedTasks.length + personalTasks.length} completed
            {assignedOverdue > 0 && (
              <span className="ml-2 text-red-500">
                · {assignedOverdue} overdue
              </span>
            )}
          </p>
        </div>
      </div>

      <Tabs defaultValue="assigned" className="w-full">
        <PageTabsList
          className="mb-4"
          tabs={[
            { value: "assigned", label: "Assigned Tasks" },
            { value: "personal", label: "Personal Tasks" },
          ]}
        />

        <TabsContent value="assigned" className="mt-0">
          <AssignedTasks
            tasks={assignedTasks}
            filter={filter}
            onFilterChange={setFilter}
          />
        </TabsContent>

        <TabsContent value="personal" className="mt-0">
          <PersonalTasks
            tasks={personalTasks}
            onToggle={handleTogglePersonal}
            onAdd={handleAddPersonal}
            filter={filter}
            onFilterChange={setFilter}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
