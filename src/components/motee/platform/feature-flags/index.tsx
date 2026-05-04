"use client";

import { useState, useMemo } from "react";
import {
  Flag,
  Search,
  Plus,
  Users,
  Sliders,
  History,
  ChevronDown,
  ChevronUp,
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
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { DEMO_FEATURE_FLAGS, DEMO_TENANTS } from "@/src/data/motee-demo";
import type { FeatureFlag } from "@/src/data/motee-demo";

type ScopeFilter = "all" | "platform" | "plan" | "tenant";

const scopeStyles: Record<string, string> = {
  platform: "bg-[#ff8b2d]/10 text-[#ff8b2d]",
  plan: "bg-blue-500/10 text-blue-500",
  tenant: "bg-violet-500/10 text-violet-500",
};

const flagChangeHistory = [
  {
    flag: "Smart Leave Suggestions",
    operator: "B. Okonkwo",
    from: "disabled",
    to: "beta (10%)",
    scope: "platform",
    date: "2026-04-20",
  },
  {
    flag: "Attendance Geofencing",
    operator: "C. Mensah",
    from: "disabled",
    to: "disabled (beta only)",
    scope: "tenant",
    date: "2026-04-18",
  },
  {
    flag: "AI Performance Insights",
    operator: "A. Taiwo",
    from: "disabled",
    to: "beta (20%)",
    scope: "platform",
    date: "2026-04-15",
  },
  {
    flag: "Custom Report Builder",
    operator: "A. Taiwo",
    from: "enabled",
    to: "disabled",
    scope: "plan",
    date: "2026-04-12",
  },
  {
    flag: "Multi-Currency Payroll",
    operator: "B. Okonkwo",
    from: "disabled",
    to: "enabled",
    scope: "plan",
    date: "2026-04-10",
  },
];

export function FeatureFlagsPage() {
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [overrideTenant, setOverrideTenant] = useState("");
  const [overrideState, setOverrideState] = useState<"enabled" | "disabled">(
    "enabled",
  );
  const [showHistory, setShowHistory] = useState(false);
  const [newFlag, setNewFlag] = useState({
    name: "",
    description: "",
    category: "",
    scope: "platform",
    betaOnly: false,
    rolloutPercent: "",
  });

  function isEnabled(flag: FeatureFlag) {
    return toggleStates[flag.id] !== undefined
      ? toggleStates[flag.id]
      : flag.enabled;
  }

  function handleToggle(flag: FeatureFlag) {
    setToggleStates((prev) => ({ ...prev, [flag.id]: !isEnabled(flag) }));
  }

  const filtered = useMemo(() => {
    return DEMO_FEATURE_FLAGS.filter((f) => {
      const matchSearch =
        search === "" ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase());
      const matchScope = scopeFilter === "all" || f.scope === scopeFilter;
      return matchSearch && matchScope;
    });
  }, [search, scopeFilter]);

  const scopeTabs: { key: ScopeFilter; label: string }[] = [
    { key: "all", label: `All (${DEMO_FEATURE_FLAGS.length})` },
    {
      key: "platform",
      label: `Platform-Wide (${DEMO_FEATURE_FLAGS.filter((f) => f.scope === "platform").length})`,
    },
    {
      key: "plan",
      label: `Plan-Level (${DEMO_FEATURE_FLAGS.filter((f) => f.scope === "plan").length})`,
    },
    {
      key: "tenant",
      label: `Tenant-Level (${DEMO_FEATURE_FLAGS.filter((f) => f.scope === "tenant").length})`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Feature Flags</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toggle features platform-wide, per plan, or per tenant without code
            deployments.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-1.5"
          >
            <History className="h-4 w-4" />
            Change History
            {showHistory ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="gap-1.5 bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white"
          >
            <Plus className="h-4 w-4" />
            New Flag
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Total Flags",
            value: DEMO_FEATURE_FLAGS.length,
            color: "text-foreground",
            bg: "bg-muted/50",
          },
          {
            label: "Enabled",
            value: DEMO_FEATURE_FLAGS.filter((f) => f.enabled).length,
            color: "text-[#4ED251]",
            bg: "bg-[#4ED251]/10",
          },
          {
            label: "Beta Only",
            value: DEMO_FEATURE_FLAGS.filter((f) => f.betaOnly).length,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            label: "Partial Rollout",
            value: DEMO_FEATURE_FLAGS.filter(
              (f) => f.rolloutPercent !== null && f.rolloutPercent < 100,
            ).length,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
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

      {showHistory && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-[#ff8b2d]" />
              Recent Flag Changes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Flag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Operator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Scope
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {flagChangeHistory.map((h, i) => (
                  <tr key={i} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-foreground">
                      {h.flag}
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {h.operator}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className="text-muted-foreground">{h.from}</span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="text-foreground font-medium">
                        {h.to}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        className={`text-xs border-0 capitalize ${scopeStyles[h.scope]}`}
                      >
                        {h.scope}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {h.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search flags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {scopeTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setScopeFilter(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${scopeFilter === tab.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab.label}
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
                    Flag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Scope
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Rollout
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Last Changed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((flag) => {
                  const enabled = isEnabled(flag);
                  return (
                    <tr
                      key={flag.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {flag.name}
                            </span>
                            {flag.betaOnly && (
                              <Badge className="text-xs border-0 bg-amber-500/10 text-amber-500">
                                Beta
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {flag.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge variant="outline" className="text-xs">
                          {flag.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge
                          className={`text-xs border-0 capitalize ${scopeStyles[flag.scope]}`}
                        >
                          {flag.scope}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <button
                          onClick={() => handleToggle(flag)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${enabled ? "bg-[#4ED251]" : "bg-muted-foreground/30"}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">
                        {flag.rolloutPercent !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-[#ff8b2d] rounded-full"
                                style={{ width: `${flag.rolloutPercent}%` }}
                              />
                            </div>
                            <span className="text-xs">
                              {flag.rolloutPercent}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-xs text-muted-foreground">
                          {flag.changedAt}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          by {flag.changedBy}
                        </p>
                      </td>
                      <td className="px-6 py-3.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => {
                            setSelectedFlag(flag);
                            setShowOverrideModal(true);
                          }}
                        >
                          <Users className="h-3 w-3" />
                          Override
                        </Button>
                      </td>
                    </tr>
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
              <Sliders className="h-5 w-5 text-[#ff8b2d]" />
              Tenant-Level Override
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Override{" "}
              <span className="font-semibold text-foreground">
                {selectedFlag?.name}
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
              <p className="text-sm font-medium text-foreground">
                Override State
              </p>
              <div className="flex gap-2">
                {(["enabled", "disabled"] as const).map((state) => (
                  <button
                    key={state}
                    onClick={() => setOverrideState(state)}
                    className={`flex-1 rounded-md border py-2 text-sm font-medium capitalize transition-colors ${overrideState === state ? "border-[#ff8b2d] bg-[#ff8b2d]/10 text-[#ff8b2d]" : "border-border text-muted-foreground hover:border-foreground/30"}`}
                  >
                    {state}
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

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-[#ff8b2d]" />
              Create Feature Flag
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Flag Name <span className="text-red-500">*</span>
              </p>
              <Input
                placeholder="e.g. Advanced Analytics Dashboard"
                value={newFlag.name}
                onChange={(e) =>
                  setNewFlag((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">Description</p>
              <Textarea
                placeholder="Brief description of what this flag controls..."
                value={newFlag.description}
                onChange={(e) =>
                  setNewFlag((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">Category</p>
                <Input
                  placeholder="e.g. Analytics"
                  value={newFlag.category}
                  onChange={(e) =>
                    setNewFlag((p) => ({ ...p, category: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">Scope</p>
                <select
                  value={newFlag.scope}
                  onChange={(e) =>
                    setNewFlag((p) => ({ ...p, scope: e.target.value }))
                  }
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff8b2d]"
                >
                  <option value="platform">Platform-Wide</option>
                  <option value="plan">Plan-Level</option>
                  <option value="tenant">Tenant-Level</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">
                  Rollout % (optional)
                </p>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 25"
                  value={newFlag.rolloutPercent}
                  onChange={(e) =>
                    setNewFlag((p) => ({
                      ...p,
                      rolloutPercent: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <button
                  onClick={() =>
                    setNewFlag((p) => ({ ...p, betaOnly: !p.betaOnly }))
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${newFlag.betaOnly ? "bg-amber-500" : "bg-muted-foreground/30"}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${newFlag.betaOnly ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
                <span className="text-sm text-foreground">Beta only</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newFlag.name.trim()}
              onClick={() => setShowCreateModal(false)}
              className="bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white"
            >
              Create Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
