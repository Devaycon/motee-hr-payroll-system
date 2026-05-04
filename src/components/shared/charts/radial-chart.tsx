"use client";

import type { LucideIcon } from "lucide-react";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/components/ui/chart";
import { Button } from "@/src/components/ui/button";

export interface RadialSeries {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface RadialChartCardProps {
  title: string;
  icon?: LucideIcon;
  series: RadialSeries[];
  config: ChartConfig;
  centerLabel?: string;
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
}

export function RadialChartCard({
  title,
  icon: Icon,
  series,
  config,
  centerLabel = "Total",
  className,
  innerRadius = 70,
  outerRadius = 110,
}: RadialChartCardProps) {
  const total = series.reduce((s, d) => s + d.value, 0);
  const chartData = [Object.fromEntries(series.map((s) => [s.key, s.value]))];

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square w-full max-w-45"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 14}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 6}
                          className="fill-muted-foreground text-xs"
                        >
                          {centerLabel}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
            {series.map((s, i) => (
              <RadialBar
                key={s.key}
                dataKey={s.key}
                stackId="a"
                cornerRadius={i === 0 ? 5 : i === series.length - 1 ? 5 : 0}
                fill={s.color}
                className="stroke-transparent stroke-2"
              />
            ))}
          </RadialBarChart>
        </ChartContainer>

        <div className="flex flex-col gap-3 mt-1">
          {series.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: s.color }}
                />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <span className="text-xs font-semibold text-foreground">
                {s.value}
                <span className="text-muted-foreground font-normal ml-1">
                  ({((s.value / total) * 100).toFixed(1)}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
