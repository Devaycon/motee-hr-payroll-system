import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  DEFAULT_PRESENCE_CHECK_SETTINGS,
  type PresenceCheckSettings,
  type PresencePrompt,
  type PresencePromptOutcome,
} from "@/src/lib/types/presence-check";

interface PresenceCheckState {
  settings: PresenceCheckSettings;
  prompts: PresencePrompt[];
}

const initialState: PresenceCheckState = {
  settings: DEFAULT_PRESENCE_CHECK_SETTINGS,
  prompts: [],
};

const presenceCheckSlice = createSlice({
  name: "presenceCheck",
  initialState,
  reducers: {
    /** Restores a persisted snapshot. */
    hydrate(state, action: PayloadAction<Partial<PresenceCheckState>>) {
      if (action.payload.settings) {
        state.settings = { ...state.settings, ...action.payload.settings };
      }
      if (Array.isArray(action.payload.prompts)) {
        state.prompts = action.payload.prompts;
      }
    },

    updateSettings(
      state,
      action: PayloadAction<Partial<PresenceCheckSettings> & { updatedBy: string }>,
    ) {
      const { updatedBy, ...changes } = action.payload;
      state.settings = {
        ...state.settings,
        ...changes,
        updatedAt: new Date().toISOString(),
        updatedBy,
      };
    },

    /** A new prompt has been shown to a clocked-in employee; awaits a response. */
    addPrompt(state, action: PayloadAction<PresencePrompt>) {
      state.prompts.push(action.payload);
    },

    /** The employee confirmed, or the response window ran out. */
    resolvePrompt(
      state,
      action: PayloadAction<{
        id: string;
        outcome: PresencePromptOutcome;
        respondedAt: string;
      }>,
    ) {
      const prompt = state.prompts.find((p) => p.id === action.payload.id);
      if (!prompt || prompt.outcome) return;
      prompt.outcome = action.payload.outcome;
      prompt.respondedAt = action.payload.respondedAt;
    },
  },
});

export const { hydrate, updateSettings, addPrompt, resolvePrompt } =
  presenceCheckSlice.actions;

export default presenceCheckSlice.reducer;
