import { describe, expect, it } from "vitest";
import reducer, { hydrate } from "./access-levels-slice";
import { DEFAULT_ACCESS_LEVELS } from "@/src/lib/permissions/seeds";
import type { AccessLevel } from "@/src/lib/types/access-levels";

/**
 * Rehydrating a saved snapshot must not pin a default role to whatever the
 * seed happened to say the day it was taken. `.data/runtime/access-levels.json`
 * is committed to this repo, so a stale entry there reaches every developer.
 */
function snapshotOf(id: string, mutate: (l: AccessLevel) => AccessLevel) {
  const seed = DEFAULT_ACCESS_LEVELS.find((l) => l.id === id)!;
  return mutate(structuredClone(seed));
}

const hydrateWith = (levels: AccessLevel[]) =>
  reducer(undefined, hydrate(levels));

describe("mergeWithSeed on hydrate", () => {
  it("re-derives the data scope of a role nobody has edited", () => {
    // The exact regression this guards: the committed snapshot still said
    // `business_unit` (an inert placeholder) after the seed moved HR Manager
    // to a real branch restriction, so the restriction never applied.
    const stale = snapshotOf("AL-HR-MANAGER", (l) => ({
      ...l,
      dataScope: { kind: "business_unit" },
      lastModifiedBy: "System",
    }));

    const state = hydrateWith([stale]);
    const merged = state.levels.find((l) => l.id === "AL-HR-MANAGER")!;
    expect(merged.dataScope.kind).toBe("branch");
  });

  it("preserves a data scope a human actually chose", () => {
    const edited = snapshotOf("AL-HR-MANAGER", (l) => ({
      ...l,
      dataScope: { kind: "department", departmentIds: ["DEP-ENG"] },
      lastModifiedBy: "You",
    }));

    const state = hydrateWith([edited]);
    const merged = state.levels.find((l) => l.id === "AL-HR-MANAGER")!;
    expect(merged.dataScope).toEqual({
      kind: "department",
      departmentIds: ["DEP-ENG"],
    });
  });

  it("still fills in modules added since the snapshot", () => {
    const stale = snapshotOf("AL-HR-ADMIN", (l) => ({
      ...l,
      lastModifiedBy: "System",
      permissions: l.permissions.filter(
        (p) => p.module !== "organization.branches",
      ),
    }));

    const state = hydrateWith([stale]);
    const merged = state.levels.find((l) => l.id === "AL-HR-ADMIN")!;
    const branches = merged.permissions.find(
      (p) => p.module === "organization.branches",
    );
    expect(branches?.access).toBe(true);
    // HR Admin is the system administrator — it keeps everything.
    expect(merged.dataScope.kind).toBe("all");
    expect(merged.permissions.every((p) => p.access)).toBe(true);
  });

  it("adds seeded levels missing from the snapshot entirely", () => {
    const state = hydrateWith([]);
    expect(state.levels).toHaveLength(DEFAULT_ACCESS_LEVELS.length);
  });
});
