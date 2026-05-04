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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { FolderPlus } from "lucide-react";
import type { Folder } from "../types";

const folderSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Folder name must be at least 2 characters." }),
  parentId: z.string().optional(),
});

type FolderForm = z.infer<typeof folderSchema>;
type FolderErrors = Partial<Record<keyof FolderForm, string>>;

interface CreateFolderModalProps {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  onSave: (name: string, parentId?: string) => void;
}

export function CreateFolderModal({
  open,
  onClose,
  folders,
  onSave,
}: CreateFolderModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [form, setForm] = useState<FolderForm>({
    name: "",
    parentId: undefined,
  });
  const [errors, setErrors] = useState<FolderErrors>({});

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm({ name: "", parentId: undefined });
      setErrors({});
    }
  }

  function set<K extends keyof FolderForm>(key: K, value: FolderForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit() {
    const result = folderSchema.safeParse(form);
    if (!result.success) {
      const errs: FolderErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FolderForm;
        if (!errs[field]) errs[field] = issue.message;
      }
      setErrors(errs);
      return;
    }
    onSave(
      result.data.name,
      result.data.parentId === "none" ? undefined : result.data.parentId,
    );
  }

  const parentOptions = folders.filter(
    (f) => !f.parentId && f.type !== "custom",
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="size-4 text-muted-foreground" />
            New Folder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="e.g. Compliance Documents"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              Parent Folder{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Select
              value={form.parentId ?? "none"}
              onValueChange={(v) => set("parentId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Root (no parent)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Root (no parent)</SelectItem>
                {parentOptions.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            <FolderPlus className="mr-2 size-4" />
            Create Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
