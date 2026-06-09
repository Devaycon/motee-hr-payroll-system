"use client";

import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  Eye,
  FileText,
  FolderInput,
  Pencil,
  PenLine,
  Trash2,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_STYLES,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPE_STYLES,
  SIGNATURE_STATUS_LABELS,
  SIGNATURE_STATUS_STYLES,
  CONTRACT_TYPE_OPTIONS,
  CONTRACT_STATUS_OPTIONS,
  DEPARTMENT_OPTIONS,
} from "../data";
import type { Contract, ContractStatus, ContractType } from "../types";

interface ContractsTableProps {
  contracts: Contract[];
  onAdd: () => void;
  onView: (contract: Contract) => void;
  onEdit: (contract: Contract) => void;
  onSign: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
  onPreview?: (contract: Contract) => void;
  onMoveToDocuments?: (contract: Contract) => void;
}

export function ContractsTable({
  contracts,
  onAdd,
  onView,
  onEdit,
  onSign,
  onDelete,
  onPreview,
  onMoveToDocuments,
}: ContractsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContractType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">(
    "all",
  );
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.employeeName.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q);
    const matchType = typeFilter === "all" || c.contractType === typeFilter;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchDept = deptFilter === "all" || c.department === deptFilter;
    return matchSearch && matchType && matchStatus && matchDept;
  });

  function formatDate(date?: string) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function formatSalary(amount?: number, currency?: string) {
    if (!amount) return "—";
    if (currency === "NGN") return `₦${amount.toLocaleString("en-NG")}`;
    return `${currency} ${amount.toLocaleString()}`;
  }

  const columns = useMemo<ColumnDef<Contract>[]>(
    () => [
      {
        id: "index",
        header: "#",
        cell: ({ row }) => (
          <span className="pl-2 text-xs text-muted-foreground">
            {row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: sortableHeader("Contract"),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium leading-tight">
              {row.original.title}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "employeeName",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {row.original.employeeInitials}
            </div>
            <div>
              <p className="text-sm font-medium">{row.original.employeeName}</p>
              <p className="text-xs text-muted-foreground">
                {row.original.department}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "contractType",
        header: sortableHeader("Type"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`text-xs ${CONTRACT_TYPE_STYLES[row.original.contractType]}`}
          >
            {CONTRACT_TYPE_LABELS[row.original.contractType]}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`text-xs ${CONTRACT_STATUS_STYLES[row.original.status]}`}
          >
            {CONTRACT_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "signatureStatus",
        header: sortableHeader("Signature"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`text-xs ${SIGNATURE_STATUS_STYLES[row.original.signatureStatus]}`}
          >
            {SIGNATURE_STATUS_LABELS[row.original.signatureStatus]}
          </Badge>
        ),
      },
      {
        accessorKey: "startDate",
        header: sortableHeader("Start Date"),
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.startDate)}</span>
        ),
      },
      {
        accessorKey: "endDate",
        header: sortableHeader("End Date"),
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.endDate)}</span>
        ),
      },
      {
        id: "salary",
        header: "Salary / Rate",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatSalary(row.original.salary, row.original.contractCurrency)}
          </span>
        ),
      },
      actionsColumn<Contract>((contract) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onView(contract)}>
              <Eye className="mr-2 size-4" />
              View Details
            </DropdownMenuItem>
            {onPreview && (
              <DropdownMenuItem onClick={() => onPreview(contract)}>
                <FileText className="mr-2 size-4" />
                Preview Letter
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(contract)}>
              <Pencil className="mr-2 size-4" />
              Edit Contract
            </DropdownMenuItem>
            {contract.signatureStatus !== "fully_signed" && (
              <DropdownMenuItem onClick={() => onSign(contract)}>
                <PenLine className="mr-2 size-4" />
                Record Signature
              </DropdownMenuItem>
            )}
            {onMoveToDocuments && !contract.movedToDocuments && (
              <DropdownMenuItem onClick={() => onMoveToDocuments(contract)}>
                <FolderInput className="mr-2 size-4" />
                Move to Documents
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(contract)}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onView, onEdit, onSign, onDelete, onPreview, onMoveToDocuments],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contracts or employees..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as ContractType | "all")}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Contract type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {CONTRACT_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ContractStatus | "all")}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {CONTRACT_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENT_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="lg" onClick={onAdd} className="shrink-0">
          <PlusCircle className="mr-2 size-4" />
          New Contract
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(c) => c.id}
        onRowClick={(c) => onView(c)}
        emptyMessage="No contracts found."
      />
      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} contract{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
