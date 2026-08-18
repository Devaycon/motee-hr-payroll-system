"use client";

import { useMemo, useState } from "react";
import { z } from "zod/v4";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronRight, Search } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  ALL_MODULES,
  ALL_ACTIONS,
  MODULE_LABELS,
  MODULE_GROUPS,
  modulesByGroup,
  ACTION_LABELS,
  buildEmptyPermissions,
} from "../data";
import {
  ACTION_DEPENDENCIES,
  withDependencies,
  DATA_SCOPE_LABELS,
  DATA_SCOPE_DESCRIPTIONS,
  ACCESS_LEVEL_STATUS_LABELS,
  type AccessLevel,
  type AccessLevelStatus,
  type DataScope,
  type DataScopeKind,
  type NewAccessLevel,
  type ModulePermission,
  type PermissionAction,
} from "../types";
import { cn } from "@/src/lib/utils";

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
  const [moduleSearch, setModuleSearch] = useState("");
  const [status, setStatus] = useState<AccessLevelStatus>("active");
  const [dataScope, setDataScope] = useState<DataScope>({ kind: "all" });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(MODULE_GROUPS.map((g) => [g, true])),
  );

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setModuleSearch("");
      if (editingLevel) {
        setName(editingLevel.name);
        setDescription(editingLevel.description);
        setStatus(editingLevel.status ?? "active");
        setDataScope(editingLevel.dataScope ?? { kind: "all" });
        const filled = ALL_MODULES.map((module) => {
          const existing = editingLevel.permissions.find(
            (p) => p.module === module,
          );
          return {
            module,
            access: existing?.access ?? false,
            actions: existing?.actions ?? [],
          };
        });
        setPermissions(filled);
      } else {
        setName("");
        setDescription("");
        // A brand-new role starts as a draft so it isn't assignable until
        // someone has actually reviewed what it grants (§1.7).
        setStatus("draft");
        setDataScope({ kind: "all" });
        setPermissions(buildEmptyPermissions());
      }
      setErrors({});
    }
  }

  const grouped = useMemo(() => modulesByGroup(), []);

  /**
   * Matrix search (client feedback §1.12). This filters only what is rendered —
   * `permissions` always holds every module, so a hidden row keeps whatever was
   * ticked rather than being cleared when the search narrows.
   */
  const visibleByGroup = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return grouped;
    const out = {} as typeof grouped;
    for (const g of MODULE_GROUPS) {
      out[g] = grouped[g].filter(
        (m) =>
          MODULE_LABELS[m.id].toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q),
      );
    }
    return out;
  }, [grouped, moduleSearch]);

  const searching = moduleSearch.trim().length > 0;
  const matchCount = MODULE_GROUPS.reduce(
    (n, g) => n + visibleByGroup[g].length,
    0,
  );

  function setRow(
    module: string,
    updater: (row: ModulePermission) => ModulePermission,
  ) {
    setPermissions((prev) =>
      prev.map((p) => (p.module === module ? updater(p) : p)),
    );
  }

  function toggleAccess(module: string, checked: boolean) {
    setRow(module, (row) => ({
      ...row,
      access: checked,
      actions: checked && row.actions.length === 0 ? ["view"] : row.actions,
    }));
  }

  /**
   * §1.11 — permissions carry dependencies. Ticking "Approve" pulls in "View",
   * because an approver who can't open the queue can't approve anything; and
   * un-ticking "View" drops everything that relied on it rather than leaving a
   * grant that silently does nothing.
   */
  function toggleAction(module: string, action: PermissionAction) {
    setRow(module, (row) => {
      if (!row.access) return row;
      const has = row.actions.includes(action);
      if (!has) {
        return { ...row, actions: withDependencies([...row.actions, action]) };
      }
      const dropped = new Set<PermissionAction>([action]);
      // Cascade: anything depending on this action goes too.
      let changed = true;
      while (changed) {
        changed = false;
        for (const a of row.actions) {
          if (dropped.has(a)) continue;
          const deps = ACTION_DEPENDENCIES[a] ?? [];
          if (deps.some((d) => dropped.has(d))) {
            dropped.add(a);
            changed = true;
          }
        }
      }
      return { ...row, actions: row.actions.filter((a) => !dropped.has(a)) };
    });
  }

  function toggleAllActions(module: string, checked: boolean) {
    setRow(module, (row) => ({
      ...row,
      access: row.access || checked,
      actions: checked ? [...ALL_ACTIONS] : [],
    }));
  }

  function setGroupAccess(group: string, checked: boolean) {
    setPermissions((prev) =>
      prev.map((p) => {
        // While searching, "Select group" applies to the rows on screen only —
        // silently toggling modules the user can't see would be a trap.
        const inGroup = visibleByGroup[group as keyof typeof grouped]?.some(
          (m) => m.id === p.module,
        );
        if (!inGroup) return p;
        return {
          ...p,
          access: checked,
          actions: checked
            ? p.actions.length === 0
              ? ["view"]
              : p.actions
            : [],
        };
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

    const data: NewAccessLevel = {
      name,
      description,
      status,
      dataScope,
      permissions,
    };
    if (editingLevel) {
      onSave({
        ...editingLevel,
        name,
        description,
        status,
        dataScope,
        permissions,
      } as AccessLevel);
      toast.success("Access level updated");
    } else {
      onSave(data);
      toast.success("Access level created");
    }
    onOpenChange(false);
  }

  const totalEnabled = permissions.filter((p) => p.access).length;
  const totalActions = permissions.reduce(
    (s, p) => s + (p.access ? p.actions.length : 0),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border pr-14">
          <DialogTitle>
            {editingLevel ? "Edit Access Level" : "Create Access Level"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          <div className="gap-4 flex flex-col">
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
            <div className="space-y-1.5">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* §1.7 — only Active roles can be assigned to anyone. */}
              <div className="space-y-1.5">
                <Label htmlFor="role-status">Role Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as AccessLevelStatus)}
                >
                  <SelectTrigger id="role-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(
                        ACCESS_LEVEL_STATUS_LABELS,
                      ) as AccessLevelStatus[]
                    ).map((s) => (
                      <SelectItem key={s} value={s}>
                        {ACCESS_LEVEL_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Only Active roles can be assigned to employees.
                </p>
              </div>

              {/* §1.4 — which records, as opposed to which modules. */}
              <div className="space-y-1.5">
                <Label htmlFor="role-scope">Data Access</Label>
                <Select
                  value={dataScope.kind}
                  onValueChange={(v) =>
                    setDataScope({ kind: v as DataScopeKind })
                  }
                >
                  <SelectTrigger id="role-scope" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DATA_SCOPE_LABELS) as DataScopeKind[]).map(
                      (k) => (
                        <SelectItem key={k} value={k}>
                          {DATA_SCOPE_LABELS[k]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {DATA_SCOPE_DESCRIPTIONS[dataScope.kind]}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="permission-search">Permissions Matrix</Label>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="permission-search"
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Search modules…"
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
            {searching && (
              <p className="text-[11px] text-muted-foreground">
                {matchCount} module{matchCount === 1 ? "" : "s"} match “
                {moduleSearch.trim()}”. Permissions on hidden modules are kept.
              </p>
            )}
            <div className="space-y-3">
              {MODULE_GROUPS.map((group) => {
                const modulesInGroup = visibleByGroup[group];
                // A group with no matches has nothing to show while searching.
                if (searching && modulesInGroup.length === 0) return null;
                const enabledInGroup = modulesInGroup.filter((m) =>
                  permissions.find((p) => p.module === m.id)?.access,
                ).length;
                const allOn = enabledInGroup === modulesInGroup.length;
                // A search result the user has to expand to see isn't a result.
                const expanded = searching || openGroups[group];
                return (
                  <div
                    key={group}
                    className="rounded-lg border border-border overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((p) => ({ ...p, [group]: !p[group] }))
                      }
                      className="w-full flex items-center justify-between bg-muted/40 px-4 py-2.5 hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {expanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-sm font-semibold text-foreground">
                          {group}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {enabledInGroup}/{modulesInGroup.length} enabled
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGroupAccess(group, !allOn);
                          }}
                        >
                          {allOn ? "Clear group" : "Select group"}
                        </Button>
                      </div>
                    </button>

                    {expanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-t border-border bg-background">
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Module
                              </th>
                              <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                                Access
                              </th>
                              <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                                All
                              </th>
                              {ALL_ACTIONS.map((a) => (
                                <th
                                  key={a}
                                  className="px-3 py-2 text-center font-medium text-muted-foreground"
                                >
                                  {ACTION_LABELS[a]}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {modulesInGroup.map((m) => {
                              const row = permissions.find(
                                (p) => p.module === m.id,
                              )!;
                              const allChecked =
                                row.actions.length === ALL_ACTIONS.length;
                              return (
                                <tr
                                  key={m.id}
                                  className={cn(
                                    "transition-colors hover:bg-muted/30",
                                    !row.access && "bg-muted/10",
                                  )}
                                >
                                  <td
                                    className={cn(
                                      "px-3 py-2.5 font-medium",
                                      row.access
                                        ? "text-foreground"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {MODULE_LABELS[m.id]}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <Checkbox
                                      checked={row.access}
                                      onCheckedChange={(v) =>
                                        toggleAccess(m.id, !!v)
                                      }
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <Checkbox
                                      checked={allChecked && row.access}
                                      disabled={!row.access}
                                      onCheckedChange={(v) =>
                                        toggleAllActions(m.id, !!v)
                                      }
                                    />
                                  </td>
                                  {ALL_ACTIONS.map((a) => (
                                    <td
                                      key={a}
                                      className="px-3 py-2.5 text-center"
                                    >
                                      <Checkbox
                                        checked={row.actions.includes(a)}
                                        disabled={!row.access}
                                        onCheckedChange={() =>
                                          toggleAction(m.id, a)
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              {totalEnabled} modules enabled
            </span>
            <span>{totalActions} actions selected</span>
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
