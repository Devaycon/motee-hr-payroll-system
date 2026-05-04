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
import { Separator } from "@/src/components/ui/separator";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_OPTIONS,
  DEPARTMENT_OPTIONS,
} from "../data";
import type {
  Announcement,
  NewAnnouncement,
  AnnouncementType,
  AnnouncementStatus,
  AnnouncementAudience,
  AnnouncementPriority,
} from "../types";

const schema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  body: z.string().min(10, { message: "Body must be at least 10 characters" }),
  type: z.string().min(1, { message: "Type is required" }),
  status: z.string().min(1, { message: "Status is required" }),
  priority: z.string().min(1, { message: "Priority is required" }),
  audience: z.string().min(1, { message: "Audience is required" }),
  scheduledFor: z.string().optional(),
  expiresAt: z.string().optional(),
  attachmentName: z.string().optional(),
});

type FormValues = {
  title: string;
  body: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  priority: AnnouncementPriority;
  audience: AnnouncementAudience;
  targetDepartments: string[];
  isPinned: boolean;
  requiresAcknowledgement: boolean;
  scheduledFor: string;
  expiresAt: string;
  attachmentName: string;
};

function getDefaults(a: Announcement | null): FormValues {
  if (!a) {
    return {
      title: "",
      body: "",
      type: "general",
      status: "draft",
      priority: "standard",
      audience: "all_staff",
      targetDepartments: [],
      isPinned: false,
      requiresAcknowledgement: false,
      scheduledFor: "",
      expiresAt: "",
      attachmentName: "",
    };
  }
  return {
    title: a.title,
    body: a.body,
    type: a.type,
    status: a.status,
    priority: a.priority,
    audience: a.audience,
    targetDepartments: a.targetDepartments ?? [],
    isPinned: a.isPinned,
    requiresAcknowledgement: a.requiresAcknowledgement,
    scheduledFor: a.scheduledFor ?? "",
    expiresAt: a.expiresAt ?? "",
    attachmentName: a.attachmentName ?? "",
  };
}

interface AnnouncementFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: Announcement | null;
  onSave: (data: NewAnnouncement) => void;
}

export function AnnouncementFormModal({
  open,
  onClose,
  editing,
  onSave,
}: AnnouncementFormModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevEditing, setPrevEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<FormValues>(() => getDefaults(null));
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  if (open !== prevOpen || editing !== prevEditing) {
    setPrevOpen(open);
    setPrevEditing(editing);
    if (open) {
      setForm(getDefaults(editing));
      setErrors({});
    }
  }

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function toggleDepartment(dept: string) {
    setForm((prev) => ({
      ...prev,
      targetDepartments: prev.targetDepartments.includes(dept)
        ? prev.targetDepartments.filter((d) => d !== dept)
        : [...prev.targetDepartments, dept],
    }));
  }

  function handleSave() {
    const result = schema.safeParse({
      title: form.title,
      body: form.body,
      type: form.type,
      status: form.status,
      priority: form.priority,
      audience: form.audience,
      scheduledFor: form.scheduledFor || undefined,
      expiresAt: form.expiresAt || undefined,
      attachmentName: form.attachmentName || undefined,
    });

    if (!result.success) {
      const fieldErrors: Partial<Record<string, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    onSave({
      title: form.title.trim(),
      body: form.body.trim(),
      type: form.type,
      status: form.status,
      priority: form.priority,
      audience: form.audience,
      targetDepartments:
        form.audience === "department" ? form.targetDepartments : undefined,
      isPinned: form.isPinned,
      requiresAcknowledgement: form.requiresAcknowledgement,
      scheduledFor: form.scheduledFor || undefined,
      expiresAt: form.expiresAt || undefined,
      attachmentName: form.attachmentName.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl flex flex-col gap-0 p-0 max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>
            {editing ? "Edit Announcement" : "New Announcement"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="space-y-5 pb-4">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                placeholder="Announcement title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ann-body">Message</Label>
              <Textarea
                id="ann-body"
                placeholder="Write the announcement content..."
                rows={5}
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
              />
              {errors.body && (
                <p className="text-xs text-destructive">{errors.body}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => set("type", v as AnnouncementType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANNOUNCEMENT_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ANNOUNCEMENT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => set("status", v as AnnouncementStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    set("priority", v as AnnouncementPriority)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Audience</Label>
                <Select
                  value={form.audience}
                  onValueChange={(v) =>
                    set("audience", v as AnnouncementAudience)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_staff">All Employees</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="role_specific">Role Specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.audience === "department" && (
              <div className="space-y-2">
                <Label>Target Departments</Label>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-muted/30">
                  {DEPARTMENT_OPTIONS.map((dept) => {
                    const selected = form.targetDepartments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => toggleDepartment(dept)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {dept}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ann-scheduled">Scheduled For</Label>
                <Input
                  id="ann-scheduled"
                  type="date"
                  value={form.scheduledFor}
                  onChange={(e) => set("scheduledFor", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ann-expires">Expires At</Label>
                <Input
                  id="ann-expires"
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => set("expiresAt", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ann-attachment">Attachment Name (optional)</Label>
              <Input
                id="ann-attachment"
                placeholder="e.g. Policy_Document_2025.pdf"
                value={form.attachmentName}
                onChange={(e) => set("attachmentName", e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pin Announcement</Label>
                  <p className="text-xs text-muted-foreground">
                    Pinned items appear at the top of the feed
                  </p>
                </div>
                <Switch
                  checked={form.isPinned}
                  onCheckedChange={(v) => set("isPinned", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Requires Acknowledgement</Label>
                  <p className="text-xs text-muted-foreground">
                    Employees must acknowledge they have read this
                  </p>
                </div>
                <Switch
                  checked={form.requiresAcknowledgement}
                  onCheckedChange={(v) => set("requiresAcknowledgement", v)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {editing ? "Save Changes" : "Create Announcement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
