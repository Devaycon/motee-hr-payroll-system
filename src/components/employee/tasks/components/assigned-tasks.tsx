"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { TaskFilters, TaskFilter } from "./task-filters";
import { TaskItem, TaskItemData } from "./task-item";
import { TaskPagination } from "./task-pagination";
import { getDueStatus } from "./task-utils";

const PAGE_SIZE = 5;

interface AssignedTasksProps {
  tasks: TaskItemData[];
  filter: TaskFilter;
  onFilterChange: (f: TaskFilter) => void;
}

export function AssignedTasks({
  tasks,
  filter,
  onFilterChange,
}: AssignedTasksProps) {
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

  const overdueCount = tasks.filter(
    (t) => !t.done && getDueStatus(t.due, t.done) === "overdue",
  ).length;

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
    <Card>
      <CardHeader className="px-5 pt-4 pb-3">
        <TaskFilters
          filter={filter}
          onFilterChange={handleFilterChange}
          total={tasks.length}
          doneCount={doneCount}
        />
        {overdueCount > 0 && (
          <p className="text-[11px] text-red-500 mt-1">
            {overdueCount} overdue task{overdueCount !== 1 ? "s" : ""}
          </p>
        )}
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex flex-col gap-1.5">
          {paginated.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No tasks in this filter.
            </p>
          )}
          {paginated.map((task) => (
            <TaskItem key={task.id} task={task} />
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
  );
}
