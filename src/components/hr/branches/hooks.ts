"use client";

import { useCallback, useMemo } from "react";
// Unscoped: the branch list is what the switcher is built from, so narrowing
// it by the current selection would leave you unable to switch back.
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  addRecord,
  removeRecord,
  updateRecord,
} from "@/src/lib/stores/collection-edits-slice";
import { setActiveBranch } from "@/src/lib/stores/branch-slice";
import { applyCollection } from "@/src/lib/profile/collection-edits";
import { applyBundleOverrides } from "@/src/lib/profile/overrides";
import { BRANCHES_KEY } from "@/src/lib/branches/use-branch";
import {
  branchAddressLabel,
  type Branch,
  type LocaleBranch,
} from "@/src/lib/types/branches";
import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";

/**
 * Branch records with derived headcount joined on, in the same spirit as
 * `buildDepartments` — the counts are always computed from the employee list
 * rather than stored, so they cannot drift.
 */
function buildBranches(
  base: LocaleBranch[],
  employees: LocaleEmployee[],
): Branch[] {
  const byId = new Map(employees.map((e) => [e.id, e]));
  return base.map((b) => {
    const staff = employees.filter((e) => e.branchId === b.id);
    const manager = b.managerEmployeeId
      ? byId.get(b.managerEmployeeId)
      : undefined;
    const departments = new Set(staff.map((e) => e.departmentId));
    return {
      ...b,
      managerName: manager?.fullName ?? null,
      managerInitials: manager?.initials,
      employeeCount: staff.length,
      departmentCount: departments.size,
      openPositions: Math.max(0, (b.headcountTarget ?? 0) - staff.length),
      addressLabel: branchAddressLabel(b),
    };
  });
}

export function useBranches() {
  const added = useAppSelector((s) => s.collectionEdits.added);
  const edits = useAppSelector((s) => s.collectionEdits.edits);
  const removed = useAppSelector((s) => s.collectionEdits.removed);

  const overrides = useAppSelector((s) => s.profileEdits.overrides);
  // Select the raw bundle and layer overrides on in a memo, the way the
  // employees and structure hooks do. `useLocaleSection` only re-runs its
  // selector when the bundle or the branch scope changes, so an override read
  // from inside the selector would go stale.
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>(
    (b) => b,
  );

  const branches = useMemo(() => {
    if (!bundle) return null;
    const merged = applyCollection<LocaleBranch>(
      bundle.branches ?? [],
      BRANCHES_KEY,
      { added, edits, removed },
    );
    // Overrides so the headcount follows an employee who has just been
    // reassigned on their record, rather than waiting for a reload.
    return buildBranches(
      merged,
      applyBundleOverrides(bundle, overrides).employees,
    );
  }, [bundle, overrides, added, edits, removed]);

  return { data: branches, loading, error };
}

/** One branch plus the people posted to it, for the detail page. */
export function useBranch(branchId: string) {
  const { data: branches, loading, error } = useBranches();
  const overrides = useAppSelector((s) => s.profileEdits.overrides);
  const { data: bundle } = useLocaleSection<LocaleBundle>((b) => b);

  const branch = useMemo(
    () => branches?.find((b) => b.id === branchId) ?? null,
    [branches, branchId],
  );

  const staff = useMemo(
    () =>
      bundle
        ? applyBundleOverrides(bundle, overrides).employees.filter(
            (e) => e.branchId === branchId,
          )
        : [],
    [bundle, overrides, branchId],
  );

  return { branch, staff, loading, error };
}

export interface BranchMutations {
  create: (branch: LocaleBranch) => void;
  update: (id: string, patch: Partial<LocaleBranch>) => void;
  remove: (id: string) => void;
}

/**
 * Create/edit/delete through the shared collection-edits slice, so branches get
 * the same session persistence (`.data/runtime/collection-edits.json`) every
 * other bundle-backed collection already has — no bespoke slice needed.
 */
export function useBranchMutations(): BranchMutations {
  const dispatch = useAppDispatch();
  const activeBranchId = useAppSelector((s) => s.branch.activeBranchId);

  const create = useCallback(
    (branch: LocaleBranch) => {
      // The slice stores untyped records; the branch shape is re-applied on
      // the way out in `useBranches`.
      dispatch(
        addRecord({
          key: BRANCHES_KEY,
          record: branch as unknown as Record<string, unknown>,
        }),
      );
    },
    [dispatch],
  );

  const update = useCallback(
    (id: string, patch: Partial<LocaleBranch>) => {
      dispatch(updateRecord({ key: BRANCHES_KEY, id, patch }));
    },
    [dispatch],
  );

  const remove = useCallback(
    (id: string) => {
      // Deleting the branch the app is scoped to would leave every screen
      // filtered to a record that no longer exists.
      if (activeBranchId === id) dispatch(setActiveBranch(null));
      dispatch(removeRecord({ key: BRANCHES_KEY, id }));
    },
    [dispatch, activeBranchId],
  );

  return { create, update, remove };
}

/** Next free id in the bundle's own `XX-BR-0001` sequence. */
export function useNextBranchId(): () => string {
  const branches = useAppSelector((s) => s.locale.data?.branches);
  const added = useAppSelector((s) => s.collectionEdits.added[BRANCHES_KEY]);
  const tenantEmployeeId = useAppSelector(
    (s) => s.locale.data?.employees[0]?.id,
  );

  return useCallback(() => {
    const prefix = (tenantEmployeeId ?? "XX-EMP-0001").split("-")[0];
    const ids = [
      ...(branches ?? []).map((b) => b.id),
      ...(added ?? []).map((b) => String(b.id ?? "")),
    ];
    const highest = ids.reduce((max, id) => {
      const n = Number(id.split("-").pop());
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
    return `${prefix}-BR-${String(highest + 1).padStart(4, "0")}`;
  }, [branches, added, tenantEmployeeId]);
}
