"use client";

import { ScanEye, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { exitPreview } from "@/src/lib/stores/access-levels-slice";
import { usePreviewedLevel } from "@/src/lib/permissions/use-can";

/**
 * §1.10 — the persistent reminder that the app is lying to you on purpose.
 *
 * The banner is deliberately blunt about the limit of the preview: it changes
 * what the UI *shows*, not who you are. A preview that silently swallowed
 * writes, or one that let an admin forget they were in it, would be worse than
 * no preview at all.
 */
export function RolePreviewBanner() {
  const dispatch = useAppDispatch();
  const level = usePreviewedLevel();

  if (!level) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-700 dark:text-amber-400"
    >
      <ScanEye className="h-4 w-4 shrink-0" aria-hidden />
      <p className="text-xs font-medium">
        Previewing as{" "}
        <span className="font-semibold">{level.name}</span>
      </p>
      <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
        The sidebar and page actions show what this role sees. Anything you
        change is still recorded as you.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="ml-auto h-7 gap-1 border-amber-500/40 bg-transparent text-[11px] text-amber-700 hover:bg-amber-500/15 dark:text-amber-400"
        onClick={() => dispatch(exitPreview())}
      >
        <X className="h-3 w-3" />
        Exit preview
      </Button>
    </div>
  );
}
