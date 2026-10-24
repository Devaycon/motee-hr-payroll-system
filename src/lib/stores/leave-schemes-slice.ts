import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LeaveScheme, LeaveSchemeEnrolment } from "@/src/lib/types/leave-schemes";

/** Leave schemes and who is enrolled on which — tenant-tagged, like sickness. */
export interface LeaveSchemesState {
  schemes: LeaveScheme[];
  enrolments: LeaveSchemeEnrolment[];
  seededTenants: string[];
}

const initialState: LeaveSchemesState = { schemes: [], enrolments: [], seededTenants: [] };

let seq = 0;
const nextId = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;
const today = () => new Date().toISOString().slice(0, 10);

const slice = createSlice({
  name: "leaveSchemes",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<Partial<LeaveSchemesState>>) {
      const p = action.payload;
      if (Array.isArray(p.schemes)) state.schemes = p.schemes;
      if (Array.isArray(p.enrolments)) state.enrolments = p.enrolments;
      if (Array.isArray(p.seededTenants)) state.seededTenants = p.seededTenants;
    },
    seedTenant(state, action: PayloadAction<{ tenantId: string; schemes: LeaveScheme[]; enrolments: LeaveSchemeEnrolment[] }>) {
      if (state.seededTenants.includes(action.payload.tenantId)) return;
      state.schemes.push(...action.payload.schemes);
      state.enrolments.push(...action.payload.enrolments);
      state.seededTenants.push(action.payload.tenantId);
    },
    upsertLeaveScheme(state, action: PayloadAction<{ scheme: LeaveScheme; actor: string }>) {
      const s = { ...action.payload.scheme, lastModifiedBy: action.payload.actor, lastModifiedAt: today() };
      const i = state.schemes.findIndex((x) => x.id === s.id);
      if (i === -1) state.schemes.push(s);
      else state.schemes[i] = s;
    },
    deleteLeaveScheme(state, action: PayloadAction<string>) {
      const s = state.schemes.find((x) => x.id === action.payload);
      if (!s || s.kind === "system") return;
      if (state.enrolments.some((e) => e.schemeId === s.id && !e.effectiveTo)) return;
      state.schemes = state.schemes.filter((x) => x.id !== s.id);
    },
    /** Moves people onto a scheme; their current enrolment ends the day before. */
    enrolOnLeaveScheme(
      state,
      action: PayloadAction<{ tenantId: string; employeeIds: string[]; schemeId: string; effectiveFrom: string; actor: string }>,
    ) {
      const { tenantId, employeeIds, schemeId, effectiveFrom, actor } = action.payload;
      const dayBefore = new Date(new Date(effectiveFrom).getTime() - 86400000).toISOString().slice(0, 10);
      for (const employeeId of employeeIds) {
        for (const e of state.enrolments) {
          if (e.tenantId === tenantId && e.employeeId === employeeId && !e.effectiveTo) {
            e.effectiveTo = e.effectiveFrom >= effectiveFrom ? e.effectiveFrom : dayBefore;
          }
        }
        state.enrolments.push({
          id: nextId("LVE"),
          tenantId,
          employeeId,
          schemeId,
          effectiveFrom,
          enrolledBy: actor,
          enrolledAt: new Date().toISOString(),
        });
      }
    },
  },
});

export const {
  hydrate: hydrateLeaveSchemes,
  seedTenant: seedLeaveSchemes,
  upsertLeaveScheme,
  deleteLeaveScheme,
  enrolOnLeaveScheme,
} = slice.actions;
export default slice.reducer;
export { nextId as leaveSchemeId };
