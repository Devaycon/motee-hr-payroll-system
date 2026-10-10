"use client";

import { useRef } from "react";
import { Download, FileUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { useCan } from "@/src/lib/permissions/use-can";
import { getApiErrorMessage } from "@/src/lib/utils";
import { formatDate } from "@/src/lib/utils/format-date";
import {
  filesApi,
  useDeleteFileMutation,
  useDownloadFileMutation,
  useGetFilesQuery,
  useUploadFileMutation,
} from "@/src/store/services/files";
import { useGetEmployeeLeaveBalancesQuery } from "@/src/store/services/leave-balances";
import type { ModuleProps } from "./modules";
import { Empty, LoadingPanel, Section } from "./ui";

/** Files held against the employee's record. */
export function LiveDocumentsModule({ employeeId }: ModuleProps) {
  const canEdit = useCan("organization.employees", "edit");
  const { data, isLoading } = useGetFilesQuery({
    purpose: "employeeDocument",
    ownerId: employeeId,
  });
  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation();
  const [deleteFile] = useDeleteFileMutation();
  const [downloadFile] = useDownloadFileMutation();
  const [fetchFile] = filesApi.useLazyGetFileQuery();
  const input = useRef<HTMLInputElement>(null);
  const files = data?.data ?? [];

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    try {
      await uploadFile({
        file,
        purpose: "employeeDocument",
        ownerId: employeeId,
      }).unwrap();
      toast.success(`${file.name} uploaded`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not upload the file."));
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  async function handleDownload(id: string) {
    try {
      // Confirms the file still exists and gives the name to save it under.
      const file = (await fetchFile(id).unwrap()).data;
      await downloadFile({ id, fileName: file.fileName }).unwrap();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not download the file."));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteFile(id).unwrap();
      toast.success("File deleted");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not delete the file."));
    }
  }

  if (isLoading) return <LoadingPanel />;

  return (
    <Section
      title="Employee Documents"
      action={
        canEdit ? (
          <>
            <input
              ref={input}
              type="file"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0])}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              disabled={uploading}
              onClick={() => input.current?.click()}
            >
              <FileUp className="h-3.5 w-3.5" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </>
        ) : undefined
      }
    >
      {files.length === 0 ? (
        <Empty label="No documents on file." />
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm text-foreground">
                  {file.fileName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.max(1, Math.round(file.sizeBytes / 1024))} KB ·{" "}
                  {formatDate(file.uploadedAt)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label={`Download ${file.fileName}`}
                  onClick={() => handleDownload(file.id)}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    aria-label={`Delete ${file.fileName}`}
                    onClick={() => handleDelete(file.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** Where the employee stands on each leave type. */
export function LiveLeaveModule({ employeeId }: ModuleProps) {
  const { data, isLoading } = useGetEmployeeLeaveBalancesQuery({ employeeId });
  const balances = data?.data ?? [];

  if (isLoading) return <LoadingPanel />;

  return (
    <Section title="Leave">
      {balances.length === 0 ? (
        <Empty label="No leave entitlement set up." />
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {balances.map((balance) => (
            <li
              key={balance.leaveTypeId}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="text-sm text-foreground">
                  {balance.leaveTypeName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {balance.leaveYearLabel} · {balance.used} used ·{" "}
                  {balance.pending} pending
                  {balance.carriedOver ? ` · ${balance.carriedOver} carried over` : ""}
                </span>
              </div>
              <span className="text-sm text-foreground">
                {balance.available} of {balance.entitlement} days left
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
