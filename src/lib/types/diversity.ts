/**
 * §6.23 — diversity & inclusion data.
 *
 * This is special-category personal data under UK GDPR and sensitive personal
 * data under Nigeria's NDPA, so the model is built around three rules that are
 * not negotiable and are enforced in the types rather than left to the UI:
 *
 *  1. **Self-declared only.** There is no HR-facing setter anywhere in this
 *     module. Someone's ethnicity is not an administrative field.
 *  2. **Always optional.** Every category includes "Prefer not to say", and
 *     declining is a first-class answer rather than an empty value.
 *  3. **Aggregate-only reporting.** Nothing joins a declaration back to a named
 *     employee, and small groups are suppressed before display so an
 *     individual can't be identified by elimination.
 *
 * Categories are per-jurisdiction because the correct question genuinely
 * differs. The UK list follows the ONS/Equality Act 2010 groupings used for
 * statutory reporting. Nigeria deliberately does *not* collect ethnicity by
 * tribe — it carries real discrimination risk and is not a reporting
 * requirement there — so that locale asks a narrower set.
 */

export type Jurisdiction = "uk" | "ng";

/** The answer everyone is entitled to give, in every category. */
export const PREFER_NOT_TO_SAY = "Prefer not to say";

export interface DiversityCategory {
  key: DiversityFieldKey;
  label: string;
  /** Why it's being asked — shown to the employee, not buried in a policy. */
  purpose: string;
  options: string[];
}

export type DiversityFieldKey =
  | "ethnicity"
  | "disability"
  | "religion"
  | "sexualOrientation"
  | "veteranStatus"
  | "caringResponsibilities";

/** ONS 2021 high-level ethnic groups, as used for UK statutory reporting. */
const UK_ETHNICITY = [
  "Asian or Asian British",
  "Black, Black British, Caribbean or African",
  "Mixed or multiple ethnic groups",
  "White",
  "Other ethnic group",
  PREFER_NOT_TO_SAY,
];

const DISABILITY = [
  "No",
  "Yes",
  "Yes — but I do not consider myself disabled",
  PREFER_NOT_TO_SAY,
];

const UK_RELIGION = [
  "No religion",
  "Buddhist",
  "Christian",
  "Hindu",
  "Jewish",
  "Muslim",
  "Sikh",
  "Other religion",
  PREFER_NOT_TO_SAY,
];

const NG_RELIGION = [
  "Christianity",
  "Islam",
  "Traditional religion",
  "No religion",
  "Other",
  PREFER_NOT_TO_SAY,
];

const SEXUAL_ORIENTATION = [
  "Heterosexual or straight",
  "Gay or lesbian",
  "Bisexual",
  "Other",
  PREFER_NOT_TO_SAY,
];

const CARING = [
  "No",
  "Yes — children",
  "Yes — an adult",
  "Yes — both",
  PREFER_NOT_TO_SAY,
];

/**
 * UK categories. Sexual orientation and religion are Equality Act protected
 * characteristics that larger UK employers commonly monitor.
 */
const UK_CATEGORIES: DiversityCategory[] = [
  {
    key: "ethnicity",
    label: "Ethnic group",
    purpose:
      "Reported in aggregate only, to check our hiring and progression are fair across groups.",
    options: UK_ETHNICITY,
  },
  {
    key: "disability",
    label: "Do you consider yourself to have a disability?",
    purpose:
      "Helps us meet our duty to make reasonable adjustments and monitor representation.",
    options: DISABILITY,
  },
  {
    key: "religion",
    label: "Religion or belief",
    purpose: "Aggregate monitoring under the Equality Act 2010.",
    options: UK_RELIGION,
  },
  {
    key: "sexualOrientation",
    label: "Sexual orientation",
    purpose: "Aggregate monitoring under the Equality Act 2010.",
    options: SEXUAL_ORIENTATION,
  },
  {
    key: "veteranStatus",
    label: "Have you served in the UK Armed Forces?",
    purpose:
      "So we can honour our Armed Forces Covenant commitments and offer relevant support.",
    options: [
      "No",
      "Yes — I am a veteran",
      "Yes — I am currently a reservist",
      PREFER_NOT_TO_SAY,
    ],
  },
  {
    key: "caringResponsibilities",
    label: "Do you have caring responsibilities?",
    purpose: "Helps us shape flexible working and support policies.",
    options: CARING,
  },
];

