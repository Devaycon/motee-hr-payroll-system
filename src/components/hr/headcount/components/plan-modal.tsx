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
import { cn } from "@/src/lib/utils";
import { DEPARTMENT_OPTIONS, PLAN_PERIODS } from "../data";
import type { HeadcountPlan, NewHeadcountPlan, PlanPeriod } from "../types";

interface PlanModalProps {
  open: boolean;
  onClose: () => void;
  editingPlan: HeadcountPlan | null;
  activePeriod: PlanPeriod;
  onSave: (data: NewHeadcountPlan | HeadcountPlan) => void;
}

const formSchema = z.object({
  department: z.string().min(1, "Department is required"),
  period: z.enum(["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "FY 2026"], {
    message: "Please select a period",
  }),
  target: z.coerce
    .number()
    .int("Target must be a whole number")
    .min(1, "Target must be at least 1")
    .max(500, "Target must be at most 500"),
});

type FormFields = keyof z.infer<typeof formSchema>;
type FieldErrors = Partial<Record<FormFields, string>>;

export function PlanModal({
  open,
  onClose,
  editingPlan,
  activePeriod,
  onSave,
}: PlanModalProps) {
  const [department, setDepartment] = useState("");
  const [period, setPeriod] = useState<PlanPeriod>(activePeriod);
  const [target, setTarget] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FormFields, boolean>>>(
    {},
  );

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      if (editingPlan) {
        setDepartment(editingPlan.department);
        setPeriod(editingPlan.period);
        setTarget(String(editingPlan.target));
      } else {
        setDepartment("");
        setPeriod(activePeriod);
        setTarget("");
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

  function touch(field: FormFields) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function fieldError(field: FormFields) {
    return touched[field] && errors[field] ? errors[field] : undefined;
  }

  function handleSave() {
    const result = formSchema.safeParse({
      department,
      period,
      target: target === "" ? undefined : target,
    });

    if (!result.success) {
      const newErrors: FieldErrors = {};
      const newTouched: Partial<Record<FormFields, boolean>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as FormFields;
        newErrors[field] = issue.message;
        newTouched[field] = true;
      }
      setErrors(newErrors);
      setTouched(newTouched);
      return;
    }

    const { department: dept, period: p, target: t } = result.data;
    const actual = editingPlan ? editingPlan.actual : 0;
    const gapStatus =
      actual >= t ? (actual > t ? "over" : "on_target") : "under";

    if (editingPlan) {
      onSave({
        ...editingPlan,
        department: dept,
        period: p,
        target: t,
        gapStatus,
      });
    } else {
      onSave({ department: dept, period: p, target: t } as NewHeadcountPlan);
    }
    handleClose();
  }

  const isEditing = !!editingPlan;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Headcount Target" : "Set Headcount Target"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="hc-dept" className="text-xs font-medium">
              Department <span className="text-destructive">*</span>
            </Label>
            <Select
              value={department}
              onValueChange={(v) => {
                setDepartment(v);
                touch("department");
                const result = formSchema.shape.department.safeParse(v);
                setErrors((prev) => ({
                  ...prev,
                  department: result.success
                    ? undefined
                    : result.error.issues[0]?.message,
                }));
              }}
              disabled={isEditing}
            >
              <SelectTrigger
                id="hc-dept"
                className={cn(
                  "h-8 text-sm",
                  fieldError("department") && "border-destructive",
                )}
              >
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d} className="text-sm">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError("department") && (
              <p className="text-xs text-destructive">
                {fieldError("department")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hc-period" className="text-xs font-medium">
              Period <span className="text-destructive">*</span>
            </Label>
            <Select
              value={period}
              onValueChange={(v) => {
                setPeriod(v as PlanPeriod);
                touch("period");
              }}
              disabled={isEditing}
            >
              <SelectTrigger
                id="hc-period"
                className={cn(
                  "h-8 text-sm",
                  fieldError("period") && "border-destructive",
                )}
              >
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {PLAN_PERIODS.map((p) => (
                  <SelectItem key={p} value={p} className="text-sm">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError("period") && (
              <p className="text-xs text-destructive">{fieldError("period")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hc-target" className="text-xs font-medium">
              Target Headcount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="hc-target"
              type="number"
              min={1}
              placeholder="e.g. 10"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                const result = formSchema.shape.target.safeParse(
                  e.target.value === "" ? undefined : e.target.value,
                );
                setErrors((prev) => ({
                  ...prev,
                  target: result.success
                    ? undefined
                    : result.error.issues[0]?.message,
                }));
              }}
              onBlur={() => touch("target")}
              className={cn(
                "h-8 text-sm",
                fieldError("target") && "border-destructive",
              )}
            />
            {fieldError("target") && (
              <p className="text-xs text-destructive">{fieldError("target")}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            {isEditing ? "Save Changes" : "Set Target"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
