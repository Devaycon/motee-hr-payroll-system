"use client";

import { useRouter } from "next/navigation";
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Building2,
  RotateCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { AreaChartCard } from "@/src/components/shared/charts/area-chart";
import { PieChartCard } from "@/src/components/shared/charts/pie-chart";
import {
  DEMO_INVOICES,
  DEMO_TENANTS,
  REVENUE_TREND_DATA,
  REVENUE_TREND_CONFIG,
} from "@/src/data/motee-demo";

const invoiceStatusStyles: Record<string, string> = {
  paid: "bg-[#4ED251]/10 text-[#4ED251]",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const planDistributionData = [
  {
    key: "enterprise",
    label: "Enterprise",
    value: DEMO_TENANTS.filter((t) => t.plan === "enterprise").length,
    fill: "#ff8b2d",
  },
  {
    key: "growth",
    label: "Growth",
    value: DEMO_TENANTS.filter((t) => t.plan === "growth").length,
    fill: "#4ED251",
  },
  {
    key: "starter",
    label: "Starter",
    value: DEMO_TENANTS.filter((t) => t.plan === "starter").length,
    fill: "#6366f1",
  },
];

const planDistributionConfig = {
  enterprise: { label: "Enterprise", color: "#ff8b2d" },
  growth: { label: "Growth", color: "#4ED251" },
  starter: { label: "Starter", color: "#6366f1" },
};

const currentMonth = new Date().toISOString().slice(0, 7);
const currentYear = new Date().getFullYear().toString();

const revenueThisMonth = DEMO_INVOICES.filter(
  (i) => i.status === "paid" && i.issuedDate.startsWith(currentMonth),
).reduce((a, b) => a + b.amount, 0);

const revenueThisYear = DEMO_INVOICES.filter(
  (i) => i.status === "paid" && i.issuedDate.startsWith(currentYear),
).reduce((a, b) => a + b.amount, 0);

const outstandingTotal = DEMO_INVOICES.filter(
  (i) => i.status === "pending" || i.status === "overdue",
).reduce((a, b) => a + b.amount, 0);

const failedPaymentsCount = DEMO_INVOICES.filter(
  (i) => i.status === "overdue",
).length;

const refundsThisMonth = 0;

const statCards = [
  {
    label: "Revenue This Month",
    value: `$${revenueThisMonth.toLocaleString()}`,
    sub: "Paid invoices this month",
    icon: TrendingUp,
    color: "text-[#ff8b2d]",
    bg: "bg-[#ff8b2d]/10",
    link: "/billing/revenue",
  },
  {
    label: "Revenue This Year",
    value: `$${revenueThisYear.toLocaleString()}`,
    sub: `Year-to-date ${currentYear}`,
    icon: DollarSign,
    color: "text-[#4ED251]",
    bg: "bg-[#4ED251]/10",
    link: "/billing/revenue",
  },
  {
    label: "Outstanding Invoices",
    value: `$${outstandingTotal.toLocaleString()}`,
    sub: "Pending + overdue total",
    icon: CreditCard,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    link: "/billing/invoices",
  },
  {
    label: "Failed Payments",
    value: failedPaymentsCount,
    sub: "Overdue invoices",
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    link: "/billing/invoices",
  },
  {
    label: "Refunds Issued",
    value: refundsThisMonth,
    sub: "This month",
    icon: RotateCcw,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    link: "/billing/invoices",
  },
];

const recentInvoices = [...DEMO_INVOICES]
  .sort((a, b) => b.issuedDate.localeCompare(a.issuedDate))
  .slice(0, 6);

export function BillingOverviewPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Billing Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor revenue, subscriptions, and payment activity across all
            tenants.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/billing/invoices")}
          className="gap-2 shrink-0"
        >
          View All Invoices
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {statCards.map((card) => (
          <Card
            key={card.label}
            onClick={() => router.push(card.link)}
            className="cursor-pointer hover:border-[#ff8b2d]/40 transition-colors"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {card.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {card.sub}
                  </p>
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
          <AreaChartCard
            title="MRR Trend (12 months)"
            icon={TrendingUp}
            data={REVENUE_TREND_DATA}
            config={REVENUE_TREND_CONFIG}
            series={[{ key: "revenue", color: "#ff8b2d" }]}
            xAxisKey="month"
          />
        </div>

        <PieChartCard
          id="billing-plan-distribution"
          title="Tenants by Plan"
          icon={Building2}
          data={planDistributionData}
          config={planDistributionConfig}
        />
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Recent Invoices
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/billing/invoices")}
            className="gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            See all
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-4 px-6 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {invoice.tenantName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.id.toUpperCase()} · Issued {invoice.issuedDate} ·
                    Due {invoice.dueDate}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    ${invoice.amount.toLocaleString()}
                  </p>
                  <Badge
                    className={`capitalize text-xs font-medium border-0 ${invoiceStatusStyles[invoice.status]}`}
                  >
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
