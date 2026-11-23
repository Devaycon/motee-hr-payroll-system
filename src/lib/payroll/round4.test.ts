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

// ── D2 · payslip employer lines, HMO, AVC requests ──────────────────────────

import { DEMO_HMO_SETTINGS, demoHmoEnrolment, hmoSplit } from "./hmo";
import { DEFAULT_EMPLOYER_LINES, employerLineShown } from "./ng/rate-sets";
import { remittanceStatement } from "./remittances";
import { remittanceAmounts } from "./exports";
import reducer, { decideAvcRequest, submitAvcRequest, type PayrollState, type TenantPayroll } from "@/src/lib/stores/payroll-slice";
import type { HmoPlan, HmoSettings } from "./types";

describe("D2 · HMO", () => {
  const plan = (c: Partial<HmoPlan>): HmoSettings => ({
    providers: [{ id: "P", name: "Test HMO" }],
    plans: [{ id: "X", providerId: "P", name: "Plan", premiumPeriod: "annual", basis: "fixed", individualPremium: 120_000, familyPremium: 300_000, dependantPremium: 24_000, funding: "employer", employerSharePct: 100, employeeShareRelieved: true, employerShareTaxable: false, ...c }],
  });
  const enrol = { planId: "X", coverage: "individual" as const, dependants: 0 };

  it("matches the client's three examples on a ₦120,000 a year premium", () => {
    expect(hmoSplit(plan({ funding: "employer" }), enrol, 0, "2026-11-30")).toMatchObject({ premium: 10_000, employer: 10_000, employee: 0 });
    expect(hmoSplit(plan({ funding: "shared", employerSharePct: 70 }), enrol, 0, "2026-11-30")).toMatchObject({ premium: 10_000, employer: 7_000, employee: 3_000 });
    expect(hmoSplit(plan({ funding: "employee" }), enrol, 0, "2026-11-30")).toMatchObject({ premium: 10_000, employer: 0, employee: 10_000 });
  });

  it("adds family cover and dependants, and respects the start date", () => {
    expect(hmoSplit(plan({}), { planId: "X", coverage: "family", dependants: 2 }, 0, "2026-11-30")!.premium).toBe(25_000 + 4_000);
    expect(hmoSplit(plan({}), { ...enrol, from: "2026-12-01" }, 0, "2026-11-30")).toBeNull();
    expect(hmoSplit(plan({ basis: "percent_of_basic", individualPremium: 2 }), enrol, 500_000, "2026-11-30")!.premium).toBe(10_000);
  });

  // Payroll with demo HMO cover from November.
  const hmoSettings = { ...settings, hmo: DEMO_HMO_SETTINGS };
  const hmoProfiles = bundle.employees.map((e, i) => ({ ...seedProfile(e), hmo: demoHmoEnrolment(i, "2026-11-01") }));
  const hmoBase = { ...base, settings: hmoSettings, profiles: hmoProfiles };
  const h = seedHistory({ tenantId: bundle.tenant.id, bundle, base: hmoBase, loans: bundle.loans ?? [], today });
  const hNov = h.runs.find((r) => r.type === "regular" && r.period.month === 11)!;
  const hOct = h.runs.find((r) => r.type === "regular" && r.period.month === 10)!;

  it("deducts the employee share with PAYE relief and adds the employer share to employer cost", () => {
    const shared = hNov.employees.find((e) => e.computation?.lines.some((l) => l.code === "HMO_EE") && e.computation.lines.some((l) => l.code === "HMO_ER"))!;
    const c = shared.computation!;
    const plain = nov.employees.find((e) => e.employeeId === shared.employeeId)!.computation!;
    const ee = c.lines.find((l) => l.code === "HMO_EE")!.amount;
    const er = c.lines.find((l) => l.code === "HMO_ER")!.amount;
    expect(c.tax.reliefs.find((r) => r.label === "HMO premium (employee share)")?.period).toBe(ee);
    expect(c.gross).toBe(plain.gross);
    expect(round2(c.employerCost - plain.employerCost)).toBe(er);
    expect(c.lines.find((l) => l.code === "PAYE")!.amount).toBeLessThan(plain.lines.find((l) => l.code === "PAYE")!.amount);
    // October is before cover started — unchanged.
    expect(hOct.employees.some((e) => e.computation?.lines.some((l) => l.code.startsWith("HMO_")))).toBe(false);
  });

  it("remits premiums to each provider, employee and employer shares together", () => {
    const ctx = { people, profiles: new Map(hmoProfiles.map((p) => [p.employeeId, p])), settings: hmoSettings };
    const st = remittanceStatement("hmo", [hNov], ctx)!;
    expect(st.total).toBe(remittanceAmounts([hNov]).hmo);
    expect(st.total).toBeGreaterThan(0);
    expect(new Set(st.table.data.map((r) => r[0]))).toEqual(new Set(["Lagoon Health HMO", "Crestline Care HMO"]));
  });
});

