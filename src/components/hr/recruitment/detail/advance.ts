import type {
  Candidate,
  RecruitmentStageType,
  RequisitionFlow,
} from "@/src/lib/types/recruitment";
import {
  hasAcceptedOffer,
  hasDeclinedOffer,
  hasInterviewScore,
  latestOffer,
} from "@/src/lib/types/recruitment";
import { STAGE_TYPE_LABELS } from "@/src/data/recruitment-demo";
import { progressionStages } from "../flow";

export interface MoveVerdict {
  ok: boolean;
  /** Why the move was refused — shown to the user verbatim. */
  reason?: string;
}

/**
 * How much room is left on the requisition.
 *
 * Passed in rather than derived here so this stays a pure function of the
 * candidate and the rules, and so a bulk advance can count the people it is
 * about to hire as it goes instead of re-reading a store mid-loop.
 */
export interface HiringCapacity {
  /** Positions the requisition was approved for. */
  openings: number;
  /** Candidates already sitting in `hired`. */
  hired: number;
}

const OK: MoveVerdict = { ok: true };

/**
 * Whether a candidate may be moved into `to`.
 *
 * The stage table enforced these rules inside its own handlers, which was fine
 * while the table was the only way to move anyone. The board can drop a card
 * into any column, so the rules had to come out of the handlers and into one
 * place both surfaces call — otherwise drag-and-drop quietly becomes a way
 * around the offer gate.
 */
export function canMoveTo(
  candidate: Candidate,
  to: RecruitmentStageType,
  flow: RequisitionFlow,
  capacity?: HiringCapacity,
): MoveVerdict {
  const from = candidate.stage;
  if (from === to) return { ok: false, reason: "Already in this stage." };

  if (candidate.status === "rejected") {
    return {
      ok: false,
      reason: `${candidate.name} is rejected. Restore them first.`,
    };
  }

  const order = progressionStages(flow);
  if (!order.includes(to)) {
    return {
      ok: false,
      reason: `${STAGE_TYPE_LABELS[to]} is not enabled for this requisition.`,
    };
  }

  const fromIdx = order.indexOf(from);
  const toIdx = order.indexOf(to);

  // Skipping ahead loses the interview and offer record for that candidate.
  //
  // Checked before the per-stage gates below so the message names the real
  // problem: someone dragged from Applicant to Interviewed is being told to go
  // via the interview, not to score a meeting that was never scheduled.
  if (fromIdx >= 0 && toIdx > fromIdx + 1) {
    return {
      ok: false,
      reason: `Move ${candidate.name} through ${STAGE_TYPE_LABELS[order[fromIdx + 1]]} first.`,
    };
  }

  // A candidate leaves "scheduled for interview" only once someone has actually
  // rated the interview. Without this the score column on the later stages is
  // decoration — you can reach an offer having recorded nothing at all.
  if (to === "interviewed" && !hasInterviewScore(candidate)) {
    return {
      ok: false,
      reason: `Score ${candidate.name}'s interview before moving them on.`,
    };
  }

  // §7.18 — nobody becomes "hired" without having accepted an offer. The stage
  // order enforces this when the offer stage is on; this holds the line when
  // it has been switched off, and when a card is dragged straight across.
  if (to === "hired" && !hasAcceptedOffer(candidate)) {
    const offer = latestOffer(candidate);
    return {
      ok: false,
      reason: hasDeclinedOffer(candidate)
        ? `${candidate.name} declined their offer — they can't be hired.`
        : offer
          ? `${candidate.name} hasn't accepted their offer yet.`
          : `${candidate.name} hasn't been sent an offer yet.`,
    };
  }

  // A requisition approved for two people cannot hire three. Nothing enforced
  // this, so the pipeline would happily seat more hires than the role was
  // funded for - and the vacancy's own "filled" status would then be reporting
  // a number that overshot what Finance signed off.
  if (to === "hired" && capacity && capacity.hired >= capacity.openings) {
    return {
      ok: false,
      reason:
        capacity.openings === 1
          ? "This role has one opening and it is already filled. Close the vacancy or raise the headcount first."
          : `All ${capacity.openings} openings on this role are filled. Raise the headcount before hiring anyone else.`,
    };
  }

  return OK;
}

/** Candidates already occupying a place on this requisition. */
export function hiredCount(
  candidates: Candidate[],
  requisitionId: string,
): number {
  return candidates.filter(
    (c) => c.requisitionId === requisitionId && c.stage === "hired",
  ).length;
}

/** How long a candidate has sat where they are, in whole days. */
export function daysInStage(candidate: Candidate, now = new Date()): number {
  const since = new Date(candidate.updatedAt || candidate.appliedAt);
  if (Number.isNaN(since.getTime())) return 0;
  return Math.max(
    0,
    Math.floor((now.getTime() - since.getTime()) / 86_400_000),
  );
}
