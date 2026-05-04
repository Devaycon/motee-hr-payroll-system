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
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import { DEPARTMENT_OPTIONS, GRADE_OPTIONS } from "../data";
import type { Position, NewPosition, PositionStatus } from "../types";

interface PositionModalProps {
  open: boolean;
  onClose: () => void;
  editingPosition: Position | null;
  onSave: (data: NewPosition | Position) => void;
}

const formSchema = z.object({
  title: z
    .string()
    .min(2, "Position title must be at least 2 characters")
    .max(80, "Position title must be at most 80 characters"),
  department: z.string().min(1, "Department is required"),
  grade: z.string().min(1, "Grade / Level is required"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be at most 500 characters"),
  status: z.enum(["filled", "vacant"], {
    message: "Please select a status",
  }),
});

type FormFields = keyof z.infer<typeof formSchema>;
type FieldErrors = Partial<Record<FormFields, string>>;

const EMPTY: NewPosition = {
  title: "",
  department: "",
  grade: "",
  description: "",
  status: "vacant",
};

export function PositionModal({
  open,
  onClose,
  editingPosition,
  onSave,
}: PositionModalProps) {
  const [form, setForm] = useState<NewPosition>({ ...EMPTY });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FormFields, boolean>>>(
    {},
  );

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      if (editingPosition) {
        setForm({
          title: editingPosition.title,
          department: editingPosition.department,
          grade: editingPosition.grade,
          description: editingPosition.description,
          status: editingPosition.status,
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

  function setField<K extends keyof NewPosition>(
    key: K,
    value: NewPosition[K],
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
    const result = formSchema.shape[field].safeParse(form[field]);
    setErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  }

  function fieldError(field: FormFields) {
    return touched[field] && errors[field] ? errors[field] : undefined;
  }

  function handleSave() {
    const result = formSchema.safeParse(form);
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

    if (editingPosition) {
      onSave({ ...editingPosition, ...result.data });
    } else {
      onSave(result.data as NewPosition);
    }
    handleClose();
  }

  const isEditing = !!editingPosition;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Position" : "Add Position"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="pos-title" className="text-xs font-medium">
              Position Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pos-title"
              placeholder="e.g. Senior Software Engineer"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              onBlur={() => touch("title")}
              className={cn(
                "h-8 text-sm",
                fieldError("title") && "border-destructive",
              )}
            />
            {fieldError("title") && (
              <p className="text-xs text-destructive">{fieldError("title")}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pos-dept" className="text-xs font-medium">
                Department <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.department}
                onValueChange={(v) => {
                  setField("department", v);
                  touch("department");
                }}
              >
                <SelectTrigger
                  id="pos-dept"
                  className={cn(
                    "h-8 text-sm",
                    fieldError("department") && "border-destructive",
                  )}
                >
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <SelectItem key={dept} value={dept} className="text-sm">
                      {dept}
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
              <Label htmlFor="pos-grade" className="text-xs font-medium">
                Grade / Level <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.grade}
                onValueChange={(v) => {
                  setField("grade", v);
                  touch("grade");
                }}
              >
                <SelectTrigger
                  id="pos-grade"
                  className={cn(
                    "h-8 text-sm",
                    fieldError("grade") && "border-destructive",
                  )}
                >
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((grade) => (
                    <SelectItem key={grade} value={grade} className="text-sm">
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("grade") && (
                <p className="text-xs text-destructive">
                  {fieldError("grade")}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pos-status" className="text-xs font-medium">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.status}
              onValueChange={(v) => {
                setField("status", v as PositionStatus);
                touch("status");
              }}
            >
              <SelectTrigger
                id="pos-status"
                className={cn(
                  "h-8 text-sm",
                  fieldError("status") && "border-destructive",
                )}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filled" className="text-sm">
                  Filled
                </SelectItem>
                <SelectItem value="vacant" className="text-sm">
                  Vacant
                </SelectItem>
              </SelectContent>
            </Select>
            {fieldError("status") && (
              <p className="text-xs text-destructive">{fieldError("status")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pos-desc" className="text-xs font-medium">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="pos-desc"
              placeholder="Briefly describe the role and key responsibilities..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              onBlur={() => touch("description")}
              rows={3}
              className={cn(
                "text-sm resize-none",
                fieldError("description") && "border-destructive",
              )}
            />
            <div className="flex items-center justify-between">
              {fieldError("description") ? (
                <p className="text-xs text-destructive">
                  {fieldError("description")}
                </p>
              ) : (
                <span />
              )}
              <p className="text-xs text-muted-foreground ml-auto">
                {(form.description ?? "").length}/500
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            {isEditing ? "Save Changes" : "Add Position"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
