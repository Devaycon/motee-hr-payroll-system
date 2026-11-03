import { describe, expect, it } from "vitest";
import type { PerfInput } from "@/src/lib/branches/performance";
import { KPI_DEFS, type KpiId } from "@/src/lib/branches/performance";
import type { WorkflowRun } from "@/src/lib/types/workflow-runs";
import type { RiskRecord } from "@/src/lib/types/workforce-risk";
import { DEFAULT_RISK_SETTINGS, detectRisks, type RiskInput, type RiskPerson } from "./rules";
import { buildRegister, deriveStatus, riskReport } from "./register";
import uk from "@/src/data/locale/uk.json";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { buildPerfInput } from "@/src/lib/branches/performance-input";

const AS_OF = "2026-01-31";
const TARGETS = Object.fromEntries(KPI_DEFS.map((k) => [k.id, k.defaultTarget])) as Record<KpiId, number>;

function perf(overrides: Partial<PerfInput> = {}): PerfInput {
  return {
    asOf: AS_OF,
    branches: [{ id: "B1", name: "Leeds", code: "LDS", city: "Leeds", status: "active", headcountTarget: 3 }],
    employees: [
      { id: "e1", fullName: "Ada One", branchId: "B1" },
      { id: "e2", fullName: "Ben Two", branchId: "B1" },
      { id: "e3", fullName: "Cy Three", branchId: "B1" },
    ],
    tasks: [],
    attendance: [],
    enrollments: [],
    documents: [],
    dbsChecks: [],
    sickness: [],
    tickets: [],
    grievances: [],
    reviews: [],
    ...overrides,
  };
}

const PEOPLE: RiskPerson[] = [
  { id: "e1", fullName: "Ada One", branchId: "B1", status: "active" },
  { id: "e2", fullName: "Ben Two", branchId: "B1", status: "active" },
  { id: "e3", fullName: "Cy Three", branchId: "B1", status: "active" },
];

function input(overrides: Partial<RiskInput> = {}): RiskInput {
  return { perf: perf(), people: PEOPLE, bradford: [], targets: TARGETS, settings: DEFAULT_RISK_SETTINGS, country: "uk", ...overrides };
}

const ids = (i: RiskInput) => detectRisks(i).map((r) => r.id);

