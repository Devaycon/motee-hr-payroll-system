"use client";

import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  SendHorizonal,
  Eye,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { PositionDetailModal } from "./position-detail-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import { STATUS_LABELS, STATUS_STYLES } from "../data";
import type { Position } from "../types";

interface PositionsTableProps {
  positions: Position[];
  onEdit: (position: Position) => void;
  onDelete: (id: string) => void;
  onRaiseRequisition: (position: Position) => void;
}

export function PositionsTable({
  positions,
  onEdit,
  onDelete,
  onRaiseRequisition,
}: PositionsTableProps) {
  const [detailPosition, setDetailPosition] = useState<Position | null>(null);

  const columns = useMemo<ColumnDef<Position>[]>(
    () => [
      {
        accessorKey: "title",
        header: sortableHeader("Position Title"),
        cell: ({ row }) => (
          <p className="font-medium text-foreground text-sm">
            {row.original.title}
          </p>
        ),
      },
      {
        accessorKey: "department",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <p className="text-sm text-muted-foreground">
            {row.original.department}
          </p>
        ),
      },
      {
        accessorKey: "grade",
        header: "Grade / Level",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
            {row.original.grade}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs">
            {row.original.description}
          </p>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              STATUS_STYLES[row.original.status],
            )}
          >
            {STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      actionsColumn<Position>((position) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => setDetailPosition(position)}
            >
              <Eye className="w-3.5 h-3.5" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onEdit(position)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Position
            </DropdownMenuItem>
            {position.status === "vacant" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs gap-2 text-blue-600 dark:text-blue-400 focus:text-blue-600 dark:focus:text-blue-400"
                  onClick={() => onRaiseRequisition(position)}
                >
                  <SendHorizonal className="w-3.5 h-3.5" />
                  Raise Requisition
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-xs gap-2 text-destructive focus:text-destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Position</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-foreground">
                      {position.title}
                    </span>
                    ? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onDelete(position.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onEdit, onDelete, onRaiseRequisition],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={positions}
        getRowId={(p) => p.id}
        emptyMessage="No positions found."
      />

      <PositionDetailModal
        position={detailPosition}
        open={!!detailPosition}
        onOpenChange={(v) => {
          if (!v) setDetailPosition(null);
        }}
      />
    </>
  );
}
