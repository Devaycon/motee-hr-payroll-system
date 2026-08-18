/**
 * §6.8 — headcount planning scenarios ("what if we grew Engineering by 20%?").
 *
 * A scenario is a read-only overlay on the live plan. It never writes back:
 * the whole point is to model a change without committing to it, and a
 * what-if that quietly edited the real targets would be worse than useless.
 */
import type { HeadcountPlan, PlanPeriod } from "./headcount";

/** Per-department adjustments within a scenario. */
export interface ScenarioAdjustment {
  department: string;
  /** Headcount added (or removed, if negative) on top of the current actual. */
  headcountChange: number;
  /** Expected annual attrition for this department, as a percentage. */
  attritionRate: number;
  /** Average annual cost of a new hire, for the cost projection. */
  costPerHire?: number;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  /** The period this scenario is modelled against. */
  basePeriod: PlanPeriod;
  adjustments: ScenarioAdjustment[];
  createdAt: string;
  createdBy: string;
}

export interface ScenarioProjectionRow {
  department: string;
  /** Live figures, straight off the plan. */
  baselineActual: number;
  baselineTarget: number;
  baselineGap: number;
  /** Modelled figures. */
  projectedHeadcount: number;
  projectedGap: number;
  /** People expected to leave over the year at the scenario's attrition rate. */
  expectedLeavers: number;
  /** Hires needed to reach the target once attrition is accounted for. */
  hiresRequired: number;
  /** Annual cost of those hires. */
  projectedCost: number;
}

export interface ScenarioProjection {
  rows: ScenarioProjectionRow[];
  totalBaseline: number;
  totalProjected: number;
  totalHiresRequired: number;
  totalCost: number;
  /** Net change in headcount across every department. */
  netChange: number;
}

/** A default adjustment row for a department currently in the plan. */
export function defaultAdjustment(department: string): ScenarioAdjustment {
  return {
    department,
    headcountChange: 0,
    // 10% is a common planning assumption and an obvious placeholder to change.
    attritionRate: 10,
    costPerHire: undefined,
  };
}

/**
 * Run a scenario against the live plan.
 *
 * Only departments the scenario has an adjustment for are projected — a
 * scenario about Engineering shouldn't imply a claim about Finance.
 */
export function projectScenario(
  scenario: Scenario,
  plans: HeadcountPlan[],
): ScenarioProjection {
  const forPeriod = plans.filter((p) => p.period === scenario.basePeriod);
  const byDepartment = new Map(forPeriod.map((p) => [p.department, p]));

  const rows: ScenarioProjectionRow[] = scenario.adjustments.map((adj) => {
    const plan = byDepartment.get(adj.department);
    const baselineActual = plan?.actual ?? 0;
    const baselineTarget = plan?.target ?? 0;

    const projectedHeadcount = Math.max(
      0,
      baselineActual + adj.headcountChange,
    );
    const expectedLeavers = Math.round(
      baselineActual * (adj.attritionRate / 100),
    );
    // Replacing leavers is a hiring cost even when headcount is flat — the
    // number people usually forget when they model growth.
    const hiresRequired = Math.max(
      0,
      projectedHeadcount - baselineActual + expectedLeavers,
    );
    const costPerHire =
      adj.costPerHire ??
      // Fall back to the department's own average cost when the scenario
      // doesn't state one, rather than pretending hiring is free.
      (plan?.currentCost && baselineActual
        ? Math.round(plan.currentCost / baselineActual)
        : 0);

    return {
      department: adj.department,
      baselineActual,
      baselineTarget,
      baselineGap: baselineActual - baselineTarget,
      projectedHeadcount,
      projectedGap: projectedHeadcount - baselineTarget,
      expectedLeavers,
      hiresRequired,
      projectedCost: hiresRequired * costPerHire,
    };
  });

  const totalBaseline = rows.reduce((s, r) => s + r.baselineActual, 0);
  const totalProjected = rows.reduce((s, r) => s + r.projectedHeadcount, 0);

  return {
    rows,
    totalBaseline,
    totalProjected,
    totalHiresRequired: rows.reduce((s, r) => s + r.hiresRequired, 0),
    totalCost: rows.reduce((s, r) => s + r.projectedCost, 0),
    netChange: totalProjected - totalBaseline,
  };
}