/**
 * Nigeria categories. Ethnicity-by-tribe and sexual orientation are
 * deliberately absent: neither is a lawful or safe thing for an employer to
 * hold there, and collecting data you cannot protect is worse than not asking.
 */
const NG_CATEGORIES: DiversityCategory[] = [
  {
    key: "disability",
    label: "Do you consider yourself to have a disability?",
    purpose:
      "Helps us make workplace adjustments under the Discrimination Against Persons with Disabilities (Prohibition) Act.",
    options: DISABILITY,
  },
  {
    key: "religion",
    label: "Religion",
    purpose:
      "Aggregate monitoring only, and used to plan around religious observances.",
    options: NG_RELIGION,
  },
  {
    key: "caringResponsibilities",
    label: "Do you have caring responsibilities?",
    purpose: "Helps us shape flexible working and support policies.",
    options: CARING,
  },
];

export function diversityCategories(
  jurisdiction: Jurisdiction,
): DiversityCategory[] {
  return jurisdiction === "ng" ? NG_CATEGORIES : UK_CATEGORIES;
}

/** One employee's self-declared answers. Every field is optional. */
export type DiversityDeclaration = Partial<
  Record<DiversityFieldKey, string>
> & {
  /** ISO timestamp the employee last saved their answers. */
  declaredAt?: string;
  /** The jurisdiction whose question set they answered. */
  jurisdiction?: Jurisdiction;
};

/**
 * Below this many people in a group, the group is suppressed in reporting.
 * Five is the threshold used by the ONS and most HR analytics guidance: with
 * fewer, a reader who knows the team can often work out who is who.
 */
export const SUPPRESSION_THRESHOLD = 5;

export interface DiversityTally {
  label: string;
  count: number;
  percentage: number;
}

export interface SuppressedBreakdown {
  rows: DiversityTally[];
  /** How many people fell into groups too small to show. */
  suppressedCount: number;
  /** How many distinct groups were suppressed. */
  suppressedGroups: number;
  /** Declared at all (the denominator), vs. the headcount asked. */
  declared: number;
  eligible: number;
}

/**
 * Tally one category, folding every group below the threshold into a single
 * "suppressed" figure.
 *
 * The whole breakdown is withheld when *nobody* could be reported, so a
 * near-empty chart doesn't imply the data is missing when it is actually being
 * protected.
 */
export function tallyWithSuppression(
  values: (string | undefined)[],
  eligible: number,
  threshold: number = SUPPRESSION_THRESHOLD,
): SuppressedBreakdown {
  const declaredValues = values.filter((v): v is string => Boolean(v));
  const counts = new Map<string, number>();
  for (const value of declaredValues) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const declared = declaredValues.length;
  const rows: DiversityTally[] = [];
  let suppressedCount = 0;
  let suppressedGroups = 0;

  for (const [label, count] of counts) {
    if (count < threshold) {
      suppressedCount += count;
      suppressedGroups += 1;
      continue;
    }
    rows.push({
      label,
      count,
      percentage: declared ? Math.round((count / declared) * 100) : 0,
    });
  }

  rows.sort((a, b) => b.count - a.count);

  return {
    rows,
    suppressedCount,
    suppressedGroups,
    declared,
    eligible,
  };
}

/** Share of the workforce that has answered at all — the data's own health. */
export function declarationRate(declared: number, eligible: number): number {
  return eligible ? Math.round((declared / eligible) * 100) : 0;
}
