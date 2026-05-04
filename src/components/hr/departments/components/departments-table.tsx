"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  UserRound,
  UserPlus,
} from "lucide-react";
import { AddEmployeeModal } from "./add-employee-modal";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
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
import { STATUS_STYLES, formatBudget } from "../data";
import type { Department } from "../types";

interface DepartmentsTableProps {
  departments: Department[];
  onEdit: (dept: Department) => void;
  onDelete: (id: string) => void;
}

export function DepartmentsTable({
  departments,
  onEdit,
  onDelete,
}: DepartmentsTableProps) {
  const router = useRouter();
  const [addEmpDept, setAddEmpDept] = useState<Department | null>(null);

  if (departments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <UserRound className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No departments found
          </p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search or filter.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Department
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Head
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Employees
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Open Positions
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Budget
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Created
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, idx) => (
                  <tr
                    key={dept.id}
                    className={cn(
                      "hover:bg-muted/40 transition-colors",
                      idx !== departments.length - 1 &&
                        "border-b border-border",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {dept.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {dept.code}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {dept.head ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                              {dept.headInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-foreground">
                            {dept.head}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground">
                        {dept.employeeCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {dept.openPositions > 0 ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-primary/30 bg-primary/10 text-primary"
                        >
                          {dept.openPositions} open
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">
                        {formatBudget(dept.budgetMonthly ?? 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 capitalize",
                          STATUS_STYLES[dept.status],
                        )}
                      >
                        {dept.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {dept.createdAt}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            className="text-xs gap-2 cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/organization/departments/${dept.id}`,
                              )
                            }
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs gap-2 cursor-pointer"
                            onSelect={(e) => {
                              e.preventDefault();
                              setAddEmpDept(dept);
                            }}
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Add Employee
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs gap-2 cursor-pointer"
                            onClick={() => onEdit(dept)}
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-xs gap-2 text-red-500 focus:text-red-500 cursor-pointer"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete department?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove{" "}
                                  <strong>{dept.name}</strong> and cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                  onClick={() => onDelete(dept.id)}
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

      {addEmpDept && (
        <AddEmployeeModal
          open={!!addEmpDept}
          onOpenChange={(v) => {
            if (!v) setAddEmpDept(null);
          }}
          departmentName={addEmpDept.name}
          currentMembers={[]}
          onAdd={() => setAddEmpDept(null)}
        />
      )}
    </>
  );
}
