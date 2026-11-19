import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { backPayOwed, buildPayslips, calculateRun, isValidNuban, newRun, nubanCheckDigit, payslipHashPayload, payslipReference, seedHistory, seedProfile, seedStructure } from "./run-builder";
import { makePeriod } from "./ng/engine";
import { sha256Hex } from "./hash";
import { validateRun } from "./validation";
import { buildExport, buildFormH1 } from "./exports";

/** End-to-end over the real Nigeria demo tenant: seed → runs → payslips. */
const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const base = {
  elements: SEED_PAY_ELEMENTS,
  rateSets: NG_RATE_SETS,
  settings,
  structures: bundle.employees.map((e) => seedStructure(e, settings)),
  profiles: bundle.employees.map(seedProfile),
};
const today = new Date("2026-11-14T12:00:00Z");
const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: bundle.loans ?? [], today });
const data = { ...base, ...history };

describe("seeded Nigeria payroll", () => {
  it("has Aug–Oct paid and November in draft", () => {
    expect(history.runs.map((r) => `${r.period.month}:${r.status}`)).toEqual(["8:disbursed", "9:disbursed", "10:disbursed", "11:draft"]);
  });

  it("leaves out employees who had already left", () => {
    const ids = history.runs[0].employees.map((e) => e.employeeId);
    expect(ids).not.toContain("NG-EMP-0001");
    expect(ids).not.toContain("NG-EMP-0002");
    expect(ids.length).toBe(18);
  });

  it("reconciles every payslip: gross − deductions = net", () => {
    for (const p of history.payslips) {
      const c = p.computation;
      expect(Math.round((c.gross - c.totalDeductions) * 100) / 100).toBe(c.net);
      const lines = c.lines.filter((l) => l.category === "deduction").reduce((s, l) => s + l.amount, 0);
      expect(Math.round(lines * 100) / 100).toBe(c.totalDeductions);
    }
  });

  it("carries YTD forward month to month", () => {
    const one = history.payslips.filter((p) => p.employeeId === "NG-EMP-0009").sort((a, b) => a.period.month - b.period.month);
    expect(one.map((p) => p.computation.ytd.months)).toEqual([8, 9, 10]);
    expect(one[2].computation.ytd.paye).toBeCloseTo(one[1].computation.ytd.paye + one[2].computation.lines.find((l) => l.code === "PAYE")!.amount, 2);
  });

  it("deducts active loans through payroll", () => {
    expect(history.payslips.some((p) => p.computation.lines.some((l) => l.source === "loan"))).toBe(true);
  });

  it("issues verifiable payslips whose hash matches their figures", () => {
    const p = history.payslips[0];
    expect(sha256Hex(payslipHashPayload(p))).toBe(p.verification.hash);
    expect(new Set(history.payslips.map((x) => x.verification.code)).size).toBe(history.payslips.length);
    const tampered = { ...p, computation: { ...p.computation, net: p.computation.net + 1 } };
    expect(sha256Hex(payslipHashPayload(tampered))).not.toBe(p.verification.hash);
  });

  it("generates insights once, at issue", () => {
    const oct = history.payslips.find((p) => p.period.month === 10)!;
    expect(oct.insights.find((i) => i.type === "net_change")).toBeTruthy();
  });

  it("validates the draft run and recalculates idempotently", () => {
    const draft = history.runs[3];
    const again = calculateRun(draft, data, bundle);
    expect(again.totals).toEqual(draft.totals);
    const ex = validateRun({ run: again, employees: new Map(bundle.employees.map((e) => [e.id, e])), profiles: new Map(base.profiles.map((p) => [p.employeeId, p])), previous: new Map(), settings });
    expect(Array.isArray(ex)).toBe(true);
    expect(buildPayslips({ run: again, bundle, data, status: "draft", approvedBy: null, generatedAt: "x" }).length).toBe(again.totals.employees);
  });
});

// ── Audit fixes: integrity & validation ─────────────────────────────────────

