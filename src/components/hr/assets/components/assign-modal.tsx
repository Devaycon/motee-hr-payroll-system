"use client";

import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { DEPARTMENT_OPTIONS, ASSET_CONDITION_LABELS } from "../data";
import type { Asset, AssetCondition } from "../types";

const assignSchema = z.object({
  employeeName: z.string().min(2, { message: "Employee name is required." }),
  employeeInitials: z
    .string()
    .min(1, { message: "Initials are required." })
    .max(3, { message: "Max 3 characters." }),
  department: z.string().min(1, { message: "Department is required." }),
  assignedDate: z.string().min(1, { message: "Assignment date is required." }),
});

type AssignForm = z.infer<typeof assignSchema>;
type AssignErrors = Partial<Record<keyof AssignForm, string>>;

const RETURN_CONDITIONS: AssetCondition[] = ["new", "good", "fair", "damaged"];

interface AssignModalProps {
  open: boolean;
  onClose: () => void;
  asset: Asset | null;
  mode: "assign" | "return";
  onAssign: (
    id: string,
    data: {
      employeeName: string;
      employeeInitials: string;
      department: string;
      assignedDate: string;
    },
  ) => void;
  onReturn: (id: string, condition: AssetCondition, notes?: string) => void;
}

function getInitialForm(): AssignForm {
  return {
    employeeName: "",
    employeeInitials: "",
    department: "",
    assignedDate: new Date().toISOString().split("T")[0],
  };
}

export function AssignModal({
  open,
  onClose,
  asset,
  mode,
  onAssign,
  onReturn,
}: AssignModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevAsset, setPrevAsset] = useState<Asset | null>(null);
  const [prevMode, setPrevMode] = useState<"assign" | "return">("assign");

  const [form, setForm] = useState<AssignForm>(getInitialForm());
  const [errors, setErrors] = useState<AssignErrors>({});
  const [returnCondition, setReturnCondition] =
    useState<AssetCondition>("good");
  const [returnNotes, setReturnNotes] = useState("");

  if (open !== prevOpen || asset !== prevAsset || mode !== prevMode) {
    setPrevOpen(open);
    setPrevAsset(asset);
    setPrevMode(mode);
    if (open) {
      setForm(getInitialForm());
      setErrors({});
      setReturnCondition("good");
      setReturnNotes("");
    }
  }

  function set<K extends keyof AssignForm>(key: K, value: AssignForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleAssign() {
    const result = assignSchema.safeParse(form);
    if (!result.success) {
      const errs: AssignErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof AssignForm;
        if (!errs[field]) errs[field] = issue.message;
      }
      setErrors(errs);
      return;
    }
    if (!asset) return;
    onAssign(asset.id, {
      employeeName: form.employeeName,
      employeeInitials: form.employeeInitials.toUpperCase(),
      department: form.department,
      assignedDate: form.assignedDate,
    });
  }

  function handleReturn() {
    if (!asset) return;
    onReturn(asset.id, returnCondition, returnNotes || undefined);
  }

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle>
            {mode === "assign" ? "Assign to Employee" : "Record Asset Return"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {asset.name}{" "}
            <span className="text-muted-foreground/60">
              · {asset.serialNumber}
            </span>
          </p>
        </DialogHeader>

        {mode === "assign" ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-6 pb-2">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="empName">Employee Name</Label>
              <Input
                id="empName"
                placeholder="e.g. Chukwuemeka Okonkwo"
                value={form.employeeName}
                onChange={(e) => set("employeeName", e.target.value)}
              />
              {errors.employeeName && (
                <p className="text-xs text-destructive">
                  {errors.employeeName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="empInitials">Initials</Label>
              <Input
                id="empInitials"
                placeholder="CO"
                maxLength={3}
                value={form.employeeInitials}
                onChange={(e) =>
                  set("employeeInitials", e.target.value.toUpperCase())
                }
              />
              {errors.employeeInitials && (
                <p className="text-xs text-destructive">
                  {errors.employeeInitials}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assignDate">Assigned Date</Label>
              <Input
                id="assignDate"
                type="date"
                value={form.assignedDate}
                onChange={(e) => set("assignedDate", e.target.value)}
              />
              {errors.assignedDate && (
                <p className="text-xs text-destructive">
                  {errors.assignedDate}
                </p>
              )}
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Department</Label>
              <Select
                value={form.department}
                onValueChange={(v) => set("department", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-xs text-destructive">{errors.department}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 px-6 pb-2">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium">{asset.name}</p>
              <p className="text-xs text-muted-foreground">
                Previously assigned to{" "}
                <span className="font-medium">{asset.assignedTo ?? "—"}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Condition on Return</Label>
              <Select
                value={returnCondition}
                onValueChange={(v) => setReturnCondition(v as AssetCondition)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {ASSET_CONDITION_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="returnNotes">Notes (optional)</Label>
              <Textarea
                id="returnNotes"
                placeholder="Any notes about the returned asset..."
                rows={3}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {mode === "assign" ? (
            <Button size="sm" onClick={handleAssign}>
              Assign Asset
            </Button>
          ) : (
            <Button size="sm" onClick={handleReturn}>
              Confirm Return
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
