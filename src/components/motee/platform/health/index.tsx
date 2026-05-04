"use client";

import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCw,
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
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { AreaChartCard } from "@/src/components/shared/charts/area-chart";
import {
  SYSTEM_HEALTH,
  DEMO_JOB_QUEUES,
  DEMO_INCIDENTS,
  API_RESPONSE_TIME_DATA,
} from "@/src/data/motee-demo";
import type { SystemIncident } from "@/src/data/motee-demo";

const componentStatusStyles = {
  operational: {
    badge: "bg-[#4ED251]/10 text-[#4ED251]",
    icon: CheckCircle2,
    color: "text-[#4ED251]",
  },
  degraded: {
    badge: "bg-amber-500/10 text-amber-500",
    icon: AlertTriangle,
    color: "text-amber-500",
  },
  down: {
    badge: "bg-red-500/10 text-red-500",
    icon: XCircle,
    color: "text-red-500",
  },
};

const incidentSeverityStyles: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500",
  major: "bg-amber-500/10 text-amber-500",
  minor: "bg-blue-500/10 text-blue-500",
};

const incidentStatusStyles: Record<string, string> = {
  investigating: "bg-red-500/10 text-red-500",
  identified: "bg-amber-500/10 text-amber-500",
  monitoring: "bg-blue-500/10 text-blue-500",
  resolved: "bg-[#4ED251]/10 text-[#4ED251]",
};

const queueStatusStyles: Record<string, string> = {
  healthy: "bg-[#4ED251]/10 text-[#4ED251]",
  warning: "bg-amber-500/10 text-amber-500",
  failing: "bg-red-500/10 text-red-500",
};

const apiChartConfig = {
  avg: { label: "Avg (ms)", color: "#ff8b2d" },
  p95: { label: "P95 (ms)", color: "#4ED251" },
  p99: { label: "P99 (ms)", color: "#6366f1" },
};

