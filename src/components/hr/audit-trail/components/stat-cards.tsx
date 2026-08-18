"use client";

import { Activity, Clock, AlertTriangle, Gauge } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { computeAuditStats } from "../data";
import type { AuditEntry } from "../types";

/** The slice a KPI card drills the audit log down to. */
export type AuditCardFilter = "all" | "errors" | "slow" | "suspicious";

export const AUDIT_CARD_FILTER_LABELS: Record<
  Exclude<AuditCardFilter, "all">,
  string
> = {
  errors: "Failed requests",
  slow: "Slower than average",
  suspicious: "Flagged events",
};

/**
 * Single source of truth for what each card counts and the log then shows.
 * "slow" is relative, so the average is passed in from the unfiltered set.
 */
export function matchesAuditCardFilter(
  entry: AuditEntry,
  filter: AuditCardFilter,
  avgResponseTime: number,
): boolean {
  switch (filter) {
    case "errors":
      return entry.httpStatus >= 400;
    case "slow":
      return entry.responseTimeMs > avgResponseTime;
    case "suspicious":
      return entry.isSuspicious;
    default:
      return true;
  }
}

interface StatCardsProps {
  /** Every entry, unfiltered — each card counts its own slice. */
  entries: AuditEntry[];
  /** The card drill-down currently applied. */
  cardFilter: AuditCardFilter;
  /** Drill-down: filters the log to the entries behind the number. */
  onFilterChange: (filter: AuditCardFilter) => void;
}

export function StatCards({
  entries,
  cardFilter,
  onFilterChange,
}: StatCardsProps) {
  const { totalActions, sessions, errorRate, avgResponseTime, suspicious } =
    computeAuditStats(entries);

  const failed = entries.filter((e) => e.httpStatus >= 400).length;
  const slow = entries.filter(
    (e) => e.responseTimeMs > avgResponseTime,
  ).length;

  const card = (key: AuditCardFilter) => ({
    active: cardFilter === key,
    // Re-clicking the selected card clears back to the full log.
    onClick: () => onFilterChange(cardFilter === key ? "all" : key),
  });

  const cards: HrStatCardItem[] = [
    {
      label: "Total Actions",
      value: totalActions,
      sub: `${sessions} session${sessions !== 1 ? "s" : ""}`,
      icon: Activity,
      tone: "blue",
      active: cardFilter === "all",
      onClick: () => onFilterChange("all"),
    },
    {
      label: "Error Rate",
      value: `${errorRate}%`,
      sub: `${failed} failed request${failed !== 1 ? "s" : ""}`,
      icon: AlertTriangle,
      tone: errorRate > 5 ? "red" : "emerald",
      ...card("errors"),
    },
    {
      label: "Avg Response",
      value: `${avgResponseTime}ms`,
      sub: `${slow} above average`,
      icon: Gauge,
      tone: "violet",
      ...card("slow"),
    },
    {
      label: "Suspicious",
      value: suspicious,
      sub: suspicious > 0 ? "Flagged events" : "No alerts",
      icon: Clock,
      tone: suspicious > 0 ? "amber" : "violet",
      ...card("suspicious"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
