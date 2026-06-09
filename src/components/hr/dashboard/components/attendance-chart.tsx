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

  return (
    <AreaChart
      title="Attendance Overview"
      description="Daily present, late and absent counts"
      icon={BarChart2}
      className="col-span-3"
      height={300}
      viewMoreHref="/operations/reports/attendance"
      categories={filtered.map((d) => d.date)}
      series={[
        { name: "Present", data: filtered.map((d) => d.present), color: "#4ED251" },
        { name: "Late arrivals", data: filtered.map((d) => d.late), color: "#ff8b2d" },
        { name: "Absent", data: filtered.map((d) => d.absent), color: "#6366f1" },
      ]}
      details={[
        { label: "Avg present", value: avg("present"), color: "#4ED251" },
        { label: "Avg late", value: avg("late"), color: "#ff8b2d" },
        { label: "Avg absent", value: avg("absent"), color: "#6366f1" },
      ]}
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
