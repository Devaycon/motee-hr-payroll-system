"use client";

import { useMemo } from "react";
import {
  useLocaleSection,
  useUnscopedLocaleSection,
} from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { applyCollection } from "./collection-edits";
import { applyEmployeeOverrides } from "./overrides";
import {
  profileCompletion,
  summariseDataQuality,
  type DataQualitySummary,
  type ProfileCompletion,
} from "./completion";
import type { CollectionEditsState } from "@/src/lib/stores/collection-edits-slice";
import type { CountryKey, LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";

type Edits = Pick<CollectionEditsState, "added" | "edits" | "removed">;

/** Counts every collection the score reads, with session edits layered on. */
function completionIndex(bundle: LocaleBundle, edits: Edits) {
  const countBy = <T extends { employeeId?: string }>(rows: T[], key: string) => {
    const m = new Map<string, number>();
    for (const r of applyCollection(rows, key, edits)) {
      if (r.employeeId) m.set(r.employeeId, (m.get(r.employeeId) ?? 0) + 1);
    }
    return m;
  };
  const docs = new Map<string, { category?: string; name?: string; status?: string }[]>();
  for (const d of applyCollection(
    bundle.documents as { employeeId?: string; category?: string; name?: string; status?: string }[],
    "documents",
    edits,
  )) {
    if (!d.employeeId) continue;
    const list = docs.get(d.employeeId) ?? [];
    list.push(d);
    docs.set(d.employeeId, list);
  }
  return {
    docs,
    education: countBy(bundle.education ?? [], "education"),
    memberships: countBy(bundle.professionalMemberships ?? [], "professionalMemberships"),
    skills: countBy(bundle.employeeSkills ?? [], "employeeSkills"),
    languages: countBy(bundle.employeeLanguages ?? [], "employeeLanguages"),
  };
}

function scoreFor(
  employee: LocaleEmployee,
  country: CountryKey,
  idx: ReturnType<typeof completionIndex>,
): ProfileCompletion {
  return profileCompletion({
    employee,
    country,
    documents: idx.docs.get(employee.id) ?? [],
    educationCount: idx.education.get(employee.id) ?? 0,
    membershipCount: idx.memberships.get(employee.id) ?? 0,
    skillCount: idx.skills.get(employee.id) ?? 0,
    languageCount: idx.languages.get(employee.id) ?? 0,
  });
}

/** One employee's completion score, reflecting pending profile and record edits. */
export function useProfileCompletion(employeeId: string): ProfileCompletion | null {
  const edits = useAppSelector((s) => s.collectionEdits);
  const overrides = useAppSelector((s) => s.profileEdits.overrides[employeeId]);
  const country = useAppSelector((s) => s.locale.country);
  const { data: bundle } = useUnscopedLocaleSection<LocaleBundle>((b) => b);
  return useMemo(() => {
    if (!bundle) return null;
    const emp = bundle.employees.find((e) => e.id === employeeId);
    if (!emp) return null;
    return scoreFor(applyEmployeeOverrides(emp, overrides), country, completionIndex(bundle, edits));
  }, [bundle, edits, overrides, country, employeeId]);
}

export interface EmployeeCompletionRow {
  employee: LocaleEmployee;
  completion: ProfileCompletion;
}

/** Data quality across current employees in the viewer's scope — the HR dashboard KPI. */
export function useWorkforceDataQuality(): {
  summary: DataQualitySummary;
  rows: EmployeeCompletionRow[];
} | null {
  const edits = useAppSelector((s) => s.collectionEdits);
  const allOverrides = useAppSelector((s) => s.profileEdits.overrides);
  const country = useAppSelector((s) => s.locale.country);
  const { data: bundle } = useLocaleSection<LocaleBundle>((b) => b);
  return useMemo(() => {
    if (!bundle) return null;
    const idx = completionIndex(bundle, edits);
    const rows = bundle.employees
      .filter((e) => e.status !== "terminated")
      .map((e) => {
        const employee = applyEmployeeOverrides(e, allOverrides[e.id]);
        return { employee, completion: scoreFor(employee, country, idx) };
      })
      .sort((a, b) => a.completion.score - b.completion.score);
    return { summary: summariseDataQuality(rows.map((r) => r.completion)), rows };
  }, [bundle, edits, allOverrides, country]);
}
