import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Per-user arrangement of the HR dashboard (client feedback — dashboard
 * customisation). Managers and HR administrators want different information in
 * front of them, so the order, visibility and width of each widget is theirs to
 * set. Widget *identity* lives in the dashboard's widget registry; this slice
 * only stores the user's preferences against those keys, so adding or removing
 * a widget never invalidates a saved layout.
 */
export interface DashboardLayoutState {
  /** Widget keys in display order. Keys absent here fall back to registry order. */
  order: string[];
  /** Widget keys the user has switched off. */
  hidden: string[];
  /** Column span (out of 6) per widget key; unset means the registry default. */
  spans: Record<string, number>;
  /** True once the user has changed anything — drives the "Reset" affordance. */
  customised: boolean;
}

const initialState: DashboardLayoutState = {
  order: [],
  hidden: [],
  spans: {},
  customised: false,
};

const dashboardLayoutSlice = createSlice({
  name: "dashboardLayout",
  initialState,
  reducers: {
    hydrate(_state, action: PayloadAction<DashboardLayoutState>) {
      return action.payload;
    },
    setOrder(state, action: PayloadAction<string[]>) {
      state.order = action.payload;
      state.customised = true;
    },
    toggleHidden(state, action: PayloadAction<string>) {
      const key = action.payload;
      state.hidden = state.hidden.includes(key)
        ? state.hidden.filter((k) => k !== key)
        : [...state.hidden, key];
      state.customised = true;
    },
    setSpan(state, action: PayloadAction<{ key: string; span: number }>) {
      state.spans[action.payload.key] = action.payload.span;
      state.customised = true;
    },
    resetLayout() {
      return initialState;
    },
  },
});

export const { hydrate, setOrder, toggleHidden, setSpan, resetLayout } =
  dashboardLayoutSlice.actions;
export default dashboardLayoutSlice.reducer;
