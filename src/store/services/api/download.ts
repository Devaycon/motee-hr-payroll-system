import { downloadBlob } from "@/src/lib/download";

export interface DownloadedFile {
  fileName: string;
}

function fileNameFrom(response: Response, fallback: string): string {
  const header = response.headers.get("Content-Disposition") ?? "";
  const encoded = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim().replace(/^"|"$/g, ""));
    } catch {
      // fall through to the plain form
    }
  }
  return /filename="?([^";]+)"?/i.exec(header)?.[1]?.trim() ?? fallback;
}

/**
 * Response handler for endpoints that stream a file. The bytes go straight to
 * a browser download and only the file name is kept — a Blob does not belong
 * in the Redux cache.
 */
export const saveFileResponse =
  (fallbackName: string) =>
  async (response: Response): Promise<unknown> => {
    if (!response.ok) {
      // Failures still come back as the JSON envelope (or an empty body).
      return response.json().catch(() => null);
    }
    const fileName = fileNameFrom(response, fallbackName);
    downloadBlob(fileName, await response.blob());
    return { fileName } satisfies DownloadedFile;
  };
