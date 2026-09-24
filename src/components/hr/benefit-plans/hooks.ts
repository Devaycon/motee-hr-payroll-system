"use client";

import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { countEligibleEmployees } from "@/src/lib/benefits/eligibility";
import {
  createPlan,
  updatePlan,
  setPlanStatus,
  deletePlan,
  duplicatePlan,
} from "@/src/lib/stores/benefit-plans-slice";
import {
  plansForCountry,
  type BenefitPlan,
  type NewBenefitPlan,
} from "@/src/lib/types/benefits";

/** The catalogue for the active tenant country. */
export function useBenefitPlans(): BenefitPlan[] {
  const plans = useAppSelector((s) => s.benefitPlans.plans);
  const country = useAppSelector((s) => s.locale.country);
  return useMemo(() => plansForCountry(plans, country), [plans, country]);
}

export function useActorName(): string {
  return useAppSelector((s) => s.auth.user?.name) ?? "HR Admin";
}

/** Employees + employment-type lookup for the active branch scope. */
export function useBenefitsEmployeeContext() {
  const { data } = useLocaleSection((bundle) => ({
    employees: bundle.employees,
    employmentTypes: bundle.employmentTypes,
  }));
  return data;
}

/** How many employees a plan currently covers, for the hub's stat/badges. */
export function useEligibleEmployeeCount(plan: BenefitPlan): number {
  const ctx = useBenefitsEmployeeContext();
  return useMemo(() => {
    if (!ctx) return 0;
    return countEligibleEmployees(plan, ctx.employees, ctx);
  }, [ctx, plan]);
}

export function useBenefitPlanActions() {
  const dispatch = useAppDispatch();
  const actorName = useActorName();
  const country = useAppSelector((s) => s.locale.country);
  return {
    // A plan HR creates belongs to the tenant country it was created in.
    create: (data: NewBenefitPlan) =>
      dispatch(createPlan({ ...data, country: data.country ?? country, actorName })),
    update: (id: string, data: NewBenefitPlan) =>
      dispatch(updatePlan({ id, actorName, ...data })),
    setStatus: (id: string, status: BenefitPlan["status"]) =>
      dispatch(setPlanStatus({ id, status })),
    remove: (id: string) => dispatch(deletePlan(id)),
    duplicate: (id: string) => dispatch(duplicatePlan({ id, actorName })),
  };
}
