"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { getApiErrorMessage } from "@/src/lib/utils";
import { followExportJob } from "@/src/lib/exports/run-export-job";
import { useExportReportMutation } from "@/src/store/services/reports";
import type { ReportExportRequest } from "@/src/types/reports";

/**
 * Exports a report dataset on the server (POST /reports/export), follows the
 * job, and opens the file when it is ready.
 */
export function useReportServerExport() {
  const dispatch = useAppDispatch();
  const [start] = useExportReportMutation();
  const [exporting, setExporting] = useState<string | null>(null);

  const exportReport = useCallback(
    async (request: ReportExportRequest, label: string) => {
      setExporting(request.dataset);
      try {
        const started = (await start(request).unwrap()).data;
        const outcome = await followExportJob(dispatch, started);
        if (outcome.status === "failed") {
          toast.error(outcome.error);
        } else if (outcome.status === "running") {
          toast.info("The export is still running. Try again in a moment.");
        } else {
          window.open(outcome.url, "_blank", "noopener");
          toast.success(`Exported ${outcome.job.rowCount ?? 0} rows from ${label}`);
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err, `Could not export ${label}.`));
      } finally {
        setExporting(null);
      }
    },
    [dispatch, start],
  );

  return { exportReport, exporting };
}
