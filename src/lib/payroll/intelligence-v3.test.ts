import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import reducer, {
  openInvestigation,
  resolveInvestigation,
  signOffInvestigation,
  type PayrollState,
  type TenantPayroll,
} from "@/src/lib/stores/payroll-slice";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { round2 } from "./ng/engine";
import { seedHistory, seedProfile, seedStructure } from "./run-builder";
import { compareRuns, type ComparisonCtx } from "./comparison";
import { intelligenceSummary, varianceNarrative } from "./intelligence";
import { seedInvestigations } from "./seed-intelligence";
import type { PayrollRun, SalaryStructure, VarianceInvestigation } from "./types";

/**
 * Client recommendations round 3 — Payroll Variance Intelligence: every
 * movement attributed, reconciled to the kobo, classified by kind and
 * traced to a source; nothing explained without a record behind it.
 */

const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const structures = bundle.employees.map((e) => seedStructure(e, settings));
const base = { elements: SEED_PAY_ELEMENTS, rateSets: NG_RATE_SETS, settings, structures, profiles: bundle.employees.map(seedProfile) };
const today = new Date("2026-11-23T12:00:00Z");
const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: bundle.loans ?? [], today });
const run = (m: number) => history.runs.find((r) => r.type === "regular" && r.period.month === m)!;
const nov = run(11);
const oct = run(10);
const ctx: ComparisonCtx = { people: new Map(bundle.employees.map((e) => [e.id, e])), elements: SEED_PAY_ELEMENTS, structures };
const cmp = compareRuns(nov, oct, ctx);

/** A copy of November where one employee's basic pay is raised by `extra`. */
function withRaise(employeeId: string, extra: number): PayrollRun {
  const r: PayrollRun = structuredClone(nov);
  const re = r.employees.find((e) => e.employeeId === employeeId)!;
  const c = re.computation!;
  c.lines.find((l) => l.code === "BASIC")!.amount += extra;
  c.gross = round2(c.gross + extra);
  r.totals.gross = round2(r.totals.gross + extra);
  return r;
}

describe("variance reconciliation", () => {
  it("attributes every naira: the waterfall runs from opening to closing gross", () => {
    const r = cmp.reconciliation;
    expect(r.opening).toBe(oct.totals.gross);
    expect(r.closing).toBe(nov.totals.gross);
    expect(r.balanced).toBe(true);
    expect(round2(cmp.bridge.reduce((s, b) => s + b.amount, 0))).toBe(r.change);
    const steps = cmp.waterfall.filter((w) => w.type === "step");
    expect(round2(steps.reduce((s, w) => s + w.value, 0))).toBe(round2(r.closing - r.opening));
    expect(steps[steps.length - 1].end).toBe(r.closing);
  });

  it("pay components add back to gross and net for every employee and in total", () => {
    const val = (lines: typeof cmp.componentTotals, k: string) => lines.find((l) => l.key === k)!.current;
    const earningKeys = ["basic", "housing", "transport", "otherAllowances", "overtime", "bonuses", "attendance", "otherEarnings"];
    expect(round2(earningKeys.reduce((s, k) => s + val(cmp.componentTotals, k), 0))).toBe(nov.totals.gross);
    expect(val(cmp.componentTotals, "net")).toBe(nov.totals.net);
    expect(val(cmp.componentTotals, "costToEmployer")).toBe(round2(nov.totals.gross + nov.totals.employerCost));
    for (const e of cmp.employees) {
      const g = e.components.find((c) => c.key === "gross")!.current;
      expect(round2(earningKeys.reduce((s, k) => s + val(e.components, k), 0))).toBe(round2(g));
    }
  });
});

describe("classification", () => {
  it("timesheet overtime is overtime, not unpaid leave", () => {
    const ot = cmp.employees.filter((e) => e.movements.some((m) => m.code.startsWith("OT_")));
    expect(ot.length).toBeGreaterThan(0);
    for (const e of ot) for (const m of e.movements.filter((x) => x.code.startsWith("OT_"))) {
      expect(m.reason).toBe("overtime");
      expect(m.source.type).toBe("timesheet");
    }
  });

  it("tells a payment that did not recur from a new payment and a reduction to pay", () => {
    const kinds = new Set(cmp.employees.flatMap((e) => e.movements.map((m) => `${m.code}:${m.kind}`)));
    expect([...kinds].some((k) => k.startsWith("LEAVE_ALLOW:not_repeated"))).toBe(true);
    expect([...kinds].some((k) => k.endsWith(":new_payment"))).toBe(true);
    const leave = cmp.employees.find((e) => e.movements.some((m) => m.code === "LEAVE_ALLOW"))!;
    expect(leave.explanation).toMatch(/Leave Allowance paid in October 2026 .* did not recur/);
    expect(leave.movements[0].source.confirmed).toBe(true);
  });

  it("marks each reason recurring or non-recurring", () => {
    for (const b of cmp.bridge) expect(["recurring", "non_recurring", "unclassified"]).toContain(b.nature);
    expect(cmp.bridge.find((b) => b.reason === "one_off")?.nature).toBe("non_recurring");
  });
});

