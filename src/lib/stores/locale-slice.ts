import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
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
      state.country = action.payload;
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
        state.data = action.payload;
      })
      .addCase(loadLocale.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Failed to load locale data";
      });
  },
});

export const { setCountry } = localeSlice.actions;
export default localeSlice.reducer;
