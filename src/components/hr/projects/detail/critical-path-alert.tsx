"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type { CriticalPathAlert } from "@/src/lib/types/project-insights";

interface CriticalPathAlertBannerProps {
  alert: CriticalPathAlert | null;
  onViewTasks: () => void;
}

/**
 * §3 — moved from a plain-text caption buried in the Gantt tab to a
 * prominent, actionable block under the header, visible regardless of which
 * tab is active. Renders nothing when nothing on the critical path is
 * currently blocked — an alert with no blocker to report isn't an alert.
 */
export function CriticalPathAlertBanner({
  alert,
  onViewTasks,
}: CriticalPathAlertBannerProps) {
  if (!alert) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Critical Path Alert
        </p>
        <p className="text-xs text-muted-foreground">
          {alert.taskCount} task{alert.taskCount === 1 ? "" : "s"} currently on
          the critical path.
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Current blocker:</span>{" "}
          {alert.blockerTask.name}
        </p>
        {alert.impactMilestone && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              Potential impact:
            </span>{" "}
            {alert.impactMilestone.name} ({alert.impactMilestone.date})
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            Action required:
          </span>{" "}
          {alert.owner ?? "Unassigned"}
          {alert.dueDate && ` · Due ${alert.dueDate}`}
        </p>
      </div>
      <Button variant="outline" size="sm" className="shrink-0" onClick={onViewTasks}>
        View in Tasks
      </Button>
    </div>
  );
}
