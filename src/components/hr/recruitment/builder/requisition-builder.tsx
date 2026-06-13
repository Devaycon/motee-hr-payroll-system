"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { OnboardingStepper } from "@/src/components/auth/company-onboarding/stepper";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { formatDate } from "@/src/lib/utils/format-date";
import {
  addRequisition,
  updateRequisition,
  uid,
} from "@/src/lib/stores/recruitment-slice";
import {
  markConverted as markRequisitionConverted,
  seedCountry as seedRequisitions,
} from "@/src/lib/stores/requisitions-slice";
import type { Requisition } from "@/src/lib/stores/requisitions-slice";
import { upsertRequests } from "@/src/lib/stores/approvals-slice";
import { buildRequisitionDemo } from "@/src/data/requisitions-demo";
import { POSTING_PLATFORMS, defaultFlow } from "@/src/data/recruitment-demo";
import type {
  FilterConstraint,
  InterviewPlanRound,
  InterviewMode,
  JobRequisition,
  RequisitionEmploymentType,
} from "@/src/lib/types/recruitment";
import { cn } from "@/src/lib/utils";
import {
  FieldEditor,
  buildField,
  emptyField,
  fieldFromModel,
  type FieldDraft,
} from "./field-editor";
import { FilterConstraintsEditor } from "./filter-constraints-editor";

const STEPS = [
  { number: 1, label: "Select requisition" },
  { number: 2, label: "Requisition details" },
  { number: 3, label: "Application form" },
  { number: 4, label: "Publish settings" },
  { number: 5, label: "Review" },
];

interface RequisitionBuilderProps {
  /** Preselect an approved Requisition (deep-link from the Requisition module). */
  sourceRequisitionId?: string;
  /** Edit an existing recruitment. */
  requisitionId?: string;
}

