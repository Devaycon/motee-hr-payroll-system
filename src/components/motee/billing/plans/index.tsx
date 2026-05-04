"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Users,
  TrendingUp,
  ArrowRight,
  Zap,
  Building2,
  Rocket,
  Plus,
  Tag,
  Percent,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  DEMO_TENANTS,
  DEMO_DISCOUNTS,
  DEMO_TAX_RATES,
} from "@/src/data/motee-demo";

const plans = [
  {
    key: "starter" as const,
    name: "Starter",
    price: 299,
    icon: Zap,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-200 dark:border-indigo-900",
    highlight: false,
    description: "For small teams getting started with HR management.",
    features: [
      "Up to 100 employees",
      "Core HR & onboarding",
      "Leave & attendance",
      "Basic payroll processing",
      "Email support",
      "1 admin user",
    ],
    limits: {
      employees: 100,
      admins: 1,
      storage: "5 GB",
    },
  },
  {
    key: "growth" as const,
    name: "Growth",
    price: 999,
    icon: Rocket,
    color: "text-[#4ED251]",
    bg: "bg-[#4ED251]/10",
    border: "border-[#4ED251]/30",
    highlight: true,
    description: "For scaling companies that need advanced HR workflows.",
    features: [
      "Up to 500 employees",
      "Advanced payroll & tax",
      "Performance management",
      "Recruitment & onboarding",
      "Custom workflows",
      "Priority support",
      "5 admin users",
    ],
    limits: {
      employees: 500,
      admins: 5,
      storage: "25 GB",
    },
  },
  {
    key: "enterprise" as const,
    name: "Enterprise",
    price: 2499,
    icon: Building2,
    color: "text-[#ff8b2d]",
    bg: "bg-[#ff8b2d]/10",
    border: "border-[#ff8b2d]/30",
    highlight: false,
    description: "For large enterprises with complex, multi-entity needs.",
    features: [
      "Unlimited employees",
      "Multi-entity payroll",
      "Advanced analytics & BI",
      "SSO & custom integrations",
      "Dedicated account manager",
      "SLA-backed uptime (99.9%)",
      "Unlimited admin users",
      "Custom contract & pricing",
    ],
    limits: {
      employees: "Unlimited",
      admins: "Unlimited",
      storage: "Unlimited",
    },
  },
];

