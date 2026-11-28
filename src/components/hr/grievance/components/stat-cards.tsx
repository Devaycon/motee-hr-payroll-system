"use client";

import { FolderOpen, Search, Gavel, CheckCircle2 } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { ERCase } from "../types";
import { computeCaseStats } from "../data";
import { useIsLive } from "@/src/lib/live/use-is-live";
import { useGetErCaseSummaryQuery } from "@/src/store/services/er-cases";

interface Props {
  cases: ERCase[];
  /** The tab currently open, so the matching card reads as selected. */
  activeTab: string;
  /** Drill-down: opens the tab listing the cases behind the number. */
  onTabChange: (tab: string) => void;
}

export function GrievanceStatCards({ cases, activeTab, onTabChange }: Props) {
  const local = computeCaseStats(cases);
  // Signed in: the server's tally (GET /er-cases/summary), by stage.
  const server = useGetErCaseSummaryQuery(undefined, { skip: !useIsLive() }).data?.data;
  const stats = server
    ? {
        ...local,
        open: server.open,
        investigations: server.byStage.investigation ?? local.investigations,
        hearings: server.byStage.hearing ?? local.hearings,
        closed: server.byStage.closed ?? server.total - server.open,
        totalCases: server.total,
      }
    : local;

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
