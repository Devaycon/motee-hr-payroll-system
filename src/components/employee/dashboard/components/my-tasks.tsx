"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardList, Eye, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { cn } from "@/src/lib/utils";
import { WorkspaceCard } from "@/src/components/shared/workspace-card";
import {
  EMPLOYEE_TASKS,
  PRIORITY_STYLES,
} from "@/src/data/employee-dashboard-demo";

type EmployeeTask = (typeof EMPLOYEE_TASKS)[number];

type PersonalTask = {
  id: string;
  label: string;
  done: boolean;
  priority: string;
  due: string;
  notes?: string;
};

const CATEGORY_STYLES: Record<string, string> = {
  Training:
    "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  Performance:
    "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  HR: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Personal:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
};

let taskCounter = 100;

export function MyTasks() {
  const [assignedTasks] = useState(EMPLOYEE_TASKS);
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);
  const [detailTask, setDetailTask] = useState<EmployeeTask | null>(null);

  const [newLabel, setNewLabel] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDue, setNewDue] = useState("");
  const [newNotes, setNewNotes] = useState("");

  function addPersonalTask() {
    if (!newLabel.trim() || !newDue) return;
    taskCounter += 1;
    setPersonalTasks((prev) => [
      ...prev,
      {
        id: `pt-${taskCounter}`,
        label: newLabel.trim(),
        done: false,
        priority: newPriority,
        due: newDue,
        notes: newNotes.trim() || undefined,
      },
    ]);
    setNewLabel("");
    setNewPriority("medium");
    setNewDue("");
    setNewNotes("");
  }

  return (
    <>
      <WorkspaceCard
        id="tasks"
        icon={ClipboardList}
        title="My Tasks"
        subtitle={`${assignedTasks.filter((t) => t.done).length + personalTasks.filter((t) => t.done).length}/${assignedTasks.length + personalTasks.length} done`}
        action={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-6 text-xs px-2"
          >
            <Link href="/employee/tasks">Manage</Link>
          </Button>
        }
      >
        <Tabs defaultValue="assigned" className="w-full">
          <PageTabsList
            className="w-full mb-3 h-7"
            tabs={[
              { value: "assigned", label: "Assigned Tasks" },
              { value: "personal", label: "Personal Tasks" },
            ]}
          />

          <TabsContent value="assigned" className="mt-0">
            <ScrollArea className="max-h-70 pr-2 *:data-radix-scroll-area-viewport:max-h-70">
              <div className="flex flex-col gap-1">
                {assignedTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No assigned tasks.
                  </p>
                )}
                {assignedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2.5 py-2 border-b border-border/40 last:border-0"
                  >
                    <Checkbox
                      checked={task.done}
                      disabled
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
                        <span className="text-[10px] text-muted-foreground">
                          Due {task.due}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground shrink-0 hover:text-foreground"
                      onClick={() => setDetailTask(task)}
                    >
                      <Eye className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="personal" className="mt-0 flex flex-col gap-3">
            <div className="rounded-lg border border-[#7F77DD]/30 bg-[#7F77DD]/5 p-3 space-y-2">
              <Input
                placeholder="Task descriptionâ€¦"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="h-7 text-xs"
              />
              <Input
                placeholder="Notes (optional)"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="h-7 text-xs"
              />
              <div className="grid grid-cols-2 gap-1.5">
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
                <Input
                  type="date"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="h-6 text-xs bg-[#7F77DD] hover:bg-[#6b63c4] text-white gap-1"
                  onClick={addPersonalTask}
                  disabled={!newLabel.trim() || !newDue}
                >
                  <Plus className="size-3" />
                  Add Task
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-52 pr-2 *:data-radix-scroll-area-viewport:max-h-52">
              <div className="flex flex-col gap-1">
                {personalTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No personal tasks yet. Add one above.
                  </p>
                )}
                {personalTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2.5 py-2 border-b border-border/40 last:border-0"
                  >
                    <Checkbox
                      checked={task.done}
                      onCheckedChange={(checked) =>
                        setPersonalTasks((prev) =>
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
                        <span className="text-[10px] text-muted-foreground">
                          Due {task.due}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </WorkspaceCard>

      <Dialog
        open={!!detailTask}
        onOpenChange={(v) => !v && setDetailTask(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold leading-snug pr-4">
              {detailTask?.label}
            </DialogTitle>
          </DialogHeader>
          <Separator />
          <div className="flex flex-col gap-3 pt-1">
            {detailTask?.notes && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Notes
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {detailTask.notes}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Priority
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs px-2",
                    detailTask ? PRIORITY_STYLES[detailTask.priority] : "",
                  )}
                >
                  {detailTask?.priority}
                </Badge>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Category
                </p>
                {detailTask?.category && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs px-2",
                      CATEGORY_STYLES[detailTask.category] ??
                        "bg-slate-500/10 text-slate-600",
                    )}
                  >
                    {detailTask.category}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Due Date
                </p>
                <p className="text-sm text-foreground">{detailTask?.due}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Status
                </p>
                <p className="text-sm text-foreground">
                  {detailTask?.done ? "Completed" : "Pending"}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