describe("D2 · payslip employer lines", () => {
  it("hides NSITF, ITF and group life by default and shows pension and HMO", () => {
    expect(DEFAULT_EMPLOYER_LINES).toMatchObject({ PENSION_ER: true, HMO_ER: true, NSITF: false, ITF: false, GROUP_LIFE: false });
    expect(employerLineShown(undefined, "NSITF")).toBe(false);
    expect(employerLineShown({ employerLines: { NSITF: true } }, "NSITF")).toBe(true);
    expect(employerLineShown({}, "PENSION_ER")).toBe(true);
  });
});

describe("D2 · AVC self-service", () => {
  it("approval writes the AVC and its mandate to the profile; the employee can't approve their own", () => {
    const tenantId = "T1";
    const emp = profilesList[0].employeeId;
    let st: PayrollState = { seedVersion: 11, byTenant: { [tenantId]: { audit: [], runs: [], profiles: [{ ...profilesList[0], avc: null }] } as unknown as TenantPayroll } };
    const request = { id: "A1", employeeId: emp, employeeName: "E", action: "set" as const, mode: "fixed" as const, value: 25_000, effectiveFrom: "2026-12-01", mandate: { reference: "M1", signedOn: "2026-11-23" }, requestedAt: "2026-11-23T10:00:00Z", status: "pending" as const };
    st = reducer(st, submitAvcRequest({ tenantId, actor: "E", request }));
    st = reducer(st, decideAvcRequest({ tenantId, actor: "E", actorId: emp, id: "A1", approved: true }));
    expect(st.byTenant[tenantId].avcRequests![0].status).toBe("pending");
    st = reducer(st, decideAvcRequest({ tenantId, actor: "HR", actorId: "HR1", id: "A1", approved: true }));
    expect(st.byTenant[tenantId].profiles[0].avc).toEqual({ mode: "fixed", value: 25_000, startDate: "2026-12-01", mandate: { reference: "M1", signedOn: "2026-11-23" } });
  });
});

// ── D3 · payslip simulation calculator ──────────────────────────────────────

import { calculate, linesForGross, recurringDeductions } from "./calculator";
import { monthOn } from "./salary-impact";
import { adjustLines } from "./salary-impact";

describe("D3 · payslip calculator", () => {
  const emp = bundle.employees.find((e) => nov.employees.some((x) => x.employeeId === e.id && x.computation))!;
  const current = structures.find((s) => s.employeeId === emp.id)!;
  const date = "2026-12-01";
  const isFixed = (code: string) => SEED_PAY_ELEMENTS.some((e) => e.code === code && e.calculationType === "fixed" && (e.group === "core" || e.group === "allowances"));

  it("the current side is the employee's ordinary month on the live engine", () => {
    const r = calculate(data, bundle, { employeeId: emp.id, lines: current.lines, date, deductions: [] })!;
    const m = monthOn(data, emp, current.lines, date);
    expect(r.current!.gross).toBe(m.gross);
    expect(r.current!.net).toBe(m.net);
    expect(r.proposed.net).toBe(r.current!.net);
  });

  it("a raise flows through PAYE, pension, net pay and the employer's cost", () => {
    const raised = adjustLines(current.lines, "percent", 30, isFixed);
    const r = calculate(data, bundle, { employeeId: emp.id, lines: raised, date, deductions: [] })!;
    expect(r.proposed.gross).toBe(monthOn(data, emp, raised, date).gross);
    expect(r.proposed.paye).toBeGreaterThan(r.current!.paye);
    expect(r.proposed.net).toBeGreaterThan(r.current!.net);
    expect(r.proposed.costToEmployer).toBeGreaterThan(r.current!.costToEmployer);
    expect(r.rows.find((x) => x.code === "PENSION_ER")!.proposed).toBeGreaterThan(r.rows.find((x) => x.code === "PENSION_ER")!.current);
  });

  it("HMO and AVC changes apply to the proposed side only", () => {
    const d2 = { ...data, settings: { ...data.settings, hmo: DEMO_HMO_SETTINGS } };
    const r = calculate(d2, bundle, { employeeId: emp.id, lines: current.lines, date, deductions: [], hmo: { planId: "HMO-SILVER", coverage: "individual", dependants: 0 }, avc: { mode: "fixed", value: 20_000 } })!;
    expect(r.rows.find((x) => x.code === "HMO_EE")).toMatchObject({ current: 0, proposed: 4_500 });
    expect(r.rows.find((x) => x.code === "HMO_ER")).toMatchObject({ current: 0, proposed: 10_500 });
    expect(r.rows.find((x) => x.code === "VOL_PENSION")?.proposed).toBe(20_000);
    expect(r.proposed.gross).toBe(r.current!.gross);
  });

  it("models a new hire from gross alone, and saves nothing", () => {
    const before = JSON.stringify(data.structures);
    const r = calculate(data, bundle, { lines: linesForGross(data, 650_000), date, deductions: [] })!;
    expect(r.current).toBeNull();
    expect(r.proposed.gross).toBeCloseTo(650_000, 0);
    expect(JSON.stringify(data.structures)).toBe(before);
    expect(Array.isArray(recurringDeductions(data, emp.id))).toBe(true);
  });
});
