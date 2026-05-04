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
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { DEPARTMENT_OPTIONS } from "../data";
import type {
  AttendanceRecord,
  NewAttendanceRecord,
  AttendanceStatus,
} from "../types";

const schema = z.object({
  employeeName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" }),
  employeeInitials: z
    .string()
    .min(1, { message: "Initials are required" })
    .max(3, { message: "Max 3 characters" }),
  department: z.string().min(1, { message: "Department is required" }),
  jobTitle: z.string().min(1, { message: "Job title is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  status: z.string().min(1, { message: "Status is required" }),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  breakMinutes: z.coerce
    .number({ message: "Must be a number" })
    .min(0, { message: "Cannot be negative" }),
  notes: z.string().optional(),
  location: z.string().optional(),
});

type FormValues = {
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  date: string;
  status: string;
  clockIn: string;
  clockOut: string;
  breakMinutes: string;
  notes: string;
  location: string;
};

function getDefaults(record: AttendanceRecord | null): FormValues {
  if (!record) {
    return {
      employeeName: "",
      employeeInitials: "",
      department: "",
      jobTitle: "",
      date: new Date().toISOString().slice(0, 10),
      status: "present",
      clockIn: "",
      clockOut: "",
      breakMinutes: "60",
      notes: "",
      location: "",
    };
  }
  return {
    employeeName: record.employeeName,
    employeeInitials: record.employeeInitials,
    department: record.department,
    jobTitle: record.jobTitle,
    date: record.date,
    status: record.status,
    clockIn: record.clockIn ?? "",
    clockOut: record.clockOut ?? "",
    breakMinutes: String(record.breakMinutes),
    notes: record.notes ?? "",
    location: record.location ?? "",
  };
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

interface LogModalProps {
  open: boolean;
  onClose: () => void;
  editingRecord: AttendanceRecord | null;
  onSave: (data: NewAttendanceRecord) => void;
}

export function LogModal({
  open,
  onClose,
  editingRecord,
  onSave,
}: LogModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevEditing, setPrevEditing] = useState<AttendanceRecord | null>(null);
  const [form, setForm] = useState<FormValues>(() => getDefaults(null));
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});

  if (open !== prevOpen || editingRecord !== prevEditing) {
    setPrevOpen(open);
    setPrevEditing(editingRecord);
    if (open) {
      setForm(getDefaults(editingRecord));
      setErrors({});
    }
  }

  const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
    { value: "present", label: "Present" },
    { value: "absent", label: "Absent" },
    { value: "late", label: "Late" },
    { value: "early_departure", label: "Early Departure" },
    { value: "on_leave", label: "On Leave" },
    { value: "not_clocked_in", label: "Not Clocked In" },
  ];

  function update(field: keyof FormValues, value: string) {
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

    const { clockIn, clockOut, breakMinutes } = result.data;
    let totalHours: number | undefined;
    if (clockIn && clockOut) {
      const diff =
        timeToMinutes(clockOut) - timeToMinutes(clockIn) - breakMinutes;
      totalHours = Math.round((diff / 60) * 10) / 10;
    }

    onSave({
      employeeName: result.data.employeeName,
      employeeInitials: result.data.employeeInitials.toUpperCase(),
      department: result.data.department,
      jobTitle: result.data.jobTitle,
      date: result.data.date,
      status: result.data.status as AttendanceStatus,
      clockIn: clockIn || undefined,
      clockOut: clockOut || undefined,
      breakMinutes: breakMinutes,
      ...(totalHours !== undefined && { totalHours }),
      notes: result.data.notes || undefined,
      location: result.data.location || undefined,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editingRecord ? "Edit Attendance Record" : "Log Attendance"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Employee Name</Label>
            <Input
              className="h-8 text-xs"
              value={form.employeeName}
              onChange={(e) => update("employeeName", e.target.value)}
              placeholder="Full name"
            />
            {errors.employeeName && (
              <p className="text-[10px] text-destructive">
                {errors.employeeName}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Initials</Label>
            <Input
              className="h-8 text-xs"
              value={form.employeeInitials}
              onChange={(e) =>
                update("employeeInitials", e.target.value.toUpperCase())
              }
              placeholder="e.g. CO"
              maxLength={3}
            />
            {errors.employeeInitials && (
              <p className="text-[10px] text-destructive">
                {errors.employeeInitials}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Department</Label>
            <Select
              value={form.department}
              onValueChange={(v) => update("department", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department && (
              <p className="text-[10px] text-destructive">
                {errors.department}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Job Title</Label>
            <Input
              className="h-8 text-xs"
              value={form.jobTitle}
              onChange={(e) => update("jobTitle", e.target.value)}
              placeholder="Job title"
            />
            {errors.jobTitle && (
              <p className="text-[10px] text-destructive">{errors.jobTitle}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
            />
            {errors.date && (
              <p className="text-[10px] text-destructive">{errors.date}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => update("status", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-[10px] text-destructive">{errors.status}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Clock In</Label>
            <Input
              type="time"
              className="h-8 text-xs"
              value={form.clockIn}
              onChange={(e) => update("clockIn", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Clock Out</Label>
            <Input
              type="time"
              className="h-8 text-xs"
              value={form.clockOut}
              onChange={(e) => update("clockOut", e.target.value)}
            />
          </div>

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

          <div className="space-y-1.5">
            <Label className="text-xs">Location</Label>
            <Input
              className="h-8 text-xs"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Office / Remote"
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              className="text-xs min-h-16 resize-none"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Optional notes..."
            />
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
            {editingRecord ? "Save Changes" : "Log Attendance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
