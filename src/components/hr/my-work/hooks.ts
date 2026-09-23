"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCurrentUser } from "@/src/lib/auth/demo-identity";
import { isCurrentApprover, daysWaiting } from "@/src/components/hr/approvals/utils";
import type { ApprovalRequest } from "@/src/lib/types/approvals";
import type { RunTask, WorkflowRun } from "@/src/lib/types/workflow-runs";
import { effectiveStatus, daysOverdue } from "@/src/lib/types/workflow-runs";
import {
  selectMyRunTasks,
  selectMyReviewTasks,
  selectOthersRunTasks,
} from "@/src/lib/stores/workflow-runs-selectors";

const PRIORITY_RANK = { critical: 0, high: 1, normal: 2, low: 3 } as const;

export type WorkItem =
  | {
      kind: "approval";
      id: string;
      title: string;
      subtitle: string;
      request: ApprovalRequest;
      days: number;
      overdue: false;
      priorityRank: number;
      href: string;
    }
  | {
      kind: "task" | "review";
      id: string;
      title: string;
      subtitle: string;
      run: WorkflowRun;
      task: RunTask;
      days: number;
      overdue: boolean;
      priorityRank: number;
      href: string;
      owner: string;
    };

function fromRunTask(
  kind: "task" | "review",
  run: WorkflowRun,
  task: RunTask,
): WorkItem {
  const overdue = effectiveStatus(task) === "overdue";
  return {
    kind,
    id: task.id,
    title: task.title,
    subtitle: `${run.workflowTitle} · ${run.subject.name}`,
    run,
    task,
    days: overdue ? daysOverdue(task) : 0,
    overdue,
    priorityRank: PRIORITY_RANK[task.priority],
    href: run.subject.href,
    owner: task.assigneeName,
  };
}

export interface MyWork {
  todo: WorkItem[];
  review: WorkItem[];
  others: WorkItem[];
  employeeId: string | undefined;
}

/**
 * Everything one person owes, in one list.
 *
 * The only "assigned to me" surface in the HR portal was the approvals inbox,
 * which covered approval steps and nothing else - workflow tasks never
 * appeared anywhere, because no run was ever saved. This merges the two.
 */
export function useMyWork(): MyWork {
  const user = useCurrentUser();
  const employeeId = user?.employeeId;
  const roleId = user?.roleId;
  const requests = useAppSelector((s) => s.approvals.requests);
  const country = useAppSelector((s) => s.locale.country);
  const runs = useAppSelector((s) => s.workflowRuns.byCountry[country]);

  return useMemo(() => {
    const approvals: WorkItem[] = requests
      .filter((r) => isCurrentApprover(r, employeeId, roleId))
      .map((request) => ({
        kind: "approval" as const,
        id: request.id,
        title: request.steps[request.currentStepIndex]?.label ?? "Approval",
        subtitle: request.documentTitle,
        request,
        days: daysWaiting(request),
        overdue: false as const,
        priorityRank: 1,
        href: `/hr-action-center/submissions/${request.id}`,
      }));

    const mine = selectMyRunTasks(runs ?? [], employeeId).map(({ run, task }) =>
      fromRunTask("task", run, task),
    );
    const review = selectMyReviewTasks(runs ?? [], employeeId).map(
      ({ run, task }) => fromRunTask("review", run, task),
    );
    const others = selectOthersRunTasks(runs ?? [], employeeId).map(
      ({ run, task }) => fromRunTask("task", run, task),
    );

    // Overdue first, then the most urgent, then the longest waiting - the top
    // of the list should always be the thing to do next.
    const order = (a: WorkItem, b: WorkItem) =>
      Number(b.overdue) - Number(a.overdue) ||
      a.priorityRank - b.priorityRank ||
      b.days - a.days;

    return {
      todo: [...approvals, ...mine].sort(order),
      review: review.sort(order),
      others: others.sort(order),
      employeeId,
    };
  }, [requests, runs, employeeId, roleId]);
}
