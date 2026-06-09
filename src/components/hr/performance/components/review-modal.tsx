"use client";

import { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Separator } from "@/src/components/ui/separator";
import {
  REVIEW_TYPE_LABELS,
  REVIEW_TYPE_STYLES,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_STYLES,
  RATING_LABELS,
  DEPARTMENT_OPTIONS,
} from "../data";
import type {
  PerformanceReview,
  NewReview,
  ReviewType,
  PerformanceRating,
} from "../types";
import { toast } from "sonner";

const createSchema = z.object({
  employeeName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" }),
  employeeInitials: z
    .string()
    .min(1, { message: "Initials are required" })
    .max(3, { message: "Max 3 characters" }),
  department: z.string().min(1, { message: "Department is required" }),
  jobTitle: z.string().min(2, { message: "Job title is required" }),
  reviewType: z.string().min(1, { message: "Review type is required" }),
  period: z.string().min(1, { message: "Period is required" }),
  reviewer: z.string().min(2, { message: "Reviewer name is required" }),
  dueDate: z.string().min(1, { message: "Due date is required" }),
});

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  viewingReview: PerformanceReview | null;
  onSave: (data: NewReview) => void;
  onComplete: (
    id: string,
    data: {
      rating: PerformanceRating;
      strengths?: string;
      improvements?: string;
      comments?: string;
    },
  ) => void;
}

const defaultForm = {
  employeeName: "",
  employeeInitials: "",
  department: "",
  jobTitle: "",
  reviewType: "",
  period: "",
  reviewer: "",
  dueDate: "",
};

export function ReviewModal({
  open,
  onClose,
  viewingReview,
  onSave,
  onComplete,
}: ReviewModalProps) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rating, setRating] = useState<PerformanceRating | null>(null);
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [comments, setComments] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setForm(defaultForm);
      setErrors({});
      setRating(null);
      setStrengths("");
      setImprovements("");
      setComments("");
      setHoverRating(0);
    }
  }

  function handleField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleSubmit() {
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
      jobTitle: form.jobTitle,
      reviewType: form.reviewType as ReviewType,
      period: form.period,
      reviewer: form.reviewer,
      dueDate: form.dueDate,
    });
    onClose();
  }

  function handleComplete() {
    if (!viewingReview) return;
    if (!rating) {
      toast.error("Please select a rating before completing the review.");
      return;
    }
    onComplete(viewingReview.id, {
      rating,
      strengths: strengths || undefined,
      improvements: improvements || undefined,
      comments: comments || undefined,
    });
    onClose();
  }

  const isView = !!viewingReview;
  const isCompleted = viewingReview?.status === "completed";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isView ? "Performance Review" : "Add Performance Review"}
          </DialogTitle>
        </DialogHeader>

        {isView && viewingReview ? (
          <>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                {viewingReview.employeeInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {viewingReview.employeeName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {viewingReview.jobTitle} · {viewingReview.department}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${REVIEW_STATUS_STYLES[viewingReview.status]}`}
                >
                  {REVIEW_STATUS_LABELS[viewingReview.status]}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${REVIEW_TYPE_STYLES[viewingReview.reviewType]}`}
                >
                  {REVIEW_TYPE_LABELS[viewingReview.reviewType]}
                </span>
              </div>
            </div>

            <Tabs defaultValue="details">
              <TabsList className="h-8">
                <TabsTrigger value="details" className="text-xs h-7">
                  Details
                </TabsTrigger>
                <TabsTrigger value="assessment" className="text-xs h-7">
                  Assessment
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Period", value: viewingReview.period },
                    { label: "Reviewer", value: viewingReview.reviewer },
                    {
                      label: "Due Date",
                      value: new Date(viewingReview.dueDate).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      ),
                    },
                    {
                      label: "Completed Date",
                      value: viewingReview.completedDate
                        ? new Date(
                            viewingReview.completedDate,
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "—",
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-lg border bg-card">
                      <p className="text-[10px] text-muted-foreground mb-0.5">
                        {label}
                      </p>
                      <p className="text-xs font-medium">{value}</p>
                    </div>
                  ))}
                </div>
                {viewingReview.strengths && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-[10px] text-muted-foreground mb-1">
                      Strengths
                    </p>
                    <p className="text-xs">{viewingReview.strengths}</p>
                  </div>
                )}
                {viewingReview.improvements && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-[10px] text-muted-foreground mb-1">
                      Areas for Improvement
                    </p>
                    <p className="text-xs">{viewingReview.improvements}</p>
                  </div>
                )}
                {viewingReview.rating && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-[10px] text-muted-foreground mb-1">
                      Rating
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= (viewingReview.rating ?? 0)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-muted text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {RATING_LABELS[viewingReview.rating]}
                      </span>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="assessment" className="mt-4">
                {isCompleted ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <p className="text-sm font-medium">Review Completed</p>
                    <p className="text-xs">
                      This review has already been marked as complete.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-72 pr-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">
                          Rating <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onMouseEnter={() => setHoverRating(s)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setRating(s as PerformanceRating)}
                              className="p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  s <= (hoverRating || rating || 0)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            </button>
                          ))}
                          {hoverRating || rating ? (
                            <span className="text-xs text-muted-foreground ml-2">
                              {RATING_LABELS[hoverRating || (rating as number)]}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-1.5">
                        <Label className="text-xs">Strengths</Label>
                        <Textarea
                          placeholder="What did this employee do particularly well?"
                          value={strengths}
                          onChange={(e) => setStrengths(e.target.value)}
                          className="text-xs resize-none min-h-20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Areas for Improvement</Label>
                        <Textarea
                          placeholder="What areas should this employee focus on developing?"
                          value={improvements}
                          onChange={(e) => setImprovements(e.target.value)}
                          className="text-xs resize-none min-h-20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Additional Comments</Label>
                        <Textarea
                          placeholder="Any other observations or recommendations..."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          className="text-xs resize-none min-h-16"
                        />
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>

            {!isCompleted && (
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={handleComplete}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark as Complete
                </Button>
              </DialogFooter>
            )}
          </>
        ) : (
          <>
            <ScrollArea className="max-h-[60vh] pr-2">
              <div className="grid grid-cols-2 gap-4 py-1">
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
                    Job Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Software Engineer"
                    value={form.jobTitle}
                    onChange={(e) => handleField("jobTitle", e.target.value)}
                    className="h-8 text-xs"
                  />
                  {errors.jobTitle && (
                    <p className="text-[10px] text-destructive">
                      {errors.jobTitle}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Review Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.reviewType}
                    onValueChange={(v) => handleField("reviewType", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(REVIEW_TYPE_LABELS) as ReviewType[]).map(
                        (t) => (
                          <SelectItem key={t} value={t} className="text-xs">
                            {REVIEW_TYPE_LABELS[t]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  {errors.reviewType && (
                    <p className="text-[10px] text-destructive">
                      {errors.reviewType}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Period <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. FY 2025 or Q1 2026"
                    value={form.period}
                    onChange={(e) => handleField("period", e.target.value)}
                    className="h-8 text-xs"
                  />
                  {errors.period && (
                    <p className="text-[10px] text-destructive">
                      {errors.period}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Reviewer <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Reviewer name"
                    value={form.reviewer}
                    onChange={(e) => handleField("reviewer", e.target.value)}
                    className="h-8 text-xs"
                  />
                  {errors.reviewer && (
                    <p className="text-[10px] text-destructive">
                      {errors.reviewer}
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
                Create Review
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
