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
import {
  ASSET_TYPE_OPTIONS,
  ASSET_TYPE_LABELS,
  ASSET_CONDITION_LABELS,
  DEPARTMENT_OPTIONS,
} from "../data";
import type {
  Asset,
  AssetType,
  AssetCondition,
  AssetStatus,
  NewAsset,
} from "../types";

const assetSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  assetType: z.enum(
    [
      "laptop",
      "desktop",
      "monitor",
      "phone",
      "tablet",
      "printer",
      "keyboard",
      "mouse",
      "headset",
      "camera",
      "other",
    ],
    { message: "Asset type is required." },
  ),
  serialNumber: z
    .string()
    .min(3, { message: "Serial number must be at least 3 characters." }),
  condition: z.enum(["new", "good", "fair", "damaged", "decommissioned"], {
    message: "Condition is required.",
  }),
  status: z.enum(
    ["assigned", "available", "under_maintenance", "decommissioned"],
    {
      message: "Status is required.",
    },
  ),
  conditionNotes: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseValue: z.coerce
    .number()
    .positive({ message: "Value must be a positive number." })
    .optional()
    .or(z.literal("")),
  assignedTo: z.string().optional(),
  assignedToInitials: z
    .string()
    .max(3, { message: "Initials max 3 characters." })
    .optional(),
  assignedToDepartment: z.string().optional(),
  assignedDate: z.string().optional(),
});

type FormData = z.infer<typeof assetSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

function getInitial(asset: Asset | null): FormData {
  if (!asset) {
    return {
      name: "",
      assetType: "laptop",
      serialNumber: "",
      condition: "new",
      status: "available",
      conditionNotes: "",
      purchaseDate: "",
      purchaseValue: "",
      assignedTo: "",
      assignedToInitials: "",
      assignedToDepartment: "",
      assignedDate: "",
    };
  }
  return {
    name: asset.name,
    assetType: asset.assetType,
    serialNumber: asset.serialNumber,
    condition: asset.condition,
    status: asset.status,
    conditionNotes: asset.conditionNotes ?? "",
    purchaseDate: asset.purchaseDate ?? "",
    purchaseValue: asset.purchaseValue ?? "",
    assignedTo: asset.assignedTo ?? "",
    assignedToInitials: asset.assignedToInitials ?? "",
    assignedToDepartment: asset.assignedToDepartment ?? "",
    assignedDate: asset.assignedDate ?? "",
  };
}

interface AssetFormModalProps {
  open: boolean;
  onClose: () => void;
  editingAsset: Asset | null;
  onSave: (data: NewAsset) => void;
}

export function AssetFormModal({
  open,
  onClose,
  editingAsset,
  onSave,
}: AssetFormModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevAsset, setPrevAsset] = useState<Asset | null>(null);
  const [form, setForm] = useState<FormData>(getInitial(null));
  const [errors, setErrors] = useState<FormErrors>({});

  if (open !== prevOpen || editingAsset !== prevAsset) {
    setPrevOpen(open);
    setPrevAsset(editingAsset);
    if (open) {
      setForm(getInitial(editingAsset));
      setErrors({});
    }
  }

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit() {
    const result = assetSchema.safeParse(form);
    if (!result.success) {
      const errs: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormData;
        if (!errs[field]) errs[field] = issue.message;
      }
      setErrors(errs);
      return;
    }
    const d = result.data;
    const payload: NewAsset = {
      name: d.name,
      assetType: d.assetType as AssetType,
      serialNumber: d.serialNumber,
      condition: d.condition as AssetCondition,
      status: d.status as AssetStatus,
      conditionNotes: d.conditionNotes || undefined,
      purchaseDate: d.purchaseDate || undefined,
      purchaseValue: d.purchaseValue ? Number(d.purchaseValue) : undefined,
      ...(d.status === "assigned"
        ? {
            assignedTo: d.assignedTo || undefined,
            assignedToInitials:
              d.assignedToInitials?.toUpperCase() || undefined,
            assignedToDepartment: d.assignedToDepartment || undefined,
            assignedDate: d.assignedDate || undefined,
          }
        : {}),
    };
    onSave(payload);
  }

  const isAssigned = form.status === "assigned";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle>{editingAsset ? "Edit Asset" : "Add Asset"}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 pb-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Asset Name</Label>
              <Input
                id="name"
                placeholder="e.g. MacBook Pro 16-inch"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Asset Type</Label>
              <Select
                value={form.assetType}
                onValueChange={(v) => set("assetType", v as AssetType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ASSET_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assetType && (
                <p className="text-xs text-destructive">{errors.assetType}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="serial">Serial Number</Label>
              <Input
                id="serial"
                placeholder="e.g. C02ZW3MDLVDQ"
                value={form.serialNumber}
                onChange={(e) => set("serialNumber", e.target.value)}
              />
              {errors.serialNumber && (
                <p className="text-xs text-destructive">
                  {errors.serialNumber}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select
                value={form.condition}
                onValueChange={(v) => set("condition", v as AssetCondition)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "new",
                      "good",
                      "fair",
                      "damaged",
                      "decommissioned",
                    ] as AssetCondition[]
                  ).map((c) => (
                    <SelectItem key={c} value={c}>
                      {ASSET_CONDITION_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.condition && (
                <p className="text-xs text-destructive">{errors.condition}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as AssetStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "assigned",
                      "available",
                      "under_maintenance",
                      "decommissioned",
                    ] as AssetStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "assigned"
                        ? "Assigned"
                        : s === "available"
                          ? "Available"
                          : s === "under_maintenance"
                            ? "Under Maintenance"
                            : "Decommissioned"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={form.purchaseDate}
                onChange={(e) => set("purchaseDate", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchaseValue">Purchase Value (₦)</Label>
              <Input
                id="purchaseValue"
                type="number"
                placeholder="e.g. 2800000"
                value={form.purchaseValue}
                onChange={(e) =>
                  set("purchaseValue", e.target.value as unknown as number)
                }
              />
              {errors.purchaseValue && (
                <p className="text-xs text-destructive">
                  {errors.purchaseValue}
                </p>
              )}
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="conditionNotes">Condition Notes</Label>
              <Textarea
                id="conditionNotes"
                placeholder="Optional notes about condition..."
                rows={2}
                value={form.conditionNotes}
                onChange={(e) => set("conditionNotes", e.target.value)}
              />
            </div>

            {isAssigned && (
              <>
                <div className="col-span-2">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Assignment Details
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assignedTo">Employee Name</Label>
                  <Input
                    id="assignedTo"
                    placeholder="e.g. Chukwuemeka Okonkwo"
                    value={form.assignedTo}
                    onChange={(e) => set("assignedTo", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="initials">Initials (max 3)</Label>
                  <Input
                    id="initials"
                    placeholder="e.g. CO"
                    maxLength={3}
                    value={form.assignedToInitials}
                    onChange={(e) =>
                      set("assignedToInitials", e.target.value.toUpperCase())
                    }
                  />
                  {errors.assignedToInitials && (
                    <p className="text-xs text-destructive">
                      {errors.assignedToInitials}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select
                    value={form.assignedToDepartment}
                    onValueChange={(v) => set("assignedToDepartment", v)}
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
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assignedDate">Assigned Date</Label>
                  <Input
                    id="assignedDate"
                    type="date"
                    value={form.assignedDate}
                    onChange={(e) => set("assignedDate", e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            {editingAsset ? "Save Changes" : "Add Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
