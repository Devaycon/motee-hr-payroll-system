"use client";

import * as React from "react";
import Link from "next/link";
import { Gift } from "lucide-react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCan } from "@/src/lib/permissions/use-can";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  BENEFIT_CATEGORY_DOT,
  BENEFIT_CATEGORY_LABELS,
  BENEFIT_CATEGORY_OPTIONS,
  type BenefitPlan,
} from "@/src/lib/types/benefits";
import { eligiblePlansFor } from "@/src/lib/benefits/eligibility";
import type { ModuleProps } from "./modules";
import { Section, Empty } from "./ui";

/**
 * What an employee is entitled to, resolved from active benefit plans against
 * their employment type — HR manages the plans in the Benefits module
 * (`/organization/benefit-plans`); this view is read-only.
 */
export function BenefitsModule({ employee }: ModuleProps) {
  const plans = useAppSelector((s) => s.benefitPlans.plans);
  const employmentTypes = useAppSelector(
    (s) => s.locale.data?.employmentTypes ?? [],
  );
  const canManage = useCan("organization.benefit-plans", "edit");

  const eligible = React.useMemo(
    () => eligiblePlansFor(plans, employee, { employmentTypes }),
    [plans, employmentTypes, employee],
  );

  const grouped = React.useMemo(() => {
    const byCategory = new Map<string, BenefitPlan[]>();
    for (const p of eligible) {
      const list = byCategory.get(p.category) ?? [];
      list.push(p);
      byCategory.set(p.category, list);
    }
    return BENEFIT_CATEGORY_OPTIONS.filter((c) => byCategory.has(c)).map((c) => ({
      category: c,
      plans: byCategory.get(c)!,
    }));
  }, [eligible]);

  return (
    <Section
      title="Benefits"
      description="Benefits this employee is entitled to, based on their employment type."
      action={
        canManage ? (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
            <Link href="/organization/benefit-plans">
              <Gift className="h-3.5 w-3.5" /> Manage Benefit Plans
            </Link>
          </Button>
        ) : undefined
      }
    >
      {grouped.length === 0 ? (
        <Empty
          label="No active benefits for this employment type yet."
          description={
            canManage ? "Set up plans in Benefits to grant entitlements." : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {grouped.map(({ category, plans: categoryPlans }) => (
            <div key={category}>
              <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span className={cn("h-1.5 w-1.5 rounded-full", BENEFIT_CATEGORY_DOT[category])} />
                {BENEFIT_CATEGORY_LABELS[category]}
                <span className="font-normal normal-case tracking-normal">
                  · {categoryPlans.length}
                </span>
              </div>
              {categoryPlans.map((plan) => {
                const facts = [
                  plan.provider,
                  (plan.employerContributionPct != null || plan.employeeContributionPct != null) &&
                    `${plan.employeeContributionPct ?? 0}% you · ${plan.employerContributionPct ?? 0}% employer`,
                  plan.costNote,
                  plan.waitingPeriodDays != null && `${plan.waitingPeriodDays}-day waiting period`,
                ].filter(Boolean) as string[];
                return (
                  <div
                    key={plan.id}
                    className="flex items-start gap-3 border-b border-border/60 px-3 py-2.5 last:border-0"
                  >
                    <span
                      className={cn("mt-0.5 h-8 w-1 shrink-0 rounded-full", BENEFIT_CATEGORY_DOT[category])}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-foreground">{plan.name}</h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">{plan.description}</p>
                      {plan.coverageDetails && (
                        <p className="mt-1 text-[11px] italic text-muted-foreground">
                          {plan.coverageDetails}
                        </p>
                      )}
                      {facts.length > 0 && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {facts.join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