export function RequisitionBuilder({
  sourceRequisitionId,
  requisitionId,
}: RequisitionBuilderProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { format: formatMoney } = useCurrency();
  const country = useAppSelector((s) => s.locale.country);
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const requisitions = useAppSelector(
    (s) => s.requisitions.byCountry[country] ?? [],
  );
  const approvals = useAppSelector((s) => s.approvals.requests);
  const bucket = useAppSelector((s) => s.recruitment.byCountry[country]);

  const editing = useMemo(
    () => bucket?.requisitions.find((r) => r.id === requisitionId),
    [bucket, requisitionId],
  );

  const approvalsById = useMemo(
    () => new Map(approvals.map((a) => [a.id, a])),
    [approvals],
  );

  // Approved + not-yet-converted requisitions are eligible sources.
  const approvedRequisitions = useMemo(
    () =>
      requisitions.filter((r) => {
        if (r.status === "converted") return false;
        if (!r.approvalRequestId) return false;
        return approvalsById.get(r.approvalRequestId)?.status === "approved";
      }),
    [requisitions, approvalsById],
  );

  // The requisitions + their approvals are normally seeded by the Requisition
  // list page. Seed them here too (both dispatches are idempotent) so the
  // "Approved requisition" dropdown is populated when this builder is opened
  // directly, e.g. via deep link or a page refresh.
  useEffect(() => {
    const demo = buildRequisitionDemo();
    dispatch(seedRequisitions({ country, requisitions: demo.requisitions }));
    dispatch(upsertRequests(demo.approvals));
  }, [country, dispatch]);

  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);

  // ── Source requisition + role snapshot pulled from it (read-only) ──
  const [sourceReqId, setSourceReqId] = useState<string>(
    sourceRequisitionId ?? editing?.sourceRequisitionId ?? "",
  );
  const [role, setRole] = useState({
    positionTitle: editing?.positionTitle ?? "",
    department: editing?.department ?? "",
    location: editing?.location ?? "",
    openings: editing?.openings ?? 1,
    salaryMin: editing?.salaryMin ?? 0,
    salaryMax: editing?.salaryMax ?? 0,
    targetStartDate: editing?.targetStartDate ?? "",
    jobDescription: editing?.jobDescription ?? "",
    qualifications: editing?.qualifications ?? "",
    employmentType: (editing?.employmentType ?? "full_time") as RequisitionEmploymentType,
    workforceLabel: "",
    reportingManager: "",
    budgetAllocation: 0,
  });

  // ── Recruitment-specific config ──
  const [fields, setFields] = useState<FieldDraft[]>(
    editing?.applicationForm?.length
      ? editing.applicationForm.map(fieldFromModel)
      : [
          { ...emptyField(), type: "short_text", label: "Full name", required: true },
          { ...emptyField(), type: "email", label: "Email", required: true },
        ],
  );
  const [platforms, setPlatforms] = useState<string[]>(
    editing?.postingPlatforms ?? ["careers_page"],
  );
  const [hiringManagerId, setHiringManagerId] = useState<string>(
    editing?.hiringManagerId ?? "",
  );
  const [interviewPlan, setInterviewPlan] = useState<InterviewPlanRound[]>([
    { round: "Recruiter Screen", mode: "phone", durationMins: 30 },
  ]);
  const [constraints, setConstraints] = useState<FilterConstraint[]>(
    editing?.filterConstraints ?? [],
  );

  const formFields = useMemo(
    () => fields.filter((f) => f.label.trim()).map(buildField),
    [fields],
  );

  // Seed the role snapshot from a preselected source requisition (deep-link).
  const [seededSource, setSeededSource] = useState(false);
  if (!seededSource && sourceReqId && !editing) {
    setSeededSource(true);
    const r = requisitions.find((x) => x.id === sourceReqId);
    if (r) applySource(r);
  }

  function applySource(r: Requisition) {
    setSourceReqId(r.id);
    setRole({
      positionTitle: r.title,
      department: r.department,
      location: r.location,
      openings: r.numberOfPositions,
      salaryMin: r.salaryMin,
      salaryMax: r.salaryMax,
      targetStartDate: r.startDate,
      jobDescription: r.jobDescription,
      qualifications: r.qualifications,
      employmentType: r.durationMonths ? "contract" : "full_time",
      workforceLabel: r.workforceLabel,
      reportingManager: r.reportingManager,
      budgetAllocation: r.budgetAllocation,
    });
  }

  function updateField(id: string, patch: Partial<FieldDraft>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function moveField(index: number, dir: -1 | 1) {
    setFields((prev) => {
      const next = [...prev];
      const t = index + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[index], next[t]] = [next[t], next[index]];
      return next;
    });
  }
  function togglePlatform(id: string) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function goNext() {
    if (step === 1 && !sourceReqId && !editing) {
      toast.error("Select an approved requisition to continue.");
      return;
    }
    setCompleted((prev) => (prev.includes(step) ? prev : [...prev, step]));
    setStep((s) => Math.min(STEPS.length, s + 1));
  }
  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  function persist(status: "draft" | "open") {
    if (!sourceReqId && !editing) {
      toast.error("Select an approved requisition first (step 1).");
      setStep(1);
      return;
    }
    const cleanFields = fields.filter((f) => f.label.trim()).map(buildField);
    const cleanConstraints = constraints.filter((c) => c.name.trim());
    const mgr = employees.find((e) => e.id === hiringManagerId);

    if (editing) {
      dispatch(
        updateRequisition({
          country,
          id: editing.id,
          patch: {
            applicationForm: cleanFields,
            filterConstraints: cleanConstraints,
            postingPlatforms: platforms,
            status,
            flow: editing.flow ?? defaultFlow(),
            hiringManager: mgr?.fullName ?? editing.hiringManager,
            hiringManagerId: hiringManagerId || editing.hiringManagerId,
          },
        }),
      );
      toast.success(status === "draft" ? "Recruitment saved as draft" : "Recruitment published");
      router.push("/talent/recruitment");
      return;
    }

    const reqId = uid("REC");
    const requisition: JobRequisition = {
      id: reqId,
      requisitionNumber: `REC-${String(Date.now()).slice(-5)}`,
      positionTitle: role.positionTitle.trim() || "Untitled role",
      department: role.department,
      hiringManager: mgr?.fullName ?? "—",
      hiringManagerId: hiringManagerId || undefined,
      employmentType: role.employmentType,
      status,
      hiringPriority: "medium",
      location: role.location || "—",
      openings: role.openings,
      salaryMin: role.salaryMin,
      salaryMax: role.salaryMax,
      jobDescription: role.jobDescription,
      requiredSkills: [],
      targetStartDate: role.targetStartDate,
      createdAt: new Date().toISOString().slice(0, 10),
      sourceRequisitionId: sourceReqId || undefined,
      qualifications: role.qualifications || undefined,
      applicationForm: cleanFields,
      filterConstraints: cleanConstraints,
      postingPlatforms: platforms,
      flow: defaultFlow(),
    };
    dispatch(addRequisition({ country, requisition }));
    if (sourceReqId) {
      dispatch(markRequisitionConverted({ country, id: sourceReqId, recruitmentId: reqId }));
    }
    toast.success(status === "draft" ? "Recruitment saved as draft" : "Recruitment published");
    router.push("/talent/recruitment");
  }

  const selReq = requisitions.find((r) => r.id === sourceReqId);
  const salaryRange = `${formatMoney(role.salaryMin)} – ${formatMoney(role.salaryMax)}`;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/talent/recruitment")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {editing ? "Edit recruitment" : "Create recruitment"}
        </h1>
      </div>

      <div className="flex justify-center py-2">
        <OnboardingStepper steps={STEPS} currentStep={step} completedSteps={completed} />
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          {/* Step 1 — Select approved requisition */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Select an approved requisition
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recruitment is created from an approved requisition. Its role details are
                  pulled in automatically — you only build the application form here.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Approved requisition</Label>
                <Select
                  value={sourceReqId}
                  onValueChange={(v) => {
                    const r = approvedRequisitions.find((x) => x.id === v);
                    if (r) applySource(r);
                  }}
                  disabled={Boolean(editing)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select an approved requisition" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedRequisitions.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        No approved requisitions available.
                      </div>
                    ) : (
                      approvedRequisitions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.title} — {r.department}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {approvedRequisitions.length === 0 && !editing && (
                  <p className="text-[11px] text-muted-foreground">
                    Approve a requisition in the Requisition module first.
                  </p>
                )}
              </div>

              {selReq && (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      {selReq.title} — {selReq.department}
                    </span>
                    <Badge variant="outline" className="text-[10px]">Approved</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sourced from {selReq.workforceLabel}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Requisition details (read-only preview) */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Requisition details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  These details come from the approved requisition and can&apos;t be edited here.
                </p>
              </div>

              {sourceReqId || editing ? (
                <>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border/60 p-4 text-sm sm:grid-cols-3">
                    {[
                      { label: "Job title", value: role.positionTitle || "—" },
                      { label: "Department", value: role.department || "—" },
                      { label: "Location", value: role.location || "—" },
                      { label: "Positions", value: String(role.openings) },
                      { label: "Salary range", value: salaryRange },
                      { label: "Start date", value: role.targetStartDate ? formatDate(role.targetStartDate) : "—" },
                      { label: "Reporting manager", value: role.reportingManager || "—" },
                      { label: "Budget", value: role.budgetAllocation ? formatMoney(role.budgetAllocation) : "—" },
                      { label: "Source workforce", value: role.workforceLabel || "—" },
                    ].map((f) => (
                      <div key={f.label} className="flex flex-col gap-0.5">
                        <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {f.label}
                        </dt>
                        <dd className="text-foreground">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {role.jobDescription && (
                    <div className="rounded-lg border border-border/60 p-4 text-sm">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                        Job description
                      </p>
                      <p className="text-foreground whitespace-pre-line">{role.jobDescription}</p>
                    </div>
                  )}
                  {role.qualifications && (
                    <div className="rounded-lg border border-border/60 p-4 text-sm">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                        Required qualifications
                      </p>
                      <p className="text-foreground whitespace-pre-line">{role.qualifications}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Select an approved requisition in step 1 first.
                </p>
              )}
            </div>
          )}

          {/* Step 3 — Application form builder */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Build the application form
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add the fields applicants will fill in. Choice fields power the
                    Applicant-tab filters.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-[11px]"
                  onClick={() => setFields((p) => [...p, emptyField()])}
                >
                  <Plus className="w-3 h-3" />
                  Add field
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((f, i) => (
                  <FieldEditor
                    key={f.id}
                    field={f}
                    onChange={(patch) => updateField(f.id, patch)}
                    onMoveUp={() => moveField(i, -1)}
                    onMoveDown={() => moveField(i, 1)}
                    onRemove={() => setFields((p) => p.filter((x) => x.id !== f.id))}
                    canMoveUp={i > 0}
                    canMoveDown={i < fields.length - 1}
                  />
                ))}
                {fields.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No fields yet — add at least one for applicants to fill.
                  </p>
                )}
              </div>

              <FilterConstraintsEditor
                constraints={constraints}
                onChange={setConstraints}
                formFields={formFields}
              />
            </div>
          )}

          {/* Step 4 — Publish & review */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Posting platforms</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose where to publish this role.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {POSTING_PLATFORMS.map((p) => (
                    <label
                      key={p.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-sm",
                        platforms.includes(p.id)
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/60",
                      )}
                    >
                      <Checkbox
                        checked={platforms.includes(p.id)}
                        onCheckedChange={() => togglePlatform(p.id)}
                        className="mt-0.5"
                      />
                      <span className="flex flex-col">
                        <span className="text-foreground">{p.label}</span>
                        <span className="text-[11px] text-muted-foreground">{p.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Hiring manager</Label>
                  <Select
                    value={hiringManagerId || "none"}
                    onValueChange={(v) => setHiringManagerId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {employees.slice(0, 50).map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Interview plan</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-[11px]"
                    onClick={() =>
                      setInterviewPlan((p) => [
                        ...p,
                        { round: `Round ${p.length + 1}`, mode: "video", durationMins: 45 },
                      ])
                    }
                  >
                    <Plus className="w-3 h-3" />
                    Add round
                  </Button>
                </div>
                {interviewPlan.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={r.round}
                      className="h-8 flex-1"
                      onChange={(e) =>
                        setInterviewPlan((p) =>
                          p.map((x, j) => (j === i ? { ...x, round: e.target.value } : x)),
                        )
                      }
                    />
                    <Select
                      value={r.mode}
                      onValueChange={(v) =>
                        setInterviewPlan((p) =>
                          p.map((x, j) => (j === i ? { ...x, mode: v as InterviewMode } : x)),
                        )
                      }
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="onsite">Onsite</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={r.durationMins}
                      className="h-8 w-20"
                      onChange={(e) =>
                        setInterviewPlan((p) =>
                          p.map((x, j) =>
                            j === i ? { ...x, durationMins: Number(e.target.value) || 30 } : x,
                          ),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setInterviewPlan((p) => p.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Step 5 — Review (read-only summary with edit jump-back) */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Review &amp; publish</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Check everything below. Use the Edit links to jump back to any step and make changes.
                </p>
              </div>

              {/* Role details */}
              <div className="rounded-lg border border-border/60 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Role details
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => setStep(2)}
                  >
                    Edit
                  </Button>
                </div>
                <p className="text-foreground font-medium">
                  {role.positionTitle || "Untitled role"}{" "}
                  <span className="font-normal text-muted-foreground">· {role.department}</span>
                </p>
                <p className="text-muted-foreground">
                  {role.openings} opening{role.openings === 1 ? "" : "s"} · {salaryRange}
                  {role.location ? ` · ${role.location}` : ""}
                </p>
                {selReq && (
                  <p className="text-muted-foreground">
                    Sourced from approved requisition — {selReq.title}
                  </p>
                )}
              </div>

              {/* Application form */}
              <div className="rounded-lg border border-border/60 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Application form
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => setStep(3)}
                  >
                    Edit
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  {fields.filter((f) => f.label.trim()).length} application field
                  {fields.filter((f) => f.label.trim()).length === 1 ? "" : "s"}
                  {constraints.filter((c) => c.name.trim()).length > 0
                    ? ` · ${constraints.filter((c) => c.name.trim()).length} filter${constraints.filter((c) => c.name.trim()).length === 1 ? "" : "s"}`
                    : ""}
                </p>
                {fields.filter((f) => f.label.trim()).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {fields
                      .filter((f) => f.label.trim())
                      .map((f) => (
                        <Badge key={f.id} variant="outline" className="text-[10px]">
                          {f.label}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>

              {/* Publish settings */}
              <div className="rounded-lg border border-border/60 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Publish settings
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => setStep(4)}
                  >
                    Edit
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  {platforms.length} platform{platforms.length === 1 ? "" : "s"} ·{" "}
                  {interviewPlan.length} interview round{interviewPlan.length === 1 ? "" : "s"}
                </p>
                <p className="text-muted-foreground">
                  Hiring manager:{" "}
                  {employees.find((e) => e.id === hiringManagerId)?.fullName ?? "Unassigned"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer nav */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={step === 1 ? () => router.push("/talent/recruitment") : goBack}
        >
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        {step < STEPS.length ? (
          <Button onClick={goNext} className="gap-1.5">
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => persist("draft")}>
              Save as draft
            </Button>
            <Button onClick={() => persist("open")} className="gap-1.5">
              <Check className="w-4 h-4" />
              {editing ? "Save & publish" : "Publish recruitment"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
