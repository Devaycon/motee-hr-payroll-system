"use client";

import {
  AlertTriangle,
  Clock,
  Globe,
  Server,
  Hash,
  Layers,
  User,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import { ACTION_TYPE_CONFIG, MODULE_LABELS } from "../data";
import type { AuditEntry } from "../types";

interface ActivityDetailModalProps {
  entry: AuditEntry | null;
  open: boolean;
  onClose: () => void;
}

export function ActivityDetailModal({
  entry,
  open,
  onClose,
}: ActivityDetailModalProps) {
  if (!entry) return null;

  const cfg = ACTION_TYPE_CONFIG[entry.actionType];
  const isError = entry.httpStatus >= 400;
  const statusColor = isError
    ? "text-red-600 dark:text-red-400"
    : "text-emerald-600 dark:text-emerald-400";
  const statusBg = isError
    ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
    : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border pr-14">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}
            >
              {cfg.label}
            </span>
            <Badge variant="secondary" className="px-1.5 py-px text-[10px]">
              {MODULE_LABELS[entry.module] ?? entry.module}
            </Badge>
            {entry.isSuspicious && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                Suspicious
              </span>
            )}
          </div>
          <DialogTitle className="text-base mt-1">
            {entry.description}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          {entry.isSuspicious && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This activity has been flagged as suspicious. It may require
                further investigation.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Performed By
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                {entry.userInitials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {entry.userName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.userRole}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  ID: {entry.userId}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Activity Details
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Timestamp</p>
                  <p className="font-medium text-foreground">
                    {formatDateTime(entry.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Module</p>
                  <p className="font-medium text-foreground">
                    {MODULE_LABELS[entry.module] ?? entry.module}
                  </p>
                </div>
              </div>
              {entry.resourceId && (
                <div className="flex items-start gap-3">
                  <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Resource ID</p>
                    <p className="font-mono font-medium text-foreground">
                      {entry.resourceId}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Technical Info
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-3">
                <Server className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground">Endpoint</p>
                  <p className="font-mono font-medium text-foreground break-all">
                    <span className="mr-1.5 rounded bg-muted px-1 py-0.5 text-[10px] font-bold text-foreground">
                      {entry.httpMethod}
                    </span>
                    {entry.endpoint}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">HTTP Status</p>
                  <span
                    className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-semibold font-mono ${statusColor} ${statusBg}`}
                  >
                    {entry.httpStatus}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">IP Address</p>
                  <p className="font-mono font-medium text-foreground">
                    {entry.ipAddress}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Response Time</p>
                  <p className="font-medium text-foreground">
                    {entry.responseTimeMs}ms
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Session ID</p>
                  <p className="font-mono font-medium text-foreground">
                    {entry.sessionId}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Entry ID</p>
                  <p className="font-mono font-medium text-foreground">
                    {entry.id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            Entry logged at {formatDateTime(entry.timestamp)} · {entry.id}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
