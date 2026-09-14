"use client";

import { useState } from "react";
import { ResponsiveLine } from "@nivo/line";
import { Card, CardContent } from "@/src/components/ui/card";
import { ChartCard, NIVO_THEME } from "@/src/components/shared/charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { ENGAGEMENT_TREND_DATA } from "../data";

type DeptKey = "engineering" | "marketing" | "sales" | "hr" | "operations";

const DEPT_OPTIONS: { value: DeptKey | "all"; label: string }[] = [
  { value: "all", label: "All Departments" },
  { value: "engineering", label: "Engineering" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "hr", label: "HR" },
  { value: "operations", label: "Operations" },
];

export function EngagementTrend() {
  const [dept, setDept] = useState<DeptKey | "all">("all");

  const latestScore = ENGAGEMENT_TREND_DATA[ENGAGEMENT_TREND_DATA.length - 1];
  const prevScore = ENGAGEMENT_TREND_DATA[ENGAGEMENT_TREND_DATA.length - 2];

  const currentScore =
    dept === "all" ? latestScore.companyWide : latestScore[dept];
  const prevScoreVal = dept === "all" ? prevScore.companyWide : prevScore[dept];
  const diff = currentScore - prevScoreVal;

  const lineData = [
    {
      id: dept === "all" ? "Company Wide" : DEPT_OPTIONS.find((o) => o.value === dept)?.label ?? dept,
      data: ENGAGEMENT_TREND_DATA.map((d) => ({
        x: d.month,
        y: dept === "all" ? d.companyWide : d[dept],
      })),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {currentScore}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / 100
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Current Engagement Score
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              diff >= 0
                ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/30 text-xs"
                : "text-red-600 bg-red-500/10 border-red-500/30 text-xs"
            }
          >
            {diff >= 0 ? "+" : ""}
            {diff} vs last month
          </Badge>
        </div>
        <Select
          value={dept}
          onValueChange={(v) => setDept(v as DeptKey | "all")}
        >
          <SelectTrigger className="w-full sm:w-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEPT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ChartCard
        title="Engagement Score Trend"
        description="Monthly engagement score over the last 12 months"
      >
        <div style={{ height: 240 }}>
          <ResponsiveLine
            data={lineData}
            margin={{ top: 16, right: 24, bottom: 32, left: 44 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", min: 0, max: 100 }}
            curve="monotoneX"
            axisBottom={{ tickSize: 0, tickPadding: 8 }}
            axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 5 }}
            enableGridX={false}
            colors={["#6366f1"]}
            lineWidth={2.5}
            enableArea
            areaOpacity={0.12}
            pointSize={7}
            pointColor="#6366f1"
            pointBorderWidth={2}
            pointBorderColor="var(--card)"
            enableSlices="x"
            useMesh
            theme={NIVO_THEME}
            motionConfig="gentle"
          />
        </div>
      </ChartCard>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Highest Score",
            value: `${Math.max(...ENGAGEMENT_TREND_DATA.map((d) => d.companyWide))}%`,
            color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Lowest Score",
            value: `${Math.min(...ENGAGEMENT_TREND_DATA.map((d) => d.companyWide))}%`,
            color: "text-red-500 dark:text-red-400",
          },
          {
            label: "12-Month Avg",
            value: `${Math.round(ENGAGEMENT_TREND_DATA.reduce((s, d) => s + d.companyWide, 0) / ENGAGEMENT_TREND_DATA.length)}%`,
            color: "text-blue-600 dark:text-blue-400",
          },
        ].map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
