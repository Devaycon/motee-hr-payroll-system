"use client";

import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
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
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { cn } from "@/src/lib/utils";
import {
  RESPONSIBLE_PARTY_LABELS,
  RESPONSIBLE_PARTY_STYLES,
  formatDueDateRule,
} from "../data";
import type { ChecklistItem, DueDateRule } from "../types";

interface ChecklistTableProps {
  items: ChecklistItem[];
  onEdit: (item: ChecklistItem) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

export function ChecklistTable({
  items,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ChecklistTableProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <ClipboardList className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No checklist items yet
          </p>
          <p className="text-xs text-muted-foreground">
            Add tasks to build your onboarding template.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-8">
                  #
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Task Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Responsible Party
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Due Date Rule
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Required
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={cn(
                    "hover:bg-muted/40 transition-colors",
                    idx !== items.length - 1 && "border-b border-border",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => onMoveUp(item.id)}
                        disabled={idx === 0}
                        className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <span className="text-xs text-muted-foreground text-center">
                        {item.order}
                      </span>
                      <button
                        onClick={() => onMoveDown(item.id)}
                        disabled={idx === items.length - 1}
                        className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-sm">
                      {item.taskName}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-medium",
                        RESPONSIBLE_PARTY_STYLES[item.responsibleParty],
                      )}
                    >
                      {RESPONSIBLE_PARTY_LABELS[item.responsibleParty]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-foreground">
                      {formatDueDateRule(
                        item.dueDateRule as DueDateRule,
                        item.dueDateOffset,
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-medium",
                        item.isRequired
                          ? "border-red-500/30 bg-red-500/10 text-red-600"
                          : "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {item.isRequired ? "Required" : "Optional"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 max-w-56">
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          className="text-xs gap-2"
                          onClick={() => onEdit(item)}
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-xs gap-2 text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;
                                {item.taskName}&quot;? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(item.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
