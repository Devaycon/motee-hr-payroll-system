import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { SEED_PAY_ELEMENTS } from "@/src/lib/payroll/elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "@/src/lib/payroll/ng/rate-sets";
import { seedHistory, seedProfile, seedStructure } from "@/src/lib/payroll/run-builder";
import type { TenantPayroll } from "@/src/lib/stores/payroll-slice";
import { ALL_PAYROLL_DATASETS, PAYROLL_DATASETS, type PayrollFact } from "./registry/payroll-datasets";
import { STARTER_TEMPLATES, fieldsFor, mask, parseFormula, runSpec, type ReportSpec } from "./studio";
import { columnsOf } from "./types";

/** Client feedback B2 (Nov 2026): payroll datasets + MOTEE Report Studio. */

const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const base = { elements: SEED_PAY_ELEMENTS, rateSets: NG_RATE_SETS, settings, structures: bundle.employees.map((e) => seedStructure(e, settings)), profiles: bundle.employees.map(seedProfile) };
const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: bundle.loans ?? [], today: new Date("2026-11-24T12:00:00Z") });
const payroll = { ...base, ...history, audit: [] } as unknown as TenantPayroll;
const ctx = { country: "ng" as const, payroll };
const ds = (id: string) => ALL_PAYROLL_DATASETS.find((d) => d.id === id)!;
const facts = ds("pd-earnings").select(bundle, ctx) as PayrollFact[];
const spec = (over: Partial<ReportSpec>): ReportSpec => ({ id: "R", name: "t", datasetId: "pd-earnings", columns: [], filters: [], match: "all", calculated: [], output: "table", status: "active", owner: "x", createdAt: "", updatedAt: "", ...over });
const all = { canSeeIdentifiers: true, canSeeBank: true };

describe("B2 · payroll datasets", () => {
  it("ships the ten datasets from the appendix plus budget & forecast", () => {
    expect(PAYROLL_DATASETS.map((d) => d.label.slice(0, 2))).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
    expect(ALL_PAYROLL_DATASETS.some((d) => d.id === "pd-budget")).toBe(true);
    // Field counts follow the appendix (keys + catalogue fields).
    const n = (id: string) => ds(id).columns.length - 3;
    expect(n("pd-employee")).toBeGreaterThanOrEqual(16); // + Employee ID and name in the keys
    expect(n("pd-earnings")).toBeGreaterThanOrEqual(19);
    expect(n("pd-pension")).toBeGreaterThanOrEqual(18);
    expect(n("pd-tax")).toBeGreaterThanOrEqual(14);
    expect(n("pd-statutory")).toBeGreaterThanOrEqual(18);
    expect(n("pd-deductions")).toBeGreaterThanOrEqual(15);
    expect(n("pd-banking")).toBeGreaterThanOrEqual(13);
    expect(n("pd-results")).toBeGreaterThanOrEqual(19);
    expect(n("pd-finance")).toBeGreaterThanOrEqual(17);
    expect(n("pd-compliance")).toBeGreaterThanOrEqual(16);
  });

  it("every field is in the data dictionary: description, source and type", () => {
    for (const d of ALL_PAYROLL_DATASETS) for (const c of d.columns) {
      expect(c.description, `${d.id}.${c.key}`).toBeTruthy();
      expect(c.source, `${d.id}.${c.key}`).toBeTruthy();
      expect(c.type, `${d.id}.${c.key}`).toBeTruthy();
    }
  });

  it("one row per final payslip, reconciling to the payslips to the kobo", () => {
    const final = history.payslips.filter((p) => p.status === "final");
    expect(facts).toHaveLength(final.length);
    const gross = ds("pd-earnings").columns.find((c) => c.key === "gross")!;
    expect(Math.round(facts.reduce((s, r) => s + Number(gross.value(r)), 0) * 100)).toBe(Math.round(final.reduce((s, p) => s + p.computation.gross, 0) * 100));
  });

  it("a pay element the client creates becomes a field with no further development", () => {
    const withCustom = { ...payroll, elements: [...payroll.elements, { ...payroll.elements.find((e) => e.code === "UTILITY")!, code: "SECURITY_ALLOW", name: "Security Allowance", custom: true }] } as TenantPayroll;
    const cols = columnsOf(ds("pd-earnings"), { country: "ng", payroll: withCustom });
    expect(cols.find((c) => c.key === "el:SECURITY_ALLOW")?.header).toBe("Security Allowance");
  });

  it("bank details and identifiers are marked restricted", () => {
    const keys = ALL_PAYROLL_DATASETS.flatMap((d) => d.columns).filter((c) => c.sensitive).map((c) => c.key);
    expect(keys).toEqual(expect.arrayContaining(["accountNumber", "accountName", "tin", "rsaPin", "bvn", "nin"]));
  });
});

