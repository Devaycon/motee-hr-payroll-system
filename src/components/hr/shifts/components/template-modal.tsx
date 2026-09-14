"use client";

import { z } from "zod/v4";
import { useState } from "react";
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
import { Checkbox } from "@/src/components/ui/checkbox";
import { cn } from "@/src/lib/utils";
import { shiftDurationHours } from "@/src/lib/types/shifts";
import type { NewShiftTemplate, ShiftTemplate } from "@/src/lib/types/shifts";

const ALL_WORK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const SWATCHES = [
  "#7F77DD",
  "#1D9E75",
  "#5B5FEF",
  "#D97706",
  "#DC2626",
  "#0EA5E9",
  "#DB2777",
];

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  workDays: z
    .array(z.string())
    .min(1, { message: "Select at least one applicable day" }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  breakMinutes: z.coerce
    .number({ message: "Must be a number" })
    .min(0, { message: "Cannot be negative" }),
  color: z.string().min(1),
});

type FormValues = {
  name: string;
  workDays: string[];
  startTime: string;
  endTime: string;
  breakMinutes: string;
  color: string;
};

function getDefaults(template: ShiftTemplate | null): FormValues {
  if (!template) {
    return {
      name: "",
      workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: "09:00",
      endTime: "17:00",
      breakMinutes: "30",
      color: SWATCHES[0],
    };
  }
  return {
    name: template.name,
    workDays: template.workDays,
    startTime: template.startTime,
    endTime: template.endTime,
    breakMinutes: String(template.breakMinutes),
    color: template.color,
  };
}

interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
  editingTemplate: ShiftTemplate | null;
  onSave: (data: NewShiftTemplate) => void;
}

export function TemplateModal({
  open,
  onClose,
  editingTemplate,
  onSave,
}: TemplateModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevTemplate, setPrevTemplate] = useState<ShiftTemplate | null>(null);
  const [form, setForm] = useState<FormValues>(() => getDefaults(null));
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});

  if (open !== prevOpen || editingTemplate !== prevTemplate) {
    setPrevOpen(open);
    setPrevTemplate(editingTemplate);
    if (open) {
      setForm(getDefaults(editingTemplate));
      setErrors({});
    }
  }

  function toggleDay(day: string) {
    setForm((f) => {
      const next = f.workDays.includes(day)
        ? f.workDays.filter((d) => d !== day)
        : [...f.workDays, day];
      return { ...f, workDays: next };
    });
    if (errors.workDays) setErrors((e) => ({ ...e, workDays: undefined }));
  }

  function update(field: keyof Omit<FormValues, "workDays">, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleSubmit() {
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FormValues;
        if (key) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onSave({
      name: result.data.name,
      workDays: result.data.workDays as ShiftTemplate["workDays"],
      startTime: result.data.startTime,
      endTime: result.data.endTime,
      breakMinutes: result.data.breakMinutes,
      color: result.data.color,
    });
    onClose();
  }

  const preview = shiftDurationHours({
    ...editingTemplate,
    id: "preview",
    createdAt: "",
    name: form.name,
    startTime: form.startTime,
    endTime: form.endTime,
    breakMinutes: Number(form.breakMinutes) || 0,
    color: form.color,
    workDays: form.workDays as ShiftTemplate["workDays"],
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editingTemplate ? "Edit Shift Template" : "Add Shift Template"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Shift Name</Label>
            <Input
              className="h-8 text-xs"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Morning Shift"
            />
            {errors.name && (
              <p className="text-[10px] text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Color</Label>
            <div className="flex items-center gap-2">
              {SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => update("color", swatch)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-transform",
                    form.color === swatch
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Choose ${swatch}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Applies To</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {ALL_WORK_DAYS.map((day) => (
                <div key={day} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`shift-day-${day}`}
                    checked={form.workDays.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                    className="w-3.5 h-3.5"
                  />
                  <label
                    htmlFor={`shift-day-${day}`}
                    className="text-xs cursor-pointer select-none"
                  >
                    {day}
                  </label>
                </div>
              ))}
            </div>
            {errors.workDays && (
              <p className="text-[10px] text-destructive">{errors.workDays}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Time</Label>
              <Input
                type="time"
                className="h-8 text-xs"
                value={form.startTime}
                onChange={(e) => update("startTime", e.target.value)}
              />
              {errors.startTime && (
                <p className="text-[10px] text-destructive">
                  {errors.startTime}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">End Time</Label>
              <Input
                type="time"
                className="h-8 text-xs"
                value={form.endTime}
                onChange={(e) => update("endTime", e.target.value)}
              />
              {errors.endTime && (
                <p className="text-[10px] text-destructive">{errors.endTime}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Break (minutes)</Label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={form.breakMinutes}
                onChange={(e) => update("breakMinutes", e.target.value)}
                min={0}
              />
              {errors.breakMinutes && (
                <p className="text-[10px] text-destructive">
                  {errors.breakMinutes}
                </p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">Daily Hours</p>
              <p className="text-sm font-semibold text-primary">
                {preview}h/day
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button size="sm" className="text-xs h-8" onClick={handleSubmit}>
            {editingTemplate ? "Save Changes" : "Add Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
