import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CountryKey, LocaleBundle } from "@/src/lib/types/locale";

export type LocaleStatus = "idle" | "loading" | "ready" | "error";

interface LocaleState {
  country: CountryKey;
  /** What the screens read: sample content with the live records laid over it. */
  data: LocaleBundle | null;
  /**
   * The sample content for `country`, as shipped with the approved design. It
   * fills the screens that have no endpoint yet, which are shown blurred.
   */
  sample: LocaleBundle | null;
  status: LocaleStatus;
  error: string | null;
}

const initialState: LocaleState = {
  country: "uk",
  data: null,
  sample: null,
  status: "idle",
  error: null,
};

export const loadLocale = createAsyncThunk<LocaleBundle, CountryKey>(
  "locale/load",
  async (country) => {
    const mod =
      country === "ng"
        ? await import("@/src/data/locale/nigeria.json")
        : await import("@/src/data/locale/uk.json");
    return mod.default as unknown as LocaleBundle;
  },
);

const localeSlice = createSlice({
  name: "locale",
  initialState,
  reducers: {
    setCountry(state, action: PayloadAction<CountryKey>) {
      if (state.country === action.payload) return;
      state.country = action.payload;
      // The sample content is per country.
      state.sample = null;
      state.status = "idle";
    },
    /** The merged view built by `useLiveBundle`. */
    setLocaleData(state, action: PayloadAction<LocaleBundle>) {
      state.data = action.payload;
      state.error = null;
    },
    /** Signing out must not leave one company's data for the next sign-in. */
    clearLocaleData(state) {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadLocale.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadLocale.fulfilled, (state, action) => {
        state.status = "ready";
        state.sample = action.payload;
      })
      .addCase(loadLocale.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Failed to load locale data";
      });
  },
});

export const { setCountry, setLocaleData, clearLocaleData } =
  localeSlice.actions;
export default localeSlice.reducer;
