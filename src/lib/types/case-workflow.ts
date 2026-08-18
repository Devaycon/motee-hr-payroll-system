import type { CaseComplaintType, CaseStage, ERCase } from "./grievance";

/**
 * Per-case-type workflows and stage gating (client feedback §5.2, §5.12).
 *
 * Previously every case type walked the same eight stages and any stage chip
 * was clickable, so a case could jump from Raised straight to Closed with no
 * investigation recorded. Two changes fix that: each type declares the stages
 * it actually uses, and each stage declares what must be filled in before the
 * case can move past it.
 */

/** The full linear stage order; a type's flow is a subset of this. */
const FULL_FLOW: CaseStage[] = [
  "raised",
  "triage",
  "assigned",
  "investigation",
  "hearing",
  "outcome_issued",
  "appeal",
  "closed",
];

/**
 * Stages per case type. A performance or absence case has no formal hearing,
 * and an appeal case starts at appeal — forcing them through the disciplinary
 * flow is what made the stage tracker meaningless.
 */
const FLOWS: Partial<Record<CaseComplaintType, CaseStage[]>> = {
  absence_management: [
    "raised",
    "triage",
    "assigned",
    "investigation",
    "outcome_issued",
    "closed",
  ],
  performance_improvement: [
    "raised",
    "triage",
    "assigned",
    "outcome_issued",
    "closed",
  ],
  capability: [
    "raised",
    "triage",
    "assigned",
    "investigation",
    "hearing",
    "outcome_issued",
    "closed",
  ],
  appeal: ["raised", "assigned", "appeal", "outcome_issued", "closed"],
  investigation: [
    "raised",
    "triage",
    "assigned",
    "investigation",
    "outcome_issued",
    "closed",
  ],
  whistleblowing: [
    "raised",
    "triage",
    "assigned",
    "investigation",
    "outcome_issued",
    "closed",
  ],
  health_safety: [
    "raised",
    "triage",
    "assigned",
    "investigation",
    "outcome_issued",
    "closed",
  ],
};

/** The stages this case actually moves through. */
export function stagesForCase(type: CaseComplaintType): CaseStage[] {
  return FLOWS[type] ?? FULL_FLOW;
}

export interface StageGate {
  /** Why the case can't move on yet. Empty means it can. */
  blockers: string[];
}

/**
 * §5.12 — what must be recorded before a case leaves `stage`. Returning the
 * reasons rather than a bare boolean lets the UI say what's actually missing.
 */
export function stageGate(c: ERCase, stage: CaseStage): StageGate {
  const blockers: string[] = [];

  switch (stage) {
    case "raised":
      if (!c.description?.trim()) blockers.push("Add a case description");
      if (!c.complaintType) blockers.push("Set the case type");
      break;
    case "triage":
      if (!c.priority) blockers.push("Set a priority");
      if (!c.targetResolutionDate)
        blockers.push("Set a target resolution date");
      break;
    case "assigned":
      if (!c.assignedTo) blockers.push("Assign an investigator");
      if (!c.caseOwner) blockers.push("Name a case owner");
      break;
    case "investigation":
      if ((c.witnesses?.length ?? 0) === 0 && (c.evidence?.length ?? 0) === 0) {
        blockers.push("Record at least one witness statement or piece of evidence");
      }
      break;
    case "hearing":
      if (!c.hearingDate) blockers.push("Record the hearing date");
      if ((c.hearingPanel?.length ?? 0) === 0)
        blockers.push("Record who sat on the hearing panel");
      break;
    case "outcome_issued":
      if (!c.outcome) blockers.push("Record the outcome");
      if (!c.outcomeDate) blockers.push("Record the outcome date");
      break;
    case "appeal":
      if (!c.appealGrounds?.trim())
        blockers.push("Record the grounds of appeal");
      break;
    case "closed":
      break;
  }

  return { blockers };
}

/**
 * Whether the case may move to `target`. Moving backwards is always allowed —
 * correcting a mis-click shouldn't require satisfying gates you've passed.
 */
export function canAdvanceTo(
  c: ERCase,
  target: CaseStage,
): { allowed: boolean; blockers: string[] } {
  const flow = stagesForCase(c.complaintType);
  const from = flow.indexOf(c.stage);
  const to = flow.indexOf(target);

  if (to === -1) {
    return {
      allowed: false,
      blockers: [`This case type has no "${target}" stage`],
    };
  }
  if (to <= from) return { allowed: true, blockers: [] };

  // Every stage between here and the target has to be satisfied — no skipping.
  const blockers: string[] = [];
  for (let i = from; i < to; i++) {
    blockers.push(...stageGate(c, flow[i]).blockers);
  }
  return { allowed: blockers.length === 0, blockers };
}
