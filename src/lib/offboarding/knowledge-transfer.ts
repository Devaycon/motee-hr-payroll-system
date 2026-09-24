import type {
  KnowledgeTransfer,
  OffboardingRecord,
} from "@/src/lib/types/offboarding";

/**
 * Knowledge transfer (Offboarding feedback §3): a handover checklist and a
 * named successor, required before an exit can be signed off for leadership
 * and specialist roles.
 */
export type KnowledgeTransferStatus =
  | "not_required"
  | "not_started"
  | "in_progress"
  | "complete";

export const KNOWLEDGE_TRANSFER_STATUS_LABELS: Record<
  KnowledgeTransferStatus,
  string
> = {
  not_required: "Not required",
  not_started: "Pending",
  in_progress: "In progress",
  complete: "Complete",
};

export const KNOWLEDGE_TRANSFER_STATUS_STYLES: Record<
  KnowledgeTransferStatus,
  string
> = {
  not_required: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  not_started: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  complete: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
};

/** The standard handover every leaver works through. */
export const KNOWLEDGE_TRANSFER_STEPS = [
  "Handover document written",
  "Walkthrough sessions held with successor",
  "Open work and projects reassigned",
  "Key contacts and stakeholders introduced",
  "Files, systems and credentials documented",
] as const;

const LEADERSHIP = /manager|head|director|lead|chief|supervisor|principal|vp|president/;
const SPECIALIST =
  /engineer|architect|developer|specialist|analyst|scientist|consultant|accountant|counsel|lawyer|actuar|senior/;

/** Leadership and specialist roles need a signed-off handover by default. */
export function requiresKnowledgeTransfer(jobTitle: string): boolean {
  const title = jobTitle.toLowerCase();
  return LEADERSHIP.test(title) || SPECIALIST.test(title);
}

export function buildKnowledgeTransfer(
  recordId: string,
  jobTitle: string,
  opts: {
    completedSteps?: number;
    completedAt?: string;
    successorId?: string;
    successorName?: string;
  } = {},
): KnowledgeTransfer {
  const done = opts.completedSteps ?? 0;
  const items = KNOWLEDGE_TRANSFER_STEPS.map((label, i) => ({
    id: `${recordId}-kt${i + 1}`,
    label,
    completed: i < done,
    completedAt: i < done ? opts.completedAt : undefined,
  }));
  return {
    required: requiresKnowledgeTransfer(jobTitle),
    successorId: opts.successorId,
    successorName: opts.successorName,
    items,
    completedAt:
      done >= items.length ? opts.completedAt : undefined,
  };
}

export function knowledgeTransferStatus(
  record: OffboardingRecord,
): KnowledgeTransferStatus {
  const kt = record.knowledgeTransfer;
  if (!kt || !kt.required) return "not_required";
  const done = kt.items.filter((i) => i.completed).length;
  if (kt.items.length > 0 && done === kt.items.length) return "complete";
  return done === 0 ? "not_started" : "in_progress";
}

/** True when knowledge transfer no longer stands in the way of sign-off. */
export function knowledgeTransferCleared(record: OffboardingRecord): boolean {
  const status = knowledgeTransferStatus(record);
  return status === "not_required" || status === "complete";
}

/** The clearance checklist step that knowledge transfer now drives. */
export function isKnowledgeTransferClearanceLabel(label: string): boolean {
  return /knowledge/i.test(label);
}
