"use client";

import { CmsStatCards } from "./dashboard/components/stat-cards";
import { SystemHealthCard } from "./dashboard/components/system-health";
import { RevenueTrendCard } from "./dashboard/components/revenue-trend";
import { TenantRegistrationsCard } from "./dashboard/components/tenant-registrations";
import { PendingTasksCard } from "./dashboard/components/pending-tasks";
import { RecentActivityCard } from "./dashboard/components/recent-activity";
import { DemoConversionCard } from "./dashboard/components/demo-conversion";
import { TenantHealthCard } from "./dashboard/components/tenant-health";

export default function CmsDashboard() {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">
          Platform Overview
        </h1>
        <p className="w-[60%] text-sm text-muted-foreground mt-0.5">
          Monitor all tenants, subscriptions, system health, and platform
          activity from a single control panel. {dateStr}.
        </p>
      </div>

      <CmsStatCards />

      <div className="grid grid-cols-3 gap-4">
        <TenantHealthCard />
        <SystemHealthCard />
        <PendingTasksCard />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <RevenueTrendCard />
        <TenantRegistrationsCard />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <RecentActivityCard />
        </div>
        <DemoConversionCard />
      </div>
    </div>
  );
}
