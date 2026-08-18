"use client";

import { Paperclip, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { FileDropzone } from "@/src/components/shared/file-dropzone";
import {
  formatBytes,
  isPreviewable,
  readAttachments,
} from "@/src/lib/utils/file-attachments";
import { cn } from "@/src/lib/utils";
import {
  JOINER_DOCUMENTS,
  type JoinerDocument,
  type JoinerDocumentKind,
} from "@/src/lib/types/onboarding";

interface DocumentsStepProps {
  documents: JoinerDocument[];
  onChange: (documents: JoinerDocument[]) => void;
}

/**
 * Identity and right-to-work uploads (client feedback §2.6). Before this, only
 * a profile photo was collected and everything else was chased over email.
 */
export function DocumentsStep({ documents, onChange }: DocumentsStepProps) {
  const byKind = new Map(documents.map((d) => [d.kind, d]));

  async function handleFiles(kind: JoinerDocumentKind, list: FileList | null) {
    const { attachments, errors } = await readAttachments(list);
    errors.forEach((message) => toast.error(message));
    if (attachments.length === 0) return;
    // One document per slot — a replacement supersedes what was there.
    const next = documents.filter((d) => d.kind !== kind);
    next.push({
      kind,
      file: attachments[0],
      uploadedAt: new Date().toISOString(),
    });
    onChange(next);
  }

  function remove(kind: JoinerDocumentKind) {
    onChange(documents.filter((d) => d.kind !== kind));
  }

  const missingRequired = JOINER_DOCUMENTS.filter(
    (spec) => spec.required && !byKind.has(spec.kind),
  );

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Documents &amp; right to work
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Clear photos or scans are fine. PDF, JPG or PNG, up to 2 MB each.
        </p>
      </div>
      <Separator />

      {missingRequired.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {missingRequired.length} required document
          {missingRequired.length === 1 ? "" : "s"} still to upload.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {JOINER_DOCUMENTS.map((spec) => {
          const doc = byKind.get(spec.kind);
          return (
            <div
              key={spec.kind}
              className={cn(
                "rounded-lg border p-4",
                doc ? "border-emerald-500/40 bg-emerald-500/5" : "border-border",
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {spec.label}
                    {spec.required && (
                      <span className="text-destructive"> *</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{spec.hint}</p>
                </div>
                {doc && (
                  <Check
                    className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-label="Uploaded"
                  />
                )}
              </div>

              {doc ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate text-foreground">
                      {doc.file.name}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      · {formatBytes(doc.file.sizeBytes)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={doc.file.dataUrl}
                      target="_blank"
                      rel="noreferrer"
                      {...(isPreviewable(doc.file.mimeType)
                        ? {}
                        : { download: doc.file.name })}
                      className="px-1 text-[11px] font-medium text-primary hover:underline"
                    >
                      {isPreviewable(doc.file.mimeType) ? "View" : "Download"}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => remove(spec.kind)}
                      aria-label={`Remove ${spec.label}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <FileDropzone
                  accept="image/*,.pdf"
                  hint="PDF, JPG or PNG — max 2 MB"
                  onFiles={(list) => handleFiles(spec.kind, list)}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Required documents the joiner hasn't uploaded yet, named for the review step. */
export function missingRequiredDocuments(
  documents: JoinerDocument[],
): string[] {
  const present = new Set(documents.map((d) => d.kind));
  return JOINER_DOCUMENTS.filter((s) => s.required && !present.has(s.kind)).map(
    (s) => s.label,
  );
}
