import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { seedHistory, seedProfile, seedStructure } from "./run-builder";
import { BREAKDOWN_VIEWS, buildBreakdown } from "./breakdowns";
import { compareRuns } from "./comparison";
import { remittanceAmounts, remittanceCalendar } from "./exports";
import { REMITTANCE_ITEMS, lockedRunsByMonth, remittanceStatement, seedRemittances } from "./remittances";
import { makePeriod } from "./ng/engine";
import { openRegularRunBefore } from "./use-payroll";

/** Client feedback round 1: drill-downs, remittance statements, comparison, AVC, pay dates. */
const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const base = {
  elements: SEED_PAY_ELEMENTS,
  rateSets: NG_RATE_SETS,
  settings,
  structures: bundle.employees.map((e) => seedStructure(e, settings)),
  profiles: bundle.employees.map(seedProfile),
};
const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: bundle.loans ?? [], today: new Date("2026-11-18T12:00:00Z") });
const data = { ...base, ...history };
const people = new Map(bundle.employees.map((e) => [e.id, e]));
const profiles = new Map(base.profiles.map((p) => [p.employeeId, p]));
const [aug, sep, oct, nov] = history.runs;
const round = (n: number) => Math.round(n * 100) / 100;

describe("pay dates", () => {
  it("pays October on Fri 23 Oct (25th is a Sunday) and leaves November on the 25th", () => {
    expect(oct.period.payDate).toBe("2026-10-23");
    expect(nov.period.payDate).toBe("2026-11-25");
    expect(oct.disbursedAt?.slice(0, 10)).toBe("2026-10-23");
  });

  it("won't start December while November is open", () => {
    expect(openRegularRunBefore(data, makePeriod(2026, 12))?.id).toBe(nov.id);
    expect(openRegularRunBefore(data, makePeriod(2026, 11))).toBeNull();
  });
});

describe("voluntary pension (AVC)", () => {
  it("is seeded for some staff and deducted once per payslip", () => {
    expect(base.profiles.some((p) => p.avc?.value)).toBe(true);
    const withAvc = history.payslips.filter((p) => p.computation.lines.some((l) => l.code === "VOL_PENSION"));
    expect(withAvc.length).toBeGreaterThan(0);
    for (const p of history.payslips) expect(p.computation.lines.filter((l) => l.code === "VOL_PENSION").length).toBeLessThanOrEqual(1);
  });

  it("is its own remittance, due with the mandatory pension", () => {
    const cal = remittanceCalendar(oct.period);
    expect(cal.find((c) => c.key === "avc")?.due).toBe(cal.find((c) => c.key === "pension")?.due);
    const t = remittanceAmounts([oct]);
    const vol = oct.employees.flatMap((e) => e.computation?.lines ?? []).filter((l) => l.code === "VOL_PENSION").reduce((s, l) => s + l.amount, 0);
    expect(t.avc).toBe(round(vol));
    expect(t.pension).toBe(round(oct.totals.pensionEmployee + oct.totals.pensionEmployer));
  });
});

describe("stat card breakdowns", () => {
  const ctx = { people, profiles };
  it("each view adds up to the run's own totals", () => {
    expect(buildBreakdown("gross", oct, ctx).totals.gross).toBe(round(oct.totals.gross));
    expect(buildBreakdown("deductions", oct, ctx).totals.total).toBe(round(oct.totals.deductions));
    expect(buildBreakdown("net", oct, ctx).totals.net).toBe(round(oct.totals.net));
    expect(buildBreakdown("pension", oct, ctx).totals.ee).toBe(round(oct.totals.pensionEmployee));
    for (const v of BREAKDOWN_VIEWS) expect(() => buildBreakdown(v.key, oct, ctx)).not.toThrow();
  });

  it("net pay lists names, IDs and bank details", () => {
    const row = buildBreakdown("net", oct, ctx).rows[0];
    expect(row.name).toBeTruthy();
    expect(row.employeeNumber).toBeTruthy();
    expect(row.cells.bank).toBeTruthy();
    // Masked: only the last four digits are shown.
    expect(String(row.cells.account)).toMatch(/^•{6}\d{4}$|MISSING/);
  });

  it("third-party lists loans and deductions paid on to others", () => {
    const tp = buildBreakdown("third-party", oct, ctx);
    const other = oct.employees.flatMap((e) => e.computation?.lines ?? []).filter((l) => l.group === "other_deductions" && !["UNPAID_LEAVE", "LATENESS"].includes(l.code) && l.amount > 0);
    expect(tp.totals.amount).toBe(round(other.reduce((s, l) => s + l.amount, 0)));
  });
});

