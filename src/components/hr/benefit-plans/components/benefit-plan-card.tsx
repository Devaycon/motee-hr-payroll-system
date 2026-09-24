"use client";

import { Pencil, Copy, Archive, ArchiveRestore, Trash2, Users, Lock } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { EMPLOYMENT_TYPE_LABELS } from "@/src/lib/constants/employment-types";
import {
  BENEFIT_CATEGORY_DOT,
  BENEFIT_PLAN_STATUS_LABELS,
  BENEFIT_PLAN_STATUS_STYLES,
  type BenefitPlan,
} from "../types";
import { useEligibleEmployeeCount } from "../hooks";

function scopeSummary(plan: BenefitPlan): { text: string; title?: string } {
  if (plan.scope.kind === "all") return { text: "All employees" };
  const labels = plan.scope.types.map((t) => EMPLOYMENT_TYPE_LABELS[t]);
  return {
    text: `${labels.length} type${labels.length === 1 ? "" : "s"}`,
    title: labels.join(", "),
  };
}

function factsSummary(plan: BenefitPlan): string {
  const parts: string[] = [];
  if (plan.provider) parts.push(plan.provider);
  if (plan.employerContributionPct != null || plan.employeeContributionPct != null) {
    parts.push(
      `${plan.employeeContributionPct ?? 0}%/${plan.employerContributionPct ?? 0}% split`,
    );
  }
  if (plan.costNote) parts.push(plan.costNote);
  if (plan.coverageDetails) parts.push(plan.coverageDetails);
  return parts.join(" · ");
}

interface BenefitPlanRowProps {
  plan: BenefitPlan;
  canManage: boolean;
  onEdit: (plan: BenefitPlan) => void;
  onDuplicate: (plan: BenefitPlan) => void;
  onToggleStatus: (plan: BenefitPlan) => void;
  onDelete: (plan: BenefitPlan) => void;
}

/**
 * One dense row in the benefit-plans list — an accent bar carries the category
 * colour instead of a badge, and everything else sits on one or two lines so
 * the list reads as a compact table rather than a stack of padded cards.
 */
export function BenefitPlanRow({
  plan,
  canManage,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
}: BenefitPlanRowProps) {
  const eligibleCount = useEligibleEmployeeCount(plan);
  const scope = scopeSummary(plan);
  const facts = factsSummary(plan);

  return (
    <div className="group flex items-stretch gap-3 border-b border-border/60 px-3 py-2.5 last:border-0 hover:bg-muted/40">
      <span
        className={cn("w-1 shrink-0 rounded-full", BENEFIT_CATEGORY_DOT[plan.category])}
        aria-hidden
      />

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium text-foreground">{plan.name}</span>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium leading-4",
              BENEFIT_PLAN_STATUS_STYLES[plan.status],
            )}
          >
            {BENEFIT_PLAN_STATUS_LABELS[plan.status]}
          </span>
          {plan.enrollment === "optional" && (
            <span
              className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-1.5 py-0 text-[10px] font-medium leading-4 text-sky-600"
              title="Employees opt in to this benefit"
            >
              Optional
            </span>
          )}
          {plan.kind === "system" && (
            <Lock
              className="h-3 w-3 text-muted-foreground/60"
              aria-label="System plan"
            />
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {facts || plan.description}
        </p>
      </div>

      <div
        className="hidden w-24 shrink-0 self-center text-right text-[11px] text-muted-foreground sm:block"
        title={scope.title}
      >
        {scope.text}
      </div>

      <div className="flex w-16 shrink-0 items-center justify-end gap-1 self-center text-[11px] text-muted-foreground">
        <Users className="h-3 w-3" />
        {eligibleCount}
      </div>

      {canManage && (
        <div className="flex shrink-0 items-center gap-0.5 self-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Edit"
            onClick={() => onEdit(plan)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Duplicate"
            onClick={() => onDuplicate(plan)}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title={plan.status === "archived" ? "Activate" : "Archive"}
            onClick={() => onToggleStatus(plan)}
          >
            {plan.status === "archived" ? (
              <ArchiveRestore className="h-3 w-3" />
            ) : (
              <Archive className="h-3 w-3" />
            )}
          </Button>
          {plan.kind !== "system" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              title="Delete"
              onClick={() => onDelete(plan)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
