import { currentCurrencySymbol } from "@/src/lib/hooks/use-currency";
import { useState } from "react";
import {
  Clock,
  DollarSign,
  Briefcase,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { HIRING_METRICS } from "../data";
import type { HiringMetric } from "../types";
import { HiringDetailModal } from "./detail-modals";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";

/** Mirrors the columns on screen, so an export reads the same as the table. */
const EXPORT_COLUMNS: ReportColumn<HiringMetric>[] = [
  { key: "department", header: "Department", value: (m) => m.department },
  {
    key: "openRequisitions",
    header: "Open Reqs",
    value: (m) => m.openRequisitions,
  },
  {
    key: "avgDaysToFill",
    header: "Avg Days to Fill",
    value: (m) => m.avgDaysToFill,
  },
  {
    key: "costPerHire",
    header: "Cost per Hire",
    value: (m) => m.costPerHire ?? 0,
    money: true,
  },
  {
    key: "filledThisQuarter",
    header: "Filled (Q)",
    value: (m) => m.filledThisQuarter ?? 0,
  },
];

export function HiringSection() {
  const [selectedMetric, setSelectedMetric] = useState<HiringMetric | null>(
    null,
  );
  const totalOpen = HIRING_METRICS.reduce((s, m) => s + m.openRequisitions, 0);
  const totalFilled = HIRING_METRICS.reduce(
    (s, m) => s + (m.filledThisQuarter ?? 0),
    0,
  );
  const avgDays =
    HIRING_METRICS.length > 0
      ? Math.round(
          HIRING_METRICS.reduce((s, m) => s + m.avgDaysToFill, 0) /
            HIRING_METRICS.length,
        )
      : 0;
  const avgCost =
    HIRING_METRICS.length > 0
      ? Math.round(
          HIRING_METRICS.reduce((s, m) => s + (m.costPerHire ?? 0), 0) /
            HIRING_METRICS.length,
        )
      : 0;

  const maxDays = Math.max(...HIRING_METRICS.map((m) => m.avgDaysToFill), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Open Requisitions",
            value: totalOpen,
            icon: Briefcase,
            iconClass: "text-blue-500 dark:text-blue-400",
            iconBg: "bg-blue-500/10",
          },
          {
            label: "Filled This Quarter",
            value: totalFilled,
            icon: CheckCircle2,
            iconClass: "text-emerald-500 dark:text-emerald-400",
            iconBg: "bg-emerald-500/10",
          },
          {
            label: "Avg Days to Fill",
            value: `${avgDays}d`,
            icon: Clock,
            iconClass: "text-amber-500 dark:text-amber-400",
            iconBg: "bg-amber-500/10",
          },
          {
            label: "Avg Cost per Hire",
            value: `${currentCurrencySymbol()}${(avgCost / 1000).toFixed(0)}k`,
            icon: DollarSign,
            iconClass: "text-violet-500 dark:text-violet-400",
            iconBg: "bg-violet-500/10",
          },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${s.iconBg}`}>
                  <s.icon className={`size-5 ${s.iconClass}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <ExportMenu
          name="hiring-velocity"
          title="Hiring Velocity"
          columns={EXPORT_COLUMNS}
          rows={HIRING_METRICS}
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
                    Open Reqs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground min-w-44">
                    Avg Days to Fill
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Cost per Hire
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Filled (Q)
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {HIRING_METRICS.map((metric) => (
                  <tr
                    key={metric.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {metric.department}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          metric.openRequisitions > 2
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-foreground"
                        }`}
                      >
                        {metric.openRequisitions}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(metric.avgDaysToFill / maxDays) * 100}
                          className="h-1.5 flex-1"
                        />
                        <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                          {metric.avgDaysToFill}d
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {currentCurrencySymbol()}
                      {((metric.costPerHire ?? 0) / 1000).toFixed(0)}k
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          metric.filledThisQuarter != null &&
                          metric.filledThisQuarter > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {metric.filledThisQuarter ?? 0}
                      </span>
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
                            onClick={() => setSelectedMetric(metric)}
                          >
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Cost per hire includes job board spend, recruiter time, and onboarding
        overhead. Days to fill measured from requisition open to offer accepted.
      </p>
      <HiringDetailModal
        metric={selectedMetric}
        open={selectedMetric !== null}
        onClose={() => setSelectedMetric(null)}
      />
    </div>
  );
}
