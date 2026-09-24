import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import uk from "@/src/data/locale/uk.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import {
  PERF_KEYS,
  buildPerformance,
  inferGoalCategory,
  resolveCycle,
} from "./records";

const bundle = nigeria as unknown as LocaleBundle;
const noEdits = { added: {}, edits: {}, removed: {} };
const TODAY = "2026-09-24";

describe("resolveCycle", () => {
  it("uses the bundle's cycle when listed", () => {
    const c = resolveCycle("RC-2025-H1", [
      { id: "RC-2025-H1", name: "H1 2025 Review", endDate: "2025-06-30" },
    ]);
    expect(c).toMatchObject({ period: "H1 2025", endDate: "2025-06-30", reviewType: "mid_year" });
  });

  it("derives past cycles the bundle no longer lists", () => {
    expect(resolveCycle("RC-2024-H2", [])).toMatchObject({
      period: "H2 2024",
      endDate: "2024-11-30",
      reviewType: "annual",
    });
  });
});

describe("buildPerformance on the bundle", () => {
  const data = buildPerformance(bundle, noEdits, undefined, TODAY);

  it("reads the ratings and completion the bundle actually carries", () => {
    const original = data.reviews.filter((r) => !r.id.includes("-PRF-"));
    expect(original).toHaveLength(60);
    for (const r of original) {
      expect(r.status).toBe("completed");
      expect(r.rating).toBeDefined();
      expect(r.period).toMatch(/^H[12] 20\d\d$/);
    }
    const raw = (bundle.performance as { reviews: { id: string; calibratedRating: number }[] }).reviews[0];
    expect(data.reviews.find((r) => r.id === raw.id)?.rating).toBe(raw.calibratedRating);
  });

  it("names the line manager as reviewer", () => {
    const withManager = data.reviews.find((r) => {
      const emp = bundle.employees.find((e) => e.id === r.employeeId);
      return emp?.managerId;
    });
    expect(withManager?.reviewer).not.toBe("—");
  });

  it("gives goals a cycle due date and flags lapsed ones overdue", () => {
    const emp = bundle.employees.find((e) => e.status === "active")!;
    const withGoal = buildPerformance(
      bundle,
      {
        added: {
          [PERF_KEYS.goals]: [
            { id: "GOAL-t", employeeId: emp.id, cycleId: "RC-2025-H2", title: "Ship it", progress: 40, status: "on_track" },
          ],
        },
        edits: {},
        removed: {},
      },
      undefined,
      TODAY,
    );
    const g = withGoal.goals.find((x) => x.id === "GOAL-t");
    expect(g?.dueDate).toBe("2025-11-30");
    expect(g?.status).toBe("overdue");
  });

  it("drops records for people outside the viewer's scope", () => {
    const one = bundle.employees[0];
    const scoped = { ...bundle, employees: [one] } as LocaleBundle;
    const mine = buildPerformance(scoped, noEdits, bundle.employees, TODAY);
    expect(mine.reviews.every((r) => r.employeeId === one.id)).toBe(true);
    expect(mine.reviews.length).toBeGreaterThan(0);
  });
});

describe("edits", () => {
  it("layers completion and new records over the bundle", () => {
    const emp = bundle.employees.find((e) => e.status === "active")!;
    const data = buildPerformance(
      bundle,
      {
        added: {
          [PERF_KEYS.reviews]: [
            { id: "REV-new", employeeId: emp.id, type: "probation", period: "Probation", dueDate: "2026-12-01" },
          ],
        },
        edits: {},
        removed: {},
      },
      undefined,
      TODAY,
    );
    const r = data.reviews.find((x) => x.id === "REV-new");
    expect(r).toMatchObject({ status: "not_started", reviewType: "probation", period: "Probation" });
  });

  it("hides removed records", () => {
    const first = (bundle.performance as { reviews: { id: string }[] }).reviews[0].id;
    const data = buildPerformance(
      bundle,
      { added: {}, edits: {}, removed: { [PERF_KEYS.reviews]: [first] } },
      undefined,
      TODAY,
    );
    expect(data.reviews.some((r) => r.id === first)).toBe(false);
  });
});

// Guards the seeded demo data (scripts/augment-performance-fixtures.mjs).
describe.each([
  ["nigeria", nigeria],
  ["uk", uk],
])("seeded %s performance data", (_name, raw) => {
  const b = raw as unknown as LocaleBundle;
  const data = buildPerformance(b, noEdits);
  const cycles = (b.performance as { cycles: { id: string; status: string }[] }).cycles;
  const open = cycles.find((c) => c.status === "in_progress");
  const inOpen = data.reviews.filter((r) => r.cycleId === open?.id);
  const persona = (b.roles as { id: string; linkedEmployeeId: string }[]).find(
    (r) => r.id === "ROLE-EMP",
  )!.linkedEmployeeId;

  it("has an open cycle with a review at every stage", () => {
    expect(inOpen.length).toBeGreaterThan(10);
    expect(inOpen.some((r) => r.status === "not_started")).toBe(true);
    expect(inOpen.some((r) => r.selfAssessment && !r.selfSubmittedAt)).toBe(true);
    expect(inOpen.some((r) => r.selfSubmittedAt && !r.managerRating)).toBe(true);
    expect(inOpen.some((r) => r.managerRating && r.status !== "completed")).toBe(true);
    expect(inOpen.some((r) => r.status === "completed")).toBe(true);
    expect(inOpen.every((r) => r.reviewer !== "—")).toBe(true);
  });

  it("shows probation and PIP reviews, the PIP overdue", () => {
    expect(data.reviews.some((r) => r.reviewType === "probation")).toBe(true);
    expect(data.reviews.find((r) => r.reviewType === "pip")?.status).toBe("overdue");
  });

  it("gives the Employee demo login a draft to finish", () => {
    const mine = inOpen.find((r) => r.employeeId === persona);
    expect(mine?.selfAssessment).toBeDefined();
    expect(mine?.selfSubmittedAt).toBeUndefined();
    expect(data.goals.some((g) => g.employeeId === persona && g.cycleId === open?.id)).toBe(true);
    expect(data.feedback.some((f) => f.toEmployeeId === persona)).toBe(true);
  });

  it("keeps overdue goals a minority", () => {
    const overdue = data.goals.filter((g) => g.status === "overdue").length;
    expect(overdue / data.goals.length).toBeLessThan(0.25);
    expect(data.goals.some((g) => g.status === "at_risk")).toBe(true);
    expect(data.feedbackRequests.length).toBeGreaterThan(0);
  });
});

it("infers goal categories from titles", () => {
  expect(inferGoalCategory("Complete leadership training")).toBe("leadership");
  expect(inferGoalCategory("Ship Q-flagship feature on time")).toBe("technical");
  expect(inferGoalCategory("Reduce ticket resolution time by 20%")).toBe("operational");
});
