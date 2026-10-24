"use client";

import Link from "next/link";
import { AlertTriangle, Mail, Paperclip } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { formatKpi } from "@/src/lib/branches/performance";
import type { ReportModel } from "@/src/lib/branches/performance-report";
import type { ReportSchedule } from "@/src/lib/stores/branch-performance-slice";
import { scheduleLabel } from "./schedule-utils";

/** What a scheduled report looks like in the recipient's inbox. */
export function EmailPreviewDialog({
  open,
  onOpenChange,
  schedule,
  model,
  onSend,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  schedule: ReportSchedule | null;
  model: ReportModel | null;
  onSend?: () => void;
}) {
  if (!schedule || !model) return null;
  const recipients = schedule.recipients.map((r) => r.name).join(", ") || "No recipients";
  const greeting = schedule.recipients.length === 1 ? schedule.recipients[0].name.split(" ")[0] : "Manager";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base">Email preview</DialogTitle>
          <DialogDescription className="text-xs">
            Exactly what recipients receive when this schedule runs.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto rounded-lg border border-border">
          <div className="flex gap-3 border-b border-border bg-muted px-4 py-3">
            <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="text-xs">
              <p className="text-sm font-semibold">Motee – {model.title}</p>
              <p className="text-muted-foreground">To: {recipients}</p>
              <p className="text-muted-foreground">{scheduleLabel(schedule)}</p>
            </div>
          </div>
          <div className="space-y-4 px-4 py-4 text-sm">
            <p>Dear {greeting},</p>
            <p>
              Please find below the {schedule.frequency} performance summary for your branches
              ({model.range.label}).
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-muted px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Branches monitored</p>
                <p className="text-xl font-bold">{model.rows.length}</p>
              </div>
              <div className="rounded-md bg-muted px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Overall compliance</p>
                <p className="text-xl font-bold">{formatKpi("compliance", model.company.compliance)}</p>
              </div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-1.5 text-left font-medium">Branch</th>
                  <th className="py-1.5 text-right font-medium">Performance</th>
                  <th className="py-1.5 text-right font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {model.rows.map((r) => {
                  const t = model.trends.find((x) => x.branch === r.branch.name);
                  return (
                    <tr key={r.branch.id} className="border-b border-border/60">
                      <td className="py-1.5">{r.rank}. {r.branch.name}</td>
                      <td className="py-1.5 text-right tabular-nums">{formatKpi("score", r.score)}</td>
                      <td className="py-1.5 text-right capitalize text-muted-foreground">{t?.direction ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div>
              <p className="mb-1 text-xs font-semibold">Management attention required</p>
              {model.attention.length === 0 ? (
                <p className="text-xs text-muted-foreground">No branch missed a target this period.</p>
              ) : (
                <ul className="space-y-1">
                  {model.attention.slice(0, 6).map((a, i) => (
                    <li key={i} className="flex gap-1.5 text-xs">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                      {a.message}
                    </li>
                  ))}
                  {model.attention.length > 6 && (
                    <li className="text-xs text-muted-foreground">…and {model.attention.length - 6} more in the attached report.</li>
                  )}
                </ul>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Please log into Motee to view the full report and take appropriate action.
            </p>
            <Button asChild className="w-full">
              <Link href="/organization/branches?tab=performance">View report in Motee</Link>
            </Button>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              Attached: {schedule.format === "both" ? "PDF and Excel report" : schedule.format === "pdf" ? "PDF report" : "Excel workbook"}
            </p>
          </div>
        </div>

        {onSend && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={onSend}>
              Send now
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
