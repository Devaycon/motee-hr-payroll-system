"use client";

import { useState, useMemo } from "react";
import {
  Megaphone,
  Plus,
  Search,
  Mail,
  Bell,
  AlertTriangle,
  Users,
  Eye,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { DEMO_ANNOUNCEMENTS } from "@/src/data/motee-demo";
import type { Announcement } from "@/src/data/motee-demo";
import { formatDate } from "@/src/lib/utils/format-date";

type StatusFilter = "all" | "published" | "scheduled" | "draft" | "expired";

const statusStyles: Record<string, string> = {
  published: "bg-[#4ED251]/10 text-[#4ED251]",
  scheduled: "bg-blue-500/10 text-blue-500",
  draft: "bg-muted text-muted-foreground",
  expired: "bg-slate-500/10 text-slate-500",
};

const priorityStyles: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-500",
  standard: "bg-muted text-muted-foreground",
};

const categoryColors: Record<string, string> = {
  System: "bg-slate-500/10 text-slate-500",
  Feature: "bg-[#ff8b2d]/10 text-[#ff8b2d]",
  Release: "bg-violet-500/10 text-violet-500",
  Compliance: "bg-amber-500/10 text-amber-500",
};

export function NoticesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    body: "",
    category: "Feature",
    target: "all",
    channels: { "in-app": true, email: false },
    priority: "standard",
    publishDate: "",
    expiryDate: "",
  });

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: `All (${DEMO_ANNOUNCEMENTS.length})` },
    {
      key: "published",
      label: `Published (${DEMO_ANNOUNCEMENTS.filter((a) => a.status === "published").length})`,
    },
    {
      key: "scheduled",
      label: `Scheduled (${DEMO_ANNOUNCEMENTS.filter((a) => a.status === "scheduled").length})`,
    },
    {
      key: "draft",
      label: `Draft (${DEMO_ANNOUNCEMENTS.filter((a) => a.status === "draft").length})`,
    },
  ];

  const filtered = useMemo(() => {
    return DEMO_ANNOUNCEMENTS.filter((a) => {
      const matchSearch =
        search === "" || a.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const ackRate = (a: Announcement) =>
    a.recipientCount > 0
      ? Math.round((a.acknowledgementCount / a.recipientCount) * 100)
      : 0;

  const showDetailModal = selectedAnnouncement && !showCreateModal;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Notices & Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage platform-wide announcements for tenants and users.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="gap-1.5 bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Total Announcements",
            value: DEMO_ANNOUNCEMENTS.length,
            color: "text-foreground",
          },
          {
            label: "Published",
            value: DEMO_ANNOUNCEMENTS.filter((a) => a.status === "published")
              .length,
            color: "text-[#4ED251]",
          },
          {
            label: "Scheduled",
            value: DEMO_ANNOUNCEMENTS.filter((a) => a.status === "scheduled")
              .length,
            color: "text-blue-500",
          },
          {
            label: "Urgent Notices",
            value: DEMO_ANNOUNCEMENTS.filter((a) => a.priority === "urgent")
              .length,
            color: "text-red-500",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${statusFilter === tab.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((ann) => (
          <Card
            key={ann.id}
            className="cursor-pointer hover:border-[#ff8b2d]/40 transition-colors"
            onClick={() => setSelectedAnnouncement(ann)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      {ann.title}
                    </span>
                    {ann.priority === "urgent" && (
                      <Badge className="text-xs border-0 bg-red-500/10 text-red-500 gap-0.5">
                        <AlertTriangle className="h-3 w-3" />
                        Urgent
                      </Badge>
                    )}
                    <Badge
                      className={`text-xs border-0 capitalize ${statusStyles[ann.status]}`}
                    >
                      {ann.status}
                    </Badge>
                    <Badge
                      className={`text-xs border-0 ${categoryColors[ann.category] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {ann.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {ann.body}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap mt-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{ann.targetLabel}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {ann.channels.includes("in-app") && (
                        <Bell className="h-3 w-3" />
                      )}
                      {ann.channels.includes("email") && (
                        <Mail className="h-3 w-3" />
                      )}
                      <span>{ann.channels.join(" + ")}</span>
                    </div>
                    {ann.status === "published" && ann.publishedAt && (
                      <span className="text-xs text-muted-foreground">
                        Published {formatDate(ann.publishedAt)}
                      </span>
                    )}
                    {ann.status === "scheduled" && ann.publishedAt && (
                      <span className="text-xs text-blue-500">
                        Scheduled {formatDate(ann.publishedAt)}
                      </span>
                    )}
                  </div>
                </div>
                {ann.status === "published" && ann.recipientCount > 0 && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      Acknowledged
                    </p>
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      {ackRate(ann)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ann.acknowledgementCount.toLocaleString()} /{" "}
                      {ann.recipientCount.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showDetailModal && (
        <Dialog open={true} onOpenChange={() => setSelectedAnnouncement(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <span>{selectedAnnouncement.title}</span>
                <Badge
                  className={`text-xs border-0 capitalize ${statusStyles[selectedAnnouncement.status]}`}
                >
                  {selectedAnnouncement.status}
                </Badge>
                {selectedAnnouncement.priority === "urgent" && (
                  <Badge className="text-xs border-0 bg-red-500/10 text-red-500">
                    Urgent
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedAnnouncement.category}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedAnnouncement.targetLabel}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Channels</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedAnnouncement.channels.join(", ")}
                  </p>
                </div>
                {selectedAnnouncement.publishedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {selectedAnnouncement.status === "scheduled"
                        ? "Scheduled"
                        : "Published"}
                    </p>
                    <p className="font-medium text-foreground mt-0.5">
                      {selectedAnnouncement.publishedAt.replace("T", " ")}
                    </p>
                  </div>
                )}
                {selectedAnnouncement.expiryDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Expires</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {selectedAnnouncement.expiryDate}
                    </p>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Message</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {selectedAnnouncement.body}
                </p>
              </div>
              {selectedAnnouncement.status === "published" &&
                selectedAnnouncement.recipientCount > 0 && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Acknowledgement
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Acknowledged
                        </span>
                        <span className="font-semibold text-foreground">
                          {selectedAnnouncement.acknowledgementCount.toLocaleString()}{" "}
                          /{" "}
                          {selectedAnnouncement.recipientCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-[#4ED251] rounded-full transition-all"
                          style={{ width: `${ackRate(selectedAnnouncement)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {ackRate(selectedAnnouncement)}% acknowledged
                      </p>
                    </div>
                  </>
                )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedAnnouncement(null)}
              >
                Close
              </Button>
              {selectedAnnouncement.status === "draft" && (
                <Button
                  className="bg-[#4ED251] hover:bg-[#4ED251]/90 text-white"
                  onClick={() => setSelectedAnnouncement(null)}
                >
                  Publish Now
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-[#ff8b2d]" />
              Create Announcement
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Title <span className="text-red-500">*</span>
              </p>
              <Input
                placeholder="Announcement title..."
                value={newAnnouncement.title}
                onChange={(e) =>
                  setNewAnnouncement((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Body <span className="text-red-500">*</span>
              </p>
              <Textarea
                placeholder="Write the announcement message..."
                value={newAnnouncement.body}
                onChange={(e) =>
                  setNewAnnouncement((p) => ({ ...p, body: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">Category</p>
                <select
                  value={newAnnouncement.category}
                  onChange={(e) =>
                    setNewAnnouncement((p) => ({
                      ...p,
                      category: e.target.value,
                    }))
                  }
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff8b2d]"
                >
                  {[
                    "Feature",
                    "System",
                    "Release",
                    "Compliance",
                    "Maintenance",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">
                  Target Audience
                </p>
                <select
                  value={newAnnouncement.target}
                  onChange={(e) =>
                    setNewAnnouncement((p) => ({
                      ...p,
                      target: e.target.value,
                    }))
                  }
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff8b2d]"
                >
                  <option value="all">All Tenants</option>
                  <option value="plan">Specific Plan</option>
                  <option value="specific">Specific Tenants</option>
                  <option value="country">By Country</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Delivery Channels
              </p>
              <div className="flex gap-3">
                {(["in-app", "email"] as const).map((channel) => (
                  <button
                    key={channel}
                    onClick={() =>
                      setNewAnnouncement((p) => ({
                        ...p,
                        channels: {
                          ...p.channels,
                          [channel]: !p.channels[channel],
                        },
                      }))
                    }
                    className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${newAnnouncement.channels[channel] ? "border-[#ff8b2d] bg-[#ff8b2d]/10 text-[#ff8b2d]" : "border-border text-muted-foreground"}`}
                  >
                    {channel === "in-app" ? (
                      <Bell className="h-3.5 w-3.5" />
                    ) : (
                      <Mail className="h-3.5 w-3.5" />
                    )}
                    {channel}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">Priority</p>
              <div className="flex gap-2">
                {(["standard", "urgent"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() =>
                      setNewAnnouncement((prev) => ({ ...prev, priority: p }))
                    }
                    className={`flex-1 rounded-md border py-2 text-sm font-medium capitalize transition-colors ${newAnnouncement.priority === p ? "border-[#ff8b2d] bg-[#ff8b2d]/10 text-[#ff8b2d]" : "border-border text-muted-foreground hover:border-foreground/30"}`}
                  >
                    {p === "urgent" ? "⚠ Urgent (modal ack)" : "Standard"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">
                  Publish Date / Time
                </p>
                <Input
                  type="datetime-local"
                  value={newAnnouncement.publishDate}
                  onChange={(e) =>
                    setNewAnnouncement((p) => ({
                      ...p,
                      publishDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">
                  Expiry Date (optional)
                </p>
                <Input
                  type="date"
                  value={newAnnouncement.expiryDate}
                  onChange={(e) =>
                    setNewAnnouncement((p) => ({
                      ...p,
                      expiryDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={
                !newAnnouncement.title.trim() || !newAnnouncement.body.trim()
              }
              onClick={() => setShowCreateModal(false)}
            >
              Save as Draft
            </Button>
            <Button
              disabled={
                !newAnnouncement.title.trim() || !newAnnouncement.body.trim()
              }
              onClick={() => setShowCreateModal(false)}
              className="bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white"
            >
              {newAnnouncement.publishDate ? "Schedule" : "Publish Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
