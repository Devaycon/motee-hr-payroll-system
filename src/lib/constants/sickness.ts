// Sickness/absence reason taxonomy (§17.8).
//
// The client asked us to stop using the generic "Personal" reason for sickness
// because it doesn't distinguish illness, and to categorise absences into
// clinical groups. Crucially, category detail is sensitive: managers should see
// that someone is absent, while HR sees the clinical category. See
// {@link sicknessReasonDisplay} for the role-based redaction.

export const SICKNESS_REASON_CATEGORIES = [
  "Cold / Flu",
  "Migraine",
  "Musculoskeletal",
  "Mental Health",
  "Medical Appointment",
  "Surgery Recovery",
  "Other",
] as const;

export type SicknessReasonCategory = (typeof SICKNESS_REASON_CATEGORIES)[number];

/** What non-privileged viewers (e.g. line managers) see instead of the category. */
export const SICKNESS_REASON_REDACTED = "Medical absence";

const REASON_PATTERNS: Array<[RegExp, SicknessReasonCategory]> = [
  // Order matters: more specific patterns first.
  [/surgery|operation|post[\s-]?op|recovery/i, "Surgery Recovery"],
  [/mental|stress|anxiety|depression|burnout|wellbeing/i, "Mental Health"],
  [/migraine|headache/i, "Migraine"],
  [/back|joint|muscle|musculo|sprain|rsi|injury/i, "Musculoskeletal"],
  [/cold|flu|virus|cough|throat|fever|covid/i, "Cold / Flu"],
  [/appointment|doctor|gp|dentist|hospital|clinic|scan|check[\s-]?up/i, "Medical Appointment"],
];

/**
 * Map an arbitrary free-text sickness reason to a clinical category. Anything
 * unrecognised — including the legacy "Personal" value — becomes "Other".
 */
export function sicknessReasonCategory(reason?: string | null): SicknessReasonCategory {
  if (!reason) return "Other";
  for (const [pattern, category] of REASON_PATTERNS) {
    if (pattern.test(reason)) return category;
  }
  return "Other";
}

/**
 * Role-aware reason display. Privileged viewers (HR) see the clinical category;
 * everyone else sees a generic redaction so medical detail stays confidential.
 */
export function sicknessReasonDisplay(
  reason: string | null | undefined,
  canViewMedicalDetail: boolean,
): string {
  return canViewMedicalDetail
    ? sicknessReasonCategory(reason)
    : SICKNESS_REASON_REDACTED;
}
