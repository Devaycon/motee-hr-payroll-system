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
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  SUGGESTION_CATEGORY_CONFIG,
  SUGGESTION_CATEGORY_OPTIONS,
} from "../data";
import type { NewSuggestion, SuggestionCategory } from "../types";

const suggestionSchema = z.object({
  title: z
    .string({ message: "Title is required" })
    .min(5, { message: "Title must be at least 5 characters" })
    .max(100, { message: "Title must be at most 100 characters" }),
  description: z
    .string({ message: "Description is required" })
    .min(20, { message: "Description must be at least 20 characters" })
    .max(1000, { message: "Description must be at most 1000 characters" }),
  category: z.enum(
    [
      "culture",
      "process",
      "benefits",
      "tools",
      "wellbeing",
      "management",
      "other",
    ],
    { message: "Please select a category" },
  ),
  isAnonymous: z.boolean(),
});

type FormErrors = Partial<
  Record<keyof z.infer<typeof suggestionSchema>, string>
>;

interface SuggestionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewSuggestion) => void;
  submitterName?: string;
  submitterDept?: string;
  submitterInitials?: string;
}

export function SuggestionFormModal({
  open,
  onClose,
  onSubmit,
  submitterName = "Admin User",
  submitterDept = "Human Resources",
  submitterInitials = "AU",
}: SuggestionFormModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SuggestionCategory | "">("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle("");
      setDescription("");
      setCategory("");
      setIsAnonymous(false);
      setErrors({});
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = suggestionSchema.safeParse({
      title,
      description,
      category,
      isAnonymous,
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

    const payload: NewSuggestion = {
      title: result.data.title,
      description: result.data.description,
      category: result.data.category as SuggestionCategory,
      isAnonymous: result.data.isAnonymous,
      ...(!result.data.isAnonymous && {
        submitterName,
        submitterDept,
        submitterInitials,
      }),
    };

    onSubmit(payload);
    toast.success("Suggestion submitted successfully");
    setSubmitting(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a Suggestion</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="suggestion-title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="suggestion-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your suggestion a clear, concise title"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="suggestion-description"
                className="text-sm font-medium"
              >
                Description
              </Label>
              <span
                className={`text-xs ${
                  description.length > 950
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {description.length}/1000
              </span>
            </div>
            <Textarea
              id="suggestion-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your suggestion in detail. What problem does it solve? How would it benefit the team?"
              className={`min-h-28 resize-none text-sm ${
                errors.description ? "border-destructive" : ""
              }`}
              maxLength={1000}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as SuggestionCategory)}
            >
              <SelectTrigger
                className={errors.category ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {SUGGESTION_CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {SUGGESTION_CATEGORY_CONFIG[c].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category}</p>
            )}
          </div>

          <div className="rounded-lg border border-border/60 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  Submit Anonymously
                </Label>
                <p className="text-xs text-muted-foreground">
                  Your name will not be visible to anyone
                </p>
              </div>
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Your Name
                  </Label>
                  <Input
                    value={submitterName}
                    readOnly
                    className="text-xs bg-muted/40 text-muted-foreground cursor-default"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Department
                  </Label>
                  <Input
                    value={submitterDept}
                    readOnly
                    className="text-xs bg-muted/40 text-muted-foreground cursor-default"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              Submit Suggestion
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
