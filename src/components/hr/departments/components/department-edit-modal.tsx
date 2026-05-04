"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/src/components/ui/textarea";
import type { Department, DepartmentStatus } from "../types";

interface DepartmentEditModalProps {
  open: boolean;
  onClose: () => void;
  editingDept: Department | null;
  onSave: (dept: Department) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function deptToForm(dept: Department | null) {
  if (!dept)
    return {
      name: "",
      code: "",
      head: "",
      description: "",
      budgetMonthly: "",
      status: "active" as DepartmentStatus,
    };
  return {
    name: dept.name,
    code: dept.code,
    head: dept.head ?? "",
    description: dept.description,
    budgetMonthly: dept.budgetMonthly ? String(dept.budgetMonthly) : "",
    status: dept.status,
  };
}

export function DepartmentEditModal({
  open,
  onClose,
  editingDept,
  onSave,
}: DepartmentEditModalProps) {
  const [form, setForm] = useState(() => deptToForm(editingDept));

  const set = (key: keyof ReturnType<typeof deptToForm>, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  function handleSave() {
    if (!form.name.trim() || !form.code.trim()) return;
    const budget = form.budgetMonthly
      ? parseInt(form.budgetMonthly, 10)
      : undefined;
    const headName = form.head.trim() || null;
    onSave({
      id: editingDept?.id ?? `dept-${Date.now()}`,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      head: headName,
      headInitials: headName ? getInitials(headName) : undefined,
      employeeCount: editingDept?.employeeCount ?? 0,
      openPositions: editingDept?.openPositions ?? 0,
      budgetMonthly: budget ?? undefined,
      status: form.status,
      description: form.description.trim(),
      createdAt:
        editingDept?.createdAt ??
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    });
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={() => setForm(deptToForm(editingDept))}
      >
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>
            Update the details for this department.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">
                Department Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Engineering"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. ENG"
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                className="h-8 text-sm"
                maxLength={6}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Department Head</Label>
            <Input
              placeholder="Full name of head"
              value={form.head}
              onChange={(e) => set("head", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Description</Label>
            <Textarea
              placeholder="Brief description of this department's function..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="text-sm resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Monthly Budget (₦)</Label>
              <Input
                type="number"
                placeholder="e.g. 2000000"
                value={form.budgetMonthly}
                onChange={(e) => set("budgetMonthly", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-sm">
                    Active
                  </SelectItem>
                  <SelectItem value="inactive" className="text-sm">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 flex-row gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={handleSave}
            disabled={!form.name.trim() || !form.code.trim()}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
