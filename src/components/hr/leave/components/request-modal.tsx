"use client";

import { z } from "zod/v4";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
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
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { EmployeePicker } from "@/src/components/shared/employee-picker";
import { reliefConflict } from "@/src/lib/leave/conflicts";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  DEPARTMENTS,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_OPTIONS,
} from "../data";
import type { LeaveRequest, NewLeaveRequest, LeaveTypeName } from "../types";

const schema = z.object({
  employeeName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" }),
  employeeInitials: z
    .string()
    .min(1, { message: "Initials required" })
    .max(3, { message: "Max 3 characters" }),
  department: z.string().min(1, { message: "Department is required" }),
  jobTitle: z.string().min(1, { message: "Job title is required" }),
  leaveType: z.string().min(1, { message: "Leave type is required" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  reason: z.string().min(1, { message: "Reason is required" }),
  notes: z.string().optional(),
  // Relief cover is optional (client feedback §3.1).
  reliefEmployeeId: z.string().optional(),
  reliefEmployeeName: z.string().optional(),
});

type FormValues = {
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDayPeriod: "morning" | "afternoon";
  reason: string;
  notes: string;
  reliefEmployeeId: string;
  reliefEmployeeName: string;
};

function getDefaults(request: LeaveRequest | null): FormValues {
  if (!request) {
    return {
      employeeName: "",
      employeeInitials: "",
      department: "",
      jobTitle: "",
      leaveType: "annual",
      startDate: "",
      endDate: "",
      isHalfDay: false,
      halfDayPeriod: "morning",
      reason: "",
      notes: "",
      reliefEmployeeId: "",
      reliefEmployeeName: "",
    };
  }
  return {
    employeeName: request.employeeName,
    employeeInitials: request.employeeInitials,
    department: request.department,
    jobTitle: request.jobTitle,
    leaveType: request.leaveType,
    startDate: request.startDate,
    endDate: request.endDate,
    isHalfDay: request.isHalfDay,
    halfDayPeriod: request.halfDayPeriod ?? "morning",
    reason: request.reason ?? "",
    notes: request.notes ?? "",
    reliefEmployeeId: request.reliefEmployeeId ?? "",
    reliefEmployeeName: request.reliefEmployeeName ?? "",
  };
}

function computeDuration(
  startDate: string,
  endDate: string,
  isHalfDay: boolean,
): number {
  if (!startDate || !endDate) return 0;
  if (isHalfDay) return 0.5;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return days < 0 ? 0 : days;
}

interface RequestModalProps {
  open: boolean;
  onClose: () => void;
  editingRequest: LeaveRequest | null;
  onSave: (data: NewLeaveRequest) => void;
}

export function RequestModal({
  open,
  onClose,
  editingRequest,
  onSave,
}: RequestModalProps) {
  const allRequests = useAppSelector((s) => s.leave.requests);
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevRequest, setPrevRequest] = useState<LeaveRequest | null>(null);
  const [form, setForm] = useState<FormValues>(() => getDefaults(null));
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});

  if (open !== prevOpen || editingRequest !== prevRequest) {
    setPrevOpen(open);
    setPrevRequest(editingRequest);
    if (open) {
      setForm(getDefaults(editingRequest));
      setErrors({});
    }
  }

  function update(field: keyof FormValues, value: string | boolean) {
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

    const totalDays = computeDuration(
      form.startDate,
      form.endDate,
      form.isHalfDay,
    );

    onSave({
      employeeName: result.data.employeeName,
      employeeInitials: result.data.employeeInitials.toUpperCase(),
      department: result.data.department,
      jobTitle: result.data.jobTitle,
      leaveType: result.data.leaveType as LeaveTypeName,
      startDate: result.data.startDate,
      endDate: form.isHalfDay ? result.data.startDate : result.data.endDate,
      totalDays,
      isHalfDay: form.isHalfDay,
      halfDayPeriod: form.isHalfDay ? form.halfDayPeriod : undefined,
      reason: result.data.reason,
      notes: result.data.notes || undefined,
      reliefEmployeeId: form.reliefEmployeeId || undefined,
      reliefEmployeeName: form.reliefEmployeeName || undefined,
    });
    onClose();
  }

  // Surface the cover clash at request time, not only at HR review (§3.2).
  const reliefConflictMessage =
    form.reliefEmployeeId && form.startDate && form.endDate
      ? (reliefConflict(
          {
            id: editingRequest?.id ?? "",
            startDate: form.startDate,
            endDate: form.isHalfDay ? form.startDate : form.endDate,
            reliefEmployeeId: form.reliefEmployeeId,
            reliefEmployeeName: form.reliefEmployeeName,
          },
          allRequests,
        )?.message ?? null)
      : null;

  const duration = computeDuration(
    form.startDate,
    form.endDate,
    form.isHalfDay,
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editingRequest ? "Edit Leave Request" : "New Leave Request"}
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
                {/* DEPARTMENTS, not DEPARTMENT_OPTIONS — the latter carries the
                    "all" filter sentinel, which isn't a real department. */}
                {DEPARTMENTS.map((d) => (
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

          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Leave Type</Label>
            <Select
              value={form.leaveType}
              onValueChange={(v) => update("leaveType", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {LEAVE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.leaveType && (
              <p className="text-[10px] text-destructive">{errors.leaveType}</p>
            )}
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <Checkbox
              id="half-day"
              checked={form.isHalfDay}
              onCheckedChange={(v) => update("isHalfDay", !!v)}
              className="w-3.5 h-3.5"
            />
            <label
              htmlFor="half-day"
              className="text-xs cursor-pointer select-none"
            >
              Half-day leave
            </label>
          </div>

          {form.isHalfDay && (
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Period</Label>
              <RadioGroup
                value={form.halfDayPeriod}
                onValueChange={(v) =>
                  update("halfDayPeriod", v as "morning" | "afternoon")
                }
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem
                    value="morning"
                    id="morning"
                    className="w-3.5 h-3.5"
                  />
                  <label htmlFor="morning" className="text-xs cursor-pointer">
                    Morning
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem
                    value="afternoon"
                    id="afternoon"
                    className="w-3.5 h-3.5"
                  />
                  <label htmlFor="afternoon" className="text-xs cursor-pointer">
                    Afternoon
                  </label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Start Date</Label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
            />
            {errors.startDate && (
              <p className="text-[10px] text-destructive">{errors.startDate}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">End Date</Label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={form.isHalfDay ? form.startDate : form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
              disabled={form.isHalfDay}
            />
            {errors.endDate && (
              <p className="text-[10px] text-destructive">{errors.endDate}</p>
            )}
          </div>

          {(form.startDate || form.endDate) && (
            <div className="col-span-2">
              <div className="bg-muted/40 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Duration</span>
                <span className="text-xs font-semibold text-primary">
                  {duration === 0.5
                    ? "½ day"
                    : `${duration} day${duration !== 1 ? "s" : ""}`}
                </span>
              </div>
            </div>
          )}

          {/* Reason is the employee's own explanation and shows on the request
              detail panel; notes are internal context (§F3). */}
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">
              Reason for leave <span className="text-destructive">*</span>
            </Label>
            <Textarea
              className="text-xs min-h-16 resize-none"
              value={form.reason}
              onChange={(e) => update("reason", e.target.value)}
              placeholder="Why is this leave being taken?"
            />
            {errors.reason && (
              <p className="text-[10px] text-destructive">{errors.reason}</p>
            )}
          </div>

          {/* Optional colleague nominated to cover while they are away (§3.1). */}
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Relief employee (optional)</Label>
            <EmployeePicker
              value={form.reliefEmployeeId || undefined}
              preferDepartment={form.department || undefined}
              placeholder="Who is covering while they are away?"
              onChange={(picked) => {
                update("reliefEmployeeId", picked?.id ?? "");
                update("reliefEmployeeName", picked?.name ?? "");
              }}
            />
            {reliefConflictMessage && (
              <p className="flex items-start gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                <AlertTriangle className="mt-px size-3 shrink-0" />
                {reliefConflictMessage}
              </p>
            )}
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Internal notes (optional)</Label>
            <Textarea
              className="text-xs min-h-16 resize-none"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Handover details, cover arrangements..."
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
            {editingRequest ? "Save Changes" : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
