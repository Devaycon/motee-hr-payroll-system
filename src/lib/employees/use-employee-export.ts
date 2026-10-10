"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  useExportEmployeesMutation,
  useGetEmployeeExportColumnsQuery,
} from "@/src/store/services/employees";
import { exportsApi } from "@/src/store/services/exports";
import type { EmployeeFilters } from "@/src/types/employees";

const POLL_MS = 1500;
// About two minutes; an export that takes longer is reported, not awaited.
const MAX_POLLS = 80;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Exports the employee list on the server. The export runs as a job: start it,
 * poll until it finishes, then ask for a short-lived download link.
 */
export function useEmployeeExport() {
  const dispatch = useAppDispatch();
  const [startExport] = useExportEmployeesMutation();
  const { data: columns } = useGetEmployeeExportColumnsQuery();
  const [exporting, setExporting] = useState(false);

  const exportEmployees = useCallback(
    async (filters?: EmployeeFilters) => {
      setExporting(true);
      try {
        let job = (
          await startExport({
            filters,
            // Every column the server offers.
            columns: columns?.data?.map((c) => c.key) ?? null,
          }).unwrap()
        ).data;

        for (
          let i = 0;
          i < MAX_POLLS && (job.status === "queued" || job.status === "running");
          i++
        ) {
          await wait(POLL_MS);
          const poll = dispatch(
            exportsApi.endpoints.getExportJob.initiate(job.id, {
              forceRefetch: true,
            }),
          );
          try {
            job = (await poll.unwrap()).data;
          } finally {
            poll.unsubscribe();
          }
        }

        if (job.status === "failed") {
          toast.error(job.error ?? "The export failed.");
          return;
        }
        if (job.status !== "completed") {
          toast.info("The export is still running. Try again in a moment.");
          return;
        }

        const link = (
          await dispatch(
            exportsApi.endpoints.createExportLink.initiate(job.id),
          ).unwrap()
        ).data;
        window.open(link.url, "_blank", "noopener");
        toast.success(`${job.rowCount ?? 0} employee(s) exported`);
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not export the employees."));
      } finally {
        setExporting(false);
      }
    },
    [dispatch, startExport, columns],
  );

  return { exportEmployees, exporting };
}
