"use client";

import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import { cn } from "@/src/lib/utils";
import type {
  ChecklistItem,
  NewChecklistItem,
  ResponsibleParty,
  DueDateRule,
} from "../types";

interface ChecklistItemModalProps {
  open: boolean;
  onClose: () => void;
  editingItem: ChecklistItem | null;
  nextOrder: number;
  onSave: (data: NewChecklistItem | ChecklistItem) => void;
}

const formSchema = z.object({
  taskName: z
    .string()
    .min(2, "Task name must be at least 2 characters")
    .max(100, "Task name must be at most 100 characters"),
  responsibleParty: z.enum(["hr", "manager", "employee", "it"], {
    message: "Please select a responsible party",
  }),
  dueDateRule: z.enum(["before_start", "on_start", "after_start"], {
    message: "Please select a due date rule",
  }),
});

type FormFields = keyof z.infer<typeof formSchema>;
type FieldErrors = Partial<Record<FormFields, string>>;

const EMPTY: {
  taskName: string;
  responsibleParty: ResponsibleParty;
  dueDateOffset: number;
  dueDateRule: DueDateRule;
  isRequired: boolean;
  description: string;
} = {
  taskName: "",
  responsibleParty: "hr",
  dueDateOffset: 0,
  dueDateRule: "on_start",
  isRequired: true,
  description: "",
};

export function ChecklistItemModal({
  open,
  onClose,
  editingItem,
  onSave,
}: ChecklistItemModalProps) {
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FormFields, boolean>>>(
    {},
  );

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      if (editingItem) {
        setForm({
          taskName: editingItem.taskName,
          responsibleParty: editingItem.responsibleParty,
          dueDateOffset: editingItem.dueDateOffset,
          dueDateRule: editingItem.dueDateRule,
          isRequired: editingItem.isRequired,
          description: editingItem.description,
        });
      } else {
        setForm({ ...EMPTY });
      }
      setErrors({});
      setTouched({});
    }
  }

  function handleClose() {
    setErrors({});
    setTouched({});
    onClose();
  }

  function setField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in formSchema.shape) {
      const result = formSchema.shape[key as FormFields].safeParse(value);
      setErrors((prev) => ({
        ...prev,
        [key]: result.success ? undefined : result.error.issues[0]?.message,
      }));
    }
  }

  function touch(field: FormFields) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const result = formSchema.shape[field].safeParse(
      form[field as keyof typeof form],
    );
    setErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  }

  function fieldError(field: FormFields) {
    return touched[field] && errors[field] ? errors[field] : undefined;
  }

  function handleSave() {
    const result = formSchema.safeParse({
      taskName: form.taskName,
      responsibleParty: form.responsibleParty,
      dueDateRule: form.dueDateRule,
    });
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((e) => {
        const key = e.path[0];
        if (key) fieldErrors[key as FormFields] = e.message;
      });
      setErrors(fieldErrors);
      setTouched({
        taskName: true,
        responsibleParty: true,
        dueDateRule: true,
      });
      return;
    }
    if (editingItem) {
      onSave({
        ...editingItem,
        taskName: form.taskName,
        responsibleParty: form.responsibleParty,
        dueDateOffset: form.dueDateOffset,
        dueDateRule: form.dueDateRule,
        isRequired: form.isRequired,
        description: form.description,
      });
    } else {
      onSave({
        title: form.taskName,
        taskName: form.taskName,
        responsibleParty: form.responsibleParty,
        dueDateOffset: form.dueDateOffset,
        dueDateRule: form.dueDateRule,
        isRequired: form.isRequired,
        description: form.description,
        category: "general",
      });
    }
    handleClose();
  }

  const showOffset = form.dueDateRule !== "on_start";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {editingItem ? "Edit Checklist Item" : "New Checklist Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">
              Task Name <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. Complete Offer Letter & Contract"
              value={form.taskName}
              onChange={(e) => setField("taskName", e.target.value)}
              onBlur={() => touch("taskName")}
              className={cn(
                "h-8 text-sm",
                fieldError("taskName") &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {fieldError("taskName") && (
              <p className="text-[11px] text-destructive">
                {fieldError("taskName")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Responsible Party <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.responsibleParty}
              onValueChange={(v) => {
                setField("responsibleParty", v as ResponsibleParty);
                touch("responsibleParty");
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-8 text-sm",
                  fieldError("responsibleParty") && "border-destructive",
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hr" className="text-xs">
                  HR
                </SelectItem>
                <SelectItem value="manager" className="text-xs">
                  Manager
                </SelectItem>
                <SelectItem value="employee" className="text-xs">
                  Employee
                </SelectItem>
                <SelectItem value="it" className="text-xs">
                  IT
                </SelectItem>
              </SelectContent>
            </Select>
            {fieldError("responsibleParty") && (
              <p className="text-[11px] text-destructive">
                {fieldError("responsibleParty")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Due Date Rule <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.dueDateRule}
                onValueChange={(v) => {
                  setField("dueDateRule", v as DueDateRule);
                  touch("dueDateRule");
                  if (v === "on_start") setField("dueDateOffset", 0);
                }}
              >
                <SelectTrigger
                  className={cn(
                    "h-8 text-sm",
                    fieldError("dueDateRule") && "border-destructive",
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before_start" className="text-xs">
                    Before start
                  </SelectItem>
                  <SelectItem value="on_start" className="text-xs">
                    On start day
                  </SelectItem>
                  <SelectItem value="after_start" className="text-xs">
                    After start
                  </SelectItem>
                </SelectContent>
              </Select>
              {fieldError("dueDateRule") && (
                <p className="text-[11px] text-destructive">
                  {fieldError("dueDateRule")}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Days Offset{" "}
                {!showOffset && (
                  <span className="text-muted-foreground">(N/A)</span>
                )}
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={showOffset ? form.dueDateOffset : 0}
                onChange={(e) =>
                  setField("dueDateOffset", Number(e.target.value))
                }
                disabled={!showOffset}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-foreground">
                Required Task
              </p>
              <p className="text-[11px] text-muted-foreground">
                Mark as required for all new hires
              </p>
            </div>
            <Switch
              checked={form.isRequired}
              onCheckedChange={(v) => setField("isRequired", v)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              placeholder="Add a brief description of this task..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              className="text-sm resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button size="sm" className="text-xs h-8" onClick={handleSave}>
            {editingItem ? "Save Changes" : "Add Item"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
