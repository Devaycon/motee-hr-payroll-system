import type { CountryKey, LocaleEmployee } from "@/src/lib/types/locale";

/**
 * Profile Completion Score — how complete an employee's record is against
 * what HR requires. Each requirement is one equally-weighted check; every
 * missing one names the profile module that fixes it, so the "Missing items"
 * list is a to-do list rather than a verdict.
 */

export interface CompletionCheck {
  key: string;
  label: string;
  /** Profile module key that holds (and fixes) this item. */
  module: string;
  done: boolean;
  /** Missing document evidence rather than missing data. */
  isDocument?: boolean;
  /** Which part of the record this belongs to, for grouping the checklist. */
  group: CompletionGroup;
  /** What was found, or exactly what's still needed. */
  detail: string;
}

export type CompletionGroup = "Personal information" | "Documents" | "Qualifications & skills";

export const COMPLETION_GROUPS: CompletionGroup[] = [
  "Personal information",
  "Documents",
  "Qualifications & skills",
];

export interface ProfileCompletion {
  /** 0–100. */
  score: number;
  checks: CompletionCheck[];
  missing: CompletionCheck[];
}

export interface CompletionInput {
  employee: LocaleEmployee;
  country: CountryKey;
  /** The employee's documents; rejected ones don't count as evidence. */
  documents: { category?: string; name?: string; status?: string }[];
  educationCount: number;
  membershipCount: number;
  skillCount: number;
  languageCount: number;
}

/** Below this a profile is flagged on the HR dashboard. */
export const COMPLETION_TARGET = 80;

const filled = (v: unknown) => typeof v === "string" ? v.trim().length > 0 : v != null;

/** "a, b and c" — for naming exactly which fields are still missing. */
function listOf(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/** Names the fields that are empty, or confirms all are recorded. */
function fieldsDetail(fields: [string, unknown][]): { done: boolean; detail: string } {
  const missing = fields.filter(([, v]) => !filled(v)).map(([name]) => name);
  return missing.length
    ? { done: false, detail: `Missing ${listOf(missing)}` }
    : { done: true, detail: `${listOf(fields.map(([name]) => name))} recorded` };
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

export function profileCompletion(input: CompletionInput): ProfileCompletion {
  const { employee: e, country, documents } = input;
  const docs = documents.filter((d) => d.status !== "rejected");
  const rejected = documents.filter((d) => d.status === "rejected");
  const ids = e.identifiers ?? {};

  /** A document check: done with verified evidence, else says why not. */
  const docCheck = (
    key: string,
    label: string,
    pred: (d: { category?: string; name?: string }) => boolean,
  ): CompletionCheck => {
    const found = docs.find(pred);
    return {
      key,
      label,
      module: "documents",
      group: "Documents",
      isDocument: true,
      done: Boolean(found),
      detail: found
        ? `${found.name ?? "Document"} on file${found.status ? ` · ${found.status}` : ""}`
        : rejected.some(pred)
          ? "Last upload was rejected — a new copy is needed"
          : "Not uploaded yet",
    };
  };

  const countCheck = (
    key: string,
    label: string,
    count: number,
    one: string,
    many: string,
  ): CompletionCheck => ({
    key,
    label,
    module: "qualifications",
    group: "Qualifications & skills",
    done: count > 0,
    detail: count > 0 ? `${plural(count, one, many)} recorded` : `No ${many} recorded`,
  });

  const emergencyCount = e.emergencyContacts?.length || (e.emergencyContact?.name ? 1 : 0);
  const guarantorCount = e.guarantors?.length ?? 0;

  const checks: CompletionCheck[] = [
    {
      key: "personal",
      label: "Personal details",
      module: "profile",
      group: "Personal information",
      ...fieldsDetail([
        ["Date of birth", e.dateOfBirth],
        ["gender", e.gender],
        ["nationality", e.nationality],
        ["marital status", e.maritalStatus],
      ]),
    },
    {
      key: "contact",
      label: "Personal email & phone",
      module: "profile",
      group: "Personal information",
      ...fieldsDetail([
        ["Personal email", (e as { personalEmail?: string }).personalEmail],
        ["phone", e.phone],
      ]),
    },
    {
      key: "address",
      label: "Home address",
      module: "profile",
      group: "Personal information",
      ...fieldsDetail([
        ["Street address", e.address?.line1],
        ["city", e.address?.city],
      ]),
    },
    {
      key: "emergency",
      label: "Emergency contact",
      module: "emergency",
      group: "Personal information",
      done: emergencyCount > 0,
      detail: emergencyCount > 0 ? `${plural(emergencyCount, "contact")} on file` : "No emergency contact added",
    },
    {
      key: "bank",
      label: "Bank details",
      module: "profile",
      group: "Personal information",
      done: filled(e.bankDetails?.accountNumber),
      detail: filled(e.bankDetails?.accountNumber) ? "Account number recorded" : "No account number",
    },
    {
      key: "tax-ids",
      label: country === "ng" ? "NIN, BVN, TIN & pension ID" : "NI number & tax code",
      module: "profile",
      group: "Personal information",
      ...(country === "ng"
        ? fieldsDetail([
            ["NIN", ids.nin],
            ["BVN", ids.bvn],
            ["TIN", ids.tin],
            ["pension ID", ids.pensionId],
          ])
        : fieldsDetail([
            ["NI number", ids.nationalInsuranceNumber],
            ["tax code", ids.taxCode],
          ])),
    },
    ...(country === "ng"
      ? [
          {
            key: "guarantors",
            label: "Two guarantors",
            module: "guarantors",
            group: "Personal information" as const,
            done: guarantorCount >= 2,
            detail: `${guarantorCount} of 2 guarantors added`,
          },
        ]
      : []),
    docCheck("doc-identity", "Identity document", (d) => d.category === "identity"),
    ...(country === "uk"
      ? [docCheck("doc-rtw", "Right to work evidence", (d) => d.category === "right_to_work")]
      : []),
    docCheck("doc-address", "Proof of address", (d) => d.category === "proof_of_address"),
    docCheck(
      "doc-degree",
      "Degree certificate",
      (d) => d.category === "education" && /degree/i.test(d.name ?? ""),
    ),
    countCheck("education", "Education history", input.educationCount, "education entry", "education entries"),
    countCheck("membership", "Professional membership", input.membershipCount, "membership", "memberships"),
    countCheck("languages", "Languages", input.languageCount, "language", "languages"),
    {
      key: "skills",
      label: "Skills assessment (3+ skills)",
      module: "skills",
      group: "Qualifications & skills",
      done: input.skillCount >= 3,
      detail:
        input.skillCount >= 3
          ? `${input.skillCount} skills assessed`
          : `${input.skillCount} of 3 skills assessed`,
    },
  ];

  const done = checks.filter((c) => c.done).length;
  return {
    score: Math.round((done / checks.length) * 100),
    checks,
    missing: checks.filter((c) => !c.done),
  };
}

export interface DataQualitySummary {
  profiles: number;
  averageCompletion: number;
  belowTarget: number;
  missingDocuments: number;
}

export function summariseDataQuality(results: ProfileCompletion[]): DataQualitySummary {
  const n = results.length;
  return {
    profiles: n,
    averageCompletion: n ? Math.round(results.reduce((s, r) => s + r.score, 0) / n) : 100,
    belowTarget: results.filter((r) => r.score < COMPLETION_TARGET).length,
    missingDocuments: results.filter((r) => r.missing.some((m) => m.isDocument)).length,
  };
}
