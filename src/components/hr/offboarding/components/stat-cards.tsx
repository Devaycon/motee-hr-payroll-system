"use client";

import { UserMinus, Clock, CheckCircle, ClipboardList } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { OffboardingRecord } from "../types";

/**
 * The slice a KPI card drills into. The lifecycle tabs group several statuses
 * together, so the cards need their own filter on top of the tab (§2.1).
 */
export type OffboardingCardFilter =
  | "all"
  | "in_progress"
  | "completed"
  | "clearance_pending";

export const OFFBOARDING_CARD_FILTER_LABELS: Record<
  Exclude<OffboardingCardFilter, "all">,
  string
> = {
  in_progress: "In progress",
  completed: "Completed",
  clearance_pending: "Clearance pending",
};

/** Single source of truth for what each card counts and the table then shows. */
export function matchesOffboardingCardFilter(
  record: OffboardingRecord,
  filter: OffboardingCardFilter,
): boolean {
  switch (filter) {
    case "in_progress":
      return record.status === "in_progress";
    case "completed":
      return record.status === "completed";
    case "clearance_pending":
      return (
        record.status !== "completed" &&
        record.clearanceItems.some((c) => !c.completed)
      );
    default:
      return true;
  }
}

interface StatCardsProps {
  /** Every record, unfiltered — each card counts its own slice. */
  records: OffboardingRecord[];
  /** The card drill-down currently applied. */
  cardFilter: OffboardingCardFilter;
  /** Drill-down: opens the tab holding these records and filters to them. */
  onDrillDown: (tab: string, filter: OffboardingCardFilter) => void;
}

export function StatCards({
  records,
  cardFilter,
  onDrillDown,
}: StatCardsProps) {
  const count = (filter: OffboardingCardFilter) =>
    records.filter((r) => matchesOffboardingCardFilter(r, filter)).length;

  const cards: HrStatCardItem[] = [
    {
      label: "Total Offboarding",
      value: records.length,
      sub: "All initiated pipelines",
      icon: UserMinus,
      tone: "blue",
      active: cardFilter === "all",
      onClick: () => onDrillDown("all", "all"),
    },
    {
      label: "In Progress",
      value: count("in_progress"),
      sub: "Active offboarding",
      icon: Clock,
      tone: "amber",
      active: cardFilter === "in_progress",
      onClick: () => onDrillDown("approved", "in_progress"),
    },
    {
      label: "Completed",
      value: count("completed"),
      sub: "Fully offboarded",
      icon: CheckCircle,
      tone: "emerald",
      active: cardFilter === "completed",
      onClick: () => onDrillDown("approved", "completed"),
    },
    {
      label: "Clearance Pending",
      value: count("clearance_pending"),
      sub: "Outstanding items",
      icon: ClipboardList,
      tone: "red",
      // Outstanding clearance spans several statuses, so it lands on "All".
      active: cardFilter === "clearance_pending",
      onClick: () => onDrillDown("all", "clearance_pending"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
