"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Paperclip } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, sortableHeader } from "@/src/components/shared/data-table";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { formatDate } from "@/src/lib/utils/format-date";
import {
  currentExpenseStage,
  expenseStatusLabel,
  expenseStatusStyle,
  type ExpenseStage,
} from "@/src/lib/expenses/stages";
import { claimAmountLabel } from "@/src/components/shared/expenses/claim-cards";
import { ClaimProgress } from "@/src/components/employee/expenses/components/claim-progress";
import {
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseClaim,
} from "@/src/data/employee-expenses-demo";

interface ClaimsTableProps {
  claims: ExpenseClaim[];
  stages: ExpenseStage[];
  emptyMessage: string;
}

export function ClaimsTable({ claims, stages, emptyMessage }: ClaimsTableProps) {
  const router = useRouter();
  const { format, code } = useCurrency();

  const columns = useMemo<ColumnDef<ExpenseClaim>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <PersonAvatar
              name={row.original.employeeName ?? "Unassigned"}
              initials={row.original.employeeInitials}
              className="size-7"
              fallbackClassName="bg-primary/10 text-primary text-[10px] font-semibold"
            />
            <div className="leading-tight">
              <p className="text-sm font-medium text-foreground">
                {row.original.employeeName ?? "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {row.original.department ?? "—"}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "title",
        header: sortableHeader("Claim"),
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="text-sm font-medium text-foreground">
              {row.original.title}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.merchant}
              {row.original.reference && (
                <span className="font-mono"> · {row.original.reference}</span>
              )}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: sortableHeader("Category"),
        cell: ({ row }) => {
          const Icon = EXPENSE_CATEGORY_ICONS[row.original.category];
          return (
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {EXPENSE_CATEGORY_LABELS[row.original.category]}
            </span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: sortableHeader("Amount"),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">
            {claimAmountLabel(row.original, code, format)}
          </span>
        ),
      },
      {
        accessorKey: "dateSubmitted",
        header: sortableHeader("Date"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.dateSubmitted)}
          </span>
        ),
      },
      {
        id: "receipt",
        header: "Receipt",
        // The chain requires receipts, so a missing one has to be visible
        // before an approver decides, not buried in the detail page.
        cell: ({ row }) => {
          const files = row.original.attachments ?? [];
          if (files.length === 0) {
            return (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400"
              >
                None
              </Badge>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              {files.length}
            </span>
          );
        },
      },
      {
        id: "desk",
        header: "With",
        cell: ({ row }) => {
          const stage = currentExpenseStage(row.original, stages);
          if (!stage) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <div className="leading-tight">
              <p className="text-sm text-foreground">
                {row.original.currentApproverName ?? stage.approverLabel}
              </p>
              <p className="text-[11px] text-muted-foreground">{stage.label}</p>
            </div>
          );
        },
      },
      {
        id: "progress",
        header: "Progress",
        cell: ({ row }) => (
          <ClaimProgress claim={row.original} stages={stages} />
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "px-2 py-0.5 text-[10px] font-medium",
              expenseStatusStyle(row.original),
            )}
          >
            {expenseStatusLabel(row.original)}
          </Badge>
        ),
      },
    ],
    [format, code, stages],
  );

  return (
    <DataTable
      exportTitle="Expense Claims"
      columns={columns}
      data={claims}
      getRowId={(c) => c.id}
      onRowClick={(c) => router.push(`/time-payroll/expenses/${c.id}`)}
      emptyMessage={emptyMessage}
    />
  );
}
