import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  AbsenceReviewCase,
  BradfordExclusion,
  BradfordSnapshot,
  BradfordThreshold,
  ReturnToWork,
  SchemeEnrolment,
  SicknessAuditAction,
  SicknessAuditEntry,
  SicknessDocument,
  SicknessRecord,
  SicknessScheme,
  SicknessSettings,
} from "@/src/lib/types/sickness";
import type { OHReferral } from "@/src/lib/types/occupational-health";
import { DEFAULT_SICKNESS_SETTINGS } from "@/src/lib/sickness/seeds";

/**
 * Sickness & Absence store. One home for absence records, sick-pay schemes
 * and enrolments, Bradford snapshots, review cases, the audit log, and the
 * Occupational Health cases raised from absences.
 *
 * Records of every tenant live side by side, each tagged with `tenantId`;
 * the hooks filter to the signed-in tenant.
 */

export interface SicknessState {
  records: SicknessRecord[];
  schemes: SicknessScheme[];
  enrolments: SchemeEnrolment[];
  reviewCases: AbsenceReviewCase[];
  snapshots: BradfordSnapshot[];
  audit: SicknessAuditEntry[];
  /** OH cases referred from an absence record. */
  ohCases: OHReferral[];
  /** Edits to the demo OH cases (adjustments, outcomes, links) by case id. */
  ohEdits: Record<string, Partial<OHReferral> & { linkedSicknessIds?: string[] }>;
  /** Settings per tenant. */
  settings: Record<string, SicknessSettings>;
  seededTenants: string[];
  /** Seed generation the data was written under — see SICKNESS_SEED_VERSION. */
  seedVersion: number;
}

/** Bump to reseed every tenant from the bundle (drops local sickness edits). */
export const SICKNESS_SEED_VERSION = 1;

const initialState: SicknessState = {
  records: [],
  schemes: [],
  enrolments: [],
  reviewCases: [],
  snapshots: [],
  audit: [],
  ohCases: [],
  ohEdits: {},
  settings: {},
  seededTenants: [],
  seedVersion: SICKNESS_SEED_VERSION,
};

interface Actor {
  actor: string;
}

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;
const nowIso = () => new Date().toISOString();

function log(
  state: SicknessState,
  tenantId: string,
  action: SicknessAuditAction,
  actor: string,
  subjectId: string,
  employeeId?: string,
  note?: string,
) {
  state.audit.unshift({ id: nextId("AUD"), tenantId, at: nowIso(), actor, action, subjectId, employeeId, note });
  if (state.audit.length > 2000) state.audit.length = 2000;
}

