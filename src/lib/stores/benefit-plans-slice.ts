import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { BenefitPlan, NewBenefitPlan } from "@/src/lib/types/benefits";
import { DEFAULT_BENEFIT_PLANS } from "@/src/lib/permissions/benefit-plan-seeds";

interface BenefitPlansState {
  plans: BenefitPlan[];
  status: "idle" | "ready";
}

const initialState: BenefitPlansState = {
  plans: DEFAULT_BENEFIT_PLANS,
  status: "ready",
};

function now(): string {
  return new Date().toISOString().slice(0, 10);
}

const benefitPlansSlice = createSlice({
  name: "benefitPlans",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<BenefitPlan[]>) {
      const incoming = action.payload;
      if (!Array.isArray(incoming) || incoming.length === 0) return;
      const incomingIds = new Set(incoming.map((p) => p.id));
      const seedExtras = DEFAULT_BENEFIT_PLANS.filter(
        (d) => !incomingIds.has(d.id),
      );
      state.plans = [...incoming, ...seedExtras];
      state.status = "ready";
    },

    createPlan(
      state,
      action: PayloadAction<NewBenefitPlan & { actorName: string }>,
    ) {
      const { actorName, ...data } = action.payload;
      const id = `BEN-CUSTOM-${Date.now()}`;
      state.plans.push({
        ...data,
        id,
        kind: "custom",
        lastModifiedBy: actorName,
        lastModifiedAt: now(),
        createdAt: now(),
      });
    },

    updatePlan(
      state,
      action: PayloadAction<
        { id: string; actorName: string } & NewBenefitPlan
      >,
    ) {
      const { id, actorName, ...data } = action.payload;
      const plan = state.plans.find((p) => p.id === id);
      if (!plan) return;
      Object.assign(plan, data, {
        lastModifiedBy: actorName,
        lastModifiedAt: now(),
      });
    },

    setPlanStatus(
      state,
      action: PayloadAction<{ id: string; status: BenefitPlan["status"] }>,
    ) {
      const plan = state.plans.find((p) => p.id === action.payload.id);
      if (!plan) return;
      plan.status = action.payload.status;
      plan.lastModifiedAt = now();
    },

    /** System (pre-made) plans can be edited or archived, but not deleted. */
    deletePlan(state, action: PayloadAction<string>) {
      const plan = state.plans.find((p) => p.id === action.payload);
      if (!plan || plan.kind === "system") return;
      state.plans = state.plans.filter((p) => p.id !== action.payload);
    },

    duplicatePlan(
      state,
      action: PayloadAction<{ id: string; actorName: string }>,
    ) {
      const source = state.plans.find((p) => p.id === action.payload.id);
      if (!source) return;
      state.plans.push({
        ...source,
        id: `BEN-CUSTOM-${Date.now()}`,
        name: `${source.name} (Copy)`,
        kind: "custom",
        status: "draft",
        lastModifiedBy: action.payload.actorName,
        lastModifiedAt: now(),
        createdAt: now(),
      });
    },
  },
});

export const {
  hydrate,
  createPlan,
  updatePlan,
  setPlanStatus,
  deletePlan,
  duplicatePlan,
} = benefitPlansSlice.actions;
export default benefitPlansSlice.reducer;
