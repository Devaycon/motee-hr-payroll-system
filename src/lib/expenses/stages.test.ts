import { describe, expect, it } from "vitest";
import type {
  ApprovalChainTemplate,
  ApproverResolver,
} from "@/src/lib/types/approvals";
import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";
import {
  claimStagesReached,
  currentExpenseStage,
  expenseStagesForTemplate,
  expenseStatusLabel,
  expenseTrackLabels,
  inferStageIndexFromStatus,
  isClaimOpen,
  nextExpenseStatus,
  statusForStageIndex,
} from "./stages";

function template(labels: string[]): ApprovalChainTemplate {
  return {
    id: "ACT-TEST",
    documentType: "expense_claim",
    name: "Test chain",
    isDefault: true,
    kind: "custom",
    startDesk: { kind: "submitter" },
    endDesk: { kind: "approved" },
    steps: labels.map((label, i) => ({
      id: `step-${i}`,
      order: i + 1,
      label,
      approver: "LINE_MANAGER" as ApproverResolver,
      required: true,
      onLeaveAction: { kind: "skip" as const },
    })),
    attachments: { allowed: true, required: true },
    signatures: {
      submitterSigns: false,
      reviewerSigns: true,
      placeOnDocument: false,
    },
    lastModifiedBy: "test",
    lastModifiedAt: "2026-01-01T00:00:00.000Z",
  };
}

const stagesOf = (n: number) =>
  expenseStagesForTemplate(
    template(Array.from({ length: n }, (_, i) => `Stage ${i + 1}`)),
    () => "Approver",
  );

function claim(patch: Partial<ExpenseClaim> = {}): ExpenseClaim {
  return {
    id: "exp-test",
    title: "Test claim",
    category: "travel",
    amount: 1000,
    dateSubmitted: "2026-04-01",
    status: "submitted",
    merchant: "Test Co",
    ...patch,
  };
}

describe("statusForStageIndex", () => {
  it("enters at submitted and clears to reimbursed for a one-step chain", () => {
    // Stage 0 is both first and last; first-pending wins, so a claim nobody
    // has looked at never shows "Approved".
    expect(statusForStageIndex(0, 1)).toBe("submitted");
    expect(statusForStageIndex(1, 1)).toBe("reimbursed");
  });

  it("treats the last step as the pay-out for a two-step chain", () => {
    expect(statusForStageIndex(0, 2)).toBe("submitted");
    expect(statusForStageIndex(1, 2)).toBe("approved");
    expect(statusForStageIndex(2, 2)).toBe("reimbursed");
  });

  it("keeps middle stages in review for longer chains", () => {
    expect([0, 1, 2, 3].map((i) => statusForStageIndex(i, 3))).toEqual([
      "submitted",
      "submitted",
      "approved",
      "reimbursed",
    ]);
    expect([0, 1, 2, 3, 4].map((i) => statusForStageIndex(i, 4))).toEqual([
      "submitted",
      "submitted",
      "submitted",
      "approved",
      "reimbursed",
    ]);
  });

  it("maps a negative index to draft", () => {
    expect(statusForStageIndex(-1, 2)).toBe("draft");
  });
});

describe("expenseStagesForTemplate", () => {
  it("falls back to the default chain when none is configured", () => {
    const stages = expenseStagesForTemplate(undefined, () => "x");
    expect(stages).toHaveLength(2);
    expect(stages[0].approver).toBe("LINE_MANAGER");
    expect(stages[1].approver).toBe("ROLE:ROLE-FIN");
  });

  it("orders stages by the template's step order", () => {
    const t = template(["Second", "First"]);
    t.steps[0].order = 2;
    t.steps[1].order = 1;
    const stages = expenseStagesForTemplate(t, () => "x");
    expect(stages.map((s) => s.label)).toEqual(["First", "Second"]);
    expect(stages.map((s) => s.index)).toEqual([0, 1]);
  });
});

