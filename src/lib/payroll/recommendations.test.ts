import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import reducer, { decideConfigChange, addConfigChange, seedTenantPayroll, updatePayrollSettings, upsertElement } from "@/src/lib/stores/payroll-slice";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { calculateRun, seedHistory, seedProfile, seedStructure } from "./run-builder";
import { elementMapOn, elementOn, settingsOn, versionElement } from "./config";
import { remittanceRows, remindersDue, statusOf, summarise } from "./remittance-centre";
import { seedRemittances } from "./remittances";
import { costBy, explainVariance, forecastVsBudget, grossToNet, monthsOf, processingTimes, yearToDate } from "./intelligence";
import { EMPTY_SCENARIO, simulate } from "./simulation";
import { adjustLines, salaryImpact } from "./salary-impact";
import { validateRun } from "./validation";
import { maskAccount } from "./breakdowns";
import type { PayElement, PayrollRun } from "./types";

/** Client feedback round 2 ("Payroll Recommendation"): configuration control, remittances, analytics, simulation, controls. */
const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const base = {
  elements: SEED_PAY_ELEMENTS,
  rateSets: NG_RATE_SETS,
  settings,
  structures: bundle.employees.map((e) => seedStructure(e, settings)),
  profiles: bundle.employees.map(seedProfile),
};
const today = new Date("2026-11-18T12:00:00Z");
const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: bundle.loans ?? [], today });
const data = { ...base, ...history };
const people = new Map(bundle.employees.map((e) => [e.id, e]));
const [, sep, oct, nov] = history.runs;

describe("A · pay element configuration", () => {
  const housing = SEED_PAY_ELEMENTS.find((e) => e.code === "HOUSING")!;

  it("keeps the old rules for periods before a change takes effect", () => {
    const changed = versionElement(housing, { ...housing, taxTreatment: "exempt", taxable: false, glCode: "6110" }, "2027-01-01");
    expect(changed.history).toHaveLength(1);
    expect(elementOn(changed, "2026-09-30")!.taxable).toBe(true);
    expect(elementOn(changed, "2027-01-31")!.taxable).toBe(false);
  });

  it("doesn't pay an element before its effective date", () => {
    const el: PayElement = { ...housing, code: "NEW_ALLOW", effectiveFrom: "2027-01-01" };
    expect(elementMapOn([el], "2026-12-31").has("NEW_ALLOW")).toBe(false);
    expect(elementMapOn([el], "2027-01-31").has("NEW_ALLOW")).toBe(true);
  });

  it("taxes a conditional element only above its monthly cap", () => {
    const run = nov;
    const baseline = calculateRun(run, data, bundle);
    const conditional = data.elements.map((e) => (e.code === "TRANSPORT" ? { ...e, taxTreatment: "conditional" as const, taxExemptMonthlyCap: 20_000 } : e));
    const after = calculateRun(run, { ...data, elements: conditional }, bundle);
    const a = baseline.employees.find((e) => e.computation?.lines.some((l) => l.code === "TRANSPORT" && l.amount > 20_000))!;
    const b = after.employees.find((e) => e.employeeId === a.employeeId)!;
    expect(a.computation!.taxableGross - b.computation!.taxableGross).toBeCloseTo(20_000, 2);
    expect(b.computation!.gross).toBe(a.computation!.gross);
  });
});

