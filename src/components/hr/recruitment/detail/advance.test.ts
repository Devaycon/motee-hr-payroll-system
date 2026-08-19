import { describe, expect, it } from "vitest";
import { canMoveTo } from "./advance";
import { defaultFlow } from "@/src/data/recruitment-demo";
import type {
  Candidate,
  CandidateOffer,
  RecruitmentStageType,
  Scorecard,
} from "@/src/lib/types/recruitment";

const flow = defaultFlow();

function scorecard(overall = 4): Scorecard {
  return {
    id: "SC-1",
    by: "Recruiter",
    at: "2026-08-17",
    criteria: [{ label: "Interview", score: overall }],
    overall,
    comment: "Answered well on the system design question.",
    recommendation: "yes",
  };
}

function offer(status: CandidateOffer["status"]): CandidateOffer {
  return { id: "OF-1", at: "2026-08-17", status };
}

function candidate(over: Partial<Candidate> = {}): Candidate {
  return {
    id: "C-1",
    requisitionId: "R-1",
    requisitionTitle: "Engineer",
    name: "Mia Green",
    initials: "MG",
    email: "mia.green@example.com",
    source: "referral",
    stage: "applicants",
    status: "active",
    appliedAt: "2026-04-23",
    updatedAt: "2026-04-23",
    skills: [],
    scorecards: [],
    communications: [],
    offers: [],
    attachments: [],
    score: null,
    ...over,
  };
}

/** A candidate who has been interviewed and rated. */
function scored(stage: RecruitmentStageType = "interview"): Candidate {
  return candidate({ stage, scorecards: [scorecard()], score: 4 });
}

describe("pipeline shape", () => {
  it("runs Applicant → Scheduled for Interview → Interviewed → Offer → Hired", () => {
    expect(flow.stages.filter((s) => s.enabled).map((s) => s.type)).toEqual([
      "applicants",
      "interview",
      "interviewed",
      "offer",
      "hired",
    ]);
  });
});

describe("the score gate", () => {
  it("refuses to move an unscored candidate out of scheduled-for-interview", () => {
    const verdict = canMoveTo(
      candidate({ stage: "interview" }),
      "interviewed",
      flow,
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toMatch(/score/i);
  });

  it("allows the move once a score has been recorded", () => {
    expect(canMoveTo(scored(), "interviewed", flow).ok).toBe(true);
  });

  it("is not satisfied by a scorecard that produced no overall score", () => {
    const c = candidate({
      stage: "interview",
      scorecards: [scorecard()],
      score: null,
    });
    expect(canMoveTo(c, "interviewed", flow).ok).toBe(false);
  });
});

describe("the offer gate", () => {
  it("refuses to hire someone who was never sent an offer", () => {
    const verdict = canMoveTo(scored("offer"), "hired", flow);
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toMatch(/hasn't been sent an offer/i);
  });

  it("refuses to hire someone whose offer is still outstanding", () => {
    const c = candidate({
      stage: "offer",
      scorecards: [scorecard()],
      score: 4,
      offers: [offer("sent")],
    });
    const verdict = canMoveTo(c, "hired", flow);
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toMatch(/hasn't accepted/i);
  });

  it("refuses to hire someone who declined, and says so plainly", () => {
    const c = candidate({
      stage: "offer",
      scorecards: [scorecard()],
      score: 4,
      offers: [offer("rejected")],
    });
    const verdict = canMoveTo(c, "hired", flow);
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toMatch(/declined/i);
  });

  it("allows the hire once the offer comes back accepted", () => {
    const c = candidate({
      stage: "offer",
      scorecards: [scorecard()],
      score: 4,
      offers: [offer("accepted")],
    });
    expect(canMoveTo(c, "hired", flow).ok).toBe(true);
  });

  it("holds the line when a card is dragged straight to hired", () => {
    // The board can drop onto any column, so the gate must not rely on the
    // candidate having walked the stages in order.
    const c = candidate({ stage: "applicants", offers: [offer("sent")] });
    expect(canMoveTo(c, "hired", flow).ok).toBe(false);
  });
});

describe("stage ordering", () => {
  it("refuses to skip a stage", () => {
    const verdict = canMoveTo(
      candidate({ stage: "applicants" }),
      "interviewed",
      flow,
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toMatch(/first/i);
  });

  it("refuses to move a rejected candidate anywhere", () => {
    const c = candidate({ stage: "interview", status: "rejected" });
    expect(canMoveTo(c, "interviewed", flow).ok).toBe(false);
  });

  it("refuses a move into the stage the candidate is already in", () => {
    expect(canMoveTo(candidate(), "applicants", flow).ok).toBe(false);
  });

  it("refuses a stage the requisition has switched off", () => {
    const noInterviewed = {
      stages: flow.stages.map((s) =>
        s.type === "interviewed" ? { ...s, enabled: false } : s,
      ),
    };
    const verdict = canMoveTo(scored(), "interviewed", noInterviewed);
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toMatch(/not enabled/i);
  });
});
