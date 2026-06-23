"use client";

import { StatCards } from "./components/stat-cards";
import { AttendanceChart } from "./components/attendance-chart";
import { SatisfactionCard } from "./components/satisfaction-card";
import { SalaryDistributionCard } from "./components/salary-distribution-card";
import { HeadcountTrendCard } from "./components/headcount-trend-card";
import { GenderSplitCard } from "./components/gender-split-card";
import { MyProfileStats } from "./components/my-profile-stats";
import { UpcomingEventsCard } from "./components/upcoming-events-card";
import { HrAlertsCard } from "@/src/components/hr/hr-alerts";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { Skeleton } from "@/src/components/ui/skeleton";

const HrDashboard = () => {
  const user = useAppSelector((s) => s.auth.user);

  const greetingName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6 w-fit">
        {greetingName ? (
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name}
          </h1>
        ) : (
          <Skeleton className="h-10 w-80" />
        )}
        <p className=" w-[100%] text-sm text-muted-foreground mt-0.5">
          Stay on top of employee activities, workforce updates, and HR
          operations from one place.
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

      <div className="">
        <HrAlertsCard />
      </div>
      <div className="">
        <UpcomingEventsCard />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          My Profile Stats
        </h2>
        <MyProfileStats />
      </section>
    </div>
  );
};

export default HrDashboard;
