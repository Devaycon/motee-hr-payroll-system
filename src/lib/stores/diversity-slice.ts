import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  DiversityDeclaration,
  Jurisdiction,
} from "@/src/lib/types/diversity";

/**
 * §6.23 — self-declared diversity data, keyed by employee.
 *
 * There is exactly one writing action and it takes no actor: a declaration is
 * always made by the person it concerns. HR has no way to set, amend or clear
 * someone else's answers through this slice, which is the point — the absence
 * of an admin setter is a feature, not an omission.
 */
interface DiversityState {
  /** employeeId → their own declaration. */
  declarations: Record<string, DiversityDeclaration>;
}

const initialState: DiversityState = {
  declarations: {},
};

const diversitySlice = createSlice({
  name: "diversity",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<Record<string, DiversityDeclaration>>) {
      if (action.payload && typeof action.payload === "object") {
        state.declarations = action.payload;
      }
    },

    /** The employee saves (or updates) their own answers. */
    declare(
      state,
      action: PayloadAction<{
        employeeId: string;
        jurisdiction: Jurisdiction;
        answers: Omit<DiversityDeclaration, "declaredAt" | "jurisdiction">;
      }>,
    ) {
      const { employeeId, jurisdiction, answers } = action.payload;
      state.declarations[employeeId] = {
        ...answers,
        jurisdiction,
        declaredAt: new Date().toISOString(),
      };
    },

    /**
     * The employee withdraws their answers entirely. Required: consent to
     * share this data has to be as easy to take back as it was to give.
     */
    withdraw(state, action: PayloadAction<string>) {
      delete state.declarations[action.payload];
    },
  },
});

export const { hydrate, declare, withdraw } = diversitySlice.actions;
export default diversitySlice.reducer;
export type { DiversityState };
