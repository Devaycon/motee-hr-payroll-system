export {
  CASE_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  CASE_TYPE_CONFIG,
  CASE_STAGE_CONFIG,
  PRIORITY_CONFIG,
} from "@/src/data/grievance-demo";

export {
  SLA_LABELS,
  SLA_STYLES,
  slaState,
  daysOpen,
} from "@/src/lib/types/grievance";

export type { ERCase, NewERCase } from "@/src/lib/types/grievance";

// Fallback identity for the instant before the auth slice resolves the real
// signed-in user — the same demo employee every other self-service module
// (e.g. HR Help Desk) falls back to, so "who am I" agrees across the portal.
export const MY_NAME = "Emeka Nwosu";
export const MY_INITIALS = "EN";
export const MY_DEPT = "Engineering";
