import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  DEFAULT_COVERAGE_OPTIONS,
  type BenefitPlan,
  type NewBenefitPlan,
} from "@/src/lib/types/benefits";
import { DEFAULT_BENEFIT_PLANS } from "@/src/lib/permissions/benefit-plan-seeds";

interface BenefitPlansState {
  plans: BenefitPlan[];
  /** HR-managed coverage levels shown in the plan form's Coverage dropdown. */
  coverageOptions: string[];
  status: "idle" | "ready";
}

const initialState: BenefitPlansState = {
  plans: DEFAULT_BENEFIT_PLANS,
  coverageOptions: DEFAULT_COVERAGE_OPTIONS,
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
      // System plans persisted before plans carried a country/enrollment would
      // otherwise show a Nigerian HMO to a UK tenant — take those from the seed.
      const seedById = new Map(DEFAULT_BENEFIT_PLANS.map((d) => [d.id, d]));
      const backfilled = incoming.map((p) => {
        const seed = seedById.get(p.id);
        if (!seed || p.kind !== "system") return p;
        return {
          ...p,
          country: "country" in p ? p.country : seed.country,
          enrollment: p.enrollment ?? seed.enrollment,
          coverage: p.coverage ?? seed.coverage,
        };
      });
      state.plans = [...backfilled, ...seedExtras];
      state.status = "ready";
    },

    hydrateCoverageOptions(state, action: PayloadAction<string[]>) {
      if (Array.isArray(action.payload)) state.coverageOptions = action.payload;
    },

    addCoverageOption(state, action: PayloadAction<string>) {
      const label = action.payload.trim();
      if (!label) return;
      if (state.coverageOptions.some((o) => o.toLowerCase() === label.toLowerCase())) return;
      state.coverageOptions.push(label);
    },

    /** Renaming carries every plan on the old label across to the new one. */
    renameCoverageOption(state, action: PayloadAction<{ from: string; to: string }>) {
      const to = action.payload.to.trim();
      const idx = state.coverageOptions.indexOf(action.payload.from);
      if (!to || idx === -1) return;
      state.coverageOptions[idx] = to;
      for (const p of state.plans) if (p.coverage === action.payload.from) p.coverage = to;
    },

    /** Plans on a removed level keep no coverage rather than a dangling label. */
    removeCoverageOption(state, action: PayloadAction<string>) {
      state.coverageOptions = state.coverageOptions.filter((o) => o !== action.payload);
      for (const p of state.plans) if (p.coverage === action.payload) p.coverage = undefined;
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
  hydrateCoverageOptions,
  addCoverageOption,
  renameCoverageOption,
  removeCoverageOption,
  createPlan,
  updatePlan,
  setPlanStatus,
  deletePlan,
  duplicatePlan,
} = benefitPlansSlice.actions;
export default benefitPlansSlice.reducer;
