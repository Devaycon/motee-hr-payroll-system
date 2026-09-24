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
}

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

export function profileCompletion(input: CompletionInput): ProfileCompletion {
  const { employee: e, country, documents } = input;
  const docs = documents.filter((d) => d.status !== "rejected");
  const hasDoc = (pred: (d: { category?: string; name?: string }) => boolean) => docs.some(pred);
  const ids = e.identifiers ?? {};

  const checks: CompletionCheck[] = [
    {
      key: "personal",
      label: "Personal details",
      module: "profile",
      done: [e.dateOfBirth, e.gender, e.nationality, e.maritalStatus].every(filled),
    },
    {
      key: "contact",
      label: "Personal email & phone",
      module: "profile",
      done: filled((e as { personalEmail?: string }).personalEmail) && filled(e.phone),
    },
    {
      key: "address",
      label: "Home address",
      module: "profile",
      done: filled(e.address?.line1) && filled(e.address?.city),
    },
    {
      key: "emergency",
      label: "Emergency contact",
      module: "emergency",
      done: Boolean(e.emergencyContacts?.length || e.emergencyContact?.name),
    },
    {
      key: "bank",
      label: "Bank details",
      module: "profile",
      done: filled(e.bankDetails?.accountNumber),
    },
    {
      key: "tax-ids",
      label: country === "ng" ? "NIN, BVN, TIN & pension ID" : "NI number & tax code",
      module: "profile",
      done:
        country === "ng"
          ? [ids.nin, ids.bvn, ids.tin, ids.pensionId].every(filled)
          : [ids.nationalInsuranceNumber, ids.taxCode].every(filled),
    },
    ...(country === "ng"
      ? [
          {
            key: "guarantors",
            label: "Two guarantors",
            module: "guarantors",
            done: (e.guarantors?.length ?? 0) >= 2,
          },
        ]
      : []),
    {
      key: "doc-identity",
      label: "Identity document",
      module: "documents",
      isDocument: true,
      done: hasDoc((d) => d.category === "identity"),
    },
    ...(country === "uk"
      ? [
          {
            key: "doc-rtw",
            label: "Right to work evidence",
            module: "documents",
            isDocument: true,
            done: hasDoc((d) => d.category === "right_to_work"),
          },
        ]
      : []),
    {
      key: "doc-address",
      label: "Proof of address",
      module: "documents",
      isDocument: true,
      done: hasDoc((d) => d.category === "proof_of_address"),
    },
    {
      key: "doc-degree",
      label: "Degree certificate",
      module: "documents",
      isDocument: true,
      done: hasDoc((d) => d.category === "education" && /degree/i.test(d.name ?? "")),
    },
    {
      key: "education",
      label: "Education history",
      module: "qualifications",
      done: input.educationCount > 0,
    },
    {
      key: "membership",
      label: "Professional membership",
      module: "qualifications",
      done: input.membershipCount > 0,
    },
    {
      key: "languages",
      label: "Languages",
      module: "qualifications",
      done: input.languageCount > 0,
    },
    {
      key: "skills",
      label: "Skills assessment (3+ skills)",
      module: "skills",
      done: input.skillCount >= 3,
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
