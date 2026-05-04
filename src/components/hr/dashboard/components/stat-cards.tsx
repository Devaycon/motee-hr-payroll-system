"use client";

import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import { STAT_CARDS } from "@/src/data/dashboard-demo";

export function StatCards() {
  return <HrStatCardsGrid stats={STAT_CARDS} columns={4} />;
}
