"use client";

import { useEffect } from "react";
import { Building2, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  useActiveBranch,
  useBranchHeadcounts,
} from "@/src/lib/branches/use-branch";

/**
 * The persistent reminder that every figure on screen is one site's, not the
 * company's — and the only way back out.
 *
 * Scope is set from the Branches page ("Scope app to this branch"), so without
 * this strip a narrowed view would have no visible cause and no exit. It sits
 * under the navbar in the admin shell for the same reason `RolePreviewBanner`
 * does: it has to hold on every page, not just the one it was started from.
 */
export function BranchScopeBanner() {
  const { branch, setBranch } = useActiveBranch();
  const headcounts = useBranchHeadcounts();
  const savedBranchId = useAppSelector((s) => s.branch.activeBranchId);

  // The selection is restored from localStorage before the tenant is known, so
  // it can name a branch this tenant does not have. Reads already ignore an
  // unresolvable id; clearing it here stops the dead value coming back to life
  // if the user later switches to the tenant it belonged to.
  //
  // This lived on the navbar's branch switcher until that came off the bar.
  // It has to run even when the banner renders nothing, hence above the early
  // return.
  useEffect(() => {
    if (savedBranchId && !branch) setBranch(null);
  }, [savedBranchId, branch, setBranch]);

  if (!branch) return null;

  const here = headcounts[branch.id] ?? 0;
  const total = Object.values(headcounts).reduce((sum, n) => sum + n, 0);

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-primary/30 bg-primary/10 px-4 py-2 text-primary"
    >
      <Building2 className="h-4 w-4 shrink-0" aria-hidden />
      <p className="text-xs font-medium">
        Showing <span className="font-semibold">{branch.name}</span> only
      </p>
      <p className="text-[11px] text-primary/80">
        {here} of {total} people — every list, chart and total on this page is
        limited to this branch.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="ml-auto h-7 gap-1 border-primary/40 bg-transparent text-[11px] text-primary hover:bg-primary/15"
        onClick={() => setBranch(null)}
      >
        <X className="h-3 w-3" />
        All branches
      </Button>
    </div>
  );
}
