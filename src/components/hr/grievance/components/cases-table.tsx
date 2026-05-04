"use client";

import React, { useState } from "react";
import {
  MoreHorizontal,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
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
import type { AnyCase, GrievanceStatus, DisciplinaryStatus } from "../types";
import {
  GRIEVANCE_STATUS_CONFIG,
  DISCIPLINARY_STATUS_CONFIG,
  GRIEVANCE_CATEGORY_CONFIG,
  DISCIPLINARY_CATEGORY_CONFIG,
  PRIORITY_CONFIG,
} from "../data";

interface Props {
  cases: AnyCase[];
  onView: (c: AnyCase) => void;
  onEdit: (c: AnyCase) => void;
  onDelete: (id: string) => void;
}

export function CasesTable({ cases, onView, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
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

    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || c.priority === filterPriority;
    const matchesDept = filterDept === "all" || c.employeeDept === filterDept;

    return matchesSearch && matchesStatus && matchesPriority && matchesDept;
  });

  function getStatusBadge(c: AnyCase) {
    if (c.type === "grievance") {
      const cfg = GRIEVANCE_STATUS_CONFIG[c.status as GrievanceStatus];
      return (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color} ${cfg.bg} ${cfg.border}`}
        >
          {cfg.label}
        </span>
      );
    }
    const cfg = DISCIPLINARY_STATUS_CONFIG[c.status as DisciplinaryStatus];
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color} ${cfg.bg} ${cfg.border}`}
      >
        {cfg.label}
      </span>
    );
  }

  function getCategoryLabel(c: AnyCase) {
    if (c.type === "grievance") {
      return GRIEVANCE_CATEGORY_CONFIG[c.category].label;
    }
    return DISCIPLINARY_CATEGORY_CONFIG[c.category].label;
  }

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
              Status
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[
              "all",
              "raised",
              "reported",
              "under_investigation",
              "investigation",
              "hearing_scheduled",
              "outcome_issued",
              "resolved",
              "appealed",
              "closed",
            ].map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => setFilterStatus(s)}
                className={filterStatus === s ? "font-semibold" : ""}
              >
                {s === "all"
                  ? "All Statuses"
                  : s
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
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

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Case #
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Employee
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                Category
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                Priority
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">
                Assigned To
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                Raised
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No cases found.
                </td>
              </tr>
            )}
            {filtered.map((c) => {
              const priCfg = PRIORITY_CONFIG[c.priority];
              return (
                <tr
                  key={c.id}
                  className="bg-card border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onView(c)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {c.caseNumber}
                  </td>
                  <td className="px-4 py-3">
                    {c.type === "grievance" ? (
                      <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400">
                        Grievance
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400">
                        Disciplinary
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {c.employeeInitials}
                      </div>
                      <div>
                        <p className="font-medium text-foreground leading-tight">
                          {c.employeeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.employeeDept}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {getCategoryLabel(c)}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(c)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${priCfg.color} ${priCfg.bg} ${priCfg.border}`}
                    >
                      {priCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {c.assignedTo ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {c.assignedInitials}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {c.assignedTo}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {new Date(c.dateRaised).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td
                    className="px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                                <span className="font-semibold">
                                  {c.caseNumber}
                                </span>
                                ? This action cannot be undone.
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {filtered.length} of {cases.length} cases
      </p>
    </div>
  );
}
