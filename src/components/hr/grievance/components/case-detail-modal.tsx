"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { MessageSquare, Lock, AlertTriangle, Shield } from "lucide-react";
import type {
  AnyCase,
  GrievanceCase,
  DisciplinaryCase,
  GrievanceStatus,
  DisciplinaryStatus,
  CaseNote,
} from "../types";
import {
  GRIEVANCE_STATUS_CONFIG,
  DISCIPLINARY_STATUS_CONFIG,
  DISCIPLINARY_OUTCOME_CONFIG,
  PRIORITY_CONFIG,
  GRIEVANCE_CATEGORY_CONFIG,
  DISCIPLINARY_CATEGORY_CONFIG,
} from "../data";

interface Props {
  open: boolean;
  caseData: AnyCase | null;
  onClose: () => void;
  onAddNote: (id: string, note: Omit<CaseNote, "id">) => void;
  onUpdateStatus: (
    id: string,
    status: GrievanceStatus | DisciplinaryStatus,
  ) => void;
  onRecordOutcome: (
    id: string,
    outcome: string,
    outcomeDate: string,
    suspensionDays?: number,
  ) => void;
  onRaiseAppeal: (id: string) => void;
  onScheduleHearing: (id: string, date: string) => void;
}

export function CaseDetailModal({
  open,
  caseData,
  onClose,
  onAddNote,
  onUpdateStatus,
  onRecordOutcome,
  onRaiseAppeal,
  onScheduleHearing,
}: Props) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [outcome, setOutcome] = useState("");
  const [outcomeText, setOutcomeText] = useState("");
  const [outcomeDate, setOutcomeDate] = useState("");
  const [suspensionDays, setSuspensionDays] = useState("");
  const [hearingDate, setHearingDate] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingOutcome, setSavingOutcome] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setNoteContent("");
      setIsInternal(true);
      setOutcome("");
      setOutcomeText("");
      setOutcomeDate("");
      setSuspensionDays("");
      setHearingDate(caseData?.hearingDate ?? "");
    }
  }

  if (!caseData) return null;

  const isGrievance = caseData.type === "grievance";
  const grievance = isGrievance ? (caseData as GrievanceCase) : null;
  const disciplinary = !isGrievance ? (caseData as DisciplinaryCase) : null;

  const statusConfig = isGrievance
    ? GRIEVANCE_STATUS_CONFIG
    : DISCIPLINARY_STATUS_CONFIG;

  const currentStatusCfg =
    statusConfig[caseData.status as keyof typeof statusConfig];
  const priCfg = PRIORITY_CONFIG[caseData.priority];
  const categoryLabel = isGrievance
    ? GRIEVANCE_CATEGORY_CONFIG[grievance!.category].label
    : DISCIPLINARY_CATEGORY_CONFIG[disciplinary!.category].label;

  const grievanceStatusOptions: GrievanceStatus[] = [
    "raised",
    "under_investigation",
    "hearing_scheduled",
    "resolved",
    "closed",
  ];

  const disciplinaryStatusOptions: DisciplinaryStatus[] = [
    "reported",
    "investigation",
    "hearing_scheduled",
    "outcome_issued",
    "appealed",
    "closed",
  ];

  function handleAddNote() {
    if (!caseData) return;
    if (!noteContent.trim()) {
      toast.error("Note content cannot be empty.");
      return;
    }
    setSavingNote(true);
    setTimeout(() => {
      onAddNote(caseData.id, {
        authorName: "You",
        authorInitials: "YO",
        content: noteContent.trim(),
        createdAt: new Date().toISOString().split("T")[0],
        isInternal,
      });
      setNoteContent("");
      setSavingNote(false);
      toast.success("Note added.");
    }, 200);
  }

  function handleRecordOutcome() {
    if (!caseData) return;
    if (!outcomeDate) {
      toast.error("Please set an outcome date.");
      return;
    }
    if (isGrievance && !outcomeText.trim()) {
      toast.error("Please enter outcome details.");
      return;
    }
    if (!isGrievance && !outcome) {
      toast.error("Please select an outcome.");
      return;
    }
    setSavingOutcome(true);
    setTimeout(() => {
      const days = suspensionDays ? Number(suspensionDays) : undefined;
      onRecordOutcome(
        caseData.id,
        isGrievance ? outcomeText : outcome,
        outcomeDate,
        days,
      );
      setSavingOutcome(false);
      toast.success("Outcome recorded.");
    }, 200);
  }

  function handleScheduleHearing() {
    if (!caseData) return;
    if (!hearingDate) {
      toast.error("Please select a hearing date.");
      return;
    }
    onScheduleHearing(caseData.id, hearingDate);
    toast.success("Hearing date scheduled.");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v: boolean) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isGrievance
                  ? "bg-indigo-50 dark:bg-indigo-950/40"
                  : "bg-rose-50 dark:bg-rose-950/40"
              }`}
            >
              {isGrievance ? (
                <Shield className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <AlertTriangle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base">
                {caseData.caseNumber} &mdash; {caseData.employeeName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {caseData.employeeDept}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${currentStatusCfg.color} ${currentStatusCfg.bg} ${currentStatusCfg.border}`}
              >
                {currentStatusCfg.label}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${priCfg.color} ${priCfg.bg} ${priCfg.border}`}
              >
                {priCfg.label} Priority
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                {categoryLabel}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Description
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {caseData.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Date Raised</p>
                <p className="font-medium">
                  {new Date(caseData.dateRaised).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              {caseData.incidentDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Incident Date</p>
                  <p className="font-medium">
                    {new Date(caseData.incidentDate).toLocaleDateString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
              )}
              {caseData.assignedTo && (
                <div>
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="font-medium">{caseData.assignedTo}</p>
                </div>
              )}
              {caseData.hearingDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Hearing Date</p>
                  <p className="font-medium">
                    {new Date(caseData.hearingDate).toLocaleDateString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
              )}
              {disciplinary?.outcome && (
                <div>
                  <p className="text-xs text-muted-foreground">Outcome</p>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${DISCIPLINARY_OUTCOME_CONFIG[disciplinary.outcome].color} ${DISCIPLINARY_OUTCOME_CONFIG[disciplinary.outcome].bg} ${DISCIPLINARY_OUTCOME_CONFIG[disciplinary.outcome].border}`}
                  >
                    {DISCIPLINARY_OUTCOME_CONFIG[disciplinary.outcome].label}
                  </span>
                </div>
              )}
              {grievance?.outcome && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Outcome</p>
                  <p className="text-sm">{grievance.outcome}</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-semibold">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {(isGrievance
                  ? grievanceStatusOptions
                  : disciplinaryStatusOptions
                ).map((s) => {
                  const cfg = statusConfig[s as keyof typeof statusConfig];
                  const isCurrent = s === caseData.status;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={isCurrent}
                      onClick={() =>
                        onUpdateStatus(
                          caseData.id,
                          s as GrievanceStatus & DisciplinaryStatus,
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-opacity ${
                        isCurrent
                          ? "opacity-100 ring-1 ring-offset-1 ring-primary"
                          : "opacity-60 hover:opacity-100"
                      } ${cfg.color} ${cfg.bg} ${cfg.border}`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-semibold">Schedule Hearing</p>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={hearingDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setHearingDate(e.target.value)
                  }
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleScheduleHearing}
                >
                  Set Date
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-semibold">Record Outcome</p>
              {isGrievance ? (
                <div className="space-y-2">
                  <Textarea
                    value={outcomeText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setOutcomeText(e.target.value)
                    }
                    placeholder="Describe the resolution..."
                    rows={2}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Outcome Type</Label>
                    <Select value={outcome} onValueChange={setOutcome}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DISCIPLINARY_OUTCOME_CONFIG).map(
                          ([val, cfg]) => (
                            <SelectItem key={val} value={val}>
                              {cfg.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {outcome === "suspension" && (
                    <div className="space-y-1.5">
                      <Label>Suspension Days</Label>
                      <Input
                        type="number"
                        min="1"
                        value={suspensionDays}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSuspensionDays(e.target.value)
                        }
                        placeholder="Days"
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2 items-center">
                <Input
                  type="date"
                  value={outcomeDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setOutcomeDate(e.target.value)
                  }
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleRecordOutcome}
                  disabled={savingOutcome}
                >
                  {savingOutcome ? "Saving..." : "Record"}
                </Button>
              </div>
            </div>

            {!caseData.hasAppeal && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Raise Appeal</p>
                    <p className="text-xs text-muted-foreground">
                      Creates a linked appeal case for this decision.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onRaiseAppeal(caseData.id);
                      toast.success("Appeal case raised and linked.");
                    }}
                  >
                    Raise Appeal
                  </Button>
                </div>
              </>
            )}

            {caseData.hasAppeal && caseData.appealCaseId && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                Appeal linked:{" "}
                <span className="font-semibold">{caseData.appealCaseId}</span>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">Case Notes</p>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {caseData.notes.length}
                </span>
              </div>

              {caseData.notes.length === 0 && (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              )}

              {caseData.notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {note.authorInitials}
                      </div>
                      <p className="text-xs font-medium">{note.authorName}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {note.isInternal && (
                        <span className="flex items-center gap-0.5">
                          <Lock className="h-3 w-3" />
                          Internal
                        </span>
                      )}
                      <span>{note.createdAt}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 shrink-0 space-y-2">
          <Textarea
            value={noteContent}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNoteContent(e.target.value)
            }
            placeholder="Add a case note..."
            rows={2}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="internal-note-footer"
                checked={isInternal}
                onCheckedChange={(v: boolean) => setIsInternal(v)}
              />
              <label
                htmlFor="internal-note-footer"
                className="text-xs text-muted-foreground cursor-pointer select-none"
              >
                Internal note (HR only)
              </label>
            </div>
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={savingNote || !noteContent.trim()}
            >
              {savingNote ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
