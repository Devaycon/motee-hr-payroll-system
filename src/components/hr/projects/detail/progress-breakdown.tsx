"use client";

import {
  criticalPathProgress,
  projectProgress,
  type Project,
} from "@/src/lib/types/projects";

/**
 * §4 — "2 of 6 tasks done" next to "49%" reads as a contradiction unless the
 * weighting is spelled out. Shows the breakdown instead of just the headline
 * number.
 */
export function ProgressBreakdownStrip({ project }: { project: Project }) {
  const completed = project.tasks.filter((t) => t.status === "completed").length;
  const total = project.tasks.length;
  const milestonesCompleted = project.milestones.filter((m) => m.reached).length;

  const items = [
    {
      label: "Tasks completed",
      value: `${completed}/${total} (${total ? Math.round((completed / total) * 100) : 0}%)`,
    },
    {
      label: "Weighted task progress",
      value: `${projectProgress(project)}%`,
    },
    {
      label: "Milestones completed",
      value: `${milestonesCompleted}/${project.milestones.length}`,
    },
    {
      label: "Critical-path progress",
      value: `${criticalPathProgress(project)}%`,
    },
  ];

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-xl border border-border/60 bg-card px-4 py-3 text-xs">
      {items.map((item) => (
        <p key={item.label} className="text-muted-foreground">
          {item.label}:{" "}
          <span className="font-medium text-foreground">{item.value}</span>
        </p>
      ))}
    </div>
  );
}
