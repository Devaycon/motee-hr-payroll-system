"use client";

import { ResponsiveRadar } from "@nivo/radar";
import { Users } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ChartCard, NIVO_THEME } from "@/src/components/shared/charts";
import { useDepartmentHeadcount } from "../hooks";

export function DeptHeadcountChart() {
  const { data, loading } = useDepartmentHeadcount();

  if (loading || !data) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  // The per-department legend duplicated the bars and was the row that scrolled;
  // /operations/analytics/employees carries the full breakdown (and links on to the table).
  const total = data.data.reduce((s, d) => s + d.value, 0);

  // A radar reads department headcount as one shape rather than a ranked
  // list — the Employees View More link is where a reader goes for the
  // ranked, scrollable version of the same numbers.
  const radarData = data.data.map((d) => ({
    department: d.category,
    Employees: d.value,
  }));

  return (
    <ChartCard
      title="Dept. Headcount"
      description="Active employees in each department"
      icon={Users}
      compact
      footer={`${total} employees across ${data.data.length} departments`}
      viewMoreHref="/operations/analytics/employees"
      className="h-full"
    >
      <div style={{ height: 220 }}>
        <ResponsiveRadar
          data={radarData}
          keys={["Employees"]}
          indexBy="department"
          maxValue="auto"
          margin={{ top: 26, right: 60, bottom: 26, left: 60 }}
          gridShape="circular"
          gridLevels={4}
          colors={["#6366f1"]}
          fillOpacity={0.25}
          borderWidth={2}
          borderColor={{ from: "color" }}
          dotSize={6}
          dotColor={{ from: "color" }}
          dotBorderWidth={0}
          enableDotLabel={false}
          theme={NIVO_THEME}
          motionConfig="gentle"
        />
      </div>
    </ChartCard>
  );
}
