"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementType,
} from "@/src/lib/types/announcements";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface RawAnnouncement {
  id?: string;
  title?: string;
  body?: string;
  description?: string;
  authorId?: string;
  audience?: string;
  priority?: string;
  type?: string;
  publishedAt?: string;
  createdAt?: string;
  pinned?: boolean;
  isPinned?: boolean;
  status?: string;
  reactions?: { employeeId?: string }[];
}

function mapType(t?: string): AnnouncementType {
  if (t === "policy" || t === "event" || t === "urgent") return t;
  return "general";
}

function mapStatus(s?: string): AnnouncementStatus {
  if (s === "draft" || s === "scheduled" || s === "expired" || s === "archived") return s;
  return "published";
}

function mapAudience(a?: string): AnnouncementAudience {
  if (a === "department" || a === "leadership" || a === "managers") return a;
  return "all_staff";
}

function mapPriority(p?: string): AnnouncementPriority {
  if (p === "urgent" || p === "high") return "urgent";
  return "standard";
}

function buildAnnouncements(bundle: LocaleBundle): Announcement[] {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  return ((bundle.announcements ?? []) as RawAnnouncement[]).map((raw, i) => {
    const id = raw.id ?? `ANN-${String(i + 1).padStart(3, "0")}`;
    const author = raw.authorId ? employeesById.get(raw.authorId) : null;
    const createdAt = raw.publishedAt ?? raw.createdAt ?? bundle.tenant.createdAt.slice(0, 10);
    return {
      id,
      title: raw.title ?? "Announcement",
      body: raw.body ?? raw.description ?? "",
      type: mapType(raw.type),
      status: mapStatus(raw.status),
      priority: mapPriority(raw.priority),
      audience: mapAudience(raw.audience),
      isPinned: raw.isPinned ?? raw.pinned ?? false,
      requiresAcknowledgement: raw.priority === "urgent" || raw.priority === "high",
      createdAt,
      createdBy: author?.fullName ?? "HR Admin",
      createdByInitials: author?.initials ?? "HA",
      viewCount: (raw.reactions ?? []).length,
      acknowledgements: [],
      totalTargeted: bundle.employees.length,
      publishedAt: createdAt,
      isArchived: raw.status === "archived",
    };
  });
}

export function useAnnouncements() {
  return useLocaleSection<Announcement[]>(buildAnnouncements);
}
