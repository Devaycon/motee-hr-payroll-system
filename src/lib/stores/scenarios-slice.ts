import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  Scenario,
  ScenarioAdjustment,
} from "@/src/lib/types/headcount-scenarios";

/**
 * §6.8 — headcount planning scenarios.
 *
 * Scenarios live in their own slice, deliberately separate from the plans they
 * model. A what-if that could write back into the live plan would stop being a
 * what-if; keeping them apart makes that impossible rather than merely
 * discouraged.
 */
interface ScenariosState {
  scenarios: Scenario[];
}

const initialState: ScenariosState = {
  scenarios: [],
};

function uid(): string {
  return `SC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const scenariosSlice = createSlice({
  name: "scenarios",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<Scenario[]>) {
      if (!Array.isArray(action.payload)) return;
      state.scenarios = action.payload;
    },

    createScenario(
      state,
      action: PayloadAction<Omit<Scenario, "id" | "createdAt">>,
    ) {
      state.scenarios.push({
        ...action.payload,
        id: uid(),
        createdAt: today(),
      });
    },

    updateScenario(state, action: PayloadAction<Scenario>) {
      const idx = state.scenarios.findIndex((s) => s.id === action.payload.id);
      if (idx === -1) return;
      state.scenarios[idx] = {
        ...action.payload,
        // Provenance survives an edit.
        createdAt: state.scenarios[idx].createdAt,
        createdBy: state.scenarios[idx].createdBy,
      };
    },

    /** Change one department's numbers within a scenario. */
    setAdjustment(
      state,
      action: PayloadAction<{
        scenarioId: string;
        adjustment: ScenarioAdjustment;
      }>,
    ) {
      const scenario = state.scenarios.find(
        (s) => s.id === action.payload.scenarioId,
      );
      if (!scenario) return;
      const idx = scenario.adjustments.findIndex(
        (a) => a.department === action.payload.adjustment.department,
      );
      if (idx === -1) scenario.adjustments.push(action.payload.adjustment);
      else scenario.adjustments[idx] = action.payload.adjustment;
    },

    duplicateScenario(state, action: PayloadAction<string>) {
      const source = state.scenarios.find((s) => s.id === action.payload);
      if (!source) return;
      state.scenarios.push({
        ...source,
        id: uid(),
        name: `${source.name} (Copy)`,
        adjustments: source.adjustments.map((a) => ({ ...a })),
        createdAt: today(),
      });
    },

    deleteScenario(state, action: PayloadAction<string>) {
      state.scenarios = state.scenarios.filter((s) => s.id !== action.payload);
    },
  },
});

export const {
  hydrate,
  createScenario,
  updateScenario,
  setAdjustment,
  duplicateScenario,
  deleteScenario,
} = scenariosSlice.actions;
export default scenariosSlice.reducer;
export type { ScenariosState };
