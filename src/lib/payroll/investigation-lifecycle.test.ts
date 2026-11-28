import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import reducer, {
  addInvestigationComment,
  openInvestigation,
  resolveInvestigation,
  reviewInvestigation,
  signOffInvestigation,
  updateInvestigation,
  type PayrollState,
  type TenantPayroll,
} from "@/src/lib/stores/payroll-slice";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { seedHistory, seedProfile, seedStructure } from "./run-builder";
import { compareRuns, type RunComparison } from "./comparison";
import { detectUnexplained, lifecycleOf, stageLabel } from "./investigation-lifecycle";
import type { VarianceInvestigation } from "./types";

/** Client feedback B5 (Nov 2026): Detection → Investigation → Assignment → Resolution → Independent sign-off → Closure. */

const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const base = { elements: SEED_PAY_ELEMENTS, rateSets: NG_RATE_SETS, settings, structures: bundle.employees.map((e) => seedStructure(e, settings)), profiles: bundle.employees.map(seedProfile) };
const history = seedHistory({ tenantId: "T", bundle, base, loans: bundle.loans ?? [], today: new Date("2026-11-24T12:00:00Z") });
const nov = history.runs.find((r) => r.period.month === 11)!;
const oct = history.runs.find((r) => r.period.month === 10)!;
const cmp = compareRuns(nov, oct, { people: new Map(bundle.employees.map((e) => [e.id, e])), elements: base.elements, structures: base.structures });

const T = "T";
const blank = (over: Partial<VarianceInvestigation> = {}): VarianceInvestigation => ({
  id: "INV-1",
  runId: nov.id,
  previousRunId: oct.id,
  periodLabel: "November 2026",
  amount: -1_069_999.99,
  title: "Tochukwu Lawal: gross pay down ₦1.1m",
  finding: "Leave allowance paid in October did not recur.",
  status: "open",
  ownerId: "",
  ownerName: "",
  createdBy: "MOTEE",
  createdAt: "2026-11-24T08:00:00Z",
  comments: [],
  documents: [],
  history: [{ at: "2026-11-24T08:00:00Z", actor: "MOTEE", action: "Detected an unexplained movement" }],
  detectedBy: "system",
  ...over,
});
const start = (inv: VarianceInvestigation): PayrollState => reducer({ byTenant: { [T]: { ...history, ...base, audit: [] } as unknown as TenantPayroll }, seedVersion: 12 }, openInvestigation({ tenantId: T, actor: "MOTEE", investigation: inv }));
const get = (s: PayrollState) => s.byTenant[T].investigations![0];

describe("B5 · investigation lifecycle", () => {
  it("walks the six stages in order, each read from the record", () => {
    let s = start(blank());
    expect(lifecycleOf(get(s)).current).toBe("investigation");
    expect(lifecycleOf(get(s)).stages[0]).toMatchObject({ state: "done", by: "MOTEE (automatic)" });

    s = reducer(s, reviewInvestigation({ tenantId: T, actor: "Kemi (Payroll)", id: "INV-1", note: "Input ONE_OFF entered on 3 Nov — no approval attached." }));
    expect(get(s).status).toBe("investigating");
    expect(lifecycleOf(get(s)).current).toBe("assignment");

    // Can't resolve an unowned case.
    s = reducer(s, resolveInvestigation({ tenantId: T, actor: "Kemi (Payroll)", id: "INV-1", note: "x", outcome: "legitimate" }));
    expect(get(s).status).toBe("investigating");

    s = reducer(s, updateInvestigation({ tenantId: T, actor: "Kemi (Payroll)", id: "INV-1", patch: { ownerId: "E1", ownerName: "Bola (Finance)" }, note: "Assigned to Bola (Finance)" }));
    expect(lifecycleOf(get(s)).current).toBe("resolution");

    s = reducer(s, resolveInvestigation({ tenantId: T, actor: "Bola (Finance)", actorId: "E1", id: "INV-1", note: "Non-recurring leave allowance — legitimate.", outcome: "legitimate" }));
    expect(stageLabel(get(s))).toBe("Independent sign-off");

    // The resolver can't sign off their own resolution.
    s = reducer(s, signOffInvestigation({ tenantId: T, actor: "Bola (Finance)", actorId: "E1", id: "INV-1", decision: "accepted" }));
    expect(get(s).closedAt).toBeUndefined();

    s = reducer(s, signOffInvestigation({ tenantId: T, actor: "Ada (Executive)", actorId: "E2", id: "INV-1", decision: "accepted" }));
    expect(get(s).closedAt).toBeDefined();
    expect(lifecycleOf(get(s))).toMatchObject({ closed: true, current: null });
    expect(stageLabel(get(s))).toBe("Closed");
  });

  it("a closed case is a permanent record: comments, edits and reassignment are refused", () => {
    let s = start(blank({ ownerId: "E1", ownerName: "Bola", status: "resolved", resolvedBy: "Bola", resolvedById: "E1", signOff: { by: "Ada", at: "x", decision: "accepted" }, closedAt: "2026-11-25T10:00:00Z" }));
    const before = JSON.stringify(get(s));
    s = reducer(s, addInvestigationComment({ tenantId: T, actor: "X", id: "INV-1", commentId: "C1", text: "late note" }));
    s = reducer(s, updateInvestigation({ tenantId: T, actor: "X", id: "INV-1", patch: { ownerId: "E9", ownerName: "Someone" }, note: "Reassigned" }));
    s = reducer(s, reviewInvestigation({ tenantId: T, actor: "X", id: "INV-1", note: "rewrite" }));
    expect(JSON.stringify(get(s))).toBe(before);
  });

  it("detection raises one unassigned case per unexplained employee, and never a duplicate", () => {
    const e = cmp.employees.find((x) => x.movements.length)!;
    const forced: RunComparison = { ...cmp, employees: cmp.employees.map((x) => (x.employeeId === e.employeeId ? { ...x, confidence: "unexplained" } : { ...x, confidence: "confirmed" })) };
    const found = detectUnexplained(forced, []);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ employeeId: e.employeeId, detectedBy: "system", runId: nov.id });
    expect(detectUnexplained(forced, [blank({ employeeId: e.employeeId })])).toHaveLength(0);
  });
});
