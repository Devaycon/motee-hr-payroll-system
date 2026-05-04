"use client";

import { useState } from "react";
import { z } from "zod/v4";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  TICKET_CATEGORY_CONFIG,
  TICKET_CATEGORY_OPTIONS,
  TICKET_PRIORITY_CONFIG,
  TICKET_PRIORITY_OPTIONS,
} from "../data";
import type { NewTicket, TicketCategory, TicketPriority } from "../types";

const newCaseSchema = z.object({
  subject: z
    .string({ message: "Subject is required" })
    .min(5, { message: "Subject must be at least 5 characters" })
    .max(150, { message: "Subject must be at most 150 characters" }),
  description: z
    .string({ message: "Description is required" })
    .min(20, { message: "Description must be at least 20 characters" })
    .max(2000, { message: "Description must be at most 2000 characters" }),
  category: z.enum(
    ["leave", "payroll", "benefits", "policy", "it", "general_hr"],
    { message: "Please select a category" },
  ),
  priority: z.enum(["low", "normal", "high", "critical"], {
    message: "Please select a priority",
  }),
});

type FormErrors = Partial<Record<keyof z.infer<typeof newCaseSchema>, string>>;

interface NewCaseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewTicket) => void;
  submitterName?: string;
  submitterInitials?: string;
  submitterDept?: string;
}

export function NewCaseModal({
  open,
  onClose,
  onSubmit,
  submitterName = "HR Admin",
  submitterInitials = "HA",
  submitterDept = "Human Resources",
}: NewCaseModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSubject("");
      setDescription("");
      setCategory("");
      setPriority("");
      setErrors({});
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = newCaseSchema.safeParse({
      subject,
      description,
      category,
      priority,
    });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    onSubmit({
      subject: result.data.subject,
      description: result.data.description,
      category: result.data.category as TicketCategory,
      priority: result.data.priority as TicketPriority,
      submitterName,
      submitterInitials,
      submitterDept,
    });
    toast.success("Case submitted — a reference number has been assigned.");
    setSubmitting(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a New Case</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="case-subject" className="text-sm font-medium">
              Subject
            </Label>
            <Input
              id="case-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your query or request"
              className={errors.subject ? "border-destructive" : ""}
            />
            {errors.subject && (
              <p className="text-xs text-destructive">{errors.subject}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="case-description" className="text-sm font-medium">
                Description
              </Label>
              <span
                className={`text-xs ${
                  description.length > 1900
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {description.length}/2000
              </span>
            </div>
            <Textarea
              id="case-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue or request in detail. Include any relevant dates, amounts, or context."
              className={`min-h-28 resize-none text-sm ${
                errors.description ? "border-destructive" : ""
              }`}
              maxLength={2000}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as TicketCategory)}
              >
                <SelectTrigger
                  className={errors.category ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {TICKET_CATEGORY_CONFIG[c].icon}{" "}
                      {TICKET_CATEGORY_CONFIG[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TicketPriority)}
              >
                <SelectTrigger
                  className={errors.priority ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {TICKET_PRIORITY_CONFIG[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-xs text-destructive">{errors.priority}</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border px-3 py-2.5 bg-muted space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Submitting as
            </p>
            <p className="text-sm font-medium text-foreground">
              {submitterName}{" "}
              <span className="text-muted-foreground font-normal">
                &bull; {submitterDept}
              </span>
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              Submit Case
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
