"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Download, Paperclip, Trash2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { RowActions } from "@/src/components/hr/employees/employee-detail/row-actions";
import { PromptDialog, type PromptRequest } from "@/src/components/shared/prompt-dialog";
import { useLiveSender } from "@/src/lib/live/use-is-live";
import { getApiErrorMessage } from "@/src/lib/utils";
import { formatDate } from "@/src/lib/utils/format-date";
import {
  useAddErCaseEvidenceMutation,
  useDeleteErCaseEvidenceMutation,
  useDeleteErCaseMeetingMutation,
  useDownloadErCaseEvidenceMutation,
} from "@/src/store/services/er-cases";
import type { ERCase } from "@/src/lib/types/grievance";

/** Evidence ids are carried as `evidence:{id}` on the case's evidence rows. */
const evidenceId = (url?: string) => (url?.startsWith("evidence:") ? url.slice(9) : null);

/**
 * Signed in: the case's evidence files (upload, download, delete) and its
 * meetings (delete). POST/GET/DELETE /er-cases/{id}/evidence…,
 * DELETE /er-cases/{id}/meetings/{meetingId}.
 */
export function CaseFilesPanel({ caseData }: { caseData: ERCase }) {
  const [addEvidence, { isLoading: uploading }] = useAddErCaseEvidenceMutation();
  const [download] = useDownloadErCaseEvidenceMutation();
  const [removeEvidence] = useDeleteErCaseEvidenceMutation();
  const [removeMeeting] = useDeleteErCaseMeetingMutation();
  const send = useLiveSender(["ErCases"]);
  const input = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState<PromptRequest | null>(null);
  const [pending, setPending] = useState<File | null>(null);

  async function upload(file: File, description: string) {
    try {
      await addEvidence({
        id: caseData.id,
        // Multipart: the file plus its display name and description.
        body: { file, name: file.name, description: description || undefined } as never,
      }).unwrap();
      toast.success(`${file.name} added to the case`);
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not upload the evidence."));
      return false;
    }
  }

  const meetings = caseData.meetings ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5">
            <Paperclip className="h-4 w-4" /> Evidence &amp; Meetings
          </span>
          <input
            ref={input}
            type="file"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setPending(file);
              setPrompt({
                title: `Add ${file.name}`,
                inputLabel: "Description (optional)",
                optional: true,
                multiline: true,
                confirmLabel: "Upload",
                onConfirm: (d) => upload(file, d),
              });
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            disabled={uploading}
            onClick={() => input.current?.click()}
          >
            <Upload className="h-3 w-3" /> {uploading && pending ? "Uploading…" : "Add evidence"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          {caseData.evidence.length === 0 ? (
            <p className="text-xs text-muted-foreground">No evidence on this case yet.</p>
          ) : (
            caseData.evidence.map((e, i) => {
              const id = evidenceId(e.url);
              return (
                <div
                  key={id ?? i}
                  className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{e.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(e.uploadedAt)}</p>
                  </div>
                  {id && (
                    <RowActions
                      label={`Actions for ${e.name}`}
                      extra={[
                        {
                          label: "Download",
                          icon: Download,
                          onSelect: () =>
                            void download({ id: caseData.id, evidenceId: id })
                              .unwrap()
                              .catch((err) =>
                                toast.error(getApiErrorMessage(err, "Could not download the file.")),
                              ),
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          destructive: true,
                          separatorBefore: true,
                          onSelect: () =>
                            setPrompt({
                              title: `Delete ${e.name}?`,
                              description: "The file is removed from the case.",
                              confirmLabel: "Delete",
                              destructive: true,
                              onConfirm: () =>
                                send(
                                  () => removeEvidence({ id: caseData.id, evidenceId: id }).unwrap(),
                                  "Could not delete the evidence.",
                                ),
                            }),
                        },
                      ]}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> Meetings
          </p>
          {meetings.length === 0 ? (
            <p className="text-xs text-muted-foreground">No meetings recorded.</p>
          ) : (
            meetings.map((m) => (
              <div
                key={m.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border px-2.5 py-1.5"
              >
                <div className="min-w-0">
                  <p className="text-sm capitalize">
                    {m.kind.replace(/_/g, " ")} · {formatDate(m.date)}
                    {m.time && ` ${m.time}`}
                  </p>
                  {(m.outcome || m.notes) && (
                    <p className="line-clamp-2 text-[11px] text-muted-foreground">{m.outcome ?? m.notes}</p>
                  )}
                </div>
                <RowActions
                  label={`Actions for the ${m.kind} meeting`}
                  onDelete={() =>
                    setPrompt({
                      title: "Delete this meeting?",
                      confirmLabel: "Delete",
                      destructive: true,
                      onConfirm: () =>
                        send(
                          () => removeMeeting({ id: caseData.id, meetingId: m.id }).unwrap(),
                          "Could not delete the meeting.",
                        ),
                    })
                  }
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
      <PromptDialog
        request={prompt}
        onClose={() => {
          setPrompt(null);
          setPending(null);
        }}
      />
    </Card>
  );
}
