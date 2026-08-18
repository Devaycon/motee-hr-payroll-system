"use client";

import { Users, Briefcase, Target, AlertTriangle } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { HeadcountPlan, AttritionRisk, GapStatus } from "../types";

interface StatCardsProps {
  plans: HeadcountPlan[];
  attritionRisks: AttritionRisk[];
  /**
   * Drill-down: jumps to a tab, optionally pre-filtering the Gap Report to a
   * single status (client feedback §6.1 — flagged as highest priority).
   */
  onDrillDown: (tab: string, gapStatus?: GapStatus) => void;
}

export function StatCards({
  plans,
  attritionRisks,
  onDrillDown,
}: StatCardsProps) {
  const totalActual = plans.reduce((sum, p) => sum + p.actual, 0);
  const totalTarget = plans.reduce((sum, p) => sum + p.target, 0);
  const variance = totalActual - totalTarget;
  const openVacancies = Math.max(0, totalTarget - totalActual);
  const deptsOnTarget = plans.filter((p) => p.gapStatus === "on_target").length;
  const highRisk = attritionRisks.filter((r) => r.riskLevel === "high").length;
  // "At risk" excludes the low band, which is carried only for the summary
  // cards on the Attrition Risk tab.
  const atRisk = attritionRisks.filter((r) => r.riskLevel !== "low").length;

  const cards: HrStatCardItem[] = [
    {
      // §6.2 — "20 / 22 planned" read ambiguously; spell out target and gap.
      label: "Current Headcount",
      value: totalActual,
      sub: `Target ${totalTarget} · Gap ${variance > 0 ? `+${variance}` : variance}`,
      icon: Users,
      tone: "blue",
      link: "/organization/employees",
      onClick: () => onDrillDown("plan"),
    },
    {
      label: "Open Vacancies",
      value: openVacancies,
      sub:
        openVacancies === 1
          ? "1 position unfilled"
          : `${openVacancies} positions unfilled`,
      icon: Briefcase,
      tone: "amber",
      onClick: () => onDrillDown("gap", "under"),
    },
    {
      // §6.5 — client's preferred wording.
      label: "Departments at Target",
      value: deptsOnTarget,
      sub: `out of ${plans.length} departments`,
      icon: Target,
      tone: "emerald",
      onClick: () => onDrillDown("gap", "on_target"),
    },
    {
      label: "Attrition Risk",
      value: atRisk,
      sub: `${highRisk} high-risk employee${highRisk !== 1 ? "s" : ""}`,
      icon: AlertTriangle,
      tone: "red",
      onClick: () => onDrillDown("attrition"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
