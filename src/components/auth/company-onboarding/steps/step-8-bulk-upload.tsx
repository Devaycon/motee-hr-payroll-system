"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { prefillFromUpload, setCurrentStep } from "@/src/lib/stores/onboarding-slice";
import {
  CompanySetup,
  AVAILABLE_MODULES,
} from "@/src/lib/types/onboarding-setup.types";
import { UploadCloud, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

const uploadSchema = z.object({
  companyName: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  country: z.string().optional(),
  companyEmailDomain: z.string().optional(),
  managerTitle: z.string().optional(),
  departmentLabel: z.string().optional(),
  structureType: z.enum(["hierarchical", "flat"]).optional(),
  accessControlModel: z.enum(["RBAC", "PERMISSION", "HYBRID"]).optional(),
  roles: z.string().optional(),
  permissions: z.string().optional(),
  enabledModules: z.string().optional(),
  leaveApproval: z.enum(["manager", "hr", "both"]).optional(),
  multiLevelApproval: z.string().optional(),
  managerLabel: z.string().optional(),
  employeeIdLabel: z.string().optional(),
});

type UploadRow = z.infer<typeof uploadSchema>;

function mapRowToSetup(row: UploadRow): Partial<CompanySetup> {
  const result: Partial<CompanySetup> = {};

  if (row.companyName || row.industry || row.companySize || row.country || row.companyEmailDomain) {
    result.companyProfile = {
      companyName: row.companyName?.trim() ?? "",
      industry: row.industry?.trim() ?? "",
      companySize: row.companySize?.trim() ?? "",
      country: row.country?.trim() ?? "",
      companyEmailDomain: row.companyEmailDomain?.trim() ?? "",
    };
  }

  if (row.managerTitle || row.departmentLabel || row.structureType) {
    result.organizationConfig = {
      managerTitle: row.managerTitle?.trim() ?? "Line Manager",
      departmentLabel: row.departmentLabel?.trim() ?? "Department",
      structureType: row.structureType ?? "hierarchical",
    };
  }

  if (row.accessControlModel) {
    result.accessControlConfig = {
      model: row.accessControlModel,
      roles: row.roles
        ? row.roles.split(",").map((r) => ({ id: r.trim().toLowerCase(), name: r.trim(), originalName: r.trim() }))
        : [],
      permissions: row.permissions ? row.permissions.split(",").map((p) => p.trim()) : [],
    };
  }

  if (row.enabledModules) {
    const moduleIds = AVAILABLE_MODULES.map((m) => m.id);
    result.enabledModules = row.enabledModules
      .split(",")
      .map((m) => m.trim().toLowerCase().replace(/\s+/g, "-"))
      .filter((m) => moduleIds.includes(m));
  }

  if (row.leaveApproval || row.multiLevelApproval) {
    result.workflowConfig = {
      leaveApproval: row.leaveApproval ?? "manager",
      multiLevelApproval: row.multiLevelApproval?.toLowerCase() === "true",
      autoApproval: false,
    };
  }

  if (row.managerLabel || row.employeeIdLabel || row.departmentLabel) {
    result.uiLabels = {
      manager: row.managerLabel?.trim() ?? "Manager",
      employeeId: row.employeeIdLabel?.trim() ?? "Employee ID",
      department: row.departmentLabel?.trim() ?? "Department",
    };
  }

  return result;
}

const TEMPLATE_CSV = `companyName,industry,companySize,country,companyEmailDomain,managerTitle,departmentLabel,structureType,accessControlModel,roles,permissions,enabledModules,leaveApproval,multiLevelApproval,managerLabel,employeeIdLabel
Acme Corp,Technology,50-200,Nigeria,acme.com,Line Manager,Department,hierarchical,RBAC,"Admin,HR,Manager,Employee","view_employees,approve_leave","employee-management,attendance,leave-management",manager,false,Manager,Employee ID`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "motee-onboarding-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function Step8BulkUpload() {
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState("");

  const parseAndPrefill = (rawData: Record<string, string>[]) => {
    setErrors([]);
    setSuccess(false);

    if (!rawData.length) {
      setErrors(["File is empty or has no valid rows."]);
      return;
    }

    const row = rawData[0];
    const parsed = uploadSchema.safeParse(row);

    if (!parsed.success) {
      setErrors(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
      return;
    }

    const mapped = mapRowToSetup(parsed.data);
    dispatch(prefillFromUpload(mapped));
    setSuccess(true);
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => parseAndPrefill(result.data),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
        parseAndPrefill(json);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setErrors(["Only .csv and .xlsx files are supported."]);
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
        Download the template, fill it in offline, then upload to auto-prefill your onboarding configuration.
        You can edit any field before final submission.
      </p>

      <button
        type="button"
        onClick={downloadTemplate}
        className="flex items-center gap-2.5 self-start px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <FileText size={15} />
        Download Template (.csv)
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
          <span className="text-xs text-muted-foreground">.csv or .xlsx supported</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {errors.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle size={15} />
            <span className="text-sm font-medium">Upload errors</span>
          </div>
          {errors.map((err, i) => (
            <span key={i} className="text-xs text-destructive">{err}</span>
          ))}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
          <CheckCircle2 size={15} className="text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            Data loaded successfully. Review your onboarding steps before submitting.
          </span>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={() => dispatch(setCurrentStep(1))}>
          Skip to Manual Setup
        </Button>
        {success && (
          <Button
            type="button"
            onClick={() => dispatch(setCurrentStep(1))}
            style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}
          >
            Review & Continue
          </Button>
        )}
      </div>
    </div>
  );
}
