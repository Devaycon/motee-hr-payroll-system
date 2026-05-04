"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ClipboardList,
  ChevronRight,
  Plus,
  X,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  EMPLOYEE_TASKS,
  PRIORITY_STYLES,
} from "@/src/data/employee-dashboard-demo";

type TaskFilter = "all" | "todo" | "done" | "high" | "medium" | "low";

const CATEGORY_STYLES: Record<string, string> = {
  Training:
    "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  Performance:
    "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  HR: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Personal:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
};

const TODAY = "2026-04-23";

function getDueStatus(due: string, done: boolean): "overdue" | "soon" | "ok" {
  if (done) return "ok";
  if (due < TODAY) return "overdue";
  const daysLeft = Math.ceil(
    (new Date(due).getTime() - new Date(TODAY).getTime()) / 86400000,
  );
  if (daysLeft <= 3) return "soon";
  return "ok";
}

function formatDue(due: string): string {
  return new Date(due).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

let taskCounter = 100;

export function MyTasks() {
  const [tasks, setTasks] = useState(EMPLOYEE_TASKS);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDue, setNewDue] = useState("");
  const [newCategory, setNewCategory] = useState("Personal");

  const filtered = tasks.filter((t) => {
    if (filter === "todo") return !t.done;
    if (filter === "done") return t.done;
    if (filter === "high") return t.priority === "high" && !t.done;
    if (filter === "medium") return t.priority === "medium" && !t.done;
    if (filter === "low") return t.priority === "low" && !t.done;
    return true;
  });

  const doneCount = tasks.filter((t) => t.done).length;
  const overdueCount = tasks.filter(
    (t) => !t.done && getDueStatus(t.due, t.done) === "overdue",
  ).length;

  function addTask() {
    if (!newLabel.trim() || !newDue) return;
    taskCounter += 1;
    setTasks((prev) => [
      ...prev,
      {
        id: `et-new-${taskCounter}`,
        label: newLabel.trim(),
        done: false,
        priority: newPriority,
        due: newDue,
        link: "/growth/performance",
        category: newCategory,
      },
    ]);
    setNewLabel("");
    setNewDue("");
    setNewPriority("medium");
    setNewCategory("Personal");
    setShowAddForm(false);
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
          {overdueCount > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              {overdueCount} overdue
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {doneCount}/{tasks.length} done
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowAddForm((p) => !p)}
          >
            {showAddForm ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-6 text-xs px-2 gap-0.5"
          >
            <Link href="/growth/performance">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex flex-col gap-3">
        {showAddForm && (
          <div className="rounded-lg border border-[#7F77DD]/30 bg-[#7F77DD]/5 p-3 space-y-2">
            <Input
              placeholder="Task description…"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="h-7 text-xs"
            />
            <div className="grid grid-cols-3 gap-1.5">
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Training", "Performance", "HR", "Personal"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex gap-1.5 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-6 text-xs bg-[#7F77DD] hover:bg-[#6b63c4] text-white"
                onClick={addTask}
                disabled={!newLabel.trim() || !newDue}
              >
                Add
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-1 flex-wrap">
          {(
            [
              { key: "all", label: "All" },
              { key: "todo", label: "To Do" },
              { key: "high", label: "High" },
              { key: "medium", label: "Medium" },
              { key: "low", label: "Low" },
              { key: "done", label: "Done" },
            ] as { key: TaskFilter; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
                filter === key
                  ? "bg-[#7F77DD] text-white border-[#7F77DD]"
                  : "border-border text-muted-foreground hover:border-[#7F77DD]/40",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No tasks in this filter.
            </p>
          )}
          {filtered.map((task) => {
            const status = getDueStatus(task.due, task.done);
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-2.5 py-1.5 px-2 rounded-lg border transition-colors",
                  status === "overdue" && !task.done
                    ? "border-red-200 dark:border-red-900 bg-red-500/5"
                    : status === "soon" && !task.done
                      ? "border-amber-200 dark:border-amber-900 bg-amber-500/5"
                      : "border-transparent hover:bg-muted/40",
                )}
              >
                <Checkbox
                  checked={task.done}
                  onCheckedChange={(checked) =>
                    setTasks((prev) =>
                      prev.map((t) =>
                        t.id === task.id ? { ...t, done: !!checked } : t,
                      ),
                    )
                  }
                  className="mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-xs leading-relaxed",
                      task.done
                        ? "line-through text-muted-foreground"
                        : "text-foreground",
                    )}
                  >
                    {task.label}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        PRIORITY_STYLES[task.priority],
                      )}
                    >
                      {task.priority}
                    </Badge>
                    {task.category && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          CATEGORY_STYLES[task.category] ??
                            "bg-slate-500/10 text-slate-600",
                        )}
                      >
                        {task.category}
                      </Badge>
                    )}
                    {!task.done && status === "overdue" && (
                      <span className="flex items-center gap-0.5 text-[10px] text-red-600 dark:text-red-400 font-medium">
                        <AlertCircle className="h-2.5 w-2.5" />
                        Overdue · {formatDue(task.due)}
                      </span>
                    )}
                    {!task.done && status === "soon" && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        <Clock className="h-2.5 w-2.5" />
                        Due {formatDue(task.due)}
                      </span>
                    )}
                    {!task.done && status === "ok" && (
                      <span className="text-[10px] text-muted-foreground">
                        Due {formatDue(task.due)}
                      </span>
                    )}
                  </div>
                </div>
                <Link href={task.link} onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 text-muted-foreground shrink-0"
                  >
                    <ChevronRight className="size-3" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
