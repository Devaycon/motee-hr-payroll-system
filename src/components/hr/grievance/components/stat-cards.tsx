"use client";

import { FolderOpen, Search, Gavel, CheckCircle2 } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { ERCase } from "../types";
import { computeCaseStats } from "../data";

interface Props {
  cases: ERCase[];
  /** The tab currently open, so the matching card reads as selected. */
  activeTab: string;
  /** Drill-down: opens the tab listing the cases behind the number. */
  onTabChange: (tab: string) => void;
}

export function GrievanceStatCards({ cases, activeTab, onTabChange }: Props) {
  const stats = computeCaseStats(cases);

  const card = (tab: string) => ({
    active: activeTab === tab,
    onClick: () => onTabChange(tab),
  });

  const cards: HrStatCardItem[] = [
    {
      label: "Open Cases",
      value: stats.open,
      sub: "Not yet closed",
      icon: FolderOpen,
      tone: "amber",
      ...card("open"),
    },
    {
      label: "Under Investigation",
      value: stats.investigations,
      sub: "Being looked into",
      icon: Search,
      tone: "red",
      ...card("investigation"),
    },
    {
      label: "Hearings",
      value: stats.hearings,
      sub: "Scheduled or in hearing",
      icon: Gavel,
      tone: "violet",
      ...card("hearing"),
    },
    {
      label: "Closed",
      value: stats.closed,
      sub: "Resolved and filed",
      icon: CheckCircle2,
      tone: "emerald",
      ...card("closed"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
