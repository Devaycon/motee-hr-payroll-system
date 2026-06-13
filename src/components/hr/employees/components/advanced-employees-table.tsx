"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { IconDotsVertical } from "@tabler/icons-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Card } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import {
  STATUS_STYLES,
  STATUS_LABELS,
  EMPLOYMENT_TYPE_STYLES,
  EMPLOYMENT_TYPE_LABELS,
  formatDate,
} from "../data";
import type { EmployeeRow } from "../types";

interface AdvancedEmployeesTableProps {
  employees: EmployeeRow[];
  onDelete?: (id: string) => void;
}

export function AdvancedEmployeesTable({
  employees,
}: AdvancedEmployeesTableProps) {
  const router = useRouter();

  const columns = useMemo<ColumnDef<EmployeeRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Employee"),
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <PersonAvatar
              name={row.original.name}
              initials={row.original.initials}
              gender={row.original.gender}
              className="size-8 shrink-0"
              fallbackClassName="bg-primary/10 text-primary text-xs font-semibold"
            />
            <div>
              <button
                className="text-sm font-medium text-foreground hover:text-primary hover:underline text-left"
                onClick={() =>
                  router.push(`/organization/employees/${row.original.id}`)
                }
              >
                {row.original.name}
              </button>
              <p className="text-[11px] text-muted-foreground">
                {row.original.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "id",
        header: sortableHeader("System ID"),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {row.original.id}
          </span>
        ),
      },
      {
        accessorKey: "referenceId",
        header: sortableHeader("Employee ID"),
        cell: ({ row }) =>
          row.original.referenceId ? (
            <span className="font-mono text-xs text-foreground whitespace-nowrap">
              {row.original.referenceId}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
          ),
      },
      {
        accessorKey: "department",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: "jobTitle",
        header: sortableHeader("Job Title"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.jobTitle}
          </span>
        ),
      },
      {
        accessorKey: "employmentType",
        header: sortableHeader("Employment Type"),
        cell: ({ row }) => (
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-medium",
              EMPLOYMENT_TYPE_STYLES[row.original.employmentType] ?? "",
            )}
          >
            {EMPLOYMENT_TYPE_LABELS[row.original.employmentType] ??
              row.original.employmentType}
          </span>
        ),
      },
      {
        accessorKey: "managerName",
        header: sortableHeader("Line Manager"),
        cell: ({ row }) =>
          row.original.managerName ? (
            <span className="text-sm text-foreground">
              {row.original.managerName}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
          ),
      },
      {
        accessorKey: "directReportCount",
        header: sortableHeader("Line Manager Status"),
        cell: ({ row }) => {
          const count = row.original.directReportCount ?? 0;
          return count > 0 ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-600 whitespace-nowrap">
              Active Line Manager
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">Not a Manager</span>
          );
        },
      },
      {
        accessorKey: "startDate",
        header: sortableHeader("Start Date"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.startDate)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-medium",
              STATUS_STYLES[row.original.status] ?? "",
            )}
          >
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </span>
        ),
      },
      actionsColumn<EmployeeRow>((e) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push(`/organization/employees/${e.id}`)}
            >
              View Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [router],
  );

  const tabs = [
    { value: "all", label: "All Employees", rows: employees },
    {
      value: "active",
      label: "Active",
      rows: employees.filter((e) => e.status === "active"),
    },
    {
      value: "on-leave",
      label: "On Leave",
      rows: employees.filter((e) => e.status === "on_leave"),
    },
    {
      value: "probation",
      label: "Probation",
      rows: employees.filter((e) => e.status === "probation"),
    },
  ];

  return (
    <Card className="flex flex-col p-4">
      <Tabs defaultValue="all" className="w-full flex flex-col flex-1">
        <TabsList className="h-8 bg-muted/60 mb-3 **:data-[slot=badge]:size-4 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 **:data-[slot=badge]:text-[9px]">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs px-2.5">
              {t.label} <Badge variant="secondary">{t.rows.length}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value} className="m-0">
            <DataTable
              columns={columns}
              data={t.rows}
              getRowId={(e) => e.id}
              enableSelection
              enableDnd
              enableColumnVisibility
              pageSize={10}
              emptyMessage="No employees found."
            />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
