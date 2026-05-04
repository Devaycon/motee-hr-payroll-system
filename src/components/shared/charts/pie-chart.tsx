"use client";

import * as React from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import { type PieSectorDataItem } from "recharts/types/polar/Pie";
import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/components/ui/chart";
import { Button } from "@/src/components/ui/button";

export interface PieChartItem {
  key: string;
  label: string;
  value: number;
  fill: string;
}

interface PieChartCardProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  data: PieChartItem[];
  config: ChartConfig;
  dataKey?: string;
  nameKey?: string;
  innerRadius?: number;
  className?: string;
  centerLabel?: string;
}

export function PieChartCard({
  id,
  title,
  icon: Icon,
  data,
  config,
  dataKey = "value",
  nameKey = "key",
  innerRadius = 52,
  className,
  centerLabel,
}: PieChartCardProps) {
  const [activeKey, setActiveKey] = React.useState(data[0]?.key ?? "");

  const activeIndex = React.useMemo(
    () => data.findIndex((d) => d.key === activeKey),
    [activeKey, data],
  );

  const total = React.useMemo(
    () => data.reduce((s, d) => s + d.value, 0),
    [data],
  );

  return (
    <Card data-chart={id} className={className}>
      <ChartStyle id={id} config={config} />
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
          id={id}
          config={config}
          className="mx-auto aspect-square w-full max-w-45"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              innerRadius={innerRadius}
              strokeWidth={4}
              activeIndex={activeIndex}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 8} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 18}
                    innerRadius={outerRadius + 10}
                  />
                </g>
              )}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {data[activeIndex]?.value ?? 0}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-[10px]"
                        >
                          {centerLabel ?? `of ${total}`}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="flex flex-col gap-3 mt-3">
          {data.map((item, idx) => (
            <button
              key={item.key}
              onClick={() => setActiveKey(item.key)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: item.fill }}
                />
                <span
                  className={`text-xs ${
                    activeIndex === idx
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>
              <span className="text-xs font-semibold text-foreground">
                {item.value}
                <span className="text-muted-foreground font-normal ml-1">
                  ({((item.value / total) * 100).toFixed(1)}%)
                </span>
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
