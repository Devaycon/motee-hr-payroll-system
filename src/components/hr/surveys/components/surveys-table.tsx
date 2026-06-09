"use client";

import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  Search,
  Eye,
  Pencil,
  Archive,
  Trash2,
  XCircle,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Progress } from "@/src/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import {
  SURVEY_STATUS_CONFIG,
  SURVEY_TYPE_CONFIG,
  AUDIENCE_LABEL,
  SURVEY_TYPE_OPTIONS,
  SURVEY_STATUS_OPTIONS,
  getResponseRate,
} from "../data";
import type { Survey, SurveyType, SurveyStatus } from "../types";

interface SurveysTableProps {
  surveys: Survey[];
  onViewResults: (survey: Survey) => void;
  onEdit: (survey: Survey) => void;
  onClose: (survey: Survey) => void;
  onArchive: (survey: Survey) => void;
  onDelete: (survey: Survey) => void;
}

export function SurveysTable({
  surveys,
  onViewResults,
  onEdit,
  onClose,
  onArchive,
  onDelete,
}: SurveysTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SurveyType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | "all">("all");

  const filtered = surveys.filter((s) => {
    const matchSearch =
      search === "" ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || s.type === typeFilter;
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const columns = useMemo<ColumnDef<Survey>[]>(
    () => [
      {
        accessorKey: "title",
        header: sortableHeader("Survey"),
        cell: ({ row }) => (
          <div className="max-w-65">
            <p className="font-medium text-sm text-foreground truncate">
              {row.original.title}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {row.original.description}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: sortableHeader("Type"),
        cell: ({ row }) => {
          const typeConfig = SURVEY_TYPE_CONFIG[row.original.type];
          return (
            <Badge
              variant="outline"
              className={`text-xs ${typeConfig.color} ${typeConfig.bg} ${typeConfig.border} gap-1`}
            >
              {typeConfig.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => {
          const statusConfig = SURVEY_STATUS_CONFIG[row.original.status];
          return (
            <Badge
              variant="outline"
              className={`text-xs ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
            >
              {statusConfig.label}
            </Badge>
          );
        },
      },
      {
        id: "responseRate",
        header: "Response Rate",
        cell: ({ row }) => {
          const rate = getResponseRate(row.original);
          return (
            <div className="w-28 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {row.original.responses.length}/{row.original.totalTargeted}
                </span>
                <span className="font-medium">{rate}%</span>
              </div>
              <Progress value={rate} className="h-1.5" />
            </div>
          );
        },
      },
      {
        accessorKey: "audience",
        header: "Audience",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {AUDIENCE_LABEL[row.original.audience] ?? row.original.audience}
            {row.original.targetDepartments &&
              row.original.targetDepartments.length > 0 && (
                <span className="text-xs block text-muted-foreground/70">
                  {row.original.targetDepartments.join(", ")}
                </span>
              )}
          </span>
        ),
      },
      {
        id: "dateRange",
        header: "Date Range",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.startDate ? (
              <span>
                {row.original.startDate}
                {row.original.endDate ? ` → ${row.original.endDate}` : ""}
              </span>
            ) : (
              <span className="italic">Not scheduled</span>
            )}
          </span>
        ),
      },
      actionsColumn<Survey>((survey) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => onViewResults(survey)}
              disabled={survey.responses.length === 0}
              className="gap-2 text-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              View Results
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEdit(survey)}
              disabled={
                survey.status === "closed" || survey.status === "archived"
              }
              className="gap-2 text-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onClose(survey)}
              disabled={survey.status !== "active"}
              className="gap-2 text-sm text-amber-600 focus:text-amber-600"
            >
              <XCircle className="w-3.5 h-3.5" />
              Close Survey
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onArchive(survey)}
              disabled={survey.isArchived}
              className="gap-2 text-sm"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(survey)}
              className="gap-2 text-sm text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onViewResults, onEdit, onClose, onArchive, onDelete],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search surveys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as SurveyType | "all")}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {SURVEY_TYPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {SURVEY_TYPE_CONFIG[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as SurveyStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {SURVEY_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {SURVEY_STATUS_CONFIG[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(s) => s.id}
        emptyMessage="No surveys match your filters."
      />
    </div>
  );
}
