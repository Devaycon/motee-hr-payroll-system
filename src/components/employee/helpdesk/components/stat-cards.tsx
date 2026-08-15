"use client";

import { LifeBuoy, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { HelpDeskTicket } from "./data";

/** The slice a KPI card drills My Cases down to. */
export type HelpdeskCardFilter = "all" | "open" | "resolved" | "overdue";

export const HELPDESK_CARD_FILTER_LABELS: Record<
  Exclude<HelpdeskCardFilter, "all">,
  string
> = {
  open: "Open / in progress",
  resolved: "Resolved",
  overdue: "Overdue",
};

/** Single source of truth for what each card counts and the list then shows. */
export function matchesHelpdeskCardFilter(
  ticket: HelpDeskTicket,
  filter: HelpdeskCardFilter,
): boolean {
  switch (filter) {
    case "open":
      return ticket.status === "open" || ticket.status === "in_progress";
    case "resolved":
      return ticket.status === "resolved" || ticket.status === "closed";
    case "overdue":
      return ticket.isOverdue === true;
    default:
      return true;
  }
}

interface Props {
  total: number;
  open: number;
  resolved: number;
  overdue: number;
  /** The card drill-down currently applied. */
  cardFilter: HelpdeskCardFilter;
  /** Drill-down: opens My Cases showing the tickets behind the number. */
  onDrillDown: (filter: HelpdeskCardFilter) => void;
}

export function HelpdeskStatCards({
  total,
  open,
  resolved,
  overdue,
  cardFilter,
  onDrillDown,
}: Props) {
  const card = (key: HelpdeskCardFilter) => ({
    active: cardFilter === key,
    onClick: () => onDrillDown(key),
  });

  const cards: HrStatCardItem[] = [
    {
      label: "Total Cases",
      value: total,
      sub: "Everything you've raised",
      icon: LifeBuoy,
      tone: "blue",
      ...card("all"),
    },
    {
      label: "Open / In Progress",
      value: open,
      sub: "Still being worked",
      icon: Clock,
      tone: "amber",
      ...card("open"),
    },
    {
      label: "Resolved",
      value: resolved,
      sub: "Closed out",
      icon: CheckCircle,
      tone: "emerald",
      ...card("resolved"),
    },
    {
      label: "Overdue",
      value: overdue,
      sub: "Past their SLA",
      icon: AlertTriangle,
      tone: "red",
      ...card("overdue"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
