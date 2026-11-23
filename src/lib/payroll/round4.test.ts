import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { round2 } from "./ng/engine";
import { buildPayslips, seedHistory, seedProfile, seedStructure } from "./run-builder";
import { BREAKDOWN_VIEWS, breakdownTable, buildBreakdown } from "./breakdowns";
import { EXCEPTION_RULE_GUIDE, exceptionDetail, inputOrigin, payrollCostYtd } from "./drilldowns";
import { EXCEPTION_RULE_LABELS } from "./validation";

/** Client feedback round 4 — drill-downs, PDF, payslip, HMO, calculator. */

const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const structures = bundle.employees.map((e) => seedStructure(e, settings));
const profilesList = bundle.employees.map(seedProfile);
const base = { elements: SEED_PAY_ELEMENTS, rateSets: NG_RATE_SETS, settings, structures, profiles: profilesList };
const today = new Date("2026-11-23T12:00:00Z");
const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: bundle.loans ?? [], today });
const data = { ...base, ...history };
const people = new Map(bundle.employees.map((e) => [e.id, e]));
const profiles = new Map(profilesList.map((p) => [p.employeeId, p]));
const run = (m: number) => history.runs.find((r) => r.type === "regular" && r.period.month === m)!;
const nov = run(11);

describe("D1 · drill-downs", () => {
  it("the employer cost breakdown ties to the run's employer cost, line by line", () => {
    expect(BREAKDOWN_VIEWS.some((v) => v.key === "employer")).toBe(true);
    const b = buildBreakdown("employer", nov, { people, profiles });
    expect(b.totals.total).toBe(round2(nov.totals.employerCost));
    expect(b.totals.cost).toBe(round2(nov.totals.gross + nov.totals.employerCost));
    expect(round2(b.totals.PENSION_ER + b.totals.NSITF + b.totals.ITF + b.totals.health + b.totals.GROUP_LIFE + b.totals.other)).toBe(b.totals.total);
    expect(breakdownTable(b, "Department").trailer![0]).toContain(b.totals.total);
  });

  it("payroll cost YTD is gross plus every employer contribution, plus balances brought forward", () => {
    const c = payrollCostYtd(2026, history.payslips, history.openingYtd, people);
    const final = history.payslips.filter((p) => p.status === "final" && p.period.year === 2026);
    expect(c.totals.total).toBe(round2(final.reduce((s, p) => s + p.computation.gross + p.computation.employerCost, 0)));
    expect(c.opening).not.toBeNull();
    expect(c.total).toBe(round2(c.totals.total + c.opening!.total));
    expect(round2(c.byDepartment.reduce((s, d) => s + d.total, 0))).toBe(c.totals.total);
    // Every month has more than employer pension now — NSITF, ITF and group life are in.
    for (const m of c.months) expect(m.employer).toBeGreaterThan(m.PENSION_ER);
  });

  it("every exception rule has plain-English guidance, and the detail shows the employee's figures", () => {
    for (const rule of Object.keys(EXCEPTION_RULE_LABELS)) expect(EXCEPTION_RULE_GUIDE[rule as keyof typeof EXCEPTION_RULE_GUIDE]).toBeDefined();
    const e = { id: "X", rule: "variance" as const, severity: "warning" as const, employeeId: nov.employees.find((x) => x.computation)!.employeeId, message: "test" };
    const d = exceptionDetail(e, nov, { data, people, profiles, ruleLabel: "Variance" });
    expect(d.lines.map((l) => l.label)).toEqual(["Gross pay", "PAYE", "Total deductions", "Net pay"]);
    expect(d.lines[3].current).toBe(nov.employees.find((x) => x.employeeId === e.employeeId)!.computation!.net);
  });

  it("inputs say where they came from and who added them", () => {
    const loanInput = nov.inputs.find((i) => i.source === "loan")!;
    const o = inputOrigin(loanInput, nov, { loans: bundle.loans ?? [], expenses: [], people, audit: [], profiles });
    expect(o.module).toBe("Loans");
    expect(o.facts.find((f) => f.label === "Loan")?.value).toContain(loanInput.refId!);
    expect(o.addedBy).toMatch(/System/);
    const manual = inputOrigin({ id: "M", employeeId: loanInput.employeeId, code: "ONE_OFF", amount: 5000, source: "manual", addedBy: "Ada", addedAt: "2026-11-20T10:00:00Z" }, nov, { loans: [], expenses: [], people, audit: [], profiles });
    expect(manual).toMatchObject({ module: "Added by hand", addedBy: "Ada", addedAt: "2026-11-20T10:00:00Z" });
  });

  it("payslips still carry every employer line (hiding is display only)", () => {
    const slips = buildPayslips({ run: nov, bundle, data, status: "draft", approvedBy: null, generatedAt: today.toISOString() });
    expect(slips[0].computation.lines.some((l) => l.code === "NSITF")).toBe(true);
  });
});
