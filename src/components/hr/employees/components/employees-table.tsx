"use client";

import { MoreHorizontal, Users, Eye, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
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
  STATUS_STYLES,
  STATUS_LABELS,
  EMPLOYMENT_TYPE_STYLES,
  EMPLOYMENT_TYPE_LABELS,
  formatDate,
} from "../data";
import type { EmployeeRow } from "../types";

interface EmployeesTableProps {
  employees: EmployeeRow[];
  onEdit: (emp: EmployeeRow) => void;
  onDelete: (id: string) => void;
}

export function EmployeesTable({
  employees,
  onEdit,
  onDelete,
}: EmployeesTableProps) {
  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No employees found
          </p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search or filters.
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
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Employee
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Department
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Job Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Reports To
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Start Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, idx) => (
                <tr
                  key={emp.id}
                  className={cn(
                    "hover:bg-muted/40 transition-colors",
                    idx !== employees.length - 1 && "border-b border-border",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {emp.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {emp.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {emp.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {emp.department}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {emp.jobTitle}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                        EMPLOYMENT_TYPE_STYLES[emp.employmentType],
                      )}
                    >
                      {EMPLOYMENT_TYPE_LABELS[emp.employmentType]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {emp.managerName ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6 shrink-0">
                          <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
                            {emp.managerName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">
                          {emp.managerName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(emp.startDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                        STATUS_STYLES[emp.status],
                      )}
                    >
                      {STATUS_LABELS[emp.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem className="text-xs gap-2 cursor-pointer">
                          <Eye className="w-3.5 h-3.5" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-xs gap-2 cursor-pointer"
                          onClick={() => onEdit(emp)}
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit Employee
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove Employee
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove Employee
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove{" "}
                                <span className="font-semibold text-foreground">
                                  {emp.name}
                                </span>
                                ? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="text-xs">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="text-xs bg-destructive hover:bg-destructive/90"
                                onClick={() => onDelete(emp.id)}
                              >
                                Remove
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
