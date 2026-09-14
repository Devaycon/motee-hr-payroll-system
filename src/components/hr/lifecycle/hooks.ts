"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { isOpenOffboardingStatus } from "@/src/lib/types/offboarding";

export interface LifecycleMetric {
  count: number;
  label: string;
}

export type LifecycleMetrics = Record<string, LifecycleMetric | undefined>;

/**
 * Live, at-a-glance counts for each lifecycle stage, pulled from the same
 * slices each stage's own module already reads — this page doesn't own any
 * data, it just gives HR a single place to see "what needs attention where"
 * before clicking into the real workflow.
 */
export function useLifecycleMetrics(): LifecycleMetrics {
  const country = useAppSelector((s) => s.locale.country);
  const workforceRequests = useAppSelector(
    (s) => s.workforceRequests.byCountry[country],
  );
  const requisitions = useAppSelector((s) => s.requisitions.byCountry[country]);
  const recruitment = useAppSelector((s) => s.recruitment.byCountry[country]);
  const onboardingRecords = useAppSelector((s) => s.onboardingRecords.records);
  const offboardingRecords = useAppSelector((s) => s.offboarding.records);

  return useMemo(() => {
    const metrics: LifecycleMetrics = {};

    const openWorkforceRequests = (workforceRequests ?? []).filter(
      (r) => r.status !== "converted",
    ).length;
    if (openWorkforceRequests > 0) {
      metrics["workforce-planning"] = {
        count: openWorkforceRequests,
        label: `${openWorkforceRequests} in progress`,
      };
    }

    const activeRequisitions = (requisitions ?? []).filter(
      (r) => r.lifecycleStatus === "active",
    ).length;
    if (activeRequisitions > 0) {
      metrics["requisition"] = {
        count: activeRequisitions,
        label: `${activeRequisitions} active`,
      };
    }

    const openVacancies = (recruitment?.requisitions ?? []).filter(
      (r) => r.status === "open",
    ).length;
    if (openVacancies > 0) {
      metrics["attract"] = {
        count: openVacancies,
        label: `${openVacancies} open vacanc${openVacancies === 1 ? "y" : "ies"}`,
      };
    }

    const candidatesInPipeline = (recruitment?.candidates ?? []).filter(
      (c) => c.status === "active",
    ).length;
    if (candidatesInPipeline > 0) {
      metrics["select"] = {
        count: candidatesInPipeline,
        label: `${candidatesInPipeline} in pipeline`,
      };
    }

    const onboardingInProgress = onboardingRecords.filter(
      (r) => r.status === "in_progress" || r.status === "overdue",
    ).length;
    if (onboardingInProgress > 0) {
      metrics["onboard"] = {
        count: onboardingInProgress,
        label: `${onboardingInProgress} onboarding`,
      };
    }

    const activeOffboards = offboardingRecords.filter((r) =>
      isOpenOffboardingStatus(r.status),
    ).length;
    if (activeOffboards > 0) {
      metrics["offboard"] = {
        count: activeOffboards,
        label: `${activeOffboards} leaving`,
      };
    }

    return metrics;
  }, [workforceRequests, requisitions, recruitment, onboardingRecords, offboardingRecords]);
}
