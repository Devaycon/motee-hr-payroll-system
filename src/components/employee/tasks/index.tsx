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
import { useMyTaskActions, useMyTaskSummary, useMyTasks } from "./hooks";


/** Self-service My Tasks page. */
export function EmployeeTasksPage() {
  return <MyTasksPanel />;
}

/**
 * Assigned and personal tasks for the signed-in person. Shared by the
 * self-service My Tasks page and the My Tasks tab in admin My Work.
 */
export function MyTasksPanel({
  embedded = false,
}: { embedded?: boolean } = {}) {
  const { assigned: assignedTasks, personal: personalTasks } = useMyTasks();
  const summary = useMyTaskSummary();
  const actions = useMyTaskActions();
  const [filter, setFilter] = useState<TaskFilter>("all");

  const assignedDone = assignedTasks.filter((t) => t.done).length;
  const assignedOverdue =
    summary?.overdue ??
    assignedTasks.filter(
      (t) => !t.done && getDueStatus(t.due, t.done) === "overdue",
    ).length;
  const personalDone = personalTasks.filter((t) => t.done).length;

  function handleAddPersonal(task: NewPersonalTask) {
    void actions.add(task);
  }

  function handleTogglePersonal(id: string, done: boolean) {
    void actions.toggle(id, done);
  }

  return (
    <div
      className={embedded ? "flex flex-col gap-4" : "flex flex-col gap-5 pb-10"}
    >
      {embedded ? (
        // In admin My Work, assigned work already lives under To do — only
        // the person's own personal tasks are added there.
        <>
          <p className="text-xs text-muted-foreground">
            {personalDone}/{personalTasks.length} personal tasks completed
          </p>
          <PersonalTasks
            tasks={personalTasks}
            onToggle={handleTogglePersonal}
            onAdd={handleAddPersonal}
            filter={filter}
            onFilterChange={setFilter}
          />
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div>
              {!embedded && (
                <h1 className="text-4xl font-bold text-foreground">My Tasks</h1>
              )}
              <p className="text-xs text-muted-foreground">
                {summary?.done ?? assignedDone + personalDone}/
                {summary?.total ?? assignedTasks.length + personalTasks.length}{" "}
                completed
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
        </>
      )}
    </div>
  );
}
