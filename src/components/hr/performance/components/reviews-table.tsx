"use client";

import { useState } from "react";
import { Star, MoreHorizontal, ClipboardList, Eye, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
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
      <Card className="mt-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Employee
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Department
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Review Type
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Period
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Reviewer
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Due Date
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Status
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Rating
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ClipboardList className="w-8 h-8 opacity-30" />
                        <p className="text-sm font-medium">No reviews found</p>
                        <p className="text-xs">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((review) => (
                    <tr
                      key={review.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
                            {review.employeeInitials}
                          </div>
                          <div>
                            <p className="text-xs font-medium leading-none">
                              {review.employeeName}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {review.jobTitle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {review.department}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${REVIEW_TYPE_STYLES[review.reviewType]}`}
                        >
                          {REVIEW_TYPE_LABELS[review.reviewType]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs">{review.period}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {review.reviewer}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.dueDate).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${REVIEW_STATUS_STYLES[review.status]}`}
                        >
                          {REVIEW_STATUS_LABELS[review.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <RatingStars rating={review.rating} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