describe("C · effective-dated settings", () => {
  it("re-running an earlier month uses the settings in force then", () => {
    const versions = [
      { effectiveFrom: "0000-01-01", settings, changedBy: "System", changedAt: "2026-01-01" },
      { effectiveFrom: "2027-01-01", settings: { ...settings, nhfBasis: "basic" as const }, changedBy: "HR", changedAt: "2026-12-01" },
    ];
    expect(settingsOn({ ...settings, nhfBasis: "basic" }, versions, "2026-09-30").nhfBasis ?? "gross").toBe("gross");
    expect(settingsOn({ ...settings, nhfBasis: "basic" }, versions, "2027-01-31").nhfBasis).toBe("basic");
  });

  it("the slice versions a change and logs who, what, when and from when", () => {
    const tenantId = bundle.tenant.id;
    let s = reducer(undefined, seedTenantPayroll({ tenantId, data: { ...data, audit: [], remittances: {} } }));
    s = reducer(s, updatePayrollSettings({ tenantId, actor: "Ada", changes: { nhfBasis: "basic" }, effectiveFrom: "2027-01-01" }));
    const t = s.byTenant[tenantId];
    expect(t.settingsVersions?.map((v) => v.effectiveFrom)).toEqual(["0000-01-01", "2027-01-01"]);
    expect(t.configChanges?.[0]).toMatchObject({ area: "settings", requestedBy: "Ada", effectiveFrom: "2027-01-01", status: "applied" });
    expect(t.configChanges?.[0].changes[0]).toMatchObject({ field: "NHF basis", after: "basic" });
    // September 2026 recalculated after the change: still NHF on gross.
    const sepAgain = calculateRun({ ...sep, status: "draft" }, { ...data, settings: t.settings, settingsVersions: t.settingsVersions }, bundle);
    expect(sepAgain.totals.nhf).toBeCloseTo(sep.totals.nhf, 2);
  });

  it("D · a change needing a second approver can't be approved by its requester", () => {
    const tenantId = bundle.tenant.id;
    let s = reducer(undefined, seedTenantPayroll({ tenantId, data: { ...data, audit: [], remittances: {} } }));
    const change = { id: "CFG-1", area: "rate_set" as const, target: "X", summary: "New rates", changes: [], effectiveFrom: "2027-01-01", requestedBy: "Ada", requestedById: "E1", requestedAt: "2026-11-18", status: "pending" as const };
    s = reducer(s, addConfigChange({ tenantId, change }));
    s = reducer(s, decideConfigChange({ tenantId, actor: "Ada", actorId: "E1", id: "CFG-1", approved: true }));
    expect(s.byTenant[tenantId].configChanges![0].status).toBe("pending");
    s = reducer(s, decideConfigChange({ tenantId, actor: "Bola", actorId: "E2", id: "CFG-1", approved: true }));
    expect(s.byTenant[tenantId].configChanges![0]).toMatchObject({ status: "applied", approvedBy: "Bola" });
  });

  it("an element edit through the slice keeps its earlier version", () => {
    const tenantId = bundle.tenant.id;
    let s = reducer(undefined, seedTenantPayroll({ tenantId, data: { ...data, audit: [], remittances: {} } }));
    const el = s.byTenant[tenantId].elements.find((e) => e.code === "MEAL")!;
    s = reducer(s, upsertElement({ tenantId, actor: "Ada", element: { ...el, pensionable: true }, effectiveFrom: "2026-12-01" }));
    const after = s.byTenant[tenantId].elements.find((e) => e.code === "MEAL")!;
    expect(after.history?.[0].effectiveTo).toBe("2026-12-01");
    expect(elementOn(after, "2026-11-30")!.pensionable).toBe(el.pensionable);
  });
});

describe("salary management", () => {
  const emp = bundle.employees.find((e) => e.status !== "terminated" && data.structures.some((s) => s.employeeId === e.id))!;
  const cur = data.structures.find((s) => s.employeeId === emp.id)!;

  it("shows gross, tax, pension, net and employer cost before and after", () => {
    const lines = adjustLines(cur.lines, "percent", 10, (c) => ["BASIC", "HOUSING", "TRANSPORT"].includes(c));
    const impact = salaryImpact(data, emp, lines, "2026-12-01");
    expect(impact.after.gross).toBeGreaterThan(impact.before.gross);
    expect(impact.after.paye).toBeGreaterThanOrEqual(impact.before.paye);
    expect(impact.after.pension).toBeGreaterThan(impact.before.pension);
    expect(impact.after.employerCost).toBeGreaterThan(impact.after.gross);
  });

  it("a fixed bulk increase is shared across fixed lines and adds up", () => {
    const lines = adjustLines(cur.lines, "fixed", 50_000, (c) => ["BASIC", "HOUSING"].includes(c));
    const before = cur.lines.reduce((s, l) => s + l.amount, 0);
    expect(lines.reduce((s, l) => s + l.amount, 0) - before).toBeCloseTo(50_000, 0);
  });
});

describe("statutory remittance centre", () => {
  it("moves calculated → submitted → paid → reconciled, and overdue when late", () => {
    expect(statusOf(undefined, 100, "2026-12-10", "2026-11-18").status).toBe("calculated");
    expect(statusOf(undefined, 100, "2026-11-10", "2026-11-18").status).toBe("overdue");
    const sub = { status: "submitted" as const, reference: "R", date: "2026-11-09", by: "x", at: "" };
    expect(statusOf(sub, 100, "2026-12-10", "2026-11-18").status).toBe("submitted");
    expect(statusOf(sub, 100, "2026-11-10", "2026-11-18")).toEqual({ status: "overdue", overdue: true });
    const receipt = { fileName: "r.pdf", uploadedAt: "2026-11-09" };
    expect(statusOf({ ...sub, status: "paid", amountPaid: 100, receipt }, 100, "2026-11-10", "2026-11-18").status).toBe("paid");
    // Feedback B3 (Nov 2026): no evidence, no payment — it stays submitted (overdue once late).
    expect(statusOf({ ...sub, status: "paid", amountPaid: 100 }, 100, "2026-12-10", "2026-11-18").status).toBe("submitted");
    expect(statusOf({ ...sub, status: "paid", amountPaid: 100 }, 100, "2026-11-10", "2026-11-18").status).toBe("overdue");
    expect(statusOf({ ...sub, status: "paid", amountPaid: 60, receipt }, 100, "2026-11-10", "2026-11-18").status).toBe("overdue");
    expect(statusOf({ ...sub, status: "reconciled", amountPaid: 100, receipt }, 100, "2026-11-10", "2026-11-18").status).toBe("reconciled");
  });

  it("the seeded demo shows reconciled, paid and outstanding remittances, with reminders due", () => {
    const records = seedRemittances(history.runs, "Finance", "2026-11-18");
    const rows = remittanceRows(history.runs, records, "2026-11-18");
    const statuses = new Set(rows.map((r) => r.status));
    expect(statuses.has("reconciled")).toBe(true);
    expect(statuses.has("paid")).toBe(true);
    expect(rows.some((r) => r.outstanding > 0)).toBe(true);
    expect(summarise(rows).outstanding).toBeGreaterThan(0);
    const due = remindersDue(rows, 30, undefined);
    expect(due.length).toBeGreaterThan(0);
    expect(remindersDue(rows, 30, Object.fromEntries(due.map((d) => [d.key, "x"])))).toHaveLength(0);
  });
});

