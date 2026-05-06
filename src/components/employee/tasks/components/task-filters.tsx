"use client";

import { cn } from "@/src/lib/utils";

export type TaskFilter = "all" | "todo" | "done" | "high" | "medium" | "low";

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "todo", label: "To Do" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
  { key: "done", label: "Done" },
];

interface TaskFiltersProps {
  filter: TaskFilter;
  onFilterChange: (f: TaskFilter) => void;
  total: number;
  doneCount: number;
}

export function TaskFilters({
  filter,
  onFilterChange,
  total,
  doneCount,
}: TaskFiltersProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {FILTERS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
            filter === key
              ? "bg-[#4361ee] text-white border-[#4361ee]"
              : "border-border text-muted-foreground hover:border-[#4361ee]/40",
          )}
        >
          {label}
          {key === "all" && (
            <span className="ml-1.5 text-[10px] opacity-70">{total}</span>
          )}
          {key === "done" && (
            <span className="ml-1.5 text-[10px] opacity-70">{doneCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}
