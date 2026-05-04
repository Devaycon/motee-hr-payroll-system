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
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import { ARTICLE_CATEGORY_OPTIONS, ARTICLE_STATUS_OPTIONS } from "../data";
import type {
  KnowledgeArticle,
  NewArticle,
  ArticleCategory,
  ArticleStatus,
} from "../types";

const articleSchema = z.object({
  title: z
    .string()
    .min(5, { message: "Title must be at least 5 characters." })
    .max(200, { message: "Title must be 200 characters or fewer." }),
  body: z
    .string()
    .min(50, { message: "Body must be at least 50 characters." })
    .max(10000, { message: "Body must be 10,000 characters or fewer." }),
  category: z.enum(
    [
      "policies",
      "benefits",
      "it_systems",
      "leave",
      "payroll",
      "onboarding",
      "career",
      "general_hr",
    ],
    { message: "Please select a category." },
  ),
  status: z.enum(["draft", "published", "archived"], {
    message: "Please select a status.",
  }),
  tags: z.string(),
  isFeatured: z.boolean(),
});

type FormErrors = Partial<Record<keyof z.infer<typeof articleSchema>, string>>;

interface ArticleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editArticle: KnowledgeArticle | null;
  onSubmit: (data: NewArticle) => void;
}

const DEFAULT_FORM = {
  title: "",
  body: "",
  category: "" as ArticleCategory | "",
  status: "draft" as ArticleStatus,
  tags: "",
  isFeatured: false,
};

export function ArticleFormModal({
  open,
  onOpenChange,
  editArticle,
  onSubmit,
}: ArticleFormModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      if (editArticle) {
        setForm({
          title: editArticle.title,
          body: editArticle.body ?? "",
          category: editArticle.category,
          status: editArticle.status,
          tags: editArticle.tags.join(", "),
          isFeatured: editArticle.isFeatured ?? false,
        });
      } else {
        setForm(DEFAULT_FORM);
      }
      setErrors({});
    }
  }

  function handleChange(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = articleSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        if (field) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({
      title: form.title,
      body: form.body,
      category: form.category as ArticleCategory,
      status: form.status as ArticleStatus,
      tags,
      isFeatured: form.isFeatured,
    });
    toast.success(editArticle ? "Article updated." : "Article created.");
    onOpenChange(false);
  }

  const isEdit = !!editArticle;
  const bodyLength = form.body.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh]">
        <div className="px-6 pt-6 pb-4 border-b border-border pr-14">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Article" : "New Article"}</DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <form
            id="kb-article-form"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="kb-title">Title</Label>
              <Input
                id="kb-title"
                placeholder="e.g. Remote Working Policy"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                maxLength={200}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="kb-body">Body</Label>
                <span
                  className={`text-xs ${bodyLength > 9500 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {bodyLength.toLocaleString()} / 10,000
                </span>
              </div>
              <Textarea
                id="kb-body"
                placeholder="Write the full article content here. Separate paragraphs with a blank line."
                value={form.body}
                onChange={(e) => handleChange("body", e.target.value)}
                rows={10}
                maxLength={10000}
                className="resize-y"
              />
              {errors.body && (
                <p className="text-xs text-destructive">{errors.body}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => handleChange("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTICLE_CATEGORY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-destructive">{errors.category}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => handleChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTICLE_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-xs text-destructive">{errors.status}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="kb-tags">Tags</Label>
              <Input
                id="kb-tags"
                placeholder="e.g. remote work, hybrid, policy (comma-separated)"
                value={form.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple tags with commas.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Feature this article
                </p>
                <p className="text-xs text-muted-foreground">
                  Featured articles are pinned at the top of the browse view.
                </p>
              </div>
              <Switch
                checked={form.isFeatured}
                onCheckedChange={(v) => handleChange("isFeatured", v)}
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleChange("status", "draft");
              setTimeout(() => {
                document.getElementById("kb-form-submit")?.click();
              }, 0);
            }}
          >
            Save as Draft
          </Button>
          <Button
            id="kb-form-submit"
            type="submit"
            form="kb-article-form"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {form.status === "published" || (!isEdit && form.status !== "draft")
              ? "Publish"
              : isEdit
                ? "Save Changes"
                : "Create Article"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
