"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { ANNOUNCEMENTS, MY_DEPT } from "./components/data";
import type { Announcement, AnnouncementType } from "./components/data";
import { PendingAckBanner } from "./components/pending-ack-banner";
import { SearchFilter } from "./components/search-filter";
import { AnnouncementList } from "./components/announcement-list";
import { AnnouncementDetailModal } from "./components/announcement-detail-modal";

export function EmployeeAnnouncements() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | "all">("all");
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

  function getFiltered(isArchive: boolean) {
    return ANNOUNCEMENTS.filter((a) => {
      if (a.audience === "department") {
        if (!a.targetDepartments?.includes(MY_DEPT)) return false;
      }
      const archived = a.isArchived || a.status === "archived";
      if (isArchive && !archived) return false;
      if (!isArchive && archived) return false;
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
  }

  function sortList(items: Announcement[]) {
    const pinned = items.filter((a) => a.isPinned);
    const rest = items.filter((a) => !a.isPinned);
    return [...pinned, ...rest];
  }

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

  const activeItems = sortList(getFiltered(false));
  const archiveItems = sortList(getFiltered(true));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Company-wide updates, policy changes, and upcoming events.
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-border border border-[#4361ee]/20 text-sm text-text font-medium shrink-0">
            <Bell className="w-4 h-4" />
            {unreadCount} unread
          </div>
        )}
      </div>

      <PendingAckBanner count={pendingAck} />

      <SearchFilter
        search={search}
        typeFilter={typeFilter}
        onSearchChange={setSearch}
        onTypeFilterChange={setTypeFilter}
      />

      <Tabs defaultValue="active">
        <PageTabsList
          tabs={[
            { value: "active", label: "Active" },
            { value: "archive", label: "Archive" },
          ]}
        />

        <TabsContent value="active" className="mt-5">
          <AnnouncementList
            items={activeItems}
            readIds={readIds}
            acknowledged={acknowledged}
            onOpen={openAnnouncement}
          />
        </TabsContent>

        <TabsContent value="archive" className="mt-5">
          <AnnouncementList
            items={archiveItems}
            readIds={readIds}
            acknowledged={acknowledged}
            onOpen={openAnnouncement}
          />
        </TabsContent>
      </Tabs>

      <AnnouncementDetailModal
        open={detailOpen}
        announcement={selected}
        acknowledged={acknowledged}
        onClose={setDetailOpen}
        onAcknowledge={handleAcknowledge}
      />
    </div>
  );
}
