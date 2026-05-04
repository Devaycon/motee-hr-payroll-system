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
import { ALL_WORK_DAYS } from "../data";
import type { WorkSchedule, NewWorkSchedule, WorkDay } from "../types";

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  workDays: z
    .array(z.string())
    .min(1, { message: "Select at least one working day" }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  breakMinutes: z.coerce
    .number({ message: "Must be a number" })
    .min(0, { message: "Cannot be negative" }),
});

type FormValues = {
  name: string;
  workDays: string[];
  startTime: string;
  endTime: string;
  breakMinutes: string;
};

function getDefaults(schedule: WorkSchedule | null): FormValues {
  if (!schedule) {
    return {
      name: "",
      workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: "09:00",
      endTime: "18:00",
      breakMinutes: "60",
    };
  }
  return {
    name: schedule.name,
    workDays: schedule.workDays,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    breakMinutes: String(schedule.breakMinutes),
  };
}

function computeHours(start: string, end: string, breakMin: string): string {
  if (!start || !end) return "—";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const totalMins = eh * 60 + em - (sh * 60 + sm) - (Number(breakMin) || 0);
  if (totalMins <= 0) return "—";
  return `${Math.round((totalMins / 60) * 10) / 10}h/day`;
}

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  editingSchedule: WorkSchedule | null;
  onSave: (data: NewWorkSchedule) => void;
}

export function ScheduleModal({
  open,
  onClose,
  editingSchedule,
  onSave,
}: ScheduleModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevSchedule, setPrevSchedule] = useState<WorkSchedule | null>(null);
  const [form, setForm] = useState<FormValues>(() => getDefaults(null));
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues | "workDays", string>>
  >({});

  if (open !== prevOpen || editingSchedule !== prevSchedule) {
    setPrevOpen(open);
    setPrevSchedule(editingSchedule);
    if (open) {
      setForm(getDefaults(editingSchedule));
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
      workDays: result.data.workDays as WorkDay[],
      startTime: result.data.startTime,
      endTime: result.data.endTime,
      breakMinutes: result.data.breakMinutes,
    });
    onClose();
  }

  const dailyHours = computeHours(
    form.startTime,
    form.endTime,
    form.breakMinutes,
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editingSchedule ? "Edit Work Schedule" : "Add Work Schedule"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Schedule Name</Label>
            <Input
              className="h-8 text-xs"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Standard Office Hours"
            />
            {errors.name && (
              <p className="text-[10px] text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Working Days</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {ALL_WORK_DAYS.map((day) => (
                <div key={day} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`day-${day}`}
                    checked={form.workDays.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                    className="w-3.5 h-3.5"
                  />
                  <label
                    htmlFor={`day-${day}`}
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
              <p className="text-sm font-semibold text-primary">{dailyHours}</p>
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
            {editingSchedule ? "Save Changes" : "Add Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
