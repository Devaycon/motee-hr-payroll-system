import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  RiskHistoryAction,
  RiskOutcome,
  RiskRecord,
  WorkforceRisk,
} from "@/src/lib/types/workforce-risk";
import {
  DEFAULT_RISK_SETTINGS,
  type RiskRuleSettings,
} from "@/src/lib/workforce-risk/rules";

/**
 * What HR has done about each detected risk. The risks themselves are never
 * stored here — they are rebuilt from the Core HR data on read — so this only
 * ever holds decisions: the edited recommendation, the action plan's run id,
 * the outcome and the audit history.
 */
export interface WorkforceRiskState {
  records: Record<string, RiskRecord>;
  /** Rule thresholds per tenant (organisation-specific overrides). */
  settings: Record<string, RiskRuleSettings>;
}

const initialState: WorkforceRiskState = { records: {}, settings: {} };

export const riskKey = (tenantId: string, riskId: string) => `${tenantId}::${riskId}`;

interface RiskRef {
  tenantId: string;
  risk: WorkforceRisk;
  by: string;
}

/** The record for a risk, created from the current detection on first touch. */
function ensure(state: WorkforceRiskState, { tenantId, risk }: RiskRef): RiskRecord {
  const key = riskKey(tenantId, risk.id);
  return (state.records[key] ??= {
    key,
    tenantId,
    riskId: risk.id,
    snapshot: risk,
    pastRunIds: [],
    recurrenceCount: 0,
    history: [],
  });
}

function log(record: RiskRecord, action: RiskHistoryAction, by: string, note?: string) {
  record.history.push({ at: new Date().toISOString(), by, action, note });
}

/**
 * Put a closed or dismissed risk back in play. The closure stays in the
 * history rather than being overwritten, so "how often does this come back"
 * is answerable.
 */
function reopen(record: RiskRecord, risk: WorkforceRisk, by: string, note: string) {
  record.closure = undefined;
  record.dismissed = undefined;
  record.runId = undefined;
  record.recommendation = undefined;
  record.recommendationApprovedBy = undefined;
  record.snapshot = risk;
  record.recurrenceCount += 1;
  log(record, "reopened", by, note);
}

const slice = createSlice({
  name: "workforceRisk",
  initialState,
  reducers: {
    hydrate(_state, action: PayloadAction<WorkforceRiskState>) {
      return {
        records: action.payload.records ?? {},
        settings: action.payload.settings ?? {},
      };
    },

    acknowledgeRisk(state, action: PayloadAction<RiskRef>) {
      const record = ensure(state, action.payload);
      if (record.history.length === 0) log(record, "acknowledged", action.payload.by);
    },

    editRecommendation(state, action: PayloadAction<RiskRef & { text: string }>) {
      const record = ensure(state, action.payload);
      const text = action.payload.text.trim();
      if (!text || text === (record.recommendation ?? action.payload.risk.recommendedAction)) return;
      record.recommendation = text;
      // An approval covered the old wording, not this one.
      record.recommendationApprovedBy = undefined;
      log(record, "recommendation_edited", action.payload.by, text);
    },

    approveRecommendation(state, action: PayloadAction<RiskRef>) {
      const record = ensure(state, action.payload);
      record.recommendationApprovedBy = action.payload.by;
      log(record, "recommendation_approved", action.payload.by);
    },

    /**
     * Link a freshly started action plan. A risk that was closed and has come
     * back is reopened first, so the new plan isn't filed against the old
     * closure.
     */
    attachActionPlan(
      state,
      action: PayloadAction<RiskRef & { runId: string; country: string; summary: string }>,
    ) {
      const { risk, by, runId, country, summary } = action.payload;
      const record = ensure(state, action.payload);
      if (record.closure || record.dismissed) reopen(record, risk, by, "Detected again; new action plan started.");
      record.runId = runId;
      record.country = country;
      record.pastRunIds.push(runId);
      log(record, "action_plan_created", by, summary);
    },

    /** Reminders and escalations: recorded so the audit trail shows the chase. */
    logRiskEvent(
      state,
      action: PayloadAction<{ key: string; action: "reminder_sent" | "escalated"; by: string; note?: string }>,
    ) {
      const record = state.records[action.payload.key];
      if (record) log(record, action.payload.action, action.payload.by, action.payload.note);
    },

    /**
     * Record the outcome. Needs evidence: a risk closed on someone's say-so is
     * exactly what the client asked MOTEE to stop allowing.
     */
    closeRisk(
      state,
      action: PayloadAction<{
        key: string;
        by: string;
        outcome: RiskOutcome;
        evidence: string;
        metricAtClose?: number;
        fingerprint: string;
      }>,
    ) {
      const { key, by, outcome, evidence, metricAtClose, fingerprint } = action.payload;
      const record = state.records[key];
      if (!record || !evidence.trim()) return;
      record.closure = { by, at: new Date().toISOString(), outcome, evidence: evidence.trim(), metricAtClose, fingerprint };
      log(record, "closed", by, `${outcome.replace("_", " ")}: ${evidence.trim()}`);
    },

    dismissRisk(state, action: PayloadAction<RiskRef & { reason: string }>) {
      const record = ensure(state, action.payload);
      const reason = action.payload.reason.trim();
      if (!reason) return;
      record.dismissed = { by: action.payload.by, at: new Date().toISOString(), reason };
      record.snapshot = action.payload.risk;
      log(record, "dismissed", action.payload.by, reason);
    },

    reopenRisk(state, action: PayloadAction<RiskRef & { note: string }>) {
      const record = ensure(state, action.payload);
      reopen(record, action.payload.risk, action.payload.by, action.payload.note.trim() || "Reopened manually.");
    },

    updateRiskSettings(
      state,
      action: PayloadAction<{ tenantId: string; settings: Partial<RiskRuleSettings> }>,
    ) {
      const current = state.settings[action.payload.tenantId] ?? DEFAULT_RISK_SETTINGS;
      state.settings[action.payload.tenantId] = { ...current, ...action.payload.settings };
    },
  },
});

export const {
  hydrate: hydrateWorkforceRisk,
  acknowledgeRisk,
  editRecommendation,
  approveRecommendation,
  attachActionPlan,
  logRiskEvent,
  closeRisk,
  dismissRisk,
  reopenRisk,
  updateRiskSettings,
} = slice.actions;

export default slice.reducer;
