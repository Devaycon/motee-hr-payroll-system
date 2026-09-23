import { describe, expect, it } from "vitest";
import {
  buildChainForOnboarding,
  buildHiringChain,
  isSyntheticVacancyId,
  requisitionIdFor,
  workforceRequestIdFor,
} from "./hiring-chain";
import {
  buildStageFacts,
  findHiringDetail,
  resolveHiringRows,
} from "@/src/lib/hiring/resolve-stage";
import type { JobRequisition } from "@/src/lib/types/recruitment";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";

function vacancy(over: Partial<JobRequisition> & { id: string }): JobRequisition {
  return {
    positionTitle: "Senior Engineer",
    department: "Engineering",
    hiringManager: "Tunde Bello",
    status: "open",
    openings: 2,
    salaryMin: 6_000_000,
    salaryMax: 9_000_000,
    jobDescription: "Build things.",
    targetStartDate: "2026-04-01",
    createdAt: "2026-03-03",
    ...over,
  } as JobRequisition;
}

describe("buildHiringChain", () => {
  it("gives every unlinked vacancy a requisition and a workforce request", () => {
    const chain = buildHiringChain([vacancy({ id: "REC-1" })]);
    expect(chain.requisitions).toHaveLength(1);
    expect(chain.workforceRequests).toHaveLength(1);
    expect(chain.vacancies[0].sourceRequisitionId).toBe(requisitionIdFor("REC-1"));
    expect(chain.requisitions[0].workforceRequestId).toBe(
      workforceRequestIdFor("REC-1"),
    );
    expect(chain.requisitions[0].recruitmentId).toBe("REC-1");
    expect(chain.workforceRequests[0].requisitionId).toBe(requisitionIdFor("REC-1"));
  });

  it("is idempotent, so patching then back-filling produces the same records", () => {
    const first = buildHiringChain([vacancy({ id: "REC-1" })]);
    const second = buildHiringChain(first.vacancies);
    expect(second.requisitions).toEqual(first.requisitions);
    expect(second.workforceRequests).toEqual(first.workforceRequests);
    expect(second.vacancies).toEqual(first.vacancies);
  });

  it("leaves a vacancy that already belongs to a real chain alone", () => {
    const chain = buildHiringChain([
      vacancy({ id: "REC-1", sourceRequisitionId: "REQ-REAL" }),
    ]);
    expect(chain.requisitions).toHaveLength(0);
    expect(chain.workforceRequests).toHaveLength(0);
    expect(chain.vacancies[0].sourceRequisitionId).toBe("REQ-REAL");
  });

  it("dates the ancestors before the vacancy they produced", () => {
    const chain = buildHiringChain([vacancy({ id: "REC-1" })]);
    expect(chain.workforceRequests[0].createdAt < chain.requisitions[0].createdAt).toBe(
      true,
    );
    expect(chain.requisitions[0].createdAt < "2026-03-03").toBe(true);
  });

  it("leaves no stage skipped on the tracker timeline", () => {
    const chain = buildHiringChain([vacancy({ id: "REC-1" })]);
    const detail = findHiringDetail(
      {
        workforceRequests: chain.workforceRequests,
        requisitions: chain.requisitions,
        vacancies: chain.vacancies,
        candidates: [],
        onboarding: [],
      },
      "REC-1",
      new Date("2026-03-10T09:00:00Z"),
    )!;
    const facts = buildStageFacts(detail);
    const byId = Object.fromEntries(facts.map((f) => [f.id, f.state]));
    // The three stages behind a published vacancy are now real records.
    expect(byId["workforce-planning"]).toBe("done");
    expect(byId.requisition).toBe("done");
    expect(byId.attract).toBe("current");
    // Ahead of the vacancy is "upcoming", never "skipped".
    expect(byId.select).toBe("upcoming");
    expect(byId["pre-employment"]).toBe("upcoming");
    expect(byId.onboard).toBe("upcoming");
    expect(facts.some((f) => f.state === "skipped")).toBe(false);
  });
});

function record(over: Partial<OnboardingRecord> & { id: string }): OnboardingRecord {
  return {
    employeeName: "Seun Adeyemi",
    employeeInitials: "SA",
    jobTitle: "Frontend Engineer",
    department: "Engineering",
    startDate: "2026-04-01",
    stage: "day_one",
    status: "in_progress",
    tasks: [],
    completedTasks: 0,
    totalTasks: 0,
    welcomeEmailSent: false,
    initiatedAt: "2026-03-01",
    ...over,
  } as OnboardingRecord;
}

