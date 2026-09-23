import { describe, expect, it } from "vitest";
import { seedBucketFromBundle } from "./recruitment-slice";
import type { LocaleBundle } from "@/src/lib/types/locale";

/**
 * A bundle with two job postings and applicants on each, so the seed exercises
 * both candidate paths: the ones mapped from the bundle and the synthetic ones
 * generated to fill a pipeline.
 */
function bundle(): LocaleBundle {
  return {
    tenant: { createdAt: "2026-01-01T00:00:00.000Z" },
    employees: [
      { id: "E-1", fullName: "Charlie Khan" },
      { id: "E-2", fullName: "Adaeze Eze" },
    ],
    departments: [{ id: "D-1", name: "Engineering" }],
    roles: [{ id: "ROLE-RECRUIT", name: "Recruiter", linkedEmployeeId: "E-2" }],
    recruitment: {
      jobPostings: [
        {
          id: "REC-1",
          title: "Senior Backend Engineer",
          departmentId: "D-1",
          hiringManagerId: "E-1",
          openings: 2,
          status: "open",
        },
        {
          id: "REC-2",
          title: "Product Designer",
          departmentId: "D-1",
          hiringManagerId: "E-1",
          openings: 1,
          status: "open",
        },
      ],
      candidates: [
        { id: "CAND-1", fullName: "Oliver Patel", jobPostingId: "REC-1", stage: "applied" },
        { id: "CAND-2", fullName: "Harry Davies", jobPostingId: "REC-1", stage: "hired" },
        { id: "CAND-3", fullName: "Sophie Taylor", jobPostingId: "REC-2", stage: "hired" },
      ],
    },
  } as unknown as LocaleBundle;
}

describe("seedBucketFromBundle", () => {
  it("gives every candidate an owner", () => {
    // The reported bug: only synthetic candidates got one, so the pipeline
    // read "Unassigned" for almost everybody.
    const bucket = seedBucketFromBundle(bundle());
    expect(bucket.candidates.length).toBeGreaterThan(0);
    for (const candidate of bucket.candidates) {
      expect(candidate.ownerName, `${candidate.name} has no owner`).toBeTruthy();
      expect(candidate.ownerEmployeeId).toBeTruthy();
    }
  });

  it("gives applicants to the recruiter, not the hiring manager", () => {
    const bucket = seedBucketFromBundle(bundle());
    const owners = new Set(bucket.candidates.map((c) => c.ownerName));
    expect(owners).toEqual(new Set(["Adaeze Eze"]));
  });

  it("puts a recruiter on every seeded vacancy", () => {
    const bucket = seedBucketFromBundle(bundle());
    for (const requisition of bucket.requisitions) {
      expect(requisition.recruiterId).toBe("E-2");
    }
  });

  it("never seats more hires than a requisition has openings", () => {
    const bucket = seedBucketFromBundle(bundle());
    for (const requisition of bucket.requisitions) {
      const hired = bucket.candidates.filter(
        (c) => c.requisitionId === requisition.id && c.stage === "hired",
      ).length;
      expect(hired, `${requisition.positionTitle} over-hired`).toBeLessThanOrEqual(
        requisition.openings,
      );
    }
  });

  it("leaves a surplus hire at offer with an unaccepted offer", () => {
    // REC-2 has one opening; the synthetic generator may add a hire on top of
    // the bundle's, and the surplus must not keep an acceptance it no longer
    // has a seat for.
    const bucket = seedBucketFromBundle(bundle());
    for (const candidate of bucket.candidates) {
      if (candidate.stage === "offer") {
        expect(candidate.offers.every((o) => o.status !== "accepted")).toBe(true);
      }
    }
  });

  it("links every vacancy back to a requisition", () => {
    const bucket = seedBucketFromBundle(bundle());
    for (const requisition of bucket.requisitions) {
      expect(requisition.sourceRequisitionId).toBeTruthy();
    }
  });
});
