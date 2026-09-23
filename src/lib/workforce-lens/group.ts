import {
  EMPLOYMENT_TYPE_LABELS,
  type EmploymentType,
} from "@/src/lib/constants/employment-types";
import type { SuppressedBreakdown } from "@/src/lib/types/diversity";
import type { EmployeeRow, EmployeeStatus } from "@/src/lib/types/employees";
import {
  AGE_BANDS,
  TENURE_BANDS,
  ageBand,
  tenureBand,
  tenureYears,
} from "@/src/lib/utils/workforce-bands";

/**
 * Workforce Lens — pure grouping and filtering. Kept free of React and the store so
 * it can be unit-tested; the page only wires data in and renders what comes out.
 */

/** Dimensions whose columns list the people in them. */
export type MemberDimension =
  | "department"
  | "gender"
  | "country"
  | "nationality"
  | "city"
  | "branch"
  | "employmentType"
  | "workMode"
  | "grade"
  | "ageBand"
  | "tenureBand"
  | "skill";

/**
 * Ethnicity is special-category data: self-declared, aggregate-only and
 * suppressed below `SUPPRESSION_THRESHOLD` (see lib/types/diversity). It never
 * names anyone, so it has its own path rather than a members column.
 */
export type LensDimension = MemberDimension | "ethnicity";

export interface LensDimensionMeta {
  key: LensDimension;
  label: string;
  /** One person can appear in several columns (skills). */
  multiValue?: boolean;
  /** Counts only — no avatars. */
  aggregateOnly?: boolean;
}

export const LENS_DIMENSIONS: LensDimensionMeta[] = [
  { key: "department", label: "Department" },
  { key: "skill", label: "Skill", multiValue: true },
  { key: "gender", label: "Gender" },
  { key: "country", label: "Country" },
  { key: "nationality", label: "Nationality" },
  { key: "city", label: "City" },
  { key: "branch", label: "Branch" },
  { key: "ageBand", label: "Age" },
  { key: "tenureBand", label: "Tenure" },
  { key: "employmentType", label: "Employment type" },
  { key: "workMode", label: "Work mode" },
  { key: "grade", label: "Grade" },
  { key: "ethnicity", label: "Ethnicity", aggregateOnly: true },
];

export function isLensDimension(value: string | null): value is LensDimension {
  return LENS_DIMENSIONS.some((d) => d.key === value);
}

/** Label of the bucket for people with no value on the chosen dimension. */
export const NO_VALUE = "—";

/** The slice of an employee the Workforce Lens reads. */
export type LensMember = Pick<
  EmployeeRow,
  | "id"
  | "name"
  | "initials"
  | "gender"
  | "jobTitle"
  | "department"
  | "employmentType"
  | "status"
  | "startDate"
  | "dateOfBirth"
  | "nationality"
  | "country"
  | "city"
  | "branchId"
  | "branchName"
  | "workMode"
  | "grade"
  | "skills"
>;

export interface LensGroup {
  key: string;
  label: string;
  members: LensMember[];
  count: number;
  /** Whole-number percentage. Skill groups overlap, so they can sum past 100. */
  pct: number;
  /** Counts only; `members` is empty. */
  aggregateOnly?: boolean;
}

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  non_binary: "Non-binary",
  prefer_not_to_say: "Prefer not to say",
};

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function clean(value: string | undefined | null): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/** The (label, key) pairs a person falls under for a dimension. */
function valuesFor(
  m: LensMember,
  dimension: MemberDimension,
  now: Date,
): { key: string; label: string }[] {
  const one = (raw: string | null, label?: string) =>
    raw ? [{ key: raw, label: label ?? raw }] : [];

  switch (dimension) {
    case "department":
      return one(clean(m.department));
    case "gender": {
      const g = clean(m.gender);
      return one(g, g ? (GENDER_LABELS[g] ?? titleCase(g)) : undefined);
    }
    case "country":
      return one(clean(m.country));
    case "nationality":
      return one(clean(m.nationality));
    case "city":
      return one(clean(m.city));
    case "branch":
      return one(clean(m.branchName));
    case "employmentType": {
      const t = clean(m.employmentType);
      return one(t, t ? EMPLOYMENT_TYPE_LABELS[t as EmploymentType] : undefined);
    }
    case "workMode":
      return one(clean(m.workMode));
    case "grade":
      return one(clean(m.grade));
    case "ageBand":
      return one(ageBand(m.dateOfBirth, now));
    case "tenureBand":
      return m.startDate
        ? one(tenureBand(tenureYears(m.startDate, now)))
        : [];
    case "skill": {
      const seen = new Set<string>();
      for (const s of m.skills ?? []) {
        const skill = clean(s);
        if (skill) seen.add(skill);
      }
      return [...seen].map((s) => ({ key: s, label: s }));
    }
  }
}

