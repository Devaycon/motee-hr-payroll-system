"use client";

import { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/src/components/ui/checkbox";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updateGoLiveItem } from "@/src/lib/stores/projects-slice";
import { cn } from "@/src/lib/utils";
import type { Project } from "@/src/lib/types/projects";
import {
  GO_LIVE_CATEGORY_LABELS,
  goLiveReadiness,
  type GoLiveCategory,
} from "@/src/lib/types/go-live-readiness";

/** §14 — a fixed five-category checklist rolling up to one readiness score. */
export function GoLivePanel({ project }: { project: Project }) {
  const dispatch = useAppDispatch();
  const checklist = useAppSelector((s) =>
    s.projects.goLiveChecklists.find((c) => c.projectId === project.id),
  );

  const readiness = useMemo(
    () => (checklist ? goLiveReadiness(checklist) : null),
    [checklist],
  );

  if (!checklist || !readiness) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No go-live checklist for this project
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4">
        <CheckCircle2
          className={cn(
            "h-8 w-8",
            readiness.overallPercent >= 90
              ? "text-emerald-500"
              : readiness.overallPercent >= 60
                ? "text-amber-500"
                : "text-rose-500",
          )}
        />
        <div>
          <p className="text-2xl font-semibold text-foreground">
            Go-live readiness: {readiness.overallPercent}%
          </p>
          <p className="text-xs text-muted-foreground">
            {checklist.items.filter((i) => i.done).length} of{" "}
            {checklist.items.length} checks complete
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(GO_LIVE_CATEGORY_LABELS) as GoLiveCategory[]).map(
          (category) => {
            const summary = readiness.byCategory[category];
            const items = checklist.items.filter(
              (i) => i.category === category,
            );
            return (
              <div
                key={category}
                className="space-y-2 rounded-xl border border-border/60 bg-card p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {GO_LIVE_CATEGORY_LABELS[category]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {summary.done}/{summary.total} · {summary.percent}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      summary.percent >= 90
                        ? "bg-emerald-500"
                        : summary.percent >= 60
                          ? "bg-amber-500"
                          : "bg-rose-500",
                    )}
                    style={{ width: `${summary.percent}%` }}
                  />
                </div>
                <ul className="space-y-1.5 pt-1">
                  {items.map((item) => (
                    <li key={item.id}>
                      <label className="flex items-start gap-2 text-xs text-foreground">
                        <Checkbox
                          className="mt-0.5"
                          checked={item.done}
                          onCheckedChange={(v) =>
                            dispatch(
                              updateGoLiveItem({
                                projectId: project.id,
                                itemId: item.id,
                                patch: { done: Boolean(v) },
                              }),
                            )
                          }
                        />
                        <span className={cn(item.done && "text-muted-foreground line-through")}>
                          {item.label}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
