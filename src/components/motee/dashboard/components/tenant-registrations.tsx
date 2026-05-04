"use client";

import { Building2 } from "lucide-react";
import { LineChartCard } from "@/src/components/shared/charts/line-chart";
import {
  TENANT_REGISTRATIONS_DATA,
  TENANT_REGISTRATIONS_CONFIG,
} from "@/src/data/motee-demo";

export function TenantRegistrationsCard() {
  return (
    <LineChartCard
      title="New Tenant Registrations"
      description="May 2025 – Apr 2026"
      icon={Building2}
      data={TENANT_REGISTRATIONS_DATA}
      config={TENANT_REGISTRATIONS_CONFIG}
      series={[{ key: "registrations", color: "#4ED251", showLabels: true }]}
      xAxisKey="month"
      footerSub="Monthly new registrations"
    />
  );
}
