import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CountryKey, LocaleBundle } from "@/src/lib/types/locale";

export type LocaleStatus = "idle" | "loading" | "ready" | "error";

interface LocaleState {
  country: CountryKey;
  /**
   * False until the provider has read the persisted country (`motee:country`).
   * The server render and the first client render both start as "ng"; loading
   * the bundle before this flips would load the Nigeria bundle for a UK user.
   */
  hydrated: boolean;
  data: LocaleBundle | null;
  status: LocaleStatus;
  error: string | null;
}

const initialState: LocaleState = {
  country: "ng",
  hydrated: false,
  data: null,
  status: "idle",
  error: null,
};

export const loadLocale = createAsyncThunk<
  LocaleBundle,
  CountryKey,
  { state: { locale: LocaleState } }
>(
  "locale/load",
  async (country) => {
    const mod =
      country === "ng"
        ? await import("@/src/data/locale/nigeria.json")
        : await import("@/src/data/locale/uk.json");
    return mod.default as unknown as LocaleBundle;
  },
  {
    // Only the active, persisted country is ever loaded. Components mount and
    // ask for the bundle before the provider's effect has restored the
    // country; those calls are dropped and retried once it has.
    condition: (country, { getState }) => {
      const { locale } = getState();
      if (!locale.hydrated) return false;
      if (country !== locale.country) return false;
      if (locale.status === "loading") return false;
      if (locale.status === "ready" && locale.data) return false;
      return true;
    },
  },
);

const localeSlice = createSlice({
  name: "locale",
  initialState,
  reducers: {
    /** Restores the persisted country at boot. */
    hydrateCountry(state, action: PayloadAction<CountryKey>) {
      state.country = action.payload;
      state.hydrated = true;
    },
    /**
     * In-memory only. Switching country for real goes through
     * `switchCountry` (src/lib/locale/country-storage.ts), which persists the
     * choice and reloads so every module rebuilds from that country's data.
     */
    setCountry(state, action: PayloadAction<CountryKey>) {
      if (state.country === action.payload) return;
      state.country = action.payload;
      state.data = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadLocale.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadLocale.fulfilled, (state, action) => {
        // A bundle requested for another country never lands.
        if (action.meta.arg !== state.country) return;
        state.status = "ready";
        state.data = action.payload;
      })
      .addCase(loadLocale.rejected, (state, action) => {
        if (action.meta.condition) return;
        state.status = "error";
        state.error = action.error.message ?? "Failed to load locale data";
      });
  },
});

export const { hydrateCountry, setCountry } = localeSlice.actions;
export default localeSlice.reducer;
