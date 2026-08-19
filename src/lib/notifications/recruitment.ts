/**
 * §7.18 — notifications along the recruitment pipeline.
 *
 * The client called the Applicant → Offer → Hired → Onboarding → Employee
 * chain the single biggest gap in this batch. Most of the chain existed; what
 * was missing was any signal as it advanced, so each handover happened in
 * silence and the next person only found out by refreshing a page.
 */
import type { PushNotificationPayload } from "@/src/lib/stores/notifications-slice";

export function offerSent(
  candidateName: string,
  roleTitle: string,
  salary?: number,
  startDate?: string,
): PushNotificationPayload {
  return {
    title: `Offer sent — ${roleTitle}`,
    description: `An offer has gone out to ${candidateName}.`,
    detail:
      `${candidateName} has been sent an offer for the ${roleTitle} role.\n\n` +
      (salary != null ? `Salary: ${salary.toLocaleString()}\n` : "") +
      (startDate ? `Proposed start date: ${startDate}\n` : "") +
      "\nRecord their response on the Offer tab once they reply.",
    type: "info",
  };
}

export function offerAccepted(
  candidateName: string,
  roleTitle: string,
): PushNotificationPayload {
  return {
    title: `Offer accepted — ${roleTitle}`,
    description: `${candidateName} has accepted and moved to Hired.`,
    detail:
      `${candidateName} accepted the offer for ${roleTitle}.\n\n` +
      "They have moved to the Hired stage. Send them an onboarding invite to " +
      "start collecting their details.",
    type: "success",
  };
}

export function offerDeclined(
  candidateName: string,
  roleTitle: string,
): PushNotificationPayload {
  return {
    title: `Offer declined — ${roleTitle}`,
    description: `${candidateName} has turned down the offer.`,
    detail:
      `${candidateName} declined the offer for ${roleTitle}.\n\n` +
      "The vacancy is still open. Consider the next candidate in the pipeline, " +
      "or review the offer terms if this is becoming a pattern.",
    type: "warning",
  };
}

/** The end of the chain: an onboarding record has become a real employee. */
export function employeeRecordCreated(
  employeeName: string,
  jobTitle: string,
): PushNotificationPayload {
  return {
    title: "Employee record created",
    description: `${employeeName} has completed onboarding and now has an employee record.`,
    detail:
      `${employeeName} (${jobTitle}) has finished every onboarding task.\n\n` +
      "They now appear in the Employees module as an active employee. Payroll, " +
      "leave entitlement and asset assignment can proceed from there.",
    type: "success",
  };
}
