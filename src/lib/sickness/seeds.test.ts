import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import ng from "@/src/data/locale/nigeria.json";
import uk from "@/src/data/locale/uk.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import sicknessReducer, { seedTenant, reportSickness } from "@/src/lib/stores/sickness-slice";
import leaveReducer, { seed as seedLeave } from "@/src/lib/stores/leave-slice";
import { DEFAULT_BRADFORD_SETTINGS, calculateBradford } from "./bradford";
import { defaultSchemes, seedEnrolments, seedSicknessRecords } from "./seeds";

const BUNDLES: [string, string, LocaleBundle][] = [
  ["nigeria", "ng", ng as unknown as LocaleBundle],
  ["uk", "uk", uk as unknown as LocaleBundle],
];

describe.each(BUNDLES)("%s sickness seed", (_n, country, bundle) => {
  const today = "2026-10-16";
  const records = seedSicknessRecords(bundle, today);
  const schemes = defaultSchemes(bundle.tenant.id, country);

  it("moves every historic sick leave request into sickness records", () => {
    const sick = bundle.leaveRequests.filter((r) => /sick/i.test((r as unknown as { leaveType?: string }).leaveType ?? r.type ?? ""));
    expect(records.length).toBe(sick.length);
    expect(records.every((r) => r.tenantId === bundle.tenant.id)).toBe(true);
  });

  it("enrols every employee on one of the tenant's schemes", () => {
    const enrolments = seedEnrolments(bundle, schemes, country);
    expect(enrolments).toHaveLength(bundle.employees.length);
    expect(enrolments.every((e) => schemes.some((s) => s.id === e.schemeId))).toBe(true);
  });

  it("produces real Bradford scores", () => {
    const ids = [...new Set(records.map((r) => r.employeeId))];
    const scores = ids.map((id) => calculateBradford({ employeeId: id, records, asOf: today, settings: DEFAULT_BRADFORD_SETTINGS }).score);
    expect(scores.some((s) => s > 0)).toBe(true);
  });

  it("seeds once per tenant and records an audit entry for new reports", () => {
    const store = configureStore({ reducer: { sickness: sicknessReducer } });
    const payload = { tenantId: bundle.tenant.id, records, schemes, enrolments: [] };
    store.dispatch(seedTenant(payload));
    store.dispatch(seedTenant(payload));
    expect(store.getState().sickness.records).toHaveLength(records.length);
    store.dispatch(reportSickness({ actor: "HR", record: { ...records[0], id: "NEW" } }));
    expect(store.getState().sickness.audit[0]).toMatchObject({ action: "created", subjectId: "NEW" });
  });
});

describe("leave no longer holds sickness", () => {
  it("drops sick rows when Leave seeds", () => {
    const store = configureStore({ reducer: { leave: leaveReducer } });
    const base = { employeeName: "E", employeeInitials: "E", department: "D", jobTitle: "J", startDate: "2026-01-01", endDate: "2026-01-02", totalDays: 2, isHalfDay: false, status: "approved" as const, submittedAt: "2026-01-01", createdAt: "2026-01-01", history: [] };
    store.dispatch(
      seedLeave({
        requests: [
          { ...base, id: "a", leaveType: "annual" },
          { ...base, id: "s", leaveType: "sick" },
        ],
        balances: [],
        policies: [],
      }),
    );
    expect(store.getState().leave.requests.map((r) => r.id)).toEqual(["a"]);
  });
});
