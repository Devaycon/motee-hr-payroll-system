"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Plus,
  Users,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { DEMO_TENANTS } from "@/src/data/motee-demo";
import type { TenantPlan, TenantStatus } from "@/src/lib/types/motee.types";

const planStyles: Record<TenantPlan, string> = {
  starter: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  growth: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  enterprise: "bg-[#ff8b2d]/10 text-[#ff8b2d]",
};

const statusStyles: Record<TenantStatus, string> = {
  active: "bg-[#4ED251]/10 text-[#4ED251]",
  trial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  suspended: "bg-red-500/10 text-red-600 dark:text-red-400",
};

type StatusFilter = "all" | TenantStatus;
type PlanFilter = "all" | TenantPlan;

export function AllTenantsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");

  const filtered = useMemo(() => {
    return DEMO_TENANTS.filter((t) => {
      const matchSearch =
        search === "" ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.billingEmail.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchPlan = planFilter === "all" || t.plan === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [search, statusFilter, planFilter]);

  const statusCounts = useMemo(() => {
    return {
      all: DEMO_TENANTS.length,
      active: DEMO_TENANTS.filter((t) => t.status === "active").length,
      trial: DEMO_TENANTS.filter((t) => t.status === "trial").length,
      suspended: DEMO_TENANTS.filter((t) => t.status === "suspended").length,
    };
  }, []);

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: `All (${statusCounts.all})` },
    { key: "active", label: `Active (${statusCounts.active})` },
    { key: "trial", label: `Trial (${statusCounts.trial})` },
    { key: "suspended", label: `Suspended (${statusCounts.suspended})` },
  ];

  const planTabs: { key: PlanFilter; label: string }[] = [
    { key: "all", label: "All Plans" },
    { key: "starter", label: "Starter" },
    { key: "growth", label: "Growth" },
    { key: "enterprise", label: "Enterprise" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Tenants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {DEMO_TENANTS.length} tenants registered on the platform
          </p>
        </div>
        <Button
          onClick={() => router.push("/tenants/onboard")}
          className="shrink-0 bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Onboard Tenant
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {planTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPlanFilter(tab.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                planFilter === tab.key
                  ? "bg-[#ff8b2d] text-white border-[#ff8b2d]"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-base font-medium text-muted-foreground">
            No tenants found
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tenant) => (
            <Card
              key={tenant.id}
              onClick={() => router.push(`/tenants/${tenant.id}`)}
              className="cursor-pointer hover:border-[#ff8b2d]/50 transition-colors group"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-[#ff8b2d]/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-[#ff8b2d]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tenant.billingEmail}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-[#ff8b2d] transition-colors" />
                </div>

                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <Badge
                    className={`capitalize text-xs font-medium border-0 ${statusStyles[tenant.status]}`}
                  >
                    {tenant.status}
                  </Badge>
                  <Badge
                    className={`capitalize text-xs font-medium border-0 ${planStyles[tenant.plan]}`}
                  >
                    {tenant.plan}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {tenant.employeeCount.toLocaleString()} employees
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      ${tenant.mrr.toLocaleString()}/mo
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Registered{" "}
                    {new Date(tenant.createdAt).toLocaleDateString("en-GB", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
