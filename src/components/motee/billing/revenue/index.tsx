"use client";

import { TrendingUp, DollarSign, ArrowUp, ArrowDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { AreaChart, BarChart, ColumnChart } from "@/src/components/shared/charts";
import {
  REVENUE_TREND_DATA,
  DEMO_TENANTS,
  DEMO_CHURN_RECORDS,
  CHURN_MONTHLY_DATA,
} from "@/src/data/motee-demo";
import { Badge } from "@/src/components/ui/badge";

const totalMrr = DEMO_TENANTS.filter((t) => t.status === "active").reduce(
  (acc, t) => acc + t.mrr,
  0,
);
const totalArr = totalMrr * 12;

const prevMonthMrr =
  REVENUE_TREND_DATA[REVENUE_TREND_DATA.length - 2]?.revenue ?? totalMrr;
const mrrGrowth = (((totalMrr - prevMonthMrr) / prevMonthMrr) * 100).toFixed(1);
const mrrGrowthUp = totalMrr >= prevMonthMrr;

const planRevenue = [
  {
    category: "enterprise",
    value: DEMO_TENANTS.filter(
      (t) => t.plan === "enterprise" && t.status === "active",
    ).reduce((a, t) => a + t.mrr, 0),
    fill: "#ff8b2d",
  },
  {
    category: "growth",
    value: DEMO_TENANTS.filter(
      (t) => t.plan === "growth" && t.status === "active",
    ).reduce((a, t) => a + t.mrr, 0),
    fill: "#4ED251",
  },
  {
    category: "starter",
    value: DEMO_TENANTS.filter(
      (t) => t.plan === "starter" && t.status === "active",
    ).reduce((a, t) => a + t.mrr, 0),
    fill: "#6366f1",
  },
];

const planRevenueConfig = {
  enterprise: { label: "Enterprise", color: "#ff8b2d" },
  growth: { label: "Growth", color: "#4ED251" },
  starter: { label: "Starter", color: "#6366f1" },
};

const monthlyBreakdown = REVENUE_TREND_DATA.map((item, i, arr) => {
  const prev = arr[i - 1]?.revenue ?? item.revenue;
  const change = item.revenue - prev;
  return { ...item, change, changeUp: change >= 0 };
}).reverse();

const statCards = [
  {
    label: "Current MRR",
    value: `$${totalMrr.toLocaleString()}`,
    sub: `${mrrGrowthUp ? "+" : ""}${mrrGrowth}% vs last month`,
    up: mrrGrowthUp,
    icon: TrendingUp,
    color: "text-[#ff8b2d]",
    bg: "bg-[#ff8b2d]/10",
  },
  {
    label: "Annual Recurring Revenue",
    value: `$${totalArr.toLocaleString()}`,
    sub: "Projected based on current MRR",
    up: true,
    icon: DollarSign,
    color: "text-[#4ED251]",
    bg: "bg-[#4ED251]/10",
  },
  {
    label: "Avg Revenue per Tenant",
    value: `$${Math.round(totalMrr / Math.max(1, DEMO_TENANTS.filter((t) => t.status === "active").length)).toLocaleString()}`,
    sub: "Per active subscription",
    up: true,
    icon: TrendingUp,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    label: "Highest Plan MRR",
    value: `$${planRevenue[0].value.toLocaleString()}`,
    sub: "Enterprise plan",
    up: true,
    icon: DollarSign,
    color: "text-[#ff8b2d]",
    bg: "bg-[#ff8b2d]/10",
  },
];

export function BillingRevenuePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Revenue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track MRR, ARR, and revenue breakdown across all plans and periods.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {card.value}
                  </p>
                  <div
                    className={`mt-0.5 flex items-center gap-1 text-xs ${card.up ? "text-[#4ED251]" : "text-red-500"}`}
                  >
                    {card.up ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {card.sub}
                  </div>
                </div>
                <div className={`rounded-lg p-2 ${card.bg} shrink-0`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AreaChart
            title="MRR Trend (12 months)"
            icon={TrendingUp}
            money
            categories={REVENUE_TREND_DATA.map((d) => d.month)}
            series={[
              {
                name: "Revenue",
                data: REVENUE_TREND_DATA.map((d) => d.revenue),
                color: "#ff8b2d",
              },
            ]}
          />
        </div>
        <ColumnChart
          title="Revenue by Plan"
          icon={DollarSign}
          money
          categories={planRevenue.map(
            (p) => planRevenueConfig[p.category as keyof typeof planRevenueConfig]?.label ?? p.category,
          )}
          series={[{ name: "MRR", data: planRevenue.map((p) => p.value) }]}
          colors={planRevenue.map((p) => p.fill)}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Monthly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    MRR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    ARR (Projected)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlyBreakdown.map((row, i) => (
                  <tr
                    key={row.month}
                    className={`hover:bg-muted/40 transition-colors ${i === 0 ? "bg-[#ff8b2d]/5" : ""}`}
                  >
                    <td className="px-6 py-3.5 text-sm font-medium text-foreground">
                      {row.month}
                      {i === 0 && (
                        <span className="ml-2 text-xs text-[#ff8b2d] font-normal">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-foreground">
                      ${row.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      {row.change === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={`flex items-center gap-1 text-xs font-medium ${row.changeUp ? "text-[#4ED251]" : "text-red-500"}`}
                        >
                          {row.changeUp ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                          {row.changeUp ? "+" : ""}$
                          {row.change.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">
                      ${(row.revenue * 12).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">
              Revenue Lost to Churn
            </p>
            <p className="mt-1 text-2xl font-bold text-red-500">
              $
              {DEMO_CHURN_RECORDS.reduce(
                (a, r) => a + r.mrr,
                0,
              ).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total MRR from churned tenants
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">
              Avg Monthly Churn Rate
            </p>
            <p className="mt-1 text-2xl font-bold text-red-400">
              {(
                CHURN_MONTHLY_DATA.reduce((a, d) => a + d.churnRate, 0) /
                CHURN_MONTHLY_DATA.length
              ).toFixed(1)}
              %
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Average over last 12 months
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Churned Tenants</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {DEMO_CHURN_RECORDS.length}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {CHURN_MONTHLY_DATA.reduce((a, d) => a + d.churned, 0)}{" "}
              cancellations total
            </p>
          </CardContent>
        </Card>
      </div>

      <BarChart
        title="Monthly Churn Rate (%)"
        icon={TrendingUp}
        categories={CHURN_MONTHLY_DATA.map((d) => d.month)}
        series={[{ name: "Churn Rate", data: CHURN_MONTHLY_DATA.map((d) => d.churnRate) }]}
        colors={CHURN_MONTHLY_DATA.map(() => "#ef4444")}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Churned Tenants
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  MRR Lost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Cancelled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {DEMO_CHURN_RECORDS.map((r, i) => (
                <tr key={i} className="hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-foreground">
                    {r.tenantName}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge variant="outline" className="text-xs capitalize">
                      {r.plan}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-red-500">
                    ${r.mrr.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground">
                    {r.cancelledDate}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground">
                    {r.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
