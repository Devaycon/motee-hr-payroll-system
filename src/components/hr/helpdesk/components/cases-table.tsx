"use client";

import { useState } from "react";
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  UserPlus,
  RefreshCw,
  AlertTriangle,
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
  TICKET_STATUS_CONFIG,
  TICKET_CATEGORY_CONFIG,
  TICKET_PRIORITY_CONFIG,
  TICKET_CATEGORY_OPTIONS,
  TICKET_STATUS_OPTIONS,
  TICKET_PRIORITY_OPTIONS,
  HR_AGENTS,
} from "../data";
import type {
  HelpDeskTicket,
  TicketCategory,
  TicketStatus,
  TicketPriority,
} from "../types";

interface CasesTableProps {
  tickets: HelpDeskTicket[];
  onView: (ticket: HelpDeskTicket) => void;
  onUpdateStatus: (id: string, status: TicketStatus) => void;
  onAssign: (id: string, agentName: string, agentInitials: string) => void;
  onDelete: (id: string) => void;
}

export function CasesTable({
  tickets,
  onView,
  onUpdateStatus,
  onAssign,
  onDelete,
}: CasesTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">(
    "all",
  );

  const filtered = tickets
    .filter((t) => {
      const matchSearch =
        search === "" ||
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.submitterName.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === "all" || t.category === categoryFilter;
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchPriority =
        priorityFilter === "all" || t.priority === priorityFilter;
      return matchSearch && matchCategory && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, subject, or employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as TicketCategory | "all")}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TICKET_CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {TICKET_CATEGORY_CONFIG[c].icon}{" "}
                {TICKET_CATEGORY_CONFIG[c].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TicketStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {TICKET_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {TICKET_STATUS_CONFIG[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as TicketPriority | "all")}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {TICKET_PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {TICKET_PRIORITY_CONFIG[p].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Ref #
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Subject
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Category
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Priority
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Submitter
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Assigned To
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  SLA Due
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                  Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-10 text-sm text-muted-foreground"
                  >
                    No cases match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((t) => {
                const catConfig = TICKET_CATEGORY_CONFIG[t.category];
                const statusConfig = TICKET_STATUS_CONFIG[t.status];
                const priorityConfig = TICKET_PRIORITY_CONFIG[t.priority];
                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-muted/50 transition-colors ${
                      t.isOverdue ? "bg-red-500/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {t.isOverdue && (
                          <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                        )}
                        <span className="text-xs font-mono font-medium text-muted-foreground">
                          {t.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-56">
                      <button
                        type="button"
                        onClick={() => onView(t)}
                        className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                      >
                        {t.subject}
                      </button>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.messages.length} message
                        {t.messages.filter((m) => !m.isInternalNote).length !==
                        1
                          ? "s"
                          : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-xs ${catConfig.color} ${catConfig.bg} ${catConfig.border}`}
                      >
                        {catConfig.icon} {catConfig.label}
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
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {t.submitterInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-medium text-foreground leading-none">
                            {t.submitterName}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {t.submitterDept}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {t.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-[9px] bg-teal-500/10 text-teal-600">
                              {t.assignedInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {t.assignedTo}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-xs ${
                          t.isOverdue
                            ? "text-red-500 font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {t.slaDueAt}
                        {t.isOverdue && " ⚠"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-muted-foreground">
                        {t.createdAt}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => onView(t)}>
                            <Eye className="w-3.5 h-3.5 mr-2" />
                            View Case
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <RefreshCw className="w-3.5 h-3.5 mr-2" />
                              Change Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {TICKET_STATUS_OPTIONS.map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => onUpdateStatus(t.id, s)}
                                  className={
                                    t.status === s
                                      ? "font-medium text-primary"
                                      : ""
                                  }
                                >
                                  {TICKET_STATUS_CONFIG[s].label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <UserPlus className="w-3.5 h-3.5 mr-2" />
                              Assign To
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {HR_AGENTS.map((a) => (
                                <DropdownMenuItem
                                  key={a.name}
                                  onClick={() =>
                                    onAssign(t.id, a.name, a.initials)
                                  }
                                  className={
                                    t.assignedTo === a.name
                                      ? "font-medium text-primary"
                                      : ""
                                  }
                                >
                                  {a.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(t.id)}
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
        Showing {filtered.length} of {tickets.length} cases
      </p>
    </div>
  );
}