describe("source attribution", () => {
  const id = nov.employees.find((e) => e.computation && !cmp.employees.find((x) => x.employeeId === e.employeeId && x.change))!.employeeId;

  it("a recurring-pay change with no salary record requires investigation", () => {
    const c = compareRuns(withRaise(id, 85_000), oct, ctx);
    const e = c.employees.find((x) => x.employeeId === id)!;
    expect(e.reasons.salary_change).toBe(85_000);
    expect(e.movements[0].source.confirmed).toBe(false);
    expect(e.unexplained).toBe(85_000);
    expect(e.explanation).toMatch(/reason requires investigation/);
    expect(c.reconciliation.unexplained).toBe(85_000);
    expect(c.reconciliation.balanced).toBe(true);
    expect(varianceNarrative(c)).toMatch(/could not be traced to a confirmed source and requires investigation/);
    expect(intelligenceSummary(c).insights.some((i) => i.title === "Unclassified movement")).toBe(true);
  });

  it("an approved salary change is traced to the record, who proposed and approved it", () => {
    const s: SalaryStructure = {
      ...structures.find((x) => x.employeeId === id)!,
      id: "SS-TEST",
      effectiveFrom: "2026-11-01",
      reason: "Promotion",
      proposedBy: "Ada HR",
      approvedBy: "Bayo Finance",
      approvedAt: "2026-10-28T09:00:00Z",
    };
    const c = compareRuns(withRaise(id, 85_000), oct, { ...ctx, structures: [...structures, s] });
    const e = c.employees.find((x) => x.employeeId === id)!;
    expect(e.movements[0].source).toMatchObject({ type: "salary_change", confirmed: true, initiatedBy: "Ada HR", approvedBy: "Bayo Finance", ref: "SS-TEST" });
    expect(e.explanation).toBe("Gross pay increased by ₦85,000.00 because basic salary was revised (from 1 November 2026 — Promotion).");
    expect(e.unexplained).toBe(0);
  });
});

describe("narrative", () => {
  it("reads as a financial analysis with exact, reconciled figures", () => {
    const n = varianceNarrative(cmp);
    expect(n).toMatch(/^Gross payroll decreased by ₦2,768,535\.30 \(10\.26%\) compared with October 2026\./);
    expect(n).toContain("The primary driver was the non-recurrence of one-off payments affecting five employees, accounting for a reduction of ₦2,879,999.97.");
    expect(n).toContain("This was partially offset by");
    expect(n).toContain("overtime and shift pay");
    expect(n).toMatch(/reconcile in full to the payroll register\.$/);
  });

  it("the summary counts affected employees and categories", () => {
    const s = intelligenceSummary(cmp);
    expect(s.employeesAffected).toBe(cmp.employees.filter((e) => e.change).length);
    expect(s.categories).toBe(cmp.bridge.length);
    expect(s.balanced).toBe(true);
    expect(s.insights[0].title).toBe("Primary driver: One-off payments");
  });
});

describe("investigation workflow", () => {
  const tenantId = "T1";
  const inv: VarianceInvestigation = {
    id: "INV-1",
    runId: nov.id,
    previousRunId: oct.id,
    periodLabel: nov.period.label,
    amount: 1000,
    title: "Test",
    finding: "x",
    status: "open",
    ownerId: "E1",
    ownerName: "Owner",
    createdBy: "Raiser",
    createdAt: "2026-11-20T00:00:00Z",
    comments: [],
    documents: [],
    history: [],
  };
  const start = (): PayrollState => ({ seedVersion: 8, byTenant: { [tenantId]: { audit: [], runs: [] } as unknown as TenantPayroll } });

  it("the person who resolved it cannot sign it off; someone else can", () => {
    let s = reducer(start(), openInvestigation({ tenantId, actor: "Raiser", investigation: inv }));
    s = reducer(s, resolveInvestigation({ tenantId, actor: "Owner", actorId: "E1", id: "INV-1", note: "Commission matches the schedule", outcome: "legitimate" }));
    expect(s.byTenant[tenantId].investigations![0].status).toBe("resolved");
    s = reducer(s, signOffInvestigation({ tenantId, actor: "Owner", actorId: "E1", id: "INV-1", decision: "accepted" }));
    expect(s.byTenant[tenantId].investigations![0].signOff).toBeUndefined();
    s = reducer(s, signOffInvestigation({ tenantId, actor: "Finance", actorId: "E9", id: "INV-1", decision: "accepted" }));
    expect(s.byTenant[tenantId].investigations![0].signOff?.decision).toBe("accepted");
    expect(s.byTenant[tenantId].audit.some((a) => a.action === "Signed off variance investigation")).toBe(true);
  });

  it("reopening sends it back to investigation", () => {
    let s = reducer(start(), openInvestigation({ tenantId, actor: "Raiser", investigation: inv }));
    s = reducer(s, resolveInvestigation({ tenantId, actor: "Owner", actorId: "E1", id: "INV-1", note: "Done", outcome: "legitimate" }));
    s = reducer(s, signOffInvestigation({ tenantId, actor: "Finance", actorId: "E9", id: "INV-1", decision: "reopened", note: "Attach the schedule" }));
    const i = s.byTenant[tenantId].investigations![0];
    expect(i.status).toBe("investigating");
    expect(i.history.at(-1)?.action).toBe("Reopened the investigation");
  });

  it("the demo seed raises one case on the latest month's movement", () => {
    const seeded = seedInvestigations({ ...base, ...history }, bundle, today);
    expect(seeded).toHaveLength(1);
    expect(seeded[0].runId).toBe(nov.id);
    expect(seeded[0].finding).toMatch(/^Gross pay (in|de)creased by/);
  });
});
