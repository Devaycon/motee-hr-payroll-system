"use client";

import { ShieldCheck, Clock, CalendarClock, ShieldX, BadgeCheck } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { CertComplianceSummary } from "@/src/lib/certifications/status";
import type { RegisterFilter } from "./certification-register";

interface CertComplianceCardsProps {
  summary: CertComplianceSummary;
  /** The register filter currently applied, when the register tab is open. */
  active: RegisterFilter | null;
  onDrillDown: (filter: RegisterFilter) => void;
}

/**
 * Certification compliance at a glance — turns the L&D screen from a course
 * catalogue into a compliance tool. Each card opens the Certification Register
 * filtered to the certificates it counts.
 */
export function CertComplianceCards({ summary, active, onDrillDown }: CertComplianceCardsProps) {
  const card = (key: RegisterFilter) => ({
    active: active === key,
    onClick: () => onDrillDown(active === key ? "all" : key),
  });

  const cards: HrStatCardItem[] = [
    {
      label: "Active Certifications",
      value: summary.active,
      sub: `of ${summary.total} on record`,
      icon: BadgeCheck,
      tone: "emerald",
      ...card("valid"),
    },
    {
      label: "Expiring in 30 Days",
      value: summary.expiringIn30,
      sub: "Renew now",
      zeroSub: "Nothing due this month",
      icon: Clock,
      tone: "red",
      ...card("expiring_30"),
    },
    {
      label: "Expiring in 90 Days",
      value: summary.expiringIn90,
      sub: "Plan renewals",
      zeroSub: "Nothing due this quarter",
      icon: CalendarClock,
      tone: "amber",
      ...card("expiring_90"),
    },
    {
      label: "Expired Certifications",
      value: summary.expired,
      sub: "No longer valid",
      zeroSub: "No lapsed certifications",
      icon: ShieldX,
      tone: "red",
      ...card("expired"),
    },
    {
      label: "Compliance Rate",
      value: `${summary.complianceRate}%`,
      sub: "Certifications still valid",
      icon: ShieldCheck,
      tone: summary.complianceRate >= 90 ? "emerald" : summary.complianceRate >= 75 ? "amber" : "red",
      ...card("all"),
      active: false,
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={5} />;
}
