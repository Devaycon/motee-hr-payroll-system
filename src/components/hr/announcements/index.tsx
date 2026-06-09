"use client";

import { useEffect, useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAnnouncements } from "./hooks";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { StatCards } from "./components/stat-cards";
import { AnnouncementsFeed } from "./components/announcements-feed";
import { AnnouncementDetailModal } from "./components/announcement-detail-modal";
import { AnnouncementFormModal } from "./components/announcement-form-modal";
import type { Announcement, NewAnnouncement } from "./types";

export function AnnouncementsPage() {
  const { data, loading } = useAnnouncements();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  useEffect(() => {
    if (data) setAnnouncements(data);
  }, [data]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [viewing, setViewing] = useState<Announcement | null>(null);

  const active = announcements.filter((a) => !a.isArchived);
  const pinned = active.filter((a) => a.isPinned);
  const archived = announcements.filter((a) => a.isArchived);

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

  function handleSave(data: NewAnnouncement) {
    if (editing) {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === editing.id ? { ...a, ...data } : a)),
      );
      toast.success("Announcement updated");
    } else {
      const id = `ANN-${String(announcements.length + 1).padStart(3, "0")}`;
      const now = new Date().toISOString().split("T")[0];
      const next: Announcement = {
        ...data,
        id,
        createdAt: now,
        createdBy: "HR Admin",
        createdByInitials: "HA",
        viewCount: 0,
        acknowledgements: [],
        totalTargeted: data.audience === "all_staff" ? 156 : 30,
        publishedAt: data.status === "published" ? now : undefined,
        isArchived: false,
      };
      setAnnouncements((prev) => [next, ...prev]);
      toast.success("Announcement created");
    }
    setFormOpen(false);
  }

  function handlePin(id: string) {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isPinned: !a.isPinned } : a)),
    );
    const target = announcements.find((a) => a.id === id);
    toast.success(target?.isPinned ? "Unpinned" : "Pinned");
  }

  function handleArchive(id: string) {
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, isArchived: true, isPinned: false, status: "archived" }
          : a,
      ),
    );
    toast.success("Announcement archived");
  }

  function handleDelete(id: string) {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    toast.success("Announcement deleted");
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

      <StatCards announcements={announcements} />

      <Tabs defaultValue="all">
        <PageTabsList
          tabs={[
            { value: "all", label: "All" },
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
            announcements={active}
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
