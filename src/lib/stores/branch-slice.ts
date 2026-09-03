import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setCountry } from "./locale-slice";

export interface BranchState {
  /**
   * The site the whole app is currently scoped to. `null` means "All
   * Branches" — the unscoped default, and the only value that leaves the
   * locale bundle untouched.
   */
  activeBranchId: string | null;
}

const initialState: BranchState = { activeBranchId: null };

const branchSlice = createSlice({
  name: "branch",
  initialState,
  reducers: {
    setActiveBranch(state, action: PayloadAction<string | null>) {
      state.activeBranchId = action.payload;
    },
    /**
     * Switching tenant/locale invalidates the selection — branch ids are
     * bundle-local, so a stale id would scope every screen to nothing.
     */
    clearActiveBranch(state) {
      state.activeBranchId = null;
    },
    hydrate(state, action: PayloadAction<BranchState>) {
      state.activeBranchId = action.payload.activeBranchId;
    },
  },
  extraReducers: (builder) => {
    // Branch ids are bundle-local, so a tenant switch must drop the selection
    // rather than leave every screen scoped to an id the new bundle lacks.
    builder.addCase(setCountry, (state) => {
      state.activeBranchId = null;
    });
  },
});

export const { setActiveBranch, clearActiveBranch, hydrate } =
  branchSlice.actions;
export default branchSlice.reducer;
