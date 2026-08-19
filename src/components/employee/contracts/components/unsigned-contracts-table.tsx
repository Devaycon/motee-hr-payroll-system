"use client";

import { useMemo } from "react";
import { PenLine } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_STYLES,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPE_STYLES,
} from "@/src/data/contracts-demo";
import type { Contract } from "@/src/lib/types/contracts";

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

interface UnsignedContractsTableProps {
  contracts: Contract[];
  onSign: (contract: Contract) => void;
}

export function UnsignedContractsTable({
  contracts,
  onSign,
}: UnsignedContractsTableProps) {
  const columns = useMemo<ColumnDef<Contract>[]>(
    () => [
      {
        id: "index",
        header: "#",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.index + 1}</span>
        ),
      },
      {
        accessorKey: "title",
        header: sortableHeader("Contract"),
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="text-xs text-muted-foreground">{row.original.id}</p>
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
        accessorKey: "startDate",
        header: sortableHeader("Start Date"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.startDate)}
          </span>
        ),
      },
      {
        id: "salary",
        header: "Salary / Rate",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatSalary(row.original.salary, row.original.contractCurrency)}
          </span>
        ),
      },
      actionsColumn<Contract>((contract) => (
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => onSign(contract)}
        >
          <PenLine className="size-3" />
          Sign
        </Button>
      )),
    ],
    [onSign],
  );

  return (
    <DataTable
      exportTitle="Unsigned Contracts"
      columns={columns}
      data={contracts}
      getRowId={(c) => c.id}
      emptyMessage="No unsigned contracts."
    />
  );
}
