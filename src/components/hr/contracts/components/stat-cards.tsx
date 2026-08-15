import { FileText, AlertTriangle, XCircle, FilePen } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { Contract } from "../types";

interface StatCardsProps {
  contracts: Contract[];
  /** The tab currently open, so the matching card reads as selected. */
  activeTab: string;
  /** Drill-down: opens the tab listing the contracts behind the number. */
  onTabChange: (tab: string) => void;
}

export function StatCards({
  contracts,
  activeTab,
  onTabChange,
}: StatCardsProps) {
  const active = contracts.filter(
    (c) => c.status === "active" && !c.isArchived,
  ).length;
  const expiringSoon = contracts.filter(
    (c) => c.status === "expiring_soon" && !c.isArchived,
  ).length;
  const expired = contracts.filter(
    (c) => c.status === "expired" && !c.isArchived,
  ).length;
  const drafts = contracts.filter(
    (c) => c.status === "draft" && !c.isArchived,
  ).length;

  const cards: HrStatCardItem[] = [
    {
      label: "Active Contracts",
      value: active,
      sub: "Currently in force",
      icon: FileText,
      tone: "emerald",
      active: activeTab === "active",
      onClick: () => onTabChange("active"),
    },
    {
      label: "Expiring Soon",
      value: expiringSoon,
      sub: "Within 30 days",
      icon: AlertTriangle,
      tone: "amber",
      active: activeTab === "expiring",
      onClick: () => onTabChange("expiring"),
    },
    {
      label: "Expired",
      value: expired,
      sub: "Past end date",
      icon: XCircle,
      tone: "red",
      active: activeTab === "expired",
      onClick: () => onTabChange("expired"),
    },
    {
      label: "Drafts",
      value: drafts,
      sub: "Awaiting review",
      icon: FilePen,
      tone: "violet",
      active: activeTab === "drafts",
      onClick: () => onTabChange("drafts"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
