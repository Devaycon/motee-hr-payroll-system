import type { LocaleBundle } from "@/src/lib/types/locale";
import { compareRuns, defaultPreviousRun, REASON_LABELS } from "./comparison";
import type { TenantPayrollData } from "./run-builder";
import { EMPTY_SCENARIO, latestBaseRun, simulate, type SavedScenario } from "./simulation";
import type { VarianceInvestigation } from "./types";
import { buildForecast, snapshotOf, yearMonths, type BudgetVersion, type ForecastSnapshot, type PlannedHire } from "./budget";
import { round2 } from "./ng/engine";

/**
 * Demo data for Payroll Intelligence: one investigation already being worked,
 * on the latest regular run's largest new one-off payment, so the register,
 * the case page and the sign-off flow have something to show on first open.
 */
export function seedInvestigations(data: TenantPayrollData, bundle: LocaleBundle, today: Date): VarianceInvestigation[] {
  const regular = data.runs.filter((r) => r.type === "regular").sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month));
  const current = regular[0];
  const previous = current ? defaultPreviousRun(data.runs, current) : null;
  if (!current || !previous) return [];
  const cmp = compareRuns(current, previous, { people: new Map(bundle.employees.map((e) => [e.id, e])), elements: data.elements, structures: data.structures });
  const target = cmp.employees.find((e) => e.movements.some((m) => m.kind === "new_payment" && m.reason === "one_off")) ?? cmp.employees.find((e) => Math.abs(e.change) >= 1);
  if (!target) return [];
  const nameOf = (roleId: string) => {
    const id = bundle.roles.find((r) => r.id === roleId)?.linkedEmployeeId;
    const e = bundle.employees.find((x) => x.id === id);
    return e ? { id: e.id, name: e.fullName } : null;
  };
  const hr = nameOf("ROLE-HRADMIN") ?? { id: "", name: "HR Admin" };
  const fin = nameOf("ROLE-FIN") ?? hr;
  const owner = fin.id !== hr.id ? fin : hr;
  const day = (offset: number) => new Date(today.getTime() + offset * 86_400_000).toISOString();
  const reason = (Object.keys(target.reasons)[0] ?? "one_off") as keyof typeof REASON_LABELS;
  return [
    {
      id: "INV-DEMO-001",
      runId: current.id,
      previousRunId: previous.id,
      periodLabel: current.period.label,
      employeeId: target.employeeId,
      employeeName: target.name,
      reason,
      amount: target.change,
      title: `${target.name}: ${REASON_LABELS[reason]} — confirm before approval`,
      finding: target.explanation,
      status: "investigating",
      ownerId: owner.id,
      ownerName: owner.name,
      createdBy: hr.name,
      createdById: hr.id,
      createdAt: day(-2),
      dueDate: day(3).slice(0, 10),
      comments: [
        { id: "C-DEMO-1", at: day(-2), by: hr.name, text: "Please confirm the commission against the approved sales schedule before the run goes to approval." },
        { id: "C-DEMO-2", at: day(-1), by: owner.name, text: "Requested the Q4 commission schedule from Sales Operations." },
      ],
      documents: [],
      history: [
        { at: day(-2), actor: hr.name, action: `Opened and assigned to ${owner.name}`, note: target.explanation },
        { at: day(-1), actor: owner.name, action: "Moved to Under investigation" },
      ],
    },
  ];
}

