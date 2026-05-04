"use client";

import type { LucideIcon } from "lucide-react";
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

export interface LineSeries {
  key: string;
  color: string;
  showLabels?: boolean;
}

interface LineChartCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  data: Record<string, unknown>[];
  config: ChartConfig;
  series: LineSeries[];
  xAxisKey?: string;
  xTickFormatter?: (value: string) => string;
  footerTrend?: string;
  footerSub?: string;
  className?: string;
}

export function LineChartCard({
  title,
  description,
  icon: Icon,
  data,
  config,
  series,
  xAxisKey = "month",
  xTickFormatter,
  footerTrend,
  footerSub,
  className,
}: LineChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            )}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ChartContainer config={config} className="h-48 w-full">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{ top: 20, left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickFormatter={xTickFormatter ?? ((value) => value.slice(0, 3))}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                dataKey={s.key}
                type="natural"
                stroke={s.color}
                strokeWidth={2}
                dot={{ fill: s.color }}
                activeDot={{ r: 6 }}
              >
                {s.showLabels && (
                  <LabelList
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                  />
                )}
              </Line>
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
      {(footerTrend || footerSub) && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {footerTrend && (
            <div className="flex gap-2 leading-none font-medium">
              {footerTrend}
            </div>
          )}
          {footerSub && (
            <div className="leading-none text-muted-foreground">
              {footerSub}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
