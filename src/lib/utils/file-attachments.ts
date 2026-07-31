/**
 * Shared plumbing for "attach a file to this record" flows — expense receipts,
 * approval submissions, and anything else that needs to keep a picked file
 * around without a backend.
 *
 * Files are held as data URLs so an attachment survives in session state and
 * can be previewed or downloaded straight from the browser.
 */

/** Ceiling per file. Data URLs live in memory, so keep them small. */
export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

export interface FileAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  /** `data:` URL — previewable and downloadable without a server. */
  dataUrl: string;
  uploadedAt: string;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** True for the mime types a browser can render inline in a new tab. */
export function isPreviewable(mimeType: string): boolean {
  return mimeType.startsWith("image/") || mimeType === "application/pdf";
}

export interface ReadAttachmentsResult {
  attachments: FileAttachment[];
  /** One message per file that was skipped, ready to surface to the user. */
  errors: string[];
}

/**
 * Reads a picked `FileList` into attachments, skipping anything over
 * `maxBytes`. Returns the failures rather than toasting them, so each caller
 * reports them in its own idiom.
 */
export async function readAttachments(
  list: FileList | null,
  { maxBytes = MAX_ATTACHMENT_BYTES }: { maxBytes?: number } = {},
): Promise<ReadAttachmentsResult> {
  const attachments: FileAttachment[] = [];
  const errors: string[] = [];
  if (!list || list.length === 0) return { attachments, errors };

  for (const file of Array.from(list)) {
    if (file.size > maxBytes) {
      errors.push(
        `"${file.name}" is ${formatBytes(file.size)} — files must be ${formatBytes(maxBytes)} or smaller.`,
      );
      continue;
    }
    try {
      attachments.push({
        id: `ATT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        dataUrl: await readFileAsDataUrl(file),
        uploadedAt: new Date().toISOString(),
      });
    } catch {
      errors.push(`Couldn't read "${file.name}".`);
    }
  }
  return { attachments, errors };
}
