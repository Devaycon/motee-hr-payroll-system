"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronDown,
  IconGripVertical,
  IconLayoutColumns,
} from "@tabler/icons-react";
import { ChevronsUpDown, Search } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type Row,
} from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { cn } from "@/src/lib/utils";

// ── column helpers ──────────────────────────────────────────────────────────

/** A sortable column header rendered as the standard ghost button. */
export function sortableHeader(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SortableHeader = ({ column }: { column: any }) => (
    <Button
      variant="ghost"
      size="sm"
      className="px-0 font-medium text-muted-foreground hover:text-foreground bg-transparent! dark:bg-transparent! hover:bg-transparent!"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label} <ChevronsUpDown className="ml-1 h-3 w-3" />
    </Button>
  );
  SortableHeader.displayName = "SortableHeader";
  return SortableHeader;
}

/** A trailing right-aligned actions column (per-row dropdowns/buttons). */
export function actionsColumn<T>(
  render: (row: T) => React.ReactNode,
  header = "",
): ColumnDef<T> {
  return {
    id: "actions",
    header: () => (header ? <span className="sr-only">{header}</span> : null),
    cell: ({ row }) => (
      <div
        className="flex justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        {render(row.original)}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

// ── drag + selection internals ───────────────────────────────────────────---

function DragHandle({ id }: { id: string }) {
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

function DraggableRow<T>({
  row,
  onRowClick,
}: {
  row: Row<T>;
  onRowClick?: (row: T) => void;
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.id,
  });
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
      className={cn(
        "relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 hover:bg-accent/30",
        onRowClick && "cursor-pointer",
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} data-slot="table-cell">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

function PlainRow<T>({
  row,
  onRowClick,
}: {
  row: Row<T>;
  onRowClick?: (row: T) => void;
}) {
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
      className={cn("hover:bg-accent/30", onRowClick && "cursor-pointer")}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} data-slot="table-cell">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── generic DataTable ─────────────────────────────────────────────────────--

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Stable id per row (used for selection + drag). Defaults to row.id or index. */
  getRowId?: (row: T, index: number) => string;
  searchPlaceholder?: string;
  /** Show the global search box. Defaults to true when searchPlaceholder is set. */
  enableGlobalFilter?: boolean;
  /** Extra toolbar content on the right (e.g. an Add button or filters). */
  toolbarActions?: React.ReactNode;
  enableColumnVisibility?: boolean;
  enableSelection?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  enableDnd?: boolean;
  onReorder?: (orderedIds: string[]) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

function defaultRowId<T>(row: T, index: number): string {
  const r = row as { id?: string | number };
  return r?.id != null ? String(r.id) : String(index);
}

export function DataTable<T>({
  columns,
  data,
  getRowId = defaultRowId,
  searchPlaceholder,
  enableGlobalFilter,
  toolbarActions,
  enableColumnVisibility,
  enableSelection,
  enablePagination = true,
  pageSize = 10,
  enableDnd,
  onReorder,
  onRowClick,
  emptyMessage = "No results.",
  loading,
  className,
}: DataTableProps<T>) {
  // Internal copy so drag-reorder works; re-synced when `data` changes (no effect).
  const [rows, setRows] = React.useState<T[]>(data);
  const [prevData, setPrevData] = React.useState(data);
  if (prevData !== data) {
    setPrevData(data);
    setRows(data);
  }

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize });

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const allColumns = React.useMemo<ColumnDef<T>[]>(() => {
    const extra: ColumnDef<T>[] = [];
    if (enableDnd) {
      extra.push({
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.id} />,
        enableSorting: false,
        enableHiding: false,
      });
    }
    if (enableSelection) {
      extra.push({
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
      });
    }
    return [...extra, ...columns];
  }, [columns, enableDnd, enableSelection]);

  const table = useReactTable({
    data: rows,
    columns: allColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination: enablePagination
        ? pagination
        : { pageIndex: 0, pageSize: Math.max(1, rows.length) },
    },
    getRowId,
    enableRowSelection: !!enableSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const ids = React.useMemo(
    () => rows.map((r, i) => getRowId(r, i)),
    [rows, getRowId],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      const next = arrayMove(rows, oldIndex, newIndex);
      setRows(next);
      onReorder?.(next.map((r, i) => getRowId(r, i)));
    }
  }

  const showSearch = enableGlobalFilter ?? !!searchPlaceholder;
  const showToolbar = showSearch || enableColumnVisibility || !!toolbarActions;
  const colCount = allColumns.length;

  const body = (
    <Table>
      <TableHeader className="bg-muted">
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((h) => (
              <TableHead key={h.id} colSpan={h.colSpan}>
                {h.isPlaceholder
                  ? null
                  : flexRender(h.column.columnDef.header, h.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody className="bg-background">
        {loading ? (
          <TableRow>
            <TableCell
              colSpan={colCount}
              className="h-24 text-center text-sm text-muted-foreground"
            >
              Loading…
            </TableCell>
          </TableRow>
        ) : table.getRowModel().rows.length ? (
          enableDnd ? (
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {table.getRowModel().rows.map((row) => (
                <DraggableRow key={row.id} row={row} onRowClick={onRowClick} />
              ))}
            </SortableContext>
          ) : (
            table
              .getRowModel()
              .rows.map((row) => (
                <PlainRow key={row.id} row={row} onRowClick={onRowClick} />
              ))
          )
        ) : (
          <TableRow>
            <TableCell
              colSpan={colCount}
              className="h-24 text-center text-sm text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className={cn("flex flex-col", className)}>
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
          <div className="flex items-center gap-2">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder={searchPlaceholder ?? "Search…"}
                  className="h-9 w-56 pl-8"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {toolbarActions}
            {enableColumnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 text-xs">
                    <IconLayoutColumns className="mr-1.5 h-3.5 w-3.5" />
                    <span className="hidden lg:inline">Columns</span>
                    <IconChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {table
                    .getAllColumns()
                    .filter(
                      (c) =>
                        typeof c.accessorFn !== "undefined" && c.getCanHide(),
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
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        {enableDnd ? (
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            {body}
          </DndContext>
        ) : (
          body
        )}
      </div>

      {enablePagination && (
        <div className="flex items-center justify-between gap-4 pt-3">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {enableSelection
              ? `${Object.keys(rowSelection).length} of ${table.getFilteredRowModel().rows.length} row(s) selected.`
              : `${table.getFilteredRowModel().rows.length} record(s).`}
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
                  {[5, 10, 20, 30, 50].map((s) => (
                    <SelectItem key={s} value={`${s}`}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
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
      )}
    </div>
  );
}
