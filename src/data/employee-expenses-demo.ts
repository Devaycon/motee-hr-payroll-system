import {
  Plane,
  Utensils,
  Hotel,
  Laptop,
  AppWindow,
  GraduationCap,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import type { FileAttachment } from "@/src/lib/utils/file-attachments";

export type ExpenseStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "reimbursed";

export type ExpenseCategory =
  | "travel"
  | "meals"
  | "accommodation"
  | "equipment"
  | "software"
  | "training"
  | "other";

/**
 * A decision taken at one stage of the approval chain. Kept separately from
 * the history entries because the chain timeline needs to know *which stage*
 * a decision belongs to, which a flat audit line can't say.
 */
export interface ExpenseDecision {
  id: string;
  /** Chain stage the decision was taken at. */
  stageIndex: number;
  stepId?: string;
  stageLabel: string;
  decision: "approved" | "rejected" | "returned";
  actorName: string;
  actorEmployeeId?: string;
  at: string;
  note?: string;
  /** The expense_claim chain requires a reviewer signature on approval. */
  signatureDataUrl?: string;
}

/** One entry in a claim's audit trail, shown on the claim detail page. */
export interface ExpenseHistoryEntry {
  id: string;
  /** ISO timestamp, or a plain ISO date for entries derived from demo data. */
  at: string;
  /** What happened, e.g. "Submitted", "Approved", "Withdrawn". */
  action: string;
  /** Who did it — the employee, an approver, or "Finance". */
  actor?: string;
  /** The status the claim landed in, when the entry moved it. */
  toStatus?: ExpenseStatus;
  note?: string;
}

export interface ExpenseClaim {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  /** ISO 4217 currency code the claim was incurred in (defaults to tenant currency). */
  currency?: string;
  dateSubmitted: string;
  status: ExpenseStatus;
  merchant: string;
  notes?: string;
  /** Receipts and supporting documents attached when the claim was raised. */
  attachments?: FileAttachment[];
  /** Human-facing claim reference, e.g. EXP-2026-00124. */
  reference?: string;
  /** Who the claim sits with (or was decided by) — shown on the detail page. */
  reviewer?: string;
  /** Audit trail; absent on seeded claims, which derive one from their status. */
  history?: ExpenseHistoryEntry[];

  // ── who filed it ──────────────────────────────────────────────────────────
  // Absent on claims created before the HR review flow existed; backfilled
  // from the signed-in employee by `attributeSeed`.
  employeeId?: string;
  employeeName?: string;
  employeeInitials?: string;
  department?: string;

  // ── where it sits in the approval chain ───────────────────────────────────
  /** Chain stage awaited: -1 = not submitted, >= chain length = fully cleared. */
  stageIndex?: number;
  /** Chain the claim entered on, so a mid-flight template edit is detectable. */
  chainTemplateId?: string;
  /** Approver resolved for the current stage, snapshotted at each transition. */
  currentApproverEmployeeId?: string | null;
  currentApproverName?: string | null;
  /** One entry per decision taken on the claim. */
  decisions?: ExpenseDecision[];
  /**
   * Sent back for correction. The claim is a `draft` again — "returned" is a
   * flag rather than a sixth status because a returned claim behaves exactly
   * like a draft everywhere else (reopen, edit, resubmit, discard).
   */
  returned?: boolean;
  returnedReason?: string;
}

/**
 * Id for a newly filed claim. Kept out of the component so the clock is never
 * read during render (`react-hooks/purity`).
 */
export function newExpenseClaimId(): string {
  return `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/** Human-facing claim reference, e.g. EXP-2026-00124. */
export function formatExpenseReference(year: string, sequence: number): string {
  return `EXP-${year}-${String(sequence).padStart(5, "0")}`;
}

/**
 * The next free reference for a claim filed on `dateSubmitted`. Sequences run
 * per year and continue from the highest one already issued, so reopening and
 * resubmitting never hands out a reference twice.
 */
export function buildExpenseReference(
  claims: ExpenseClaim[],
  dateSubmitted: string,
): string {
  const year = dateSubmitted.slice(0, 4) || String(new Date().getFullYear());
  const prefix = `EXP-${year}-`;
  const highest = claims.reduce((max, c) => {
    if (!c.reference?.startsWith(prefix)) return max;
    const seq = Number(c.reference.slice(prefix.length));
    return Number.isFinite(seq) && seq > max ? seq : max;
  }, 0);
  return formatExpenseReference(year, highest + 1);
}

/** Common payment currencies an employee may file an expense in. */
export const EXPENSE_CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "GBP", label: "GBP £" },
  { value: "USD", label: "USD $" },
  { value: "EUR", label: "EUR €" },
  { value: "NGN", label: "NGN ₦" },
  { value: "CAD", label: "CAD $" },
  { value: "ZAR", label: "ZAR R" },
];

export const EXPENSE_CATEGORY_OPTIONS: {
  value: ExpenseCategory;
  label: string;
}[] = [
  { value: "travel", label: "Travel" },
  { value: "meals", label: "Meals & Entertainment" },
  { value: "accommodation", label: "Accommodation" },
  { value: "equipment", label: "Equipment" },
  { value: "software", label: "Software & Subscriptions" },
  { value: "training", label: "Training & Development" },
  { value: "other", label: "Other" },
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> =
  Object.fromEntries(
    EXPENSE_CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
  ) as Record<ExpenseCategory, string>;

/** Category icons — scannable at a glance in the list (client feedback §8.3). */
export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  travel: Plane,
  meals: Utensils,
  accommodation: Hotel,
  equipment: Laptop,
  software: AppWindow,
  training: GraduationCap,
  other: Receipt,
};

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  reimbursed: "Reimbursed",
};

export const EXPENSE_STATUS_STYLES: Record<ExpenseStatus, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  submitted: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  approved:
    "border-[#4ED251]/40 bg-[#4ED251]/10 text-[#4ED251]",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  reimbursed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export const EMPLOYEE_EXPENSES: ExpenseClaim[] = [
  {
    id: "exp-1",
    reference: "EXP-2026-00007",
    title: "Client visit — Lagos to Abuja flight",
    category: "travel",
    amount: 185000,
    dateSubmitted: "2026-04-18",
    status: "reimbursed",
    merchant: "Air Peace",
    notes: "Return economy ticket for Q2 client review.",
    reviewer: "Adaeze Nwosu",
  },
  {
    id: "exp-2",
    reference: "EXP-2026-00006",
    title: "Team lunch with new hires",
    category: "meals",
    amount: 42500,
    dateSubmitted: "2026-04-15",
    status: "approved",
    merchant: "The Yellow Chilli",
    reviewer: "Adaeze Nwosu",
  },
  {
    id: "exp-3",
    reference: "EXP-2026-00005",
    title: "Hotel stay — onboarding workshop",
    category: "accommodation",
    amount: 96000,
    dateSubmitted: "2026-04-12",
    status: "submitted",
    merchant: "Radisson Blu",
    notes: "Two nights during the facilitator workshop.",
    reviewer: "Adaeze Nwosu",
  },
  {
    id: "exp-4",
    reference: "EXP-2026-00004",
    title: "Noise-cancelling headphones",
    category: "equipment",
    amount: 78000,
    dateSubmitted: "2026-04-10",
    status: "approved",
    merchant: "Slot Systems",
    reviewer: "Adaeze Nwosu",
  },
  {
    id: "exp-5",
    reference: "EXP-2026-00003",
    title: "Design software annual licence",
    category: "software",
    amount: 132000,
    dateSubmitted: "2026-04-08",
    status: "submitted",
    merchant: "Figma",
    reviewer: "Adaeze Nwosu",
  },
  {
    id: "exp-6",
    reference: "EXP-2026-00002",
    title: "Project management certification",
    category: "training",
    amount: 210000,
    dateSubmitted: "2026-04-05",
    status: "rejected",
    merchant: "Coursera",
    notes: "Out of this quarter's L&D budget.",
    reviewer: "Adaeze Nwosu",
  },
  {
    id: "exp-7",
    reference: "EXP-2026-00001",
    title: "Airport taxi & parking",
    category: "travel",
    amount: 15500,
    dateSubmitted: "2026-04-03",
    status: "reimbursed",
    merchant: "Bolt",
    reviewer: "Adaeze Nwosu",
  },
  {
    id: "exp-8",
    title: "Stationery for offsite",
    category: "other",
    amount: 8900,
    dateSubmitted: "2026-03-29",
    status: "draft",
    merchant: "Office Mart",
  },
];
