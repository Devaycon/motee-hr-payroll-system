"use client";

import React, { useState, useMemo } from "react";
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
  type RowSelectionState,
  type Row,
} from "@tanstack/react-table";
import { ChevronsUpDown, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
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
import { Label } from "@/src/components/ui/label";
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

interface TableRow_ {
  numId: number;
  id: string;
  name: string;
  initials: string;
  email: string;
  department: string;
  jobTitle: string;
  employmentType: string;
  status: string;
  startDate: string;
  managerName: string | null;
}

function toTableRows(employees: EmployeeRow[]): TableRow_[] {
  return employees.map((e, i) => ({
    numId: i + 1,
    id: e.id,
    name: e.name,
    initials: e.initials,
    email: e.email,
    department: e.department,
    jobTitle: e.jobTitle,
    employmentType: e.employmentType,
    status: e.status,
    startDate: e.startDate,
    managerName: e.managerName,
  }));
}

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

function DraggableRow({ row }: { row: Row<TableRow_> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.numId,
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

export function AdvancedEmployeesTable({
  employees,
}: AdvancedEmployeesTableProps) {
  const router = useRouter();

  const allRows = useMemo(() => toTableRows(employees), [employees]);
  const activeRows = useMemo(
    () => toTableRows(employees.filter((e) => e.status === "active")),
    [employees],
  );
  const onLeaveRows = useMemo(
    () => toTableRows(employees.filter((e) => e.status === "on_leave")),
    [employees],
  );
  const probationRows = useMemo(
    () => toTableRows(employees.filter((e) => e.status === "probation")),
    [employees],
  );

  const [allData, setAllData] = useState<TableRow_[]>(allRows);
  const [activeData, setActiveData] = useState<TableRow_[]>(activeRows);
  const [onLeaveData, setOnLeaveData] = useState<TableRow_[]>(onLeaveRows);
  const [probationData, setProbationData] =
    useState<TableRow_[]>(probationRows);

  React.useEffect(() => {
    setAllData(toTableRows(employees));
    setActiveData(toTableRows(employees.filter((e) => e.status === "active")));
    setOnLeaveData(
      toTableRows(employees.filter((e) => e.status === "on_leave")),
    );
    setProbationData(
      toTableRows(employees.filter((e) => e.status === "probation")),
    );
  }, [employees]);

  const [allSorting, setAllSorting] = useState<SortingState>([]);
  const [allColVis, setAllColVis] = useState<VisibilityState>({});
  const [allRowSel, setAllRowSel] = useState<RowSelectionState>({});
  const [allPagination, setAllPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [activeSorting, setActiveSorting] = useState<SortingState>([]);
  const [activeColVis, setActiveColVis] = useState<VisibilityState>({});
  const [activeRowSel, setActiveRowSel] = useState<RowSelectionState>({});
  const [activePagination, setActivePagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [onLeaveSorting, setOnLeaveSorting] = useState<SortingState>([]);
  const [onLeaveColVis, setOnLeaveColVis] = useState<VisibilityState>({});
  const [onLeaveRowSel, setOnLeaveRowSel] = useState<RowSelectionState>({});
  const [onLeavePagination, setOnLeavePagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [probSorting, setProbSorting] = useState<SortingState>([]);
  const [probColVis, setProbColVis] = useState<VisibilityState>({});
  const [probRowSel, setProbRowSel] = useState<RowSelectionState>({});
  const [probPagination, setProbPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const buildColumns = (): ColumnDef<TableRow_>[] => [
    {
      id: "drag",
      header: () => null,
      cell: ({ row }) => <DragHandle id={row.original.numId} />,
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
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {row.original.initials}
            </AvatarFallback>
          </Avatar>
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
      enableHiding: false,
    },
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
      accessorKey: "jobTitle",
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
        <span className="text-sm text-foreground">{row.original.jobTitle}</span>
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
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.startDate)}
        </span>
      ),
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
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                router.push(`/organization/employees/${row.original.id}`)
              }
            >
              View Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo<ColumnDef<TableRow_>[]>(
    () => buildColumns(),
    [router],
  );

  const allTable = useReactTable({
    data: allData,
    columns,
    state: {
      sorting: allSorting,
      columnVisibility: allColVis,
      rowSelection: allRowSel,
      pagination: allPagination,
    },
    getRowId: (row) => row.numId.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setAllRowSel,
    onSortingChange: setAllSorting,
    onColumnVisibilityChange: setAllColVis,
    onPaginationChange: setAllPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const activeTable = useReactTable({
    data: activeData,
    columns,
    state: {
      sorting: activeSorting,
      columnVisibility: activeColVis,
      rowSelection: activeRowSel,
      pagination: activePagination,
    },
    getRowId: (row) => row.numId.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setActiveRowSel,
    onSortingChange: setActiveSorting,
    onColumnVisibilityChange: setActiveColVis,
    onPaginationChange: setActivePagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const onLeaveTable = useReactTable({
    data: onLeaveData,
    columns,
    state: {
      sorting: onLeaveSorting,
      columnVisibility: onLeaveColVis,
      rowSelection: onLeaveRowSel,
      pagination: onLeavePagination,
    },
    getRowId: (row) => row.numId.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setOnLeaveRowSel,
    onSortingChange: setOnLeaveSorting,
    onColumnVisibilityChange: setOnLeaveColVis,
    onPaginationChange: setOnLeavePagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const probTable = useReactTable({
    data: probationData,
    columns,
    state: {
      sorting: probSorting,
      columnVisibility: probColVis,
      rowSelection: probRowSel,
      pagination: probPagination,
    },
    getRowId: (row) => row.numId.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setProbRowSel,
    onSortingChange: setProbSorting,
    onColumnVisibilityChange: setProbColVis,
    onPaginationChange: setProbPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const allIds = useMemo<UniqueIdentifier[]>(
    () => allData.map(({ numId }) => numId),
    [allData],
  );
  const activeIds = useMemo<UniqueIdentifier[]>(
    () => activeData.map(({ numId }) => numId),
    [activeData],
  );
  const onLeaveIds = useMemo<UniqueIdentifier[]>(
    () => onLeaveData.map(({ numId }) => numId),
    [onLeaveData],
  );
  const probIds = useMemo<UniqueIdentifier[]>(
    () => probationData.map(({ numId }) => numId),
    [probationData],
  );

  function handleDragEnd(
    event: DragEndEvent,
    ids: UniqueIdentifier[],
    setter: React.Dispatch<React.SetStateAction<TableRow_[]>>,
  ) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setter((d) => arrayMove(d, ids.indexOf(active.id), ids.indexOf(over.id)));
    }
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

  function renderPagination<T>(
    table: ReturnType<typeof useReactTable<T>>,
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
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function renderTable(
    table: ReturnType<typeof useReactTable<TableRow_>>,
    ids: UniqueIdentifier[],
    setter: React.Dispatch<React.SetStateAction<TableRow_[]>>,
    emptyMsg: string,
    tabKey: string,
    selectedCount: number,
  ) {
    return (
      <TabsContent value={tabKey} className="m-0 flex flex-col flex-1">
        <div className="overflow-hidden">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={(e) => handleDragEnd(e, ids, setter)}
            sensors={sensors}
            id={`${sortableId}-${tabKey}`}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((hg) => (
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
                {table.getRowModel().rows.length ? (
                  <SortableContext
                    items={ids}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="w-8 h-8 opacity-30" />
                        <p className="text-sm">{emptyMsg}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        {renderPagination(table, selectedCount)}
      </TabsContent>
    );
  }

  return (
    <Card className="flex flex-col">
      <Tabs defaultValue="all" className="w-full flex flex-col flex-1">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
          <TabsList className="h-8 bg-muted/60 **:data-[slot=badge]:size-4 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 **:data-[slot=badge]:text-[9px]">
            <TabsTrigger value="all" className="text-xs px-2.5">
              All Employees <Badge variant="secondary">{allData.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs px-2.5">
              Active <Badge variant="secondary">{activeData.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="on-leave" className="text-xs px-2.5">
              On Leave <Badge variant="secondary">{onLeaveData.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="probation" className="text-xs px-2.5">
              Probation{" "}
              <Badge variant="secondary">{probationData.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-1.5">
            <TabsContent value="all" className="m-0 p-0">
              {renderColVisibility(allTable)}
            </TabsContent>
            <TabsContent value="active" className="m-0 p-0">
              {renderColVisibility(activeTable)}
            </TabsContent>
            <TabsContent value="on-leave" className="m-0 p-0">
              {renderColVisibility(onLeaveTable)}
            </TabsContent>
            <TabsContent value="probation" className="m-0 p-0">
              {renderColVisibility(probTable)}
            </TabsContent>
          </div>
        </div>

        {renderTable(
          allTable,
          allIds,
          setAllData,
          "No employees found.",
          "all",
          Object.keys(allRowSel).length,
        )}
        {renderTable(
          activeTable,
          activeIds,
          setActiveData,
          "No active employees.",
          "active",
          Object.keys(activeRowSel).length,
        )}
        {renderTable(
          onLeaveTable,
          onLeaveIds,
          setOnLeaveData,
          "No employees on leave.",
          "on-leave",
          Object.keys(onLeaveRowSel).length,
        )}
        {renderTable(
          probTable,
          probIds,
          setProbationData,
          "No employees on probation.",
          "probation",
          Object.keys(probRowSel).length,
        )}
      </Tabs>
    </Card>
  );
}
