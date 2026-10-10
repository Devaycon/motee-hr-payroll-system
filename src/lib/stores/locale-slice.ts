import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CountryKey, LocaleBundle } from "@/src/lib/types/locale";

export type LocaleStatus = "idle" | "loading" | "ready" | "error";

interface LocaleState {
  country: CountryKey;
  data: LocaleBundle | null;
  status: LocaleStatus;
  error: string | null;
}

const initialState: LocaleState = {
  country: "uk",
  data: null,
  status: "idle",
  error: null,
};

/**
 * The company data every screen reads. It is assembled from the API by
 * `useLiveBundle` and pushed in here — nothing loads fixtures any more.
 */
const localeSlice = createSlice({
  name: "locale",
  initialState,
  reducers: {
    setCountry(state, action: PayloadAction<CountryKey>) {
      state.country = action.payload;
    },
    setLocaleData(state, action: PayloadAction<LocaleBundle>) {
      state.data = action.payload;
      state.status = "ready";
      state.error = null;
    },
    /** Signing out must not leave one company's data for the next sign-in. */
    clearLocaleData(state) {
      state.data = null;
      state.status = "idle";
      state.error = null;
    },
  },
});

export const { setCountry, setLocaleData, clearLocaleData } =
  localeSlice.actions;
export default localeSlice.reducer;
