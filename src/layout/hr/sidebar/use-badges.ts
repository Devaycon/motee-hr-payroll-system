"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCurrentUser } from "@/src/lib/auth/demo-identity";
import { isCurrentApprover } from "@/src/components/hr/approvals/utils";
import { selectCountsForUser } from "@/src/lib/stores/workflow-runs-selectors";
import { isRunTaskOpen } from "@/src/lib/types/workflow-runs";

/**
 * Live counts for the sidebar, keyed by route link.
 *
 * The badges were hardcoded integers - a permanent "54" beside HR Action
 * Centre, "10" beside Recruitment - that corresponded to nothing and never
 * changed. A number that is always wrong is worse than no number, because it
 * teaches people to ignore every badge in the product.
 */
export function useSidebarBadges(): Record<string, number> {
  const user = useCurrentUser();
  const employeeId = user?.employeeId;
  const roleId = user?.roleId;
  const country = useAppSelector((s) => s.locale.country);
  const runs = useAppSelector((s) => s.workflowRuns.byCountry[country]);
  const requests = useAppSelector((s) => s.approvals.requests);

  return useMemo(() => {
    const list = runs ?? [];
    const counts = selectCountsForUser(list, employeeId);
    const pendingApprovals = requests.filter((r) =>
      isCurrentApprover(r, employeeId, roleId),
    ).length;

    const myOpenTasksOn = (kind: string) =>
      list.filter(
        (run) =>
          run.status === "active" &&
          run.subject.kind === kind &&
          run.tasks.some(
            (t) => t.assigneeEmployeeId === employeeId && isRunTaskOpen(t),
          ),
      ).length;

    return {
      "/hr-action-center": counts.todo + counts.review + pendingApprovals,
      "/hr-action-center/tasks": counts.todo + counts.review,
      "/hr-action-center/submissions": pendingApprovals,
      "/talent/recruitment": myOpenTasksOn("requisition"),
      "/talent/onboarding": myOpenTasksOn("onboarding_record"),
    };
  }, [runs, requests, employeeId, roleId]);
}
