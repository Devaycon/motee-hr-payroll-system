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
import type { AccessLevel } from "../types";

interface AccessLevelsListProps {
  levels: AccessLevel[];
  onView: (level: AccessLevel) => void;
  onEdit: (level: AccessLevel) => void;
  onDuplicate: (level: AccessLevel) => void;
  onDelete: (id: string) => void;
}

export function AccessLevelsList({
  levels,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
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
}

function AccessLevelCard({
  level,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: AccessLevelCardProps) {
  const totalModules = level.permissions.filter(
    (p) => p.actions.length > 0,
  ).length;
  const totalActions = level.permissions.reduce(
    (sum, p) => sum + p.actions.length,
    0,
  );

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
            <Badge
              variant="secondary"
              className={`mt-0.5 px-1.5 py-px text-[10px] ${
                level.kind === "default"
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400"
                  : "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400"
              }`}
            >
              {level.kind === "default" ? "Default" : "Custom"}
            </Badge>
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
            <DropdownMenuItem onClick={() => onDuplicate(level)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              disabled={level.kind === "default"}
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

      <div className="mt-3 border-t border-border/40 pt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Modified {level.lastModifiedAt} by {level.lastModifiedBy}
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
