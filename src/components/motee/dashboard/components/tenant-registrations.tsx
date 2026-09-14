"use client";

import { Building2 } from "lucide-react";
import { ChartCard, ChartPlaceholder } from "@/src/components/shared/charts";

export function TenantRegistrationsCard() {
  return (
    <ChartCard
      title="New Tenant Registrations"
      description="May 2025 – Apr 2026"
      icon={Building2}
      footer="Monthly new registrations"
    >
      <ChartPlaceholder />
    </ChartCard>
  );
}
