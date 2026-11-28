import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { seedHistory, seedProfile, seedStructure } from "./run-builder";
import { seedRemittances } from "./remittances";
import { remittanceRows, remindersDue } from "./remittance-centre";
import { buildAuditPack } from "./audit-pack";

/** Client feedback B3 (Nov 2026): evidence before "paid", escalation, the audit pack. */

const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const profiles = bundle.employees.map(seedProfile);
const base = { elements: SEED_PAY_ELEMENTS, rateSets: NG_RATE_SETS, settings, structures: bundle.employees.map((e) => seedStructure(e, settings)), profiles };
const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: bundle.loans ?? [], today: new Date("2026-11-24T12:00:00Z") });
const today = "2026-11-24";
const records = seedRemittances(history.runs, "Finance", today);
const ctx = { people: new Map(bundle.employees.map((e) => [e.id, e])), profiles: new Map(profiles.map((p) => [p.employeeId, p])), settings };

describe("B3 · statutory remittance management", () => {
  it("a payment recorded without evidence is never counted as paid", () => {
    const key = Object.keys(records)[0];
    const stripped = { ...records, [key]: { ...records[key], status: "paid" as const, receipt: null } };
    const row = remittanceRows(history.runs, stripped, today).find((r) => r.key === key)!;
    expect(row.paid).toBe(0);
    expect(row.status === "submitted" || row.status === "overdue").toBe(true);
  });

  it("escalates a remittance that's well past its deadline, once", () => {
    const rows = remittanceRows(history.runs, {}, today);
    const late = rows.filter((r) => r.overdue && r.daysToDue <= -5);
    expect(late.length).toBeGreaterThan(0);
    const due = remindersDue(rows, 5, undefined);
    expect(due.filter((d) => d.stage === "escalated").map((d) => d.row.key).sort()).toEqual(late.map((r) => r.key).sort());
    expect(remindersDue(rows, 5, Object.fromEntries(due.map((d) => [d.key, "x"])))).toHaveLength(0);
  });

  it("the audit pack covers summary, reconciliation, outstanding, evidence, every schedule and history — and ties out", () => {
    const rows = remittanceRows(history.runs, records, today);
    const month = rows.find((r) => r.status === "reconciled")!.month;
    const pack = buildAuditPack(month, rows, ctx, [{ id: "A1", tenantId: "T", at: `${month}-28T10:00:00Z`, actor: "Finance", action: "Remittance reconciled", detail: `${month}:paye` }], "Auditor", new Date("2026-11-24T12:00:00Z"))!;
    const names = pack.sheets.map((s) => s.name);
    expect(names.slice(0, 4)).toEqual(["1 Summary", "2 Reconciliation", "3 Outstanding", "4 Evidence"]);
    expect(names.at(-1)).toBe("5 Activity history");
    expect(names.some((n) => /Pension/i.test(n))).toBe(true);
    const mine = rows.filter((r) => r.month === month && r.liability > 0);
    expect(pack.totals.liability).toBeCloseTo(mine.reduce((s, r) => s + r.liability, 0), 2);
    expect(pack.totals.outstanding).toBeCloseTo(mine.reduce((s, r) => s + r.outstanding, 0), 2);
    expect(pack.sheets.at(-1)!.table.data).toHaveLength(1);
    // Pension schedule groups by PFA.
    const pension = pack.sheets.find((s) => /Pension/i.test(s.name))!;
    expect(pension.table.headers[0]).toBe("PFA");
  });
});