describe("B2 · Report Studio engine", () => {
  const fields = fieldsFor(ds("pd-earnings"), ALL_PAYROLL_DATASETS, ctx);

  it("combines fields across the payroll datasets (joined on employee + period)", () => {
    expect(fields.some((f) => f.key === "pfa")).toBe(true); // from 03 Pension
    expect(fields.some((f) => f.key === "ctc")).toBe(true); // from 09 Finance
  });

  it("AND / OR filters", () => {
    const dept = String(fields.find((f) => f.key === "department")!.value(facts[0]));
    const and = runSpec(spec({ columns: [{ key: "name" }], filters: [{ field: "department", op: "eq", value: dept }, { field: "gross", op: "gt", value: "999999999" }] }), facts, fields, all);
    const or = runSpec(spec({ columns: [{ key: "name" }], match: "any", filters: [{ field: "department", op: "eq", value: dept }, { field: "gross", op: "gt", value: "999999999" }] }), facts, fields, all);
    expect(and.matched).toBe(0);
    expect(or.matched).toBe(facts.filter((r) => r.p.employee.departmentName === dept).length);
  });

  it("group by with sums that equal the ungrouped total", () => {
    const flat = runSpec(spec({ columns: [{ key: "name" }, { key: "gross" }] }), facts, fields, all);
    const grouped = runSpec(spec({ columns: [{ key: "department" }, { key: "gross" }], groupBy: "department", output: "summary" }), facts, fields, all);
    expect(grouped.grouped).toBe(true);
    expect(grouped.totals[2]).toBeCloseTo(Number(flat.totals[1]), 2);
  });

  it("calculated fields are validated and evaluated without running code", () => {
    expect(parseFormula("[Gross Pay] - [Net Pay]", fields).ok).toBe(true);
    expect(parseFormula("[Department] * 2", fields)).toMatchObject({ ok: false });
    expect(parseFormula("[Nope] + 1", fields)).toMatchObject({ ok: false, error: "Unknown field [Nope]" });
    expect(parseFormula("alert(1)", fields).ok).toBe(false);
    const withCalc = fieldsFor(ds("pd-earnings"), ALL_PAYROLL_DATASETS, ctx, [{ key: "calc:d", label: "Deductions", formula: "[Gross Pay] - [Net Pay]", type: "money" }]);
    const r = runSpec(spec({ columns: [{ key: "calc:d" }, { key: "totalDeductions" }] }), facts.slice(0, 5), withCalc, all);
    for (const row of r.rows) expect(row[0]).toBeCloseTo(Number(row[1]), 2);
  });

  it("restricted fields are masked at run time for people who may not see them, and can't be used to filter", () => {
    const f2 = fieldsFor(ds("pd-banking"), ALL_PAYROLL_DATASETS, ctx);
    const visible = runSpec(spec({ datasetId: "pd-banking", columns: [{ key: "accountNumber" }] }), facts.slice(0, 3), f2, all);
    const masked = runSpec(spec({ datasetId: "pd-banking", columns: [{ key: "accountNumber" }] }), facts.slice(0, 3), f2, { canSeeIdentifiers: true, canSeeBank: false });
    expect(masked.maskedFields).toEqual(["Bank Account Number"]);
    expect(masked.rows[0][0]).toBe(mask(visible.rows[0][0]));
    expect(String(masked.rows[0][0])).toMatch(/^••••\d{4}$/);
    const probe = runSpec(spec({ datasetId: "pd-banking", columns: [{ key: "name" }], filters: [{ field: "accountNumber", op: "eq", value: "0000000000" }] }), facts, f2, { canSeeIdentifiers: true, canSeeBank: false });
    expect(probe.matched).toBe(facts.length); // the filter is ignored rather than leaking a match
  });

  it("a month range limits payroll rows", () => {
    const monthOf = (r: unknown) => { const p = (r as PayrollFact).p; return `${p.period.year}-${String(p.period.month).padStart(2, "0")}`; };
    const oct = runSpec(spec({ columns: [{ key: "name" }], monthFrom: "2026-10", monthTo: "2026-10" }), facts, fields, { ...all, monthOf });
    expect(oct.matched).toBe(facts.filter((r) => r.p.period.month === 10).length);
  });

  it("every starter template runs on its dataset", () => {
    for (const t of STARTER_TEMPLATES) {
      const d = ds(t.datasetId);
      const fl = fieldsFor(d, ALL_PAYROLL_DATASETS, ctx, t.calculated);
      for (const c of t.columns) expect(fl.some((f) => f.key === c.key), `${t.name}: ${c.key}`).toBe(true);
      const r = runSpec({ ...t, id: "T", owner: "x", createdAt: "", updatedAt: "" }, d.select(bundle, ctx), fl, all);
      expect(r.rowCount).toBeGreaterThan(0);
    }
  });
});
