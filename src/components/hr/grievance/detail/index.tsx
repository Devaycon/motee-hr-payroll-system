"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  MessageSquare,
  Lock,
  CheckCircle2,
  Circle,
  Scale,
  Users,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  EmployeePicker,
  EmployeeMultiPicker,
  type PickedEmployee,
} from "@/src/components/shared/employee-picker";
import { EmployeeLink } from "@/src/components/shared/employee-link";
import { formatDate, formatDateTime } from "@/src/lib/utils/format-date";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  seedCountry,
  updateCase,
  addNote,
} from "@/src/lib/stores/er-cases-slice";
import {
  NOTE_VISIBILITY_LABELS,
  SLA_LABELS,
  SLA_STYLES,
  daysOpen,
  slaState,
  type NoteVisibility,
  type CaseStage,
  type CaseNote,
  type CasePriority,
  type CaseWitness,
  type CaseEvidence,
  type ERCase,
} from "../types";
import { canAdvanceTo, stagesForCase } from "@/src/lib/types/case-workflow";
import {
  CASE_STAGE_CONFIG,
  CASE_TYPE_CONFIG,
  CONFIDENTIALITY_CONFIG,
  CASE_OUTCOME_CONFIG,
  CASE_OUTCOME_OPTIONS,
  PRIORITY_CONFIG,
  PRIORITY_OPTIONS,
} from "../data";
import { useCasesData } from "../hooks";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function CaseDetailPage({ caseId }: { caseId: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const country = useAppSelector((s) => s.locale.country);
  const casesByCountry = useAppSelector((s) => s.erCases.byCountry[country]);
  // Seeds the shared slice the same way the list page does, so opening this
  // detail page directly (not via "View" from the table) still finds data.
  const { data, loading } = useCasesData();
  useEffect(() => {
    if (data && !casesByCountry) {
      dispatch(seedCountry({ country, cases: data }));
    }
  }, [data, casesByCountry, country, dispatch]);

  const caseData = (casesByCountry ?? []).find((c) => c.id === caseId) ?? null;

  // ---- Per-stage capture state. Initialized once the case first becomes
  // available (it may not be on the very first render, before the seed
  // effect above has run). Set during render rather than in an effect —
  // the same "adjust state when an input changes" pattern the old modal
  // used for `prevOpen`/`open` — so there's no extra render pass.
  const [initializedFor, setInitializedFor] = useState<string | null>(null);

  const [priority, setPriority] = useState<CasePriority>("medium");
  const [targetResolutionDate, setTargetResolutionDate] = useState("");

  const [investigatorId, setInvestigatorId] = useState<string | undefined>();
  const [investigatorName, setInvestigatorName] = useState<
    string | undefined
  >();
  const [investigatorInitials, setInvestigatorInitials] = useState<
    string | undefined
  >();
  const [caseOwnerId, setCaseOwnerId] = useState<string | undefined>();
  const [caseOwnerName, setCaseOwnerName] = useState<string | undefined>();

  const [witnesses, setWitnesses] = useState<CaseWitness[]>([]);
  const [evidence, setEvidence] = useState<CaseEvidence[]>([]);

  const [hearingDate, setHearingDate] = useState("");
  const [hearingPanelIds, setHearingPanelIds] = useState<string[]>([]);
  const [hearingPanelNames, setHearingPanelNames] = useState<string[]>([]);

  const [outcome, setOutcome] = useState("");
  const [outcomeDate, setOutcomeDate] = useState("");

  const [appealReviewerId, setAppealReviewerId] = useState<
    string | undefined
  >();
  const [appealReviewerName, setAppealReviewerName] = useState<
    string | undefined
  >();
  const [appealGrounds, setAppealGrounds] = useState("");

  const [noteContent, setNoteContent] = useState("");
  const [noteVisibility, setNoteVisibility] =
    useState<NoteVisibility>("hr_only");
  const [savingNote, setSavingNote] = useState(false);

  if (caseData && initializedFor !== caseData.id) {
    setInitializedFor(caseData.id);
    setPriority(caseData.priority);
    setTargetResolutionDate(caseData.targetResolutionDate ?? "");
    setInvestigatorId(caseData.assignedToId);
    setInvestigatorName(caseData.assignedTo);
    setInvestigatorInitials(caseData.assignedInitials);
    setCaseOwnerName(caseData.caseOwner);
    setWitnesses(caseData.witnesses ?? []);
    setEvidence(caseData.evidence ?? []);
    setHearingDate(caseData.hearingDate ?? "");
    setHearingPanelIds(caseData.hearingPanelIds ?? []);
    setHearingPanelNames(caseData.hearingPanel ?? []);
    setOutcome(typeof caseData.outcome === "string" ? caseData.outcome : "");
    setOutcomeDate(caseData.outcomeDate ?? "");
    setAppealReviewerId(caseData.appealReviewerId);
    setAppealReviewerName(caseData.appealReviewer);
    setAppealGrounds(caseData.appealGrounds ?? "");
  }

  function applyUpdate(patch: Partial<ERCase>) {
    if (!caseData) return;
    const today = new Date().toISOString().split("T")[0];
    dispatch(
      updateCase({
        country,
        id: caseData.id,
        patch: { ...patch, updatedAt: today },
      }),
    );
  }

  /**
   * Saves a stage panel's fields and advances the stage in one dispatch, so
   * there's never a separate "save" then "advance" step. Gates are checked
   * against the case as it *will* be after `patch` is applied — otherwise a
   * field being set in this very save (e.g. priority at Triage) would
   * incorrectly still look missing.
   */
  function tryAdvance(target: CaseStage, patch: Partial<ERCase> = {}) {
    if (!caseData) return;
    const candidate = { ...caseData, ...patch } as ERCase;
    const { allowed, blockers } = canAdvanceTo(candidate, target);
    if (!allowed) {
      toast.error(`Can't move to ${CASE_STAGE_CONFIG[target].label} yet`, {
        description: blockers.join(" · "),
      });
      return;
    }
    const at = new Date().toISOString();
    applyUpdate({
      ...patch,
      stage: target,
      activity: [
        ...(caseData.activity ?? []),
        {
          id: `act-${at}`,
          at,
          actorName: "You",
          action: "Stage changed",
          detail: `${CASE_STAGE_CONFIG[caseData.stage].label} → ${CASE_STAGE_CONFIG[target].label}`,
        },
      ],
    });
    toast.success(`Moved to ${CASE_STAGE_CONFIG[target].label}.`);
  }

  function stageReachedAt(stage: CaseStage): string | undefined {
    const label = CASE_STAGE_CONFIG[stage].label;
    const entries = (caseData?.activity ?? []).filter(
      (a) => a.action === "Stage changed" && a.detail?.endsWith(`→ ${label}`),
    );
    return entries.length > 0 ? entries[entries.length - 1].at : undefined;
  }

  function handleAddNote() {
    if (!caseData) return;
    if (!noteContent.trim()) {
      toast.error("Note content cannot be empty.");
      return;
    }
    setSavingNote(true);
    setTimeout(() => {
      const note: CaseNote = {
        id: generateId(),
        authorName: "You",
        authorInitials: "YO",
        content: noteContent.trim(),
        createdAt: new Date().toISOString().split("T")[0],
        visibility: noteVisibility,
        isInternal: noteVisibility !== "employee_visible",
      };
      dispatch(addNote({ country, id: caseData.id, note }));
      setNoteContent("");
      setSavingNote(false);
      toast.success(
        `Note added — visible to ${NOTE_VISIBILITY_LABELS[noteVisibility]}.`,
      );
    }, 200);
  }

  if (loading && !caseData) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-start gap-4 py-12">
        <h1 className="text-2xl font-semibold text-foreground">
          Case not found
        </h1>
        <p className="text-sm text-muted-foreground">
          It may have been deleted, or it belongs to a different tenant.
        </p>
        <Button variant="outline" onClick={() => router.push("/admin/grievance")}>
          <ChevronLeft className="size-4" /> Back to cases
        </Button>
      </div>
    );
  }

  const typeCfg = CASE_TYPE_CONFIG[caseData.complaintType];
  const stageCfg = CASE_STAGE_CONFIG[caseData.stage];
  const priCfg = PRIORITY_CONFIG[caseData.priority];
  const confCfg = CONFIDENTIALITY_CONFIG[caseData.confidentialityLevel];
  const sla = slaState(caseData);
  const outcomeCfg = caseData.outcome
    ? CASE_OUTCOME_CONFIG[caseData.outcome as keyof typeof CASE_OUTCOME_CONFIG]
    : undefined;

  const flow = stagesForCase(caseData.complaintType);
  const currentIndex = flow.indexOf(caseData.stage);
  const nextStage: CaseStage | undefined = flow[currentIndex + 1];
  const hasAppealStage = flow.includes("appeal");

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="pt-6">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 -ml-2 mb-3 gap-1 text-muted-foreground"
          onClick={() => router.push("/admin/grievance")}
        >
          <ChevronLeft className="size-4" /> Cases
        </Button>

        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeCfg.bg}`}
          >
            <Scale className={`h-5 w-5 ${typeCfg.color}`} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-foreground">
              {caseData.caseNumber}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <EmployeeLink
                name={caseData.employeeName}
                employeeId={caseData.employeeId}
                initials={caseData.employeeInitials}
                avatarClassName="h-6 w-6"
                nameClassName="text-sm"
              />
              <span className="text-sm text-muted-foreground">
                · {caseData.employeeDept}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
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
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${SLA_STYLES[sla]}`}
          >
            {SLA_LABELS[sla]}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-3 lg:grid-cols-5">
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Case Owner
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {caseData.caseOwner ?? "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Assigned Investigator
                  </p>
                  {caseData.assignedTo ? (
                    <EmployeeLink
                      name={caseData.assignedTo}
                      employeeId={caseData.assignedToId}
                      initials={caseData.assignedInitials}
                      avatarClassName="h-5 w-5"
                      nameClassName="text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground/70">
                      Unassigned
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Target Resolution
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(caseData.targetResolutionDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Days Open
                  </p>
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {daysOpen(caseData)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Confidentiality
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {confCfg.label}
                  </p>
                </div>
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
                  <p className="font-medium">{formatDate(caseData.dateRaised)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Incident Date
                  </p>
                  <p className="font-medium">
                    {formatDate(caseData.incidentDate)}
                  </p>
                </div>
              </div>

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
                              ({formatDate(e.uploadedAt)})
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
            </CardContent>
          </Card>

          {/* Next Step — exactly one panel, chosen by the case's current stage. */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Next Step</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.stage === "closed" && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">
                    Case closed on {formatDate(caseData.closureDate)}
                  </p>
                  {outcomeCfg && (
                    <p className="text-sm text-muted-foreground">
                      Outcome: {outcomeCfg.label}
                    </p>
                  )}
                  {caseData.hasAppeal && caseData.appealReviewer && (
                    <p className="text-sm text-muted-foreground">
                      Appeal reviewed by {caseData.appealReviewer}
                      {caseData.appealGrounds
                        ? ` — ${caseData.appealGrounds}`
                        : ""}
                    </p>
                  )}
                </div>
              )}

              {caseData.stage === "raised" && nextStage && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Nothing else to fill in yet — ready to move this case into
                    triage.
                  </p>
                  <Button onClick={() => tryAdvance(nextStage)}>
                    Move to {CASE_STAGE_CONFIG[nextStage].label}
                  </Button>
                </div>
              )}

              {caseData.stage === "triage" && nextStage && (() => {
                const candidate = {
                  ...caseData,
                  priority,
                  targetResolutionDate: targetResolutionDate || undefined,
                } as ERCase;
                const { blockers } = canAdvanceTo(candidate, nextStage);
                return (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Priority</Label>
                        <Select
                          value={priority}
                          onValueChange={(v) => setPriority(v as CasePriority)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Target Resolution Date</Label>
                        <Input
                          type="date"
                          value={targetResolutionDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTargetResolutionDate(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <Button
                      disabled={blockers.length > 0}
                      onClick={() =>
                        tryAdvance(nextStage, {
                          priority,
                          targetResolutionDate:
                            targetResolutionDate || undefined,
                        })
                      }
                    >
                      Move to {CASE_STAGE_CONFIG[nextStage].label}
                    </Button>
                    {blockers.length > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {blockers.join(" · ")}
                      </p>
                    )}
                  </div>
                );
              })()}

              {caseData.stage === "assigned" && nextStage && (() => {
                const candidate = {
                  ...caseData,
                  assignedTo: investigatorName,
                  assignedInitials: investigatorInitials,
                  assignedToId: investigatorId,
                  caseOwner: caseOwnerName,
                } as ERCase;
                const { blockers } = canAdvanceTo(candidate, nextStage);
                return (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Investigator</Label>
                      <EmployeePicker
                        value={investigatorId}
                        placeholder="Assign an investigator…"
                        onChange={(emp: PickedEmployee | null) => {
                          setInvestigatorId(emp?.id);
                          setInvestigatorName(emp?.name);
                          setInvestigatorInitials(emp?.initials);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label>Case Owner</Label>
                        {investigatorId && (
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => {
                              setCaseOwnerId(investigatorId);
                              setCaseOwnerName(investigatorName);
                            }}
                          >
                            Same as investigator
                          </button>
                        )}
                      </div>
                      <EmployeePicker
                        value={caseOwnerId}
                        placeholder="Name a case owner…"
                        onChange={(emp: PickedEmployee | null) => {
                          setCaseOwnerId(emp?.id);
                          setCaseOwnerName(emp?.name);
                        }}
                      />
                    </div>
                    <Button
                      disabled={blockers.length > 0}
                      onClick={() =>
                        tryAdvance(nextStage, {
                          assignedTo: investigatorName,
                          assignedInitials: investigatorInitials,
                          assignedToId: investigatorId,
                          caseOwner: caseOwnerName,
                        })
                      }
                    >
                      Move to {CASE_STAGE_CONFIG[nextStage].label}
                    </Button>
                    {blockers.length > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {blockers.join(" · ")}
                      </p>
                    )}
                  </div>
                );
              })()}

              {caseData.stage === "investigation" && (() => {
                const cleanWitnesses = witnesses.filter((w) => w.name.trim());
                const cleanEvidence = evidence.filter((e) => e.name.trim());
                const candidate = {
                  ...caseData,
                  witnesses: cleanWitnesses,
                  evidence: cleanEvidence,
                } as ERCase;
                const { blockers } = nextStage
                  ? canAdvanceTo(candidate, nextStage)
                  : { blockers: [] as string[] };
                return (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Witnesses</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() =>
                            setWitnesses((w) => [
                              ...w,
                              { name: "", statement: "" },
                            ])
                          }
                        >
                          <Plus className="h-3 w-3" /> Add
                        </Button>
                      </div>
                      {witnesses.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No witnesses added.
                        </p>
                      )}
                      {witnesses.map((w, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input
                              value={w.name}
                              placeholder="Name"
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                              ) =>
                                setWitnesses((arr) =>
                                  arr.map((x, j) =>
                                    j === i
                                      ? { ...x, name: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                            />
                            <Input
                              value={w.statement ?? ""}
                              placeholder="Statement (optional)"
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                              ) =>
                                setWitnesses((arr) =>
                                  arr.map((x, j) =>
                                    j === i
                                      ? { ...x, statement: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() =>
                              setWitnesses((arr) =>
                                arr.filter((_, j) => j !== i),
                              )
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Evidence</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() =>
                            setEvidence((e) => [
                              ...e,
                              {
                                name: "",
                                uploadedAt: new Date()
                                  .toISOString()
                                  .split("T")[0],
                              },
                            ])
                          }
                        >
                          <Plus className="h-3 w-3" /> Add
                        </Button>
                      </div>
                      {evidence.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No evidence uploaded.
                        </p>
                      )}
                      {evidence.map((ev, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={ev.name}
                            placeholder="File name or reference"
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              setEvidence((arr) =>
                                arr.map((x, j) =>
                                  j === i
                                    ? { ...x, name: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() =>
                              setEvidence((arr) =>
                                arr.filter((_, j) => j !== i),
                              )
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          applyUpdate({
                            witnesses: cleanWitnesses,
                            evidence: cleanEvidence,
                          })
                        }
                      >
                        Save investigation notes
                      </Button>
                      {nextStage && (
                        <Button
                          disabled={blockers.length > 0}
                          onClick={() =>
                            tryAdvance(nextStage, {
                              witnesses: cleanWitnesses,
                              evidence: cleanEvidence,
                            })
                          }
                        >
                          Move to {CASE_STAGE_CONFIG[nextStage].label}
                        </Button>
                      )}
                    </div>
                    {blockers.length > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {blockers.join(" · ")}
                      </p>
                    )}
                  </div>
                );
              })()}

              {caseData.stage === "hearing" && nextStage && (() => {
                const candidate = {
                  ...caseData,
                  hearingDate: hearingDate || undefined,
                  hearingPanel: hearingPanelNames,
                } as ERCase;
                const { blockers } = canAdvanceTo(candidate, nextStage);
                return (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Hearing Date</Label>
                      <Input
                        type="date"
                        value={hearingDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setHearingDate(e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Hearing Panel</Label>
                      <EmployeeMultiPicker
                        value={hearingPanelIds}
                        placeholder="Select panel members…"
                        onChange={(picked: PickedEmployee[]) => {
                          setHearingPanelIds(picked.map((e) => e.id));
                          setHearingPanelNames(picked.map((e) => e.name));
                        }}
                      />
                    </div>
                    <Button
                      disabled={blockers.length > 0}
                      onClick={() =>
                        tryAdvance(nextStage, {
                          hearingDate: hearingDate || undefined,
                          hearingPanelIds:
                            hearingPanelIds.length > 0
                              ? hearingPanelIds
                              : undefined,
                          hearingPanel: hearingPanelNames,
                        })
                      }
                    >
                      Move to {CASE_STAGE_CONFIG[nextStage].label}
                    </Button>
                    {blockers.length > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {blockers.join(" · ")}
                      </p>
                    )}
                  </div>
                );
              })()}

              {caseData.stage === "outcome_issued" && (() => {
                const today = new Date().toISOString().split("T")[0];
                const basePatch = {
                  outcome: outcome || undefined,
                  outcomeDate: outcomeDate || today,
                };
                const closeCandidate = {
                  ...caseData,
                  ...basePatch,
                } as ERCase;
                const closeCheck = canAdvanceTo(closeCandidate, "closed");
                const appealCheck = hasAppealStage
                  ? canAdvanceTo(closeCandidate, "appeal")
                  : null;
                return (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Outcome</Label>
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
                      </div>
                      <div className="space-y-1.5">
                        <Label>Outcome Date</Label>
                        <Input
                          type="date"
                          value={outcomeDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setOutcomeDate(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {hasAppealStage ? (
                        <>
                          <Button
                            variant="outline"
                            disabled={closeCheck.blockers.length > 0}
                            onClick={() => tryAdvance("closed", basePatch)}
                          >
                            No appeal — close case
                          </Button>
                          <Button
                            disabled={(appealCheck?.blockers.length ?? 0) > 0}
                            onClick={() => tryAdvance("appeal", basePatch)}
                          >
                            Record an appeal instead
                          </Button>
                        </>
                      ) : (
                        <Button
                          disabled={closeCheck.blockers.length > 0}
                          onClick={() => tryAdvance("closed", basePatch)}
                        >
                          Close case
                        </Button>
                      )}
                    </div>
                    {closeCheck.blockers.length > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {closeCheck.blockers.join(" · ")}
                      </p>
                    )}
                  </div>
                );
              })()}

              {caseData.stage === "appeal" && nextStage && (() => {
                const candidate = {
                  ...caseData,
                  hasAppeal: true,
                  appealReviewer: appealReviewerName,
                  appealReviewerId,
                  appealGrounds: appealGrounds || undefined,
                } as ERCase;
                const { blockers } = canAdvanceTo(candidate, nextStage);
                return (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Appeal Reviewer</Label>
                      <EmployeePicker
                        value={appealReviewerId}
                        placeholder="Name an appeal reviewer…"
                        onChange={(emp: PickedEmployee | null) => {
                          setAppealReviewerId(emp?.id);
                          setAppealReviewerName(emp?.name);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Grounds for Appeal</Label>
                      <Textarea
                        value={appealGrounds}
                        placeholder="What is the appeal based on?"
                        rows={3}
                        onChange={(
                          e: React.ChangeEvent<HTMLTextAreaElement>,
                        ) => setAppealGrounds(e.target.value)}
                      />
                    </div>
                    <Button
                      disabled={blockers.length > 0}
                      onClick={() =>
                        tryAdvance(nextStage, {
                          hasAppeal: true,
                          appealCaseId:
                            caseData.appealCaseId ??
                            `APPEAL-${caseData.caseNumber.replace(/[^A-Z0-9]/gi, "")}`,
                          appealReviewer: appealReviewerName,
                          appealReviewerId,
                          appealGrounds: appealGrounds || undefined,
                        })
                      }
                    >
                      Move to {CASE_STAGE_CONFIG[nextStage].label}
                    </Button>
                    {blockers.length > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {blockers.join(" · ")}
                      </p>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Case Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Case Notes
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                  {caseData.notes.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                      {(() => {
                        const vis: NoteVisibility =
                          note.visibility ??
                          (note.isInternal ? "hr_only" : "employee_visible");
                        if (vis === "employee_visible") return null;
                        return (
                          <span className="flex items-center gap-0.5">
                            <Lock className="h-3 w-3" />
                            {NOTE_VISIBILITY_LABELS[vis]}
                          </span>
                        );
                      })()}
                      <span>{formatDate(note.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))}

              <Separator />

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
                  <Label
                    htmlFor="note-visibility"
                    className="text-xs text-muted-foreground"
                  >
                    Visible to
                  </Label>
                  <Select
                    value={noteVisibility}
                    onValueChange={(v) =>
                      setNoteVisibility(v as NoteVisibility)
                    }
                  >
                    <SelectTrigger
                      id="note-visibility"
                      className="h-8 w-40 text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(NOTE_VISIBILITY_LABELS) as NoteVisibility[]
                      ).map((v) => (
                        <SelectItem key={v} value={v} className="text-xs">
                          {NOTE_VISIBILITY_LABELS[v]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={savingNote || !noteContent.trim()}
                >
                  {savingNote ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {flow.map((stage, idx) => {
                  const cfg = CASE_STAGE_CONFIG[stage];
                  const done = idx < currentIndex;
                  const current = idx === currentIndex;
                  const { allowed, blockers } =
                    current || done
                      ? { allowed: true, blockers: [] as string[] }
                      : canAdvanceTo(caseData, stage);
                  const reachedAt = stageReachedAt(stage);
                  const isLast = idx === flow.length - 1;
                  return (
                    <div key={stage} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : current ? (
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/20" />
                        ) : allowed ? (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                        )}
                        {!isLast && (
                          <div
                            className={`w-px flex-1 ${done ? "bg-emerald-300 dark:bg-emerald-800" : "bg-border"}`}
                          />
                        )}
                      </div>
                      <div className="pb-4 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            current || done
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {cfg.label}
                        </p>
                        {reachedAt && (
                          <p className="text-[11px] text-muted-foreground">
                            {formatDate(reachedAt)}
                          </p>
                        )}
                        {!allowed && !done && !current && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                            Needs: {blockers.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {(!caseData.activity || caseData.activity.length === 0) && (
                <p className="text-sm text-muted-foreground italic">
                  No activity recorded yet.
                </p>
              )}
              <ul className="space-y-3">
                {[...(caseData.activity ?? [])].reverse().map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className="font-medium text-foreground">{a.action}</p>
                    {a.detail && (
                      <p className="text-muted-foreground text-xs">
                        {a.detail}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {a.actorName} · {formatDateTime(a.at)}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
