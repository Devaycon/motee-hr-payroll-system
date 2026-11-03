"use client";

import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_STYLES, type WorkflowTaskPriority } from "@/src/lib/types/workflows";
import {
  RISK_BASIS_LABELS,
  RISK_KIND_HINTS,
  RISK_KIND_LABELS,
  RISK_KIND_STYLES,
  RISK_STATUS_LABELS,
  RISK_STATUS_STYLES,
  type RiskBasis,
  type RiskKind,
  type RiskStatus,
} from "@/src/lib/types/workforce-risk";
import type { RiskEntry } from "@/src/lib/workforce-risk/register";

const pill = "shrink-0 px-1.5 py-0 text-[10px]";

export function KindBadge({ kind }: { kind: RiskKind }) {
  return (
    <Badge variant="outline" title={RISK_KIND_HINTS[kind]} className={cn(pill, RISK_KIND_STYLES[kind])}>
      {RISK_KIND_LABELS[kind]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: RiskStatus }) {
  return (
    <Badge variant="outline" className={cn(pill, RISK_STATUS_STYLES[status])}>
      {RISK_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: WorkflowTaskPriority }) {
  return (
    <Badge variant="outline" className={cn(pill, TASK_PRIORITY_STYLES[priority])}>
      {TASK_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

/** Forecasts are dashed so they never pass for findings at a glance. */
export function BasisBadge({ basis }: { basis: RiskBasis }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        pill,
        basis === "forecast"
          ? "border-dashed border-amber-500/50 text-amber-600 dark:text-amber-400"
          : "border-border text-muted-foreground",
      )}
    >
      {RISK_BASIS_LABELS[basis]}
    </Badge>
  );
}

export function riskHref(entry: RiskEntry): string {
  return `/organization/workforce-lens/risks/${encodeURIComponent(entry.risk.id)}`;
}

/** "Leeds · Engineering", whichever of the two the risk has. */
export function whereLabel(entry: RiskEntry): string {
  const a = entry.risk.affected;
  return [a.branchName, a.departmentName].filter(Boolean).join(" · ") || "Organisation";
}

/**
 * Apply the Workforce Lens's branch and department filters. Department only
 * narrows employee-level risks: a branch-wide risk belongs to no single
 * department, so it is hidden once a department is picked.
 */
export function matchesLensFilters(entry: RiskEntry, branch: string, department: string): boolean {
  const a = entry.risk.affected;
  if (branch !== "all" && a.branchId !== branch) return false;
  if (department !== "all") return a.scope === "employee" && a.departmentName === department;
  return true;
}
