import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ERCase, CaseNote } from "@/src/lib/types/grievance";

/**
 * Shared Employee Relations case store, mirroring `workforce-requests-slice`.
 *
 * Before this existed, HR's `GrievancePage` kept cases in local `useState`
 * seeded once from locale demo data — nothing persisted across navigation
 * and nothing an employee submitted anywhere else could ever reach it. This
 * slice is the single source of truth both the HR admin module and the
 * employee self-service "Raise a Case" page read and write.
 */

interface ERCasesState {
  byCountry: Record<string, ERCase[]>;
  status: "idle" | "ready";
}

const initialState: ERCasesState = { byCountry: {}, status: "idle" };

const slice = createSlice({
  name: "erCases",
  initialState,
  reducers: {
    hydrate(
      state,
      action: PayloadAction<{ byCountry: Record<string, ERCase[]> }>,
    ) {
      if (action.payload.byCountry) state.byCountry = action.payload.byCountry;
      state.status = "ready";
    },
    /** Add cases that are not already present, leaving existing ones alone. */
    mergeSeed(
      state,
      action: PayloadAction<{ country: string; cases: ERCase[] }>,
    ) {
      const bucket = (state.byCountry[action.payload.country] ??= []);
      const known = new Set(bucket.map((c) => c.id));
      for (const c of action.payload.cases) {
        if (!known.has(c.id)) bucket.push(c);
      }
      state.status = "ready";
    },
    seedCountry(
      state,
      action: PayloadAction<{ country: string; cases: ERCase[] }>,
    ) {
      if (!state.byCountry[action.payload.country]) {
        state.byCountry[action.payload.country] = action.payload.cases;
      }
      state.status = "ready";
    },
    addCase(state, action: PayloadAction<{ country: string; case: ERCase }>) {
      (state.byCountry[action.payload.country] ??= []).unshift(
        action.payload.case,
      );
    },
    updateCase(
      state,
      action: PayloadAction<{
        country: string;
        id: string;
        patch: Partial<ERCase>;
      }>,
    ) {
      const list = state.byCountry[action.payload.country];
      const c = list?.find((x) => x.id === action.payload.id);
      if (c) Object.assign(c, action.payload.patch);
    },
    addNote(
      state,
      action: PayloadAction<{ country: string; id: string; note: CaseNote }>,
    ) {
      const list = state.byCountry[action.payload.country];
      const c = list?.find((x) => x.id === action.payload.id);
      if (c) {
        c.notes = [...c.notes, action.payload.note];
        c.updatedAt = new Date().toISOString().split("T")[0];
      }
    },
    deleteCase(
      state,
      action: PayloadAction<{ country: string; id: string }>,
    ) {
      const list = state.byCountry[action.payload.country];
      if (list) {
        state.byCountry[action.payload.country] = list.filter(
          (x) => x.id !== action.payload.id,
        );
      }
    },
  },
});

export const {
  hydrate,
  seedCountry,
  mergeSeed,
  addCase,
  updateCase,
  addNote,
  deleteCase,
} = slice.actions;

export default slice.reducer;
