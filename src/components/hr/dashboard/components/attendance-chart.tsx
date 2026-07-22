"use client";

import { useState, useMemo } from "react";
import { BarChart2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { AreaChart } from "@/src/components/shared/charts";
import { useAttendanceSeries } from "../hooks";

export function AttendanceChart() {
  const { data, loading } = useAttendanceSeries();
  const [dateRange, setDateRange] = useState("30d");

  const filtered = useMemo(() => {
    if (!data) return [];
    if (dateRange === "7d") return data.slice(-7);
    if (dateRange === "14d") return data.slice(-14);
    return data;
  }, [data, dateRange]);

  if (loading || !data) {
    return <Skeleton className="col-span-3 h-80 w-full rounded-xl" />;
  }

  const n = filtered.length || 1;
  const avg = (key: "present" | "late" | "absent") =>
    Math.round(filtered.reduce((s, d) => s + d[key], 0) / n);

  const averages = [
    { label: "Present", value: avg("present"), color: "#4ED251" },
    { label: "Late", value: avg("late"), color: "#ff8b2d" },
    { label: "Absent", value: avg("absent"), color: "#6366f1" },
  ];

  return (
    <AreaChart
      title="Attendance Trends"
      description="Daily present, late and absent counts"
      icon={BarChart2}
      className="col-span-3"
      height={300}
      viewMoreHref="/operations/reports/attendance"
      // Thin a crowded date axis to roughly every 3rd label.
      tickAmount={filtered.length > 14 ? Math.ceil(filtered.length / 3) : undefined}
      categories={filtered.map((d) => d.date)}
      series={[
        { name: "Present", data: filtered.map((d) => d.present), color: "#4ED251" },
        { name: "Late arrivals", data: filtered.map((d) => d.late), color: "#ff8b2d" },
        { name: "Absent", data: filtered.map((d) => d.absent), color: "#6366f1" },
      ]}
      legend={
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="mb-2.5 text-xs font-semibold text-foreground">
            Average Attendance
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {averages.map((a) => (
              <span
                key={a.label}
                className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5 text-xs"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: a.color }}
                />
                <span className="text-muted-foreground">{a.label}</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {a.value}
                </span>
              </span>
            ))}
          </div>
        </div>
      }
      action={
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="h-7 w-36 rounded-md text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="14d">Last 14 days</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      }
    />
  );
}
