"use client";

import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Users,
  MoreHorizontal,
  ArrowRight,
  Eye,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";
import {
  STAGE_LABELS,
  STAGE_STYLES,
  STAGE_ORDER,
  SOURCE_LABELS,
} from "../data";
import type { Applicant, ApplicationStage } from "../types";
import { ApplicantDetailModal } from "./applicant-detail-modal";

interface ApplicantsTableProps {
  applicants: Applicant[];
  onStageChange: (id: string, stage: ApplicationStage) => void;
  onReject: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  stageFilter: string;
  onStageFilterChange: (v: string) => void;
  requisitionFilter: string;
  onRequisitionFilterChange: (v: string) => void;
  requisitionTitles: string[];
}

export function ApplicantsTable({
  applicants,
  onStageChange,
  onReject,
  search,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
  requisitionFilter,
  onRequisitionFilterChange,
  requisitionTitles,
}: ApplicantsTableProps) {
  const hasFilter = stageFilter !== "all" || requisitionFilter !== "all";
  const [detailApplicant, setDetailApplicant] = useState<Applicant | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  function openDetail(applicant: Applicant) {
    setDetailApplicant(applicant);
    setDetailOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {hasFilter && (
                <span className="flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold">
                  {
                    [stageFilter !== "all", requisitionFilter !== "all"].filter(
                      Boolean,
                    ).length
                  }
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs">Role</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={requisitionFilter}
              onValueChange={onRequisitionFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Roles
              </DropdownMenuRadioItem>
              {requisitionTitles.map((t) => (
                <DropdownMenuRadioItem key={t} value={t} className="text-xs">
                  {t}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Stage</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={stageFilter}
              onValueChange={onStageFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Stages
              </DropdownMenuRadioItem>
              {(Object.keys(STAGE_LABELS) as ApplicationStage[]).map((s) => (
                <DropdownMenuRadioItem key={s} value={s} className="text-xs">
                  {STAGE_LABELS[s]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {hasFilter && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full text-xs text-muted-foreground"
                    onClick={() => {
                      onStageFilterChange("all");
                      onRequisitionFilterChange("all");
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {applicants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No applicants found
            </p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Applicant
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Applied
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Source
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Stage
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((applicant) => {
                    const currentStageIdx = STAGE_ORDER.indexOf(
                      applicant.stage,
                    );
                    const nextStage =
                      currentStageIdx >= 0 &&
                      currentStageIdx < STAGE_ORDER.length - 1
                        ? STAGE_ORDER[currentStageIdx + 1]
                        : null;

                    return (
                      <tr
                        key={applicant.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                                {applicant.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground leading-none">
                                {applicant.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {applicant.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-muted-foreground">
                            {applicant.requisitionTitle}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {applicant.applicationDate}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {SOURCE_LABELS[applicant.source]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                              STAGE_STYLES[applicant.stage],
                            )}
                          >
                            {STAGE_LABELS[applicant.stage]}
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
                                onClick={() => openDetail(applicant)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View Details
                              </DropdownMenuItem>
                              {nextStage && applicant.stage !== "rejected" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-xs gap-2 text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 dark:focus:text-emerald-400"
                                    onClick={() => openDetail(applicant)}
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                    Move to {STAGE_LABELS[nextStage]}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {applicant.stage !== "rejected" &&
                                applicant.stage !== "hired" && (
                                  <DropdownMenuItem
                                    className="text-xs gap-2 text-destructive focus:text-destructive"
                                    onClick={() => openDetail(applicant)}
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Reject
                                  </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ApplicantDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        applicant={detailApplicant}
        onStageChange={onStageChange}
        onReject={onReject}
      />
    </div>
  );
}
