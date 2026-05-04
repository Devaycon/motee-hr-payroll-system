"use client";

import { useState } from "react";
import {
  Pin,
  AlertTriangle,
  CalendarDays,
  FileText,
  CheckCircle2,
  Search,
  ChevronRight,
  Archive,
  Bell,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  ANNOUNCEMENTS,
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_STYLES,
  ANNOUNCEMENT_TYPE_BORDER,
  AUDIENCE_LABELS,
} from "@/src/data/announcements-demo";
import type {
  Announcement,
  AnnouncementType,
} from "@/src/lib/types/announcements";

const MY_EMPLOYEE_ID = "emp-current";
const MY_DEPT = "Engineering";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function EmployeeAnnouncements() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | "all">("all");
  const [activeTab, setActiveTab] = useState<"active" | "archive">("active");
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  function openAnnouncement(a: Announcement) {
    setSelected(a);
    setDetailOpen(true);
    setReadIds((prev) => new Set([...prev, a.id]));
  }

  function handleAcknowledge(id: string) {
    setAcknowledged((prev) => new Set([...prev, id]));
  }

  const visibleAnnouncements = ANNOUNCEMENTS.filter((a) => {
    if (a.audience === "department") {
      if (!a.targetDepartments?.includes(MY_DEPT)) return false;
    }
    const isArchive = a.isArchived || a.status === "archived";
    if (activeTab === "active" && isArchive) return false;
    if (activeTab === "archive" && !isArchive) return false;
    if (a.status === "draft" || a.status === "scheduled") return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (
      search &&
      !a.title.toLowerCase().includes(search.toLowerCase()) &&
      !a.body.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const pinned = visibleAnnouncements.filter((a) => a.isPinned);
  const rest = visibleAnnouncements.filter((a) => !a.isPinned);
  const sorted = [...pinned, ...rest];

  const unreadCount = ANNOUNCEMENTS.filter(
    (a) =>
      !a.isArchived &&
      a.status === "published" &&
      !readIds.has(a.id) &&
      (a.audience !== "department" ||
        (a.targetDepartments?.includes(MY_DEPT) ?? false)),
  ).length;

  const pendingAck = ANNOUNCEMENTS.filter(
    (a) =>
      a.requiresAcknowledgement &&
      a.status === "published" &&
      !acknowledged.has(a.id),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Company-wide updates, policy changes, and upcoming events.
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7F77DD]/10 border border-[#7F77DD]/20 text-sm text-[#7F77DD] font-medium shrink-0">
            <Bell className="w-4 h-4" />
            {unreadCount} unread
          </div>
        )}
      </div>

      {pendingAck > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            You have{" "}
            <span className="font-semibold">
              {pendingAck} announcement{pendingAck > 1 ? "s" : ""}
            </span>{" "}
            requiring your acknowledgement.
          </p>
        </div>
      )}

      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as AnnouncementType | "all")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(
              Object.entries(ANNOUNCEMENT_TYPE_LABELS) as [
                AnnouncementType,
                string,
              ][]
            ).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-b border-border">
        <div className="flex gap-6">
          {(["active", "archive"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-[#7F77DD] text-[#7F77DD]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "active" ? "Active" : "Archive"}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No announcements found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((a) => {
            const isUnread = !readIds.has(a.id);
            const needsAck =
              a.requiresAcknowledgement && !acknowledged.has(a.id);
            return (
              <Card
                key={a.id}
                className={`border-l-4 transition-shadow hover:shadow-md cursor-pointer ${ANNOUNCEMENT_TYPE_BORDER[a.type]}`}
                onClick={() => openAnnouncement(a)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {a.isPinned && (
                          <Pin className="w-3.5 h-3.5 text-[#7F77DD] shrink-0" />
                        )}
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#7F77DD] shrink-0" />
                        )}
                        <Badge
                          className={`text-xs border ${ANNOUNCEMENT_TYPE_STYLES[a.type]}`}
                        >
                          {ANNOUNCEMENT_TYPE_LABELS[a.type]}
                        </Badge>
                        {needsAck && (
                          <Badge className="text-xs border bg-amber-500/10 text-amber-600 border-amber-500/20">
                            Needs Acknowledgement
                          </Badge>
                        )}
                        {a.isArchived && (
                          <Badge className="text-xs border bg-zinc-500/10 text-zinc-600 border-zinc-500/20">
                            Archived
                          </Badge>
                        )}
                      </div>
                      <p
                        className={`text-sm font-semibold text-foreground leading-snug ${isUnread ? "font-bold" : ""}`}
                      >
                        {a.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {a.body}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                        <span>{a.createdBy}</span>
                        <span>•</span>
                        <span>{timeAgo(a.publishedAt ?? a.createdAt)}</span>
                        <span>•</span>
                        <span>{AUDIENCE_LABELS[a.audience]}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base pr-6">
              {selected?.title}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={`text-xs border ${ANNOUNCEMENT_TYPE_STYLES[selected.type]}`}
                >
                  {ANNOUNCEMENT_TYPE_LABELS[selected.type]}
                </Badge>
                {selected.isPinned && (
                  <Badge className="text-xs border bg-[#7F77DD]/10 text-[#7F77DD] border-[#7F77DD]/20">
                    <Pin className="w-3 h-3 mr-1" />
                    Pinned
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatDate(selected.publishedAt ?? selected.createdAt)}
                </span>
                <span>•</span>
                <span>{selected.createdBy}</span>
                <span>•</span>
                <span>{AUDIENCE_LABELS[selected.audience]}</span>
              </div>

              <Separator />

              <p className="text-sm text-foreground leading-relaxed">
                {selected.body}
              </p>

              {selected.attachmentName && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted border border-border text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground text-xs">
                    {selected.attachmentName}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-7 text-xs"
                  >
                    Download
                  </Button>
                </div>
              )}

              {selected.requiresAcknowledgement && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 space-y-2">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    This announcement requires your acknowledgement.
                  </p>
                  {acknowledged.has(selected.id) ? (
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Acknowledged on{" "}
                      {formatDate(new Date().toISOString().split("T")[0])}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="text-white w-full"
                      style={{ backgroundColor: "#7F77DD" }}
                      onClick={() => handleAcknowledge(selected.id)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Acknowledge
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>{selected.viewCount + 1} views</span>
                {selected.isArchived && (
                  <span className="flex items-center gap-1">
                    <Archive className="w-3.5 h-3.5" />
                    Archived
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
