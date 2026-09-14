"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
// Unscoped: assignable stock is a company-wide pool, not a per-branch one.
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { addRecord } from "@/src/lib/stores/collection-edits-slice";
import { COLLECTION_SCHEMAS } from "@/src/lib/profile/collections";
import type { RawAsset } from "./hooks";

const CONDITION_OPTIONS = ["excellent", "good", "fair", "poor"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Assigns an existing unassigned asset to the employee whose profile we're on.
 * Mirrors the main assets-page assign modal (asset dropdown + condition + date)
 * but omits the employee field — we're already in this employee's context.
 */
export function AssignAssetModal({
  open,
  onClose,
  employeeId,
}: {
  open: boolean;
  onClose: () => void;
  employeeId: string;
}) {
  const dispatch = useAppDispatch();
  const { data: allAssets } = useLocaleSection<RawAsset[]>(
    (b) => (b.assets as unknown as RawAsset[]) ?? [],
  );

  const unassigned = useMemo(
    () => (allAssets ?? []).filter((a) => !a.assignedTo),
    [allAssets],
  );

  const [assetId, setAssetId] = useState("");
  const [condition, setCondition] = useState("good");
  const [assignedDate, setAssignedDate] = useState(today());
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setAssetId("");
      setCondition("good");
      setAssignedDate(today());
    }
  }

  const selected = unassigned.find((a) => a.id === assetId) ?? null;

  function handleAssign() {
    if (!selected) {
      toast.error("Please select an asset.");
      return;
    }
    const base = COLLECTION_SCHEMAS.assets.defaults?.(employeeId) ?? {};
    dispatch(
      addRecord({
        key: "assets",
        record: {
          ...base,
          id: `AST-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          assetTag: selected.assetTag,
          name: selected.name,
          category: selected.category,
          serialNumber: selected.serialNumber ?? "",
          value: selected.value ?? 0,
          condition,
          assignedDate,
          assignedTo: employeeId,
          status: "in_use",
        },
      }),
    );
    toast.success(`${selected.name} assigned`);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Assign Asset</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label>Asset</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an available asset" />
              </SelectTrigger>
              <SelectContent>
                {unassigned.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No unassigned assets available.
                  </div>
                ) : (
                  unassigned.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                      {a.serialNumber ? ` · ${a.serialNumber}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Assigned Date</Label>
            <Input
              type="date"
              value={assignedDate}
              onChange={(e) => setAssignedDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selected}>
            Assign Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
