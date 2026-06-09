"use client";

import { useState, useMemo } from "react";
import {
  ClipboardList,
  Search,
  ShieldAlert,
  Activity,
  ArrowLeftRight,
  Download,
  Lock,
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

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-500",
  warning: "bg-amber-500/10 text-amber-600",
  critical: "bg-red-500/10 text-red-500",
};

const SENSITIVE_TYPES = [
  "permission_change",
  "billing_update",
  "tenant_delete",
  "maintenance_toggle",
  "impersonation",
  "feature_flag_change",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function AuditTrailPage() {
  const [tab, setTab] = useState<"all" | "sensitive" | "live">("all");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selected, setSelected] = useState<ActivityLog | null>(null);

  const sources = [
    "all",
    ...Array.from(new Set(DEMO_ACTIVITY_LOGS.map((l) => l.source))),
  ];
  const severities = ["all", "info", "warning", "critical"];

  const logs = useMemo(() => {
    let base = DEMO_ACTIVITY_LOGS;
    if (tab === "sensitive")
      base = base.filter((l) => SENSITIVE_TYPES.includes(l.actionType));
    if (sourceFilter !== "all")
      base = base.filter((l) => l.source === sourceFilter);
    if (severityFilter !== "all")
      base = base.filter((l) => l.severity === severityFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter(
        (l) =>
          l.actor.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.actionType.toLowerCase().includes(q) ||
          l.entityType.toLowerCase().includes(q),
      );
    }
    return base;
  }, [tab, search, sourceFilter, severityFilter]);

  const TABS = [
    {
      id: "all",
      label: "All Logs",
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: "sensitive",
      label: "Sensitive Actions",
      icon: <ShieldAlert className="w-4 h-4" />,
    },
    {
      id: "live",
      label: "Live Stream",
      icon: <Activity className="w-4 h-4" />,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Trail</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Immutable platform-wide audit log. Logs are retained for 7 years.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0">
          <Download className="w-4 h-4" /> Export
        </Button>
      </div>

      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
        <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
            Log Retention Policy
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">
            All audit logs are immutable and retained for{" "}
            <strong>7 years</strong>. Logs older than 2 years are automatically
            archived to cold storage and remain accessible on request.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? "bg-background border border-b-background border-border text-[#ff8b2d] -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "live" ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Activity className="w-10 h-10 text-muted-foreground animate-pulse" />
            <p className="text-sm font-medium text-muted-foreground">
              Live stream is not available in demo mode.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
            >
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Sources" : s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
            >
              {severities.map((s) => (
                <option key={s} value={s}>
                  {s === "all"
                    ? "All Severities"
                    : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <p className="text-xs text-muted-foreground">
                {logs.length} record{logs.length !== 1 ? "s" : ""} found
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Timestamp
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Actor
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Tenant
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Action
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Source
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Severity
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        IP
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-10 text-muted-foreground text-sm"
                        >
                          No logs match the current filters.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr
                          key={log.id}
                          onClick={() => setSelected(log)}
                          className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground font-mono">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap font-medium">
                            {log.actor}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground text-xs">
                            {log.tenantName ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 max-w-xs truncate text-muted-foreground text-xs">
                            {log.description}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <Badge
                              className={`text-xs font-normal ${SOURCE_STYLES[log.source] ?? "bg-muted text-muted-foreground"}`}
                            >
                              {log.source.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <Badge
                              className={`text-xs font-normal ${SEVERITY_STYLES[log.severity] ?? ""}`}
                            >
                              {log.severity}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap font-mono text-xs text-muted-foreground">
                            {log.ip}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#ff8b2d]" /> Audit Log
              Detail
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Timestamp", formatDate(selected.timestamp)],
                  ["Actor", selected.actor],
                  ["Source", selected.source.replace(/_/g, " ")],
                  ["Entity", selected.entityType],
                  ["Action", selected.actionType],
                  ["Severity", selected.severity],
                  ["IP Address", selected.ip],
                  ["Tenant", selected.tenantName ?? "—"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-foreground">{selected.description}</p>
              </div>
              {(selected.before || selected.after) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5" /> Change Diff
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">
                          Before
                        </p>
                        <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap break-all">
                          {JSON.stringify(selected.before, null, 2)}
                        </pre>
                      </div>
                      <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3">
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">
                          After
                        </p>
                        <pre className="text-xs text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap break-all">
                          {JSON.stringify(selected.after, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
