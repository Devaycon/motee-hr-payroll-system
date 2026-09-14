"use client";

import { cn } from "@/src/lib/utils";
import type { HealthStatus, ProjectHealth } from "@/src/lib/types/project-insights";

const DOT_STYLES: Record<HealthStatus, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
  unknown: "bg-muted-foreground/40",
};

const LABEL_STYLES: Record<HealthStatus, string> = {
  green: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-rose-600 dark:text-rose-400",
  unknown: "text-muted-foreground",
};

const AREAS: { key: keyof ProjectHealth; label: string }[] = [
  { key: "overall", label: "Overall" },
  { key: "schedule", label: "Schedule" },
  { key: "budget", label: "Budget" },
  { key: "resources", label: "Resources" },
  { key: "criticalPath", label: "Critical Path" },
  { key: "scope", label: "Scope" },
];

/**
 * §1 — a top-level health rollup, separate from the % progress figure. Each
 * area gets its own status rather than one blended number. Scope is always
 * "unknown" ("Not tracked") until Change Requests exist to measure scope
 * creep against — that's out of scope for this pass (client's own P6).
 */
export function ProjectHealthPanel({ health }: { health: ProjectHealth }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/60 bg-card p-3">
      {AREAS.map(({ key, label }) => {
        const status = health[key];
        return (
          <div key={key} className="flex items-center gap-1.5" title={
            status === "unknown"
              ? "Not tracked — tracked once Change Requests are scoped."
              : undefined
          }>
            <span className={cn("h-2 w-2 rounded-full", DOT_STYLES[status])} />
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className={cn("text-xs font-medium", LABEL_STYLES[status])}>
              {status === "unknown"
                ? "Not tracked"
                : status === "green"
                  ? "On Track"
                  : status === "amber"
                    ? "At Risk"
                    : "Blocked"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