describe("buildChainForOnboarding", () => {
  it("gives an unlinked onboarding record a full chain back to stage 1", () => {
    const chain = buildChainForOnboarding([record({ id: "onb-001" })], new Set());
    expect(chain.candidates).toHaveLength(1);
    expect(chain.vacancies).toHaveLength(1);
    expect(chain.requisitions).toHaveLength(1);
    expect(chain.workforceRequests).toHaveLength(1);
  });

  it("keys the minted candidate so the onboarding record links back to it", () => {
    const chain = buildChainForOnboarding([record({ id: "onb-001" })], new Set());
    expect(`onb-${chain.candidates[0].id}`).toBe("onb-001");
  });

  it("gives the minted hire an accepted offer, so `hired` is legitimate", () => {
    const chain = buildChainForOnboarding([record({ id: "onb-001" })], new Set());
    const candidate = chain.candidates[0];
    expect(candidate.stage).toBe("hired");
    expect(candidate.offers.some((o) => o.status === "accepted")).toBe(true);
  });

  it("mints nothing for a hire that already came through a pipeline", () => {
    const chain = buildChainForOnboarding(
      [record({ id: "onb-REAL-1" })],
      new Set(["REAL-1"]),
    );
    expect(chain.candidates).toHaveLength(0);
    expect(chain.vacancies).toHaveLength(0);
  });

  it("leaves no stage skipped for a standalone onboarding record", () => {
    const chain = buildChainForOnboarding([record({ id: "onb-001" })], new Set());
    const detail = findHiringDetail(
      {
        workforceRequests: chain.workforceRequests,
        requisitions: chain.requisitions,
        vacancies: chain.vacancies,
        candidates: chain.candidates,
        onboarding: [record({ id: "onb-001" })],
      },
      chain.vacancies[0].id,
      new Date("2026-04-05T09:00:00Z"),
    )!;
    const facts = buildStageFacts(detail);
    expect(facts.some((f) => f.state === "skipped")).toBe(false);
    // Everything up to where the hire actually is reads as genuinely done.
    expect(facts.filter((f) => f.state === "done").length).toBeGreaterThanOrEqual(5);
  });
});

describe("links out of a back-filled chain", () => {
  function syntheticSources() {
    const rec = record({ id: "onb-004" });
    const chain = buildChainForOnboarding([rec], new Set());
    return {
      chain,
      sources: {
        workforceRequests: chain.workforceRequests,
        requisitions: chain.requisitions,
        vacancies: chain.vacancies,
        candidates: chain.candidates,
        onboarding: [rec],
      },
    };
  }

  it("marks a minted vacancy as synthetic", () => {
    const { chain } = syntheticSources();
    expect(isSyntheticVacancyId(chain.vacancies[0].id)).toBe(true);
    expect(isSyntheticVacancyId("REC-0001")).toBe(false);
  });

  it("never sends a row to a recruitment page that does not exist", () => {
    // The reported bug: /talent/recruitment/REC-FOR-onb-004 renders
    // "Requisition not found", because that vacancy lives only in the tracker.
    const { sources } = syntheticSources();
    const rows = resolveHiringRows(sources, new Date("2026-04-05T09:00:00Z"));
    for (const row of rows) {
      expect(row.href).not.toContain("REC-FOR-");
    }
  });

  it("never builds a stage link to a synthetic vacancy", () => {
    const { sources, chain } = syntheticSources();
    const detail = findHiringDetail(
      sources,
      chain.vacancies[0].id,
      new Date("2026-04-05T09:00:00Z"),
    )!;
    for (const fact of buildStageFacts(detail)) {
      expect(fact.href ?? "").not.toContain("REC-FOR-");
    }
  });

  it("points a back-filled hire at its onboarding record instead", () => {
    const { sources, chain } = syntheticSources();
    const detail = findHiringDetail(
      sources,
      chain.vacancies[0].id,
      new Date("2026-04-05T09:00:00Z"),
    )!;
    const attract = buildStageFacts(detail).find((f) => f.id === "attract")!;
    expect(attract.href).toBe("/talent/onboarding/onb-004");
  });
});
