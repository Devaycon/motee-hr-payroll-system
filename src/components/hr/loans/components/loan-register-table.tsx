"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { DataTable, sortableHeader } from "@/src/components/shared/data-table";
import { EmployeeLink } from "@/src/components/shared/employee-link";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { formatDate } from "@/src/lib/utils/format-date";
import { cn } from "@/src/lib/utils";
import {
  LOANS_HREF,
  LOAN_STATUS_LABELS,
  LOAN_STATUS_STYLES,
  loanTypeLabel,
  type LoanStatus,
} from "@/src/lib/loans/loans";
import type { LoanRow } from "@/src/lib/loans/use-loans";

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] font-medium", LOAN_STATUS_STYLES[status])}>
      {LOAN_STATUS_LABELS[status]}
    </Badge>
  );
}

interface LoanRegisterTableProps {
  rows: LoanRow[];
  /** Hide the employee column on a single employee's view. */
  showEmployee?: boolean;
  /** Where a row click goes; defaults to the HR loan page. */
  hrefFor?: (row: LoanRow) => string;
  exportTitle?: string;
}

/**
 * The Staff Loan Register — loan type, amount, issue date, repayment period,
 * monthly repayment, outstanding balance, status and approver.
 */
export function LoanRegisterTable({
  rows,
  showEmployee = true,
  hrefFor = (r) => `${LOANS_HREF}/${r.id}`,
  exportTitle = "Staff Loan Register",
}: LoanRegisterTableProps) {
  const router = useRouter();
  const { format } = useCurrency();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | LoanStatus>("all");
  const [type, setType] = useState("all");

  const types = useMemo(() => [...new Set(rows.map((r) => r.loanType))], [rows]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => status === "all" || r.status === status)
      .filter((r) => type === "all" || r.loanType === type)
      .filter(
        (r) =>
          !q ||
          [r.employee?.fullName, r.purpose, loanTypeLabel(r.loanType), r.employee?.departmentName]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(q)),
      );
  }, [rows, search, status, type]);

  const columns = useMemo<ColumnDef<LoanRow>[]>(() => {
    const cols: ColumnDef<LoanRow>[] = [];
    if (showEmployee) {
      cols.push({
        id: "employee",
        accessorFn: (r) => r.employee?.fullName ?? "",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EmployeeLink
              name={row.original.employee?.fullName ?? row.original.employeeId}
              employeeId={row.original.employeeId}
              gender={row.original.employee?.gender}
            />
            <p className="ml-7 text-[10px] text-muted-foreground">
              {row.original.employee?.departmentName}
            </p>
          </div>
        ),
      });
    }
    cols.push(
      {
        id: "loanType",
        accessorFn: (r) => loanTypeLabel(r.loanType),
        header: sortableHeader("Loan Type"),
        cell: ({ row }) => (
          <div className="max-w-44">
            <p className="text-xs font-medium">{loanTypeLabel(row.original.loanType)}</p>
            <p className="truncate text-[10px] text-muted-foreground">{row.original.purpose}</p>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: sortableHeader("Loan Amount"),
        cell: ({ row }) => <span className="text-xs tabular-nums">{format(row.original.amount)}</span>,
      },
      {
        id: "issuedAt",
        accessorFn: (r) => r.issuedAt ?? r.requestedAt,
        header: sortableHeader("Date Issued"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.issuedAt ? formatDate(row.original.issuedAt) : `Requested ${formatDate(row.original.requestedAt)}`}
          </span>
        ),
      },
      {
        accessorKey: "repaymentMonths",
        header: sortableHeader("Repayment Period"),
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.repaymentMonths} month{row.original.repaymentMonths === 1 ? "" : "s"}
          </span>
        ),
      },
      {
        accessorKey: "monthlyRepayment",
        header: sortableHeader("Monthly Repayment"),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums">
            {format(row.original.monthlyRepayment, { decimals: true })}
          </span>
        ),
      },
      {
        accessorKey: "outstanding",
        header: sortableHeader("Outstanding Balance"),
        cell: ({ row }) => (
          <span className={cn("text-xs font-medium tabular-nums", row.original.status === "defaulted" && "text-rose-600")}>
            {format(row.original.outstanding, { decimals: true })}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => <LoanStatusBadge status={row.original.status} />,
      },
      {
        id: "approver",
        accessorFn: (r) => r.approverName ?? "",
        header: "Approver",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.approverName ??
              (row.original.status === "pending" && row.original.request
                ? `With ${row.original.request.steps[row.original.request.currentStepIndex]?.label ?? "approver"}`
                : "—")}
          </span>
        ),
      },
    );
    return cols;
  }, [format, showEmployee]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee, loan type or purpose..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as "all" | LoanStatus)}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            {(Object.keys(LOAN_STATUS_LABELS) as LoanStatus[]).map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {LOAN_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All loan types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">
                {loanTypeLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        exportTitle={exportTitle}
        columns={columns}
        data={filtered}
        getRowId={(r) => r.id}
        onRowClick={(r) => router.push(hrefFor(r))}
        emptyMessage="No loans match this view."
      />
    </div>
  );
}
