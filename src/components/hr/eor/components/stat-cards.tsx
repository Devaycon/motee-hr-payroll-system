"use client";

import { Globe2, Users, Building2, DollarSign } from "lucide-react";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import type { HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import type { EorWorker, EorProvider } from "../types";
import { formatUsd } from "../data";

interface StatCardsProps {
  workers: EorWorker[];
  providers: EorProvider[];
}

export function StatCards({ workers, providers }: StatCardsProps) {
  const activeWorkers = workers.filter((w) => w.status !== "ended");
  const activeProviders = providers.filter((p) => p.status === "active");
  const countries = new Set(workers.map((w) => w.country));
  const monthlySpend = activeWorkers.reduce((sum, w) => sum + w.monthlyCostUsd, 0);

  const stats: HrStatCardItem[] = [
    {
      icon: Users,
      label: "EOR Workers",
      value: activeWorkers.length,
      sub: "engaged via providers",
    },
    {
      icon: Building2,
      label: "Active Providers",
      value: activeProviders.length,
      sub: `of ${providers.length} partners`,
    },
    {
      icon: Globe2,
      label: "Countries",
      value: countries.size,
      sub: "of engagement",
    },
    {
      icon: DollarSign,
      label: "Monthly EOR Spend",
      value: formatUsd(monthlySpend),
      sub: "total cost (USD)",
    },
  ];

  return <HrStatCardsGrid stats={stats} columns={4} />;
}
