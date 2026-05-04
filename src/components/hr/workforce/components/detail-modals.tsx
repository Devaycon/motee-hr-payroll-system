"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  GAP_STATUS_LABELS,
  GAP_STATUS_STYLES,
  RISK_LABELS,
  RISK_STYLES,
} from "@/src/components/hr/headcount/data";
import {
  SKILL_CATEGORY_LABELS,
  SKILL_CATEGORY_STYLES,
  GAP_SEVERITY_LABELS,
  GAP_SEVERITY_STYLES,
} from "../data";
import type {
  HeadcountPlan,
  AttritionRisk,
} from "@/src/components/hr/headcount/types";
import type { TurnoverRecord, HiringMetric, SkillsGap } from "../types";

interface RowProps {
  label: string;
  children: React.ReactNode;
}

function DetailRow({ label, children }: RowProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right">{children}</span>
    </div>
  );
}

export function HeadcountPlanDetailModal({
  plan,
  open,
  onClose,
}: {
  plan: HeadcountPlan | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!plan) return null;
  const fillPct =
    plan.target > 0
      ? Math.min(Math.round((plan.actual / plan.target) * 100), 100)
      : 0;
  const gap = plan.target - plan.actual;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{plan.department}</DialogTitle>
        </DialogHeader>
        <div className="mt-1">
          <DetailRow label="Period">{plan.period}</DetailRow>
          <DetailRow label="Target Headcount">{plan.target}</DetailRow>
          <DetailRow label="Actual Headcount">{plan.actual}</DetailRow>
          <DetailRow label="Fill Rate">
            <div className="flex items-center gap-2 justify-end">
              <Progress value={fillPct} className="h-1.5 w-24" />
              <span className="tabular-nums">{fillPct}%</span>
            </div>
          </DetailRow>
          <DetailRow label="Gap">
            <div className="flex items-center gap-1 justify-end">
              {gap > 0 ? (
                <TrendingDown className="size-3.5 text-red-500" />
              ) : gap < 0 ? (
                <TrendingUp className="size-3.5 text-blue-500" />
              ) : (
                <Minus className="size-3.5 text-emerald-500" />
              )}
              <span
                className={
                  gap > 0
                    ? "text-red-600 dark:text-red-400"
                    : gap < 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {gap > 0 ? `−${gap}` : gap < 0 ? `+${Math.abs(gap)}` : "0"}
              </span>
            </div>
          </DetailRow>
          <DetailRow label="Status">
            <Badge
              variant="outline"
              className={`text-xs ${GAP_STATUS_STYLES[plan.gapStatus]}`}
            >
              {GAP_STATUS_LABELS[plan.gapStatus]}
            </Badge>
          </DetailRow>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AttritionRiskDetailModal({
  risk,
  open,
  onClose,
}: {
  risk: AttritionRisk | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!risk) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {risk.initials}
            </div>
            <div>
              <DialogTitle className="text-base">
                {risk.employeeName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">{risk.jobTitle}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-1">
          <DetailRow label="Department">{risk.department}</DetailRow>
          <DetailRow label="Tenure">{risk.tenureYears} years</DetailRow>
          <DetailRow label="Risk Level">
            <Badge
              variant="outline"
              className={`text-xs ${RISK_STYLES[risk.riskLevel]}`}
            >
              {RISK_LABELS[risk.riskLevel]} Risk
            </Badge>
          </DetailRow>
          <div className="border-b border-border/60 py-2.5 last:border-0">
            <p className="text-xs text-muted-foreground mb-2">Risk Factors</p>
            <div className="flex flex-wrap gap-1.5">
              {risk.riskFactors.map((f) => (
                <span
                  key={f}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TurnoverDetailModal({
  record,
  open,
  onClose,
}: {
  record: TurnoverRecord | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!record) return null;
  const total = record.voluntary + record.involuntary;
  const rate =
    record.totalHeadcount > 0
      ? Math.round((total / record.totalHeadcount) * 100 * 10) / 10
      : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{record.department}</DialogTitle>
        </DialogHeader>
        <div className="mt-1">
          <DetailRow label="Period">{record.period}</DetailRow>
          <DetailRow label="Total Headcount">{record.totalHeadcount}</DetailRow>
          <DetailRow label="Voluntary Exits">
            <span className="text-amber-600 dark:text-amber-400">
              {record.voluntary}
            </span>
          </DetailRow>
          <DetailRow label="Involuntary Exits">
            <span className="text-red-600 dark:text-red-400">
              {record.involuntary}
            </span>
          </DetailRow>
          <DetailRow label="Total Exits">{total}</DetailRow>
          <DetailRow label="Turnover Rate">
            <Badge
              variant="outline"
              className={`text-xs ${
                rate === 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : rate > 20
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {rate}%
            </Badge>
          </DetailRow>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function HiringDetailModal({
  metric,
  open,
  onClose,
}: {
  metric: HiringMetric | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!metric) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{metric.department}</DialogTitle>
        </DialogHeader>
        <div className="mt-1">
          <DetailRow label="Open Requisitions">
            <span
              className={
                metric.openRequisitions > 2
                  ? "text-amber-600 dark:text-amber-400"
                  : ""
              }
            >
              {metric.openRequisitions}
            </span>
          </DetailRow>
          <DetailRow label="Avg Days to Fill">
            {metric.avgDaysToFill}d
          </DetailRow>
          <DetailRow label="Offers Extended">{metric.offersExtended}</DetailRow>
          <DetailRow label="Offers Accepted">{metric.offersAccepted}</DetailRow>
          <DetailRow label="Filled This Quarter">
            <span
              className={
                (metric.filledThisQuarter ?? 0) > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              }
            >
              {metric.filledThisQuarter ?? 0}
            </span>
          </DetailRow>
          <DetailRow label="Cost per Hire">
            ₦{((metric.costPerHire ?? 0) / 1000).toFixed(0)}k
          </DetailRow>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SkillsGapDetailModal({
  skill,
  open,
  onClose,
}: {
  skill: SkillsGap | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!skill) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{skill.skill}</DialogTitle>
        </DialogHeader>
        <div className="mt-1">
          <DetailRow label="Category">
            <Badge
              variant="outline"
              className={`text-xs ${SKILL_CATEGORY_STYLES[skill.category]}`}
            >
              {SKILL_CATEGORY_LABELS[skill.category]}
            </Badge>
          </DetailRow>
          <DetailRow label="Required Count">{skill.requiredCount}</DetailRow>
          <DetailRow label="Available Count">{skill.availableCount}</DetailRow>
          <DetailRow label="Gap Count">
            {skill.gapCount > 0 ? (
              <span className="text-red-600 dark:text-red-400">
                −{skill.gapCount}
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">0</span>
            )}
          </DetailRow>
          <DetailRow label="Coverage">
            <div className="flex items-center gap-2 justify-end">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    skill.coveragePct < 50
                      ? "bg-red-500"
                      : skill.coveragePct < 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${skill.coveragePct}%` }}
                />
              </div>
              <span className="tabular-nums">{skill.coveragePct}%</span>
            </div>
          </DetailRow>
          <DetailRow label="Status">
            <Badge
              variant="outline"
              className={`text-xs ${GAP_SEVERITY_STYLES[skill.severity]}`}
            >
              {GAP_SEVERITY_LABELS[skill.severity]}
            </Badge>
          </DetailRow>
        </div>
      </DialogContent>
    </Dialog>
  );
}
