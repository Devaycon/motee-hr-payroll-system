"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Search,
  Eye,
  Pencil,
  Archive,
  Trash2,
  XCircle,
} from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
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

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="text-xs font-semibold">Survey</TableHead>
              <TableHead className="text-xs font-semibold">Type</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold">
                Response Rate
              </TableHead>
              <TableHead className="text-xs font-semibold">Audience</TableHead>
              <TableHead className="text-xs font-semibold">
                Date Range
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-sm text-muted-foreground py-10"
                >
                  No surveys match your filters.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((survey) => {
              const typeConfig = SURVEY_TYPE_CONFIG[survey.type];
              const statusConfig = SURVEY_STATUS_CONFIG[survey.status];
              const rate = getResponseRate(survey);

              return (
                <TableRow key={survey.id} className="hover:bg-muted/50">
                  <TableCell className="py-3">
                    <div className="max-w-65">
                      <p className="font-medium text-sm text-foreground truncate">
                        {survey.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {survey.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${typeConfig.color} ${typeConfig.bg} ${typeConfig.border} gap-1`}
                    >
                      {typeConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
                    >
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="w-28 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {survey.responses.length}/{survey.totalTargeted}
                        </span>
                        <span className="font-medium">{rate}%</span>
                      </div>
                      <Progress value={rate} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {AUDIENCE_LABEL[survey.audience] ?? survey.audience}
                    {survey.targetDepartments &&
                      survey.targetDepartments.length > 0 && (
                        <span className="text-xs block text-muted-foreground/70">
                          {survey.targetDepartments.join(", ")}
                        </span>
                      )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {survey.startDate ? (
                      <span>
                        {survey.startDate}
                        {survey.endDate ? ` → ${survey.endDate}` : ""}
                      </span>
                    ) : (
                      <span className="italic">Not scheduled</span>
                    )}
                  </TableCell>
                  <TableCell>
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
                            survey.status === "closed" ||
                            survey.status === "archived"
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
