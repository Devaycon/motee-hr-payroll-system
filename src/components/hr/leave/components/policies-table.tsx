"use client";

import { useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  BookOpen,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
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
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_STYLES } from "../data";
import type { LeavePolicy, LeaveTypeName } from "../types";

interface PoliciesTableProps {
  policies: LeavePolicy[];
  onEdit: (policy: LeavePolicy) => void;
  onDelete: (id: string) => void;
  onAddPolicy: () => void;
}

export function PoliciesTable({
  policies,
  onEdit,
  onDelete,
  onAddPolicy,
}: PoliciesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <>
      <div className="flex items-center justify-end">
        <Button size="lg" onClick={onAddPolicy}>
          <Plus className="w-3.5 h-3.5" />
          Add Policy
        </Button>
      </div>

      <Card className="mt-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Policy Name
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Leave Type
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Max Days/Year
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Min Notice
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Max Consecutive
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Med. Cert
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Carry Over
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {policies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <BookOpen className="w-8 h-8 opacity-30" />
                        <p className="text-sm font-medium">
                          No policies created
                        </p>
                        <p className="text-xs">
                          Create leave policies to define entitlements and rules
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  policies.map((policy) => (
                    <tr
                      key={policy.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-medium">{policy.name}</p>
                          {policy.description && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 max-w-56 truncate">
                              {policy.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${LEAVE_TYPE_STYLES[policy.leaveType as LeaveTypeName]}`}
                        >
                          {LEAVE_TYPE_LABELS[policy.leaveType as LeaveTypeName]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium">
                          {policy.maxDaysPerYear} days
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {policy.minNoticeDays === 0
                            ? "None"
                            : `${policy.minNoticeDays} day${policy.minNoticeDays !== 1 ? "s" : ""}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {policy.maxConsecutiveDays} days
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {policy.requiresMedicalCertificate ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-muted-foreground/40" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {policy.carryOverAllowed ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Up to {policy.maxCarryOverDays}d
                          </span>
                        ) : (
                          <X className="w-3.5 h-3.5 text-muted-foreground/40" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              className="text-xs gap-2"
                              onClick={() => onEdit(policy)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs gap-2 text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(policy.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this leave policy. Existing leave
              balances will not be affected. This action cannot be undone.
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
