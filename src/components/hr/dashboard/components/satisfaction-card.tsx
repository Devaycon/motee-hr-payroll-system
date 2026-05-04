"use client";

import * as React from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import { type PieSectorDataItem } from "recharts/types/polar/Pie";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/src/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { EMPLOYMENT_TYPE_DATA, EMPLOYMENT_TYPE_CONFIG } from "@/src/data/dashboard-demo";

const CHART_ID = "employment-type-pie";

export function SatisfactionCard() {
  const [activeKey, setActiveKey] = React.useState(EMPLOYMENT_TYPE_DATA[0].key);

  const activeIndex = React.useMemo(
    () => EMPLOYMENT_TYPE_DATA.findIndex((item) => item.key === activeKey),
    [activeKey],
  );

  const total = React.useMemo(
    () => EMPLOYMENT_TYPE_DATA.reduce((s, d) => s + d.value, 0),
    [],
  );

  return (
    <Card data-chart={CHART_ID} className="flex flex-col col-span-2">
      <ChartStyle id={CHART_ID} config={EMPLOYMENT_TYPE_CONFIG} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Employment Type</CardTitle>
          <CardDescription>Total {total} employees</CardDescription>
        </div>
        <Select value={activeKey} onValueChange={setActiveKey}>
          <SelectTrigger
            className="ml-auto h-7 w-32.5 rounded-lg pl-2.5"
            aria-label="Select employment type"
          >
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {EMPLOYMENT_TYPE_DATA.map((item) => {
              const config =
                EMPLOYMENT_TYPE_CONFIG[
                  item.key as keyof typeof EMPLOYMENT_TYPE_CONFIG
                ];

              if (!config) {
                return null;
              }

              return (
                <SelectItem
                  key={item.key}
                  value={item.key}
                  className="rounded-lg [&_span]:flex"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-xs"
                      style={{
                        backgroundColor: item.fill,
                      }}
                    />
                    {config?.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id={CHART_ID}
          config={EMPLOYMENT_TYPE_CONFIG}
          className="mx-auto aspect-square w-full max-w-75"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={EMPLOYMENT_TYPE_DATA}
              dataKey="value"
              nameKey="key"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 25}
                    innerRadius={outerRadius + 12}
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
                          className="fill-foreground text-3xl font-bold"
                        >
                          {EMPLOYMENT_TYPE_DATA[
                            activeIndex
                          ].value.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {EMPLOYMENT_TYPE_DATA[activeIndex].label}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
