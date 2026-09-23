import { describe, expect, it } from "vitest";
import {
  buildStageFacts,
  findHiringDetail,
  resolveHiringRows,
  type HiringSources,
} from "./resolve-stage";
import type { WorkforceRequest } from "@/src/lib/stores/workforce-requests-slice";
import type { Requisition } from "@/src/lib/stores/requisitions-slice";
import type { Candidate, JobRequisition } from "@/src/lib/types/recruitment";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";

const NOW = new Date("2026-03-10T09:00:00Z");

function wfr(over: Partial<WorkforceRequest> & { id: string }): WorkforceRequest {
  return {
    department: "Engineering",
    numberOfHires: 3,
    budgetEstimate: 24_000_000,
    createdByName: "Ifeoma Nwosu",
    createdAt: "2026-03-01",
    status: "draft",
    ...over,
  } as WorkforceRequest;
}

function requisition(over: Partial<Requisition> & { id: string }): Requisition {
  return {
    title: "Senior Engineer",
    department: "Engineering",
    numberOfPositions: 2,
    createdAt: "2026-03-02",
    createdByName: "Ifeoma Nwosu",
    reportingManager: "Tunde Bello",
    status: "draft",
    lifecycleStatus: "active",
    ...over,
  } as Requisition;
}

function vacancy(over: Partial<JobRequisition> & { id: string }): JobRequisition {
  return {
    positionTitle: "Senior Engineer",
    department: "Engineering",
    hiringManager: "Tunde Bello",
    status: "open",
    openings: 2,
    createdAt: "2026-03-03",
    ...over,
  } as JobRequisition;
}

function candidate(
  over: Partial<Candidate> & { id: string; requisitionId: string },
): Candidate {
  return {
    name: "Chidi Okonkwo",
    stage: "applicants",
    status: "active",
    updatedAt: "2026-03-08",
    ...over,
  } as Candidate;
}

function record(
  over: Partial<OnboardingRecord> & { id: string },
): OnboardingRecord {
  return {
    employeeName: "Ngozi Eze",
    jobTitle: "Operations Associate",
    department: "Operations",
    startDate: "2026-03-01",
    stage: "day_one",
    status: "in_progress",
    tasks: [],
    completedTasks: 0,
    totalTasks: 0,
    welcomeEmailSent: false,
    initiatedAt: "2026-02-20",
    ...over,
  } as OnboardingRecord;
}

function sources(over: Partial<HiringSources> = {}): HiringSources {
  return {
    workforceRequests: [],
    requisitions: [],
    vacancies: [],
    candidates: [],
    onboarding: [],
    ...over,
  };
}

describe("findHiringDetail chain linking", () => {
  it("does not attach an unrelated workforce request to a standalone hire", () => {
    // The bug: `find((w) => w.requisitionId === requisition?.id)` with no
    // requisition collapses to `=== undefined` and matches any unconverted
    // request - putting a stranger's headcount and budget on this hire.
    const src = sources({
      workforceRequests: [wfr({ id: "WFR-1" })],
      onboarding: [record({ id: "onb-manual-1" })],
    });
    const detail = findHiringDetail(src, "onb-manual-1", NOW);
    expect(detail).not.toBeNull();
    expect(detail!.workforceRequest).toBeUndefined();
    expect(detail!.requisition).toBeUndefined();
    expect(detail!.vacancy).toBeUndefined();
  });

  it("does not attach an unconverted requisition to a vacancy-less row", () => {
    const src = sources({
      requisitions: [requisition({ id: "REQ-1" })],
      onboarding: [record({ id: "onb-manual-1" })],
    });
    const detail = findHiringDetail(src, "onb-manual-1", NOW);
    expect(detail!.requisition).toBeUndefined();
  });

  it("still walks a genuine chain all the way back", () => {
    const src = sources({
      workforceRequests: [wfr({ id: "WFR-1", requisitionId: "REQ-1" })],
      requisitions: [
        requisition({ id: "REQ-1", workforceRequestId: "WFR-1", recruitmentId: "REC-1" }),
      ],
      vacancies: [vacancy({ id: "REC-1", sourceRequisitionId: "REQ-1" })],
    });
    const detail = findHiringDetail(src, "REC-1", NOW);
    expect(detail!.vacancy?.id).toBe("REC-1");
    expect(detail!.requisition?.id).toBe("REQ-1");
    expect(detail!.workforceRequest?.id).toBe("WFR-1");
  });
});

describe("buildStageFacts", () => {
  it("marks stages that never happened as skipped, not done", () => {
    const src = sources({
      onboarding: [record({ id: "onb-manual-1" })],
    });
    const detail = findHiringDetail(src, "onb-manual-1", NOW)!;
    const facts = buildStageFacts(detail);
    const byId = Object.fromEntries(facts.map((f) => [f.id, f]));

    // The row sits at stage 6, but nothing upstream of it ever existed.
    expect(byId["workforce-planning"].state).toBe("skipped");
    expect(byId.requisition.state).toBe("skipped");
    expect(byId.attract.state).toBe("skipped");
    expect(byId.select.state).toBe("skipped");
    expect(byId.onboard.state).toBe("current");
  });

  it("gives a skipped stage no owner and no link to open", () => {
    const src = sources({ onboarding: [record({ id: "onb-manual-1" })] });
    const facts = buildStageFacts(findHiringDetail(src, "onb-manual-1", NOW)!);
    const requisitionFact = facts.find((f) => f.id === "requisition")!;
    expect(requisitionFact.owner).toBeUndefined();
    expect(requisitionFact.href).toBeUndefined();
  });

  it("marks stages that did happen as done", () => {
    const src = sources({
      workforceRequests: [wfr({ id: "WFR-1", requisitionId: "REQ-1" })],
      requisitions: [
        requisition({ id: "REQ-1", workforceRequestId: "WFR-1", recruitmentId: "REC-1" }),
      ],
      vacancies: [vacancy({ id: "REC-1", sourceRequisitionId: "REQ-1" })],
      candidates: [
        candidate({ id: "C-1", requisitionId: "REC-1", stage: "interview" }),
      ],
    });
    const facts = buildStageFacts(findHiringDetail(src, "REC-1", NOW)!);
    const byId = Object.fromEntries(facts.map((f) => [f.id, f]));
    expect(byId["workforce-planning"].state).toBe("done");
    expect(byId.requisition.state).toBe("done");
    expect(byId.attract.state).toBe("done");
    expect(byId.select.state).toBe("current");
    expect(byId["pre-employment"].state).toBe("upcoming");
  });
});

describe("resolveHiringRows", () => {
  it("lists a converted workforce request once, as its vacancy", () => {
    const src = sources({
      workforceRequests: [
        wfr({ id: "WFR-1", requisitionId: "REQ-1", status: "converted" }),
      ],
      requisitions: [requisition({ id: "REQ-1", recruitmentId: "REC-1" })],
      vacancies: [vacancy({ id: "REC-1", sourceRequisitionId: "REQ-1" })],
    });
    const rows = resolveHiringRows(src, NOW);
    expect(rows.map((r) => r.id)).toEqual(["REC-1"]);
  });
});
