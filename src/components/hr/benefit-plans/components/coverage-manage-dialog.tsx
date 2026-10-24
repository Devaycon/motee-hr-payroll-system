"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  addCoverageOption,
  removeCoverageOption,
  renameCoverageOption,
} from "@/src/lib/stores/benefit-plans-slice";

/** HR's list of coverage levels (Employee Only, Family Cover…) behind "Manage". */
export function CoverageManageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dispatch = useAppDispatch();
  const options = useAppSelector((s) => s.benefitPlans.coverageOptions);
  const plans = useAppSelector((s) => s.benefitPlans.plans);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const usage = (label: string) => plans.filter((p) => p.coverage === label).length;
  const duplicate = options.some((o) => o.toLowerCase() === draft.trim().toLowerCase());

  function add() {
    if (!draft.trim() || duplicate) return;
    dispatch(addCoverageOption(draft));
    setDraft("");
  }

  function saveRename() {
    if (editing && editValue.trim()) {
      dispatch(renameCoverageOption({ from: editing, to: editValue }));
    }
    setEditing(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Manage coverage</DialogTitle>
          <DialogDescription className="text-xs">
            The coverage levels HR can pick on a benefit plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          {options.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No coverage levels yet.
            </p>
          )}
          {options.map((o) => (
            <div
              key={o}
              className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5"
            >
              {editing === o ? (
                <>
                  <Input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveRename()}
                    className="h-7 text-xs"
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveRename}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditing(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{o}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {usage(o)} plan{usage(o) === 1 ? "" : "s"}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditing(o);
                      setEditValue(o);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    title={usage(o) > 0 ? "Plans on this level will be left without coverage" : undefined}
                    onClick={() => dispatch(removeCoverageOption(o))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-3">
          <Input
            placeholder="e.g. Employee + Children"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            className="h-8 text-sm"
          />
          <Button size="sm" className="h-8 gap-1 text-xs" disabled={!draft.trim() || duplicate} onClick={add}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        {duplicate && draft.trim() && (
          <p className="-mt-2 text-[11px] text-destructive">That coverage level already exists.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
