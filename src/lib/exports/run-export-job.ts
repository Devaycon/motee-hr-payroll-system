import { exportsApi } from "@/src/store/services/exports";
import type { AppDispatch } from "@/src/lib/stores/store";
import type { ExportJobDto } from "@/src/types/common";

const POLL_MS = 1500;
// About two minutes; an export that takes longer is reported, not awaited.
const MAX_POLLS = 80;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type ExportJobOutcome =
  | { status: "completed"; job: ExportJobDto; url: string }
  | { status: "failed"; job: ExportJobDto; error: string }
  | { status: "running"; job: ExportJobDto };

/**
 * Follows a server export job to the end: polls until it finishes, then asks
 * for a short-lived download link. Errors from the API are thrown.
 */
export async function followExportJob(
  dispatch: AppDispatch,
  started: ExportJobDto,
): Promise<ExportJobOutcome> {
  let job = started;
  for (
    let i = 0;
    i < MAX_POLLS && (job.status === "queued" || job.status === "running");
    i++
  ) {
    await wait(POLL_MS);
    const poll = dispatch(
      exportsApi.endpoints.getExportJob.initiate(job.id, { forceRefetch: true }),
    );
    try {
      job = (await poll.unwrap()).data;
    } finally {
      poll.unsubscribe();
    }
  }
  if (job.status === "failed") {
    return { status: "failed", job, error: job.error ?? "The export failed." };
  }
  if (job.status !== "completed") return { status: "running", job };
  const link = (
    await dispatch(exportsApi.endpoints.createExportLink.initiate(job.id)).unwrap()
  ).data;
  return { status: "completed", job, url: link.url };
}
