"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { EmployeePicker } from "@/src/components/shared/employee-picker";
import { cn } from "@/src/lib/utils";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { BRANCH_KIND_OPTIONS, BRANCH_STATUS_OPTIONS, suggestBranchCode } from "../data";
import type { Branch, BranchKind, BranchStatus, LocaleBranch } from "../types";

interface BranchFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Null creates; a branch edits it in place. */
  editing: Branch | null;
  /** Codes already in use, so the form can reject a duplicate before saving. */
  takenCodes: string[];
  onCreate: (branch: LocaleBranch) => void;
  onUpdate: (id: string, patch: Partial<LocaleBranch>) => void;
  nextId: () => string;
}

interface FormState {
  name: string;
  code: string;
  kind: BranchKind;
  status: BranchStatus;
  addressLines: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  managerEmployeeId: string;
  headcountTarget: string;
  openedAt: string;
}

const EMPTY: FormState = {
  name: "",
  code: "",
  kind: "branch",
  status: "active",
  addressLines: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  phone: "",
  email: "",
  managerEmployeeId: "",
  headcountTarget: "",
  openedAt: "",
};

export function BranchFormModal({
  open,
  onClose,
  editing,
  takenCodes,
  onCreate,
  onUpdate,
  nextId,
}: BranchFormModalProps) {
  const tenant = useAppSelector((s) => s.locale.data?.tenant);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // Once the user edits the code by hand, stop overwriting it from the city.
  const [codeDirty, setCodeDirty] = useState(false);

  // Reseed from the record whenever the modal opens. Adjusted during render
  // rather than in an effect — the same pattern the shared profile-field
  // editor uses, and it avoids a cascading re-render.
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTouched({});
      setCodeDirty(Boolean(editing));
      setForm(
        editing
          ? {
              name: editing.name,
              code: editing.code,
              kind: editing.kind,
              status: editing.status,
              addressLines: (editing.addressLines ?? []).join("\n"),
              city: editing.city,
              region: editing.region ?? "",
              postalCode: editing.postalCode ?? "",
              country: editing.country,
              phone: editing.phone ?? "",
              email: editing.email ?? "",
              managerEmployeeId: editing.managerEmployeeId ?? "",
              headcountTarget: String(editing.headcountTarget ?? ""),
              openedAt: editing.openedAt ?? "",
            }
          : { ...EMPTY, country: tenant?.country ?? "" },
      );
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const duplicateCode =
    form.code.trim().length > 0 &&
    takenCodes.some(
      (c) =>
        c.toLowerCase() === form.code.trim().toLowerCase() &&
        c.toLowerCase() !== editing?.code.toLowerCase(),
    );

  const errors: Record<string, string | null> = {
    name: form.name.trim().length < 2 ? "Give the branch a name" : null,
    code: !form.code.trim()
      ? "A short code is required"
      : duplicateCode
        ? "That code is already used by another branch"
        : null,
    city: !form.city.trim() ? "City is required" : null,
    country: !form.country.trim() ? "Country is required" : null,
  };
  const errorFor = (key: string) => (touched[key] ? errors[key] : null);
  const valid = Object.values(errors).every((e) => !e);

  function handleSubmit() {
    setTouched({ name: true, code: true, city: true, country: true });
    if (!valid) return;

    const shared = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      kind: form.kind,
      status: form.status,
      addressLines: form.addressLines
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      city: form.city.trim(),
      region: form.region.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      managerEmployeeId: form.managerEmployeeId || null,
      headcountTarget: Number(form.headcountTarget) || 0,
      openedAt: form.openedAt,
    };

    if (editing) {
      onUpdate(editing.id, shared);
      toast.success(`${shared.name} updated`);
    } else {
      onCreate({
        id: nextId(),
        tenantId: tenant?.id ?? "",
        timezone: tenant?.timezone ?? "",
        ...shared,
      });
      toast.success(`${shared.name} created`);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit branch" : "Add branch"}</DialogTitle>
          <DialogDescription>
            Branches are where your people are posted. Employees are assigned to
            one on their record, and the navbar switcher scopes the app to it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 grid gap-1.5">
            <Label className="text-xs">
              Branch name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              placeholder="e.g. Abuja Office"
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              className={cn("h-9", errorFor("name") && "border-destructive")}
            />
            {errorFor("name") && (
              <p className="text-[11px] text-destructive">{errorFor("name")}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.city}
              placeholder="e.g. Abuja"
              onChange={(e) => {
                set("city", e.target.value);
                if (!codeDirty) set("code", suggestBranchCode(e.target.value));
              }}
              onBlur={() => setTouched((t) => ({ ...t, city: true }))}
              className={cn("h-9", errorFor("city") && "border-destructive")}
            />
            {errorFor("city") && (
              <p className="text-[11px] text-destructive">{errorFor("city")}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.code}
              placeholder="e.g. ABU"
              onChange={(e) => {
                setCodeDirty(true);
                set("code", e.target.value.toUpperCase());
              }}
              onBlur={() => setTouched((t) => ({ ...t, code: true }))}
              className={cn("h-9", errorFor("code") && "border-destructive")}
            />
            {errorFor("code") && (
              <p className="text-[11px] text-destructive">{errorFor("code")}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Type</Label>
            <Select
              value={form.kind}
              onValueChange={(v) => set("kind", v as BranchKind)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BRANCH_KIND_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v as BranchStatus)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BRANCH_STATUS_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 grid gap-1.5">
            <Label className="text-xs">Address</Label>
            <Input
              value={form.addressLines}
              placeholder="Street address"
              onChange={(e) => set("addressLines", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Region / State</Label>
            <Input
              value={form.region}
              onChange={(e) => set("region", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Postal code</Label>
            <Input
              value={form.postalCode}
              onChange={(e) => set("postalCode", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">
              Country <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, country: true }))}
              className={cn("h-9", errorFor("country") && "border-destructive")}
            />
            {errorFor("country") && (
              <p className="text-[11px] text-destructive">
                {errorFor("country")}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Opened on</Label>
            <Input
              type="date"
              value={form.openedAt}
              onChange={(e) => set("openedAt", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Branch head</Label>
            <EmployeePicker
              value={form.managerEmployeeId || undefined}
              onChange={(emp) => set("managerEmployeeId", emp?.id ?? "")}
              placeholder="Search for a colleague…"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Headcount target</Label>
            <Input
              type="number"
              min={0}
              value={form.headcountTarget}
              onChange={(e) => set("headcountTarget", e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editing ? "Save changes" : "Create branch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
