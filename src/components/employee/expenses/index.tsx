"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Wallet,
  Clock,
  CircleCheck,
  Banknote,
  Paperclip,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  DataTable,
  sortableHeader,
} from "@/src/components/shared/data-table";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { formatDate } from "@/src/lib/utils/format-date";
import { cn } from "@/src/lib/utils";
import {
  EMPLOYEE_EXPENSES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_STYLES,
  type ExpenseClaim,
} from "@/src/data/employee-expenses-demo";
import { ExpenseFormModal } from "./components/expense-form-modal";

export function ExpensesPage() {
  const { format, code } = useCurrency();
  const [claims, setClaims] = useState<ExpenseClaim[]>(EMPLOYEE_EXPENSES);
  const [modalOpen, setModalOpen] = useState(false);

  const stats = useMemo<HrStatCardItem[]>(() => {
    const sum = (rows: ExpenseClaim[]) =>
      rows.reduce((acc, c) => acc + c.amount, 0);
    const pending = claims.filter(
      (c) => c.status === "submitted" || c.status === "draft",
    );
    const approved = claims.filter((c) => c.status === "approved");
    const reimbursed = claims.filter((c) => c.status === "reimbursed");
    return [
      {
        icon: Wallet,
        label: "Total Claimed",
        value: format(sum(claims)),
        sub: `${claims.length} claims`,
      },
      {
        icon: Clock,
        label: "Pending",
        value: format(sum(pending)),
        sub: `${pending.length} awaiting review`,
      },
      {
        icon: CircleCheck,
        label: "Approved",
        value: format(sum(approved)),
        sub: `${approved.length} approved`,
      },
      {
        icon: Banknote,
        label: "Reimbursed",
        value: format(sum(reimbursed)),
        sub: `${reimbursed.length} paid out`,
      },
    ];
  }, [claims, format]);

  const columns = useMemo<ColumnDef<ExpenseClaim>[]>(
    () => [
      {
        accessorKey: "title",
        header: sortableHeader("Expense"),
        cell: ({ row }) => (
          <div>
            <span className="text-sm font-medium text-foreground">
              {row.original.title}
            </span>
            <p className="text-[11px] text-muted-foreground">
              {row.original.merchant}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: sortableHeader("Category"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {EXPENSE_CATEGORY_LABELS[row.original.category]}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: sortableHeader("Amount"),
        cell: ({ row }) => {
          const { currency, amount } = row.original;
          // Show the original currency code when it differs from the tenant default.
          const showCode = currency && currency !== code;
          return (
            <span className="text-sm font-medium text-foreground">
              {showCode
                ? `${currency} ${amount.toLocaleString()}`
                : format(amount)}
            </span>
          );
        },
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
        id: "attachments",
        header: "Receipt",
        cell: ({ row }) => {
          const files = row.original.attachments ?? [];
          if (files.length === 0)
            return <span className="text-xs text-muted-foreground">—</span>;
          // Straight to the file for a single receipt; a count when there are
          // several, since the row has no room to list them.
          return (
            <a
              href={files[0].dataUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              title={files.map((f) => f.name).join(", ")}
            >
              <Paperclip className="h-3 w-3" />
              {files.length === 1 ? "View" : `${files.length} files`}
            </a>
          );
        },
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-medium",
              EXPENSE_STATUS_STYLES[row.original.status],
            )}
          >
            {EXPENSE_STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
    ],
    [format, code],
  );

  function handleSave(claim: Omit<ExpenseClaim, "id">) {
    setClaims((prev) => [
      { ...claim, id: `exp-${Date.now()}` },
      ...prev,
    ]);
    setModalOpen(false);
    const count = claim.attachments?.length ?? 0;
    toast.success(
      count > 0
        ? `Expense claim submitted with ${count} attachment${count === 1 ? "" : "s"}.`
        : "Expense claim submitted.",
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Expenses</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Submit and track your expense claims and reimbursements.
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New Expense Claim
        </Button>
      </div>

      <HrStatCardsGrid stats={stats} columns={4} />

      <DataTable
        columns={columns}
        data={claims}
        getRowId={(c) => c.id}
        searchPlaceholder="Search expenses…"
        emptyMessage="No expense claims yet."
      />

      <ExpenseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
