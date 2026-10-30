"use client";

import { useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAnnouncementActions, useAnnouncements } from "./hooks";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  StatCards,
  matchesAnnouncementCardFilter,
  ANNOUNCEMENT_CARD_FILTER_LABELS,
  type AnnouncementCardFilter,
} from "./components/stat-cards";
import { AnnouncementsFeed } from "./components/announcements-feed";
import { AnnouncementDetailModal } from "./components/announcement-detail-modal";
import { AnnouncementFormModal } from "./components/announcement-form-modal";
import type { Announcement, NewAnnouncement } from "./types";

export function AnnouncementsPage() {
  const { data, loading } = useAnnouncements();
  const announcements = data ?? [];
  const actions = useAnnouncementActions();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [viewing, setViewing] = useState<Announcement | null>(null);

  // Controlled so the KPI cards can drill into a tab, not just a filter.
  const [activeTab, setActiveTab] = useState("all");
  /** Drill-down set by the KPI cards; "all" shows every announcement. */
  const [cardFilter, setCardFilter] = useState<AnnouncementCardFilter>("all");

  const active = announcements.filter((a) => !a.isArchived);
  const pinned = active.filter((a) => a.isPinned);
  const archived = announcements.filter((a) => a.isArchived);
  /** The "All" feed, narrowed to whichever KPI card is selected. */
  const visible = active.filter((a) =>
    matchesAnnouncementCardFilter(a, cardFilter),
  );

  function handleNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleEdit(a: Announcement) {
    setEditing(a);
    setFormOpen(true);
  }

  function handleView(a: Announcement) {
    setViewing(a);
    setDetailOpen(true);
  }

  async function handleSave(data: NewAnnouncement) {
    const ok = editing
      ? await actions.update(editing, data)
      : await actions.create(data);
    if (!ok) return;
    toast.success(editing ? "Announcement updated" : "Announcement created");
    setFormOpen(false);
  }

  async function handlePin(id: string) {
    const target = announcements.find((a) => a.id === id);
    if (await actions.togglePin(id)) {
      toast.success(target?.isPinned ? "Unpinned" : "Pinned");
    }
  }

  async function handleArchive(id: string) {
    if (await actions.archive(id)) toast.success("Announcement archived");
  }

  async function handleDelete(id: string) {
    if (await actions.remove(id)) toast.success("Announcement deleted");
  }

  if (loading && !announcements.length) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-semibold text-foreground">
              Announcements
            </h1>
            <p className="text-sm text-muted-foreground">
              Communicate company-wide updates, policies, and events
            </p>
          </div>
        </div>
        <Button size='lg' onClick={handleNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Announcement
        </Button>
      </div>

      <StatCards
        announcements={announcements}
        cardFilter={cardFilter}
        onDrillDown={(filter) => {
          setCardFilter(filter);
          // Every card counts non-archived announcements, so drilling always
          // lands on the "All" feed.
          setActiveTab("all");
        }}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {ANNOUNCEMENT_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">({visible.length})</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← All announcements
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "all", label: `All (${visible.length})` },
            {
              value: "pinned",
              label: pinned.length > 0 ? `Pinned (${pinned.length})` : "Pinned",
            },
            {
              value: "archived",
              label:
                archived.length > 0
                  ? `Archived (${archived.length})`
                  : "Archived",
            },
          ]}
        />

        <TabsContent value="all" className="mt-4">
          <AnnouncementsFeed
            announcements={visible}
            onView={handleView}
            onEdit={handleEdit}
            onPin={handlePin}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="pinned" className="mt-4">
          <AnnouncementsFeed
            announcements={pinned}
            onView={handleView}
            onEdit={handleEdit}
            onPin={handlePin}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          <AnnouncementsFeed
            announcements={archived}
            onView={handleView}
            onEdit={handleEdit}
            onPin={handlePin}
            onArchive={handleArchive}
            onDelete={handleDelete}
            showArchived
          />
        </TabsContent>
      </Tabs>

      <AnnouncementDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        announcement={viewing}
      />

      <AnnouncementFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        onSave={handleSave}
      />
    </div>
  );
}
