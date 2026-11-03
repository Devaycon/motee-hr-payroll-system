"use client";

import { useCallback, useMemo } from "react";
import { addDays, format } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useLocaleSection, useUnscopedLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { usePerformanceInput } from "@/src/components/hr/branches/performance/use-performance";
import { useCan } from "@/src/lib/permissions/use-can";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { RunTask, WorkflowRun } from "@/src/lib/types/workflow-runs";
import { riskRunId, type RiskOutcome } from "@/src/lib/types/workforce-risk";
import { DEFAULT_RISK_SETTINGS, detectRisks, type RiskBradford, type RiskPerson } from "@/src/lib/workforce-risk/rules";
import { buildRegister, leadTask, riskReport, type RiskEntry } from "@/src/lib/workforce-risk/register";
import {
  acknowledgeRisk,
  approveRecommendation,
  attachActionPlan,
  closeRisk,
  dismissRisk,
  editRecommendation,
  logRiskEvent,
  reopenRisk,
} from "@/src/lib/stores/workforce-risk-slice";
import { startRun } from "@/src/lib/stores/workflow-runs-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import { runStarted, runTaskAssigned } from "@/src/lib/notifications/workflow-runs";

export const RISK_MODULE = "organization.workforce-risk";

/**
 * The risk register for the signed-in tenant: today's detections merged with
 * HR's records and the action-plan runs.
 *
 * Detection runs on the whole tenant (a branch's sickness rate needs every
 * person in the branch), but what is *shown* follows the viewer's data scope:
 * an employee-level risk only appears to someone who can see that employee,
 * and a branch-level one only to someone who can see the branch.
 */
export function useRiskRegister() {
  const { data: bundle, loading: bundleLoading } = useUnscopedLocaleSection<LocaleBundle>((b) => b);
  const { data: scoped } = useLocaleSection<LocaleBundle>((b) => b);
  const { input, loading: perfLoading, visibleBranchIds, settings: perfSettings } = usePerformanceInput();
  const tenantId = bundle?.tenant.id ?? "";
  const snapshots = useAppSelector((s) => s.sickness.snapshots);
  const records = useAppSelector((s) => s.workforceRisk.records);
  const tenantSettings = useAppSelector((s) => s.workforceRisk.settings[tenantId]);
  const country = useAppSelector((s) => s.locale.country);
  const runs = useAppSelector((s) => s.workflowRuns.byCountry[country]);

  const settings = tenantSettings ?? DEFAULT_RISK_SETTINGS;

  const detected = useMemo(() => {
    if (!bundle || !input) return [];
    const departments = new Map((bundle.departments ?? []).map((d) => [d.id, d.name]));
    const people: RiskPerson[] = bundle.employees.map((e) => ({
      id: e.id,
      fullName: e.fullName,
      branchId: e.branchId,
      departmentName: e.departmentName || departments.get(e.departmentId),
      status: e.status,
      probationStatus: (e as { probationStatus?: string }).probationStatus,
      probationEndDate: (e as { probationEndDate?: string }).probationEndDate,
    }));
    // Latest Bradford snapshot per employee.
    const latest = new Map<string, RiskBradford & { at: string }>();
    for (const s of snapshots) {
      if (s.tenantId !== tenantId) continue;
      const prev = latest.get(s.employeeId);
      if (!prev || s.computedAt > prev.at) {
        latest.set(s.employeeId, { employeeId: s.employeeId, score: s.score, action: s.action, episodes: s.episodes, days: s.days, at: s.computedAt });
      }
    }
    return detectRisks({
      perf: input,
      people,
      bradford: [...latest.values()],
      targets: perfSettings.targets,
      settings,
      country,
    });
  }, [bundle, input, snapshots, tenantId, perfSettings.targets, settings, country]);

  const entries = useMemo(() => {
    const all = buildRegister(detected, Object.values(records), runs ?? [], tenantId);
    const visibleEmployees = new Set((scoped?.employees ?? []).map((e) => e.id));
    const visibleBranches = new Set(visibleBranchIds);
    return all.filter((e) =>
      e.risk.affected.scope === "employee"
        ? e.risk.affected.ids.some((id) => visibleEmployees.has(id))
        : e.risk.affected.scope === "branch"
          ? e.risk.affected.ids.some((id) => visibleBranches.has(id))
          : true,
    );
  }, [detected, records, runs, tenantId, scoped, visibleBranchIds]);

  const report = useMemo(() => riskReport(entries), [entries]);

  return {
    loading: (bundleLoading || perfLoading) && entries.length === 0,
    entries,
    report,
    tenantId,
    country,
    asOf: input?.asOf,
    employees: bundle?.employees ?? [],
    branches: input?.branches ?? [],
  };
}

export function useRiskEntry(id: string) {
  const register = useRiskRegister();
  const entry = register.entries.find((e) => e.risk.id === id);
  return { ...register, entry };
}

export interface ActionPlanDraft {
  recommendation: string;
  ownerId: string;
  collaboratorIds: string[];
  verifierId: string;
  dueDate: string;
  escalateAfterDays: number;
}

/** Due date a new plan starts with, from the rule's suggestion. */
export function defaultDueDate(entry: RiskEntry): string {
  return format(addDays(new Date(), entry.risk.suggestedDueDays), "yyyy-MM-dd");
}

/**
 * Every write to a risk, with permissions applied. `edit` covers working a
 * risk; `approve` covers approving the recommendation and closing it, because
 * closure is the "authorised verification" step the client asked for.
 */