describe("pre-payroll exception detection", () => {
  it("flags duplicate employees and unusual salary increases", () => {
    const [a, b] = oct.employees.filter((e) => e.included);
    const profiles = new Map(base.profiles.map((p) => [p.employeeId, p.employeeId === b.employeeId ? { ...p, tin: base.profiles.find((x) => x.employeeId === a.employeeId)!.tin } : p]));
    const prev = new Map(sep.employees.filter((e) => e.computation).map((e) => [e.employeeId, e.computation!]));
    const bumped: PayrollRun = {
      ...oct,
      employees: oct.employees.map((e) =>
        e.employeeId === a.employeeId && e.computation ? { ...e, computation: { ...e.computation, lines: e.computation.lines.map((l) => (l.code === "BASIC" ? { ...l, amount: l.amount * 2 } : l)) } } : e,
      ),
    };
    const ex = validateRun({ run: bumped, employees: new Map(bundle.employees.map((e) => [e.id, e])), profiles, previous: prev, settings });
    expect(ex.some((e) => e.rule === "duplicate_employee" && e.employeeId === b.employeeId && e.severity === "error")).toBe(true);
    expect(ex.some((e) => e.rule === "unusual_salary_increase" && e.employeeId === a.employeeId)).toBe(true);
  });
});

describe("payroll intelligence", () => {
  const months = monthsOf(history.runs);

  it("gross to net adds up every month", () => {
    for (const m of grossToNet(months)) expect(m.paye + m.pension + m.nhf + m.other + m.net).toBeCloseTo(m.gross, 0);
  });

  it("cost by department sums to the month's total cost", () => {
    const octBucket = months.find((m) => m.month === "2026-10")!;
    const rows = costBy(octBucket, "department", bundle, new Map());
    expect(rows.reduce((s, r) => s + r.total, 0)).toBeCloseTo(oct.totals.gross + oct.totals.employerCost, 0);
  });

  it("explains a month's change by reason, employee and element", () => {
    const story = explainVariance(oct, sep, { people, elements: data.elements, structures: data.structures });
    const change = story.comparison.totals.find((t) => t.key === "gross")!.change;
    expect(story.drivers.reduce((s, d) => s + d.amount, 0)).toBeCloseTo(change, 0);
    expect(story.headline).toMatch(/Gross pay/);
  });

  it("YTD, processing times and the forecast are populated", () => {
    expect(yearToDate(2026, history.payslips, history.openingYtd).gross).toBeGreaterThan(0);
    expect(processingTimes(history.runs).onTimePct).toBe(100);
    const fc = forecastVsBudget(months, data.structures, { ...settings, budget: { monthly: 1, months: {} } }, 2026);
    expect(fc.rows).toHaveLength(12);
    expect(fc.rows.find((r) => r.month === "2026-12")!.forecast).toBeGreaterThan(0);
    expect(fc.budgetYear).toBe(12);
  });
});

describe("payroll simulation", () => {
  it("changes nothing with an empty scenario and costs more with a raise", () => {
    const none = simulate(data, bundle, nov, EMPTY_SCENARIO);
    expect(none.delta.employerCost).toBe(0);
    const raise = simulate(data, bundle, nov, { ...EMPTY_SCENARIO, increasePct: 10 });
    expect(raise.delta.gross).toBeGreaterThan(0);
    expect(raise.annualCostDelta).toBeCloseTo(raise.delta.employerCost * 12, 0);
    const leaver = nov.employees.find((e) => e.included)!.employeeId;
    const out = simulate(data, bundle, nov, { ...EMPTY_SCENARIO, leavers: [leaver], starters: [{ id: "1", department: "Finance", count: 2, monthlyGross: 400_000 }] });
    expect(out.simHeadcount).toBe(none.simHeadcount + 1);
  });
});

describe("drill-downs", () => {
  it("masks account numbers to the last four digits", () => {
    expect(maskAccount("0123456789")).toBe("••••••6789");
    expect(maskAccount("")).toBe("MISSING");
  });
});
