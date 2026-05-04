"use client";

import { Check, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import {
  ALL_MODULES,
  ALL_ACTIONS,
  MODULE_LABELS,
  ACTION_LABELS,
} from "../data";
import type { AccessLevel } from "../types";

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
  if (!level) return null;

  function hasAction(module: string, action: string) {
    return (
      level!.permissions
        .find((p) => p.module === module)
        ?.actions.includes(action as never) ?? false
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 flex flex-col max-h-[90vh]">
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

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 border-b border-border bg-muted">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                  Module
                </th>
                {ALL_ACTIONS.map((action) => (
                  <th
                    key={action}
                    className="px-5 py-3 text-center font-medium text-muted-foreground"
                  >
                    {ACTION_LABELS[action]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ALL_MODULES.map((module) => {
                const row = level.permissions.find((p) => p.module === module);
                const hasAny = row && row.actions.length > 0;
                return (
                  <tr
                    key={module}
                    className={`transition-colors ${
                      hasAny ? "hover:bg-muted/30" : "text-muted-foreground/50"
                    }`}
                  >
                    <td className="px-5 py-3 font-medium">
                      {MODULE_LABELS[module]}
                    </td>
                    {ALL_ACTIONS.map((action) => (
                      <td key={action} className="px-5 py-3 text-center">
                        {hasAction(module, action) ? (
                          <span className="inline-flex items-center justify-center">
                            <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center">
                            <Minus className="h-3.5 w-3.5 text-muted-foreground/30" />
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
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
