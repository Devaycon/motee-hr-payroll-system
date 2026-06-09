"use client";

import { formatDate } from "@/src/lib/utils/format-date";
import {
  Pin,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Users,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { useState } from "react";
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
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_STYLES,
  ANNOUNCEMENT_TYPE_BORDER,
  ANNOUNCEMENT_STATUS_LABELS,
  ANNOUNCEMENT_STATUS_STYLES,
  AUDIENCE_LABELS,
} from "../data";
import type {
  Announcement,
  AnnouncementType,
  AnnouncementStatus,
} from "../types";

interface AnnouncementsFeedProps {
  announcements: Announcement[];
  onView: (a: Announcement) => void;
  onEdit: (a: Announcement) => void;
  onPin: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  showArchived?: boolean;
}

export function AnnouncementsFeed({
  announcements,
  onView,
  onEdit,
  onPin,
  onArchive,
  onDelete,
  showArchived = false,
}: AnnouncementsFeedProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | "all">(
    "all",
  );

  const filtered = announcements.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.createdBy.toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const pinned = filtered.filter((a) => a.isPinned && !a.isArchived);
  const rest = filtered.filter((a) => !a.isPinned);

  const ordered = [...pinned, ...rest];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as AnnouncementType | "all")}
          >
            <SelectTrigger size="lg" className="w-40 bg-card">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(
                Object.keys(ANNOUNCEMENT_TYPE_LABELS) as AnnouncementType[]
              ).map((t) => (
                <SelectItem key={t} value={t}>
                  {ANNOUNCEMENT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!showArchived && (
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as AnnouncementStatus | "all")
              }
            >
              <SelectTrigger size="lg" className="w-40 bg-card">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {ordered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-muted rounded-full p-4 mb-4">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No announcements found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      <div className="space-y-3">
        {ordered.map((a) => {
          const ackCount = a.acknowledgements.length;
          const ackPercent =
            a.totalTargeted > 0
              ? Math.round((ackCount / a.totalTargeted) * 100)
              : 0;

          return (
            <div
              key={a.id}
              className={`relative bg-card border rounded-xl border-l-4 ${
                a.isPinned
                  ? "border-l-amber-500"
                  : ANNOUNCEMENT_TYPE_BORDER[a.type]
              } p-5 cursor-pointer`}
              onClick={() => onView(a)}
            >
              {a.isPinned && (
                <div className="absolute top-3 right-12 flex items-center gap-1 text-amber-500">
                  <Pin className="w-3.5 h-3.5 fill-amber-500" />
                  <span className="text-xs font-medium">Pinned</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${ANNOUNCEMENT_TYPE_STYLES[a.type]}`}
                    >
                      {ANNOUNCEMENT_TYPE_LABELS[a.type]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${ANNOUNCEMENT_STATUS_STYLES[a.status]}`}
                    >
                      {ANNOUNCEMENT_STATUS_LABELS[a.status]}
                    </Badge>
                    {a.priority === "urgent" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-red-500/10 text-red-600 border-red-500/20 flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Urgent
                      </Badge>
                    )}
                    {a.audience !== "all_staff" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-slate-500/10 text-slate-500 border-slate-500/20 flex items-center gap-1"
                      >
                        <Users className="w-3 h-3" />
                        {a.audience === "department" && a.targetDepartments
                          ? a.targetDepartments.slice(0, 2).join(", ") +
                            (a.targetDepartments.length > 2
                              ? ` +${a.targetDepartments.length - 2}`
                              : "")
                          : AUDIENCE_LABELS[a.audience]}
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                    {a.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {a.body}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                    <span>
                      By{" "}
                      <span className="font-medium text-foreground">
                        {a.createdBy}
                      </span>
                    </span>
                    <span>
                      {a.publishedAt
                        ? `Published ${formatDate(a.publishedAt)}`
                        : a.scheduledFor
                          ? `Scheduled ${formatDate(a.scheduledFor)}`
                          : `Created ${formatDate(a.createdAt)}`}
                    </span>
                    {a.status === "published" && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {a.viewCount} views
                      </span>
                    )}
                  </div>

                  {a.requiresAcknowledgement && a.status === "published" && (
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Acknowledgements
                        </span>
                        <span className="font-medium text-foreground">
                          {ackCount} / {a.totalTargeted} ({ackPercent}%)
                        </span>
                      </div>
                      <Progress value={ackPercent} className="h-1.5" />
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(a);
                      }}
                    >
                      View Details
                    </DropdownMenuItem>
                    {!a.isArchived && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(a);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                    )}
                    {!a.isArchived && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onPin(a.id);
                        }}
                      >
                        {a.isPinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {!a.isArchived && (
                      <DropdownMenuItem
                        className="text-amber-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchive(a.id);
                        }}
                      >
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(a.id);
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