describe("nextExpenseStatus", () => {
  it("walks a two-step chain to reimbursed", () => {
    const stages = stagesOf(2);
    expect(nextExpenseStatus(0, stages)).toBe("approved");
    expect(nextExpenseStatus(1, stages)).toBe("reimbursed");
  });
});

describe("currentExpenseStage", () => {
  it("clamps when the chain has been shortened under a live claim", () => {
    // HR edits a 4-step chain down to 2 while a claim sits at stage 3.
    const stages = stagesOf(2);
    const stage = currentExpenseStage(claim({ stageIndex: 3 }), stages);
    expect(stage?.index).toBe(1);
  });

  it("returns nothing for a draft", () => {
    expect(currentExpenseStage(claim({ status: "draft", stageIndex: -1 }), stagesOf(2))).toBeNull();
  });

  it("still reports the stage a rejection halted at", () => {
    const stage = currentExpenseStage(
      claim({ status: "rejected", stageIndex: 1 }),
      stagesOf(2),
    );
    expect(stage?.index).toBe(1);
  });
});

describe("claimStagesReached", () => {
  const stages = stagesOf(2);

  it("counts submission plus each stage cleared", () => {
    expect(claimStagesReached(claim({ status: "draft" }), stages)).toBe(0);
    expect(claimStagesReached(claim({ stageIndex: 0 }), stages)).toBe(1);
    expect(
      claimStagesReached(claim({ status: "approved", stageIndex: 1 }), stages),
    ).toBe(2);
    expect(
      claimStagesReached(claim({ status: "reimbursed", stageIndex: 2 }), stages),
    ).toBe(3);
  });

  it("never exceeds the track length", () => {
    expect(
      claimStagesReached(claim({ status: "approved", stageIndex: 9 }), stages),
    ).toBe(3);
  });
});

describe("expenseTrackLabels", () => {
  it("puts submission before the chain's own stages", () => {
    expect(expenseTrackLabels(stagesOf(2))).toEqual([
      "Submitted",
      "Stage 1",
      "Stage 2",
    ]);
  });
});

describe("inferStageIndexFromStatus", () => {
  it("places legacy claims sensibly in a two-step chain", () => {
    expect(inferStageIndexFromStatus("draft", 2)).toBe(-1);
    expect(inferStageIndexFromStatus("submitted", 2)).toBe(0);
    expect(inferStageIndexFromStatus("approved", 2)).toBe(1);
    expect(inferStageIndexFromStatus("reimbursed", 2)).toBe(2);
  });

  it("round-trips through statusForStageIndex for chains that can express the status", () => {
    for (const total of [2, 3, 4]) {
      for (const status of ["submitted", "approved", "reimbursed"] as const) {
        const idx = inferStageIndexFromStatus(status, total);
        expect(statusForStageIndex(idx, total)).toBe(status);
      }
    }
  });

  it("demotes rather than promotes an approved claim under a one-step chain", () => {
    // A one-step chain has no "approved" state — its single stage clears
    // straight to reimbursed. A legacy approved claim therefore lands on the
    // pending stage, never on "paid": inventing a payment would be worse than
    // asking someone to press approve again. Its stored status is untouched.
    expect(inferStageIndexFromStatus("approved", 1)).toBe(0);
    expect(statusForStageIndex(0, 1)).toBe("submitted");
  });
});

describe("isClaimOpen / expenseStatusLabel", () => {
  it("counts only in-chain claims as open", () => {
    expect(isClaimOpen("submitted")).toBe(true);
    expect(isClaimOpen("approved")).toBe(true);
    expect(isClaimOpen("draft")).toBe(false);
    expect(isClaimOpen("rejected")).toBe(false);
    expect(isClaimOpen("reimbursed")).toBe(false);
  });

  it("labels a returned draft distinctly from one the employee parked", () => {
    expect(expenseStatusLabel(claim({ status: "draft" }))).toBe("Draft");
    expect(
      expenseStatusLabel(claim({ status: "draft", returned: true })),
    ).toBe("Returned");
  });
});