const slice = createSlice({
  name: "sickness",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<Partial<SicknessState>>) {
      const p = action.payload;
      // An older seed is discarded so every tenant reseeds from the bundle.
      if (p.seedVersion !== SICKNESS_SEED_VERSION) return;
      Object.assign(state, {
        ...initialState,
        ...p,
      });
    },

    seedTenant(
      state,
      action: PayloadAction<{
        tenantId: string;
        records: SicknessRecord[];
        schemes: SicknessScheme[];
        enrolments: SchemeEnrolment[];
      }>,
    ) {
      const { tenantId } = action.payload;
      if (state.seededTenants.includes(tenantId)) return;
      state.records.push(...action.payload.records);
      state.schemes.push(...action.payload.schemes);
      state.enrolments.push(...action.payload.enrolments);
      state.settings[tenantId] ??= DEFAULT_SICKNESS_SETTINGS;
      state.seededTenants.push(tenantId);
    },

    reportSickness(state, action: PayloadAction<{ record: SicknessRecord } & Actor>) {
      const { record, actor } = action.payload;
      state.records.unshift(record);
      log(state, record.tenantId, "created", actor, record.id, record.employeeId,
        record.source === "self" ? "Self-reported" : `Logged on behalf of ${record.employeeName}`);
    },

    updateRecord(
      state,
      action: PayloadAction<{ id: string; changes: Partial<SicknessRecord>; note?: string } & Actor>,
    ) {
      const r = state.records.find((x) => x.id === action.payload.id);
      if (!r) return;
      Object.assign(r, action.payload.changes, { updatedAt: nowIso() });
      log(state, r.tenantId, "updated", action.payload.actor, r.id, r.employeeId, action.payload.note);
    },

    setApproval(
      state,
      action: PayloadAction<{ id: string; status: SicknessRecord["approvalStatus"]; note?: string } & Actor>,
    ) {
      const r = state.records.find((x) => x.id === action.payload.id);
      if (!r || r.approvalStatus === action.payload.status) return;
      r.approvalStatus = action.payload.status;
      r.updatedAt = nowIso();
      const verb = action.payload.status === "approved" ? "approved" : action.payload.status === "rejected" ? "rejected" : "updated";
      log(state, r.tenantId, verb, action.payload.actor, r.id, r.employeeId, action.payload.note);
    },

    addDocument(state, action: PayloadAction<{ id: string; document: SicknessDocument } & Actor>) {
      const r = state.records.find((x) => x.id === action.payload.id);
      if (!r) return;
      r.documents.push(action.payload.document);
      if (action.payload.document.kind === "fit_note") r.fitNoteStatus = "received";
      r.updatedAt = nowIso();
      log(state, r.tenantId, "document_added", action.payload.actor, r.id, r.employeeId, action.payload.document.name);
    },

    /** Records that someone opened the confidential medical detail. */
    logMedicalView(state, action: PayloadAction<{ id: string } & Actor>) {
      const r = state.records.find((x) => x.id === action.payload.id);
      if (r) log(state, r.tenantId, "medical_viewed", action.payload.actor, r.id, r.employeeId);
    },

    setExclusion(state, action: PayloadAction<{ id: string; exclusion: BradfordExclusion | null } & Actor>) {
      const r = state.records.find((x) => x.id === action.payload.id);
      if (!r) return;
      const ex = action.payload.exclusion;
      r.exclusion = ex ?? undefined;
      r.updatedAt = nowIso();
      log(state, r.tenantId, ex ? "exclusion_set" : "exclusion_removed", action.payload.actor, r.id, r.employeeId, ex?.reason);
    },

    /** Return to work: closes the spell and records the RTW form. */
    recordReturn(state, action: PayloadAction<{ id: string; rtw: ReturnToWork; endDate: string } & Actor>) {
      const r = state.records.find((x) => x.id === action.payload.id);
      if (!r) return;
      r.endDate = action.payload.endDate;
      r.endPortion = action.payload.rtw.lastDayPortion ?? "full";
      r.absenceState = "returned";
      r.rtw = action.payload.rtw;
      r.updatedAt = nowIso();
      log(state, r.tenantId, "returned", action.payload.actor, r.id, r.employeeId, `Returned ${action.payload.rtw.returnDate}`);
      if (action.payload.rtw.status === "completed") {
        log(state, r.tenantId, "rtw_completed", action.payload.actor, r.id, r.employeeId);
      }
    },

    // ── Schemes & enrolments
    upsertScheme(state, action: PayloadAction<{ scheme: SicknessScheme } & Actor>) {
      const { scheme, actor } = action.payload;
      const i = state.schemes.findIndex((s) => s.id === scheme.id);
      const next = { ...scheme, lastModifiedBy: actor, lastModifiedAt: nowIso().slice(0, 10) };
      if (i === -1) state.schemes.push(next);
      else state.schemes[i] = next;
      log(state, scheme.tenantId, "scheme_changed", actor, scheme.id, undefined, `${i === -1 ? "Created" : "Updated"} ${scheme.name}`);
    },

    deleteScheme(state, action: PayloadAction<{ id: string } & Actor>) {
      const s = state.schemes.find((x) => x.id === action.payload.id);
      if (!s || s.kind === "system") return;
      state.schemes = state.schemes.filter((x) => x.id !== s.id);
      log(state, s.tenantId, "scheme_changed", action.payload.actor, s.id, undefined, `Deleted ${s.name}`);
    },

    /** Moves employees onto a scheme, ending their current enrolment the day before. */
    enrol(
      state,
      action: PayloadAction<{ tenantId: string; employeeIds: string[]; schemeId: string; effectiveFrom: string } & Actor>,
    ) {
      const { tenantId, employeeIds, schemeId, effectiveFrom, actor } = action.payload;
      const dayBefore = new Date(new Date(effectiveFrom).getTime() - 86400000).toISOString().slice(0, 10);
      for (const employeeId of employeeIds) {
        for (const e of state.enrolments) {
          if (e.employeeId === employeeId && e.tenantId === tenantId && !e.effectiveTo) {
            if (e.effectiveFrom >= effectiveFrom) e.effectiveTo = e.effectiveFrom;
            else e.effectiveTo = dayBefore;
          }
        }
        state.enrolments.push({
          id: nextId("ENR"),
          tenantId,
          employeeId,
          schemeId,
          effectiveFrom,
          enrolledBy: actor,
          enrolledAt: nowIso(),
        });
        log(state, tenantId, "scheme_enrolled", actor, schemeId, employeeId, `From ${effectiveFrom}`);
      }
    },

    endEnrolment(state, action: PayloadAction<{ id: string; effectiveTo: string } & Actor>) {
      const e = state.enrolments.find((x) => x.id === action.payload.id);
      if (!e) return;
      e.effectiveTo = action.payload.effectiveTo;
      log(state, e.tenantId, "scheme_enrolled", action.payload.actor, e.schemeId, e.employeeId, `Ended ${action.payload.effectiveTo}`);
    },

    // ── Bradford & review cases
    recordSnapshot(state, action: PayloadAction<BradfordSnapshot>) {
      state.snapshots.unshift(action.payload);
      if (state.snapshots.length > 3000) state.snapshots.length = 3000;
    },

    openReviewCase(state, action: PayloadAction<{ case: AbsenceReviewCase } & Actor>) {
      const c = action.payload.case;
      const dupe = state.reviewCases.some(
        (x) => x.employeeId === c.employeeId && x.trigger === c.trigger && x.status !== "closed",
      );
      if (dupe) return;
      state.reviewCases.unshift(c);
      log(state, c.tenantId, "review_opened", action.payload.actor, c.id, c.employeeId, c.trigger);
    },

    updateReviewCase(state, action: PayloadAction<{ id: string; changes: Partial<AbsenceReviewCase> } & Actor>) {
      const c = state.reviewCases.find((x) => x.id === action.payload.id);
      if (!c) return;
      Object.assign(c, action.payload.changes);
      if (action.payload.changes.status === "closed") {
        log(state, c.tenantId, "review_closed", action.payload.actor, c.id, c.employeeId, c.outcome);
      }
    },

    updateSettings(state, action: PayloadAction<{ tenantId: string; settings: SicknessSettings } & Actor>) {
      const { tenantId, settings } = action.payload;
      const prev = state.settings[tenantId] ?? DEFAULT_SICKNESS_SETTINGS;
      const rulesChanged = JSON.stringify(prev.bradford) !== JSON.stringify(settings.bradford);
      state.settings[tenantId] = rulesChanged
        ? { ...settings, bradford: { ...settings.bradford, calcVersion: prev.bradford.calcVersion + 1 } }
        : settings;
      log(state, tenantId, "updated", action.payload.actor, "settings", undefined, rulesChanged ? "Bradford rules changed" : "Settings changed");
    },

    setThresholds(state, action: PayloadAction<{ tenantId: string; thresholds: BradfordThreshold[] } & Actor>) {
      const s = (state.settings[action.payload.tenantId] ??= DEFAULT_SICKNESS_SETTINGS);
      s.bradford = { ...s.bradford, thresholds: action.payload.thresholds, calcVersion: s.bradford.calcVersion + 1 };
      log(state, action.payload.tenantId, "updated", action.payload.actor, "thresholds", undefined, "Review thresholds changed");
    },

    // ── Occupational Health
    referToOH(state, action: PayloadAction<{ referral: OHReferral; recordIds: string[] } & Actor>) {
      const { referral, recordIds, actor } = action.payload;
      state.ohCases.unshift(referral);
      for (const r of state.records) {
        if (recordIds.includes(r.id)) {
          r.ohReferralId = referral.id;
          r.linkedCaseId ??= referral.id;
          log(state, r.tenantId, "oh_referred", actor, r.id, r.employeeId, referral.id);
        }
      }
    },

    updateOHCase(state, action: PayloadAction<{ id: string; changes: Partial<OHReferral> & { linkedSicknessIds?: string[] } } & Actor>) {
      const own = state.ohCases.find((c) => c.id === action.payload.id);
      if (own) Object.assign(own, action.payload.changes);
      else state.ohEdits[action.payload.id] = { ...(state.ohEdits[action.payload.id] ?? {}), ...action.payload.changes };
    },

    /** Anonymise closed records past the retention period. */
    purgeExpired(state, action: PayloadAction<{ tenantId: string; before: string } & Actor>) {
      let n = 0;
      for (const r of state.records) {
        if (r.tenantId !== action.payload.tenantId || r.absenceState !== "returned") continue;
        if ((r.endDate ?? "") >= action.payload.before || !r.reasonDetail && r.documents.length === 0) continue;
        r.reasonDetail = undefined;
        r.documents = [];
        n += 1;
      }
      log(state, action.payload.tenantId, "retention_purged", action.payload.actor, "retention", undefined, `${n} records anonymised (ended before ${action.payload.before})`);
    },
  },
});

export const {
  hydrate: hydrateSickness,
  seedTenant,
  reportSickness,
  updateRecord,
  setApproval,
  addDocument,
  logMedicalView,
  setExclusion,
  recordReturn,
  upsertScheme,
  deleteScheme,
  enrol,
  endEnrolment,
  recordSnapshot,
  openReviewCase,
  updateReviewCase,
  updateSettings,
  setThresholds,
  referToOH,
  updateOHCase,
  purgeExpired,
} = slice.actions;
export default slice.reducer;

export { nextId as sicknessId };
