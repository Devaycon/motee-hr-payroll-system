/**
 * §9.1 (Correction 2 feedback) — HR Help Desk already generates a unique
 * reference (Ref #, e.g. HD-001); the gap was surfacing it to the requester
 * and including it in Service Desk notifications. These builders return
 * payloads for `pushNotification`, following the same shape as
 * `src/lib/notifications/er-cases.ts`.
 */
import type { PushNotificationPayload } from "@/src/lib/stores/notifications-slice";
import type { HelpDeskTicket, TicketStatus } from "@/src/lib/types/helpdesk";

export function caseRaised(t: HelpDeskTicket): PushNotificationPayload {
  return {
    title: `Case raised — ${t.id}`,
    description: `Your case ${t.id} (${t.subject}) has been logged. We'll notify you as it progresses.`,
    detail:
      `Case ${t.id} has been opened.\n\n` +
      `Subject: ${t.subject}\nCategory: ${t.category}\nPriority: ${t.priority}\n` +
      `Submitted by: ${t.submitterName} (${t.submitterDept})\n\n` +
      `Quote reference ${t.id} in any follow-up.`,
    type: "info",
  };
}

export function caseAssigned(t: HelpDeskTicket, assignee: string): PushNotificationPayload {
  return {
    title: `Case ${t.id} assigned`,
    description: `${assignee} is now handling case ${t.id} (${t.subject}).`,
    detail:
      `${assignee} is now handling case ${t.id}.\n\n` +
      `Subject: ${t.subject}\n` +
      (t.slaDueAt ? `SLA due: ${t.slaDueAt}\n` : ""),
    type: "info",
  };
}

export function caseStatusChanged(
  t: HelpDeskTicket,
  from: TicketStatus,
): PushNotificationPayload {
  return {
    title: `Case ${t.id} — ${t.status}`,
    description: `Your case ${t.id} (${t.subject}) moved from ${from} to ${t.status}.`,
    detail:
      `Case ${t.id} (${t.subject}) changed status.\n\n` +
      `From: ${from}\nTo: ${t.status}\n`,
    type: t.status === "resolved" || t.status === "closed" ? "success" : "info",
  };
}
