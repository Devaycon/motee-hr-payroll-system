"use client";

import { useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { LineChart } from "@/src/components/shared/charts";
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

const ALL_LINES: {
  key: DeptKey | "companyWide";
  label: string;
  color: string;
}[] = [
  { key: "companyWide", label: "Company Wide", color: "#4ED251" },
  { key: "engineering", label: "Engineering", color: "#6366f1" },
  { key: "marketing", label: "Marketing", color: "#ff8b2d" },
  { key: "sales", label: "Sales", color: "#3b82f6" },
  { key: "hr", label: "HR", color: "#a855f7" },
  { key: "operations", label: "Operations", color: "#14b8a6" },
];

export function EngagementTrend() {
  const [dept, setDept] = useState<DeptKey | "all">("all");

  const latestScore = ENGAGEMENT_TREND_DATA[ENGAGEMENT_TREND_DATA.length - 1];
  const prevScore = ENGAGEMENT_TREND_DATA[ENGAGEMENT_TREND_DATA.length - 2];

  const currentScore =
    dept === "all" ? latestScore.companyWide : latestScore[dept];
  const prevScoreVal = dept === "all" ? prevScore.companyWide : prevScore[dept];
  const diff = currentScore - prevScoreVal;

  const visibleLines =
    dept === "all"
      ? ALL_LINES
      : ALL_LINES.filter((l) => l.key === "companyWide" || l.key === dept);

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

      <LineChart
        title="Engagement Score Trend"
        description="Monthly engagement score over the last 12 months"
        categories={ENGAGEMENT_TREND_DATA.map((d) => d.month)}
        series={visibleLines.map((l) => ({
          name: l.label,
          data: ENGAGEMENT_TREND_DATA.map(
            (d) => (d as unknown as Record<string, number>)[l.key],
          ),
          color: l.color,
        }))}
      />

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