describe("remittance statements", () => {
  const ctx = { people, profiles, settings };
  const months = lockedRunsByMonth(history.runs);
  it("agree with the remittances tab for every item and month", () => {
    for (const runs of months.values()) {
      const amounts = remittanceAmounts(runs);
      for (const item of REMITTANCE_ITEMS) {
        const st = remittanceStatement(item, runs, ctx)!;
        expect(round(st.groups.reduce((s, g) => s + g.amount, 0))).toBe(amounts[item]);
      }
    }
  });

  it("groups PAYE by State IRS", () => {
    const st = remittanceStatement("paye", months.get("2026-10")!, ctx)!;
    expect(st.groups.length).toBeGreaterThan(0);
    expect(st.table.headers[0]).toBe("State IRS");
  });
});

describe("payroll comparison", () => {
  const ctx = { people, elements: base.elements, structures: base.structures };
  it("explains every naira of the gross change", () => {
    for (const [cur, prev] of [[sep, aug], [oct, sep], [nov, oct]]) {
      const cmp = compareRuns(cur, prev, ctx);
      const gross = cmp.totals.find((t) => t.key === "gross")!;
      expect(round(gross.previous + cmp.bridge.reduce((s, b) => s + b.amount, 0))).toBeCloseTo(gross.current, 1);
      for (const e of cmp.employees) {
        const sum = Object.values(e.reasons).reduce((s, v) => s + (v ?? 0), 0);
        expect(sum).toBeCloseTo(e.change, 1);
      }
    }
  });

  it("names one-off payments (September performance bonus)", () => {
    const cmp = compareRuns(sep, aug, ctx);
    expect(cmp.bridge.some((b) => b.reason === "one_off" && b.amount > 0)).toBe(true);
  });
});

describe("payroll comparison — non-recurring allowances", () => {
  it("treats leave allowance as a one-off, not a salary change", () => {
    const cmp = compareRuns(nov, oct, { people, elements: base.elements, structures: base.structures });
    const paidLeaveAllowance = oct.employees.filter((e) => e.computation?.lines.some((l) => l.code === "LEAVE_ALLOW")).map((e) => e.employeeId);
    for (const id of paidLeaveAllowance) {
      const e = cmp.employees.find((x) => x.employeeId === id)!;
      expect(e.reasons.salary_change).toBeUndefined();
      expect(e.reasons.one_off).toBeLessThan(0);
    }
  });
});

describe("payroll in Analytics & Reports", () => {
  // Imported lazily so the report registry's icon imports don't slow the suites above.
  it("Payroll Cost rows match the finalized runs, and remittances match the tab", async () => {
    const { PAYROLL_REPORTS } = await import("@/src/lib/reports/registry/payroll");
    const tenant = { ...data, audit: [], remittances: { "2026-10:paye": { reference: "REF-1", date: "2026-11-09", by: "x", at: "2026-11-09" } } };
    const ctx = { country: "ng" as const, payroll: tenant };
    const [cost, remit] = PAYROLL_REPORTS;
    const rows = cost.select(bundle, ctx) as { period: string; gross: number; net: number }[];
    const locked = history.runs.filter((r) => r.status === "disbursed" || r.status === "finalized");
    expect(round(rows.reduce((s, r) => s + r.gross, 0))).toBeCloseTo(round(locked.reduce((s, r) => s + r.totals.gross, 0)), 1);
    expect(rows.some((r) => r.period === "November 2026")).toBe(false); // drafts never reach reporting
    const a = cost.analytics(rows, bundle, ctx);
    expect(a.stats.length).toBeGreaterThan(0);
    expect(a.charts.length).toBeGreaterThan(4);
    for (const b of cost.breakdowns ?? []) expect(b.analytics(rows, bundle, ctx).charts.length).toBeGreaterThan(0);

    const rrows = remit.select(bundle, ctx) as { month: string; key: string; amount: number; status: string }[];
    const oct = rrows.filter((r) => r.month === "2026-10");
    const amounts = remittanceAmounts(locked.filter((r) => r.period.month === 10));
    for (const r of oct) expect(r.amount).toBe(amounts[r.key as keyof typeof amounts]);
    expect(oct.find((r) => r.key === "paye")?.status).toBe("Paid");
    expect(remit.select(bundle, { country: "ng", payroll: null })).toEqual([]);
  });
});

describe("seeded remittance history", () => {
  const paid = seedRemittances(history.runs, "Finance", "2026-11-18");
  it("marks August and September paid, leaves October and ITF outstanding", () => {
    for (const m of ["2026-08", "2026-09"]) {
      for (const k of ["paye", "pension", "nhf", "nsitf"]) expect(paid[`${m}:${k}`]?.reference).toBeTruthy();
      expect(paid[`${m}:itf`]).toBeUndefined();
    }
    expect(Object.keys(paid).some((k) => k.startsWith("2026-10"))).toBe(false);
  });
  it("records each payment on a working day before it was due", () => {
    for (const [key, r] of Object.entries(paid)) {
      const [month, item] = key.split(":");
      const reg = lockedRunsByMonth(history.runs).get(month)![0];
      const due = remittanceCalendar(reg.period).find((c) => c.key === item)!.due;
      expect(r.date < due).toBe(true);
      expect([0, 6]).not.toContain(new Date(`${r.date}T00:00:00Z`).getUTCDay());
    }
  });
});
