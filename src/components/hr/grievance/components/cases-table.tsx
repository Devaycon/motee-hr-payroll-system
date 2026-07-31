"use client";

import React, { useMemo, useState } from "react";
import {
  MoreHorizontal,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import {
  employeeIdColumns,
  HIDE_SYSTEM_ID,
} from "@/src/components/shared/employee-id-columns";
import { useEmployeeIdentity } from "@/src/lib/hooks/use-employee-identity";
import type { ERCase } from "../types";
import {
  CASE_STAGE_CONFIG,
  CASE_TYPE_CONFIG,
  PRIORITY_CONFIG,
  STAGE_OPTIONS,
} from "../data";

interface Props {
  cases: ERCase[];
  onView: (c: ERCase) => void;
  onEdit: (c: ERCase) => void;
  onDelete: (id: string) => void;
}

export function CasesTable({ cases, onView, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterDept, setFilterDept] = useState("all");

  const departments = Array.from(
    new Set(cases.map((c) => c.employeeDept)),
  ).sort();

  const filtered = cases.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.caseNumber.toLowerCase().includes(q) ||
      c.employeeName.toLowerCase().includes(q) ||
      c.employeeDept.toLowerCase().includes(q);

    const matchesStage = filterStage === "all" || c.stage === filterStage;
    const matchesPriority =
      filterPriority === "all" || c.priority === filterPriority;
    const matchesDept = filterDept === "all" || c.employeeDept === filterDept;

    return matchesSearch && matchesStage && matchesPriority && matchesDept;
  });

  const identity = useEmployeeIdentity();
  const columns = useMemo<ColumnDef<ERCase>[]>(
    () => [
      {
        accessorKey: "caseNumber",
        header: sortableHeader("Case ID"),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.caseNumber}
          </span>
        ),
      },
      {
        accessorKey: "complaintType",
        header: sortableHeader("Type"),
        cell: ({ row }) => {
          const typeCfg = CASE_TYPE_CONFIG[row.original.complaintType];
          return (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${typeCfg.color} ${typeCfg.bg} ${typeCfg.border}`}
            >
              {typeCfg.label}
            </span>
          );
        },
      },
      {
        accessorKey: "employeeName",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {row.original.employeeInitials}
            </div>
            <div>
              <p className="font-medium text-foreground leading-tight">
                {row.original.employeeName}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.original.employeeDept}
              </p>
            </div>
          </div>
        ),
      },
      ...employeeIdColumns<ERCase>({
        identity,
        name: (r) => r.employeeName,
      }),
      {
        accessorKey: "stage",
        header: sortableHeader("Stage"),
        cell: ({ row }) => {
          const stageCfg = CASE_STAGE_CONFIG[row.original.stage];
          return (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${stageCfg.color} ${stageCfg.bg} ${stageCfg.border}`}
            >
              {stageCfg.label}
            </span>
          );
        },
      },
      {
        accessorKey: "priority",
        header: sortableHeader("Priority"),
        cell: ({ row }) => {
          const priCfg = PRIORITY_CONFIG[row.original.priority];
          return (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${priCfg.color} ${priCfg.bg} ${priCfg.border}`}
            >
              {priCfg.label}
            </span>
          );
        },
      },
      {
        accessorKey: "assignedTo",
        header: sortableHeader("Assigned To"),
        cell: ({ row }) =>
          row.original.assignedTo ? (
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {row.original.assignedInitials}
              </div>
              <span className="text-sm text-muted-foreground">
                {row.original.assignedTo}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50">Unassigned</span>
          ),
      },
      {
        accessorKey: "dateRaised",
        header: sortableHeader("Raised"),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {new Date(row.original.dateRaised).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        ),
      },
      actionsColumn<ERCase>((c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(c)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(c)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e: Event) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Case</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete case{" "}
                    <span className="font-semibold">{c.caseNumber}</span>? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onDelete(c.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onView, onEdit, onDelete, identity],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm ">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Stage
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {STAGE_OPTIONS.map((s) => (
              <DropdownMenuItem
                key={s.value}
                onClick={() => setFilterStage(s.value)}
                className={filterStage === s.value ? "font-semibold" : ""}
              >
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Priority
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["all", "low", "medium", "high", "urgent"].map((p) => (
              <DropdownMenuItem
                key={p}
                onClick={() => setFilterPriority(p)}
                className={filterPriority === p ? "font-semibold" : ""}
              >
                {p === "all"
                  ? "All Priorities"
                  : p.charAt(0).toUpperCase() + p.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Department
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setFilterDept("all")}
              className={filterDept === "all" ? "font-semibold" : ""}
            >
              All Departments
            </DropdownMenuItem>
            {departments.map((d) => (
              <DropdownMenuItem
                key={d}
                onClick={() => setFilterDept(d)}
                className={filterDept === d ? "font-semibold" : ""}
              >
                {d}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DataTable
        columns={columns}
        initialColumnVisibility={HIDE_SYSTEM_ID}
        enableColumnVisibility
        data={filtered}
        getRowId={(c) => c.id}
        onRowClick={(c) => onView(c)}
        emptyMessage="No cases found."
      />
      <p className="text-xs text-muted-foreground text-right">
        {filtered.length} of {cases.length} cases
      </p>
    </div>
  );
}
