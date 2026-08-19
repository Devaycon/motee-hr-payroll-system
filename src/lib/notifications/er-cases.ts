/**
 * §5.9 — Employee Relations case notifications.
 *
 * Cases carry SLAs (§5.3) that nobody was told about; a case could sail past
 * its target resolution date with the only signal being a red badge on a page
 * nobody had open. These builders return payloads for `pushNotification`.
 */
import type { PushNotificationPayload } from "@/src/lib/stores/notifications-slice";
import type { ERCase } from "@/src/lib/types/grievance";
import {
  CASE_STAGE_CONFIG,
  CASE_TYPE_CONFIG,
} from "@/src/data/grievance-demo";

function typeLabel(c: ERCase): string {
  return CASE_TYPE_CONFIG[c.complaintType]?.label ?? c.complaintType;
}

function stageLabel(stage: ERCase["stage"]): string {
  return CASE_STAGE_CONFIG[stage]?.label ?? stage;
}

export function caseRaised(c: ERCase): PushNotificationPayload {
  return {
    title: `Case raised — ${c.caseNumber}`,
    description: `A ${typeLabel(c).toLowerCase()} case has been raised for ${c.employeeName}.`,
    detail:
      `Case ${c.caseNumber} has been opened.\n\n` +
      `Type: ${typeLabel(c)}\nEmployee: ${c.employeeName} (${c.employeeDept})\n` +
      `Priority: ${c.priority}\nRaised: ${c.dateRaised}\n` +
      (c.targetResolutionDate
        ? `Target resolution: ${c.targetResolutionDate}\n`
        : "") +
      `\n${c.description}`,
    type: c.priority === "urgent" ? "warning" : "info",
  };
}

export function caseAssigned(c: ERCase, assignee: string): PushNotificationPayload {
  return {
    title: `Case assigned — ${c.caseNumber}`,
    description: `${assignee} has been assigned to ${c.caseNumber} (${typeLabel(c)}).`,
    detail:
      `${assignee} is now handling case ${c.caseNumber}.\n\n` +
      `Type: ${typeLabel(c)}\nEmployee: ${c.employeeName}\n` +
      `Current stage: ${stageLabel(c.stage)}\n` +
      (c.investigationDueDate
        ? `Investigation due: ${c.investigationDueDate}\n`
        : ""),
    type: "info",
  };
}

export function caseStageChanged(
  c: ERCase,
  from: ERCase["stage"],
): PushNotificationPayload {
  return {
    title: `Case moved to ${stageLabel(c.stage)}`,
    description: `${c.caseNumber} has progressed from ${stageLabel(from)} to ${stageLabel(c.stage)}.`,
    detail:
      `Case ${c.caseNumber} (${typeLabel(c)}) has moved stage.\n\n` +
      `From: ${stageLabel(from)}\nTo: ${stageLabel(c.stage)}\n` +
      `Employee: ${c.employeeName}\n` +
      (c.assignedTo ? `Handled by: ${c.assignedTo}\n` : ""),
    type: c.stage === "closed" ? "success" : "info",
  };
}

export function caseOutcomeIssued(c: ERCase): PushNotificationPayload {
  return {
    title: `Outcome issued — ${c.caseNumber}`,
    description: `An outcome has been recorded for ${c.employeeName}'s ${typeLabel(c).toLowerCase()} case.`,
    detail:
      `Case ${c.caseNumber} has an outcome.\n\n` +
      `Outcome: ${c.outcome ?? "—"}\n` +
      (c.outcomeDate ? `Issued: ${c.outcomeDate}\n` : "") +
      `Employee: ${c.employeeName}\n\n` +
      "The employee has the right to appeal within the period set out in policy.",
    type: "success",
  };
}

export function caseOverdue(c: ERCase): PushNotificationPayload {
  return {
    title: `Case overdue — ${c.caseNumber}`,
    description: `${c.caseNumber} has passed its target resolution date of ${c.targetResolutionDate}.`,
    detail:
      `Case ${c.caseNumber} (${typeLabel(c)}) is past its SLA.\n\n` +
      `Target resolution: ${c.targetResolutionDate}\n` +
      `Current stage: ${stageLabel(c.stage)}\n` +
      `Employee: ${c.employeeName}\n` +
      (c.assignedTo ? `Assigned to: ${c.assignedTo}\n` : "Unassigned\n") +
      "\nReview the case and either progress it or revise the target date.",
    type: "warning",
  };
}
