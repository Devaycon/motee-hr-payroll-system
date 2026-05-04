"use client";

import { useState, useMemo } from "react";
import { Boxes, Search, Users, ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { DEMO_MODULES, DEMO_TENANTS } from "@/src/data/motee-demo";
import type { PlatformModule } from "@/src/data/motee-demo";

const planBadgeStyles: Record<string, string> = {
  starter: "bg-indigo-500/10 text-indigo-500",
  growth: "bg-[#4ED251]/10 text-[#4ED251]",
  enterprise: "bg-[#ff8b2d]/10 text-[#ff8b2d]",
};

const categoryColors: Record<string, string> = {
  Core: "bg-blue-500/10 text-blue-500",
  Finance: "bg-[#4ED251]/10 text-[#4ED251]",
  Growth: "bg-violet-500/10 text-violet-500",
  Talent: "bg-pink-500/10 text-pink-500",
  Operations: "bg-amber-500/10 text-amber-500",
  Reports: "bg-[#ff8b2d]/10 text-[#ff8b2d]",
  Engagement: "bg-teal-500/10 text-teal-500",
  Support: "bg-slate-500/10 text-slate-500",
};

const totalTenants = DEMO_TENANTS.filter((t) => t.status === "active").length;

export function ModulesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<PlatformModule | null>(
    null,
  );
  const [overrideTenant, setOverrideTenant] = useState("");
  const [overrideAction, setOverrideAction] = useState<"enable" | "disable">(
    "enable",
  );

  const categories = useMemo(() => {
    const cats = Array.from(new Set(DEMO_MODULES.map((m) => m.category)));
    return cats.sort();
  }, []);

  const filtered = useMemo(() => {
    return DEMO_MODULES.filter((m) => {
      const matchSearch =
        search === "" ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        categoryFilter === "all" || m.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [search, categoryFilter]);

  const adoptionRate = (m: PlatformModule) =>
    Math.round((m.activeTenantsCount / totalTenants) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Modules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View module availability by plan and manage per-tenant module
            overrides.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Total Modules",
            value: DEMO_MODULES.length,
            color: "text-foreground",
          },
          {
            label: "Core Modules",
            value: DEMO_MODULES.filter((m) => m.plans.includes("starter"))
              .length,
            color: "text-blue-500",
          },
          {
            label: "Growth+ Modules",
            value: DEMO_MODULES.filter((m) => !m.plans.includes("starter"))
              .length,
            color: "text-violet-500",
          },
          {
            label: "Enterprise Only",
            value: DEMO_MODULES.filter(
              (m) => m.plans.length === 1 && m.plans[0] === "enterprise",
            ).length,
            color: "text-[#ff8b2d]",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["all", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${categoryFilter === cat ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              {cat === "all" ? `All (${DEMO_MODULES.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Plans
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Adoption
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Active Tenants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((mod) => {
                  const rate = adoptionRate(mod);
                  const isExpanded = expandedModule === mod.id;
                  return (
                    <>
                      <tr
                        key={mod.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-foreground">
                              {mod.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {mod.description}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge
                            className={`text-xs border-0 ${categoryColors[mod.category] ?? "bg-muted text-muted-foreground"}`}
                          >
                            {mod.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex gap-1 flex-wrap">
                            {mod.plans.map((p) => (
                              <Badge
                                key={p}
                                className={`text-xs border-0 capitalize ${planBadgeStyles[p]}`}
                              >
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-[#ff8b2d] rounded-full"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {rate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-foreground font-medium">
                          {mod.activeTenantsCount}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => {
                                setSelectedModule(mod);
                                setShowOverrideModal(true);
                              }}
                            >
                              <Users className="h-3 w-3" />
                              Override
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                setExpandedModule(isExpanded ? null : mod.id)
                              }
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${mod.id}-expanded`} className="bg-muted/20">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="flex flex-col gap-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Tenants using this module
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {DEMO_TENANTS.filter(
                                  (t) => t.status === "active",
                                )
                                  .slice(0, mod.activeTenantsCount)
                                  .map((t) => (
                                    <Badge
                                      key={t.id}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {t.name}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showOverrideModal} onOpenChange={setShowOverrideModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-[#ff8b2d]" />
              Module Override — {selectedModule?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Enable or disable{" "}
              <span className="font-semibold text-foreground">
                {selectedModule?.name}
              </span>{" "}
              for a specific tenant, regardless of their plan.
            </p>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Tenant <span className="text-red-500">*</span>
              </p>
              <select
                value={overrideTenant}
                onChange={(e) => setOverrideTenant(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff8b2d]"
              >
                <option value="">Select tenant</option>
                {DEMO_TENANTS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">Action</p>
              <div className="flex gap-2">
                {(["enable", "disable"] as const).map((action) => (
                  <button
                    key={action}
                    onClick={() => setOverrideAction(action)}
                    className={`flex-1 rounded-md border py-2 text-sm font-medium capitalize transition-colors ${overrideAction === action ? "border-[#ff8b2d] bg-[#ff8b2d]/10 text-[#ff8b2d]" : "border-border text-muted-foreground hover:border-foreground/30"}`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowOverrideModal(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!overrideTenant}
              onClick={() => setShowOverrideModal(false)}
              className="bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white"
            >
              Apply Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
