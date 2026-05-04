"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  FileText,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  Users,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";
import {
  REQUISITION_STATUS_LABELS,
  REQUISITION_STATUS_STYLES,
  EMPLOYMENT_TYPE_LABELS,
  formatSalary,
} from "../data";
import type { JobRequisition } from "../types";
import { RequisitionDetailModal } from "./requisition-detail-modal";

interface RequisitionsTableProps {
  requisitions: JobRequisition[];
  onEdit: (req: JobRequisition) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClose: (id: string) => void;
  onViewApplicants: (req: JobRequisition) => void;
}

export function RequisitionsTable({
  requisitions,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onClose,
  onViewApplicants,
}: RequisitionsTableProps) {
  const [detailReq, setDetailReq] = useState<JobRequisition | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  function openDetail(req: JobRequisition) {
    setDetailReq(req);
    setDetailOpen(true);
  }

  if (requisitions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No requisitions found
          </p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Position
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Department
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Salary Range
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Openings
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Applicants
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {req.positionTitle}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {req.hiringManager}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-muted-foreground">
                        {req.department}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {EMPLOYMENT_TYPE_LABELS[req.employmentType]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatSalary(req.salaryMin)} –{" "}
                        {formatSalary(req.salaryMax)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground font-medium">
                        {req.openings}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => onViewApplicants(req)}
                      >
                        <Users className="w-3 h-3" />
                        {req.applicantCount}
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          REQUISITION_STATUS_STYLES[req.status],
                        )}
                      >
                        {REQUISITION_STATUS_LABELS[req.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="text-xs gap-2"
                            onClick={() => openDetail(req)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs gap-2"
                            onClick={() => onEdit(req)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit Requisition
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs gap-2"
                            onClick={() => onViewApplicants(req)}
                          >
                            <Users className="w-3.5 h-3.5" />
                            View Applicants
                          </DropdownMenuItem>
                          {req.status === "pending_approval" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-xs gap-2 text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 dark:focus:text-emerald-400"
                                onClick={() => openDetail(req)}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve / Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {req.status === "approved" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-xs gap-2 text-muted-foreground"
                                onClick={() => openDetail(req)}
                              >
                                <Lock className="w-3.5 h-3.5" />
                                Close Role
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs gap-2 text-destructive focus:text-destructive"
                            onClick={() => openDetail(req)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <RequisitionDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        requisition={detailReq}
        onEdit={onEdit}
        onDelete={onDelete}
        onApprove={onApprove}
        onReject={onReject}
        onClose={onClose}
        onViewApplicants={onViewApplicants}
      />
    </>
  );
}
