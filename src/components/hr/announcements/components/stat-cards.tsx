"use client";

import { Megaphone, Bell, CalendarClock, FileEdit } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { Announcement } from "../types";

/** The slice a KPI card drills the announcements feed down to. */
export type AnnouncementCardFilter =
  | "all"
  | "published"
  | "needs_ack"
  | "scheduled"
  | "draft";

export const ANNOUNCEMENT_CARD_FILTER_LABELS: Record<
  Exclude<AnnouncementCardFilter, "all">,
  string
> = {
  published: "Published",
  needs_ack: "Needs acknowledgement",
  scheduled: "Upcoming",
  draft: "Drafts",
};

/** Single source of truth for what each card counts and the feed then shows. */
export function matchesAnnouncementCardFilter(
  announcement: Announcement,
  filter: AnnouncementCardFilter,
): boolean {
  switch (filter) {
    case "published":
      return announcement.status === "published";
    case "needs_ack":
      return (
        announcement.status === "published" &&
        announcement.requiresAcknowledgement
      );
    case "scheduled":
      return announcement.status === "scheduled";
    case "draft":
      return announcement.status === "draft";
    default:
      return true;
  }
}

interface StatCardsProps {
  announcements: Announcement[];
  /** The card drill-down currently applied. */
  cardFilter: AnnouncementCardFilter;
  /** Drill-down: opens the feed showing the announcements behind the number. */
  onDrillDown: (filter: AnnouncementCardFilter) => void;
}

export function StatCards({
  announcements,
  cardFilter,
  onDrillDown,
}: StatCardsProps) {
  // Archived announcements live on their own tab and never count here.
  const active = announcements.filter((a) => !a.isArchived);
  const count = (filter: AnnouncementCardFilter) =>
    active.filter((a) => matchesAnnouncementCardFilter(a, filter)).length;

  const card = (key: AnnouncementCardFilter) => ({
    active: cardFilter === key,
    // Re-clicking the selected card clears back to the full feed.
    onClick: () => onDrillDown(cardFilter === key ? "all" : key),
  });

  const cards: HrStatCardItem[] = [
    {
      label: "Published",
      value: count("published"),
      sub: "Live announcements",
      icon: Megaphone,
      tone: "emerald",
      ...card("published"),
    },
    {
      label: "Needs Acknowledgement",
      value: count("needs_ack"),
      sub: "Require employee sign-off",
      icon: Bell,
      tone: "amber",
      ...card("needs_ack"),
    },
    {
      label: "Upcoming",
      value: count("scheduled"),
      sub: "Scheduled to publish",
      icon: CalendarClock,
      tone: "blue",
      ...card("scheduled"),
    },
    {
      label: "Drafts",
      value: count("draft"),
      sub: "Not yet published",
      icon: FileEdit,
      tone: "violet",
      ...card("draft"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
