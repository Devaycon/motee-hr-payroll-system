"use client";

import { StatCards } from "./components/stat-cards";
import { AttendanceChart } from "./components/attendance-chart";
import { SatisfactionCard } from "./components/satisfaction-card";
import { EmployeeTable } from "./components/employee-table";
import { SalaryDistributionCard } from "./components/salary-distribution-card";
import { HeadcountTrendCard } from "./components/headcount-trend-card";
import { GenderSplitCard } from "./components/gender-split-card";

const HrDashboard = () => {
  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold  text-foreground">
          Welcome, Adeyemi Abayomi
        </h1>
        <p className=" w-[60%] text-sm text-muted-foreground mt-0.5">
          This is your central hub for managing your workforce, staying on top of HR operations, and keeping your team running smoothly.
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

      <div className="grid grid-cols-1 gap-4">
        <EmployeeTable />
      </div>
    </div>
  );
};

export default HrDashboard;
