"use client";

import { useState } from "react";
import { z } from "zod";
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
import { Badge } from "@/src/components/ui/badge";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Share2, X, Download, Eye } from "lucide-react";
import type { HRDocument, DocumentPermission, NewShare } from "../types";

const shareSchema = z.object({
  employeeName: z.string().min(2, { message: "Employee name is required." }),
  employeeInitials: z
    .string()
    .min(1, { message: "Initials are required." })
    .max(3, { message: "Max 3 characters." }),
  permission: z.enum(["view_only", "download"], {
    message: "Permission is required.",
  }),
});

type ShareForm = z.infer<typeof shareSchema>;
type ShareErrors = Partial<Record<keyof ShareForm, string>>;

function getInitialForm(): ShareForm {
  return { employeeName: "", employeeInitials: "", permission: "view_only" };
}

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  document: HRDocument | null;
  onShare: (docId: string, data: NewShare) => void;
  onRevokeShare: (docId: string, shareId: string) => void;
}

export function ShareModal({
  open,
  onClose,
  document: doc,
  onShare,
  onRevokeShare,
}: ShareModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevDoc, setPrevDoc] = useState<HRDocument | null>(null);
  const [form, setForm] = useState<ShareForm>(getInitialForm());
  const [errors, setErrors] = useState<ShareErrors>({});

  if (open !== prevOpen || doc !== prevDoc) {
    setPrevOpen(open);
    setPrevDoc(doc);
    if (open) {
      setForm(getInitialForm());
      setErrors({});
    }
  }

  if (!doc) return null;

  function set<K extends keyof ShareForm>(key: K, value: ShareForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleShare() {
    if (!doc) return;
    const result = shareSchema.safeParse(form);
    if (!result.success) {
      const errs: ShareErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ShareForm;
        if (!errs[field]) errs[field] = issue.message;
      }
      setErrors(errs);
      return;
    }
    onShare(doc.id, {
      employeeName: form.employeeName,
      employeeInitials: form.employeeInitials.toUpperCase(),
      permission: form.permission as DocumentPermission,
    });
    setForm(getInitialForm());
    setErrors({});
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-4 text-muted-foreground" />
            Share Document
          </DialogTitle>
          <p className="truncate text-sm text-muted-foreground">{doc.name}</p>
        </DialogHeader>

        <div className="space-y-5 px-6 pb-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add Access
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="emp-name">Employee Name</Label>
                <Input
                  id="emp-name"
                  placeholder="e.g. Fatimah Bello"
                  value={form.employeeName}
                  onChange={(e) => set("employeeName", e.target.value)}
                />
                {errors.employeeName && (
                  <p className="text-xs text-destructive">
                    {errors.employeeName}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-initials">Initials</Label>
                <Input
                  id="emp-initials"
                  placeholder="FB"
                  maxLength={3}
                  value={form.employeeInitials}
                  onChange={(e) =>
                    set("employeeInitials", e.target.value.toUpperCase())
                  }
                />
                {errors.employeeInitials && (
                  <p className="text-xs text-destructive">
                    {errors.employeeInitials}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Permission</Label>
                <Select
                  value={form.permission}
                  onValueChange={(v) =>
                    set("permission", v as DocumentPermission)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view_only">
                      <div className="flex items-center gap-2">
                        <Eye className="size-3.5 text-muted-foreground" />
                        View Only
                      </div>
                    </SelectItem>
                    <SelectItem value="download">
                      <div className="flex items-center gap-2">
                        <Download className="size-3.5 text-muted-foreground" />
                        Download
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.permission && (
                  <p className="text-xs text-destructive">
                    {errors.permission}
                  </p>
                )}
              </div>
            </div>
            <Button size="sm" className="w-full" onClick={handleShare}>
              <Share2 className="mr-2 size-4" />
              Grant Access
            </Button>
          </div>

          {doc.shares.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Access ({doc.shares.length})
              </p>
              <ScrollArea className="max-h-44">
                <div className="space-y-2">
                  {doc.shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {share.employeeInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {share.employeeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Shared {share.sharedAt} by {share.sharedBy}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          share.permission === "download"
                            ? "bg-blue-500/10 text-xs text-blue-600 dark:text-blue-400"
                            : "text-xs"
                        }
                      >
                        {share.permission === "download" ? (
                          <>
                            <Download className="mr-1 size-3" />
                            Download
                          </>
                        ) : (
                          <>
                            <Eye className="mr-1 size-3" />
                            View Only
                          </>
                        )}
                      </Badge>
                      <button
                        onClick={() => onRevokeShare(doc.id, share.id)}
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Revoke access"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
