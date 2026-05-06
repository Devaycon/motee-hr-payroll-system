"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { TaskFilters, TaskFilter } from "./task-filters";
import { TaskItem, TaskItemData } from "./task-item";
import { TaskPagination } from "./task-pagination";
import { AddTaskForm, NewPersonalTask } from "./add-task-form";

const PAGE_SIZE = 5;

interface PersonalTasksProps {
  tasks: TaskItemData[];
  onToggle: (id: string, done: boolean) => void;
  onAdd: (task: NewPersonalTask) => void;
  filter: TaskFilter;
  onFilterChange: (f: TaskFilter) => void;
}

export function PersonalTasks({
  tasks,
  onToggle,
  onAdd,
  filter,
  onFilterChange,
}: PersonalTasksProps) {
  const [page, setPage] = useState(1);

  const doneCount = tasks.filter((t) => t.done).length;

  const filtered = tasks.filter((t) => {
    if (filter === "todo") return !t.done;
    if (filter === "done") return t.done;
    if (filter === "high") return t.priority === "high" && !t.done;
    if (filter === "medium") return t.priority === "medium" && !t.done;
    if (filter === "low") return t.priority === "low" && !t.done;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function handleFilterChange(f: TaskFilter) {
    setPage(1);
    onFilterChange(f);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
      <Card>
        <CardHeader className="px-5 pt-4 pb-3">
          <TaskFilters
            filter={filter}
            onFilterChange={handleFilterChange}
            total={tasks.length}
            doneCount={doneCount}
          />
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex flex-col gap-1.5">
            {paginated.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                {tasks.length === 0
                  ? "No personal tasks yet. Add one using the form."
                  : "No tasks in this filter."}
              </p>
            )}
            {paginated.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={onToggle} />
            ))}
          </div>
          <TaskPagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            from={(safePage - 1) * PAGE_SIZE + 1}
            to={Math.min(safePage * PAGE_SIZE, filtered.length)}
            total={filtered.length}
          />
        </CardContent>
      </Card>

      <AddTaskForm onAdd={onAdd} />
    </div>
  );
}
