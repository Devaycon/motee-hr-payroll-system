"use client";

import { StatCards } from "./components/stat-cards";
import { AttendanceChart } from "./components/attendance-chart";
import { SatisfactionCard } from "./components/satisfaction-card";
import { SalaryDistributionCard } from "./components/salary-distribution-card";
import { HeadcountTrendCard } from "./components/headcount-trend-card";
import { GenderSplitCard } from "./components/gender-split-card";
import { UpcomingEventsCard } from "./components/upcoming-events-card";
import { HrAlertsCard } from "@/src/components/hr/hr-alerts";
import { EmployeesAtRiskCard } from "./components/employees-at-risk";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { Skeleton } from "@/src/components/ui/skeleton";

const HrDashboard = () => {
  const user = useAppSelector((s) => s.auth.user);

  const greetingName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="py-4 w-fit">
        {greetingName ? (
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name}!
          </h1>
        ) : (
          <Skeleton className="h-10 w-80" />
        )}
        <p className="w-full text-sm font-semibold text-muted-foreground mt-0.5">
          Here&apos;s an overview of today&apos;s workforce activity and key HR
          metrics.
        </p>
      </div>

      <StatCards />

      <div className="grid grid-cols-5 gap-4">
        <AttendanceChart />
        <SatisfactionCard />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SalaryDistributionCard />
        <HeadcountTrendCard />
        <GenderSplitCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <HrAlertsCard />
        </div>
        <EmployeesAtRiskCard />
      </div>
      {/* Self-service widgets ("My Profile Stats") used to sit here. They now
          live only in the employee portal, reachable via the Self-Service
          toggle in the navbar (client feedback §4.3). */}
      <div className="">
        <UpcomingEventsCard />
      </div>
    </div>
  );
};

export default HrDashboard;