describe("detectRisks", () => {
  it("finds nothing in clean data", () => {
    expect(detectRisks(input())).toEqual([]);
  });

  it("treats a lapsed right-to-work document as a critical existing problem", () => {
    const risks = detectRisks(
      input({ perf: perf({ documents: [{ employeeId: "e1", name: "Ada One — Right to Work Share Code", status: "expired", expiresAt: "2025-12-01" }] }) }),
    );
    expect(risks).toHaveLength(1);
    expect(risks[0]).toMatchObject({ id: "rtw-expired:e1", kind: "existing_problem", priority: "critical", basis: "actual" });
  });

  it("warns about an expiring document only inside the window", () => {
    const doc = (expiresAt: string) =>
      input({ perf: perf({ documents: [{ employeeId: "e2", name: "Ben Two — Right to Work Share Code", status: "verified", expiresAt }] }) });
    expect(ids(doc("2026-02-20"))).toEqual(["rtw-expiring:e2"]);
    expect(detectRisks(doc("2026-02-20"))[0].priority).toBe("high");
    expect(ids(doc("2026-03-25"))).toEqual(["rtw-expiring:e2"]);
    expect(detectRisks(doc("2026-03-25"))[0].priority).toBe("normal");
    expect(ids(doc("2026-06-01"))).toEqual([]);
  });

  it("runs right-to-work rules only in the UK, and treats a lone passport as a compliance document", () => {
    const docs = [{ employeeId: "e1", name: "Ada One — Right to Work Share Code", status: "expired" }];
    expect(ids(input({ country: "ng", perf: perf({ documents: docs }) }))).toEqual(["compliance-docs:B1"]);
    expect(
      ids(input({ perf: perf({ documents: [{ employeeId: "e1", name: "Ada One — Passport", status: "expired" }] }) })),
    ).toEqual(["compliance-docs:B1"]);
  });

  it("groups other compliance gaps by branch", () => {
    const risks = detectRisks(
      input({
        perf: perf({
          documents: [{ employeeId: "e3", name: "Cy Three — DBS Certificate", status: "expired" }],
          dbsChecks: [{ employeeId: "e2", status: "pending" }],
        }),
      }),
    );
    expect(risks.map((r) => r.id)).toEqual(["compliance-docs:B1"]);
    expect(risks[0].affected.count).toBe(2);
  });

  it("only raises Bradford risks above the monitoring band", () => {
    expect(ids(input({ bradford: [{ employeeId: "e1", score: 40, action: "monitor", episodes: 2, days: 10 }] }))).toEqual([]);
    const [risk] = detectRisks(input({ bradford: [{ employeeId: "e1", score: 300, action: "formal_review", episodes: 5, days: 12 }] }));
    expect(risk).toMatchObject({ id: "bradford:e1", priority: "high", kind: "existing_problem" });
  });

  it("separates overdue and upcoming probation decisions", () => {
    const people = (end: string) => PEOPLE.map((p) => (p.id === "e3" ? { ...p, probationStatus: "Open", probationEndDate: end } : p));
    expect(ids(input({ people: people("2026-01-10") }))).toEqual(["probation-overdue:e3"]);
    expect(ids(input({ people: people("2026-02-07") }))).toEqual(["probation-due:e3"]);
    expect(ids(input({ people: people("2026-04-01") }))).toEqual([]);
  });

  it("ignores people who have left", () => {
    const people = PEOPLE.map((p) => (p.id === "e1" ? { ...p, status: "terminated" } : p));
    expect(
      ids(input({ people, perf: perf({ documents: [{ employeeId: "e1", name: "Ada One — Right to Work Share Code", status: "expired" }] }) })),
    ).toEqual([]);
  });

  it("respects rules switched off by the organisation", () => {
    const i = input({
      perf: perf({ documents: [{ employeeId: "e1", name: "Ada One — Right to Work Share Code", status: "expired" }] }),
      settings: { ...DEFAULT_RISK_SETTINGS, disabledRules: ["rtw-expired"] },
    });
    expect(ids(i)).toEqual([]);
  });

  it("keeps ids stable across runs", () => {
    const i = input({ perf: perf({ documents: [{ employeeId: "e1", name: "Ada One — Right to Work Share Code", status: "expired" }] }) });
    expect(ids(i)).toEqual(ids(i));
  });
});

// ── Register ─────────────────────────────────────────────────────────────────

const lapsed = detectRisks(
  input({ perf: perf({ documents: [{ employeeId: "e1", name: "Ada One — Right to Work Share Code", status: "expired" }] }) }),
)[0];

function record(overrides: Partial<RiskRecord> = {}): RiskRecord {
  return {
    key: `T1::${lapsed.id}`,
    tenantId: "T1",
    riskId: lapsed.id,
    snapshot: lapsed,
    pastRunIds: [],
    recurrenceCount: 0,
    history: [{ at: "2026-01-01T00:00:00Z", by: "HR", action: "acknowledged" }],
    ...overrides,
  };
}

function run(status: WorkflowRun["status"], dueDate = "2099-01-01"): WorkflowRun {
  return {
    id: "RUN-1",
    workflowId: "WF-RISK",
    workflowTitle: "Risk action plan",
    workflowVersion: 1,
    trigger: "manual",
    subject: { kind: "workforce_risk", id: lapsed.id, name: lapsed.title, href: "/" },
    anchorDate: AS_OF,
    context: {},
    status,
    startedAt: "2026-01-01T00:00:00Z",
    startedBy: "HR",
    tasks: [
      {
        id: "RUN-1::owner",
        templateTaskId: "owner",
        order: 0,
        title: "Fix it",
        priority: "critical",
        status: status === "completed" ? "completed" : "not_started",
        assignee: { kind: "employee", employeeId: "e2" },
        assigneeEmployeeId: "e2",
        assigneeName: "Ben Two",
        reviewer: null,
        reviewerEmployeeId: null,
        reviewerName: null,
        dueDate,
        escalateAfterDays: 2,
        dependsOn: [],
      },
    ],
  };
}

