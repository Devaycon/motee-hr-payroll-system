"use client";

import {
  HeadphonesIcon,
  Inbox,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { computeHelpdeskStats } from "../data";
import type { HelpDeskTicket } from "../types";

/** The slice a KPI card drills the All Cases table down to. */
export type HelpdeskCardFilter = "all" | "resolved_today" | "overdue";

export const HELPDESK_CARD_FILTER_LABELS: Record<
  Exclude<HelpdeskCardFilter, "all">,
  string
> = {
  resolved_today: "Resolved today",
  overdue: "Overdue (SLA)",
};

/** Single source of truth for what each card counts and the table then shows. */
export function matchesHelpdeskCardFilter(
  ticket: HelpDeskTicket,
  filter: HelpdeskCardFilter,
  today: string,
): boolean {
  switch (filter) {
    case "resolved_today":
      return ticket.resolvedAt?.startsWith(today) ?? false;
    case "overdue":
      return ticket.isOverdue === true;
    default:
      return true;
  }
}

interface StatCardsProps {
  tickets: HelpDeskTicket[];
  /** The tab currently open. */
  activeTab: string;
  /** The card drill-down currently applied. */
  cardFilter: HelpdeskCardFilter;
  /** Drill-down: opens the tab holding these cases and filters to them. */
  onDrillDown: (tab: string, filter: HelpdeskCardFilter) => void;
}

export function StatCards({
  tickets,
  activeTab,
  cardFilter,
  onDrillDown,
}: StatCardsProps) {
  const { total, open, resolvedToday, overdue } = computeHelpdeskStats(tickets);

  const cards: HrStatCardItem[] = [
    {
      label: "Total Cases",
      value: total,
      sub: "Every case raised",
      icon: HeadphonesIcon,
      tone: "blue",
      active: activeTab === "all" && cardFilter === "all",
      onClick: () => onDrillDown("all", "all"),
    },
    {
      label: "Open / Active",
      value: open,
      sub: "Still being worked",
      icon: Inbox,
      tone: "amber",
      active: activeTab === "open" && cardFilter === "all",
      onClick: () => onDrillDown("open", "all"),
    },
    {
      label: "Resolved Today",
      value: resolvedToday,
      sub: "Closed out today",
      icon: CheckCircle2,
      tone: "emerald",
      active: cardFilter === "resolved_today",
      onClick: () => onDrillDown("all", "resolved_today"),
    },
    {
      label: "Overdue (SLA)",
      value: overdue,
      sub: "Past their SLA",
      icon: AlertTriangle,
      tone: "red",
      active: cardFilter === "overdue",
      onClick: () => onDrillDown("all", "overdue"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