export function BillingPlansPage() {
  const router = useRouter();

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    code: "",
    type: "percentage",
    value: "",
    maxUses: "",
    expiryDate: "",
    restrictedPlan: "",
  });
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [newTax, setNewTax] = useState({
    country: "",
    rate: "",
    description: "",
  });

  const planStats = plans.map((plan) => {
    const tenants = DEMO_TENANTS.filter((t) => t.plan === plan.key);
    const activeTenants = tenants.filter((t) => t.status === "active");
    const mrr = activeTenants.reduce((a, t) => a + t.mrr, 0);
    return {
      ...plan,
      tenantCount: tenants.length,
      activeTenantCount: activeTenants.length,
      mrr,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View plan configuration, pricing, and tenant distribution across all
          tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {planStats.map((plan) => (
          <Card
            key={plan.key}
            className={`relative border-2 transition-colors ${plan.highlight ? plan.border : "border-border"}`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#4ED251] text-white border-0 text-xs px-3">
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`rounded-lg p-2 ${plan.bg}`}>
                    <plan.icon className={`h-5 w-5 ${plan.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">
                      {plan.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-foreground">
                  ${plan.price.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Tenants</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {plan.tenantCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {plan.activeTenantCount} active
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">MRR</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    ${plan.mrr.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className={`h-3.5 w-3.5 shrink-0 ${plan.color}`} />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Employees</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    {plan.limits.employees}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Admins</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    {plan.limits.admins}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Storage</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    {plan.limits.storage}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/tenants?plan=${plan.key}`)}
                className={`w-full gap-2 ${plan.highlight ? `border-[#4ED251]/40 text-[#4ED251] hover:bg-[#4ED251]/10` : ""}`}
              >
                View {plan.tenantCount} tenant
                {plan.tenantCount !== 1 ? "s" : ""}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Plan Revenue Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Price/mo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Active Tenants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  MRR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  ARR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {planStats.map((plan) => (
                <tr
                  key={plan.key}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${plan.bg} ring-1 ring-current ${plan.color}`}
                      />
                      <span className="text-sm font-medium text-foreground capitalize">
                        {plan.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground">
                    ${plan.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-foreground">
                    {plan.activeTenantCount}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-foreground">
                    ${plan.mrr.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-foreground">
                    ${(plan.mrr * 12).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/20">
                <td className="px-6 py-3.5 text-sm font-bold text-foreground">
                  Total
                </td>
                <td className="px-6 py-3.5" />
                <td className="px-6 py-3.5 text-sm font-bold text-foreground">
                  {planStats.reduce((a, p) => a + p.activeTenantCount, 0)}
                </td>
                <td className="px-6 py-3.5 text-sm font-bold text-[#ff8b2d]">
                  ${planStats.reduce((a, p) => a + p.mrr, 0).toLocaleString()}
                </td>
                <td className="px-6 py-3.5 text-sm font-bold text-[#ff8b2d]">
                  $
                  {(
                    planStats.reduce((a, p) => a + p.mrr, 0) * 12
                  ).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4 text-[#ff8b2d]" />
              Discount Codes
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowDiscountModal(true)}
              className="gap-1.5 bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Discount
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Uses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Restricted To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {DEMO_DISCOUNTS.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-sm font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                        {d.code}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant="outline" className="text-xs capitalize">
                        {d.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-foreground">
                      {d.type === "percentage" ? `${d.value}%` : `$${d.value}`}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-[#ff8b2d] rounded-full"
                            style={{
                              width: `${Math.min(100, (d.usedCount / d.maxUses) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {d.usedCount}/{d.maxUses}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">
                      {d.expiryDate}
                    </td>
                    <td className="px-6 py-3.5">
                      {d.restrictedPlan ? (
                        <Badge variant="outline" className="text-xs capitalize">
                          {d.restrictedPlan}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          All plans
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        className={`text-xs border-0 capitalize ${d.status === "active" ? "bg-[#4ED251]/10 text-[#4ED251]" : "bg-muted text-muted-foreground"}`}
                      >
                        {d.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Percent className="h-4 w-4 text-[#ff8b2d]" />
              Tax Rates
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowTaxModal(true)}
              className="gap-1.5 bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Tax Rate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {DEMO_TAX_RATES.map((t) => (
                <tr key={t.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-foreground">
                    {t.country}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-foreground">
                    {t.rate}%
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground">
                    {t.description}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge
                      className={`text-xs border-0 ${t.active ? "bg-[#4ED251]/10 text-[#4ED251]" : "bg-muted text-muted-foreground"}`}
                    >
                      {t.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-[#ff8b2d]" />
              Create Discount Code
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Code <span className="text-red-500">*</span>
              </p>
              <Input
                placeholder="e.g. SUMMER30"
                value={newDiscount.code}
                onChange={(e) =>
                  setNewDiscount((p) => ({ ...p, code: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">Type</p>
                <select
                  value={newDiscount.type}
                  onChange={(e) =>
                    setNewDiscount((p) => ({ ...p, type: e.target.value }))
                  }
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff8b2d]"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed ($)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">
                  Value <span className="text-red-500">*</span>
                </p>
                <Input
                  type="number"
                  placeholder={
                    newDiscount.type === "percentage" ? "e.g. 20" : "e.g. 100"
                  }
                  value={newDiscount.value}
                  onChange={(e) =>
                    setNewDiscount((p) => ({ ...p, value: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">Max Uses</p>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  value={newDiscount.maxUses}
                  onChange={(e) =>
                    setNewDiscount((p) => ({ ...p, maxUses: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">
                  Expiry Date
                </p>
                <Input
                  type="date"
                  value={newDiscount.expiryDate}
                  onChange={(e) =>
                    setNewDiscount((p) => ({
                      ...p,
                      expiryDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Restrict to Plan
              </p>
              <select
                value={newDiscount.restrictedPlan}
                onChange={(e) =>
                  setNewDiscount((p) => ({
                    ...p,
                    restrictedPlan: e.target.value,
                  }))
                }
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff8b2d]"
              >
                <option value="">All Plans</option>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDiscountModal(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!newDiscount.code.trim() || !newDiscount.value}
              onClick={() => setShowDiscountModal(false)}
              className="bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white"
            >
              Create Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTaxModal} onOpenChange={setShowTaxModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-[#ff8b2d]" />
              Add Tax Rate
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Country <span className="text-red-500">*</span>
              </p>
              <Input
                placeholder="e.g. Canada"
                value={newTax.country}
                onChange={(e) =>
                  setNewTax((p) => ({ ...p, country: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Rate (%) <span className="text-red-500">*</span>
              </p>
              <Input
                type="number"
                placeholder="e.g. 5"
                value={newTax.rate}
                onChange={(e) =>
                  setNewTax((p) => ({ ...p, rate: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">Description</p>
              <Input
                placeholder="e.g. Goods and Services Tax (GST)"
                value={newTax.description}
                onChange={(e) =>
                  setNewTax((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTaxModal(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newTax.country.trim() || !newTax.rate}
              onClick={() => setShowTaxModal(false)}
              className="bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white"
            >
              Add Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
