"use client";

import { UserPlus, Users, CheckCircle, AlertTriangle } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { OnboardingRecord, OnboardingStatus } from "../types";

interface StatCardsProps {
  /** Every record, unfiltered — each card counts its own slice. */
  records: OnboardingRecord[];
  /** The status filter currently applied to the pipeline, or "all". */
  statusFilter: string;
  /** Drill-down: sets the pipeline's status filter (client feedback §2.20). */
  onFilterChange: (status: OnboardingStatus | "all") => void;
}

export function StatCards({
  records,
  statusFilter,
  onFilterChange,
}: StatCardsProps) {
  const active = records.filter((r) => r.status === "in_progress").length;
  const completed = records.filter((r) => r.status === "completed").length;
  const overdue = records.filter((r) => r.status === "overdue").length;

  const cards: HrStatCardItem[] = [
    {
      label: "Total Onboarding",
      value: records.length,
      sub: "All initiated pipelines",
      icon: UserPlus,
      tone: "blue",
      active: statusFilter === "all",
      onClick: () => onFilterChange("all"),
    },
    {
      label: "In Progress",
      value: active,
      sub: "Currently onboarding",
      icon: Users,
      tone: "violet",
      active: statusFilter === "in_progress",
      onClick: () => onFilterChange("in_progress"),
    },
    {
      label: "Completed",
      value: completed,
      sub: "Fully onboarded",
      icon: CheckCircle,
      tone: "emerald",
      active: statusFilter === "completed",
      onClick: () => onFilterChange("completed"),
    },
    {
      label: "Overdue",
      value: overdue,
      sub: "Require attention",
      icon: AlertTriangle,
      tone: "red",
      active: statusFilter === "overdue",
      onClick: () => onFilterChange("overdue"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
