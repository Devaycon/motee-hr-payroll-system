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
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_OPTIONS } from "../data";
import type { LeavePolicy, NewLeavePolicy, LeaveTypeName } from "../types";

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  leaveType: z.string().min(1, { message: "Leave type is required" }),
  description: z.string().optional(),
  maxDaysPerYear: z.coerce
    .number({ message: "Must be a number" })
    .min(1, { message: "Must be at least 1 day" }),
  minNoticeDays: z.coerce
    .number({ message: "Must be a number" })
    .min(0, { message: "Cannot be negative" }),
  maxConsecutiveDays: z.coerce
    .number({ message: "Must be a number" })
    .min(1, { message: "Must be at least 1 day" }),
  maxCarryOverDays: z.coerce
    .number({ message: "Must be a number" })
    .min(0, { message: "Cannot be negative" }),
  eligibility: z.string().optional(),
  publicHolidayRule: z.string().optional(),
  attachmentRequirement: z.string().optional(),
  documentUrl: z.string().optional(),
});

type FormValues = {
  name: string;
  leaveType: string;
  description: string;
  maxDaysPerYear: string;
  minNoticeDays: string;
  maxConsecutiveDays: string;
  requiresMedicalCertificate: boolean;
  carryOverAllowed: boolean;
  maxCarryOverDays: string;
  eligibility: string;
  publicHolidayRule: string;
  attachmentRequirement: string;
  documentUrl: string;
};

function getDefaults(policy: LeavePolicy | null): FormValues {
  if (!policy) {
    return {
      name: "",
      leaveType: "annual",
      description: "",
      maxDaysPerYear: "21",
      minNoticeDays: "14",
      maxConsecutiveDays: "21",
      requiresMedicalCertificate: false,
      carryOverAllowed: false,
      maxCarryOverDays: "0",
      eligibility: "",
      publicHolidayRule: "",
      attachmentRequirement: "",
      documentUrl: "",
    };
  }
  return {
    name: policy.name,
    leaveType: policy.leaveType,
    description: policy.description ?? "",
    maxDaysPerYear: String(policy.maxDaysPerYear),
    minNoticeDays: String(policy.minNoticeDays),
    maxConsecutiveDays: String(policy.maxConsecutiveDays),
    requiresMedicalCertificate: policy.requiresMedicalCertificate,
    carryOverAllowed: policy.carryOverAllowed,
    maxCarryOverDays: String(policy.maxCarryOverDays),
    eligibility: policy.eligibility ?? "",
    publicHolidayRule: policy.publicHolidayRule ?? "",
    attachmentRequirement: policy.attachmentRequirement ?? "",
    documentUrl: policy.documentUrl ?? "",
  };
}

interface PolicyModalProps {
  open: boolean;
  onClose: () => void;
  editingPolicy: LeavePolicy | null;
  onSave: (data: NewLeavePolicy) => void;
}

export function PolicyModal({
  open,
  onClose,
  editingPolicy,
  onSave,
}: PolicyModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevPolicy, setPrevPolicy] = useState<LeavePolicy | null>(null);
  const [form, setForm] = useState<FormValues>(() => getDefaults(null));
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});

  if (open !== prevOpen || editingPolicy !== prevPolicy) {
    setPrevOpen(open);
    setPrevPolicy(editingPolicy);
    if (open) {
      setForm(getDefaults(editingPolicy));
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

    onSave({
      name: result.data.name,
      leaveType: result.data.leaveType as LeaveTypeName,
      description: result.data.description || undefined,
      maxDaysPerYear: result.data.maxDaysPerYear,
      minNoticeDays: result.data.minNoticeDays,
      maxConsecutiveDays: result.data.maxConsecutiveDays,
      requiresMedicalCertificate: form.requiresMedicalCertificate,
      carryOverAllowed: form.carryOverAllowed,
      maxCarryOverDays: result.data.maxCarryOverDays,
      eligibility: result.data.eligibility || undefined,
      publicHolidayRule: result.data.publicHolidayRule || undefined,
      attachmentRequirement: result.data.attachmentRequirement || undefined,
      documentUrl: result.data.documentUrl || undefined,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editingPolicy ? "Edit Leave Policy" : "Add Leave Policy"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Policy Name</Label>
            <Input
              className="h-8 text-xs"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Annual Leave Policy"
            />
            {errors.name && (
              <p className="text-[10px] text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              className="text-xs min-h-14 resize-none"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Brief description of this policy..."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Max Days/Year</Label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={form.maxDaysPerYear}
                onChange={(e) => update("maxDaysPerYear", e.target.value)}
                min={1}
              />
              {errors.maxDaysPerYear && (
                <p className="text-[10px] text-destructive">
                  {errors.maxDaysPerYear}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Min Notice (days)</Label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={form.minNoticeDays}
                onChange={(e) => update("minNoticeDays", e.target.value)}
                min={0}
              />
              {errors.minNoticeDays && (
                <p className="text-[10px] text-destructive">
                  {errors.minNoticeDays}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max Consecutive</Label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={form.maxConsecutiveDays}
                onChange={(e) => update("maxConsecutiveDays", e.target.value)}
                min={1}
              />
              {errors.maxConsecutiveDays && (
                <p className="text-[10px] text-destructive">
                  {errors.maxConsecutiveDays}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">
                  Medical Certificate Required
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Require a doctor&apos;s note to approve this leave
                </p>
              </div>
              <Switch
                checked={form.requiresMedicalCertificate}
                onCheckedChange={(v) => update("requiresMedicalCertificate", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Allow Carry Over</p>
                <p className="text-[10px] text-muted-foreground">
                  Unused days carry over to the next year
                </p>
              </div>
              <Switch
                checked={form.carryOverAllowed}
                onCheckedChange={(v) => update("carryOverAllowed", v)}
              />
            </div>

            {form.carryOverAllowed && (
              <div className="space-y-1.5">
                <Label className="text-xs">Max Carry Over Days</Label>
                <Input
                  type="number"
                  className="h-8 text-xs max-w-32"
                  value={form.maxCarryOverDays}
                  onChange={(e) => update("maxCarryOverDays", e.target.value)}
                  min={0}
                />
                {errors.maxCarryOverDays && (
                  <p className="text-[10px] text-destructive">
                    {errors.maxCarryOverDays}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Policy integration details surfaced on the Policies tab (§F13). */}
          <div className="space-y-3.5 border-t border-border pt-3.5">
            <p className="text-xs font-semibold text-foreground">
              Policy details
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Eligibility</Label>
              <Input
                className="h-8 text-xs"
                value={form.eligibility}
                onChange={(e) => update("eligibility", e.target.value)}
                placeholder="e.g. All employees after 3 months' service"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Public holiday rule</Label>
              <Input
                className="h-8 text-xs"
                value={form.publicHolidayRule}
                onChange={(e) => update("publicHolidayRule", e.target.value)}
                placeholder="e.g. In addition to the annual entitlement"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Attachment requirement</Label>
              <Input
                className="h-8 text-xs"
                value={form.attachmentRequirement}
                onChange={(e) => update("attachmentRequirement", e.target.value)}
                placeholder="e.g. Fit note required beyond 7 days"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Policy document link</Label>
              <Input
                className="h-8 text-xs"
                value={form.documentUrl}
                onChange={(e) => update("documentUrl", e.target.value)}
                placeholder="https://…"
              />
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
            {editingPolicy ? "Save Changes" : "Add Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
