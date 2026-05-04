"use client";

import { useState, useMemo } from "react";
import {
  ScrollText,
  Search,
  ShieldAlert,
  Activity,
  ArrowLeftRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
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
import { DEMO_ACTIVITY_LOGS } from "@/src/data/motee-demo";
import type { ActivityLog } from "@/src/data/motee-demo";

const SOURCE_STYLES: Record<string, string> = {
  cms_operator: "bg-blue-500/10 text-blue-500",
  tenant_admin: "bg-purple-500/10 text-purple-500",
  system: "bg-muted text-muted-foreground",
  assisted_access: "bg-amber-500/10 text-amber-500",
};

const SOURCE_LABELS: Record<string, string> = {
  cms_operator: "CMS Operator",
  tenant_admin: "Tenant Admin",
  system: "System",
  assisted_access: "Assisted Access",
};

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-muted text-muted-foreground",
  warning: "bg-amber-500/10 text-amber-500",
  critical: "bg-red-500/10 text-red-500",
};

const SENSITIVE_ACTION_TYPES = new Set([
  "Invoice Refund",
  "Tenant Suspended",
  "Tenant Reactivated",
  "Data Export",
  "Assisted Access Started",
  "Assisted Access Ended",
  "Module Disabled",
  "Plan Assigned",
  "2FA Enforced",
]);

export function ActivityLogsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "sensitive" | "stream">(
    "all",
  );
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [selected, setSelected] = useState<ActivityLog | null>(null);

  const filtered = useMemo(() => {
    const base =
      activeTab === "sensitive"
        ? DEMO_ACTIVITY_LOGS.filter((l) =>
            SENSITIVE_ACTION_TYPES.has(l.actionType),
          )
        : DEMO_ACTIVITY_LOGS;

    return base.filter((l) => {
      const matchSearch =
        l.actor.toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase()) ||
        l.actionType.toLowerCase().includes(search.toLowerCase()) ||
        (l.tenantName?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchSource = sourceFilter === "all" || l.source === sourceFilter;
      const matchSeverity =
        severityFilter === "all" || l.severity === severityFilter;
      return matchSearch && matchSource && matchSeverity;
    });
  }, [search, activeTab, sourceFilter, severityFilter]);

  const statCards = [
    {
      label: "Total Events",
      value: DEMO_ACTIVITY_LOGS.length,
      color: "text-foreground",
    },
    {
      label: "CMS Operator",
      value: DEMO_ACTIVITY_LOGS.filter((l) => l.source === "cms_operator")
        .length,
      color: "text-blue-500",
    },
    {
      label: "Sensitive Actions",
      value: DEMO_ACTIVITY_LOGS.filter((l) =>
        SENSITIVE_ACTION_TYPES.has(l.actionType),
      ).length,
      color: "text-amber-500",
    },
    {
      label: "Critical Events",
      value: DEMO_ACTIVITY_LOGS.filter((l) => l.severity === "critical").length,
      color: "text-red-500",
    },
  ];

  const TABS = [
    { key: "all" as const, label: "All Logs", icon: ScrollText },
    {
      key: "sensitive" as const,
      label: "Sensitive Actions",
      icon: ShieldAlert,
    },
    { key: "stream" as const, label: "Live Stream", icon: Activity },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Immutable audit trail of all CMS operator, tenant admin, and system
          events.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex gap-1 flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-[#ff8b2d] text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            {activeTab !== "stream" && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs…"
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff8b2d]"
                >
                  <option value="all">All Sources</option>
                  <option value="cms_operator">CMS Operator</option>
                  <option value="tenant_admin">Tenant Admin</option>
                  <option value="system">System</option>
                  <option value="assisted_access">Assisted Access</option>
                </select>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff8b2d]"
                >
                  <option value="all">All Severities</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            )}
          </div>
        </CardHeader>

        {activeTab === "stream" ? (
          <CardContent className="p-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ED251] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ED251]"></span>
                </span>
                <p className="text-xs font-medium text-foreground">
                  Live — Last 10 events
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {DEMO_ACTIVITY_LOGS.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-md bg-background border border-border px-3 py-2.5"
                  >
                    <Badge
                      className={`text-[10px] border-0 shrink-0 mt-0.5 ${SEVERITY_STYLES[log.severity]}`}
                    >
                      {log.severity}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground line-clamp-1">
                        {log.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {log.actor} ·{" "}
                        {log.timestamp.replace("T", " ").slice(0, 16)}
                      </p>
                    </div>
                    <Badge
                      className={`text-[10px] border-0 shrink-0 ${SOURCE_STYLES[log.source]}`}
                    >
                      {SOURCE_LABELS[log.source]}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Actor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-muted-foreground"
                    >
                      No log entries match your current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => setSelected(log)}
                    >
                      <td className="px-6 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {log.timestamp.replace("T", " ").slice(0, 16)}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">
                        {log.actor}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge
                          className={`text-xs border-0 whitespace-nowrap ${SOURCE_STYLES[log.source]}`}
                        >
                          {SOURCE_LABELS[log.source]}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm text-foreground whitespace-nowrap">
                          {log.actionType}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-70">
                          {log.description}
                        </p>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {log.tenantName ?? "—"}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge
                          className={`text-xs border-0 capitalize ${SEVERITY_STYLES[log.severity]}`}
                        >
                          {log.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-xs font-mono text-muted-foreground">
                        {log.ip}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="px-6 py-3 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {filtered.length} of {DEMO_ACTIVITY_LOGS.length} events
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
              >
                Export CSV
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <span>{selected.actionType}</span>
                  <Badge
                    className={`text-xs border-0 capitalize ${SEVERITY_STYLES[selected.severity]}`}
                  >
                    {selected.severity}
                  </Badge>
                  <Badge
                    className={`text-xs border-0 ${SOURCE_STYLES[selected.source]}`}
                  >
                    {SOURCE_LABELS[selected.source]}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Actor</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {selected.actor}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Timestamp</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {selected.timestamp.replace("T", " ").slice(0, 16)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entity</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {selected.entityType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tenant</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {selected.tenantName ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">IP Address</p>
                    <p className="font-mono text-sm text-foreground mt-0.5">
                      {selected.ip}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Description
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {selected.description}
                  </p>
                </div>
                {(selected.before || selected.after) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Change Diff
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-md bg-red-500/5 border border-red-500/20 px-3 py-2">
                          <p className="text-[10px] text-red-500 font-medium mb-1">
                            Before
                          </p>
                          <p className="text-xs text-foreground font-mono">
                            {selected.before ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-md bg-[#4ED251]/5 border border-[#4ED251]/20 px-3 py-2">
                          <p className="text-[10px] text-[#4ED251] font-medium mb-1">
                            After
                          </p>
                          <p className="text-xs text-foreground font-mono">
                            {selected.after ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
