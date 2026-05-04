"use client";

import { useState } from "react";
import { z } from "zod/v4";
import { Clock, Monitor } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import {
  DEPARTMENT_OPTIONS,
  COURSE_CATEGORY_LABELS,
  DELIVERY_MODE_LABELS,
} from "../data";
import type { Course, NewEnrollment } from "../types";

const enrollSchema = z.object({
  employeeName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" }),
  employeeInitials: z
    .string()
    .min(1, { message: "Initials are required" })
    .max(3, { message: "Max 3 characters" }),
  department: z.string().min(1, { message: "Department is required" }),
  courseId: z.string().min(1, { message: "Please select a course" }),
});

interface EnrollModalProps {
  open: boolean;
  onClose: () => void;
  courses: Course[];
  onSave: (data: NewEnrollment) => void;
}

const defaultForm = {
  employeeName: "",
  employeeInitials: "",
  department: "",
  courseId: "",
};

export function EnrollModal({
  open,
  onClose,
  courses,
  onSave,
}: EnrollModalProps) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setForm(defaultForm);
      setErrors({});
    }
  }

  function handleField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleSubmit() {
    const result = enrollSchema.safeParse(form);
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
      employeeDept: form.department,
      department: form.department,
      courseId: form.courseId,
    });
    onClose();
  }

  const activeCourses = courses.filter((c) => c.status === "active");
  const selectedCourse = activeCourses.find((c) => c.id === form.courseId);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Enroll Employee</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Employee Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Full name"
                value={form.employeeName}
                onChange={(e) => handleField("employeeName", e.target.value)}
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
              Course <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.courseId}
              onValueChange={(v) => handleField("courseId", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {activeCourses.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    No active courses available
                  </div>
                ) : (
                  activeCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.courseId && (
              <p className="text-[10px] text-destructive">{errors.courseId}</p>
            )}
          </div>

          {selectedCourse && (
            <>
              <Separator />
              <div className="p-3 rounded-lg bg-muted/40 space-y-2">
                <p className="text-xs font-medium">{selectedCourse.title}</p>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-medium`}
                  >
                    {COURSE_CATEGORY_LABELS[selectedCourse.category]}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedCourse.durationHours}h
                  </div>
                  <div className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    {DELIVERY_MODE_LABELS[selectedCourse.deliveryMode]}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2">
                  {selectedCourse.description}
                </p>
              </div>
            </>
          )}
        </div>

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
            Enroll Employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
