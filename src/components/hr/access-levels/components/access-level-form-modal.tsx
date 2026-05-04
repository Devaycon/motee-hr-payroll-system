"use client";

import { useState } from "react";
import { z } from "zod/v4";
import { toast } from "sonner";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  ALL_MODULES,
  ALL_ACTIONS,
  MODULE_LABELS,
  ACTION_LABELS,
  buildEmptyPermissions,
} from "../data";
import type {
  AccessLevel,
  NewAccessLevel,
  ModulePermission,
  PermissionAction,
} from "../types";

const formSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(2, { message: "Name must be at least 2 characters" })
    .max(60, { message: "Name cannot exceed 60 characters" }),
  description: z
    .string({ message: "Description is required" })
    .min(10, { message: "Description must be at least 10 characters" })
    .max(300, { message: "Description cannot exceed 300 characters" }),
});

interface AccessLevelFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLevel: AccessLevel | null;
  onSave: (data: NewAccessLevel | AccessLevel) => void;
}

export function AccessLevelFormModal({
  open,
  onOpenChange,
  editingLevel,
  onSave,
}: AccessLevelFormModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<ModulePermission[]>(
    buildEmptyPermissions(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      if (editingLevel) {
        setName(editingLevel.name);
        setDescription(editingLevel.description);
        const filled = ALL_MODULES.map((module) => ({
          module,
          actions:
            editingLevel.permissions.find((p) => p.module === module)
              ?.actions ?? [],
        }));
        setPermissions(filled);
      } else {
        setName("");
        setDescription("");
        setPermissions(buildEmptyPermissions());
      }
      setErrors({});
    }
  }

  function toggleAction(module: string, action: PermissionAction) {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.module !== module) return p;
        const has = p.actions.includes(action);
        const next = has
          ? p.actions.filter((a) => a !== action)
          : [...p.actions, action];
        return { ...p, actions: next };
      }),
    );
  }

  function toggleAllActions(module: string, checked: boolean) {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.module !== module) return p;
        return { ...p, actions: checked ? [...ALL_ACTIONS] : [] };
      }),
    );
  }

  function handleSave() {
    const result = formSchema.safeParse({ name, description });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errs[issue.path[0] as string] = issue.message;
      }
      setErrors(errs);
      return;
    }

    const data: NewAccessLevel = { name, description, permissions };

    if (editingLevel) {
      onSave({
        ...editingLevel,
        name,
        description,
        permissions,
      } as AccessLevel);
      toast.success("Access level updated");
    } else {
      onSave(data);
      toast.success("Access level created");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border pr-14">
          <DialogTitle>
            {editingLevel ? "Edit Access Level" : "Create Access Level"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
          <div className=" gap-4 flex flex-col">
            <div className="space-y-1.5">
              <Label>Role Name</Label>
              <Input
                placeholder="e.g., Finance Analyst"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label>Description</Label>
              <Textarea
                placeholder="What can this role do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Permissions Matrix</Label>
            <div className="overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="sticky top-0 border-b border-border bg-muted">
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                      Module
                    </th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">
                      All
                    </th>
                    {ALL_ACTIONS.map((a) => (
                      <th
                        key={a}
                        className="px-3 py-2.5 text-center font-medium text-muted-foreground"
                      >
                        {ACTION_LABELS[a]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ALL_MODULES.map((module) => {
                    const row = permissions.find((p) => p.module === module)!;
                    const allChecked =
                      row.actions.length === ALL_ACTIONS.length;
                    const someChecked = row.actions.length > 0 && !allChecked;

                    return (
                      <tr
                        key={module}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="px-3 py-2.5 font-medium text-foreground">
                          {MODULE_LABELS[module]}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Checkbox
                            checked={allChecked}
                            data-state={
                              someChecked ? "indeterminate" : undefined
                            }
                            onCheckedChange={(v) =>
                              toggleAllActions(module, !!v)
                            }
                          />
                        </td>
                        {ALL_ACTIONS.map((action) => (
                          <td key={action} className="px-3 py-2.5 text-center">
                            <Checkbox
                              checked={row.actions.includes(action)}
                              onCheckedChange={() =>
                                toggleAction(module, action)
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              {permissions.reduce((s, p) => s + p.actions.length, 0)}{" "}
              permissions selected
            </span>
            <span>
              {permissions.filter((p) => p.actions.length > 0).length} modules
              enabled
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingLevel ? "Save Changes" : "Create Role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
