"use client";

import { Globe2, Users, Building2, DollarSign } from "lucide-react";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import type { HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import type { EorWorker, EorProvider } from "../types";
import { formatUsd } from "../data";

/** The slice a KPI card drills into. */
export type EorCardFilter = "all" | "active_workers" | "active_providers";

export const EOR_CARD_FILTER_LABELS: Record<
  Exclude<EorCardFilter, "all">,
  string
> = {
  active_workers: "Active workers",
  active_providers: "Active providers",
};

export function matchesWorkerCardFilter(
  worker: EorWorker,
  filter: EorCardFilter,
): boolean {
  return filter === "active_workers" ? worker.status !== "ended" : true;
}

export function matchesProviderCardFilter(
  provider: EorProvider,
  filter: EorCardFilter,
): boolean {
  return filter === "active_providers" ? provider.status === "active" : true;
}

interface StatCardsProps {
  workers: EorWorker[];
  providers: EorProvider[];
  /** The tab currently open. */
  activeTab: string;
  /** The card drill-down currently applied. */
  cardFilter: EorCardFilter;
  /** Drill-down: opens the tab holding these rows and filters to them. */
  onDrillDown: (tab: string, filter: EorCardFilter) => void;
}

export function StatCards({
  workers,
  providers,
  activeTab,
  cardFilter,
  onDrillDown,
}: StatCardsProps) {
  const activeWorkers = workers.filter((w) =>
    matchesWorkerCardFilter(w, "active_workers"),
  );
  const activeProviders = providers.filter((p) =>
    matchesProviderCardFilter(p, "active_providers"),
  );
  const countries = new Set(workers.map((w) => w.country));
  const monthlySpend = activeWorkers.reduce(
    (sum, w) => sum + w.monthlyCostUsd,
    0,
  );

  const stats: HrStatCardItem[] = [
    {
      icon: Users,
      label: "EOR Workers",
      value: activeWorkers.length,
      sub: "engaged via providers",
      tone: "blue",
      active: cardFilter === "active_workers",
      onClick: () => onDrillDown("workers", "active_workers"),
    },
    {
      icon: Building2,
      label: "Active Providers",
      value: activeProviders.length,
      sub: `of ${providers.length} partners`,
      tone: "violet",
      active: cardFilter === "active_providers",
      onClick: () => onDrillDown("providers", "active_providers"),
    },
    {
      // Countries aren't a filter of their own — the workers table is where
      // the country column lives, so this opens the unfiltered list.
      icon: Globe2,
      label: "Countries",
      value: countries.size,
      sub: "of engagement",
      tone: "emerald",
      active: activeTab === "workers" && cardFilter === "all",
      onClick: () => onDrillDown("workers", "all"),
    },
    {
      icon: DollarSign,
      label: "Monthly EOR Spend",
      value: formatUsd(monthlySpend),
      sub: "total cost (USD)",
      tone: "amber",
      active: activeTab === "billing",
      onClick: () => onDrillDown("billing", "all"),
    },
  ];

  return <HrStatCardsGrid stats={stats} columns={4} />;
}
