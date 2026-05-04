"use client";

import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

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

export interface BarChartItem {
  category: string;
  value: number;
  fill: string;
}

interface BarChartCardProps {
  title: string;
  icon?: LucideIcon;
  data: BarChartItem[];
  config: ChartConfig;
  className?: string;
  layout?: "vertical" | "horizontal";
}

export function BarChartCard({
  title,
  icon: Icon,
  data,
  config,
  className,
  layout = "vertical",
}: BarChartCardProps) {
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
        <ChartContainer config={config} className="h-48 w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout={layout}
            margin={{ left: 0, right: 4 }}
          >
            {layout === "vertical" ? (
              <>
                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  tickMargin={8}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickFormatter={(value) =>
                    config[value as keyof typeof config]?.label?.toString() ??
                    value
                  }
                  width={80}
                />
                <XAxis dataKey="value" type="number" hide />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickFormatter={(value) =>
                    config[value as keyof typeof config]?.label?.toString() ??
                    value
                  }
                />
                <YAxis hide />
              </>
            )}
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" layout={layout} radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
