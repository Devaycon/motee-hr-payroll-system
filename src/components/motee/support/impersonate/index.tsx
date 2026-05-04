"use client";

import { useState } from "react";
import {
  UserRoundCog,
  ShieldCheck,
  Clock,
  Eye,
  AlertTriangle,
  Building2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
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
  DEMO_ASSISTED_ACCESS_SESSIONS,
} from "@/src/data/motee-demo";
import type { AssistedAccessSession } from "@/src/data/motee-demo";

const SESSION_STATUS_STYLES: Record<string, string> = {
  active: "bg-[#4ED251]/10 text-[#4ED251]",
  ended: "bg-muted text-muted-foreground",
  expired: "bg-amber-500/10 text-amber-500",
};

export function ImpersonatePage() {
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [showSessionDetail, setShowSessionDetail] =
    useState<AssistedAccessSession | null>(null);

  const activeTenants = DEMO_TENANTS.filter(
    (t) => t.status === "active" || t.status === "trial",
  );
  const selectedTenant = DEMO_TENANTS.find((t) => t.id === selectedTenantId);

  const statCards = [
    {
      label: "Total Sessions",
      value: DEMO_ASSISTED_ACCESS_SESSIONS.length,
      color: "text-foreground",
    },
    {
      label: "This Month",
      value: DEMO_ASSISTED_ACCESS_SESSIONS.filter((s) =>
        s.startedAt.startsWith("2026-04"),
      ).length,
      color: "text-blue-500",
    },
    {
      label: "Active Now",
      value: DEMO_ASSISTED_ACCESS_SESSIONS.filter((s) => s.status === "active")
        .length,
      color: "text-[#4ED251]",
    },
    {
      label: "Expired",
      value: DEMO_ASSISTED_ACCESS_SESSIONS.filter((s) => s.status === "expired")
        .length,
      color: "text-amber-500",
    },
  ];

  function handleInitiate() {
    setShowInitiateModal(false);
    setSelectedTenantId("");
    setReason("");
    setConfirmed(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Assisted Access
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter a tenant account in a fully read-only capacity for support and
            troubleshooting.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowInitiateModal(true)}
          className="gap-1.5 bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white shrink-0"
        >
          <Eye className="h-4 w-4" />
          Initiate Session
        </Button>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            Important: Read-Only Access
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Assisted Access grants a fully read-only view of a tenant account.
            No records can be created, edited, or deleted during the session. A
            persistent operator banner is displayed throughout. Every session is
            mandatory-reason-gated, time-limited to 60 minutes, and fully
            recorded in the audit trail. Tenants may be notified by email when a
            session is initiated.
          </p>
        </div>
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
          <CardTitle className="text-base font-semibold">
            Session History
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
                  Operator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Duration
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
              {DEMO_ASSISTED_ACCESS_SESSIONS.map((session) => (
                <tr
                  key={session.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff8b2d]/10">
                        <Building2 className="h-3.5 w-3.5 text-[#ff8b2d]" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {session.tenantName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground">
                    {session.operator}
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-xs text-muted-foreground line-clamp-2 max-w-60">
                      {session.reason}
                    </p>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                    {session.startedAt.replace("T", " ").slice(0, 16)}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-muted-foreground">
                    {session.duration ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.duration}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge
                      className={`text-xs border-0 capitalize ${SESSION_STATUS_STYLES[session.status]}`}
                    >
                      {session.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-blue-500 hover:text-blue-600"
                      onClick={() => setShowSessionDetail(session)}
                    >
                      View Detail
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog
        open={showInitiateModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowInitiateModal(false);
            setSelectedTenantId("");
            setReason("");
            setConfirmed(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRoundCog className="h-5 w-5 text-[#ff8b2d]" />
              Initiate Assisted Access
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
              <p className="text-xs text-blue-500 leading-relaxed">
                This session will be fully read-only. You cannot create, edit,
                or delete any records. The session will automatically expire
                after 60 minutes and will be recorded in the audit trail.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Select Tenant <span className="text-red-500">*</span>
              </p>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff8b2d]"
              >
                <option value="">Choose a tenant…</option>
                {activeTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.plan})
                  </option>
                ))}
              </select>
            </div>
            {selectedTenant && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ff8b2d]/10">
                  <Building2 className="h-4 w-4 text-[#ff8b2d]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedTenant.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {selectedTenant.plan} ·{" "}
                    {selectedTenant.employeeCount.toLocaleString()} employees
                  </p>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Reason for Access <span className="text-red-500">*</span>
              </p>
              <Textarea
                placeholder="e.g. Investigating payroll export failure reported in ticket tkt-001"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This reason will be permanently recorded in the audit trail.
              </p>
            </div>
            <div
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                confirmed
                  ? "border-[#ff8b2d]/50 bg-[#ff8b2d]/5"
                  : "border-border hover:border-foreground/30"
              }`}
              onClick={() => setConfirmed((p) => !p)}
            >
              <div
                className={`flex h-4 w-4 shrink-0 mt-0.5 items-center justify-center rounded border transition-colors ${confirmed ? "bg-[#ff8b2d] border-[#ff8b2d]" : "border-border"}`}
              >
                {confirmed && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                I confirm that this assisted access session is for legitimate
                support purposes and I understand that my actions will be fully
                logged and audited.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowInitiateModal(false);
                setSelectedTenantId("");
                setReason("");
                setConfirmed(false);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedTenantId || !reason.trim() || !confirmed}
              onClick={handleInitiate}
              className="bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white gap-1.5"
            >
              <Eye className="h-4 w-4" />
              Start Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!showSessionDetail}
        onOpenChange={(open) => {
          if (!open) setShowSessionDetail(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {showSessionDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserRoundCog className="h-5 w-5 text-[#ff8b2d]" />
                  Session Detail
                  <Badge
                    className={`text-xs border-0 capitalize ${SESSION_STATUS_STYLES[showSessionDetail.status]}`}
                  >
                    {showSessionDetail.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Tenant</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {showSessionDetail.tenantName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Operator</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {showSessionDetail.operator}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {showSessionDetail.startedAt
                        .replace("T", " ")
                        .slice(0, 16)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ended</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {showSessionDetail.endedAt
                        ? showSessionDetail.endedAt
                            .replace("T", " ")
                            .slice(0, 16)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {showSessionDetail.duration ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Session ID</p>
                    <p className="font-mono text-xs text-foreground mt-0.5">
                      {showSessionDetail.id}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Reason for Access
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {showSessionDetail.reason}
                  </p>
                </div>
                {showSessionDetail.status === "expired" && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-600">
                        This session expired automatically without the operator
                        ending it manually. The time limit was reached.
                      </p>
                    </div>
                  </>
                )}
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
                  <XCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    This session was fully read-only. No records were created,
                    edited, or deleted during this session.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowSessionDetail(null)}
                >
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