describe("run integrity and validation", () => {
  const draft = history.runs[3];
  const people = new Map(bundle.employees.map((e) => [e.id, e]));
  const profiles = new Map(base.profiles.map((p) => [p.employeeId, p]));

  it("validates NUBAN check digits (CBN algorithm)", () => {
    // GTBank 058, serial 012345678 → check digit computed by the standard weights.
    const check = nubanCheckDigit("058", "012345678");
    expect(isValidNuban(`012345678${check}`, "058")).toBe(true);
    expect(isValidNuban(`012345678${(check + 1) % 10}`, "058")).toBe(false);
    expect(isValidNuban("12345", "058")).toBe(false);
    // Seeded demo accounts carry valid check digits.
    for (const p of base.profiles.filter((x) => /^\d{3}$/.test(x.bankCode))) expect(isValidNuban(p.accountNumber, p.bankCode)).toBe(true);
  });

  it("never adds demo variable pay to a run people create themselves", () => {
    const real = newRun({ tenantId: bundle.tenant.id, type: "regular", period: makePeriod(2026, 12), preparedBy: { employeeId: "X", name: "X" }, bundle, data, loans: [], today });
    expect(real.inputs.some((i) => ["OT_NORMAL", "COMMISSION", "PERFORMANCE_BONUS", "UNPAID_LEAVE"].includes(i.code))).toBe(false);
  });

  it("gives every payslip a unique reference, even across runs in one month", () => {
    const oc = newRun({ tenantId: bundle.tenant.id, type: "off_cycle", period: draft.period, preparedBy: { employeeId: "X", name: "X" }, bundle, data: { ...data, runs: [...data.runs] }, loans: [], today });
    const ref1 = payslipReference(draft, 0);
    const ref2 = payslipReference(oc, 0);
    expect(ref1).not.toBe(ref2);
    expect(oc.id.startsWith("NG001-PR-")).toBe(true);
  });

  it("does not flag a leaver whose final pay falls inside the period", () => {
    const leaver = { ...bundle.employees[5], dateOfLeaving: `${draft.period.year}-${String(draft.period.month).padStart(2, "0")}-10`, status: "terminated" };
    const ex = validateRun({ run: draft, employees: new Map([...people, [leaver.id, leaver]]), profiles, previous: new Map(), settings });
    expect(ex.some((e) => e.rule === "leaver_in_run" && e.employeeId === leaver.id)).toBe(false);
  });

  it("flags bank details changed since the last pay", () => {
    const someone = draft.employees.find((e) => e.included)!;
    const before = { ...someone.snapshot!, accountNumber: "0000000000" };
    const ex = validateRun({ run: draft, employees: people, profiles, previous: new Map(), previousPayment: new Map([[someone.employeeId, before]]), settings });
    expect(ex.find((e) => e.rule === "bank_changed" && e.employeeId === someone.employeeId)?.severity).toBe("error");
  });

  it("re-asks for acknowledgement when the figure behind an exception changes", () => {
    const neg = { ...draft, exceptions: [{ id: "neg:E:-5000", rule: "negative_net" as const, severity: "error" as const, employeeId: "E", message: "", acknowledged: { by: "x", at: "", reason: "ok" } }] };
    const ex = validateRun({ run: neg, employees: people, profiles, previous: new Map(), settings });
    expect(ex.some((e) => e.id === "neg:E:-5000")).toBe(false);
  });

  it("pays arrears once for an approved back-dated raise", () => {
    const empId = draft.employees.find((e) => e.included)!.employeeId;
    const old = base.structures.find((s) => s.employeeId === empId)!;
    const raise = {
      ...old,
      id: "SS-RAISE",
      effectiveFrom: `${history.runs[1].period.start}`,
      lines: old.lines.map((l) => (l.code === "BASIC" ? { ...l, amount: l.amount + 100_000 } : l)),
      reason: "Promotion",
      approvedBy: "Finance",
      status: "approved" as const,
    };
    const withRaise = { ...data, structures: [...data.structures, raise] };
    const owed = backPayOwed(withRaise, empId, draft.period);
    // Two finalized months (Sep, Oct) underpaid by ₦100k each.
    expect(owed[0]?.amount).toBeCloseTo(200_000, 0);
    const settledRun = { ...history.runs[2], inputs: [...history.runs[2].inputs, { id: "bp", employeeId: empId, code: "BACK_PAY", amount: 1, source: "adjustment" as const, refId: "SS-RAISE" }] };
    const settled = { ...withRaise, runs: withRaise.runs.map((r) => (r.id === settledRun.id ? settledRun : r)) };
    expect(backPayOwed(settled, empId, draft.period)).toHaveLength(0);
  });
});

// ── Exports ─────────────────────────────────────────────────────────────────

describe("statutory exports", () => {
  const paid = history.runs[2];
  const people = new Map(bundle.employees.map((e) => [e.id, e]));
  const profiles = new Map(base.profiles.map((p) => [p.employeeId, p]));
  const costCentres = new Map(bundle.departments.map((d) => [d.name, d.costCenter]));
  const ctx = { run: paid, people, profiles, settings, company: { legalName: "Sahel Fintech Solutions Limited", taxId: "TIN 1" }, costCentres };

  it("produces a balanced journal by cost centre", () => {
    const t = buildExport("journal", ctx);
    const [, , , status, dr, cr] = t.trailer![0];
    expect(status).toBe("Balanced");
    expect(dr).toBeCloseTo(Number(cr), 2);
  });

  it("gives the NIBSS file a control total equal to the payable net pay", () => {
    const t = buildExport("nibss", ctx);
    const total = t.data.reduce((s, r) => s + Number(r[3]), 0);
    expect(Number(t.trailer![0][2])).toBeCloseTo(total, 2);
    expect(t.preamble![1]).toContain("Control total");
  });

  it("subtotals PAYE per state and matches the run's PAYE", () => {
    const t = buildExport("paye", ctx);
    const subtotal = t.data.filter((r) => String(r[0]).endsWith("subtotal")).reduce((s, r) => s + Number(r[9]), 0);
    expect(subtotal).toBeCloseTo(paid.totals.paye, 1);
  });

  it("builds Form H1 from the year's final payslips", () => {
    const t = buildFormH1(2026, history.payslips, "TIN 1");
    expect(t.data.length).toBe(new Set(history.payslips.map((p) => p.employeeId)).size);
    const paye = t.data.reduce((s, r) => s + Number(r[8]), 0);
    expect(paye).toBeGreaterThan(0);
  });
});