export function PlatformHealthPage() {
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [selectedIncident, setSelectedIncident] =
    useState<SystemIncident | null>(null);
  const [incidentStatuses, setIncidentStatuses] = useState<
    Record<string, SystemIncident["status"]>
  >({});
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    severity: "minor",
    component: "",
  });
  const [showNewModal, setShowNewModal] = useState(false);

  function getIncidentStatus(inc: SystemIncident): SystemIncident["status"] {
    return incidentStatuses[inc.id] ?? inc.status;
  }

  const overallStatus = SYSTEM_HEALTH.some((c) => c.status === "down")
    ? "down"
    : SYSTEM_HEALTH.some((c) => c.status === "degraded")
      ? "degraded"
      : "operational";

  const activeIncidents = DEMO_INCIDENTS.filter(
    (i) => getIncidentStatus(i) !== "resolved",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Platform Health
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time status of all platform components, job queues, and
            incidents.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowNewModal(true)}
          className="gap-1.5 bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Incident
        </Button>
      </div>

      <div
        className={`flex items-center gap-3 rounded-lg border p-4 ${
          overallStatus === "operational"
            ? "border-[#4ED251]/30 bg-[#4ED251]/5"
            : overallStatus === "degraded"
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-red-500/30 bg-red-500/5"
        }`}
      >
        {overallStatus === "operational" ? (
          <CheckCircle2 className="h-5 w-5 text-[#4ED251] shrink-0" />
        ) : overallStatus === "degraded" ? (
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">
            {overallStatus === "operational"
              ? "All Systems Operational"
              : overallStatus === "degraded"
                ? "Some Systems Degraded"
                : "System Outage Detected"}
          </p>
          <p className="text-xs text-muted-foreground">
            {activeIncidents > 0
              ? `${activeIncidents} active incident${activeIncidents !== 1 ? "s" : ""} under investigation`
              : "No active incidents"}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          Component Status
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SYSTEM_HEALTH.map((component) => {
            const style = componentStatusStyles[component.status];
            const Icon = style.icon;
            return (
              <Card key={component.label}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-5 w-5 shrink-0 ${style.color}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {component.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uptime: {component.uptime}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`text-xs border-0 capitalize shrink-0 ${style.badge}`}
                  >
                    {component.status}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <AreaChartCard
        title="API Response Times (ms)"
        icon={Activity}
        data={API_RESPONSE_TIME_DATA}
        config={apiChartConfig}
        series={[
          { key: "avg", color: "#ff8b2d" },
          { key: "p95", color: "#4ED251" },
          { key: "p99", color: "#6366f1" },
        ]}
        xAxisKey="month"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Job Queues</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Queue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Depth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Processing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Failed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {DEMO_JOB_QUEUES.map((queue) => (
                <tr
                  key={queue.name}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <td className="px-6 py-3.5 text-sm font-medium text-foreground">
                    {queue.name}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-foreground font-mono">
                    {queue.depth}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-foreground font-mono">
                    {queue.processing}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`text-sm font-mono font-medium ${queue.failed > 0 ? "text-red-500" : "text-muted-foreground"}`}
                    >
                      {queue.failed}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge
                      className={`text-xs border-0 capitalize ${queueStatusStyles[queue.status]}`}
                    >
                      {queue.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5">
                    {queue.failed > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 text-blue-500 hover:text-blue-600"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry Failed
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Incidents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Incident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Component
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Resolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {DEMO_INCIDENTS.map((inc) => {
                const status = getIncidentStatus(inc);
                return (
                  <tr
                    key={inc.id}
                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedIncident(inc);
                      setShowIncidentModal(true);
                    }}
                  >
                    <td className="px-6 py-3.5 text-sm font-medium text-foreground">
                      {inc.title}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">
                      {inc.component}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        className={`text-xs border-0 capitalize ${incidentSeverityStyles[inc.severity]}`}
                      >
                        {inc.severity}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        className={`text-xs border-0 capitalize ${incidentStatusStyles[status]}`}
                      >
                        {status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground">
                      {inc.startedAt.replace("T", " ").slice(0, 16)}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground">
                      {inc.resolvedAt
                        ? inc.resolvedAt.replace("T", " ").slice(0, 16)
                        : "—"}
                    </td>
                    <td
                      className="px-6 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {status !== "resolved" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1 text-[#4ED251] hover:text-[#4ED251]"
                          onClick={() =>
                            setIncidentStatuses((p) => ({
                              ...p,
                              [inc.id]: "resolved",
                            }))
                          }
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Resolve
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selectedIncident && (
        <Dialog open={showIncidentModal} onOpenChange={setShowIncidentModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <span>{selectedIncident.title}</span>
                <Badge
                  className={`text-xs border-0 capitalize ${incidentSeverityStyles[selectedIncident.severity]}`}
                >
                  {selectedIncident.severity}
                </Badge>
                <Badge
                  className={`text-xs border-0 capitalize ${incidentStatusStyles[getIncidentStatus(selectedIncident)]}`}
                >
                  {getIncidentStatus(selectedIncident).replace("_", " ")}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Component</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedIncident.component}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Started</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedIncident.startedAt.replace("T", " ").slice(0, 16)}
                  </p>
                </div>
                {selectedIncident.resolvedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Resolved</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {selectedIncident.resolvedAt
                        .replace("T", " ")
                        .slice(0, 16)}
                    </p>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Description
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>
              {getIncidentStatus(selectedIncident) !== "resolved" && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-medium text-foreground">
                      Update Status
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {(
                        [
                          "investigating",
                          "identified",
                          "monitoring",
                          "resolved",
                        ] as const
                      ).map((s) => (
                        <button
                          key={s}
                          onClick={() =>
                            setIncidentStatuses((p) => ({
                              ...p,
                              [selectedIncident.id]: s,
                            }))
                          }
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${getIncidentStatus(selectedIncident) === s ? "border-[#ff8b2d] bg-[#ff8b2d]/10 text-[#ff8b2d]" : "border-border text-muted-foreground hover:border-foreground/30"}`}
                        >
                          {s.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowIncidentModal(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#ff8b2d]" />
              Create Incident
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Title <span className="text-red-500">*</span>
              </p>
              <Input
                placeholder="e.g. Database Connectivity Issues"
                value={newIncident.title}
                onChange={(e) =>
                  setNewIncident((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">
                  Affected Component
                </p>
                <select
                  value={newIncident.component}
                  onChange={(e) =>
                    setNewIncident((p) => ({ ...p, component: e.target.value }))
                  }
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff8b2d]"
                >
                  <option value="">Select component</option>
                  {SYSTEM_HEALTH.map((c) => (
                    <option key={c.label} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">Severity</p>
                <select
                  value={newIncident.severity}
                  onChange={(e) =>
                    setNewIncident((p) => ({ ...p, severity: e.target.value }))
                  }
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff8b2d]"
                >
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">Description</p>
              <Textarea
                placeholder="Describe the incident..."
                value={newIncident.description}
                onChange={(e) =>
                  setNewIncident((p) => ({ ...p, description: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newIncident.title.trim()}
              onClick={() => setShowNewModal(false)}
              className="bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white"
            >
              Create Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