describe("deriveStatus", () => {
  it("walks new → acknowledged → in action → awaiting closure → closed", () => {
    expect(deriveStatus(lapsed, undefined, undefined)).toBe("new");
    expect(deriveStatus(lapsed, record(), undefined)).toBe("acknowledged");
    expect(deriveStatus(lapsed, record({ runId: "RUN-1" }), run("active"))).toBe("in_action");
    expect(deriveStatus(lapsed, record({ runId: "RUN-1" }), run("completed"))).toBe("awaiting_closure");
    const closure = { by: "HR", at: "2026-01-20T00:00:00Z", outcome: "resolved" as const, evidence: "New check done", fingerprint: lapsed.fingerprint };
    expect(deriveStatus(lapsed, record({ closure }), run("completed"))).toBe("closed");
  });

  it("reopens a closed risk when it recurs with new evidence, or was not resolved", () => {
    const closure = { by: "HR", at: "2026-01-20T00:00:00Z", outcome: "resolved" as const, evidence: "Done", fingerprint: "old" };
    expect(deriveStatus(lapsed, record({ closure }), undefined)).toBe("reopened");
    expect(deriveStatus(undefined, record({ closure }), undefined)).toBe("closed");
    expect(
      deriveStatus(lapsed, record({ closure: { ...closure, fingerprint: lapsed.fingerprint, outcome: "not_resolved" } }), undefined),
    ).toBe("reopened");
  });
});

describe("buildRegister", () => {
  it("keeps an actioned risk after its rule stops firing, and flags overdue escalation", () => {
    const now = new Date("2026-02-10T00:00:00Z");
    const entries = buildRegister([], [record({ runId: "RUN-1" })], [run("active", "2026-02-01")], "T1", now);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ detected: false, status: "in_action", overdue: true, escalated: true, owner: "Ben Two" });
  });

  it("reports improvements from the before/after metric", () => {
    const metricRisk = { ...lapsed, metric: { label: "Outstanding", value: 6, target: 0, unit: "count" as const } };
    const closure = { by: "HR", at: "2026-01-05T00:00:00Z", outcome: "resolved" as const, evidence: "Collected", metricAtClose: 1, fingerprint: lapsed.fingerprint };
    const entries = buildRegister([], [record({ snapshot: metricRisk, closure })], [], "T1");
    const report = riskReport(entries);
    expect(report.closed).toBe(1);
    expect(report.improvements).toHaveLength(1);
    expect(report.meanDaysToResolve).toBe(4);
  });
});

describe("demo bundles", () => {
  it.each([
    ["uk", uk],
    ["ng", nigeria],
  ])("%s: every risk is unique and fully explained", (country, bundle) => {
    const b = bundle as unknown as LocaleBundle;
    const risks = detectRisks({
      perf: buildPerfInput(b, b.branches as never),
      people: b.employees.map((e) => ({ ...e, probationStatus: (e as { probationStatus?: string }).probationStatus, probationEndDate: (e as { probationEndDate?: string }).probationEndDate })),
      bradford: [],
      targets: TARGETS,
      settings: DEFAULT_RISK_SETTINGS,
      country,
    });
    expect(risks.length).toBeGreaterThan(0);
    if (country === "ng") expect(risks.some((r) => r.ruleId.startsWith("rtw-"))).toBe(false);
    expect(new Set(risks.map((r) => r.id)).size).toBe(risks.length);
    for (const r of risks) {
      expect(r.evidence.length).toBeGreaterThan(0);
      expect(r.impact && r.priorityReason && r.recommendedAction).toBeTruthy();
    }
  });
});
