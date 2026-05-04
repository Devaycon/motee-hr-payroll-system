"use client";

import { useState, useMemo } from "react";
import { BarChart2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/src/components/ui/chart";
import { ATTENDANCE_DATA, ATTENDANCE_CONFIG } from "@/src/data/dashboard-demo";

export function AttendanceChart() {
  const [dateRange, setDateRange] = useState("30d");

  const filteredAttendance = useMemo(() => {
    if (dateRange === "7d") return ATTENDANCE_DATA.slice(-7);
    if (dateRange === "14d") return ATTENDANCE_DATA.slice(-14);
    return ATTENDANCE_DATA;
  }, [dateRange]);

  const avgPresent = useMemo(() => {
    const sum = filteredAttendance.reduce((acc, d) => acc + d.present, 0);
    return (sum / filteredAttendance.length).toFixed(2);
  }, [filteredAttendance]);

  const avgLate = useMemo(() => {
    const sum = filteredAttendance.reduce((acc, d) => acc + d.late, 0);
    return (sum / filteredAttendance.length).toFixed(2);
  }, [filteredAttendance]);

  const avgAbsent = useMemo(() => {
    const sum = filteredAttendance.reduce((acc, d) => acc + d.absent, 0);
    return (sum / filteredAttendance.length).toFixed(2);
  }, [filteredAttendance]);

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">
            Attendance Overview
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-7 text-xs w-38 rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">01 Oct - 30 Oct</SelectItem>
              <SelectItem value="14d">17 Oct - 30 Oct</SelectItem>
              <SelectItem value="7d">24 Oct - 30 Oct</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-0.5 rounded-full"
              style={{ background: "#4ED251" }}
            />
            <span className="text-xs text-muted-foreground">Present</span>
            <span className="text-xs font-semibold text-foreground ml-1">
              {avgPresent}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-0.5 rounded-full"
              style={{ background: "#ff8b2d" }}
            />
            <span className="text-xs text-muted-foreground">Late arrivals</span>
            <span className="text-xs font-semibold text-foreground ml-1">
              {avgLate}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Absent</span>
            <span className="text-xs font-semibold text-foreground ml-1">
              {avgAbsent}%
            </span>
          </div>
        </div>
        <ChartContainer config={ATTENDANCE_CONFIG} className="h-50 w-full">
          <AreaChart
            data={filteredAttendance}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-present)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-present)"
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-late)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-late)"
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-absent)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-absent)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="var(--border)"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              domain={[0, 100]}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="present"
              type="monotone"
              fill="url(#gradPresent)"
              stroke="var(--color-present)"
              strokeWidth={2}
            />
            <Area
              dataKey="late"
              type="monotone"
              fill="url(#gradLate)"
              stroke="var(--color-late)"
              strokeWidth={2}
            />
            <Area
              dataKey="absent"
              type="monotone"
              fill="url(#gradAbsent)"
              stroke="var(--color-absent)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
