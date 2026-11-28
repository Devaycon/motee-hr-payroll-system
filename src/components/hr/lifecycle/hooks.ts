"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { isOpenOffboardingStatus } from "@/src/lib/types/offboarding";
import { isRecruitingVacancy } from "@/src/lib/types/recruitment";
import { useIsLive } from "@/src/lib/live/use-is-live";
import { useGetLifecycleDashboardQuery } from "@/src/store/services/dashboard";
import type { LifecycleStageDto } from "@/src/types/dashboard";

/**
 * The server's stage keys (not listed in the spec) onto the page's stages,
 * compared with case, spaces, dashes and underscores removed. Keys with no
 * stage on the page (e.g. people who left this period) are not shown.
 */
const STAGE_ALIASES: Record<string, string> = {
  workforceplanning: "workforce-planning",
  workforcerequests: "workforce-planning",
  workforce: "workforce-planning",
  requisition: "requisition",
  requisitions: "requisition",
  openrequisitions: "requisition",
  attract: "attract",
  vacancies: "attract",
  openvacancies: "attract",
  select: "select",
  selection: "select",
  candidates: "select",
  preemployment: "pre-employment",
  preboarding: "pre-employment",
  onboard: "onboard",
  onboarding: "onboard",
  developperformretain: "develop-perform-retain",
  active: "develop-perform-retain",
  employed: "develop-perform-retain",
  offboard: "offboard",
  offboarding: "offboard",
};

const STAGE_LABELS: Record<string, (n: number) => string> = {
  "workforce-planning": (n) => `${n} activities in progress`,
  requisition: (n) => `${n} active`,
  attract: (n) => `${n} open vacanc${n === 1 ? "y" : "ies"}`,
  select: (n) => `${n} candidates in selection`,
  "pre-employment": (n) => `${n} in checks`,
  onboard: (n) => `${n} new starter${n === 1 ? "" : "s"} onboarding`,
  "develop-perform-retain": (n) => `${n} active employee${n === 1 ? "" : "s"}`,
  offboard: (n) => `${n} leaving`,
};

function metricsFromApi(stages: LifecycleStageDto[]): LifecycleMetrics {
  const metrics: LifecycleMetrics = {};
  for (const s of stages) {
    const id = STAGE_ALIASES[s.key.toLowerCase().replace(/[^a-z]/g, "")];
    if (!id || s.count <= 0) continue;
    const count = (metrics[id]?.count ?? 0) + s.count;
    metrics[id] = { count, label: STAGE_LABELS[id](count) };
  }
  return metrics;
}

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
  // Signed in: one summary call (GET /dashboard/lifecycle) instead of the slices.
  const live = useIsLive();
  const server = useGetLifecycleDashboardQuery(undefined, { skip: !live });
  const country = useAppSelector((s) => s.locale.country);
  const workforceRequests = useAppSelector(
    (s) => s.workforceRequests.byCountry[country],
  );
  const requisitions = useAppSelector((s) => s.requisitions.byCountry[country]);
  const recruitment = useAppSelector((s) => s.recruitment.byCountry[country]);
  const onboardingRecords = useAppSelector((s) => s.onboardingRecords.records);
  const offboardingRecords = useAppSelector((s) => s.offboarding.records);

  return useMemo(() => {
    if (live) return server.data?.data ? metricsFromApi(server.data.data.stages) : {};
    const metrics: LifecycleMetrics = {};

    const openWorkforceRequests = (workforceRequests ?? []).filter(
      (r) => r.status !== "converted",
    ).length;
    if (openWorkforceRequests > 0) {
      metrics["workforce-planning"] = {
        count: openWorkforceRequests,
        label: `${openWorkforceRequests} activities in progress`,
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

    const openVacancies = (recruitment?.requisitions ?? []).filter((r) =>
      isRecruitingVacancy(r.status),
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
        label: `${candidatesInPipeline} candidates in selection`,
      };
    }

    // Stage 5 had no data source at all, so its card always rendered blank.
    // Pre-employment is everyone between "we want them" and "they have
    // started": hires still awaiting an onboarding invite, plus those invited
    // but not yet at their start date.
    const awaitingInvite = (recruitment?.candidates ?? []).filter(
      (c) =>
        c.status === "active" &&
        (c.stage === "offer" || c.stage === "hired") &&
        !c.onboardingInvitedAt,
    ).length;
    const inPreBoarding = onboardingRecords.filter(
      (r) => r.stage === "pre_boarding",
    ).length;
    const preEmployment = awaitingInvite + inPreBoarding;
    if (preEmployment > 0) {
      metrics["pre-employment"] = {
        count: preEmployment,
        label:
          awaitingInvite > 0
            ? `${preEmployment} in checks · ${awaitingInvite} awaiting invite`
            : `${preEmployment} in checks`,
      };
    }

    const onboardingInProgress = onboardingRecords.filter(
      (r) => r.status === "in_progress" || r.status === "overdue",
    ).length;
    if (onboardingInProgress > 0) {
      metrics["onboard"] = {
        count: onboardingInProgress,
        label: `${onboardingInProgress} new starter${onboardingInProgress === 1 ? "" : "s"} onboarding`,
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
  }, [live, server.data, workforceRequests, requisitions, recruitment, onboardingRecords, offboardingRecords]);
}
