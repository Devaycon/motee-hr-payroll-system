"use client";

import { Lightbulb, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { computeSuggestionStats } from "../data";
import type { Suggestion } from "../types";

/** The slice a KPI card drills the submissions table down to. */
export type SuggestionCardFilter = "all" | "implemented" | "under_review";

export const SUGGESTION_CARD_FILTER_LABELS: Record<
  Exclude<SuggestionCardFilter, "all">,
  string
> = {
  implemented: "Implemented",
  under_review: "Under review",
};

/** Single source of truth for what each card counts and the table then shows. */
export function matchesSuggestionCardFilter(
  suggestion: Suggestion,
  filter: SuggestionCardFilter,
): boolean {
  switch (filter) {
    case "implemented":
      return suggestion.status === "implemented";
    case "under_review":
      return (
        suggestion.status === "under_review" || suggestion.status === "accepted"
      );
    default:
      return true;
  }
}

interface StatCardsProps {
  suggestions: Suggestion[];
  /** The tab currently open. */
  activeTab: string;
  /** The card drill-down currently applied. */
  cardFilter: SuggestionCardFilter;
  /** Drill-down: opens the tab holding these rows and filters to them. */
  onDrillDown: (tab: string, filter: SuggestionCardFilter) => void;
}

export function StatCards({
  suggestions,
  activeTab,
  cardFilter,
  onDrillDown,
}: StatCardsProps) {
  const { total, implemented, underReview, avgUpvotes } =
    computeSuggestionStats(suggestions);

  const cards: HrStatCardItem[] = [
    {
      label: "Total Submissions",
      value: total,
      sub: "Everything submitted",
      icon: Lightbulb,
      tone: "violet",
      active: activeTab === "submissions" && cardFilter === "all",
      onClick: () => onDrillDown("submissions", "all"),
    },
    {
      label: "Implemented",
      value: implemented,
      sub: "Shipped and closed",
      icon: CheckCircle2,
      tone: "emerald",
      active: cardFilter === "implemented",
      onClick: () => onDrillDown("submissions", "implemented"),
    },
    {
      label: "Under Review",
      value: underReview,
      sub: "Being considered",
      icon: Clock,
      tone: "amber",
      active: cardFilter === "under_review",
      onClick: () => onDrillDown("submissions", "under_review"),
    },
    {
      // An average, not a list — the community board is where upvoting happens.
      label: "Avg Upvotes",
      value: avgUpvotes,
      sub: "See the community board",
      icon: TrendingUp,
      tone: "blue",
      active: activeTab === "board",
      onClick: () => onDrillDown("board", "all"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
