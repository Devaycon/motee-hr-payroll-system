import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { seedHistory, seedProfile, seedStructure } from "./run-builder";
import { compareRuns, ORIGIN_LABELS, type RunComparison } from "./comparison";
import { blockedReason, runReadiness, type ReadinessInput } from "./readiness";
import type { PayrollRun, VarianceInvestigation } from "./types";

/** Client feedback B1 (readiness score, hard block) and B4 (source attribution, confidence) — Nov 2026. */

const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const structures = bundle.employees.map((e) => seedStructure(e, settings));
const base = { elements: SEED_PAY_ELEMENTS, rateSets: NG_RATE_SETS, settings, structures, profiles: bundle.employees.map(seedProfile) };
const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: bundle.loans ?? [], today: new Date("2026-11-24T12:00:00Z") });
const data = { ...base, ...history };
const ctx = { people: new Map(bundle.employees.map((e) => [e.id, e])), elements: data.elements, structures: data.structures };
const nov = history.runs.find((r) => r.period.month === 11)!;
const oct = history.runs.find((r) => r.period.month === 10)!;
const sep = history.runs.find((r) => r.period.month === 9)!;
const cmp = compareRuns(nov, oct, ctx);

const input = (over: Partial<ReadinessInput> & { run?: PayrollRun; comparison?: RunComparison | null; investigations?: VarianceInvestigation[] } = {}): ReadinessInput => ({
  run: over.run ?? nov,
  data: { ...data, investigations: over.investigations ?? [] },
  earlierOpen: over.earlierOpen ?? 0,
  comparison: over.comparison === undefined ? cmp : over.comparison,
  remittances: over.remittances ?? [],
});

describe("B4 · every movement has an origin and a confidence", () => {
  const all = cmp.employees.flatMap((e) => e.movements);

  it("classifies movements in the client's categories", () => {
    expect(all.length).toBeGreaterThan(0);
    for (const m of all) {
      expect(ORIGIN_LABELS[m.source.origin!]).toBeDefined();
      expect(["confirmed", "verification_required", "unexplained"]).toContain(m.source.confidence);
      // Nothing without a record is ever confirmed.
      if (!m.source.confirmed) expect(m.source.confidence).toBe("unexplained");
    }
  });

  it("a manual payroll input needs verifying on a draft run, and is confirmed once the run is approved", () => {
    const manual = all.filter((m) => m.source.type === "payroll_input");
    expect(manual.length).toBeGreaterThan(0);
    for (const m of manual) expect(m.source).toMatchObject({ origin: "manual_input", confidence: "verification_required" });
    const approved = compareRuns({ ...nov, status: "approved", approvedBy: { employeeId: "x", name: "Exec" } }, oct, ctx);
    for (const m of approved.employees.flatMap((e) => e.movements).filter((x) => x.source.type === "payroll_input")) expect(m.source.confidence).toBe("confirmed");
  });

  it("a bonus that didn't recur is a confirmed one-off; attendance is an attendance record", () => {
    const octVsSep = compareRuns(oct, sep, ctx).employees.flatMap((e) => e.movements);
    const notRepeated = octVsSep.find((m) => m.code === "PERFORMANCE_BONUS" && m.kind === "not_repeated")!;
    expect(notRepeated.source).toMatchObject({ origin: "one_off_payment", confidence: "confirmed" });
    for (const m of octVsSep.filter((x) => x.source.type === "leave_attendance" || x.source.type === "timesheet")) expect(m.source.origin).toBe("attendance_record");
  });

  it("deduction movements are attributed to the statutory calculation", () => {
    const stat = compareRuns(oct, sep, ctx).employees.flatMap((e) => e.statutory);
    expect(stat.some((m) => m.code === "PAYE")).toBe(true);
    for (const m of stat) expect(m.source.origin).toBe("statutory_calculation");
  });

  it("counts employees by confidence and the counts cover everyone who changed", () => {
    const r = cmp.reconciliation;
    const changed = cmp.employees.filter((e) => e.movements.length + e.statutory.length > 0).length;
    expect(r.byConfidence.confirmed + r.byConfidence.verification_required + r.byConfidence.unexplained).toBe(changed);
  });
});

