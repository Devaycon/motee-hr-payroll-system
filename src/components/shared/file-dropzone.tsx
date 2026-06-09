"use client";

import * as React from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/src/lib/utils";

export interface FileDropzoneProps {
  /** Called with the picked files when the user selects or drops them. */
  onFiles?: (files: FileList | null) => void;
  /** Allow selecting more than one file. */
  multiple?: boolean;
  /** Native `accept` filter (e.g. ".pdf,.png" or "image/*"). */
  accept?: string;
  /** Render a non-interactive preview (no picker, dimmed). */
  disabled?: boolean;
  /** Primary call-to-action line. */
  label?: React.ReactNode;
  /** Secondary hint line (e.g. accepted formats). */
  hint?: React.ReactNode;
  /** Icon shown in the circle. Defaults to an upload-cloud glyph. */
  icon?: React.ReactNode;
  className?: string;
}

/**
 * A styled replacement for the ugly native `<input type="file">` control.
 *
 * The real file input is visually hidden (`sr-only`) and wrapped in a `<label>`,
 * so clicking anywhere in the dropzone — or dragging files onto it — opens the
 * picker. Pass {@link FileDropzoneProps.disabled} for a read-only preview.
 */
export function FileDropzone({
  onFiles,
  multiple,
  accept,
  disabled,
  label,
  hint,
  icon,
  className,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const content = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors",
          !disabled && "group-hover:bg-primary/10 group-hover:text-primary",
        )}
      >
        {icon ?? <UploadCloud className="h-4.5 w-4.5" />}
      </span>
      <span className="text-sm font-medium text-foreground">
        {label ?? (
          <>
            <span className="text-primary">Click to upload</span> or drag &amp;
            drop
          </>
        )}
      </span>
      {hint && (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      )}
    </>
  );

  const base =
    "group flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-center transition-colors";

  if (disabled) {
    return (
      <div className={cn(base, "opacity-70", className)} aria-disabled>
        {content}
      </div>
    );
  }

  return (
    <label
      className={cn(
        base,
        "cursor-pointer hover:border-primary/60 hover:bg-primary/5",
        isDragging && "border-primary/60 bg-primary/5",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        onFiles?.(e.dataTransfer.files);
      }}
    >
      {content}
      <input
        type="file"
        multiple={multiple}
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          onFiles?.(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}
