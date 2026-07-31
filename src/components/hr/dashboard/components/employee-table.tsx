"use client";
import { formatDate } from "@/src/lib/utils/format-date";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
} from "@tabler/icons-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type Row,
} from "@tanstack/react-table";
import { MoreHorizontal, AlignJustify, ChevronsUpDown } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/src/components/ui/drawer";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useIsMobile } from "@/src/lib/hooks/use-mobile";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "@/src/components/ui/skeleton";
import { employeeIdColumns } from "@/src/components/shared/employee-id-columns";
import { useEmployeeIdentity } from "@/src/lib/hooks/use-employee-identity";
import {
  type EmployeeRow,
  type AttendanceRow,
  type LeaveRow,
  leaveTypeLabel,
} from "@/src/lib/types/dashboard";
import { useDashboardTableData } from "../hooks";

function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <IconGripVertical className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

function EmployeeCellViewer({ item }: { item: EmployeeRow }) {
  const isMobile = useIsMobile();
  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className="w-fit px-0 text-left text-foreground h-auto py-0"
        >
          {item.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>
            {item.title} · {item.department}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label>Full Name</Label>
              <Input defaultValue={item.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label>Job Title</Label>
                <Input defaultValue={item.title} />
              </div>
              <div className="flex flex-col gap-3">
                <Label>Department</Label>
                <Input defaultValue={item.department} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label>Location</Label>
                <Input defaultValue={item.city} />
              </div>
              <div className="flex flex-col gap-3">
                <Label>Work Mode</Label>
                <Select defaultValue={item.workMode}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="At Office">At Office</SelectItem>
                    <SelectItem value="Remotely">Remotely</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label>Employment Type</Label>
                <Select defaultValue={item.employmentType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="probation">Probation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label>Team Lead</Label>
                <Input defaultValue={item.teamLead} />
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Save Changes</Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DraggableEmployeeRow({ row }: { row: Row<EmployeeRow> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 hover:bg-accent/30"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

function DraggableAttendanceRow({ row }: { row: Row<AttendanceRow> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 hover:bg-accent/30"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

function DraggableLeaveRow({ row }: { row: Row<LeaveRow> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 hover:bg-accent/30"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function EmployeeTable() {
  const router = useRouter();
  const identity = useEmployeeIdentity();
  const { data: tableData, loading: tableLoading } = useDashboardTableData();

  const [employeeData, setEmployeeData] = useState<EmployeeRow[]>([]);
  const [absentData, setAbsentData] = useState<AttendanceRow[]>([]);
  const [onLeaveData, setOnLeaveData] = useState<AttendanceRow[]>([]);
  const [lateData, setLateData] = useState<AttendanceRow[]>([]);
  const [leaveData, setLeaveData] = useState<LeaveRow[]>([]);

  React.useEffect(() => {
    if (!tableData) return;
    setEmployeeData(tableData.employees);
    setAbsentData(tableData.absent);
    setOnLeaveData(tableData.onLeave);
    setLateData(tableData.late);
    setLeaveData(tableData.leaveRequests);
  }, [tableData]);

  const [empSorting, setEmpSorting] = useState<SortingState>([]);
  const [empColVis, setEmpColVis] = useState<VisibilityState>({});
  const [empRowSel, setEmpRowSel] = useState({});
  const [empPagination, setEmpPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [attSorting, setAttSorting] = useState<SortingState>([]);
  const [attColVis, setAttColVis] = useState<VisibilityState>({});
  const [attRowSel, setAttRowSel] = useState({});
  const [attPagination, setAttPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [leaveSorting, setLeaveSorting] = useState<SortingState>([]);
  const [leaveColVis, setLeaveColVis] = useState<VisibilityState>({});
  const [leaveRowSel, setLeaveRowSel] = useState({});
  const [leavePagination, setLeavePagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [lateSorting, setLateSorting] = useState<SortingState>([]);
  const [lateColVis, setLateColVis] = useState<VisibilityState>({});
  const [lateRowSel, setLateRowSel] = useState({});
  const [latePagination, setLatePagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    probation: "Probation",
  };

  const EMPLOYMENT_TYPE_STYLES: Record<string, string> = {
    full_time: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    part_time: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    contract: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    probation: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  };

  const STATUS_LABELS: Record<string, string> = {
    active: "Active",
    on_leave: "On Leave",
    probation: "Probation",
  };

  const STATUS_STYLES: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    on_leave: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    probation: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  };

  const employeeColumns = useMemo<ColumnDef<EmployeeRow>[]>(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
      },
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(v) => row.toggleSelected(!!v)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="px-0 font-medium text-muted-foreground hover:text-foreground bg-transparent! dark:bg-transparent! hover:bg-transparent!"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Employee <ChevronsUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <PersonAvatar
              name={row.original.name}
              initials={row.original.initials}
              className="size-8 shrink-0"
              fallbackClassName="bg-primary/10 text-primary text-xs font-semibold"
            />
            <div>
              <button
                className="text-sm font-medium text-foreground hover:text-primary hover:underline text-left"
                onClick={() =>
                  router.push(`/organization/employees/${row.original.empId}`)
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
        enableHiding: false,
      },
      ...employeeIdColumns<EmployeeRow>({
        identity,
        systemId: (e) => e.empId,
        name: (e) => e.name,
      }),
      {
        accessorKey: "department",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="px-0 font-medium text-muted-foreground hover:text-foreground bg-transparent! dark:bg-transparent! hover:bg-transparent!"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Department <ChevronsUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="px-0 font-medium text-muted-foreground hover:text-foreground bg-transparent! dark:bg-transparent! hover:bg-transparent!"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Job Title <ChevronsUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{row.original.title}</span>
        ),
      },
      {
        accessorKey: "employmentType",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="px-0 font-medium text-muted-foreground hover:text-foreground bg-transparent! dark:bg-transparent! hover:bg-transparent!"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Employment Type <ChevronsUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
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
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="px-0 font-medium text-muted-foreground hover:text-foreground bg-transparent! dark:bg-transparent! hover:bg-transparent!"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Line Manager <ChevronsUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
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
        accessorKey: "startDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="px-0 font-medium text-muted-foreground hover:text-foreground bg-transparent! dark:bg-transparent! hover:bg-transparent!"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Start Date <ChevronsUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const d = new Date(row.original.startDate);
          return (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {d.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="px-0 font-medium text-muted-foreground hover:text-foreground bg-transparent! dark:bg-transparent! hover:bg-transparent!"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status <ChevronsUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
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
      {
        id: "actions",
        cell: ({ row }) => (
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
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/organization/employees/${row.original.empId}`)
                }
              >
                View Profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router, identity],
  );

  const attendanceColumns = useMemo<ColumnDef<AttendanceRow>[]>(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
      },
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(v) => row.toggleSelected(!!v)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="px-0 font-medium text-muted-foreground hover:text-foreground hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Employee <ChevronsUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <PersonAvatar
              name={row.original.name}
              className="size-7 shrink-0"
              fallbackClassName="bg-[#4ED251]/10 text-[#4ED251] text-xs font-semibold"
            />
            <span className="text-sm font-medium text-foreground">
              {row.original.name}
            </span>
          </div>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "department",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="px-0 font-medium text-muted-foreground hover:text-foreground hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Department <ChevronsUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: "clockIn",
        header: "Clock In",
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.clockIn}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = row.original.status;
          return (
            <Badge
              variant="outline"
              className={cn("text-xs px-2", {
                "border-red-500/30 bg-red-500/10 text-red-400": s === "absent",
                "border-[#ff8b2d]/40 bg-[#ff8b2d]/10 text-[#ff8b2d]":
                  s === "late",
                "border-primary/30 bg-primary/10 text-primary":
                  s === "on_leave",
              })}
            >
              {s === "absent" ? "Absent" : s === "late" ? "Late" : "On Leave"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        cell: () => (
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
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Send Reminder</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Flag</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  const lateColumns = useMemo<ColumnDef<AttendanceRow>[]>(
    () => attendanceColumns,
    [attendanceColumns],
  );

  const leaveColumns = useMemo<ColumnDef<LeaveRow>[]>(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
      },
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(v) => row.toggleSelected(!!v)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="px-0 font-medium text-muted-foreground hover:text-foreground hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Employee <ChevronsUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <PersonAvatar
              name={row.original.name}
              className="size-7 shrink-0"
              fallbackClassName="bg-[#4ED251]/10 text-[#4ED251] text-xs font-semibold"
            />
            <span className="text-sm font-medium text-foreground">
              {row.original.name}
            </span>
          </div>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "leaveType",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="px-0 font-medium text-muted-foreground hover:text-foreground hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Leave Type <ChevronsUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="text-xs px-2 text-muted-foreground"
          >
            {leaveTypeLabel(row.original.leaveType)}
          </Badge>
        ),
      },
      {
        accessorKey: "startDate",
        header: "Start Date",
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {formatDate(row.original.startDate)}
          </span>
        ),
      },
      {
        accessorKey: "days",
        header: "Days",
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{row.original.days}d</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = row.original.status;
          return (
            <Badge
              variant="outline"
              className={cn("text-xs px-2", {
                "border-[#4ED251]/40 bg-[#4ED251]/10 text-[#4ED251]":
                  s === "approved",
                "border-[#ff8b2d]/40 bg-[#ff8b2d]/10 text-[#ff8b2d]":
                  s === "pending",
                "border-red-500/30 bg-red-500/10 text-red-400":
                  s === "rejected",
              })}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        cell: () => (
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
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem>Approve</DropdownMenuItem>
              <DropdownMenuItem>Reject</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  const empTable = useReactTable({
    data: employeeData,
    columns: employeeColumns,
    state: {
      sorting: empSorting,
      columnVisibility: empColVis,
      rowSelection: empRowSel,
      pagination: empPagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setEmpRowSel,
    onSortingChange: setEmpSorting,
    onColumnVisibilityChange: setEmpColVis,
    onPaginationChange: setEmpPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const absentTable = useReactTable({
    data: absentData,
    columns: attendanceColumns,
    state: {
      sorting: attSorting,
      columnVisibility: attColVis,
      rowSelection: attRowSel,
      pagination: attPagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setAttRowSel,
    onSortingChange: setAttSorting,
    onColumnVisibilityChange: setAttColVis,
    onPaginationChange: setAttPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const onLeaveTable = useReactTable({
    data: onLeaveData,
    columns: attendanceColumns,
    state: {
      sorting: leaveSorting,
      columnVisibility: leaveColVis,
      rowSelection: leaveRowSel,
      pagination: leavePagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setLeaveRowSel,
    onSortingChange: setLeaveSorting,
    onColumnVisibilityChange: setLeaveColVis,
    onPaginationChange: setLeavePagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const lateTable = useReactTable({
    data: lateData,
    columns: lateColumns,
    state: {
      sorting: lateSorting,
      columnVisibility: lateColVis,
      rowSelection: lateRowSel,
      pagination: latePagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setLateRowSel,
    onSortingChange: setLateSorting,
    onColumnVisibilityChange: setLateColVis,
    onPaginationChange: setLatePagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const leaveTable = useReactTable({
    data: leaveData,
    columns: leaveColumns,
    state: {
      sorting: leaveSorting,
      columnVisibility: leaveColVis,
      rowSelection: leaveRowSel,
      pagination: leavePagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setLeaveRowSel,
    onSortingChange: setLeaveSorting,
    onColumnVisibilityChange: setLeaveColVis,
    onPaginationChange: setLeavePagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const empIds = useMemo<UniqueIdentifier[]>(
    () => employeeData.map(({ id }) => id),
    [employeeData],
  );
  const absentIds = useMemo<UniqueIdentifier[]>(
    () => absentData.map(({ id }) => id),
    [absentData],
  );
  const onLeaveIds = useMemo<UniqueIdentifier[]>(
    () => onLeaveData.map(({ id }) => id),
    [onLeaveData],
  );
  const lateIds = useMemo<UniqueIdentifier[]>(
    () => lateData.map(({ id }) => id),
    [lateData],
  );
  const leaveIds = useMemo<UniqueIdentifier[]>(
    () => leaveData.map(({ id }) => id),
    [leaveData],
  );

  function handleEmpDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setEmployeeData((d) =>
        arrayMove(d, empIds.indexOf(active.id), empIds.indexOf(over.id)),
      );
    }
  }
  function handleAbsentDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setAbsentData((d) =>
        arrayMove(d, absentIds.indexOf(active.id), absentIds.indexOf(over.id)),
      );
    }
  }
  function handleOnLeaveDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setOnLeaveData((d) =>
        arrayMove(
          d,
          onLeaveIds.indexOf(active.id),
          onLeaveIds.indexOf(over.id),
        ),
      );
    }
  }
  function handleLateDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setLateData((d) =>
        arrayMove(d, lateIds.indexOf(active.id), lateIds.indexOf(over.id)),
      );
    }
  }
  function handleLeaveDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setLeaveData((d) =>
        arrayMove(d, leaveIds.indexOf(active.id), leaveIds.indexOf(over.id)),
      );
    }
  }

  function renderPagination<T>(
    table: ReturnType<typeof useReactTable<T>>,
    total: number,
    selectedCount: number,
  ) {
    return (
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-t border-border">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          {selectedCount} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label className="text-sm font-medium">Rows per page</Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger size="sm" className="w-20">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
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
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">First page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Previous</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Next</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function renderColVisibility<T>(table: ReturnType<typeof useReactTable<T>>) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <IconLayoutColumns className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden lg:inline">Columns</span>
            <IconChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {table
            .getAllColumns()
            .filter(
              (c) => typeof c.accessorFn !== "undefined" && c.getCanHide(),
            )
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(v) => column.toggleVisibility(!!v)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (tableLoading && !employeeData.length) {
    return <Skeleton className="h-96 w-full rounded-xl col-span-3" />;
  }

  return (
    <Card className="col-span-3 flex flex-col">
      <Tabs defaultValue="employees" className="w-full flex flex-col flex-1">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <TabsList className="h-8 bg-muted/60 **:data-[slot=badge]:size-4 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 **:data-[slot=badge]:text-[9px]">
              <TabsTrigger
                value="employees"
                className="text-xs px-2.5 data-[state=active]:!bg-[#ff8b2d] data-[state=active]:!text-white data-[state=active]:!shadow-none"
              >
                Employees{" "}
                <Badge variant="secondary">{employeeData.length}</Badge>
              </TabsTrigger>
              <TabsTrigger
                value="absent"
                className="text-xs px-2.5 data-[state=active]:!bg-[#ff8b2d] data-[state=active]:!text-white data-[state=active]:!shadow-none"
              >
                Absent <Badge variant="secondary">{absentData.length}</Badge>
              </TabsTrigger>
              <TabsTrigger
                value="on-leave"
                className="text-xs px-2.5 data-[state=active]:!bg-[#ff8b2d] data-[state=active]:!text-white data-[state=active]:!shadow-none"
              >
                On Leave <Badge variant="secondary">{onLeaveData.length}</Badge>
              </TabsTrigger>
              <TabsTrigger
                value="late"
                className="text-xs px-2.5 data-[state=active]:!bg-[#ff8b2d] data-[state=active]:!text-white data-[state=active]:!shadow-none"
              >
                Late <Badge variant="secondary">{lateData.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="flex items-center gap-1.5">
            <TabsContent value="employees" className="m-0 p-0">
              {renderColVisibility(empTable)}
            </TabsContent>
            <TabsContent value="absent" className="m-0 p-0">
              {renderColVisibility(absentTable)}
            </TabsContent>
            <TabsContent value="on-leave" className="m-0 p-0">
              {renderColVisibility(onLeaveTable)}
            </TabsContent>
            <TabsContent value="late" className="m-0 p-0">
              {renderColVisibility(lateTable)}
            </TabsContent>
          </div>
        </div>

        <TabsContent value="employees" className="m-0 flex flex-col flex-1">
          <div className="overflow-hidden">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleEmpDragEnd}
              sensors={sensors}
              id={`${sortableId}-emp`}
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {empTable.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((h) => (
                        <TableHead key={h.id} colSpan={h.colSpan}>
                          {h.isPlaceholder
                            ? null
                            : flexRender(
                                h.column.columnDef.header,
                                h.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {empTable.getRowModel().rows.length ? (
                    <SortableContext
                      items={empIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {empTable.getRowModel().rows.map((row) => (
                        <DraggableEmployeeRow key={row.id} row={row} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={employeeColumns.length}
                        className="h-24 text-center text-muted-foreground text-sm"
                      >
                        No employees found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
          {renderPagination(
            empTable,
            employeeData.length,
            Object.keys(empRowSel).length,
          )}
        </TabsContent>

        <TabsContent value="absent" className="m-0 flex flex-col flex-1">
          <div className="overflow-hidden">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleAbsentDragEnd}
              sensors={sensors}
              id={`${sortableId}-absent`}
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {absentTable.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((h) => (
                        <TableHead key={h.id} colSpan={h.colSpan}>
                          {h.isPlaceholder
                            ? null
                            : flexRender(
                                h.column.columnDef.header,
                                h.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {absentTable.getRowModel().rows.length ? (
                    <SortableContext
                      items={absentIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {absentTable.getRowModel().rows.map((row) => (
                        <DraggableAttendanceRow key={row.id} row={row} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={attendanceColumns.length}
                        className="h-24 text-center text-muted-foreground text-sm"
                      >
                        No absent employees today.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
          {renderPagination(
            absentTable,
            absentData.length,
            Object.keys(attRowSel).length,
          )}
        </TabsContent>

        <TabsContent value="on-leave" className="m-0 flex flex-col flex-1">
          <div className="overflow-hidden">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleOnLeaveDragEnd}
              sensors={sensors}
              id={`${sortableId}-onleave`}
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {onLeaveTable.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((h) => (
                        <TableHead key={h.id} colSpan={h.colSpan}>
                          {h.isPlaceholder
                            ? null
                            : flexRender(
                                h.column.columnDef.header,
                                h.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {onLeaveTable.getRowModel().rows.length ? (
                    <SortableContext
                      items={onLeaveIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {onLeaveTable.getRowModel().rows.map((row) => (
                        <DraggableAttendanceRow key={row.id} row={row} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={attendanceColumns.length}
                        className="h-24 text-center text-muted-foreground text-sm"
                      >
                        No employees on leave today.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
          {renderPagination(
            onLeaveTable,
            onLeaveData.length,
            Object.keys(leaveRowSel).length,
          )}
        </TabsContent>

        <TabsContent value="late" className="m-0 flex flex-col flex-1">
          <div className="overflow-hidden">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleLateDragEnd}
              sensors={sensors}
              id={`${sortableId}-late`}
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {lateTable.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((h) => (
                        <TableHead key={h.id} colSpan={h.colSpan}>
                          {h.isPlaceholder
                            ? null
                            : flexRender(
                                h.column.columnDef.header,
                                h.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {lateTable.getRowModel().rows.length ? (
                    <SortableContext
                      items={lateIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {lateTable.getRowModel().rows.map((row) => (
                        <DraggableAttendanceRow key={row.id} row={row} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={lateColumns.length}
                        className="h-24 text-center text-muted-foreground text-sm"
                      >
                        No late arrivals today.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
          {renderPagination(
            lateTable,
            lateData.length,
            Object.keys(lateRowSel).length,
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
