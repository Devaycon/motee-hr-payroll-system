"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardList, Eye } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils";
import { WorkspaceCard } from "@/src/components/shared/workspace-card";
import { PRIORITY_STYLES } from "../data";

type Task = {
  id: string;
  label: string;
  description?: string;
  done: boolean;
  priority: string;
  due: string;
  link: string;
};

interface MyTasksProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export function MyTasks({ tasks, setTasks }: MyTasksProps) {
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  return (
    <>
      <WorkspaceCard
        id="tasks"
        icon={ClipboardList}
        title="My Tasks"
        subtitle={`${tasks.filter((t) => t.done).length}/${tasks.length} done`}
        action={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-6 text-xs px-2"
          >
            <Link href="/hr-action-center/tasks">Manage</Link>
          </Button>
        }
      >
        <ScrollArea className="max-h-70 pr-2 *:data-radix-scroll-area-viewport:max-h-70">
          <div className="flex flex-col gap-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-2.5 py-2 border-b border-border/40 last:border-0"
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
                  <div className="flex items-center gap-1.5 mt-1">
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
            {detailTask?.description && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {detailTask.description}
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
