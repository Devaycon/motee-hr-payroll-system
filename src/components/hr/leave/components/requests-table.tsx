"use client";

import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Pencil,
  Ban,
  History,
  X,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/src/components/ui/dropdown-menu";
import { useCan } from "@/src/lib/permissions/use-can";
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
import { cn } from "@/src/lib/utils";
import { isOpenLeaveStatus } from "@/src/lib/types/leave";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_STYLES,
  LEAVE_STATUS_OPTIONS,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_STYLES,
  DEPARTMENTS,
  LEAVE_TYPE_OPTIONS,
} from "../data";
import type { LeaveRequest, LeaveTypeName } from "../types";

const ALL = "all";

interface Filters {
  department: string;
  leaveType: string;
  status: string;
  manager: string;
  location: string;
  employmentType: string;
  submittedBy: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = {
  department: ALL,
  leaveType: ALL,
  status: ALL,
  manager: ALL,
  location: ALL,
  employmentType: ALL,
  submittedBy: ALL,
  from: "",
  to: "",
};

interface RequestsTableProps {
  requests: LeaveRequest[];
  onView: (request: LeaveRequest) => void;
  onApprove: (id: string) => void;
  onRejectClick: (request: LeaveRequest) => void;
  onNewRequest: () => void;
  onEdit: (request: LeaveRequest) => void;
  onCancel: (request: LeaveRequest) => void;
  onBulkApprove: (ids: string[]) => void;
  onBulkReject: (ids: string[]) => void;
}

export function RequestsTable({
  requests,
  onView,
  onApprove,
  onRejectClick,
  onNewRequest,
  onEdit,
  onCancel,
  onBulkApprove,
  onBulkReject,
}: RequestsTableProps) {
  const canApprove = useCan("time-payroll.leave", "approve");
  const canCreate = useCan("time-payroll.leave", "create");
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  // Filter option lists come from the data so they never drift (§F6).
  const options = useMemo(() => {
    const uniq = (vals: (string | undefined)[]) =>
      [...new Set(vals.filter((v): v is string => !!v))].sort();
    return {
      managers: uniq(requests.map((r) => r.managerName)),
      locations: uniq(requests.map((r) => r.location)),
      employmentTypes: uniq(requests.map((r) => r.employmentType)),
      submitters: uniq(requests.map((r) => r.submittedBy)),
    };
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter((r) => {
      const matchSearch =
        !q ||
        r.employeeName.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        (r.reason?.toLowerCase().includes(q) ?? false);
      if (!matchSearch) return false;
      if (filters.department !== ALL && r.department !== filters.department)
        return false;
      if (filters.leaveType !== ALL && r.leaveType !== filters.leaveType) return false;
      if (filters.status !== ALL && r.status !== filters.status) return false;
      if (filters.manager !== ALL && r.managerName !== filters.manager) return false;
      if (filters.location !== ALL && r.location !== filters.location) return false;
      if (
        filters.employmentType !== ALL &&
        r.employmentType !== filters.employmentType
      )
        return false;
      if (filters.submittedBy !== ALL && r.submittedBy !== filters.submittedBy)
        return false;
      // Date range matches any request overlapping the window.
      if (filters.from && r.endDate < filters.from) return false;
      if (filters.to && r.startDate > filters.to) return false;
      return true;
    });
  }, [requests, search, filters]);

  /** Active filters as removable chips, filling the gap above the table (§F14). */
  const chips = useMemo(() => {
    const out: { key: keyof Filters; label: string }[] = [];
    if (filters.department !== ALL)
      out.push({ key: "department", label: `Department: ${filters.department}` });
    if (filters.leaveType !== ALL)
      out.push({
        key: "leaveType",
        label: `Type: ${LEAVE_TYPE_LABELS[filters.leaveType as LeaveTypeName]}`,
      });
    if (filters.status !== ALL)
      out.push({
        key: "status",
        label: `Status: ${LEAVE_STATUS_LABELS[filters.status as keyof typeof LEAVE_STATUS_LABELS]}`,
      });
    if (filters.manager !== ALL)
      out.push({ key: "manager", label: `Manager: ${filters.manager}` });
    if (filters.location !== ALL)
      out.push({ key: "location", label: `Location: ${filters.location}` });
    if (filters.employmentType !== ALL)
      out.push({
        key: "employmentType",
        label: `Employment: ${filters.employmentType}`,
      });
    if (filters.submittedBy !== ALL)
      out.push({ key: "submittedBy", label: `Submitted by: ${filters.submittedBy}` });
    if (filters.from) out.push({ key: "from", label: `From: ${filters.from}` });
    if (filters.to) out.push({ key: "to", label: `To: ${filters.to}` });
    return out;
  }, [filters]);

  const activeFilters = chips.length;

  const clearFilter = (key: keyof Filters) =>
    setFilter(key, key === "from" || key === "to" ? "" : ALL);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  // Only open requests can be actioned in bulk.
  const selectedActionable = useMemo(
    () =>
      selectedIds.filter((id) =>
        filtered.some((r) => r.id === id && isOpenLeaveStatus(r.status)),
      ),
    [selectedIds, filtered],
  );

  const identity = useEmployeeIdentity();
  const columns = useMemo<ColumnDef<LeaveRequest>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: sortableHeader("Employee"),
        cell: ({ row }) => {
          const isOnLeaveNow =
            row.original.status === "approved" &&
            row.original.startDate <= today &&
            row.original.endDate >= today;
          return (
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
                {row.original.employeeInitials}
                {isOnLeaveNow && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500 ring-1 ring-background"
                    title="On leave today"
                  />
                )}
              </div>
              <div>
                <p className="text-xs font-medium leading-tight">
                  {row.original.employeeName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {row.original.department}
                </p>
              </div>
            </div>
          );
        },
      },
      ...employeeIdColumns<LeaveRequest>({
        identity,
        systemId: (r) => r.employeeId,
        name: (r) => r.employeeName,
      }),
      {
        accessorKey: "leaveType",
        header: sortableHeader("Leave Type"),
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
              LEAVE_TYPE_STYLES[row.original.leaveType as LeaveTypeName],
            )}
          >
            {LEAVE_TYPE_LABELS[row.original.leaveType as LeaveTypeName]}
          </span>
        ),
      },
      {
        // Sorting by start date — this column had no sort at all (§F5).
        id: "dateRange",
        accessorFn: (r) => r.startDate,
        header: sortableHeader("Date Range"),
        cell: ({ row }) => (
          <div>
            <span className="text-xs">
              {formatDate(row.original.startDate)}
              {row.original.startDate !== row.original.endDate && (
                <> – {formatDate(row.original.endDate)}</>
              )}
            </span>
            {row.original.isHalfDay && row.original.halfDayPeriod && (
              <p className="text-[10px] text-muted-foreground capitalize">
                {row.original.halfDayPeriod} half
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "totalDays",
        header: sortableHeader("Duration"),
        cell: ({ row }) => (
          <span className="text-xs font-medium">
            {row.original.totalDays === 0.5
              ? "½ day"
              : `${row.original.totalDays} day${row.original.totalDays !== 1 ? "s" : ""}`}
          </span>
        ),
      },
      {
        accessorKey: "reliefEmployeeName",
        header: sortableHeader("Relief"),
        cell: ({ row }) =>
          row.original.reliefEmployeeName ? (
            <span className="text-xs text-foreground">
              {row.original.reliefEmployeeName}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
          ),
      },
      {
        accessorKey: "submittedAt",
        header: sortableHeader("Submitted"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.submittedAt)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
              LEAVE_STATUS_STYLES[row.original.status],
            )}
          >
            {LEAVE_STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      actionsColumn<LeaveRequest>((req) => {
        const open = isOpenLeaveStatus(req.status);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem className="text-xs gap-2" onClick={() => onView(req)}>
                <Eye className="w-3.5 h-3.5" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2" onClick={() => onView(req)}>
                <History className="w-3.5 h-3.5" />
                View history
              </DropdownMenuItem>
              {open && canApprove && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-xs gap-2 text-emerald-600 focus:text-emerald-600"
                    onClick={() => onApprove(req.id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs gap-2 text-destructive focus:text-destructive"
                    onClick={() => onRejectClick(req)}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
              {open && canCreate && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-xs gap-2"
                    onClick={() => onEdit(req)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs gap-2 text-muted-foreground"
                    onClick={() => onCancel(req)}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Cancel request
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }),
    ],
    [today, canApprove, canCreate, onView, onApprove, onRejectClick, onEdit, onCancel, identity],
  );

  const filterSelect = (
    key: keyof Filters,
    label: string,
    allLabel: string,
    items: { value: string; label: string }[],
  ) => (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Select value={filters[key]} onValueChange={(v) => setFilter(key, v)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL} className="text-xs">
            {allLabel}
          </SelectItem>
          {items.map((i) => (
            <SelectItem key={i.value} value={i.value} className="text-xs">
              {i.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative min-w-48 max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by employee, department or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Eight filters no longer fit a dropdown — this is a grouped popover. */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="lg">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFilters > 0 && (
                  <span className="flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {filterSelect(
                  "department",
                  "Department",
                  "All departments",
                  DEPARTMENTS.map((d) => ({ value: d, label: d })),
                )}
                {filterSelect(
                  "leaveType",
                  "Leave type",
                  "All types",
                  LEAVE_TYPE_OPTIONS.map((t) => ({
                    value: t,
                    label: LEAVE_TYPE_LABELS[t],
                  })),
                )}
                {filterSelect(
                  "status",
                  "Status",
                  "All statuses",
                  LEAVE_STATUS_OPTIONS.map((s) => ({
                    value: s,
                    label: LEAVE_STATUS_LABELS[s],
                  })),
                )}
                {filterSelect(
                  "manager",
                  "Manager",
                  "All managers",
                  options.managers.map((m) => ({ value: m, label: m })),
                )}
                {filterSelect(
                  "location",
                  "Location",
                  "All locations",
                  options.locations.map((l) => ({ value: l, label: l })),
                )}
                {filterSelect(
                  "employmentType",
                  "Employment type",
                  "All types",
                  options.employmentTypes.map((t) => ({ value: t, label: t })),
                )}
                <div className="col-span-2">
                  {filterSelect(
                    "submittedBy",
                    "Submitted by",
                    "Anyone",
                    options.submitters.map((s) => ({ value: s, label: s })),
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={filters.from}
                    onChange={(e) => setFilter("from", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={filters.to}
                    onChange={(e) => setFilter("to", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              {activeFilters > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 h-7 w-full text-xs text-muted-foreground"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
                  Clear all filters
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {/* Export lives on the DataTable below — a second button here put
              two Export menus on the page over the same filtered rows. */}

          {canCreate && (
            <Button size="lg" onClick={onNewRequest}>
              <Plus className="w-3.5 h-3.5" />
              New Request
            </Button>
          )}
        </div>
      </div>

      {/* Active filter chips + bulk actions fill what was dead space (§F14). */}
      {(chips.length > 0 || selectedActionable.length > 0) && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {chips.map((c) => (
            <Badge
              key={c.key}
              variant="outline"
              className="gap-1 pl-2 pr-1 py-0.5 text-[11px] font-normal"
            >
              {c.label}
              <button
                type="button"
                onClick={() => clearFilter(c.key)}
                aria-label={`Remove filter ${c.label}`}
                className="rounded-full p-0.5 hover:bg-muted"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}
          {chips.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] text-muted-foreground"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Clear all
            </Button>
          )}

          {selectedActionable.length > 0 && canApprove && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {selectedActionable.length} selected
              </span>
              <Button
                size="sm"
                className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  onBulkApprove(selectedActionable);
                  setSelectedIds([]);
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => {
                  onBulkReject(selectedActionable);
                  setSelectedIds([]);
                }}
              >
                <XCircle className="w-3.5 h-3.5" /> Reject selected
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <DataTable
          exportTitle="Leave Requests"
          columns={columns}
          initialColumnVisibility={HIDE_SYSTEM_ID}
          enableColumnVisibility
          data={filtered}
          getRowId={(r) => r.id}
          enableSelection
          onSelectionChange={setSelectedIds}
          emptyMessage="No leave requests found."
        />
      </div>
    </>
  );
}
