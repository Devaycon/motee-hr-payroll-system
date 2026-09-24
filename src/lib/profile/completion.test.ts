import { describe, expect, it } from "vitest";
import { profileCompletion, summariseDataQuality } from "./completion";
import type { LocaleEmployee } from "@/src/lib/types/locale";

const complete = {
  id: "E1",
  phone: "+44 7000",
  personalEmail: "e1@example.com",
  dateOfBirth: "1990-01-01",
  gender: "female",
  nationality: "British",
  maritalStatus: "single",
  address: { line1: "1 High St", city: "Leeds" },
  emergencyContact: { name: "Sam", relationship: "partner", phone: "1" },
  bankDetails: { accountNumber: "12345678" },
  identifiers: { nationalInsuranceNumber: "AB123456C", taxCode: "1257L" },
} as unknown as LocaleEmployee;

const docs = [
  { category: "identity", name: "Passport", status: "verified" },
  { category: "right_to_work", name: "Share code", status: "verified" },
  { category: "proof_of_address", name: "Utility bill", status: "verified" },
  { category: "education", name: "Degree Certificate", status: "verified" },
];

const counts = { educationCount: 1, membershipCount: 1, skillCount: 3, languageCount: 1 };

describe("profileCompletion", () => {
  it("scores a fully documented UK profile at 100%", () => {
    const r = profileCompletion({ employee: complete, country: "uk", documents: docs, ...counts });
    expect(r.score).toBe(100);
    expect(r.missing).toEqual([]);
  });

  it("names each missing item and the module that fixes it", () => {
    const r = profileCompletion({
      employee: complete,
      country: "uk",
      // A rejected document is not evidence.
      documents: docs.map((d) =>
        d.category === "education" ? { ...d, status: "rejected" } : d,
      ),
      ...counts,
      membershipCount: 0,
    });
    expect(r.missing.map((m) => [m.label, m.module])).toEqual([
      ["Degree certificate", "documents"],
      ["Professional membership", "qualifications"],
    ]);
    expect(r.score).toBe(Math.round((r.checks.length - 2) / r.checks.length * 100));
  });

  it("applies Nigerian requirements — NIN/BVN/TIN/pension and two guarantors", () => {
    const r = profileCompletion({ employee: complete, country: "ng", documents: docs, ...counts });
    const missing = r.missing.map((m) => m.key);
    expect(missing).toContain("tax-ids");
    expect(missing).toContain("guarantors");
    expect(missing).not.toContain("doc-rtw");
  });
});

describe("summariseDataQuality", () => {
  it("averages scores and counts profiles below target or missing documents", () => {
    const mk = (score: number, isDocument = false) => ({
      score,
      checks: [],
      missing:
        score < 100 ? [{ key: "k", label: "l", module: "m", done: false, isDocument }] : [],
    });
    expect(summariseDataQuality([mk(100), mk(70, true), mk(85)])).toEqual({
      profiles: 3,
      averageCompletion: 85,
      belowTarget: 1,
      missingDocuments: 1,
    });
  });
});
