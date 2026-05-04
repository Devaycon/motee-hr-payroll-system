"use client";

import { Users } from "lucide-react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

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
} from "@/src/components/ui/chart";
import {
  SALARY_DIST_DATA,
  SALARY_DIST_CONFIG,
} from "@/src/data/dashboard-demo";

export function SalaryDistributionCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">Dept. Headcount</CardTitle>
        </div>
        <CardDescription>Current employee distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={SALARY_DIST_CONFIG}>
          <BarChart
            accessibilityLayer
            data={SALARY_DIST_DATA}
            layout="vertical"
            margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
          >
            <XAxis type="number" dataKey="value" hide />
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              width={120}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(value) =>
                SALARY_DIST_CONFIG[
                  value as keyof typeof SALARY_DIST_CONFIG
                ]?.label?.toString() ?? value
              }
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" radius={5}>
              {SALARY_DIST_DATA.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={String(
                    SALARY_DIST_CONFIG[entry.category]?.color ?? "#4ED251",
                  )}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing headcount across all departments
        </div>
      </CardFooter>
    </Card>
  );
}