export function useRiskActions(entry: RiskEntry | undefined, tenantId: string, country: string) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const by = user?.name ?? "HR";
  const canWork = useCan(RISK_MODULE, "edit");
  const canApprove = useCan(RISK_MODULE, "approve");

  const ref = useMemo(() => (entry ? { tenantId, risk: entry.risk, by } : null), [entry, tenantId, by]);

  const acknowledge = useCallback(() => ref && dispatch(acknowledgeRisk(ref)), [dispatch, ref]);

  const createPlan = useCallback(
    (draft: ActionPlanDraft) => {
      if (!entry || !ref) return;
      const name = (id: string) => employees.find((e) => e.id === id)?.fullName ?? "Unassigned";
      const attempt = (entry.record?.pastRunIds.length ?? 0) + 1;
      const runId = riskRunId(entry.key, attempt);
      const text = draft.recommendation.trim() || entry.recommendation;
      if (text !== entry.recommendation) dispatch(editRecommendation({ ...ref, text }));

      const base = {
        assigneeEmployeeId: null,
        reviewer: null,
        reviewerEmployeeId: null,
        reviewerName: null,
        dueDate: draft.dueDate,
        dependsOn: [],
        status: "not_started" as const,
      };
      const tasks: RunTask[] = [
        {
          ...base,
          id: `${runId}::lead`,
          templateTaskId: "lead",
          order: 0,
          title: `Act on: ${entry.risk.title}`,
          description: text,
          priority: entry.risk.priority,
          assignee: { kind: "employee", employeeId: draft.ownerId },
          assigneeEmployeeId: draft.ownerId,
          assigneeName: name(draft.ownerId),
          // Verification: the owner submits, and the verifier signs it off.
          reviewer: { kind: "role", roleId: "ROLE-HRADMIN" },
          reviewerEmployeeId: draft.verifierId,
          reviewerName: name(draft.verifierId),
          escalateAfterDays: draft.escalateAfterDays,
        },
        ...draft.collaboratorIds
          .filter((id) => id !== draft.ownerId)
          .map((id, i): RunTask => ({
            ...base,
            id: `${runId}::support-${i}`,
            templateTaskId: `support-${i}`,
            order: i + 1,
            title: `Support: ${entry.risk.title}`,
            description: `Help ${name(draft.ownerId)} with: ${text}`,
            priority: "normal",
            assignee: { kind: "employee", employeeId: id },
            assigneeEmployeeId: id,
            assigneeName: name(id),
            parallelGroup: "support",
          })),
      ];

      const run: WorkflowRun = {
        id: runId,
        workflowId: "WF-WORKFORCE-RISK",
        workflowTitle: "Workforce risk action plan",
        workflowVersion: 1,
        trigger: "manual",
        subject: {
          kind: "workforce_risk",
          id: entry.risk.id,
          name: `${entry.risk.title} · ${entry.risk.affected.label}`,
          href: `/organization/workforce-lens/risks/${encodeURIComponent(entry.risk.id)}`,
        },
        anchorDate: format(new Date(), "yyyy-MM-dd"),
        context: {},
        status: "active",
        startedAt: new Date().toISOString(),
        startedBy: by,
        tasks,
      };

      dispatch(startRun({ country, run }));
      dispatch(
        attachActionPlan({
          ...ref,
          runId,
          country,
          summary: `Owner ${name(draft.ownerId)}, verifier ${name(draft.verifierId)}, due ${draft.dueDate}${
            tasks.length > 1 ? `, ${tasks.length - 1} collaborator(s)` : ""
          }`,
        }),
      );
      dispatch(pushNotification(runStarted(run, tasks.length)));
      for (const task of tasks) dispatch(pushNotification(runTaskAssigned(run, task)));
    },
    [dispatch, entry, ref, employees, country, by],
  );

  const remind = useCallback(
    (escalate: boolean) => {
      if (!entry?.run) return;
      const lead = leadTask(entry.run);
      if (!lead) return;
      const to = escalate ? lead.reviewerEmployeeId : lead.assigneeEmployeeId;
      dispatch(
        pushNotification({
          title: escalate ? `Escalated: ${entry.risk.title}` : `Reminder: ${entry.risk.title}`,
          description: escalate
            ? `${lead.assigneeName}'s action on ${entry.risk.affected.label} is overdue (due ${lead.dueDate}).`
            : `Your action on ${entry.risk.affected.label} is due ${lead.dueDate}.`,
          type: "warning",
          recipientEmployeeIds: to ? [to] : undefined,
          href: entry.run.subject.href,
        }),
      );
      dispatch(
        logRiskEvent({
          key: entry.key,
          action: escalate ? "escalated" : "reminder_sent",
          by,
          note: escalate ? `To ${lead.reviewerName ?? "verifier"}` : `To ${lead.assigneeName}`,
        }),
      );
    },
    [dispatch, entry, by],
  );

  return {
    canWork,
    canApprove,
    acknowledge,
    editRecommendation: (text: string) => ref && dispatch(editRecommendation({ ...ref, text })),
    approveRecommendation: () => ref && dispatch(approveRecommendation(ref)),
    createPlan,
    remind,
    close: (outcome: RiskOutcome, evidence: string) =>
      entry &&
      dispatch(
        closeRisk({
          key: entry.key,
          by,
          outcome,
          evidence,
          // A rule that no longer fires means the measure is back on target.
          metricAtClose: entry.detected ? entry.risk.metric?.value : entry.risk.metric?.target,
          fingerprint: entry.risk.fingerprint,
        }),
      ),
    dismiss: (reason: string) => ref && dispatch(dismissRisk({ ...ref, reason })),
    reopen: (note: string) => ref && dispatch(reopenRisk({ ...ref, note })),
  };
}
