"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
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
import { Card } from "@/src/components/ui/card";

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
      month: "short",
      year: "numeric",
    });
  }

  function formatSalary(amount?: number, currency?: string) {
    if (!amount) return "—";
    if (currency === "NGN") return `₦${amount.toLocaleString("en-NG")}`;
    return `${currency} ${amount.toLocaleString()}`;
  }

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

      <Card className="rounded-lg border border-border/60 bg-card p-3">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60">
              <TableHead className="w-10 pl-4">#</TableHead>
              <TableHead>Contract</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Signature</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Salary / Rate</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No contracts found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((contract, idx) => (
                <TableRow
                  key={contract.id}
                  className="cursor-pointer border-border/60 hover:bg-muted/40"
                  onClick={() => onView(contract)}
                >
                  <TableCell className="pl-4 text-xs text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-tight">
                        {contract.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contract.id}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {contract.employeeInitials}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {contract.employeeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contract.department}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Badge
                      variant="outline"
                      className={`text-xs ${CONTRACT_TYPE_STYLES[contract.contractType]}`}
                    >
                      {CONTRACT_TYPE_LABELS[contract.contractType]}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Badge
                      variant="outline"
                      className={`text-xs ${CONTRACT_STATUS_STYLES[contract.status]}`}
                    >
                      {CONTRACT_STATUS_LABELS[contract.status]}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Badge
                      variant="outline"
                      className={`text-xs ${SIGNATURE_STATUS_STYLES[contract.signatureStatus]}`}
                    >
                      {SIGNATURE_STATUS_LABELS[contract.signatureStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(contract.startDate)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(contract.endDate)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatSalary(contract.salary, contract.contractCurrency)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
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
                          <DropdownMenuItem
                            onClick={() => onMoveToDocuments(contract)}
                          >
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {filtered.length > 0 && (
          <div className="border-t border-border/60 px-4 py-2.5">
            <p className="text-xs text-muted-foreground">
              {filtered.length} contract{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
