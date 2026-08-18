"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Shield, ShieldOff, Search } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import {
  ALL_ACTIONS,
  MODULE_LABELS,
  MODULE_GROUPS,
  modulesByGroup,
  ACTION_LABELS,
} from "../data";
import type { AccessLevel } from "../types";
import { cn } from "@/src/lib/utils";

interface PermissionsMatrixModalProps {
  level: AccessLevel | null;
  open: boolean;
  onClose: () => void;
}

export function PermissionsMatrixModal({
  level,
  open,
  onClose,
}: PermissionsMatrixModalProps) {
  const grouped = useMemo(() => modulesByGroup(), []);
  // Matrix search (client feedback §1.12) — the matrix runs to ~40 modules.
  const [search, setSearch] = useState("");

  const visibleByGroup = useMemo(() => {
    const q = search.trim().toLowerCase();
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
  }, [grouped, search]);

  if (!level) return null;

  const searching = search.trim().length > 0;

  function permFor(moduleId: string) {
    return (
      level!.permissions.find((p) => p.module === moduleId) ?? {
        module: moduleId,
        access: false,
        actions: [],
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border pr-14">
          <div className="flex items-center gap-2">
            <DialogTitle>{level.name}</DialogTitle>
            <Badge
              variant="secondary"
              className={`px-1.5 py-px text-[10px] ${
                level.kind === "default"
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400"
                  : "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400"
              }`}
            >
              {level.kind === "default" ? "Default" : "Custom"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{level.description}</p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules…"
              className="h-8 pl-8 text-xs"
              aria-label="Search permission matrix"
            />
          </div>
          {MODULE_GROUPS.map((group) => {
            const modulesInGroup = visibleByGroup[group];
            if (searching && modulesInGroup.length === 0) return null;
            const enabled = modulesInGroup.filter(
              (m) => permFor(m.id).access,
            ).length;
            return (
              <div
                key={group}
                className="rounded-lg border border-border overflow-hidden"
              >
                <div className="flex items-center justify-between bg-muted/40 px-4 py-2">
                  <span className="text-sm font-semibold text-foreground">
                    {group}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {enabled}/{modulesInGroup.length} accessible
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-t border-border bg-background">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Module
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-muted-foreground">
                          Access
                        </th>
                        {ALL_ACTIONS.map((action) => (
                          <th
                            key={action}
                            className="px-4 py-2 text-center font-medium text-muted-foreground"
                          >
                            {ACTION_LABELS[action]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {modulesInGroup.map((m) => {
                        const perm = permFor(m.id);
                        return (
                          <tr
                            key={m.id}
                            className={cn(
                              "transition-colors",
                              perm.access
                                ? "hover:bg-muted/30"
                                : "text-muted-foreground/60 bg-muted/10",
                            )}
                          >
                            <td className="px-4 py-2.5 font-medium">
                              {MODULE_LABELS[m.id]}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {perm.access ? (
                                <Shield className="inline h-4 w-4 text-emerald-500" />
                              ) : (
                                <ShieldOff className="inline h-3.5 w-3.5 text-muted-foreground/40" />
                              )}
                            </td>
                            {ALL_ACTIONS.map((action) => (
                              <td
                                key={action}
                                className="px-4 py-2.5 text-center"
                              >
                                {perm.actions.includes(action) ? (
                                  <Check className="inline h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                                ) : (
                                  <Minus className="inline h-3.5 w-3.5 text-muted-foreground/30" />
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-emerald-500" /> Access on
          </span>
          <span className="flex items-center gap-1">
            <Check className="h-3.5 w-3.5 text-emerald-500" /> Allowed
          </span>
          <span className="flex items-center gap-1">
            <Minus className="h-3.5 w-3.5 text-muted-foreground/40" /> Not
            allowed
          </span>
          <span className="ml-auto">
            Last modified {level.lastModifiedAt} by {level.lastModifiedBy}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
