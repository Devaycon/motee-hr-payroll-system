"use client";

import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { setActiveBranch } from "@/src/lib/stores/branch-slice";
import { applyCollection } from "@/src/lib/profile/collection-edits";
import {
  allowedBranchIds,
  isOpenScope,
  visibleEmployees,
} from "@/src/lib/permissions/data-scope";
import { useEffectiveAccess } from "@/src/lib/permissions/use-can";
import { BRANCHES_KEY } from "./keys";
import type { LocaleBranch } from "@/src/lib/types/branches";

export { BRANCHES_KEY } from "./keys";

/**
 * Every branch in the tenant, with this session's create/edit/delete deltas
 * layered on. Read straight off the store rather than through
 * `useLocaleSection` — the navbar switcher and the branch pickers must not
 * flash a skeleton, and the branch list is company-wide by definition so it is
 * never itself scoped.
 */
export function useAllBranches(): LocaleBranch[] {
  const base = useAppSelector((s) => s.locale.data?.branches);
  const bundle = useAppSelector((s) => s.locale.data);
  const added = useAppSelector((s) => s.collectionEdits.added);
  const edits = useAppSelector((s) => s.collectionEdits.edits);
  const removed = useAppSelector((s) => s.collectionEdits.removed);
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const access = useEffectiveAccess();

  return useMemo(() => {
    const merged = applyCollection<LocaleBranch>(base ?? [], BRANCHES_KEY, {
      added,
      edits,
      removed,
    });
    // Read straight off the store rather than through `useLocaleSection`, so
    // the role's data scope has to be applied by hand here — otherwise the
    // switcher would name sites whose people the role cannot open.
    if (access.unresolved || isOpenScope(access.dataScope)) return merged;
    const allowed = allowedBranchIds(bundle, access.dataScope, { employeeId });
    return allowed ? merged.filter((b) => allowed.has(b.id)) : merged;
  }, [base, bundle, added, edits, removed, access, employeeId]);
}

/** Active branches only — what a picker or the switcher should offer. */
export function useBranchOptions(): LocaleBranch[] {
  const branches = useAllBranches();
  return useMemo(
    () =>
      branches
        .filter((b) => b.status !== "inactive")
        .sort((a, b) => {
          // Head office first, then alphabetical — the order people expect.
          if (a.kind === "headquarters") return -1;
          if (b.kind === "headquarters") return 1;
          return a.name.localeCompare(b.name);
        }),
    [branches],
  );
}

export interface ActiveBranch {
  /** Null means "All Branches" — the unscoped view. */
  branchId: string | null;
  branch: LocaleBranch | null;
  isAllBranches: boolean;
  setBranch: (id: string | null) => void;
}

export function useActiveBranch(): ActiveBranch {
  const dispatch = useAppDispatch();
  const branchId = useAppSelector((s) => s.branch.activeBranchId);
  const branches = useAllBranches();

  const branch = useMemo(
    () => (branchId ? (branches.find((b) => b.id === branchId) ?? null) : null),
    [branchId, branches],
  );

  return {
    // A selection pointing at a branch that no longer exists (deleted, or a
    // stale cache from another tenant) reads as unscoped rather than empty.
    branchId: branch ? branchId : null,
    branch,
    isAllBranches: !branch,
    setBranch: (id: string | null) => dispatch(setActiveBranch(id)),
  };
}

/**
 * Headcount per branch id, for switcher badges and the branches table.
 *
 * Reads the raw employee list (never the scoped view — the switcher has to
 * show what every branch holds) but honours profile-edit overrides, so moving
 * someone between sites updates both counts straight away.
 */
export function useBranchHeadcounts(): Record<string, number> {
  const employees = useAppSelector((s) => s.locale.data?.employees);
  const overrides = useAppSelector((s) => s.profileEdits.overrides);
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const access = useEffectiveAccess();

  return useMemo(() => {
    // Overrides first so a reassignment is reflected straight away, then the
    // role's scope — this counts people, so it is subject to the same floor as
    // any other employee read.
    let people = (employees ?? []).map((e) => {
      const branchId = (overrides[e.id]?.branchId as string) ?? e.branchId;
      return branchId === e.branchId ? e : { ...e, branchId };
    });
    if (!access.unresolved && !isOpenScope(access.dataScope)) {
      people = visibleEmployees(people, access.dataScope, { employeeId });
    }

    const counts: Record<string, number> = {};
    for (const e of people) {
      if (!e.branchId) continue;
      counts[e.branchId] = (counts[e.branchId] ?? 0) + 1;
    }
    return counts;
  }, [employees, overrides, access, employeeId]);
}
