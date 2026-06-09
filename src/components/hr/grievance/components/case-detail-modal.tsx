"use client";
import { formatDate } from "@/src/lib/utils/format-date";

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
import {
  MessageSquare,
  Lock,
  Scale,
  Check,
  Users,
  Paperclip,
} from "lucide-react";
import type { ERCase, CaseNote, CaseStage } from "../types";
import {
  CASE_STAGE_CONFIG,
  CASE_STAGE_ORDER,
  CASE_TYPE_CONFIG,
  CONFIDENTIALITY_CONFIG,
  CASE_OUTCOME_CONFIG,
  CASE_OUTCOME_OPTIONS,
  PRIORITY_CONFIG,
} from "../data";

const HR_OFFICERS = ["Rachel Mensah", "Amara Osei", "Kofi Asante"];

interface Props {
  open: boolean;
  caseData: ERCase | null;
  onClose: () => void;
  onAddNote: (id: string, note: Omit<CaseNote, "id">) => void;
  onUpdateCase: (id: string, patch: Partial<ERCase>) => void;
}

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function CaseDetailModal({
  open,
  caseData,
  onClose,
  onAddNote,
  onUpdateCase,
}: Props) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [savingNote, setSavingNote] = useState(false);

  // Per-stage capture fields
  const [hearingDate, setHearingDate] = useState("");
  const [hearingPanel, setHearingPanel] = useState("");
  const [outcome, setOutcome] = useState("");
  const [outcomeDate, setOutcomeDate] = useState("");
  const [appealReviewer, setAppealReviewer] = useState("");
  const [appealGrounds, setAppealGrounds] = useState("");
  const [retentionPeriod, setRetentionPeriod] = useState("");
  const [closureDate, setClosureDate] = useState("");

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && caseData) {
      setNoteContent("");
      setIsInternal(true);
      setHearingDate(caseData.hearingDate ?? "");
      setHearingPanel((caseData.hearingPanel ?? []).join(", "));
      setOutcome(typeof caseData.outcome === "string" ? caseData.outcome : "");
      setOutcomeDate(caseData.outcomeDate ?? "");
      setAppealReviewer(caseData.appealReviewer ?? "");
      setAppealGrounds(caseData.appealGrounds ?? "");
      setRetentionPeriod(caseData.retentionPeriod ?? "");
      setClosureDate(caseData.closureDate ?? "");
    }
  }

  if (!caseData) return null;

  const typeCfg = CASE_TYPE_CONFIG[caseData.complaintType];
  const stageCfg = CASE_STAGE_CONFIG[caseData.stage];
  const priCfg = PRIORITY_CONFIG[caseData.priority];
  const confCfg = CONFIDENTIALITY_CONFIG[caseData.confidentialityLevel];
  const currentStep = stageCfg.step;

  function setStage(stage: CaseStage) {
    if (!caseData) return;
    onUpdateCase(caseData.id, { stage });
    toast.success(`Moved to ${CASE_STAGE_CONFIG[stage].label}.`);
  }

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

  function saveHearing() {
    if (!caseData) return;
    const panel = hearingPanel
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onUpdateCase(caseData.id, {
      hearingDate: hearingDate || undefined,
      hearingPanel: panel,
      stage: "hearing",
    });
    toast.success("Hearing details saved.");
  }

  function saveOutcome() {
    if (!caseData) return;
    if (!outcome) {
      toast.error("Please select an outcome.");
      return;
    }
    onUpdateCase(caseData.id, {
      outcome,
      outcomeDate: outcomeDate || new Date().toISOString().split("T")[0],
      stage: "outcome_issued",
    });
    toast.success("Outcome recorded.");
  }

  function saveAppeal() {
    if (!caseData) return;
    if (!appealReviewer) {
      toast.error("Please name an appeal reviewer.");
      return;
    }
    onUpdateCase(caseData.id, {
      hasAppeal: true,
      appealCaseId:
        caseData.appealCaseId ??
        `APPEAL-${caseData.caseNumber.replace(/[^A-Z0-9]/gi, "")}`,
      appealReviewer,
      appealGrounds: appealGrounds || undefined,
      stage: "appeal",
    });
    toast.success("Appeal recorded.");
  }

  function saveClosure() {
    if (!caseData) return;
    onUpdateCase(caseData.id, {
      retentionPeriod: retentionPeriod || undefined,
      closureDate: closureDate || new Date().toISOString().split("T")[0],
      stage: "closed",
    });
    toast.success("Case closed.");
  }

  function saveAssignee(name: string) {
    if (!caseData) return;
    onUpdateCase(caseData.id, {
      assignedTo: name,
      assignedInitials: name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      stage: caseData.stage === "raised" || caseData.stage === "triage"
        ? "assigned"
        : caseData.stage,
    });
    toast.success("Case assigned.");
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
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeCfg.bg}`}
            >
              <Scale className={`h-4.5 w-4.5 ${typeCfg.color}`} />
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
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${stageCfg.color} ${stageCfg.bg} ${stageCfg.border}`}
              >
                {stageCfg.label}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeCfg.color} ${typeCfg.bg} ${typeCfg.border}`}
              >
                {typeCfg.label}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${priCfg.color} ${priCfg.bg} ${priCfg.border}`}
              >
                {priCfg.label} Priority
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${confCfg.color} ${confCfg.bg} ${confCfg.border}`}
              >
                {confCfg.label}
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
                <p className="font-medium">{fmt(caseData.dateRaised)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Incident Date</p>
                <p className="font-medium">{fmt(caseData.incidentDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assigned To</p>
                <p className="font-medium">{caseData.assignedTo ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hearing Date</p>
                <p className="font-medium">{fmt(caseData.hearingDate)}</p>
              </div>
              {caseData.outcome && (
                <div>
                  <p className="text-xs text-muted-foreground">Outcome</p>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                      CASE_OUTCOME_CONFIG[
                        caseData.outcome as keyof typeof CASE_OUTCOME_CONFIG
                      ]?.color ?? ""
                    } ${
                      CASE_OUTCOME_CONFIG[
                        caseData.outcome as keyof typeof CASE_OUTCOME_CONFIG
                      ]?.bg ?? ""
                    } ${
                      CASE_OUTCOME_CONFIG[
                        caseData.outcome as keyof typeof CASE_OUTCOME_CONFIG
                      ]?.border ?? ""
                    }`}
                  >
                    {CASE_OUTCOME_CONFIG[
                      caseData.outcome as keyof typeof CASE_OUTCOME_CONFIG
                    ]?.label ?? caseData.outcome}
                  </span>
                </div>
              )}
              {caseData.closureDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Closure Date</p>
                  <p className="font-medium">{fmt(caseData.closureDate)}</p>
                </div>
              )}
              {caseData.retentionPeriod && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Retention Period
                  </p>
                  <p className="font-medium">{caseData.retentionPeriod}</p>
                </div>
              )}
              {caseData.appealReviewer && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Appeal Reviewer
                  </p>
                  <p className="font-medium">{caseData.appealReviewer}</p>
                </div>
              )}
            </div>

            {/* Witnesses & Evidence summary */}
            {(caseData.witnesses.length > 0 ||
              caseData.evidence.length > 0 ||
              caseData.hearingPanel.length > 0) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {caseData.witnesses.length > 0 && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                      <Users className="h-3.5 w-3.5" /> Witnesses
                    </p>
                    <ul className="space-y-1">
                      {caseData.witnesses.map((w, i) => (
                        <li key={i} className="text-sm">
                          <span className="font-medium">{w.name}</span>
                          {w.statement ? (
                            <span className="text-muted-foreground">
                              {" "}
                              — {w.statement}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {caseData.evidence.length > 0 && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                      <Paperclip className="h-3.5 w-3.5" /> Evidence
                    </p>
                    <ul className="space-y-1">
                      {caseData.evidence.map((e, i) => (
                        <li key={i} className="text-sm text-foreground">
                          {e.name}
                          <span className="text-xs text-muted-foreground">
                            {" "}
                            ({fmt(e.uploadedAt)})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {caseData.hearingPanel.length > 0 && (
                  <div className="rounded-lg border border-border p-3 sm:col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Hearing Panel
                    </p>
                    <p className="text-sm">
                      {caseData.hearingPanel.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* 8-stage workflow stepper */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Workflow</p>
              <div className="flex flex-wrap gap-1.5">
                {CASE_STAGE_ORDER.map((stage) => {
                  const cfg = CASE_STAGE_CONFIG[stage];
                  const done = cfg.step < currentStep;
                  const current = cfg.step === currentStep;
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setStage(stage)}
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                        current
                          ? `${cfg.color} ${cfg.bg} ${cfg.border} ring-1 ring-offset-1 ring-primary`
                          : done
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "border-border bg-transparent text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {done ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="font-mono">{cfg.step}</span>
                      )}
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Click a stage to move the case. Capture stage data below.
              </p>
            </div>

            <Separator />

            {/* Per-stage capture */}
            <div className="space-y-5">
              {/* Assign */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Assign / Triage</Label>
                <Select
                  value={caseData.assignedTo ?? ""}
                  onValueChange={saveAssignee}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to HR officer" />
                  </SelectTrigger>
                  <SelectContent>
                    {HR_OFFICERS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hearing */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Hearing</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={hearingDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setHearingDate(e.target.value)
                    }
                  />
                  <Input
                    value={hearingPanel}
                    placeholder="Panel (comma separated)"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setHearingPanel(e.target.value)
                    }
                  />
                </div>
                <Button size="sm" variant="outline" onClick={saveHearing}>
                  Save hearing
                </Button>
              </div>

              {/* Outcome */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Outcome</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={outcome} onValueChange={setOutcome}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      {CASE_OUTCOME_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={outcomeDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setOutcomeDate(e.target.value)
                    }
                  />
                </div>
                <Button size="sm" variant="outline" onClick={saveOutcome}>
                  Record outcome
                </Button>
              </div>

              {/* Appeal */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Appeal</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={appealReviewer}
                    onValueChange={setAppealReviewer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Appeal reviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      {HR_OFFICERS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={appealGrounds}
                    placeholder="Grounds for appeal"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAppealGrounds(e.target.value)
                    }
                  />
                </div>
                <Button size="sm" variant="outline" onClick={saveAppeal}>
                  Record appeal
                </Button>
              </div>

              {/* Closure */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Closure</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={retentionPeriod}
                    placeholder="Retention period (e.g. 6 years)"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRetentionPeriod(e.target.value)
                    }
                  />
                  <Input
                    type="date"
                    value={closureDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setClosureDate(e.target.value)
                    }
                  />
                </div>
                <Button size="sm" variant="outline" onClick={saveClosure}>
                  Close case
                </Button>
              </div>
            </div>

            <Separator />

            {/* Notes */}
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
                      <span>{formatDate(note.createdAt)}</span>
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
