"use client";

import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { countEligibleEmployees } from "@/src/lib/benefits/eligibility";
import {
  benefitPlanFromApi,
  benefitPlanToApi,
} from "@/src/lib/benefits/api-mapping";
import { replaceFromApi } from "@/src/lib/stores/benefit-plans-slice";
import {
  plansForCountry,
  type BenefitPlan,
  type NewBenefitPlan,
} from "@/src/lib/types/benefits";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  useCreateBenefitPlanMutation,
  useCreateCoverageLevelMutation,
  useDeleteBenefitPlanMutation,
  useDeleteCoverageLevelMutation,
  useDuplicateBenefitPlanMutation,
  useLazyGetBenefitPlanQuery,
  useGetBenefitPlansQuery,
  useGetBenefitPlansSummaryQuery,
  useGetCoverageLevelsQuery,
  useGetEmployeeBenefitsQuery,
  useSetBenefitPlanStatusMutation,
  useUpdateBenefitPlanMutation,
  useUpdateCoverageLevelMutation,
} from "@/src/store/services/benefit-plans";

// The catalogue is small; one page holds all of it.
const ALL_PLANS = { PageSize: 500 } as const;

/**
 * Keeps the benefit-plans slice in step with the API. The plans hub, the
 * coverage dialog and the employee profile all read the slice, so the
 * server's copy is laid into it rather than threaded through each screen.
 */
export function useBenefitPlansSync(): void {
  const dispatch = useAppDispatch();
  const skip = useAppSelector((s) => !s.session.is_loggedIn);
  const plans = useGetBenefitPlansQuery(ALL_PLANS, { skip });
  const levels = useGetCoverageLevelsQuery(undefined, { skip });
  useEffect(() => {
    const items = plans.data?.data?.plans.items;
    if (!items) return;
    dispatch(
      replaceFromApi({
        plans: items.map(benefitPlanFromApi),
        coverageOptions: levels.data?.data
          ? [...levels.data.data]
              .sort((a, b) => a.sequence - b.sequence)
              .map((l) => l.name)
          : undefined,
      }),
    );
  }, [plans.data, levels.data, dispatch]);
}

/** The catalogue for the active tenant country. */
export function useBenefitPlans(): BenefitPlan[] {
  useBenefitPlansSync();
  const plans = useAppSelector((s) => s.benefitPlans.plans);
  const country = useAppSelector((s) => s.locale.country);
  return useMemo(() => plansForCountry(plans, country), [plans, country]);
}

/** Company-wide reach of the catalogue, as the server works it out. */
export function useBenefitsSummary() {
  return useGetBenefitPlansSummaryQuery().data?.data ?? null;
}

/** Re-reads one plan so the edit form opens on the server's latest copy. */
export function useLoadBenefitPlan() {
  const [load] = useLazyGetBenefitPlanQuery();
  return useCallback(
    async (plan: BenefitPlan): Promise<BenefitPlan> => {
      const fresh = await load(plan.id)
        .unwrap()
        .catch(() => null);
      return fresh?.data ? benefitPlanFromApi(fresh.data) : plan;
    },
    [load],
  );
}

/** The plans one employee is entitled to, core and optional. */
export function useEmployeeBenefits(employeeId: string | undefined) {
  const { data, isLoading } = useGetEmployeeBenefitsQuery(employeeId ?? "", {
    skip: !employeeId,
  });
  const plans = useMemo(() => {
    const d = data?.data;
    if (!d) return null;
    return [...d.core, ...d.optional].map((b) => benefitPlanFromApi(b.plan));
  }, [data]);
  return { plans, loading: isLoading };
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

/** Each action resolves true once the server has accepted it. */
export function useBenefitPlanActions() {
  const country = useAppSelector((s) => s.locale.country);
  const [createPlan] = useCreateBenefitPlanMutation();
  const [updatePlan] = useUpdateBenefitPlanMutation();
  const [setPlanStatus] = useSetBenefitPlanStatusMutation();
  const [deletePlan] = useDeleteBenefitPlanMutation();
  const [duplicatePlan] = useDuplicateBenefitPlanMutation();

  const run = useCallback(
    async (call: () => Promise<unknown>, failure: string, success?: string) => {
      try {
        await call();
        if (success) toast.success(success);
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, failure));
        return false;
      }
    },
    [],
  );

  return {
    // A plan HR creates belongs to the tenant country it was created in.
    create: (data: NewBenefitPlan) =>
      run(
        () => createPlan(benefitPlanToApi(data, country)).unwrap(),
        "Could not create the benefit plan.",
      ),
    update: (id: string, data: NewBenefitPlan) =>
      run(
        () => updatePlan({ id, body: benefitPlanToApi(data, country) }).unwrap(),
        "Could not update the benefit plan.",
      ),
    setStatus: (id: string, status: BenefitPlan["status"]) =>
      run(
        () => setPlanStatus({ id, body: { status } }).unwrap(),
        "Could not change the plan status.",
      ),
    remove: (id: string) =>
      run(() => deletePlan(id).unwrap(), "Could not delete the benefit plan."),
    duplicate: (id: string) =>
      run(
        () => duplicatePlan(id).unwrap(),
        "Could not duplicate the benefit plan.",
      ),
  };
}

/** Coverage levels are their own records on the API, looked up here by name. */
export function useCoverageLevelActions() {
  const { data } = useGetCoverageLevelsQuery();
  const idByName = useMemo(
    () => new Map((data?.data ?? []).map((l) => [l.name, l.id] as const)),
    [data],
  );
  const [createLevel] = useCreateCoverageLevelMutation();
  const [updateLevel] = useUpdateCoverageLevelMutation();
  const [deleteLevel] = useDeleteCoverageLevelMutation();

  const guard = useCallback(async (call: () => Promise<unknown>, failure: string) => {
    try {
      await call();
    } catch (err) {
      toast.error(getApiErrorMessage(err, failure));
    }
  }, []);

  return {
    add: (name: string) =>
      guard(() => createLevel({ name: name.trim() }).unwrap(), "Could not add the coverage level."),
    rename: (from: string, to: string) => {
      const id = idByName.get(from);
      if (!id) return Promise.resolve();
      return guard(
        () => updateLevel({ id, body: { name: to.trim() } }).unwrap(),
        "Could not rename the coverage level.",
      );
    },
    remove: (name: string) => {
      const id = idByName.get(name);
      if (!id) return Promise.resolve();
      return guard(() => deleteLevel(id).unwrap(), "Could not remove the coverage level.");
    },
  };
}
