"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  findConflicts,
  findScopeConflict,
  resolveEffectiveLevel,
} from "@/src/lib/permissions/resolve";
import { getModuleById } from "@/src/lib/permissions/modules";
import {
  ACCESS_LEVEL_STATUS_LABELS,
  DATA_SCOPE_LABELS,
} from "@/src/lib/types/access-levels";
import type { UserAccount } from "@/src/lib/types/users";

interface AssignRolesModalProps {
  account: UserAccount | null;
  onClose: () => void;
  onSave: (accessLevelIds: string[]) => void;
}

/**
 * §1.13 — assigning several roles to one account.
 *
 * The live preview underneath is the point. Combining roles is easy to do and
 * hard to reason about, so the modal shows what the combination actually
 * resolves to — including which role is the reason for each contested
 * permission — before it is saved rather than after.
 */
export function AssignRolesModal({
  account,
  onClose,
  onSave,
}: AssignRolesModalProps) {
  const levels = useAppSelector((s) => s.accessLevels.levels);
  const [selected, setSelected] = useState<string[]>([]);
  const [seededFor, setSeededFor] = useState<string | null>(null);

  // Re-seed when a different account is opened, without an effect.
  if (account && account.id !== seededFor) {
    setSeededFor(account.id);
    setSelected(account.accessLevelIds);
  }

  const chosenLevels = useMemo(
    () => levels.filter((l) => selected.includes(l.id)),
    [levels, selected],
  );

  const effective = useMemo(
    () => resolveEffectiveLevel(levels, { accessLevelIds: selected }),
    [levels, selected],
  );

  const conflicts = useMemo(
    () => findConflicts(chosenLevels),
    [chosenLevels],
  );
  const scopeConflict = useMemo(
    () => findScopeConflict(chosenLevels),
    [chosenLevels],
  );

  if (!account) return null;

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleSave() {
    if (selected.length === 0) {
      toast.error("An account needs at least one role.");
      return;
    }
    onSave(selected);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign roles — {account.name}</DialogTitle>
          <DialogDescription>
            The first role selected becomes the primary. Permissions combine;
            data access takes the narrowest.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[24rem] space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            {levels.map((level) => {
              const disabled = (level.status ?? "active") !== "active";
              return (
                <label
                  key={level.id}
                  className={`flex items-start gap-2 rounded-md border border-border/60 p-2 text-xs ${
                    disabled ? "opacity-60" : "cursor-pointer"
                  }`}
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={selected.includes(level.id)}
                    disabled={disabled}
                    onCheckedChange={() => !disabled && toggle(level.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-foreground">
                        {level.name}
                      </span>
                      {selected[0] === level.id && (
                        <Badge variant="secondary" className="text-[10px]">
                          Primary
                        </Badge>
                      )}
                      {disabled && (
                        <Badge variant="outline" className="text-[10px]">
                          {ACCESS_LEVEL_STATUS_LABELS[level.status]} — cannot be
                          assigned
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {level.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Data access: {DATA_SCOPE_LABELS[level.dataScope.kind]}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {selected.length > 1 && (
            <>
              <Separator />
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-semibold text-foreground">
                    Combined effect
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Data access resolves to{" "}
                  <span className="font-medium text-foreground">
                    {DATA_SCOPE_LABELS[effective.dataScope.kind]}
                  </span>
                  {scopeConflict &&
                    ` — ${scopeConflict.overridden
                      .map((o) => o.roleName)
                      .join(", ")} asked for broader access and were narrowed.`}
                </p>
                {conflicts.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    These roles agree on every permission.
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">
                      {conflicts.length} permission(s) granted by one role but
                      not another — the grant wins:
                    </p>
                    {conflicts.slice(0, 6).map((c) => (
                      <p
                        key={`${c.moduleId}-${c.action}`}
                        className="text-[10px] text-muted-foreground"
                      >
                        •{" "}
                        <span className="text-foreground">
                          {getModuleById(c.moduleId)?.label ?? c.moduleId}
                        </span>{" "}
                        · {c.action} — from {c.grantedBy.join(", ")}
                      </p>
                    ))}
                    {conflicts.length > 6 && (
                      <p className="text-[10px] text-muted-foreground">
                        …and {conflicts.length - 6} more.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save {selected.length} role{selected.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
