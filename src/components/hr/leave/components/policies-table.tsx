"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  FileText,
  Paperclip,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_STYLES,
  LEAVE_TYPE_OPTIONS,
} from "../data";
import type { LeavePolicy, LeaveTypeName } from "../types";

interface PoliciesTableProps {
  policies: LeavePolicy[];
  onEdit: (policy: LeavePolicy) => void;
  onDelete: (id: string) => void;
  onAddPolicy: () => void;
}

export function PoliciesTable({
  policies,
  onEdit,
  onDelete,
  onAddPolicy,
}: PoliciesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return policies.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        (p.eligibility?.toLowerCase().includes(q) ?? false);
      const matchType = typeFilter === "all" || p.leaveType === typeFilter;
      return matchSearch && matchType;
    });
  }, [policies, search, typeFilter]);

  const columns = useMemo<ColumnDef<LeavePolicy>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Policy Name"),
        cell: ({ row }) => (
          <div className="max-w-64">
            <p className="text-xs font-medium">{row.original.name}</p>
            {row.original.description && (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {row.original.description}
              </p>
            )}
            {/* Link out to the written policy document (§F13). */}
            {row.original.documentUrl && (
              <a
                href={row.original.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
              >
                <FileText className="w-2.5 h-2.5" /> Policy document
              </a>
            )}
          </div>
        ),
      },
      {
        // Who qualifies, and what evidence is needed (§F13).
        id: "eligibility",
        header: "Eligibility & Evidence",
        cell: ({ row }) => (
          <div className="max-w-56 space-y-0.5">
            <p className="text-[11px] text-foreground">
              {row.original.eligibility ?? "All employees"}
            </p>
            {row.original.attachmentRequirement && (
              <p className="text-[10px] text-muted-foreground">
                <Paperclip className="inline w-2.5 h-2.5 mr-0.5" />
                {row.original.attachmentRequirement}
              </p>
            )}
            {row.original.publicHolidayRule && (
              <p className="text-[10px] text-muted-foreground">
                Public holidays: {row.original.publicHolidayRule}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "leaveType",
        header: sortableHeader("Leave Type"),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${LEAVE_TYPE_STYLES[row.original.leaveType as LeaveTypeName]}`}
          >
            {LEAVE_TYPE_LABELS[row.original.leaveType as LeaveTypeName]}
          </span>
        ),
      },
      {
        accessorKey: "maxDaysPerYear",
        header: sortableHeader("Max Days/Year"),
        cell: ({ row }) => (
          <span className="text-xs font-medium">
            {row.original.maxDaysPerYear} days
          </span>
        ),
      },
      {
        accessorKey: "minNoticeDays",
        header: "Min Notice",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.minNoticeDays === 0
              ? "None"
              : `${row.original.minNoticeDays} day${row.original.minNoticeDays !== 1 ? "s" : ""}`}
          </span>
        ),
      },
      {
        accessorKey: "maxConsecutiveDays",
        header: "Max Consecutive",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.maxConsecutiveDays} days
          </span>
        ),
      },
      {
        id: "medCert",
        header: "Med. Cert",
        cell: ({ row }) =>
          row.original.requiresMedicalCertificate ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <X className="w-3.5 h-3.5 text-muted-foreground/40" />
          ),
      },
      {
        id: "carryOver",
        header: "Carry Over",
        cell: ({ row }) =>
          row.original.carryOverAllowed ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Up to {row.original.maxCarryOverDays}d
            </span>
          ) : (
            <X className="w-3.5 h-3.5 text-muted-foreground/40" />
          ),
      },
      actionsColumn<LeavePolicy>((policy) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onEdit(policy)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2 text-destructive focus:text-destructive"
              onClick={() => setDeleteId(policy.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onEdit],
  );

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search policies by name or eligibility..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All leave types
              </SelectItem>
              {LEAVE_TYPE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {LEAVE_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="lg" onClick={onAddPolicy}>
            <Plus className="w-3.5 h-3.5" />
            Add Policy
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <DataTable
          exportTitle="Leave Policies"
          columns={columns}
          data={filtered}
          getRowId={(p) => p.id}
          emptyMessage="No policies match your search."
        />
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this leave policy. Existing leave
              balances will not be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
