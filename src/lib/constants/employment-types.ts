/**
 * Canonical employment-type taxonomy — the single source of truth used across
 * the whole app (dropdowns, badges, the Employment Types module, recruitment,
 * onboarding, employee assignment). Add or change a type here and every
 * consumer that imports from this module stays in step.
 */

export const EMPLOYMENT_TYPE_VALUES = [
  "full_time",
  "part_time",
  "temporary",
  "contract",
  "freelance",
  "internship",
  "apprenticeship",
  "casual",
  "seasonal",
  "remote",
  "field_based",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPE_VALUES)[number];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  temporary: "Temporary",
  contract: "Contract",
  freelance: "Freelance / Self-employed",
  internship: "Internship",
  apprenticeship: "Apprenticeship",
  casual: "Casual",
  seasonal: "Seasonal",
  remote: "Remote / Telecommuting",
  field_based: "Field-based",
};

/** Short descriptions (from the HR spec) for tooltips / option help text. */
export const EMPLOYMENT_TYPE_DESCRIPTIONS: Record<EmploymentType, string> = {
  full_time: "Regular hours (35–40/week), typically with full benefits.",
  part_time: "Fewer hours than full-time; benefits may be limited.",
  temporary: "Fixed period or project — covers busy seasons or absences.",
  contract: "Hired for a specific project or term under a contract.",
  freelance: "Independent worker serving multiple clients; self-managed.",
  internship: "Short-term, learning-focused; for students/graduates.",
  apprenticeship: "Combines work with training, common in skilled trades.",
  casual: "Irregular, no guaranteed hours; called in as needed.",
  seasonal: "Roles that exist only during certain times of the year.",
  remote: "Works from home/outside the office; can be FT, PT or freelance.",
  field_based: "Works primarily on-site at client, site or field locations rather than a fixed office.",
};

/** Tailwind badge classes per type (bg/text/border), dark-mode aware. */
export const EMPLOYMENT_TYPE_STYLES: Record<EmploymentType, string> = {
  full_time: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  part_time: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  temporary: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  contract: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  freelance: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  internship: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  apprenticeship: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  casual: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  seasonal: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  remote: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  field_based: "bg-lime-500/10 text-lime-600 border-lime-500/20",
};

export interface EmploymentTypeOption {
  value: EmploymentType;
  label: string;
  description: string;
}

export const EMPLOYMENT_TYPE_OPTIONS: EmploymentTypeOption[] =
  EMPLOYMENT_TYPE_VALUES.map((value) => ({
    value,
    label: EMPLOYMENT_TYPE_LABELS[value],
    description: EMPLOYMENT_TYPE_DESCRIPTIONS[value],
  }));

/** The display names used by the org Employment Types module / locale config. */
export const EMPLOYMENT_TYPE_NAMES: string[] =
  EMPLOYMENT_TYPE_VALUES.map((v) => EMPLOYMENT_TYPE_LABELS[v]);

const NAME_TO_TYPE: Array<[RegExp, EmploymentType]> = [
  // Order matters: more specific patterns first.
  [/self[\s-]?employ|freelanc/i, "freelance"],
  [/apprentic/i, "apprenticeship"],
  [/intern/i, "internship"],
  [/temp/i, "temporary"],
  [/season/i, "seasonal"],
  [/casual|on[\s-]?call/i, "casual"],
  [/field[\s-]?based|field[\s-]?work/i, "field_based"],
  [/remote|telecommut|work[\s-]?from[\s-]?home/i, "remote"],
  [/part[\s-]?time/i, "part_time"],
  [/contract|nysc|corps|fixed[\s-]?term/i, "contract"],
  [/full[\s-]?time|permanent/i, "full_time"],
];

/**
 * Normalize an arbitrary employment-type name (e.g. a locale/demo label such as
 * "Intern", "Contractor", "NYSC Corps Member", "Fixed-Term Contract") to a
 * canonical {@link EmploymentType}. Falls back to "full_time".
 */
export function employmentTypeFromName(name?: string | null): EmploymentType {
  if (!name) return "full_time";
  const trimmed = name.trim();
  // Exact value match (already canonical).
  if ((EMPLOYMENT_TYPE_VALUES as readonly string[]).includes(trimmed)) {
    return trimmed as EmploymentType;
  }
  for (const [pattern, type] of NAME_TO_TYPE) {
    if (pattern.test(trimmed)) return type;
  }
  return "full_time";
}

/** Label for any value/name, canonical or legacy. */
export function employmentTypeLabel(value?: string | null): string {
  if (!value) return "—";
  if (value in EMPLOYMENT_TYPE_LABELS) {
    return EMPLOYMENT_TYPE_LABELS[value as EmploymentType];
  }
  return EMPLOYMENT_TYPE_LABELS[employmentTypeFromName(value)];
}
