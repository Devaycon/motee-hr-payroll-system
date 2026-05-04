"use client";

import { useState, useMemo } from "react";
import {
  MoreHorizontal,
  Pencil,
  PowerOff,
  Power,
  Layers,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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
import { CONTRACT_DURATION_LABELS, CONTRACT_DURATION_STYLES } from "../data";
import { EmploymentTypeDetailModal } from "./employment-type-detail-modal";
import type { EmploymentTypeRow } from "../types";

interface EmploymentTypeTableProps {
  types: EmploymentTypeRow[];
  onEdit: (type: EmploymentTypeRow) => void;
  onToggleStatus: (id: string) => void;
}

export function EmploymentTypeTable({
  types,
  onEdit,
  onToggleStatus,
}: EmploymentTypeTableProps) {
  const [detailType, setDetailType] = useState<EmploymentTypeRow | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const pageCount = Math.max(1, Math.ceil(types.length / pageSize));
  const safePage = Math.min(pageIndex, pageCount - 1);

  const paginatedTypes = useMemo(() => {
    const start = safePage * pageSize;
    return types.slice(start, start + pageSize);
  }, [types, safePage, pageSize]);

  if (types.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <Layers className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No employment types found
          </p>
          <p className="text-xs text-muted-foreground">
            Create an employment type to get started.
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
                    Type Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Contract Duration
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Leave Entitlement
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Payroll
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Statutory Deductions
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Employees
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginatedTypes.map((type, idx) => (
                  <tr
                    key={type.id}
                    className={cn(
                      "hover:bg-muted/40 transition-colors",
                      idx !== paginatedTypes.length - 1 &&
                        "border-b border-border",
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground text-sm">
                        {type.name}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium",
                          CONTRACT_DURATION_STYLES[type.contractDuration],
                        )}
                      >
                        {CONTRACT_DURATION_LABELS[type.contractDuration]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">
                        {type.leaveEntitlement}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium",
                          type.payrollInclusion
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-600"
                            : "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {type.payrollInclusion ? "Included" : "Excluded"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {type.statutoryDeductions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {type.statutoryDeductions.map((d) => (
                            <Badge
                              key={d}
                              variant="outline"
                              className="text-[10px] font-medium border-border bg-muted text-muted-foreground"
                            >
                              {d}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">
                        {type.employeeCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium",
                          type.isActive
                            ? "border-green-500/30 bg-green-500/10 text-green-600"
                            : "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {type.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
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
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            className="text-xs gap-2"
                            onClick={() => setDetailType(type)}
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs gap-2"
                            onClick={() => onEdit(type)}
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit Type
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-xs gap-2"
                                onSelect={(e) => e.preventDefault()}
                              >
                                {type.isActive ? (
                                  <>
                                    <PowerOff className="w-3.5 h-3.5" />{" "}
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Power className="w-3.5 h-3.5" /> Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {type.isActive
                                    ? "Deactivate Employment Type"
                                    : "Activate Employment Type"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {type.isActive
                                    ? `Deactivating "${type.name}" will prevent it from being assigned to new employees.`
                                    : `Activating "${type.name}" will make it available for assignment again.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onToggleStatus(type.id)}
                                >
                                  {type.isActive ? "Deactivate" : "Activate"}
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="hidden text-sm text-muted-foreground lg:block">
              {safePage * pageSize + 1}–
              {Math.min((safePage + 1) * pageSize, types.length)} of{" "}
              {types.length} type(s)
            </p>
            <div className="flex w-full items-center gap-6 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label className="text-sm font-medium">Rows per page</Label>
                <Select
                  value={`${pageSize}`}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPageIndex(0);
                  }}
                >
                  <SelectTrigger size="sm" className="w-20">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 30].map((s) => (
                      <SelectItem key={s} value={`${s}`}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {safePage + 1} of {pageCount}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setPageIndex(0)}
                  disabled={safePage === 0}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    setPageIndex((p) => Math.min(pageCount - 1, p + 1))
                  }
                  disabled={safePage >= pageCount - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setPageIndex(pageCount - 1)}
                  disabled={safePage >= pageCount - 1}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EmploymentTypeDetailModal
        type={detailType}
        open={!!detailType}
        onOpenChange={(v) => {
          if (!v) setDetailType(null);
        }}
      />
    </>
  );
}
