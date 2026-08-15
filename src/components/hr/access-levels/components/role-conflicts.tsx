"use client";

import { Database, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { getModuleById } from "@/src/lib/permissions/modules";
import { useRoleConflicts } from "@/src/lib/permissions/use-can";
import { DATA_SCOPE_LABELS } from "../types";

/**
 * §1.13 — what happens when someone holds more than one role.
 *
 * The merge itself is silent by design (permissions union, scope intersects),
 * and a silent merge is exactly what the client objected to: nobody could tell
 * *which* role was the reason a user could delete records. This panel names the
 * culprit for every action the roles disagree on.
 */
export function RoleConflicts() {
  const { permissions, scope, roleNames } = useRoleConflicts();

  if (roleNames.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
        <ShieldCheck className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">
          You hold a single role
        </p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground/70">
          Conflicts only arise when an account holds two or more roles. Assign a
          second role from User Management to see how they combine.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold text-foreground">
          Combining {roleNames.length} roles
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {roleNames.map((name) => (
            <Badge key={name} variant="secondary" className="text-[11px]">
              {name}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Permissions are combined — an action allowed by any one role is
          allowed. Data access works the other way: the{" "}
          <span className="font-medium text-foreground">narrowest</span> scope
          wins, so a second role can never widen whose records you see.
        </p>
      </div>

      {/* Scope resolution first — it governs every module at once. */}
      {scope && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">
              Data access resolved
            </p>
          </div>
          <p className="mt-2 text-sm text-foreground">
            {DATA_SCOPE_LABELS[scope.winner.kind]}
            <span className="text-muted-foreground">
              {" "}
              — from {scope.winnerRoles.join(", ")}
            </span>
          </p>
          <div className="mt-2 space-y-1">
            {scope.overridden.map((o, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                <span className="line-through">
                  {DATA_SCOPE_LABELS[o.scope.kind]}
                </span>{" "}
                requested by {o.roleName} — overridden as it is broader.
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-2 border-b border-border/60 p-4">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-semibold text-foreground">
            Permission conflicts ({permissions.length})
          </p>
        </div>

        {permissions.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            These roles agree on every action. Nothing is being granted by one
            role and withheld by another.
          </p>
        ) : (
          <div className="divide-y divide-border/40">
            {permissions.map((c) => (
              <div
                key={`${c.moduleId}-${c.action}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-xs"
              >
                <span className="min-w-40 font-medium text-foreground">
                  {getModuleById(c.moduleId)?.label ?? c.moduleId}
                </span>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {c.action}
                </Badge>
                <span className="text-emerald-600 dark:text-emerald-400">
                  Granted by {c.grantedBy.join(", ")}
                </span>
                <span className="text-muted-foreground">
                  · not granted by {c.deniedBy.join(", ")}
                </span>
                <span className="ml-auto font-medium text-foreground">
                  Allowed
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
