"use client";

import { useState } from "react";
import {
  ChevronUp,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Star,
  Eye,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import {
  SUGGESTION_STATUS_CONFIG,
  SUGGESTION_CATEGORY_CONFIG,
  SUGGESTION_PRIORITY_CONFIG,
  SUGGESTION_CATEGORY_OPTIONS,
  SUGGESTION_STATUS_OPTIONS,
  SUGGESTION_PRIORITY_OPTIONS,
} from "../data";
import type {
  Suggestion,
  SuggestionCategory,
  SuggestionStatus,
  SuggestionPriority,
} from "../types";

interface SuggestionsTableProps {
  suggestions: Suggestion[];
  onView: (suggestion: Suggestion) => void;
  onUpdateStatus: (id: string, status: SuggestionStatus) => void;
  onToggleFeatured: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SuggestionsTable({
  suggestions,
  onView,
  onUpdateStatus,
  onToggleFeatured,
  onDelete,
}: SuggestionsTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    SuggestionCategory | "all"
  >("all");
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | "all">(
    "all",
  );
  const [priorityFilter, setPriorityFilter] = useState<
    SuggestionPriority | "all"
  >("all");

  const filtered = suggestions
    .filter((s) => {
      const matchSearch =
        search === "" ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.submitterName &&
          s.submitterName.toLowerCase().includes(search.toLowerCase()));
      const matchCategory =
        categoryFilter === "all" || s.category === categoryFilter;
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchPriority =
        priorityFilter === "all" || s.priority === priorityFilter;
      return matchSearch && matchCategory && matchStatus && matchPriority;
    })
    .sort((a, b) => b.upvotes - a.upvotes);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or submitter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) =>
            setCategoryFilter(v as SuggestionCategory | "all")
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {SUGGESTION_CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {SUGGESTION_CATEGORY_CONFIG[c].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as SuggestionStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {SUGGESTION_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {SUGGESTION_STATUS_CONFIG[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(v) =>
            setPriorityFilter(v as SuggestionPriority | "all")
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {SUGGESTION_PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {SUGGESTION_PRIORITY_CONFIG[p].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Suggestion
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">
                  Category
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Priority
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Submitter
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Upvotes
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap">
                  Submitted
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground text-sm"
                  >
                    No suggestions match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((s) => {
                const catConfig = SUGGESTION_CATEGORY_CONFIG[s.category];
                const statusConfig = SUGGESTION_STATUS_CONFIG[s.status];
                const priorityConfig = SUGGESTION_PRIORITY_CONFIG[s.priority];
                return (
                  <tr
                    key={s.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 max-w-72">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {s.isFeatured && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                          <button
                            type="button"
                            onClick={() => onView(s)}
                            className="text-left font-medium text-foreground text-sm leading-snug hover:text-primary transition-colors line-clamp-1"
                          >
                            {s.title}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {s.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-xs ${catConfig.color} ${catConfig.bg} ${catConfig.border}`}
                      >
                        {catConfig.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
                      >
                        {statusConfig.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-xs ${priorityConfig.color} ${priorityConfig.bg} ${priorityConfig.border}`}
                      >
                        {priorityConfig.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {s.isAnonymous ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="text-xs">Anonymous</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {s.submitterInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium text-foreground leading-none">
                              {s.submitterName}
                            </p>
                            {s.submitterDept && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {s.submitterDept}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold text-foreground">
                          {s.upvotes}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {s.createdAt}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => onView(s)}>
                            <Eye className="w-3.5 h-3.5 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <RefreshCw className="w-3.5 h-3.5 mr-2" />
                              Change Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {SUGGESTION_STATUS_OPTIONS.map((st) => (
                                <DropdownMenuItem
                                  key={st}
                                  onClick={() => onUpdateStatus(s.id, st)}
                                  disabled={s.status === st}
                                >
                                  <Badge
                                    variant="outline"
                                    className={`text-xs mr-2 ${SUGGESTION_STATUS_CONFIG[st].color} ${SUGGESTION_STATUS_CONFIG[st].bg} ${SUGGESTION_STATUS_CONFIG[st].border}`}
                                  >
                                    {SUGGESTION_STATUS_CONFIG[st].label}
                                  </Badge>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuItem
                            onClick={() => onToggleFeatured(s.id)}
                          >
                            <Star className="w-3.5 h-3.5 mr-2" />
                            {s.isFeatured ? "Unfeature" : "Mark as Featured"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(s.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {suggestions.length} suggestions &bull;
        Sorted by upvotes
      </p>
    </div>
  );
}
