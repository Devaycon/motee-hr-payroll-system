"use client";

import { Building2 } from "lucide-react";
import { LineChart } from "@/src/components/shared/charts";
import { TENANT_REGISTRATIONS_DATA } from "@/src/data/motee-demo";

export function TenantRegistrationsCard() {
  return (
    <LineChart
      title="New Tenant Registrations"
      description="May 2025 – Apr 2026"
      icon={Building2}
      footer="Monthly new registrations"
      categories={TENANT_REGISTRATIONS_DATA.map((d) => d.month)}
      series={[
        {
          name: "Registrations",
          data: TENANT_REGISTRATIONS_DATA.map((d) => d.registrations),
          color: "#4ED251",
        },
      ]}
    />
  );
}
