/**
 * §2.10 — employer-facing onboarding notifications.
 *
 * The employer previously found out an onboarding form had been submitted only
 * by opening the pipeline and noticing the row had changed. These builders
 * return payloads for `pushNotification`; the caller dispatches them, so the
 * wording lives with the domain rather than inline in components.
 */
import type { PushNotificationPayload } from "@/src/lib/stores/notifications-slice";

// Which documents count as missing is already answered by
// `missingRequiredDocuments` in the wizard's documents step, which reads the
// same JOINER_DOCUMENTS spec the upload UI renders from. Callers use that;
// a second implementation here would only give the form and the notification
// a way to disagree.

export function onboardingStarted(
  employeeName: string,
  jobTitle: string,
  startDate: string,
): PushNotificationPayload {
  return {
    title: "Onboarding started",
    description: `${employeeName} has been invited to onboard as ${jobTitle}.`,
    detail:
      `${employeeName} has been added to the onboarding pipeline.\n\n` +
      `Role: ${jobTitle}\nExpected start date: ${startDate}\n\n` +
      "They will receive an invitation to complete their onboarding form. " +
      "You will be notified again once they submit it.",
    type: "info",
  };
}

export function onboardingSubmitted(
  employeeName: string,
  jobTitle: string,
): PushNotificationPayload {
  return {
    title: "Onboarding form submitted",
    description: `${employeeName} has completed their onboarding form and it is ready for review.`,
    detail:
      `${employeeName} (${jobTitle}) has submitted their onboarding form.\n\n` +
      "It is now waiting on your review. Approve it to move them forward, or " +
      "return it for amendment with a note explaining what needs changing.",
    type: "success",
  };
}

export function onboardingDocumentsMissing(
  employeeName: string,
  missing: string[],
): PushNotificationPayload {
  return {
    title: "Onboarding documents missing",
    description: `${employeeName}'s submission is missing ${missing.length} required document${
      missing.length === 1 ? "" : "s"
    }.`,
    detail:
      `${employeeName} submitted their onboarding form without the following:\n\n` +
      missing.map((m) => `• ${m}`).join("\n") +
      "\n\nReturn the form for amendment to request them.",
    type: "warning",
  };
}

export function onboardingAmended(
  employeeName: string,
): PushNotificationPayload {
  return {
    title: "Onboarding form amended",
    description: `${employeeName} has resubmitted their onboarding form after your review.`,
    detail:
      `${employeeName} has made the changes you asked for and resubmitted their ` +
      "onboarding form.\n\nIt is back in your review queue.",
    type: "info",
  };
}
