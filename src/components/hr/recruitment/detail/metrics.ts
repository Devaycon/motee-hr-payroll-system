import type {
  Candidate,
  Interview,
  JobRequisition,
  RecruitmentStageType,
  RequisitionFlow,
} from "@/src/lib/types/recruitment";
import { progressionStages } from "../flow";

export interface FunnelStep {
  stage: RecruitmentStageType;
  /** Everyone who reached this stage or moved past it. */
  reached: number;
  /** Share of the previous step that got here, 0–1. Null for the entry step. */
  conversion: number | null;
}

export interface RequisitionMetrics {
  funnel: FunnelStep[];
  /** Active (non-rejected) candidates across every stage. */
  activeTotal: number;
  rejected: number;
  /** Candidates who have been interviewed and scored. */
  interviewed: number;
  offersSent: number;
  offersAccepted: number;
  offersDeclined: number;
  /** Accepted ÷ answered, 0–1, or null while nobody has answered. */
  offerAcceptanceRate: number | null;
  /** Days from the requisition opening to its first hire, or null if unfilled. */
  timeToFill: number | null;
  /** Mean days candidates have been sitting where they are. */
  avgDaysInStage: number | null;
  interviewsScheduled: number;
  interviewsCompleted: number;
}

function daysBetween(from: string, to: string): number | null {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/**
 * §7.16 — how this opening is actually performing.
 *
 * The detail page went straight from the title to the stage tabs, so the only
 * way to judge a pipeline was to count rows in each tab by eye. Everything here
 * is derived from the candidates and interviews already in the store — nothing
 * new is persisted.
 */
export function requisitionMetrics(
  requisition: JobRequisition,
  candidates: Candidate[],
  interviews: Interview[],
  flow: RequisitionFlow,
): RequisitionMetrics {
  const mine = candidates.filter((c) => c.requisitionId === requisition.id);
  const order = progressionStages(flow);
  const stageIndex = new Map(order.map((s, i) => [s, i]));

  // Someone at "offer" has necessarily been through "interview", so each step
  // counts everyone at or beyond it rather than only those sitting on it.
  const funnel: FunnelStep[] = order.map((stage, i) => {
    const reached = mine.filter((c) => {
      const idx = stageIndex.get(c.stage);
      return idx !== undefined && idx >= i;
    }).length;
    return { stage, reached, conversion: null };
  });
  for (let i = 1; i < funnel.length; i++) {
    const prev = funnel[i - 1].reached;
    funnel[i].conversion = prev > 0 ? funnel[i].reached / prev : null;
  }

  let offersSent = 0;
  let offersAccepted = 0;
  let offersDeclined = 0;
  for (const c of mine) {
    for (const o of c.offers) {
      if (o.status === "accepted") offersAccepted++;
      else if (o.status === "rejected") offersDeclined++;
      else offersSent++;
    }
  }
  const answered = offersAccepted + offersDeclined;

  const hires = mine.filter((c) => c.stage === "hired" && c.status !== "rejected");
  const firstHire = hires
    .map((c) => c.updatedAt)
    .filter(Boolean)
    .sort()[0];

  const ages = mine
    .filter((c) => c.status === "active")
    .map((c) => daysBetween(c.updatedAt || c.appliedAt, new Date().toISOString()))
    .filter((d): d is number => d !== null);

  const mineInterviews = interviews.filter(
    (iv) => iv.requisitionId === requisition.id && iv.status !== "cancelled",
  );

  return {
    funnel,
    activeTotal: mine.filter((c) => c.status === "active").length,
    rejected: mine.filter((c) => c.status === "rejected").length,
    interviewed: mine.filter((c) => c.stage === "interviewed").length,
    offersSent,
    offersAccepted,
    offersDeclined,
    offerAcceptanceRate: answered > 0 ? offersAccepted / answered : null,
    timeToFill: firstHire ? daysBetween(requisition.createdAt, firstHire) : null,
    avgDaysInStage: ages.length
      ? Math.round(ages.reduce((s, d) => s + d, 0) / ages.length)
      : null,
    interviewsScheduled: mineInterviews.filter((iv) => iv.status === "scheduled")
      .length,
    interviewsCompleted: mineInterviews.filter((iv) => iv.status === "completed")
      .length,
  };
}

/** `0.42` → `"42%"`; null → `"—"`. */
export function pct(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}
