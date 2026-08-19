import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  ExpenseClaim,
  ExpenseDecision,
  ExpenseHistoryEntry,
  ExpenseStatus,
} from "@/src/data/employee-expenses-demo";
import { inferStageIndexFromStatus, isClaimOpen } from "@/src/lib/expenses/stages";
import { claimTimeline } from "@/src/lib/expenses/timeline";

/**
 * Expense claims used to live in the My Expenses component's `useState`, which
 * was fine while the list was the only screen that showed them. Each claim now
 * has its own detail route, so the rows have to survive a navigation (and a
 * refresh, and a deep link) — this slice mirrors the leave/approvals pattern:
 * seeded once from the demo data, mutated here, persisted by
 * `expenses-persistence`.
 */
interface ExpensesState {
  claims: ExpenseClaim[];
  /** True once seeded, so we don't reseed over the employee's own claims. */
  seeded: boolean;
  /** Tenant whose demo claims have been attributed to real employees. */
  seedAttributedFor: string | null;
  /** `idle` until hydrate/seed runs — the detail page waits rather than 404s. */
  status: "idle" | "ready";
}

const initialState: ExpensesState = {
  claims: [],
  seeded: false,
  seedAttributedFor: null,
  status: "idle",
};

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function pushHistory(
  claim: ExpenseClaim,
  entry: Omit<ExpenseHistoryEntry, "id" | "at"> & { at?: string },
) {
  if (!claim.history) claim.history = [];
  claim.history.push({
    id: uid("EXH"),
    at: entry.at ?? nowIso(),
    action: entry.action,
    actor: entry.actor,
    toStatus: entry.toStatus,
    note: entry.note,
  });
}

function pushDecision(
  claim: ExpenseClaim,
  entry: Omit<ExpenseDecision, "id" | "at"> & { at?: string },
) {
  if (!claim.decisions) claim.decisions = [];
  claim.decisions.push({ ...entry, id: uid("EXD"), at: entry.at ?? nowIso() });
}

