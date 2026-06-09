"use client";
import { formatDate } from "@/src/lib/utils/format-date";

import { useRef } from "react";
import { AlertCircle, Download, Eye, FileText, Upload, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import type { VerificationStage, VerificationHistoryEntry } from "../types";
import { STAGE_ICONS, STAGE_STYLES } from "../data";

type VerificationDocProps = {
  label: string;
  description: string;
  numberLabel: string;
  number: string;
  setNumber: (v: string) => void;
  status: VerificationStage;
  setStatus: (v: VerificationStage) => void;
  file: string | null;
  setFile: (v: string | null) => void;
  history: VerificationHistoryEntry[];
};

function VerificationDocCard({
  label,
  description,
  numberLabel,
  number,
  setNumber,
  status,
  setStatus,
  file,
  setFile,
  history,
}: VerificationDocProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 shrink-0 ${STAGE_STYLES[status]}`}
        >
          {status}
        </Badge>
      </CardHeader>
      <CardContent className="px-4 pb-4 flex flex-col gap-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            {numberLabel}
          </Label>
          <Input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            Supporting Document
          </Label>
          {file ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-foreground flex-1 truncate">
                {file}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground"
                >
                  <Eye className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground"
                >
                  <Download className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground"
                  onClick={() => setFile(null)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 px-4 py-5 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-accent transition-colors"
            >
              <Upload className="w-5 h-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Click to upload PDF, DOC, PNG, or JPG (max 5 MB)
              </p>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setFile(e.target.files[0].name);
            }}
          />
        </div>

        {status === "Rejected" && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-red-400/30 bg-red-400/5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-red-500">
                Rejection reason:{" "}
              </span>
              Document quality insufficient — please re-upload a clearer scan.
            </p>
          </div>
        )}

        <Separator />

        <div>
          <p className="text-xs font-medium text-foreground mb-2">
            Status History
          </p>
          <div className="flex flex-col gap-2">
            {history.map((entry, idx) => {
              const Icon = STAGE_ICONS[entry.stage];
              return (
                <div key={idx} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${STAGE_STYLES[entry.stage]}`}
                  >
                    {entry.stage}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(entry.date)}
                  </span>
                  {entry.reviewer && (
                    <span className="text-xs text-muted-foreground">
                      · {entry.reviewer}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 w-full"
          onClick={() => setStatus("Submitted")}
          disabled={
            status === "Verified" ||
            status === "Submitted" ||
            status === "Under Review"
          }
        >
          <Upload className="w-3.5 h-3.5" />
          {status === "Verified" ? "Verified" : "Submit for Verification"}
        </Button>
      </CardContent>
    </Card>
  );
}

type VerificationTabProps = {
  cacLabel: string;
  cacDescription: string;
  cacNumberLabel: string;
  cacNumber: string;
  setCacNumber: (v: string) => void;
  cacStatus: VerificationStage;
  setCacStatus: (v: VerificationStage) => void;
  cacFile: string | null;
  setCacFile: (v: string | null) => void;
  cacHistory: VerificationHistoryEntry[];
  tinLabel: string;
  tinDescription: string;
  tinNumberLabel: string;
  tinNumber: string;
  setTinNumber: (v: string) => void;
  tinStatus: VerificationStage;
  setTinStatus: (v: VerificationStage) => void;
  tinFile: string | null;
  setTinFile: (v: string | null) => void;
  tinHistory: VerificationHistoryEntry[];
};

export function VerificationTab({
  cacLabel,
  cacDescription,
  cacNumberLabel,
  cacNumber,
  setCacNumber,
  cacStatus,
  setCacStatus,
  cacFile,
  setCacFile,
  cacHistory,
  tinLabel,
  tinDescription,
  tinNumberLabel,
  tinNumber,
  setTinNumber,
  tinStatus,
  setTinStatus,
  tinFile,
  setTinFile,
  tinHistory,
}: VerificationTabProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <VerificationDocCard
        label={cacLabel}
        description={cacDescription}
        numberLabel={cacNumberLabel}
        number={cacNumber}
        setNumber={setCacNumber}
        status={cacStatus}
        setStatus={setCacStatus}
        file={cacFile}
        setFile={setCacFile}
        history={cacHistory}
      />
      <VerificationDocCard
        label={tinLabel}
        description={tinDescription}
        numberLabel={tinNumberLabel}
        number={tinNumber}
        setNumber={setTinNumber}
        status={tinStatus}
        setStatus={setTinStatus}
        file={tinFile}
        setFile={setTinFile}
        history={tinHistory}
      />
    </div>
  );
}
