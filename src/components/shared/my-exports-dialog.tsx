"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileDown, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useIsLive } from "@/src/lib/live/use-is-live";
import { cn, getApiErrorMessage } from "@/src/lib/utils";
import { formatDate } from "@/src/lib/utils/format-date";
import {
  useCreateExportLinkMutation,
  useGetMyExportJobsQuery,
} from "@/src/store/services/exports";
import type { ExportJobDto } from "@/src/types/common";

const TONE: Record<ExportJobDto["status"], string> = {
  queued: "border-slate-500/20 bg-slate-500/10 text-slate-600",
  running: "border-blue-500/20 bg-blue-500/10 text-blue-600",
  completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
  failed: "border-red-500/20 bg-red-500/10 text-red-600",
};

/**
 * "Exports" — the files you've exported on the server (GET /exports/mine),
 * newest first, each downloadable again while its link is valid
 * (POST /exports/{id}/link). Server exports also arrive by email. Shown
 * signed in only: signed out, exports are built in the browser.
 */
export function MyExportsButton({ className }: { className?: string }) {
  const live = useIsLive();
  const [open, setOpen] = useState(false);
  const jobs = useGetMyExportJobsQuery(undefined, {
    skip: !live || !open,
    // Running jobs finish in the background; keep the list current while open.
    pollingInterval: open ? 5000 : 0,
  });
  const [link] = useCreateExportLinkMutation();
  const [busy, setBusy] = useState<string | null>(null);

  if (!live) return null;

  async function download(job: ExportJobDto) {
    setBusy(job.id);
    try {
      const res = await link(job.id).unwrap();
      window.open(res.data.url, "_blank", "noopener");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not get the download link."));
    } finally {
      setBusy(null);
    }
  }

  const list = [...(jobs.data?.data ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const expired = (j: ExportJobDto) =>
    !!j.expiresAt && new Date(j.expiresAt).getTime() < Date.now();

  return (
    <>
      <Button variant="outline" className={cn("gap-1.5", className)} onClick={() => setOpen(true)}>
        <History className="h-4 w-4" />
        Exports
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>My Exports</DialogTitle>
            <DialogDescription>
              Files you exported recently. They are also emailed to you when ready.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {jobs.isLoading ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : list.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                You haven&apos;t exported anything yet.
              </p>
            ) : (
              list.map((j) => (
                <div
                  key={j.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FileDown className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {j.fileName ?? j.kind}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(j.createdAt)}
                        {j.rowCount != null && ` · ${j.rowCount.toLocaleString()} rows`}
                        {j.status === "failed" && j.error && ` · ${j.error}`}
                        {expired(j) && " · link expired"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className={cn("text-[10px] capitalize", TONE[j.status])}>
                      {j.status}
                    </Badge>
                    {j.status === "completed" && !expired(j) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        aria-label={`Download ${j.fileName ?? "export"}`}
                        disabled={busy === j.id}
                        onClick={() => void download(j)}
                      >
                        <Download className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
