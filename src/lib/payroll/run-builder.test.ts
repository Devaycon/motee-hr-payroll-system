import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { buildPayslips, calculateRun, payslipHashPayload, seedHistory, seedProfile, seedStructure } from "./run-builder";
import { sha256Hex } from "./hash";
import { validateRun } from "./validation";

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
