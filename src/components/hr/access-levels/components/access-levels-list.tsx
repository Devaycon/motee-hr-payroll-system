"use client";

import {
  Users,
  Calendar,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  Trash2,
  ShieldCheck,
  Layers,
  Lock,
  Power,
  PowerOff,
  Database,
  History,
  UserPlus,
  ScanEye,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { useState } from "react";
import {
  ACCESS_LEVEL_STATUS_LABELS,
  ACCESS_LEVEL_STATUS_STYLES,
  DATA_SCOPE_LABELS,
  type AccessLevel,
  type AccessLevelStatus,
  type DataScope,
} from "../types";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useAllBranches } from "@/src/lib/branches/use-branch";

interface AccessLevelsListProps {
  levels: AccessLevel[];
  onView: (level: AccessLevel) => void;
  onEdit: (level: AccessLevel) => void;
  onDuplicate: (level: AccessLevel) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: AccessLevelStatus) => void;
  /** §1.10 — start previewing the app as this role. */
  onPreview: (level: AccessLevel) => void;
}

export function AccessLevelsList({
  levels,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onSetStatus,
  onPreview,
}: AccessLevelsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (levels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
        <ShieldCheck className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">No roles found</p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Try a different search or create a new access level
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {levels.map((level) => (
          <AccessLevelCard
            key={level.id}
            level={level}
            onView={onView}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={(id) => setDeleteId(id)}
            onSetStatus={onSetStatus}
            onPreview={onPreview}
          />
        ))}
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Access Level</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this access level. Users assigned to
              it will need to be reassigned. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface AccessLevelCardProps {
  level: AccessLevel;
  onView: (level: AccessLevel) => void;
  onEdit: (level: AccessLevel) => void;
  onDuplicate: (level: AccessLevel) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: AccessLevelStatus) => void;
  onPreview: (level: AccessLevel) => void;
}

/**
 * The branches or departments a list-based scope names, or null when the kind
 * carries no list. An empty list is meaningful rather than missing: the role is
 * confined to whichever branch/department its holder belongs to.
 */
function useScopeTargetLabel(scope: DataScope): string | null {
  const branches = useAllBranches();
  const departments = useAppSelector((s) => s.locale.data?.departments);

  if (scope.kind === "branch") {
    const ids = scope.branchIds ?? [];
    if (ids.length === 0) return "the holder's own branch";
    return branches
      .filter((b) => ids.includes(b.id))
      .map((b) => b.name)
      .join(", ");
  }
  if (scope.kind === "department") {
    const ids = scope.departmentIds ?? [];
    if (ids.length === 0) return "the holder's own department";
    return (departments ?? [])
      .filter((d) => ids.includes(d.id))
      .map((d) => d.name)
      .join(", ");
  }
  return null;
}

function AccessLevelCard({
  level,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onSetStatus,
  onPreview,
}: AccessLevelCardProps) {
  const totalModules = level.permissions.filter(
    (p) => p.actions.length > 0,
  ).length;
  const totalActions = level.permissions.reduce(
    (sum, p) => sum + p.actions.length,
    0,
  );
  const scopeTargets = useScopeTargetLabel(level.dataScope);

  return (
    <div className="group relative flex flex-col rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              level.kind === "default"
                ? "bg-indigo-100 dark:bg-indigo-950/60"
                : "bg-violet-100 dark:bg-violet-950/60"
            }`}
          >
            {level.kind === "default" ? (
              <ShieldCheck
                className={`h-5 w-5 ${
                  level.kind === "default"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-violet-600 dark:text-violet-400"
                }`}
              />
            ) : (
              <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {level.name}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1">
              <Badge
                variant="secondary"
                className={`px-1.5 py-px text-[10px] ${
                  level.kind === "default"
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400"
                    : "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400"
                }`}
              >
                {level.kind === "default" ? "System" : "Custom"}
              </Badge>
              {/* §1.7 — status sits next to the kind, since both govern
                  whether the role can be handed to anyone. */}
              <Badge
                variant="outline"
                className={`px-1.5 py-px text-[10px] ${ACCESS_LEVEL_STATUS_STYLES[level.status]}`}
              >
                {ACCESS_LEVEL_STATUS_LABELS[level.status]}
              </Badge>
              {/* §1.9 — locked roles are protected from deletion. */}
              {level.kind === "default" && (
                <span
                  className="flex items-center gap-0.5 text-[10px] text-muted-foreground"
                  title="System role — can be cloned and edited, but not deleted"
                >
                  <Lock className="h-2.5 w-2.5" />
                  Locked
                </span>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(level)}>
              <Eye className="mr-2 h-4 w-4" />
              View Permissions
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(level)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {/* §1.1 — cloning is the sanctioned way to start from a system
                role rather than building one from scratch. */}
            <DropdownMenuItem onClick={() => onDuplicate(level)}>
              <Copy className="mr-2 h-4 w-4" />
              Clone Role
            </DropdownMenuItem>
            {/* §1.10 — reading a permissions matrix tells you what was ticked;
                previewing tells you what the person actually ends up seeing. */}
            <DropdownMenuItem
              disabled={level.status !== "active"}
              title={
                level.status !== "active"
                  ? "Only active roles can be previewed — an inactive role grants nothing"
                  : undefined
              }
              onClick={() => onPreview(level)}
            >
              <ScanEye className="mr-2 h-4 w-4" />
              Test as This Role
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                onSetStatus(
                  level.id,
                  level.status === "active" ? "inactive" : "active",
                )
              }
            >
              {level.status === "active" ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Deactivate Role
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Activate Role
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              disabled={level.kind === "default"}
              title={
                level.kind === "default"
                  ? "System roles can't be deleted — clone or deactivate instead"
                  : undefined
              }
              onClick={() => onDelete(level.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
        {level.description}
      </p>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {level.employeeCount} user{level.employeeCount !== 1 ? "s" : ""}
        </span>
        <span>{totalModules} modules</span>
        <span>{totalActions} permissions</span>
      </div>

      {/* §1.4 — the record-level restriction, which module counts don't convey.
          A list-based scope names its targets: "Assigned branches" on its own
          says nothing about how much the role can actually reach. */}
      <div className="mt-3 flex items-start gap-1 text-[11px] text-muted-foreground">
        <Database className="mt-0.5 h-3 w-3 shrink-0" />
        <span>
          Data access: {DATA_SCOPE_LABELS[level.dataScope.kind]}
          {scopeTargets && (
            <span className="text-foreground"> — {scopeTargets}</span>
          )}
        </span>
      </div>

      {/* §1.8 — usage signals that make an obsolete role obvious. */}
      <div className="mt-3 space-y-1 border-t border-border/40 pt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Modified {level.lastModifiedAt} by {level.lastModifiedBy}
        </span>
        <span className="flex items-center gap-1">
          <UserPlus className="h-3 w-3" />
          Created {level.createdAt} by {level.createdBy}
        </span>
        <span
          className={`flex items-center gap-1 ${
            !level.lastUsedAt && level.employeeCount === 0
              ? "text-amber-600 dark:text-amber-400"
              : ""
          }`}
        >
          <History className="h-3 w-3" />
          {level.lastUsedAt
            ? `Last assigned ${level.lastUsedAt}`
            : level.employeeCount === 0
              ? "Never assigned — possibly obsolete"
              : "No assignment recorded"}
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full text-xs"
        onClick={() => onView(level)}
      >
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        View Permissions Matrix
      </Button>
    </div>
  );
}
