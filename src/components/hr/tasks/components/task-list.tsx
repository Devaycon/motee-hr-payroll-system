"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
import { Separator } from "@/src/components/ui/separator";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { cn } from "@/src/lib/utils";
import { SortableTask } from "./sortable-task";
import type { Task, Priority } from "../types";

interface TaskListProps {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  filter: "all" | "active" | "done";
  setFilter: Dispatch<SetStateAction<"all" | "active" | "done">>;
  priorityFilter: "all" | Priority;
  setPriorityFilter: Dispatch<SetStateAction<"all" | Priority>>;
}

export function TaskList({
  tasks,
  setTasks,
  filter,
  setFilter,
  priorityFilter,
  setPriorityFilter,
}: TaskListProps) {
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  const filtered = tasks.filter((t) => {
    if (filter === "active" && t.done) return false;
    if (filter === "done" && !t.done) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTasks((prev) => {
        const oldIndex = prev.findIndex((t) => t.id === active.id);
        const newIndex = prev.findIndex((t) => t.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-5 pt-4 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">All Tasks</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border overflow-hidden">
            {(["all", "active", "done"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 text-xs capitalize transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <Select
            value={priorityFilter}
            onValueChange={(v) => setPriorityFilter(v as "all" | Priority)}
          >
            <SelectTrigger className="h-7 text-xs w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="px-5 pb-4 pt-2 flex-1 min-h-0">
        <ScrollArea className="max-h-105 *:data-radix-scroll-area-viewport:max-h-105">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={filtered.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">
                  No tasks match your filter.
                </p>
              ) : (
                filtered.map((task) => (
                  <SortableTask
                    key={task.id}
                    task={task}
                    onToggle={(id) =>
                      setTasks((prev) =>
                        prev.map((t) =>
                          t.id === id ? { ...t, done: !t.done } : t,
                        ),
                      )
                    }
                    onDelete={(id) =>
                      setTasks((prev) => prev.filter((t) => t.id !== id))
                    }
                  />
                ))
              )}
            </SortableContext>
          </DndContext>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
