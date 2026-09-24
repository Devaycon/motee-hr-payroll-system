import { describe, expect, it } from "vitest";
import ng from "@/src/data/locale/nigeria.json";
import uk from "@/src/data/locale/uk.json";
import { profileCompletion, summariseDataQuality } from "./completion";
import type { CountryKey, LocaleBundle } from "@/src/lib/types/locale";

/**
 * The seeded tenants should demo a realistic data-quality picture: mostly
 * complete records with a few real gaps — not every profile at 100%, and not
 * a wall of red. Guards `scripts/augment-core-hr-fixtures.mjs` output.
 */
function scores(bundle: LocaleBundle, country: CountryKey) {
  const count = (rows: { employeeId?: string }[] | undefined, id: string) =>
    (rows ?? []).filter((r) => r.employeeId === id).length;
  const docs = bundle.documents as { employeeId?: string; category?: string; name?: string; status?: string }[];
  return bundle.employees
    .filter((e) => e.status !== "terminated")
    .map((e) =>
      profileCompletion({
        employee: e,
        country,
        documents: docs.filter((d) => d.employeeId === e.id),
        educationCount: count(bundle.education, e.id),
        membershipCount: count(bundle.professionalMemberships, e.id),
        skillCount: count(bundle.employeeSkills, e.id),
        languageCount: count(bundle.employeeLanguages, e.id),
      }),
    );
}

describe.each([
  ["nigeria", ng, "ng"],
  ["uk", uk, "uk"],
] as const)("%s fixture data quality", (_name, bundle, country) => {
  it("averages a realistic completion score with some profiles missing items", () => {
    const results = scores(bundle as unknown as LocaleBundle, country);
    const summary = summariseDataQuality(results);
    expect(summary.averageCompletion).toBeGreaterThanOrEqual(75);
    expect(summary.averageCompletion).toBeLessThan(100);
    expect(results.some((r) => r.missing.length > 0)).toBe(true);
  });
});
