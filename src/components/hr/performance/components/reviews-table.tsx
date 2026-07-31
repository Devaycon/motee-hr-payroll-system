"use client";

import { useMemo, useState } from "react";
import { Star, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
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
  employeeIdColumns,
  HIDE_SYSTEM_ID,
} from "@/src/components/shared/employee-id-columns";
import { useEmployeeIdentity } from "@/src/lib/hooks/use-employee-identity";
import {
  REVIEW_TYPE_LABELS,
  REVIEW_TYPE_STYLES,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_STYLES,
} from "../data";
import type { PerformanceReview } from "../types";
import { ReviewsToolbar } from "./reviews-toolbar";

interface ReviewsTableProps {
  reviews: PerformanceReview[];
  onView: (review: PerformanceReview) => void;
  onDelete: (id: string) => void;
  onAddReview: () => void;
}

function RatingStars({ rating }: { rating?: number }) {
  if (!rating) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3 h-3 ${
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewsTable({
  reviews,
  onView,
  onDelete,
  onAddReview,
}: ReviewsTableProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.employeeName.toLowerCase().includes(q) ||
      (r.jobTitle ?? "").toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.reviewer.toLowerCase().includes(q);
    const matchDept = deptFilter === "all" || r.department === deptFilter;
    const matchType = typeFilter === "all" || r.reviewType === typeFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchDept && matchType && matchStatus;
  });

  const identity = useEmployeeIdentity();
  const columns = useMemo<ColumnDef<PerformanceReview>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
              {row.original.employeeInitials}
            </div>
            <div>
              <p className="text-xs font-medium leading-none">
                {row.original.employeeName}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {row.original.jobTitle}
              </p>
            </div>
          </div>
        ),
      },
      ...employeeIdColumns<PerformanceReview>({
        identity,
        name: (r) => r.employeeName,
      }),
      {
        accessorKey: "department",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: "reviewType",
        header: sortableHeader("Review Type"),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${REVIEW_TYPE_STYLES[row.original.reviewType]}`}
          >
            {REVIEW_TYPE_LABELS[row.original.reviewType]}
          </span>
        ),
      },
      {
        accessorKey: "period",
        header: "Period",
        cell: ({ row }) => (
          <span className="text-xs">{row.original.period}</span>
        ),
      },
      {
        accessorKey: "reviewer",
        header: sortableHeader("Reviewer"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.reviewer}
          </span>
        ),
      },
      {
        accessorKey: "dueDate",
        header: sortableHeader("Due Date"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.dueDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${REVIEW_STATUS_STYLES[row.original.status]}`}
          >
            {REVIEW_STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      {
        accessorKey: "rating",
        header: sortableHeader("Rating"),
        cell: ({ row }) => <RatingStars rating={row.original.rating} />,
      },
      actionsColumn<PerformanceReview>((review) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onView(review)}
            >
              <Eye className="w-3.5 h-3.5" />
              View / Complete
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2 text-destructive focus:text-destructive"
              onClick={() => setDeleteId(review.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onView, identity],
  );

  return (
    <>
      <ReviewsToolbar
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAddReview={onAddReview}
      />
      <div className="mt-4">
        <DataTable
          columns={columns}
          initialColumnVisibility={HIDE_SYSTEM_ID}
          enableColumnVisibility
          data={filtered}
          getRowId={(r) => r.id}
          emptyMessage="No reviews found."
        />
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this performance review. This action
              cannot be undone.
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