/** Fields every decision reducer needs to record who acted. */
interface DecisionActor {
  actor: string;
  actorEmployeeId?: string;
}

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    /** Restores a persisted snapshot. */
    hydrate(state, action: PayloadAction<Partial<ExpensesState>>) {
      const { claims, seeded, seedAttributedFor } = action.payload;
      if (Array.isArray(claims)) state.claims = claims;
      if (typeof seeded === "boolean") state.seeded = seeded;
      if (seedAttributedFor !== undefined) {
        state.seedAttributedFor = seedAttributedFor;
      }
      state.status = "ready";
    },

    /** First-run seed from the demo data; ignored once anything is stored. */
    seed(state, action: PayloadAction<ExpenseClaim[]>) {
      if (state.seeded) {
        state.status = "ready";
        return;
      }
      state.claims = action.payload;
      state.seeded = true;
      state.status = "ready";
    },

    /**
     * Fills in the submitter and chain position on the demo claims, which are
     * seeded before anyone has signed in and so have neither. Runs once per
     * tenant; `extras` are other employees' claims, so the HR queue isn't one
     * person's list.
     */
    attributeSeed(
      state,
      action: PayloadAction<{
        tenantId: string;
        owner: {
          employeeId: string;
          name: string;
          initials: string;
          department: string;
        };
        extras: ExpenseClaim[];
        stageCount: number;
        /** Resolved approver per claim id, computed against the locale bundle. */
        approvers: Record<string, { employeeId: string | null; name: string | null }>;
      }>,
    ) {
      const { tenantId, owner, extras, stageCount, approvers } = action.payload;
      if (state.seedAttributedFor === tenantId) return;

      for (const claim of state.claims) {
        if (!claim.employeeId) {
          claim.employeeId = owner.employeeId;
          claim.employeeName = owner.name;
          claim.employeeInitials = owner.initials;
          claim.department = owner.department;
        }
        claim.stageIndex ??= inferStageIndexFromStatus(claim.status, stageCount);
        const desk = approvers[claim.id];
        if (desk && !claim.currentApproverEmployeeId) {
          claim.currentApproverEmployeeId = desk.employeeId;
          claim.currentApproverName = desk.name;
        }
        // Materialise the inferred trail now, so the first decision appends to
        // a real history instead of replacing an inferred one.
        if (!claim.history?.length) claim.history = claimTimeline(claim);
      }

      const known = new Set(state.claims.map((c) => c.id));
      for (const extra of extras) {
        if (!known.has(extra.id)) state.claims.push(extra);
      }

      state.seedAttributedFor = tenantId;
    },

    addClaim(
      state,
      action: PayloadAction<{ claim: ExpenseClaim; actor: string }>,
    ) {
      const { claim, actor } = action.payload;
      const next: ExpenseClaim = { ...claim, history: claim.history ?? [] };
      next.stageIndex ??= next.status === "draft" ? -1 : 0;
      pushHistory(next, {
        action: next.status === "draft" ? "Draft saved" : "Submitted",
        actor,
        toStatus: next.status,
      });
      state.claims.unshift(next);
    },

    updateClaim(
      state,
      action: PayloadAction<{
        id: string;
        changes: Partial<ExpenseClaim>;
        actor: string;
        /** Overrides the log label, e.g. "Resubmitted" instead of "Edited". */
        logLabel?: string;
        /** Chain stage a resubmission re-enters at. */
        stageIndex?: number;
        approver?: { employeeId: string | null; name: string | null } | null;
      }>,
    ) {
      const claim = state.claims.find((c) => c.id === action.payload.id);
      if (!claim) return;
      const wasDraft = claim.status === "draft";
      const wasReturned = Boolean(claim.returned);
      Object.assign(claim, action.payload.changes);

      // Any draft → in-chain transition is a submission, whichever stage the
      // chain resolved it onto.
      const resubmitting = wasDraft && isClaimOpen(claim.status);
      if (resubmitting) {
        claim.stageIndex = action.payload.stageIndex ?? 0;
        claim.currentApproverEmployeeId =
          action.payload.approver?.employeeId ?? null;
        claim.currentApproverName = action.payload.approver?.name ?? null;
        claim.returned = false;
        claim.returnedReason = undefined;
      }

      pushHistory(claim, {
        action:
          action.payload.logLabel ??
          (resubmitting
            ? wasReturned
              ? "Resubmitted"
              : "Submitted"
            : "Edited"),
        actor: action.payload.actor,
        toStatus: claim.status,
      });
    },

    /**
     * Clears the current chain stage. `toStatus`/`toStageIndex` come from the
     * caller's stage machine, so the slice stays agnostic about chain length.
     */
    advanceClaim(
      state,
      action: PayloadAction<
        DecisionActor & {
          id: string;
          toStatus: ExpenseStatus;
          toStageIndex: number;
          stageLabel: string;
          stepId?: string;
          /** Approver of the stage now awaited; null once the chain is done. */
          nextApprover?: { employeeId: string | null; name: string | null } | null;
          note?: string;
          signatureDataUrl?: string;
        }
      >,
    ) {
      const {
        id,
        toStatus,
        toStageIndex,
        stageLabel,
        stepId,
        nextApprover,
        actor,
        actorEmployeeId,
        note,
        signatureDataUrl,
      } = action.payload;
      const claim = state.claims.find((c) => c.id === id);
      if (!claim || !isClaimOpen(claim.status)) return;

      pushDecision(claim, {
        stageIndex: claim.stageIndex ?? 0,
        stepId,
        stageLabel,
        decision: "approved",
        actorName: actor,
        actorEmployeeId,
        note,
        signatureDataUrl,
      });

      claim.status = toStatus;
      claim.stageIndex = toStageIndex;
      claim.currentApproverEmployeeId = nextApprover?.employeeId ?? null;
      claim.currentApproverName = nextApprover?.name ?? null;
      // Keeps the employee's "Approved by …" banner honest.
      claim.reviewer = actor;
      claim.returned = false;
      claim.returnedReason = undefined;

      pushHistory(claim, {
        action:
          toStatus === "reimbursed"
            ? "Reimbursement approved"
            : `Approved — ${stageLabel}`,
        actor,
        toStatus,
        note,
      });
    },

    rejectClaim(
      state,
      action: PayloadAction<
        DecisionActor & {
          id: string;
          reason: string;
          stageLabel?: string;
          stepId?: string;
          signatureDataUrl?: string;
        }
      >,
    ) {
      const { id, reason, stageLabel, stepId, actor, actorEmployeeId, signatureDataUrl } =
        action.payload;
      const claim = state.claims.find((c) => c.id === id);
      if (!claim || !isClaimOpen(claim.status)) return;

      pushDecision(claim, {
        stageIndex: claim.stageIndex ?? 0,
        stepId,
        stageLabel: stageLabel ?? "Review",
        decision: "rejected",
        actorName: actor,
        actorEmployeeId,
        note: reason,
        signatureDataUrl,
      });

      // `stageIndex` deliberately stays put, so the progress track halts on the
      // stage that actually rejected it.
      claim.status = "rejected";
      claim.currentApproverEmployeeId = null;
      claim.currentApproverName = null;
      claim.reviewer = actor;

      pushHistory(claim, {
        action: "Rejected",
        actor,
        toStatus: "rejected",
        note: reason,
      });
    },

    /** Sends a claim back to the employee to correct and resubmit. */
    returnClaim(
      state,
      action: PayloadAction<
        DecisionActor & { id: string; reason: string; stageLabel?: string; stepId?: string }
      >,
    ) {
      const { id, reason, stageLabel, stepId, actor, actorEmployeeId } =
        action.payload;
      const claim = state.claims.find((c) => c.id === id);
      if (!claim || !isClaimOpen(claim.status)) return;

      pushDecision(claim, {
        stageIndex: claim.stageIndex ?? 0,
        stepId,
        stageLabel: stageLabel ?? "Review",
        decision: "returned",
        actorName: actor,
        actorEmployeeId,
        note: reason,
      });

      // Back in the employee's hands: a draft again, but flagged so the UI can
      // say why. The reference is kept, so the resubmission reuses it.
      claim.status = "draft";
      claim.returned = true;
      claim.returnedReason = reason;
      claim.stageIndex = -1;
      claim.currentApproverEmployeeId = null;
      claim.currentApproverName = null;
      claim.reviewer = actor;

      pushHistory(claim, {
        action: "Returned for correction",
        actor,
        toStatus: "draft",
        note: reason,
      });
    },

    /** Pulls a submitted claim back out of review, returning it to drafts. */
    withdrawClaim(
      state,
      action: PayloadAction<{ id: string; actor: string; reason?: string }>,
    ) {
      const claim = state.claims.find((c) => c.id === action.payload.id);
      // Only the employee's own pending claim — once an approver has moved it
      // on, withdrawing would silently undo their decision.
      if (!claim || claim.status !== "submitted") return;
      claim.status = "draft";
      claim.stageIndex = -1;
      claim.currentApproverEmployeeId = null;
      claim.currentApproverName = null;
      claim.returned = false;
      claim.returnedReason = undefined;
      pushHistory(claim, {
        action: "Withdrawn",
        actor: action.payload.actor,
        toStatus: "draft",
        note: action.payload.reason,
      });
    },

    deleteClaim(state, action: PayloadAction<string>) {
      // Drafts only — a claim under review or already decided is a record.
      state.claims = state.claims.filter(
        (c) => !(c.id === action.payload && c.status === "draft"),
      );
    },
  },
});

export const {
  hydrate,
  seed,
  attributeSeed,
  addClaim,
  updateClaim,
  advanceClaim,
  rejectClaim,
  returnClaim,
  withdrawClaim,
  deleteClaim,
} = expensesSlice.actions;

export default expensesSlice.reducer;
