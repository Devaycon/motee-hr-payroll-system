"use client";

import { useMemo, useState } from "react";
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
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import { DEPARTMENT_OPTIONS, ASSET_CONDITION_LABELS } from "../data";
import type { Asset, AssetCondition } from "../types";

/**
 * Live employee search: shows matching employees in a dropdown as the user
 * types, and fills the assignment form (name + initials + department) on pick.
 */
function EmployeeSearch({
  value,
  onChange,
  onPick,
}: {
  value: string;
  onChange: (name: string) => void;
  onPick: (emp: LocaleEmployee) => void;
}) {
  const { data: employees } = useLocaleSection((b) => b.employees);
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return (employees ?? [])
      .filter((e) => e.fullName.toLowerCase().includes(q))
      .slice(0, 8);
  }, [employees, value]);

  return (
    <div className="relative">
      <Input
        id="empName"
        placeholder="Search employee by name…"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && matches.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover shadow-md">
          {matches.map((e) => (
            <button
              type="button"
              key={e.id}
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => {
                onPick(e);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <span className="truncate">{e.fullName}</span>
              <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                {e.departmentName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  /**
   * When the modal is opened without a preselected `asset` (e.g. the page-level
   * "Assign Asset" button), these unassigned assets are offered in a picker.
   */
  availableAssets?: Asset[];
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
  availableAssets,
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
  // Used only when no `asset` is preselected — the page-level assign flow.
  const [selectedAssetId, setSelectedAssetId] = useState("");

  if (open !== prevOpen || asset !== prevAsset || mode !== prevMode) {
    setPrevOpen(open);
    setPrevAsset(asset);
    setPrevMode(mode);
    if (open) {
      setForm(getInitialForm());
      setErrors({});
      setReturnCondition("good");
      setReturnNotes("");
      setSelectedAssetId("");
    }
  }

  // The asset being acted on: the preselected one, or the picked one.
  const activeAsset =
    asset ?? availableAssets?.find((a) => a.id === selectedAssetId) ?? null;

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
    if (!activeAsset) return;
    onAssign(activeAsset.id, {
      employeeName: form.employeeName,
      employeeInitials: form.employeeInitials.toUpperCase(),
      department: form.department,
      assignedDate: form.assignedDate,
    });
  }

  function handleReturn() {
    if (!activeAsset) return;
    onReturn(activeAsset.id, returnCondition, returnNotes || undefined);
  }

  // Render when we have a target asset, or (assign mode) a picker to choose one.
  const showPicker = mode === "assign" && !asset && Boolean(availableAssets);
  if (!activeAsset && !showPicker) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle>
            {mode === "assign" ? "Assign to Employee" : "Record Asset Return"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {activeAsset ? (
              <>
                {activeAsset.name}{" "}
                <span className="text-muted-foreground/60">
                  · {activeAsset.serialNumber}
                </span>
              </>
            ) : (
              "Select an asset to assign."
            )}
          </p>
        </DialogHeader>

        {mode === "assign" ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-6 pb-2">
            {showPicker && (
              <div className="col-span-2 space-y-1.5">
                <Label>Asset</Label>
                <Select
                  value={selectedAssetId}
                  onValueChange={setSelectedAssetId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an available asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {(availableAssets ?? []).length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        No unassigned assets available.
                      </div>
                    ) : (
                      (availableAssets ?? []).map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} · {a.serialNumber}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="empName">Employee Name</Label>
              <EmployeeSearch
                value={form.employeeName}
                onChange={(name) => set("employeeName", name)}
                onPick={(emp) => {
                  setForm((prev) => ({
                    ...prev,
                    employeeName: emp.fullName,
                    employeeInitials: emp.initials,
                    department: emp.departmentName,
                  }));
                  setErrors({});
                }}
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
              <p className="font-medium">{activeAsset?.name}</p>
              <p className="text-xs text-muted-foreground">
                Previously assigned to{" "}
                <span className="font-medium">
                  {activeAsset?.assignedTo ?? "—"}
                </span>
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
            <Button size="sm" onClick={handleAssign} disabled={!activeAsset}>
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
