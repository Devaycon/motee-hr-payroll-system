"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { loadLocale } from "@/src/lib/stores/locale-slice";
import {
  resolveBranchScope,
  scopeBundleToBranch,
} from "@/src/lib/branches/scope";
import { isOpenScope, scopeBundleToAccess } from "@/src/lib/permissions/data-scope";
import { useEffectiveAccess } from "@/src/lib/permissions/use-can";
import { applyBundleOverrides } from "@/src/lib/profile/overrides";
import { BRANCHES_KEY } from "@/src/lib/branches/keys";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface UseLocaleSectionResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseLocaleSectionOptions {
  /**
   * Whether the navbar's active branch narrows the bundle before the selector
   * runs. Defaults to true, so a new screen is branch-aware without having to
   * remember anything.
   *
   * Pass `false` for company-wide surfaces — the branch list itself, company
   * profile, access levels, users, audit trail, settings, the platform portal,
   * and the employee detail page (a deep link to a colleague at another site
   * must still resolve).
   *
   * This opts out of the *view* switcher only. The role's own data scope is a
   * floor underneath it and is applied either way — otherwise `scope: false`
   * would be a way around the permission model.
   */
  scope?: boolean;
}

/**
 * Mocks an async fetch against the active locale bundle. Returns a fresh
 * loading state every time `country` or the active branch changes so screens
 * flash a skeleton.
 */
export function useLocaleSection<T>(
  selector: (bundle: LocaleBundle) => T,
  options?: UseLocaleSectionOptions,
): UseLocaleSectionResult<T> {
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.locale.country);
  const bundle = useAppSelector((s) => s.locale.data);
  const status = useAppSelector((s) => s.locale.status);
  const error = useAppSelector((s) => s.locale.error);
  const savedBranchId = useAppSelector((s) => s.branch.activeBranchId);
  const bundleBranches = useAppSelector((s) => s.locale.data?.branches);
  const addedBranches = useAppSelector(
    (s) => s.collectionEdits.added[BRANCHES_KEY],
  );
  // Resolved against the loaded tenant, exactly as the switcher does before it
  // renders a name. Reading the saved id raw here is what let a stale
  // selection empty every screen while the switcher read "All Branches".
  const activeBranchId = useMemo(
    () =>
      resolveBranchScope(savedBranchId, [
        ...(bundleBranches ?? []).map((b) => b.id),
        ...((addedBranches ?? []).map((b) => String(b.id ?? "")) as string[]),
      ]),
    [savedBranchId, bundleBranches, addedBranches],
  );
  const overrides = useAppSelector((s) => s.profileEdits.overrides);
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const access = useEffectiveAccess();
  // An unresolvable role (pre-login, demo links) falls open, matching how
  // `allows()` treats module permissions — the app must not lock itself out.
  // An unrestricted scope is treated the same way, so the overwhelmingly
  // common case keeps the identity fast path below.
  const dataScope =
    access.unresolved || isOpenScope(access.dataScope) ? null : access.dataScope;

  const branchView = options?.scope === false ? null : activeBranchId;
  const view = useMemo(() => {
    if (!bundle) return null;
    // Nothing to apply — return the bundle by identity so the common path
    // allocates nothing and every downstream memo holds.
    if (!branchView && !dataScope) return bundle;
    // Overrides are applied first: moving someone between branches is stored
    // as a profile edit, and reading the raw bundle here would keep them
    // filed at their old site — and inside the wrong role's scope.
    let next = applyBundleOverrides(bundle, overrides);
    if (dataScope) next = scopeBundleToAccess(next, dataScope, { employeeId });
    if (branchView) next = scopeBundleToBranch(next, branchView);
    return next;
  }, [bundle, branchView, dataScope, overrides, employeeId]);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  useEffect(() => {
    if (!bundle && status === "idle") {
      dispatch(loadLocale(country));
    }
  }, [bundle, status, country, dispatch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    if (!view) return;
    const delay = 300 + Math.floor(Math.random() * 300);
    const timer = setTimeout(() => {
      if (cancelled) return;
      try {
        setData(selectorRef.current(view));
      } finally {
        setLoading(false);
      }
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [view, country]);

  return { data, loading, error };
}

/**
 * `useLocaleSection` with branch scoping switched off — for screens that are
 * company-wide by nature. Files with many such reads alias it on import
 * (`import { useUnscopedLocaleSection as useLocaleSection }`) so the exemption
 * is stated once at the top rather than repeated at every call.
 */
export function useUnscopedLocaleSection<T>(
  selector: (bundle: LocaleBundle) => T,
): UseLocaleSectionResult<T> {
  return useLocaleSection(selector, { scope: false });
}
