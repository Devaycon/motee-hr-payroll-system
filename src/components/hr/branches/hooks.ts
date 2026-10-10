"use client";

import { useCallback, useMemo } from "react";
// Unscoped: the branch list is what the switcher is built from, so narrowing
// it by the current selection would leave you unable to switch back.
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/src/lib/utils";
import { branchSchema } from "@/src/lib/validations/branches";
import {
  useCreateBranchMutation,
  useDeleteBranchMutation,
  useGetBranchQuery,
  useUpdateBranchMutation,
} from "@/src/store/services/branches";
import type { BranchRequest } from "@/src/types/branches";
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

  const { data: fresh } = useGetBranchQuery(branchId, { skip: !branchId });
  const branch = useMemo(() => {
    const listed = branches?.find((b) => b.id === branchId) ?? null;
    const latest = fresh?.data;
    if (!listed || !latest) return listed;
    // Headcounts are the server's; the list derives its own from whatever
    // employees the viewer's scope lets them see.
    return {
      ...listed,
      managerName: latest.managerName ?? listed.managerName,
      employeeCount: latest.employeeCount,
      departmentCount: latest.departmentCount,
      openPositions: latest.openPositions ?? listed.openPositions,
    };
  }, [branches, branchId, fresh]);

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

const KIND_TO_API: Record<LocaleBranch["kind"], BranchRequest["kind"]> = {
  headquarters: "headquarters",
  branch: "branch",
  regional_office: "regionalOffice",
  site: "site",
  remote: "remote",
};

/** Checks the form's record and shapes it for the API; null when invalid. */
function toBranchRequest(branch: LocaleBranch): BranchRequest | null {
  const parsed = branchSchema.safeParse({
    name: branch.name,
    code: branch.code,
    kind: KIND_TO_API[branch.kind],
    status: branch.status,
    addressLines: branch.addressLines ?? [],
    city: branch.city || null,
    region: branch.region || null,
    postalCode: branch.postalCode || null,
    country: branch.country || null,
    timeZone: branch.timezone || null,
    phone: branch.phone || null,
    email: branch.email || null,
    managerEmployeeId: branch.managerEmployeeId || null,
    headcountTarget: branch.headcountTarget ?? null,
    openedAt: branch.openedAt || null,
  });
  if (!parsed.success) {
    toast.error(parsed.error.issues[0].message);
    return null;
  }
  return parsed.data;
}

/** Create/edit/delete against the API; the list refreshes from the server. */
export function useBranchMutations(): BranchMutations {
  const dispatch = useAppDispatch();
  const activeBranchId = useAppSelector((s) => s.branch.activeBranchId);
  const current = useAppSelector((s) => s.locale.data?.branches);
  const [createBranch] = useCreateBranchMutation();
  const [updateBranch] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  const create = useCallback(
    (branch: LocaleBranch) => {
      const body = toBranchRequest(branch);
      if (!body) return;
      createBranch(body)
        .unwrap()
        .then(() => toast.success(`${branch.name} created`))
        .catch((err) =>
          toast.error(getApiErrorMessage(err, "Could not create the branch.")),
        );
    },
    [createBranch],
  );

  const update = useCallback(
    (id: string, patch: Partial<LocaleBranch>) => {
      // The API replaces the whole record, so the patch is laid over it.
      const existing = current?.find((b) => b.id === id);
      if (!existing) return;
      const body = toBranchRequest({ ...existing, ...patch });
      if (!body) return;
      updateBranch({ id, body })
        .unwrap()
        .then(() => toast.success(`${body.name} updated`))
        .catch((err) =>
          toast.error(getApiErrorMessage(err, "Could not update the branch.")),
        );
    },
    [current, updateBranch],
  );

  const remove = useCallback(
    (id: string) => {
      deleteBranch(id)
        .unwrap()
        .then(() => {
          // Deleting the branch the app is scoped to would leave every screen
          // filtered to a record that no longer exists.
          if (activeBranchId === id) dispatch(setActiveBranch(null));
          toast.success("Branch deleted");
        })
        .catch((err) =>
          toast.error(getApiErrorMessage(err, "Could not delete the branch.")),
        );
    },
    [dispatch, activeBranchId, deleteBranch],
  );

  return { create, update, remove };
}

/** A placeholder id for the form; the server assigns the real one. */
export function useNextBranchId(): () => string {
  return useCallback(() => `new-${Date.now()}`, []);
}
