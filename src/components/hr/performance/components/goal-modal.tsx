"use client";

import { useState } from "react";
import { z } from "zod/v4";
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
import { Slider } from "@/src/components/ui/slider";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Separator } from "@/src/components/ui/separator";
import {
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_LABELS,
  DEPARTMENT_OPTIONS,
} from "../data";
import type {
  PerformanceGoal,
  NewGoal,
  GoalCategory,
  GoalStatus,
} from "../types";

const createSchema = z.object({
  employeeName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" }),
  employeeInitials: z
    .string()
    .min(1, { message: "Initials are required" })
    .max(3, { message: "Max 3 characters" }),
  department: z.string().min(1, { message: "Department is required" }),
  goalTitle: z
    .string()
    .min(3, { message: "Goal title must be at least 3 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  dueDate: z.string().min(1, { message: "Due date is required" }),
});

interface GoalModalProps {
  open: boolean;
  onClose: () => void;
  editingGoal: PerformanceGoal | null;
  onSave: (data: NewGoal) => void;
  onUpdate: (
    id: string,
    updates: { progress: number; status: GoalStatus },
  ) => void;
}

const defaultForm = {
  employeeName: "",
  employeeInitials: "",
  department: "",
  goalTitle: "",
  category: "",
  description: "",
  dueDate: "",
};

export function GoalModal({
  open,
  onClose,
  editingGoal,
  onSave,
  onUpdate,
}: GoalModalProps) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<GoalStatus>("on_track");

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      if (editingGoal) {
        setForm({
          employeeName: editingGoal.employeeName,
          employeeInitials: editingGoal.employeeInitials ?? "",
          department: editingGoal.department,
          goalTitle: editingGoal.goalTitle,
          category: editingGoal.category,
          description: editingGoal.description ?? "",
          dueDate: editingGoal.dueDate,
        });
        setProgress(editingGoal.progress);
        setStatus(editingGoal.status);
      } else {
        setForm(defaultForm);
        setProgress(0);
        setStatus("on_track");
      }
      setErrors({});
    }
  }

  function handleField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleSubmit() {
    if (editingGoal) {
      onUpdate(editingGoal.id, { progress, status });
      onClose();
      return;
    }

    const result = createSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    onSave({
      employeeName: form.employeeName,
      employeeInitials: form.employeeInitials,
      department: form.department,
      goalTitle: form.goalTitle,
      category: form.category as GoalCategory,
      description: form.description,
      dueDate: form.dueDate,
    });
    onClose();
  }

  const isEdit = !!editingGoal;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isEdit ? "Edit Goal" : "Add Performance Goal"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-2">
          <div className="space-y-4 py-1">
            {!isEdit ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Employee Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Full name"
                      value={form.employeeName}
                      onChange={(e) =>
                        handleField("employeeName", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                    {errors.employeeName && (
                      <p className="text-[10px] text-destructive">
                        {errors.employeeName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Initials <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. CO"
                      value={form.employeeInitials}
                      onChange={(e) =>
                        handleField(
                          "employeeInitials",
                          e.target.value.toUpperCase().slice(0, 3),
                        )
                      }
                      className="h-8 text-xs"
                      maxLength={3}
                    />
                    {errors.employeeInitials && (
                      <p className="text-[10px] text-destructive">
                        {errors.employeeInitials}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Department <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.department}
                    onValueChange={(v) => handleField("department", v)}
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
                  <Label className="text-xs">
                    Goal Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Achieve ₦50M quarterly sales target"
                    value={form.goalTitle}
                    onChange={(e) => handleField("goalTitle", e.target.value)}
                    className="h-8 text-xs"
                  />
                  {errors.goalTitle && (
                    <p className="text-[10px] text-destructive">
                      {errors.goalTitle}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => handleField("category", v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(GOAL_CATEGORY_LABELS) as GoalCategory[]
                        ).map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">
                            {GOAL_CATEGORY_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-[10px] text-destructive">
                        {errors.category}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Due Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => handleField("dueDate", e.target.value)}
                      className="h-8 text-xs"
                    />
                    {errors.dueDate && (
                      <p className="text-[10px] text-destructive">
                        {errors.dueDate}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    placeholder="Describe the goal, expected outcomes, and success criteria..."
                    value={form.description}
                    onChange={(e) => handleField("description", e.target.value)}
                    className="text-xs resize-none min-h-20"
                  />
                  {errors.description && (
                    <p className="text-[10px] text-destructive">
                      {errors.description}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-lg bg-muted/40 space-y-0.5">
                  <p className="text-xs font-semibold">
                    {editingGoal.goalTitle}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {editingGoal.employeeName} · {editingGoal.department}
                  </p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Progress</Label>
                      <span className="text-xs font-semibold text-primary">
                        {progress}%
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={[progress]}
                      onValueChange={(v) => setProgress(v[0])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={status}
                      onValueChange={(v) => setStatus(v as GoalStatus)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(GOAL_STATUS_LABELS) as GoalStatus[]).map(
                          (s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {GOAL_STATUS_LABELS[s]}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button size="sm" className="text-xs" onClick={handleSubmit}>
            {isEdit ? "Update Goal" : "Create Goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
