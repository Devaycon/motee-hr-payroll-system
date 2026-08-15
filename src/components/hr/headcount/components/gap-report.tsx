"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  GAP_STATUS_LABELS,
  GAP_STATUS_STYLES,
  GAP_SEVERITY_LABELS,
  GAP_SEVERITY_STYLES,
  gapSeverity,
} from "../data";
import type { GapSeverity } from "../data";
import {
  RECRUITMENT_STAGE_LABELS,
  recommendedGapAction,
  type HeadcountPlan,
  type GapStatus,
} from "../types";

interface GapReportProps {
  plans: HeadcountPlan[];
  /** Set by the KPI cards; "all" shows every group (client feedback §6.1). */
  statusFilter: GapStatus | "all";
  onStatusFilterChange: (status: GapStatus | "all") => void;
}

export function GapReport({
  plans,
  statusFilter,
  onStatusFilterChange,
}: GapReportProps) {
  const router = useRouter();
  // §6.34 — filter the report down to a department or a severity band.
  const [deptFilter, setDeptFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState<GapSeverity | "all">(
    "all",
  );

  const departments = useMemo(
    () => Array.from(new Set(plans.map((p) => p.department))).sort(),
    [plans],
  );

  const visible = useMemo(
    () =>
      plans.filter((p) => {
        const matchDept = deptFilter === "all" || p.department === deptFilter;
        const matchSeverity =
          severityFilter === "all" ||
          gapSeverity(p.actual, p.target) === severityFilter;
        return matchDept && matchSeverity;
      }),
    [plans, deptFilter, severityFilter],
  );

  const groups: GapStatus[] =
    statusFilter === "all" ? ["under", "on_target", "over"] : [statusFilter];

  const filtersActive =
    statusFilter !== "all" || deptFilter !== "all" || severityFilter !== "all";

  /**
   * §6.36 — raise the workforce request straight from the gap it addresses,
   * with the department and shortfall already filled in. Previously the user
   * had to remember the numbers and re-enter them on another screen.
   */
  function handleCreateRequest(plan: HeadcountPlan) {
    const shortfall = Math.max(1, plan.target - plan.actual);
    const params = new URLSearchParams({
      department: plan.department,
      hires: String(shortfall),
      reason: `Headcount gap for ${plan.period}: ${plan.actual} of ${plan.target} filled`,
    });
    router.push(`/talent/workforce-requests?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All departments
            </SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d} className="text-xs">
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={severityFilter}
          onValueChange={(v) => setSeverityFilter(v as GapSeverity | "all")}
        >
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="All severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All severities
            </SelectItem>
            {(Object.keys(GAP_SEVERITY_LABELS) as GapSeverity[]).map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {GAP_SEVERITY_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => {
              setDeptFilter("all");
              setSeverityFilter("all");
              onStatusFilterChange("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          groups.length > 1 && "md:grid-cols-3",
        )}
      >
        {groups.map((status) => (
          <GapGroup
            key={status}
            plans={visible.filter((p) => p.gapStatus === status)}
            statusKey={status}
            onCreateRequest={handleCreateRequest}
          />
        ))}
      </div>
    </div>
  );
}

const EMPTY_TEXT: Record<GapStatus, string> = {
  under: "No departments under target",
  on_target: "No departments on target",
  over: "No departments over target",
};

interface GapGroupProps {
  plans: HeadcountPlan[];
  statusKey: GapStatus;
  onCreateRequest: (plan: HeadcountPlan) => void;
}

function GapGroup({ plans, statusKey, onCreateRequest }: GapGroupProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
              GAP_STATUS_STYLES[statusKey],
            )}
          >
            {GAP_STATUS_LABELS[statusKey]}
          </span>
          <span className="text-xs text-muted-foreground">
            {plans.length} dept{plans.length !== 1 ? "s" : ""}
          </span>
        </div>

        {plans.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {EMPTY_TEXT[statusKey]}
          </p>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => {
              const gap = plan.actual - plan.target;
              const severity = gapSeverity(plan.actual, plan.target);
              const action = recommendedGapAction(plan);
              const stage = plan.recruitmentStage ?? "not_started";
              return (
                <div
                  key={plan.id}
                  className="flex flex-col gap-2 py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground leading-none">
                        {plan.department}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan.actual} / {plan.target} headcount
                      </p>
                      {/* §6.7 — severity reads at a glance, unlike a bare number. */}
                      <span
                        className={cn(
                          "mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                          GAP_SEVERITY_STYLES[severity],
                        )}
                      >
                        {GAP_SEVERITY_LABELS[severity]}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold tabular-nums shrink-0",
                        gap > 0 && "text-blue-600 dark:text-blue-400",
                        gap < 0 && "text-red-600 dark:text-red-400",
                        gap === 0 && "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {gap > 0 ? `+${gap}` : gap === 0 ? "✓" : gap}
                    </span>
                  </div>

                  {/* §6.29 — is anyone actually recruiting for this gap? */}
                  {gap < 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      {RECRUITMENT_STAGE_LABELS[stage]}
                      {plan.expectedStartDate &&
                        ` · expected start ${plan.expectedStartDate}`}
                    </p>
                  )}

                  {/* §6.31 — what the gap is costing, for Finance. */}
                  {gap < 0 && plan.estimatedVacancyCost ? (
                    <p className="text-[10px] text-muted-foreground">
                      Est. monthly cost{" "}
                      {formatMoneyLocale(plan.estimatedVacancyCost)}
                    </p>
                  ) : null}

                  {/* §6.28 / §6.36 — say what to do, and let them do it here. */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium text-foreground">
                      {action}
                    </span>
                    {action === "Create Workforce Request" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 gap-1 text-[10px]"
                        onClick={() => onCreateRequest(plan)}
                      >
                        <Plus className="h-3 w-3" />
                        Create Request
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