/** Two salary-review scenarios (5% and 10%), one already approved for planning. */
export function seedScenarios(data: TenantPayrollData, bundle: LocaleBundle, today: Date): SavedScenario[] {
  const base = latestBaseRun(data.runs);
  if (!base) return [];
  const role = (id: string) => {
    const e = bundle.employees.find((x) => x.id === bundle.roles.find((r) => r.id === id)?.linkedEmployeeId);
    return e ? { id: e.id, name: e.fullName } : { id: "", name: id === "ROLE-FIN" ? "Finance" : "HR Admin" };
  };
  const hr = role("ROLE-HRADMIN");
  const fin = role("ROLE-FIN");
  const day = (offset: number) => new Date(today.getTime() + offset * 86_400_000).toISOString();
  const make = (id: string, name: string, pct: number, approved: boolean): SavedScenario => {
    const scenario = { ...EMPTY_SCENARIO, increasePct: pct };
    const r = simulate(data, bundle, base, scenario);
    const history: SavedScenario["history"] = [{ at: day(-6), actor: hr.name, action: "Created" }];
    if (approved) {
      history.push({ at: day(-5), actor: hr.name, action: "Submitted for management review" });
      history.push({ at: day(-4), actor: fin.name, action: "Approved for planning", note: "Use for the 2027 budget." });
    }
    return {
      id,
      name,
      description: `${pct}% on all fixed recurring pay from ${r.months[0].label}`,
      scenario,
      baseRunId: base.id,
      createdBy: hr.name,
      createdById: hr.id,
      createdAt: day(-6),
      updatedAt: day(-6),
      status: approved ? "approved" : "draft",
      ...(approved ? { submittedBy: hr.name, submittedById: hr.id, submittedAt: day(-5), review: { by: fin.name, byId: fin.id, at: day(-4), note: "Use for the 2027 budget." } } : {}),
      snapshot: { monthlyCost: r.sim.employerCost, monthlyChange: r.measures.monthlyRecurringChange, total12Change: r.measures.total12Change, headcount: r.simHeadcount },
      history,
    };
  };
  return [make("SCN-DEMO-05", "Salary review — 5%", 5, true), make("SCN-DEMO-10", "Salary review — 10%", 10, false)];
}

/**
 * Approved FY budgets by department (this year and next) built from the latest
 * month's cost, with the largest department budgeted tightly so the demo shows
 * a projected overspend, one planned hire, and an earlier forecast snapshot.
 */
export function seedBudgets(data: TenantPayrollData, bundle: LocaleBundle, today: Date): { budgets: BudgetVersion[]; plannedHires: PlannedHire[]; forecastSnapshots: ForecastSnapshot[] } {
  const base = latestBaseRun(data.runs);
  if (!base) return { budgets: [], plannedHires: [], forecastSnapshots: [] };
  const dept = new Map(bundle.employees.map((e) => [e.id, e.departmentName]));
  const cost: Record<string, number> = {};
  for (const e of base.employees) if (e.included && e.computation) cost[dept.get(e.employeeId) ?? "Unassigned"] = (cost[dept.get(e.employeeId) ?? "Unassigned"] ?? 0) + e.computation.gross + e.computation.employerCost;
  const tight = Object.entries(cost).sort((a, b) => b[1] - a[1])[0]?.[0];
  const fin = bundle.employees.find((x) => x.id === bundle.roles.find((r) => r.id === "ROLE-FIN")?.linkedEmployeeId);
  const exec = bundle.employees.find((x) => x.id === bundle.roles.find((r) => r.id === "ROLE-EXEC")?.linkedEmployeeId);
  const author = fin?.fullName ?? "Finance";
  const approver = exec?.fullName ?? "Executive";
  const day = (offset: number) => new Date(today.getTime() + offset * 86_400_000).toISOString();
  const version = (year: number, uplift: number, tightUplift: number, at: number): BudgetVersion => ({
    id: `BUD-${year}-V1`,
    name: `FY${year} payroll budget`,
    fiscalYear: year,
    dimension: "department",
    lines: Object.entries(cost)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({ key, months: Object.fromEntries(yearMonths(year).map((m) => [m, round2(v * (key === tight ? tightUplift : uplift))])) })),
    status: "approved",
    createdBy: author,
    createdById: fin?.id,
    createdAt: day(at),
    updatedAt: day(at),
    submittedBy: author,
    submittedById: fin?.id,
    submittedAt: day(at + 1),
    approvedBy: approver,
    approvedById: exec?.id,
    approvedAt: day(at + 2),
    history: [
      { at: day(at), actor: author, action: "Created" },
      { at: day(at + 1), actor: author, action: "Submitted for approval" },
      { at: day(at + 2), actor: approver, action: "Approved" },
    ],
  });
  const budgets = [version(base.period.year, 1.03, 0.97, -300), version(base.period.year + 1, 1.08, 1.0, -20)];
  const plannedHires: PlannedHire[] = tight
    ? [{ id: "PH-DEMO-1", title: "Senior hire (planned)", department: tight, count: 1, monthlyGross: 1_200_000, startMonth: `${base.period.year + 1}-02`, addedBy: author, addedAt: day(-15) }]
    : [];
  const f = buildForecast({ data: { ...data, budgets, plannedHires: [] }, bundle });
  const forecastSnapshots = f ? [{ ...snapshotOf(f, "manual", author, new Date(today.getTime() - 7 * 86_400_000)), id: "FS-DEMO-1" }] : [];
  return { budgets, plannedHires, forecastSnapshots };
}
