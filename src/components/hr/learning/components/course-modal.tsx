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
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  COURSE_CATEGORY_LABELS,
  DELIVERY_MODE_LABELS,
  COURSE_STATUS_LABELS,
} from "../data";
import type {
  Course,
  NewCourse,
  CourseCategory,
  CourseDeliveryMode,
  CourseStatus,
} from "../types";

const courseSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  courseUrl: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .or(z.literal("")),
  durationHours: z.coerce
    .number({ error: "Duration must be a number" })
    .min(1, { message: "Duration must be at least 1 hour" }),
  deliveryMode: z.string().min(1, { message: "Delivery mode is required" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  status: z.string().min(1, { message: "Status is required" }),
});

interface CourseModalProps {
  open: boolean;
  onClose: () => void;
  editingCourse: Course | null;
  onSave: (data: NewCourse) => void;
}

const defaultForm = {
  title: "",
  category: "",
  courseUrl: "",
  durationHours: "",
  deliveryMode: "",
  description: "",
  status: "active",
};

export function CourseModal({
  open,
  onClose,
  editingCourse,
  onSave,
}: CourseModalProps) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      if (editingCourse) {
        setForm({
          title: editingCourse.title,
          category: editingCourse.category,
          courseUrl: editingCourse.courseUrl ?? "",
          durationHours: String(editingCourse.durationHours),
          deliveryMode: editingCourse.deliveryMode,
          description: editingCourse.description,
          status: editingCourse.status,
        });
      } else {
        setForm(defaultForm);
      }
      setErrors({});
    }
  }

  function handleField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleSubmit() {
    const result = courseSchema.safeParse(form);
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
      title: form.title,
      category: form.category as CourseCategory,
      courseUrl: form.courseUrl,
      durationHours: Number(form.durationHours),
      deliveryMode: form.deliveryMode as CourseDeliveryMode,
      description: form.description,
      status: form.status as CourseStatus,
      instructor: editingCourse?.instructor ?? "",
      tags: editingCourse?.tags ?? [],
    });
    onClose();
  }

  const isEdit = !!editingCourse;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isEdit ? "Edit Course" : "Add Course"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-2">
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Course Title <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Advanced Leadership Essentials"
                value={form.title}
                onChange={(e) => handleField("title", e.target.value)}
                className="h-8 text-xs"
              />
              {errors.title && (
                <p className="text-[10px] text-destructive">{errors.title}</p>
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
                      Object.keys(COURSE_CATEGORY_LABELS) as CourseCategory[]
                    ).map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {COURSE_CATEGORY_LABELS[c]}
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
                <Label className="text-xs">Course URL</Label>
                <Input
                  placeholder="e.g. https://coursera.org/..."
                  value={form.courseUrl}
                  onChange={(e) => handleField("courseUrl", e.target.value)}
                  className="h-8 text-xs"
                />
                {errors.courseUrl && (
                  <p className="text-[10px] text-destructive">
                    {errors.courseUrl}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Duration (hours) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 8"
                  value={form.durationHours}
                  onChange={(e) => handleField("durationHours", e.target.value)}
                  className="h-8 text-xs"
                />
                {errors.durationHours && (
                  <p className="text-[10px] text-destructive">
                    {errors.durationHours}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Delivery Mode <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.deliveryMode}
                  onValueChange={(v) => handleField("deliveryMode", v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(DELIVERY_MODE_LABELS) as CourseDeliveryMode[]
                    ).map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">
                        {DELIVERY_MODE_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.deliveryMode && (
                  <p className="text-[10px] text-destructive">
                    {errors.deliveryMode}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Describe what this course covers and what learners will achieve..."
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

            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => handleField("status", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COURSE_STATUS_LABELS) as CourseStatus[]).map(
                    (s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {COURSE_STATUS_LABELS[s]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
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
            {isEdit ? "Save Changes" : "Add Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
