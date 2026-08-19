"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CircleCheck, CircleDashed, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import {
  addMilestone,
  deleteMilestone,
  toggleMilestone,
} from "@/src/lib/stores/projects-slice";
import { cn } from "@/src/lib/utils";
import { daysBetween, type Project } from "@/src/lib/types/projects";

export function MilestonesPanel({ project }: { project: Project }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [date, setDate] = useState(project.endDate);

  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...project.milestones].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  function handleAdd() {
    if (name.trim().length < 2) {
      toast.error("Give the milestone a name.");
      return;
    }
    dispatch(
      addMilestone({
        projectId: project.id,
        milestone: { name: name.trim(), date, reached: false },
      }),
    );
    setName("");
    toast.success("Milestone added");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/60 p-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Milestone</Label>
          <Input
            className="h-9 w-64"
            placeholder="e.g. Go-live"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Date</Label>
          <Input
            type="date"
            className="h-9 w-44"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Button className="h-9 gap-1.5" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No milestones yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Milestones mark the dates that matter to people outside the project.
          </p>
        </div>
      ) : (
        <ol className="space-y-2">
          {sorted.map((m) => {
            // An unmet milestone whose date has passed is the thing a status
            // report needs to lead with.
            const overdue = !m.reached && m.date < today;
            const daysAway = daysBetween(today, m.date);

            return (
              <li
                key={m.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-lg border p-3",
                  overdue
                    ? "border-rose-500/30 bg-rose-500/5"
                    : "border-border/60",
                )}
              >
                <button
                  type="button"
                  aria-label={m.reached ? "Mark not reached" : "Mark reached"}
                  onClick={() =>
                    dispatch(
                      toggleMilestone({
                        projectId: project.id,
                        milestoneId: m.id,
                      }),
                    )
                  }
                >
                  {m.reached ? (
                    <CircleCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <CircleDashed className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      m.reached
                        ? "text-muted-foreground line-through"
                        : "text-foreground",
                    )}
                  >
                    {m.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.date}
                    {!m.reached &&
                      (overdue
                        ? ` · ${Math.abs(daysAway)} day${Math.abs(daysAway) === 1 ? "" : "s"} overdue`
                        : ` · in ${daysAway} day${daysAway === 1 ? "" : "s"}`)}
                  </p>
                </div>

                {overdue && (
                  <Badge
                    variant="outline"
                    className="border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-600 dark:text-rose-400"
                  >
                    Overdue
                  </Badge>
                )}
                {m.reached && (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                  >
                    Reached
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() =>
                    dispatch(
                      deleteMilestone({
                        projectId: project.id,
                        milestoneId: m.id,
                      }),
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
