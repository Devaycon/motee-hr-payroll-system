"use client";

import { BarChart3, Users, TrendingUp, ClipboardList } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { SURVEYS, getResponseRate, getEngagementScore } from "../data";
import type { Survey } from "../types";

/** The slice a KPI card drills the surveys table down to. */
export type SurveyCardFilter = "all" | "active" | "responded";

export const SURVEY_CARD_FILTER_LABELS: Record<
  Exclude<SurveyCardFilter, "all">,
  string
> = {
  active: "Active surveys",
  responded: "Surveys with responses",
};

/** Single source of truth for what each card counts and the table then shows. */
export function matchesSurveyCardFilter(
  survey: Survey,
  filter: SurveyCardFilter,
): boolean {
  switch (filter) {
    case "active":
      return survey.status === "active";
    case "responded":
      return survey.responses.length > 0;
    default:
      return true;
  }
}

interface StatCardsProps {
  surveys: Survey[];
  /** The tab currently open. */
  activeTab: string;
  /** The card drill-down currently applied. */
  cardFilter: SurveyCardFilter;
  /** Drill-down: opens the tab holding these rows and filters to them. */
  onDrillDown: (tab: string, filter: SurveyCardFilter) => void;
}

export function StatCards({
  surveys,
  activeTab,
  cardFilter,
  onDrillDown,
}: StatCardsProps) {
  // Archived surveys live outside every tab and never count here.
  const live = surveys.filter((s) => !s.isArchived);
  const activeSurveys = live.filter((s) =>
    matchesSurveyCardFilter(s, "active"),
  ).length;

  const respondedSurveys = live.filter((s) =>
    matchesSurveyCardFilter(s, "responded"),
  );
  const avgResponseRate =
    respondedSurveys.length > 0
      ? Math.round(
          respondedSurveys.reduce((sum, s) => sum + getResponseRate(s), 0) /
            respondedSurveys.length,
        )
      : 0;

  const engagementScore = getEngagementScore(SURVEYS);

  const cards: HrStatCardItem[] = [
    {
      label: "Active Surveys",
      value: activeSurveys,
      sub: "Currently collecting",
      icon: BarChart3,
      tone: "emerald",
      active: cardFilter === "active",
      onClick: () => onDrillDown("surveys", "active"),
    },
    {
      label: "Avg Response Rate",
      value: `${avgResponseRate}%`,
      sub: `Across ${respondedSurveys.length} surveys`,
      icon: Users,
      tone: "blue",
      active: cardFilter === "responded",
      onClick: () => onDrillDown("surveys", "responded"),
    },
    {
      // A single score, not a list — the analytics tab is what sits behind it.
      label: "Engagement Score",
      value: `${engagementScore}%`,
      sub: "See engagement analytics",
      icon: TrendingUp,
      tone: "amber",
      active: activeTab === "engagement",
      onClick: () => onDrillDown("engagement", "all"),
    },
    {
      label: "Total Surveys",
      value: live.length,
      sub: "Excluding archived",
      icon: ClipboardList,
      tone: "violet",
      active: activeTab === "surveys" && cardFilter === "all",
      onClick: () => onDrillDown("surveys", "all"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
