"use client";

import { useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import {
  markStepComplete,
  prefillFromUpload,
  setCurrentStep,
} from "@/src/lib/stores/onboarding-slice";
import { useGetTenantSetupOptionsQuery } from "@/src/store/services/tenant-setup";
import { UploadCloud, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { downloadSetupTemplate, parseSetupFile } from "../bulk-template";

const ACCEPTED_EXTENSIONS = ["csv", "xlsx", "xls"];
/** The steps a clean upload fills in, and the review step it then opens. */
const PREFILLED_STEPS = [1, 2, 3];
const REVIEW_STEP = 4;

export function Step8BulkUpload() {
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  // Only modules the server can switch on get a row in the template.
  const { data: options } = useGetTenantSetupOptionsQuery();
  const offeredModuleIds = options?.data?.modules.map((m) => m.id);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setErrors([]);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setErrors(["Only .xlsx and .csv files are supported."]);
      return;
    }

    try {
      const parsed = await parseSetupFile(file, offeredModuleIds);
      if (parsed.errors.length > 0) {
        setErrors(parsed.errors);
        return;
      }
      dispatch(prefillFromUpload(parsed.setup));
      PREFILLED_STEPS.forEach((step) => dispatch(markStepComplete(step)));
      dispatch(setCurrentStep(REVIEW_STEP));
    } catch {
      setErrors([
        "This file could not be read. Save it as .xlsx or .csv and try again.",
      ]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Download the template, fill in the &quot;Your value&quot; column to match your company, then upload it.
        Every step is filled in for you and you go straight to the review, where you can still edit anything.
      </p>

      <button
        type="button"
        onClick={() => downloadSetupTemplate(offeredModuleIds)}
        className="flex items-center gap-2.5 self-start px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <FileText size={15} />
        Download Template (.xlsx)
      </button>

      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors",
          "hover:border-primary/40 hover:bg-muted/30"
        )}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <UploadCloud size={32} className="text-muted-foreground" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium text-foreground">
            {fileName ? fileName : "Click to upload or drag & drop"}
          </span>
          <span className="text-xs text-muted-foreground">.xlsx or .csv supported</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            // Cleared so the same file can be picked again once corrected.
            e.target.value = "";
          }}
        />
      </div>

      {errors.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle size={15} />
            <span className="text-sm font-medium">
              Fix {errors.length === 1 ? "this" : "these"} in the file and upload it again
            </span>
          </div>
          {errors.map((err, i) => (
            <span key={i} className="text-xs text-destructive">{err}</span>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={() => dispatch(setCurrentStep(1))}>
          Skip to Manual Setup
        </Button>
      </div>
    </div>
  );
}
