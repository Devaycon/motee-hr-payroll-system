"use client";
import { formatDate } from "@/src/lib/utils/format-date";

import { useMemo, useState } from "react";
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  UserPlus,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
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
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
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

  const columns = useMemo<ColumnDef<HelpDeskTicket>[]>(
    () => [
      {
        accessorKey: "id",
        header: sortableHeader("Ref #"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {row.original.isOverdue && (
              <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
            )}
            <span className="text-xs font-mono font-medium text-muted-foreground">
              {row.original.id}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "subject",
        header: sortableHeader("Subject"),
        cell: ({ row }) => (
          <div className="max-w-56">
            <button
              type="button"
              onClick={() => onView(row.original)}
              className="text-left text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
            >
              {row.original.subject}
            </button>
            <p className="text-xs text-muted-foreground mt-0.5">
              {row.original.messages.length} message
              {row.original.messages.filter((m) => !m.isInternalNote).length !==
              1
                ? "s"
                : ""}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: sortableHeader("Category"),
        cell: ({ row }) => {
          const catConfig = TICKET_CATEGORY_CONFIG[row.original.category];
          return (
            <Badge
              variant="outline"
              className={`text-xs whitespace-nowrap ${catConfig.color} ${catConfig.bg} ${catConfig.border}`}
            >
              {catConfig.icon} {catConfig.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => {
          const statusConfig = TICKET_STATUS_CONFIG[row.original.status];
          return (
            <Badge
              variant="outline"
              className={`text-xs whitespace-nowrap ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
            >
              {statusConfig.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "priority",
        header: sortableHeader("Priority"),
        cell: ({ row }) => {
          const priorityConfig = TICKET_PRIORITY_CONFIG[row.original.priority];
          return (
            <Badge
              variant="outline"
              className={`text-xs whitespace-nowrap ${priorityConfig.color} ${priorityConfig.bg} ${priorityConfig.border}`}
            >
              {priorityConfig.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "submitterName",
        header: sortableHeader("Submitter"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <PersonAvatar
              name={row.original.submitterName}
              initials={row.original.submitterInitials}
              className="w-6 h-6"
              fallbackClassName="text-[10px] bg-primary/10 text-primary"
            />
            <div>
              <p className="text-xs font-medium text-foreground leading-none">
                {row.original.submitterName}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {row.original.submitterDept}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "assignedTo",
        header: sortableHeader("Assigned To"),
        cell: ({ row }) =>
          row.original.assignedTo ? (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <PersonAvatar
                name={row.original.assignedTo}
                initials={row.original.assignedInitials}
                className="w-5 h-5"
                fallbackClassName="text-[9px] bg-teal-500/10 text-teal-600"
              />
              <span className="text-xs text-muted-foreground">
                {row.original.assignedTo}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/60 italic">
              Unassigned
            </span>
          ),
      },
      {
        accessorKey: "slaDueAt",
        header: sortableHeader("SLA Due"),
        cell: ({ row }) => (
          <span
            className={`text-xs whitespace-nowrap ${
              row.original.isOverdue
                ? "text-red-500 font-medium"
                : "text-muted-foreground"
            }`}
          >
            {row.original.slaDueAt}
            {row.original.isOverdue && " ⚠"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: sortableHeader("Date"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      actionsColumn<HelpDeskTicket>((t) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7">
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
                      t.status === s ? "font-medium text-primary" : ""
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
                    onClick={() => onAssign(t.id, a.name, a.initials)}
                    className={
                      t.assignedTo === a.name ? "font-medium text-primary" : ""
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
      )),
    ],
    [onView, onUpdateStatus, onAssign, onDelete],
  );

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

      <DataTable
        exportTitle="Helpdesk Cases"
        columns={columns}
        data={filtered}
        getRowId={(t) => t.id}
        emptyMessage="No cases match your filters."
      />

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {tickets.length} cases
      </p>
    </div>
  );
}