/** Bands read low-to-high rather than by size. */
const NATURAL_ORDER: Partial<Record<MemberDimension, readonly string[]>> = {
  ageBand: AGE_BANDS,
  tenureBand: TENURE_BANDS,
};

/**
 * Group people by a dimension. Columns are sorted largest-first (age and tenure
 * bands keep their natural order) and the "no value" bucket always goes last.
 * `pct` is against everyone passed in, so a multi-valued dimension like skills
 * can total over 100%.
 */
export function groupEmployees(
  rows: LensMember[],
  dimension: MemberDimension,
  now: Date = new Date(),
): LensGroup[] {
  const groups = new Map<string, LensGroup>();
  const total = rows.length;

  for (const member of rows) {
    const values = valuesFor(member, dimension, now);
    const targets = values.length ? values : [{ key: NO_VALUE, label: NO_VALUE }];
    for (const { key, label } of targets) {
      let group = groups.get(key);
      if (!group) {
        group = { key, label, members: [], count: 0, pct: 0 };
        groups.set(key, group);
      }
      group.members.push(member);
      group.count += 1;
    }
  }

  const natural = NATURAL_ORDER[dimension];
  const list = [...groups.values()];
  for (const g of list) g.pct = total ? Math.round((g.count / total) * 100) : 0;

  return list.sort((a, b) => {
    if (a.key === NO_VALUE) return 1;
    if (b.key === NO_VALUE) return -1;
    if (natural) return natural.indexOf(a.key) - natural.indexOf(b.key);
    return b.count - a.count || a.label.localeCompare(b.label);
  });
}

/**
 * Turn an already-suppressed diversity tally into columns. Anything under the
 * threshold has been folded away upstream, so nothing here can point at a
 * person.
 */
export function aggregateGroups(breakdown: SuppressedBreakdown): LensGroup[] {
  return breakdown.rows.map((row) => ({
    key: row.label,
    label: row.label,
    members: [],
    count: row.count,
    pct: row.percentage,
    aggregateOnly: true,
  }));
}

/* ── Filters ─────────────────────────────────────────────────────────── */

export const ALL = "all";

/** "employed" is everyone still on the books, the Workforce Lens default. */
export type LensLifecycle = "employed" | typeof ALL | EmployeeStatus;

const EMPLOYED: EmployeeStatus[] = [
  "active",
  "on_leave",
  "probation",
  "offboarding",
  "onboarded",
];

/** Records that are never people to show: soft-deleted and not yet onboarded. */
const HIDDEN: EmployeeStatus[] = ["deleted", "pending"];

export const LENS_LIFECYCLES: { value: LensLifecycle; label: string }[] = [
  { value: "employed", label: "Employed" },
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On leave" },
  { value: "probation", label: "Probation" },
  { value: "offboarding", label: "Offboarding" },
  { value: "onboarded", label: "New joiners" },
  { value: "inactive", label: "Left" },
  { value: ALL, label: "Anyone" },
];

export interface LensFilters {
  lifecycle: LensLifecycle;
  /** `EmploymentType` value or "all". */
  employmentType: string;
  /** Branch id or "all". */
  branch: string;
  /** Department name or "all". */
  department: string;
  query: string;
}

export const DEFAULT_LENS_FILTERS: LensFilters = {
  lifecycle: "employed",
  employmentType: ALL,
  branch: ALL,
  department: ALL,
  query: "",
};

export function filterLensEmployees<T extends LensMember>(
  rows: T[],
  filters: LensFilters,
): T[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter((r) => {
    if (HIDDEN.includes(r.status)) return false;
    if (filters.lifecycle === "employed") {
      if (!EMPLOYED.includes(r.status)) return false;
    } else if (filters.lifecycle !== ALL && r.status !== filters.lifecycle) {
      return false;
    }
    if (filters.employmentType !== ALL && r.employmentType !== filters.employmentType)
      return false;
    if (filters.branch !== ALL && r.branchId !== filters.branch) return false;
    if (filters.department !== ALL && r.department !== filters.department)
      return false;
    if (q) {
      const hay =
        `${r.name} ${r.jobTitle} ${r.department} ${(r.skills ?? []).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
