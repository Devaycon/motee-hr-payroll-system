"use client";

import { Trophy, Star, Heart, Users } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { KUDOS_TYPE_CONFIG, LEADERBOARD } from "../data";
import type { KudosPost } from "../types";

/**
 * The slice a KPI card drills the feed down to. Two of these depend on values
 * computed from the posts (who leads, which value is used most), so the filter
 * carries the subject rather than being a fixed key.
 */
export type KudosCardFilter =
  | { kind: "all" }
  | { kind: "month"; month: string }
  | { kind: "recipient"; name: string }
  | { kind: "type"; value: string };

export function kudosCardFilterLabel(filter: KudosCardFilter): string {
  switch (filter.kind) {
    case "month":
      return "Kudos this month";
    case "recipient":
      return `Kudos for ${filter.name}`;
    case "type":
      return `${
        KUDOS_TYPE_CONFIG[filter.value as keyof typeof KUDOS_TYPE_CONFIG]
          ?.label ?? filter.value
      } kudos`;
    default:
      return "";
  }
}

/** Single source of truth for what each card counts and the feed then shows. */
export function matchesKudosCardFilter(
  post: KudosPost,
  filter: KudosCardFilter,
): boolean {
  switch (filter.kind) {
    case "month":
      return post.createdAt.startsWith(filter.month);
    case "recipient":
      return post.recipientName === filter.name;
    case "type":
      return post.kudosType === filter.value;
    default:
      return true;
  }
}

interface StatCardsProps {
  posts: KudosPost[];
  /** The card drill-down currently applied. */
  cardFilter: KudosCardFilter;
  /** Drill-down: filters the feed to the posts behind the number. */
  onDrillDown: (filter: KudosCardFilter) => void;
}

export function StatCards({ posts, cardFilter, onDrillDown }: StatCardsProps) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthPosts = posts.filter((p) => p.createdAt.startsWith(thisMonth));

  const totalThisMonth = thisMonthPosts.length;

  const topRecipient = LEADERBOARD[0];

  const typeCounts: Record<string, number> = {};
  posts.forEach((p) => {
    typeCounts[p.kudosType] = (typeCounts[p.kudosType] ?? 0) + 1;
  });
  const topTypeKey = Object.entries(typeCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0] as string | undefined;
  const topTypeLabel = topTypeKey
    ? KUDOS_TYPE_CONFIG[topTypeKey as keyof typeof KUDOS_TYPE_CONFIG]?.label
    : "—";

  const uniqueGivers = new Set(posts.map((p) => p.senderName)).size;
  const totalEmployees = 156;
  const participationPct = Math.round((uniqueGivers / totalEmployees) * 100);

  /** Re-clicking the selected card clears back to the whole feed. */
  const toggle = (next: KudosCardFilter, isActive: boolean) => ({
    active: isActive,
    onClick: () => onDrillDown(isActive ? { kind: "all" } : next),
  });

  const cards: HrStatCardItem[] = [
    {
      label: "Kudos This Month",
      value: totalThisMonth,
      sub: "Recognitions sent",
      icon: Trophy,
      tone: "amber",
      ...toggle({ kind: "month", month: thisMonth }, cardFilter.kind === "month"),
    },
    {
      label: "Top Recipient",
      value: topRecipient?.employeeName ?? "—",
      sub: `${topRecipient?.kudosReceived ?? 0} kudos received`,
      icon: Star,
      tone: "violet",
      ...toggle(
        { kind: "recipient", name: topRecipient?.employeeName ?? "" },
        cardFilter.kind === "recipient",
      ),
    },
    {
      label: "Most Used Value",
      value: topTypeLabel ?? "—",
      sub: `${typeCounts[topTypeKey ?? ""] ?? 0} times this period`,
      icon: Heart,
      tone: "red",
      ...toggle(
        { kind: "type", value: topTypeKey ?? "" },
        cardFilter.kind === "type",
      ),
    },
    {
      // A rate over everyone, so this is the "show me everything" reset.
      label: "Participation Rate",
      value: `${participationPct}%`,
      sub: `${uniqueGivers} of ${totalEmployees} employees`,
      icon: Users,
      tone: "emerald",
      active: cardFilter.kind === "all",
      onClick: () => onDrillDown({ kind: "all" }),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
