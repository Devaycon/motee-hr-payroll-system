import { Package2, UserCheck, CheckCircle2, Wrench } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { Asset, AssetStatus } from "../types";

/** The status a KPI card drills the "All Assets" table down to. */
export type AssetCardFilter = AssetStatus | "all";

export const ASSET_CARD_FILTER_LABELS: Record<
  Exclude<AssetCardFilter, "all">,
  string
> = {
  assigned: "Assigned",
  available: "Available",
  under_maintenance: "Under maintenance",
  decommissioned: "Decommissioned",
};

interface StatCardsProps {
  assets: Asset[];
  /** The tab currently open — cards only read as selected on "All Assets". */
  activeTab: string;
  /** The status filter applied to the assets table, or "all". */
  statusFilter: AssetCardFilter;
  /** Drill-down: opens the assets tab filtered to the status counted here. */
  onDrillDown: (tab: string, status: AssetCardFilter) => void;
}

export function StatCards({
  assets,
  activeTab,
  statusFilter,
  onDrillDown,
}: StatCardsProps) {
  const total = assets.length;
  const assigned = assets.filter((a) => a.status === "assigned").length;
  const available = assets.filter((a) => a.status === "available").length;
  const underMaintenance = assets.filter(
    (a) => a.status === "under_maintenance",
  ).length;
  const decommissioned = assets.filter(
    (a) => a.status === "decommissioned",
  ).length;

  /** The status cards all drill into the "All Assets" tab. */
  const onAll = activeTab === "all";
  const card = (status: AssetCardFilter) => ({
    active: onAll && statusFilter === status,
    onClick: () => onDrillDown("all", status),
  });

  const cards: HrStatCardItem[] = [
    {
      label: "Total Assets",
      value: total,
      sub: `${decommissioned} decommissioned`,
      icon: Package2,
      tone: "violet",
      ...card("all"),
    },
    {
      label: "Assigned",
      value: assigned,
      sub: "Currently in use",
      icon: UserCheck,
      tone: "blue",
      ...card("assigned"),
    },
    {
      label: "Available",
      value: available,
      sub: "Ready for assignment",
      icon: CheckCircle2,
      tone: "emerald",
      ...card("available"),
    },
    {
      label: "Under Maintenance",
      value: underMaintenance,
      sub: "Awaiting servicing",
      icon: Wrench,
      tone: "amber",
      ...card("under_maintenance"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
