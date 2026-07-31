/**
 * How an employee record entered the system. Surfaced on the employee profile
 * header alongside the employee ID so HR can see a record's provenance at a
 * glance (client feedback round 2, §D1).
 */
export type OnboardingMethod = "manual" | "invite" | "bulk";

export const ONBOARDING_METHOD_LABELS: Record<OnboardingMethod, string> = {
  manual: "Manual Upload",
  invite: "Self-Onboarding",
  bulk: "Bulk Upload",
};

export const ONBOARDING_METHOD_DESCRIPTIONS: Record<OnboardingMethod, string> = {
  manual: "Entered by HR on the employee's behalf.",
  invite: "The employee completed their own registration from an invitation link.",
  bulk: "Imported as part of a bulk spreadsheet upload.",
};

export function onboardingMethodLabel(method?: string | null): string | null {
  if (!method) return null;
  return ONBOARDING_METHOD_LABELS[method as OnboardingMethod] ?? null;
}
