import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  HrChecklistKey,
  JoinerDocument,
  ManualOnboardingData,
  OnboardingRecord,
  OnboardingReviewStatus,
  PrivacyConsent,
} from "@/src/lib/types/onboarding";
import type { StarterTaxRecord } from "@/src/lib/types/starter-tax";
import type { EmployeeRow } from "@/src/lib/types/employees";
import { ONBOARDING_RECORDS } from "@/src/data/onboarding-demo";
import { onboardingRecordToEmployee } from "@/src/lib/demo/pending-employees";

interface OnboardingRecordsState {
  records: OnboardingRecord[];
  /** Hires whose workflow completed — picked up by the Employees module. */
  cleared: EmployeeRow[];
}

const initialState: OnboardingRecordsState = {
  records: ONBOARDING_RECORDS,
  cleared: [],
};

/** How long an onboarding invitation link stays valid (client feedback §2.1). */
const INVITE_VALID_DAYS = 14;

function addDays(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function recompute(record: OnboardingRecord): OnboardingRecord {
  const completedTasks = record.tasks.filter(
    (t) => t.status === "completed",
  ).length;
  const allRequiredDone = record.tasks
    .filter((t) => t.isRequired)
    .every((t) => t.status === "completed");
  const status: OnboardingRecord["status"] = allRequiredDone
    ? "completed"
    : completedTasks > 0
      ? "in_progress"
      : record.status === "overdue"
        ? "overdue"
        : "not_started";
  return {
    ...record,
    completedTasks,
    totalTasks: record.tasks.length,
    status,
    stage: allRequiredDone ? "completed" : record.stage,
  };
}

const onboardingRecordsSlice = createSlice({
  name: "onboardingRecords",
  initialState,
  reducers: {
    addRecord(state, action: PayloadAction<OnboardingRecord>) {
      // Ids from the recruitment bridge are derived from the candidate, so a
      // repeated invite lands here with an id that already exists. Ignore it
      // rather than onboarding the same person twice.
      if (state.records.some((r) => r.id === action.payload.id)) return;
      state.records.unshift(recompute(action.payload));
    },
    addRecords(state, action: PayloadAction<OnboardingRecord[]>) {
      const known = new Set(state.records.map((r) => r.id));
      const fresh = action.payload.filter((r) => !known.has(r.id));
      state.records.unshift(...fresh.map(recompute));
    },
    removeRecord(state, action: PayloadAction<string>) {
      state.records = state.records.filter((r) => r.id !== action.payload);
    },
    sendWelcomeEmail(state, action: PayloadAction<string>) {
      const r = state.records.find((x) => x.id === action.payload);
      if (!r) return;
      r.welcomeEmailSent = true;
      // §2.1 — the invite now has a tracked lifecycle, not just a boolean.
      r.invitation = {
        ...(r.invitation ?? {}),
        status: "sent",
        sentAt: new Date().toISOString(),
        expiresAt: addDays(new Date(), INVITE_VALID_DAYS),
        remindersSent: r.invitation?.remindersSent ?? 0,
      };
    },
    /**
     * §3.1 / §2.1 — reissue an invitation. Resets the expiry so a joiner who
     * let the link lapse gets a working one, and counts the chase-up.
     */
    resendInvitation(state, action: PayloadAction<string>) {
      const r = state.records.find((x) => x.id === action.payload);
      if (!r) return;
      const now = new Date();
      r.welcomeEmailSent = true;
      r.invitation = {
        ...(r.invitation ?? {}),
        status: "sent",
        sentAt: now.toISOString(),
        expiresAt: addDays(now, INVITE_VALID_DAYS),
        remindersSent: (r.invitation?.remindersSent ?? 0) + 1,
        lastReminderAt: now.toISOString(),
      };
    },
    /** §2.1 — the joiner opened the link; distinct from having started it. */
    markInvitationOpened(state, action: PayloadAction<string>) {
      const r = state.records.find((x) => x.id === action.payload);
      if (!r) return;
      // Never walk the status backwards from a later stage.
      if (r.invitation?.status && r.invitation.status !== "sent") return;
      r.invitation = {
        ...(r.invitation ?? { status: "sent" }),
        status: "opened",
        openedAt: new Date().toISOString(),
      };
    },
    /**
     * §2.3 — park a part-finished wizard so the joiner can resume later.
     */
    saveOnboardingDraft(
      state,
      action: PayloadAction<{
        id: string;
        stepKey: string;
        form: Partial<ManualOnboardingData>;
        documents?: JoinerDocument[];
        privacyConsent?: PrivacyConsent;
      }>,
    ) {
      const { id, stepKey, form, documents, privacyConsent } = action.payload;
      const r = state.records.find((x) => x.id === id);
      if (!r) return;
      r.draft = { savedAt: new Date().toISOString(), stepKey, form };
      if (documents) r.documents = documents;
      if (privacyConsent) r.privacyConsent = privacyConsent;
      r.invitation = {
        ...(r.invitation ?? { status: "sent" }),
        status: "in_progress",
        startedAt: r.invitation?.startedAt ?? new Date().toISOString(),
      };
    },
    /** A joiner submits their own details via the invite onboarding wizard. */
    completeSelfOnboarding(
      state,
      action: PayloadAction<{
        id: string;
        joinerData: Partial<ManualOnboardingData>;
        starterTax?: StarterTaxRecord;
        documents?: JoinerDocument[];
        privacyConsent?: PrivacyConsent;
        declaration?: { signedName: string; signedAt: string };
      }>,
    ) {
      const { id, joinerData, starterTax, documents, privacyConsent, declaration } =
        action.payload;
      const r = state.records.find((x) => x.id === id);
      if (!r) return;
      const at = new Date().toISOString();
      r.joinerData = joinerData;
      if (starterTax) r.starterTax = starterTax;
      if (documents) r.documents = documents;
      if (privacyConsent) r.privacyConsent = privacyConsent;
      if (declaration) r.declaration = declaration;
      r.selfOnboardingCompletedAt = at;
      r.welcomeEmailSent = true;
      // The draft has served its purpose.
      r.draft = undefined;
      r.invitation = {
        ...(r.invitation ?? { status: "sent" }),
        status: "submitted",
        submittedAt: at,
      };
      // §2.8 — submission no longer ends the process; HR has to review it.
      r.review = { status: "awaiting_review" };
      const submissions = r.submissions ?? [];
      submissions.push({
        id: `sub-${Date.now()}`,
        label: "Joiner onboarding details submitted",
        kind: "field",
        value: [joinerData.firstName, joinerData.lastName]
          .filter(Boolean)
          .join(" "),
        submittedAt: at,
      });
      for (const doc of documents ?? []) {
        submissions.push({
          id: `sub-${doc.kind}-${Date.now()}`,
          label: doc.kind.replace(/_/g, " "),
          kind: "document",
          value: doc.file.name,
          submittedAt: doc.uploadedAt,
        });
      }
      r.submissions = submissions;
      const history = r.history ?? [];
      history.push({
        id: `evt-${Date.now()}`,
        at,
        actorName: [joinerData.firstName, joinerData.lastName]
          .filter(Boolean)
          .join(" ") || "Joiner",
        type: "submitted",
        note: "Onboarding details submitted for HR review",
      });
      r.history = history;
    },
    /**
     * §2.8 — HR's decision on a submitted pack. Requesting changes hands the
     * form back to the joiner rather than dead-ending at "submitted".
     */
    reviewOnboarding(
      state,
      action: PayloadAction<{
        id: string;
        status: OnboardingReviewStatus;
        reviewedBy: string;
        comment?: string;
      }>,
    ) {
      const { id, status, reviewedBy, comment } = action.payload;
      const r = state.records.find((x) => x.id === id);
      if (!r) return;
      const at = new Date().toISOString();
      r.review = { status, reviewedBy, reviewedAt: at, comment };
      if (status === "changes_requested") {
        r.invitation = {
          ...(r.invitation ?? { status: "sent" }),
          status: "returned",
          returnedAt: at,
        };
        // Let them edit again.
        r.selfOnboardingCompletedAt = undefined;
      }
      const history = r.history ?? [];
      history.push({
        id: `evt-${Date.now()}`,
        at,
        actorName: reviewedBy,
        type: status === "approved" ? "approved" : "submitted",
        note:
          comment ??
          (status === "approved"
            ? "Onboarding pack approved"
            : "Changes requested"),
      });
      r.history = history;
    },
    /** §2.14 — HR's post-submission checklist. */
    toggleHrChecklistItem(
      state,
      action: PayloadAction<{ id: string; key: HrChecklistKey; done: boolean }>,
    ) {
      const { id, key, done } = action.payload;
      const r = state.records.find((x) => x.id === id);
      if (!r) return;
      r.hrChecklist = { ...(r.hrChecklist ?? {}), [key]: done };
    },
    /** A reviewer approves a workflow task. */
    approveTask(
      state,
      action: PayloadAction<{
        recordId: string;
        taskId: string;
        actorName: string;
        note?: string;
      }>,
    ) {
      const { recordId, taskId, actorName, note } = action.payload;
      const idx = state.records.findIndex((r) => r.id === recordId);
      if (idx < 0) return;
      const record = state.records[idx];
      const task = record.tasks.find((t) => t.id === taskId);
      if (!task || task.status === "completed") return;
      task.status = "completed";
      task.approvedAt = new Date().toISOString();
      task.note = note;
      const history = record.history ?? [];
      history.push({
        id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        at: task.approvedAt,
        actorName,
        type: "approved",
        taskName: task.taskName,
        note,
      });
      record.history = history;
      const next = recompute(record);
      if (next.status === "completed") {
        history.push({
          id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          at: task.approvedAt,
          actorName,
          type: "completed",
        });
        next.history = history;
        // Workflow done → clear the hire into the Employees module.
        state.cleared.unshift(onboardingRecordToEmployee(next));
        state.records.splice(idx, 1);
      } else {
        state.records[idx] = next;
      }
    },
  },
});

export const {
  addRecord,
  addRecords,
  removeRecord,
  sendWelcomeEmail,
  resendInvitation,
  markInvitationOpened,
  saveOnboardingDraft,
  completeSelfOnboarding,
  reviewOnboarding,
  toggleHrChecklistItem,
  approveTask,
} = onboardingRecordsSlice.actions;

export default onboardingRecordsSlice.reducer;