describe("B1 · readiness score and the hard block", () => {
  it("scores 14 controls, 11 of them critical", () => {
    const r = runReadiness(input());
    expect(r.checks).toHaveLength(14);
    expect(r.criticalTotal).toBe(11);
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.checks.find((c) => c.key === "ytd_integrity")?.state).toBe("passed");
  });

  it("a critical failure blocks; acknowledging it with a reason lifts the block", () => {
    const bad: PayrollRun = { ...nov, exceptions: [{ id: "neg:1", rule: "negative_net", severity: "error", employeeId: nov.employees[0].employeeId, message: "net −₦5,000" }] };
    const r = runReadiness(input({ run: bad, comparison: null }));
    expect(r.blocked).toBe(true);
    expect(r.blockers.map((b) => b.key)).toContain("net_pay");
    expect(blockedReason(r, "approval")).toMatch(/^Approval blocked — 1 critical check failed: No negative or zero net pay/);
    const ack: PayrollRun = { ...bad, exceptions: bad.exceptions.map((e) => ({ ...e, acknowledged: { by: "HR", at: "2026-11-24", reason: "Advance recovered next month by agreement" } })) };
    expect(runReadiness(input({ run: ack, comparison: null })).checks.find((c) => c.key === "net_pay")?.state).toBe("passed");
  });

  it("an open investigation blocks until a second person signs off its resolution", () => {
    const inv = { id: "INV-1", runId: nov.id, previousRunId: oct.id, status: "resolved", resolvedBy: "A" } as VarianceInvestigation;
    expect(runReadiness(input({ investigations: [inv], comparison: null })).blockers.map((b) => b.key)).toContain("investigations");
    const signed = { ...inv, signOff: { by: "B", at: "2026-11-24", decision: "accepted" as const } };
    expect(runReadiness(input({ investigations: [signed], comparison: null })).checks.find((c) => c.key === "investigations")?.state).toBe("passed");
  });

  it("an unexplained movement blocks unless an investigation covers the employee", () => {
    const e = cmp.employees.find((x) => x.movements.length)!;
    const forced: RunComparison = { ...cmp, employees: cmp.employees.map((x) => (x.employeeId === e.employeeId ? { ...x, confidence: "unexplained" } : x)) };
    expect(runReadiness(input({ comparison: forced })).blockers.map((b) => b.key)).toContain("variances");
    const covering = { id: "INV-2", runId: nov.id, employeeId: e.employeeId, status: "resolved", signOff: { by: "B", at: "x", decision: "accepted" } } as VarianceInvestigation;
    expect(runReadiness(input({ comparison: forced, investigations: [covering] })).checks.find((c) => c.key === "variances")?.state).not.toBe("failed");
  });

  it("review items lower the score but never block", () => {
    const warned: PayrollRun = { ...nov, exceptions: [{ id: "w1", rule: "variance", severity: "warning", message: "x" }] };
    const r = runReadiness(input({ run: warned, comparison: null }));
    const clean = runReadiness(input({ run: { ...nov, exceptions: [] }, comparison: null }));
    expect(r.blocked).toBe(false);
    expect(r.score).toBeLessThan(clean.score);
    expect(clean.score).toBe(100);
  });

  it("a stale run or an open earlier month is a critical failure", () => {
    expect(runReadiness(input({ run: { ...nov, stale: { reason: "salary changed", at: "x" } } as PayrollRun, comparison: null })).blocked).toBe(true);
    expect(runReadiness(input({ earlierOpen: 1, comparison: null })).blockers.map((b) => b.key)).toContain("months_in_order");
  });
});
