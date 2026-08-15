"use client";

import { useMemo } from "react";
import { AlertTriangle, Diamond, Flag } from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  criticalPath,
  daysBetween,
  findScheduleConflicts,
  isTaskBlocked,
  type Milestone,
  type ProjectTask,
} from "@/src/lib/types/projects";

interface GanttChartProps {
  tasks: ProjectTask[];
  milestones: Milestone[];
  projectStart: string;
  projectEnd: string;
}

/** Minimum pixels per day, so a short project doesn't render as a hairline. */
const MIN_DAY_WIDTH = 3;
const MAX_DAY_WIDTH = 14;

/**
 * §10 — the project timeline.
 *
 * Built from CSS grid rather than a charting library: a Gantt is a set of bars
 * positioned on a date axis, and every library that draws one also brings its
 * own theming, tooltips and bundle weight to fight with.
 *
 * The bars are the easy part. What makes it worth having is what it surfaces:
 * the critical path, and any task scheduled to start before the thing it
 * depends on has finished.
 */
export function GanttChart({
  tasks,
  milestones,
  projectStart,
  projectEnd,
}: GanttChartProps) {
  const model = useMemo(() => {
    if (tasks.length === 0) return null;

    // The axis spans the project *and* anything scheduled outside it — a task
    // running past the project end date is exactly what you need to see.
    const starts = [projectStart, ...tasks.map((t) => t.startDate)];
    const ends = [projectEnd, ...tasks.map((t) => t.endDate)];
    const axisStart = starts.reduce((a, b) => (a < b ? a : b));
    const axisEnd = ends.reduce((a, b) => (a > b ? a : b));
    const totalDays = Math.max(1, daysBetween(axisStart, axisEnd));

    const critical = new Set(criticalPath(tasks));
    const conflicts = findScheduleConflicts(tasks);
    const conflictTaskIds = new Set(conflicts.map((c) => c.task.id));

    // Month ticks for the axis header.
    const months: { label: string; offsetPercent: number }[] = [];
    const cursor = new Date(axisStart);
    cursor.setDate(1);
    while (cursor <= new Date(axisEnd)) {
      const iso = cursor.toISOString().slice(0, 10);
      const offset = daysBetween(axisStart, iso);
      if (offset >= 0) {
        months.push({
          label: cursor.toLocaleDateString("en-GB", {
            month: "short",
            year: "2-digit",
          }),
          offsetPercent: (offset / totalDays) * 100,
        });
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return {
      axisStart,
      axisEnd,
      totalDays,
      critical,
      conflicts,
      conflictTaskIds,
      months,
      dayWidth: Math.min(
        MAX_DAY_WIDTH,
        Math.max(MIN_DAY_WIDTH, Math.round(900 / totalDays)),
      ),
    };
  }, [tasks, projectStart, projectEnd]);

  if (!model) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No tasks to chart
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Add tasks with start and end dates to see the timeline.
        </p>
      </div>
    );
  }

  const { axisStart, totalDays, critical, conflicts, conflictTaskIds, months } =
    model;
  const chartWidth = Math.max(640, totalDays * model.dayWidth);

  // Group by phase so a long list reads as a plan rather than a queue.
  const phases = [...new Set(tasks.map((t) => t.phase ?? "Tasks"))];

  function barGeometry(task: ProjectTask) {
    const offset = Math.max(0, daysBetween(axisStart, task.startDate));
    const duration = Math.max(1, daysBetween(task.startDate, task.endDate));
    return {
      left: `${(offset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  }

  return (
    <div className="space-y-3">
      {conflicts.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-foreground">
              {conflicts.length} scheduling conflict
              {conflicts.length === 1 ? "" : "s"}
            </p>
            {conflicts.map((c) => (
              <p
                key={`${c.task.id}-${c.blocker.id}`}
                className="text-[11px] text-muted-foreground"
              >
                <span className="text-foreground">{c.task.name}</span> starts{" "}
                {c.overlapDays} day{c.overlapDays === 1 ? "" : "s"} before{" "}
                <span className="text-foreground">{c.blocker.name}</span>{" "}
                finishes, but depends on it.
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-primary/60" />
          Task
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-rose-500/70" />
          Critical path
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-muted-foreground/30" />
          Blocked
        </span>
        <span className="flex items-center gap-1.5">
          <Diamond className="h-3 w-3 fill-amber-500 text-amber-500" />
          Milestone
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <div style={{ minWidth: chartWidth }}>
          {/* Axis */}
          <div className="relative h-7 border-b border-border/60 bg-muted/30">
            {months.map((m) => (
              <span
                key={m.label}
                className="absolute top-1.5 text-[10px] text-muted-foreground"
                style={{ left: `calc(${m.offsetPercent}% + 4px)` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {phases.map((phase) => (
            <div key={phase}>
              <div className="border-b border-border/40 bg-muted/20 px-3 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {phase}
                </span>
              </div>
              {tasks
                .filter((t) => (t.phase ?? "Tasks") === phase)
                .map((task) => {
                  const geometry = barGeometry(task);
                  const isCritical = critical.has(task.id);
                  const blocked = isTaskBlocked(task, tasks);
                  const conflicted = conflictTaskIds.has(task.id);

                  return (
                    <div
                      key={task.id}
                      className="relative flex h-9 items-center border-b border-border/30 last:border-0 hover:bg-muted/20"
                    >
                      <div
                        className={cn(
                          "absolute h-4 rounded-sm",
                          task.status === "completed"
                            ? "bg-emerald-500/70"
                            : blocked
                              ? "bg-muted-foreground/30"
                              : isCritical
                                ? "bg-rose-500/70"
                                : "bg-primary/60",
                          conflicted && "ring-2 ring-amber-500/70",
                        )}
                        style={geometry}
                        title={`${task.name} · ${task.startDate} → ${task.endDate} · ${task.percentComplete}%`}
                      >
                        {/* Progress fill inside the bar, so plan and actual
                            are readable in one glance. */}
                        {task.percentComplete > 0 &&
                          task.status !== "completed" && (
                            <div
                              className="h-full rounded-sm bg-foreground/25"
                              style={{ width: `${task.percentComplete}%` }}
                            />
                          )}
                      </div>
                      <span
                        className="absolute whitespace-nowrap text-[10px] text-foreground"
                        style={{
                          left: `calc(${geometry.left} + ${geometry.width} + 6px)`,
                        }}
                      >
                        {task.name}
                        {task.assigneeName && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {task.assigneeName}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
            </div>
          ))}

          {/* Milestones as a single lane under the bars. */}
          {milestones.length > 0 && (
            <div className="relative h-9 border-t border-border/60 bg-muted/20">
              {milestones.map((m) => {
                const offset = Math.max(0, daysBetween(axisStart, m.date));
                return (
                  <span
                    key={m.id}
                    className="absolute top-2 flex items-center gap-1"
                    style={{ left: `${(offset / totalDays) * 100}%` }}
                    title={`${m.name} · ${m.date}`}
                  >
                    <Diamond
                      className={cn(
                        "h-3 w-3",
                        m.reached
                          ? "fill-emerald-500 text-emerald-500"
                          : "fill-amber-500 text-amber-500",
                      )}
                    />
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                      {m.name}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {critical.size > 0 && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Flag className="h-3 w-3" />
          Critical path runs through {critical.size} task
          {critical.size === 1 ? "" : "s"} — a day lost on any of them is a day
          lost on the project.
        </p>
      )}
    </div>
  );
}
