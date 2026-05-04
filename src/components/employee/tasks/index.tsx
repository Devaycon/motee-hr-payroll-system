"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  ChevronLeft,
  Plus,
  X,
  AlertCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
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
  return daysLeft <= 3 ? "soon" : "ok";
}

function formatDue(due: string): string {
  return new Date(due).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

let taskCounter = 200;

export function EmployeeTasksPage() {
  const router = useRouter();
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
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </Button>
        <span className="text-muted-foreground text-xs">/</span>
        <span className="text-xs text-foreground font-medium">My Tasks</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted">
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Tasks</h1>
            <p className="text-xs text-muted-foreground">
              {doneCount}/{tasks.length} completed
              {overdueCount > 0 && (
                <span className="ml-2 text-red-500">
                  · {overdueCount} overdue
                </span>
              )}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 bg-[#7F77DD] hover:bg-[#6b63c4] text-white"
          onClick={() => setShowAddForm((p) => !p)}
        >
          {showAddForm ? (
            <>
              <X className="w-3.5 h-3.5" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> Add Task
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
        <Card>
          <CardHeader className="px-5 pt-4 pb-3">
            <div className="flex gap-1.5 flex-wrap">
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
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    filter === key
                      ? "bg-[#7F77DD] text-white border-[#7F77DD]"
                      : "border-border text-muted-foreground hover:border-[#7F77DD]/40",
                  )}
                >
                  {label}
                  {key === "all" && (
                    <span className="ml-1.5 text-[10px] opacity-70">
                      {tasks.length}
                    </span>
                  )}
                  {key === "done" && (
                    <span className="ml-1.5 text-[10px] opacity-70">
                      {doneCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex flex-col gap-1.5">
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No tasks in this filter.
                </p>
              )}
              {filtered.map((task) => {
                const status = getDueStatus(task.due, task.done);
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-start gap-3 py-3 px-3 rounded-lg border transition-colors",
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
                          "text-sm leading-relaxed",
                          task.done
                            ? "line-through text-muted-foreground"
                            : "text-foreground",
                        )}
                      >
                        {task.label}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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
                            <AlertCircle className="h-3 w-3" />
                            Overdue · {formatDue(task.due)}
                          </span>
                        )}
                        {!task.done && status === "soon" && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            <Clock className="h-3 w-3" />
                            Due {formatDue(task.due)}
                          </span>
                        )}
                        {!task.done && status === "ok" && (
                          <span className="text-[10px] text-muted-foreground">
                            Due {formatDue(task.due)}
                          </span>
                        )}
                        {task.notes && (
                          <span className="text-[10px] text-muted-foreground italic">
                            {task.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={task.link}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground shrink-0"
                      >
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {showAddForm && (
          <Card>
            <CardHeader className="px-5 pt-4 pb-2">
              <CardTitle className="text-sm font-medium">New Task</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Description
                </label>
                <Input
                  placeholder="What needs to be done?"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Priority
                </label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Category
                </label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="text-sm">
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
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  className="text-sm"
                />
              </div>
              <Button
                className="w-full bg-[#7F77DD] hover:bg-[#6b63c4] text-white"
                onClick={addTask}
                disabled={!newLabel.trim() || !newDue}
              >
                Add Task
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
