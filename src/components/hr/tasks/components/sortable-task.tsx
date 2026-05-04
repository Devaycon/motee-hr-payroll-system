"use client";

import { useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, Trash2, Eye } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import { PRIORITY_STYLES } from "../data";
import type { Task } from "../types";

interface SortableTaskProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SortableTask({ task, onToggle, onDelete }: SortableTaskProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          "flex items-start gap-3 py-3 border-b border-border/50 last:border-0",
          isDragging && "opacity-60 bg-accent/50 rounded-md px-2",
        )}
      >
        <Button
          {...attributes}
          {...listeners}
          variant="ghost"
          size="icon"
          className="size-6 shrink-0 text-muted-foreground hover:bg-transparent mt-0.5 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </Button>
        <Checkbox
          checked={task.done}
          onCheckedChange={() => onToggle(task.id)}
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
          className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setDetailOpen(true)}
        >
          <Eye className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold leading-snug pr-4">
              {task.label}
            </DialogTitle>
          </DialogHeader>
          <Separator />
          <div className="flex flex-col gap-3 pt-1">
            {task.description && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {task.description}
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
                  className={cn("text-xs px-2", PRIORITY_STYLES[task.priority])}
                >
                  {task.priority}
                </Badge>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Due Date
                </p>
                <p className="text-sm text-foreground">{task.due}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Status
                </p>
                <p className="text-sm text-foreground">
                  {task.done ? "Completed" : "Pending"}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
