"use client";

import { FileText, FileCheck2, AlertTriangle, PenLine } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";

interface ContractStatsProps {
  total: number;
  active: number;
  expiring: number;
  pending: number;
  /** The tab currently open, so the matching card reads as selected. */
  activeTab: string;
  /** Drill-down: opens the tab listing the contracts behind the number. */
  onTabChange: (tab: string) => void;
}

export function ContractStats({
  total,
  active,
  expiring,
  pending,
  activeTab,
  onTabChange,
}: ContractStatsProps) {
  const card = (tab: string) => ({
    active: activeTab === tab,
    onClick: () => onTabChange(tab),
  });

  const cards: HrStatCardItem[] = [
    {
      label: "Total Contracts",
      value: total,
      sub: "Everything on file",
      icon: FileText,
      tone: "blue",
      ...card("all"),
    },
    {
      label: "Active",
      value: active,
      sub: "Currently in force",
      icon: FileCheck2,
      tone: "emerald",
      ...card("active"),
    },
    {
      label: "Expiring Soon",
      value: expiring,
      sub: "Within 30 days",
      icon: AlertTriangle,
      tone: "amber",
      ...card("expiring"),
    },
    {
      label: "Pending Signature",
      value: pending,
      sub: "Waiting on you",
      icon: PenLine,
      tone: "red",
      ...card("unsigned"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
