"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { MultiBarChart } from "@/src/components/shared/charts";
import {
  TURNOVER_RECORDS,
  TURNOVER_PERIODS,
  buildTurnoverTrends,
} from "../data";
import type { TurnoverPeriod, TurnoverRecord } from "../types";
import { TurnoverDetailModal } from "./detail-modals";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";

/** Total exits and rate are derived on screen — the export recomputes them. */
function exits(r: TurnoverRecord): number {
  return r.voluntary + r.involuntary;
}
function exitRate(r: TurnoverRecord): number {
  return r.totalHeadcount > 0
    ? Math.round((exits(r) / r.totalHeadcount) * 100 * 10) / 10
    : 0;
}

/** Mirrors the columns on screen, so an export reads the same as the table. */
const EXPORT_COLUMNS: ReportColumn<TurnoverRecord>[] = [
  { key: "department", header: "Department", value: (r) => r.department },
  { key: "totalHeadcount", header: "Headcount", value: (r) => r.totalHeadcount },
  { key: "voluntary", header: "Voluntary", value: (r) => r.voluntary },
  { key: "involuntary", header: "Involuntary", value: (r) => r.involuntary },
  { key: "totalExits", header: "Total Exits", value: exits },
  { key: "rate", header: "Rate %", value: exitRate },
];

export function TurnoverSection() {
  const [activePeriod, setActivePeriod] = useState<TurnoverPeriod>("Q1 2026");
  const [selectedRecord, setSelectedRecord] = useState<TurnoverRecord | null>(
    null,
  );

  const trends = buildTurnoverTrends(TURNOVER_RECORDS);
  const chartData = trends.map((t) => ({
    period: t.period,
    voluntary: t.voluntary,
    involuntary: t.involuntary,
    rate: t.rate,
  }));

  const deptRecords = TURNOVER_RECORDS.filter((r) => r.period === activePeriod);

  const currentTrend = trends.find((t) => t.period === activePeriod);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Voluntary Exits",
            value: currentTrend?.voluntary ?? 0,
            color: "text-amber-600 dark:text-amber-400",
          },
          {
            label: "Involuntary Exits",
            value: currentTrend?.involuntary ?? 0,
            color: "text-red-600 dark:text-red-400",
          },
          {
            label: "Turnover Rate",
            value: `${currentTrend?.rate ?? 0}%`,
            color:
              (currentTrend?.rate ?? 0) > 10
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400",
          },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{activePeriod}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <MultiBarChart
        title="Quarterly Turnover Trend"
        description="Voluntary vs involuntary exits across the last 5 quarters"
        categories={chartData.map((d) => d.period)}
        series={[
          {
            name: "Voluntary",
            data: chartData.map((d) => d.voluntary),
            color: "#ff8b2d",
          },
          {
            name: "Involuntary",
            data: chartData.map((d) => d.involuntary),
            color: "#f43f5e",
          },
        ]}
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-2xl font-semibold text-foreground">
            Department Breakdown
          </p>
          <Select
            value={activePeriod}
            onValueChange={(v) => setActivePeriod(v as TurnoverPeriod)}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TURNOVER_PERIODS.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportMenu
            name={`turnover-${activePeriod.toLowerCase().replace(/\s+/g, "-")}`}
            title={`Turnover — ${activePeriod}`}
            columns={EXPORT_COLUMNS}
            rows={deptRecords}
            variant="outline"
            buttonClassName="h-8 text-xs"
          />
        </div>
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Headcount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Voluntary
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Involuntary
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Total Exits
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Rate
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {deptRecords.map((r) => {
                    const total = r.voluntary + r.involuntary;
                    const rate =
                      r.totalHeadcount > 0
                        ? Math.round((total / r.totalHeadcount) * 100 * 10) / 10
                        : 0;
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">
                          {r.department}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {r.totalHeadcount}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-amber-600 dark:text-amber-400">
                            {r.voluntary}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {r.involuntary}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">{total}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              rate === 0
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : rate > 20
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {rate}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setSelectedRecord(r)}
                              >
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      <TurnoverDetailModal
        record={selectedRecord}
        open={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
