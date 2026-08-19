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
  type Column,
  type Row,
  type RowData,
} from "@tanstack/react-table";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";
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

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Human-readable name for the Columns visibility menu (defaults to the id). */
    label?: string;
    /** Header text for exports, when the header is a custom node. */
    exportHeader?: string;
    /**
     * Cell value for exports. Needed when the cell is a custom renderer with
     * no accessor behind it — otherwise the column exports blank and is dropped.
     */
    exportValue?: (row: TData) => string | number | null | undefined;
    /** Keep this column out of exports even though it holds data. */
    exportSkip?: boolean;
  }
}

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
  // Carried so exports can label the column without re-rendering the header.
  SortableHeader.exportLabel = label;
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

// ── export derivation ───────────────────────────────────────────────────────

/** Columns that carry controls rather than data — never exported. */
const NON_DATA_COLUMN_IDS = new Set(["drag", "select", "actions"]);

/** Flattens whatever a cell holds into something a spreadsheet can take. */
function toCellValue(raw: unknown): string | number {
  if (raw == null) return "";
  if (typeof raw === "number" || typeof raw === "string") return raw;
  if (typeof raw === "boolean") return raw ? "Yes" : "No";
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  if (Array.isArray(raw)) return raw.map(toCellValue).filter(Boolean).join(", ");
  return "";
}

/** The label to print for a column, given whatever its header is. */
function headerLabel<T>(column: Column<T, unknown>): string {
  const meta = column.columnDef.meta;
  if (meta?.exportHeader) return meta.exportHeader;
  const header = column.columnDef.header;
  if (typeof header === "string") return header;
  // `sortableHeader` stashes its plain-text label on the component.
  const label = (header as { exportLabel?: string } | undefined)?.exportLabel;
  if (label) return label;
  return meta?.label ?? column.id;
}

/**
 * Turns the live table into report columns, so an export matches what's on
 * screen: current filters and sort order, visible columns only, every page.
 *
 * A value comes from `meta.exportValue`, else the column's accessor, else the
 * row field named after the column id — which covers the many columns here
 * that are a custom cell renderer over a plainly-named field. Columns that
 * still yield nothing for every row are dropped rather than exported blank.
 */
function toReportColumns<T>(
  columns: Column<T, unknown>[],
  rows: T[],
): ReportColumn<T>[] {
  const derived: ReportColumn<T>[] = [];

  for (const column of columns) {
    if (NON_DATA_COLUMN_IDS.has(column.id)) continue;
    const meta = column.columnDef.meta;
    if (meta?.exportSkip) continue;

    const custom = meta?.exportValue;
    const accessor = column.accessorFn;
    const value = custom
      ? (row: T) => toCellValue(custom(row))
      : accessor
        ? (row: T) => toCellValue(accessor(row, 0))
        : (row: T) =>
            toCellValue((row as Record<string, unknown>)?.[column.id]);

    // A column nobody can read anything out of is noise in a spreadsheet.
    if (!custom && !accessor && !rows.some((r) => value(r) !== "")) continue;

    derived.push({ key: column.id, header: headerLabel(column), value });
  }

  return derived;
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
  /** Columns hidden (or forced visible) on first render, e.g. `{ "system id": false }`. */
  initialColumnVisibility?: VisibilityState;
  enableSelection?: boolean;
  /** Fires with the selected row ids whenever the selection changes. */
  onSelectionChange?: (ids: string[]) => void;
  enablePagination?: boolean;
  pageSize?: number;
  enableDnd?: boolean;
  onReorder?: (orderedIds: string[]) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  /** Show the Export menu (CSV / Excel / PNG / print). On by default. */
  enableExport?: boolean;
  /** File name for exports, without extension. Defaults to the title slug. */
  exportName?: string;
  /** Heading on the printed page and the PNG. Defaults to "Export". */
  exportTitle?: string;
}

/** Turns a title into a safe, readable file name stem. */
function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "export"
  );
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
  initialColumnVisibility,
  enableSelection,
  onSelectionChange,
  enablePagination = true,
  pageSize = 10,
  enableDnd,
  onReorder,
  onRowClick,
  emptyMessage = "No results.",
  loading,
  className,
  enableExport = true,
  exportName,
  exportTitle = "Export",
}: DataTableProps<T>) {
  // Internal copy so drag-reorder works; re-synced when `data` changes (no effect).
  const [rows, setRows] = React.useState<T[]>(data);
  const [prevData, setPrevData] = React.useState(data);
  if (prevData !== data) {
    setPrevData(data);
    setRows(data);
  }

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    () => initialColumnVisibility ?? {},
  );
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
    onRowSelectionChange: (updater) => {
      setRowSelection((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        onSelectionChange?.(Object.keys(next).filter((id) => next[id]));
        return next;
      });
    },
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
  const showToolbar =
    showSearch || enableColumnVisibility || !!toolbarActions || enableExport;
  const colCount = allColumns.length;

  // Export what's on screen: filtered and sorted, visible columns, every page.
  const exportRows = React.useMemo(
    () => table.getSortedRowModel().rows.map((r) => r.original),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, rows, sorting, globalFilter],
  );
  const exportColumns = React.useMemo(
    () => toReportColumns(table.getVisibleLeafColumns(), exportRows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, exportRows, columnVisibility],
  );

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
      {/* `bg-card`, matching the wrapper — `bg-background` is a different
          colour in dark mode (0.13 vs 0.17), which split the panel in two. */}
      <TableBody className="bg-card">
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
            {enableExport && (
              <ExportMenu
                name={exportName ?? slugify(exportTitle)}
                title={exportTitle}
                columns={exportColumns}
                rows={exportRows}
                variant="outline"
                buttonClassName="h-9 text-xs"
              />
            )}
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
                        {column.columnDef.meta?.label ?? column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      {/* Needs its own solid background. The header and body paint their own,
          but the rounded corners, the empty state and any area the rows don't
          cover fell through to the page — which paints the logo watermark,
          so tables looked semi-transparent. */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
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
