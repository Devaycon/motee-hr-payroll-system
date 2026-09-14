"use client";

import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { PROJECT_PRIORITY_LABELS } from "@/src/lib/types/projects";
import type { NextAction, NextActionBucket } from "@/src/lib/types/project-insights";

const BUCKETS: { key: NextActionBucket; label: string }[] = [
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Today" },
  { key: "this_week", label: "This week" },
];

/**
 * §6 — what the viewer needs to *do*, not just what the project *contains*.
 * Purely derived from existing tasks/milestones (owner, due date, priority,
 * status already live on those records) rather than a new manually-authored
 * list — editing happens back in the Tasks/Milestones tabs.
 */
export function NextActionsPanel({ actions }: { actions: NextAction[] }) {
  const groups = BUCKETS.map((b) => ({
    ...b,
    items: actions.filter((a) => a.bucket === b.key),
  })).filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
      <p className="text-sm font-semibold text-foreground">Next Actions</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {groups.map((group) => (
          <div key={group.key} className="space-y-1.5">
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wide",
                group.key === "overdue"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground",
              )}
            >
              {group.label}
            </p>
            <ul className="space-y-1.5">
              {group.items.map((action) => (
                <li key={`${action.kind}-${action.id}`} className="text-xs">
                  <p className="font-medium text-foreground">{action.label}</p>
                  <p className="flex flex-wrap items-center gap-1 text-muted-foreground">
                    {action.owner ?? "Unassigned"} · Due {action.dueDate}
                    {action.priority && (
                      <Badge variant="outline" className="text-[9px]">
                        {PROJECT_PRIORITY_LABELS[action.priority]}
                      </Badge>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
