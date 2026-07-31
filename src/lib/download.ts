/** Trigger a browser download for a blob payload (PNG, XLSX, ...). */
export function downloadBlob(filename: string, blob: Blob) {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Revoking synchronously can abort the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Download any text payload as a file (CSV, ICS, ...). */
export function downloadFile(filename: string, content: string, mime: string) {
  if (typeof window === "undefined") return;
  downloadBlob(filename, new Blob([content], { type: mime }));
}
