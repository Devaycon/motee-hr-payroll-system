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
import {
  APPLY_MODE_LABELS,
  EDUCATION_LEVEL_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  HIRING_PRIORITY_LABELS,
  PAY_PERIOD_LABELS,
  POSTING_PLATFORMS,
  WORK_MODE_LABELS,
  defaultFlow,
} from "@/src/data/recruitment-demo";
import {
  validateBeforePublish,
  type ApplyMethod,
  type EducationLevel,
  type ExperienceLevel,
  type FilterConstraint,
  type HiringPriority,
  type InterviewPlanRound,
  type InterviewMode,
  type JobAdvert,
  type JobLocation,
  type JobRequisition,
  type PayPeriod,
  type RequisitionEmploymentType,
  type WorkMode,
} from "@/src/lib/types/recruitment";
import { advertWarnings } from "@/src/lib/recruitment/job-advert";
import { useCompanyProfile } from "@/src/components/hr/company-profile/hooks";
import { Textarea } from "@/src/components/ui/textarea";
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
  // §7.19 — the board-facing half. Sits before publish settings because the
  // platforms chosen there are exactly what this data is written for.
  { number: 4, label: "Job advert" },
  { number: 5, label: "Publish settings" },
  { number: 6, label: "Review" },
];

/**
 * Normalise the advert form state for storage: empty strings become absent so
 * every optional field reads as genuinely unset, and blank location rows (the
 * seeded placeholder nobody filled in) are dropped rather than persisted as an
 * address with no city.
 */
function cleanAdvert(advert: JobAdvert): JobAdvert {
  const text = (v: string | undefined) => {
    const t = (v ?? "").trim();
    return t.length > 0 ? t : undefined;
  };
  const apply: ApplyMethod = {
    mode: advert.apply.mode,
    url: advert.apply.mode === "external_url" ? text(advert.apply.url) : undefined,
    email: advert.apply.mode === "email" ? text(advert.apply.email) : undefined,
  };
  return {
    workMode: advert.workMode,
    locations: advert.locations
      .filter((l) => l.city.trim() || l.country.trim())
      .map((l) => ({
        streetAddress: text(l.streetAddress),
        city: l.city.trim(),
        region: text(l.region),
        postalCode: text(l.postalCode),
        country: l.country.trim(),
      })),
    salaryCurrency: (advert.salaryCurrency ?? "").trim(),
    payPeriod: advert.payPeriod,
    publishSalary: advert.publishSalary,
    apply,
    responsibilities: text(advert.responsibilities),
    benefits: text(advert.benefits),
    experienceLevel: advert.experienceLevel,
    minYearsExperience: advert.minYearsExperience,
    educationLevel: advert.educationLevel,
    jobFunction: text(advert.jobFunction),
    industry: text(advert.industry),
    visaSponsorship: advert.visaSponsorship,
    workingHours: text(advert.workingHours),
    contractMonths: advert.contractMonths,
    eeoStatement: text(advert.eeoStatement),
  };
}

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
  const { format: formatMoney, code: currencyCode } = useCurrency();
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
  // §7.15 — publication scheduling.
  const [publishMode, setPublishMode] = useState<"now" | "schedule">(
    editing?.scheduledPublishAt ? "schedule" : "now",
  );
  const [scheduledAt, setScheduledAt] = useState(
    editing?.scheduledPublishAt ?? "",
  );
  const [expiryDate, setExpiryDate] = useState(editing?.expiryDate ?? "");
  const [autoClose, setAutoClose] = useState(
    editing?.autoCloseOnExpiry ?? false,
  );
  const [hiringManagerId, setHiringManagerId] = useState<string>(
    editing?.hiringManagerId ?? "",
  );
  const [interviewPlan, setInterviewPlan] = useState<InterviewPlanRound[]>([
    { round: "Recruiter Screen", mode: "phone", durationMins: 30 },
  ]);
  // These were hardcoded on create ("medium" / no skills) and so could never
  // be set at all — the list page's priority column had nothing to show.
  const [hiringPriority, setHiringPriority] = useState<HiringPriority>(
    editing?.hiringPriority ?? "medium",
  );
  const [skillsText, setSkillsText] = useState(
    (editing?.requiredSkills ?? []).join(", "),
  );
  const requiredSkills = useMemo(
    () =>
      skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [skillsText],
  );
  const [constraints, setConstraints] = useState<FilterConstraint[]>(
    editing?.filterConstraints ?? [],
  );

  // ── §7.19 Job advert — the board-facing fields ──
  const { data: company } = useCompanyProfile();
  const [advert, setAdvert] = useState<JobAdvert>(() => ({
    // `employmentType` carries a "remote" member, which is really a work mode.
    // Read it as one so an existing remote role doesn't start out unset.
    workMode:
      editing?.advert?.workMode ??
      (editing?.employmentType === "remote" ? "remote" : "on_site"),
    locations: editing?.advert?.locations ?? [],
    salaryCurrency: editing?.advert?.salaryCurrency ?? "",
    payPeriod: editing?.advert?.payPeriod ?? "year",
    publishSalary: editing?.advert?.publishSalary ?? false,
    apply: editing?.advert?.apply ?? { mode: "internal" },
    responsibilities: editing?.advert?.responsibilities ?? "",
    benefits: editing?.advert?.benefits ?? "",
    experienceLevel: editing?.advert?.experienceLevel,
    minYearsExperience: editing?.advert?.minYearsExperience,
    educationLevel: editing?.advert?.educationLevel,
    jobFunction: editing?.advert?.jobFunction ?? "",
    industry: editing?.advert?.industry ?? "",
    visaSponsorship: editing?.advert?.visaSponsorship,
    workingHours: editing?.advert?.workingHours ?? "",
    contractMonths: editing?.advert?.contractMonths,
    eeoStatement: editing?.advert?.eeoStatement ?? "",
  }));

  function patchAdvert(patch: Partial<JobAdvert>) {
    setAdvert((prev) => ({ ...prev, ...patch }));
  }
  function patchLocation(index: number, patch: Partial<JobLocation>) {
    setAdvert((prev) => ({
      ...prev,
      locations: prev.locations.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    }));
  }

  // Seed the advert's derived defaults once the company profile has loaded.
  // Retyping a city already on the requisition, or the tenant's only currency,
  // is busywork. Adjusted during render rather than in an effect — the same
  // pattern `seededSource` above uses, and the one React recommends for
  // deriving state from props instead of cascading an extra render.
  const [seededAdvert, setSeededAdvert] = useState(false);
  if (!seededAdvert && company) {
    setSeededAdvert(true);
    setAdvert((prev) => {
      const next = { ...prev };
      if (!next.salaryCurrency) next.salaryCurrency = currencyCode;
      if (next.locations.length === 0) {
        const parts = (role.location || "")
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        next.locations = [
          {
            city: parts[0] ?? "",
            region: parts.length > 2 ? parts[1] : "",
            country: parts.length > 1 ? parts[parts.length - 1] : company.country,
          },
        ];
      }
      if (!next.industry) next.industry = company.industry;
      return next;
    });
  }

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
    // The approved requisition already knows the term length; the advert needs
    // it too, and it was previously only used to infer the employment type.
    if (r.durationMonths) patchAdvert({ contractMonths: r.durationMonths });
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

    // §7.17 — catch the obvious problems before a vacancy reaches a job board.
    // Drafts are exempt: a draft is by definition unfinished.
    if (status === "open") {
      const warnings = validateBeforePublish({
        jobDescription: role.jobDescription,
        hiringManager: mgr?.fullName ?? editing?.hiringManager,
        applicationForm: cleanFields,
        salaryMin: role.salaryMin,
        salaryMax: role.salaryMax,
        postingPlatforms: platforms,
        flow: editing?.flow ?? defaultFlow(),
      });
      const blocking = warnings.filter((w) => w.severity === "blocking");
      if (blocking.length > 0) {
        toast.error("Can't publish yet", {
          description: blocking
            .map((w) => `${w.field}: ${w.message}`)
            .join(" · "),
        });
        return;
      }
    }

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
            hiringPriority,
            requiredSkills,
            // §7.15 — the edit path used to drop these, so re-saving a
            // recruitment silently discarded its publish and expiry dates.
            scheduledPublishAt:
              publishMode === "schedule" ? scheduledAt : undefined,
            expiryDate: expiryDate || undefined,
            autoCloseOnExpiry: autoClose,
            // §7.19 — the board-facing advert.
            advert: cleanAdvert(advert),
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
      hiringPriority,
      location: role.location || "—",
      openings: role.openings,
      salaryMin: role.salaryMin,
      salaryMax: role.salaryMax,
      jobDescription: role.jobDescription,
      requiredSkills,
      targetStartDate: role.targetStartDate,
      createdAt: new Date().toISOString().slice(0, 10),
      sourceRequisitionId: sourceReqId || undefined,
      qualifications: role.qualifications || undefined,
      applicationForm: cleanFields,
      filterConstraints: cleanConstraints,
      postingPlatforms: platforms,
      // §7.15 — scheduling controls.
      scheduledPublishAt: publishMode === "schedule" ? scheduledAt : undefined,
      expiryDate: expiryDate || undefined,
      autoCloseOnExpiry: autoClose,
      // §7.19 — the board-facing advert.
      advert: cleanAdvert(advert),
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

  const primaryLocationText = useMemo(() => {
    const l = advert.locations[0];
    if (!l) return "";
    return [l.city, l.region, l.country].filter(Boolean).join(", ");
  }, [advert.locations]);

  // Run the board-readiness check against what the requisition *would* look
  // like once saved, so the review step warns before publishing rather than
  // after HR has already tried to list the role.
  const advertBlockers = useMemo(
    () =>
      advertWarnings({
        ...(editing ?? ({} as JobRequisition)),
        jobDescription: role.jobDescription,
        requiredSkills,
        expiryDate: expiryDate || undefined,
        advert: cleanAdvert(advert),
      } as JobRequisition).filter((w) => w.severity === "blocking"),
    [editing, role.jobDescription, requiredSkills, expiryDate, advert],
  );

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

                  {/* Recruitment's own additions to the inherited snapshot. */}
                  <div className="space-y-3 rounded-lg border border-border/60 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Recruitment settings
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Hiring priority</Label>
                        <Select
                          value={hiringPriority}
                          onValueChange={(v) =>
                            setHiringPriority(v as HiringPriority)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              Object.keys(
                                HIRING_PRIORITY_LABELS,
                              ) as HiringPriority[]
                            ).map((p) => (
                              <SelectItem key={p} value={p}>
                                {HIRING_PRIORITY_LABELS[p]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Required skills{" "}
                          <span className="text-muted-foreground">
                            (comma separated)
                          </span>
                        </Label>
                        <Input
                          value={skillsText}
                          onChange={(e) => setSkillsText(e.target.value)}
                          placeholder="TypeScript, PostgreSQL, Cloud"
                        />
                      </div>
                    </div>
                    {requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {requiredSkills.map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
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

          {/* Step 4 — Job advert (§7.19): what an external job board needs.
              None of this is used internally; it exists so a vacancy can be
              listed on LinkedIn, Indeed, Glassdoor or Google for Jobs without
              anyone retyping it. */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Job advert</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  What external job boards ask for. Everything here is public —
                  hiring manager, priority, budget and pipeline data stay internal
                  and are never exported.
                </p>
              </div>

              {/* Where */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Where the work happens
                </h3>
                <div className="space-y-1.5">
                  <Label className="text-xs">Work mode</Label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((m) => (
                      <Button
                        key={m}
                        type="button"
                        size="sm"
                        variant={advert.workMode === m ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => patchAdvert({ workMode: m })}
                      >
                        {WORK_MODE_LABELS[m]}
                      </Button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Boards filter on this, and Google for Jobs requires it to show
                    a role as remote.
                  </p>
                </div>

                {advert.locations.map((loc, i) => (
                  <div key={i} className="space-y-2 rounded-md border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] text-muted-foreground">
                        {i === 0 ? "Primary location" : `Additional location ${i}`}
                      </Label>
                      {i > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() =>
                            patchAdvert({
                              locations: advert.locations.filter((_, j) => j !== i),
                            })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-[11px]">City</Label>
                        <Input
                          className="h-8"
                          value={loc.city}
                          onChange={(e) => patchLocation(i, { city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">State / region</Label>
                        <Input
                          className="h-8"
                          value={loc.region ?? ""}
                          onChange={(e) => patchLocation(i, { region: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Street address</Label>
                        <Input
                          className="h-8"
                          value={loc.streetAddress ?? ""}
                          onChange={(e) =>
                            patchLocation(i, { streetAddress: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Postal code</Label>
                        <Input
                          className="h-8"
                          value={loc.postalCode ?? ""}
                          onChange={(e) => patchLocation(i, { postalCode: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Country</Label>
                        <Input
                          className="h-8"
                          value={loc.country}
                          onChange={(e) => patchLocation(i, { country: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-[11px]"
                  onClick={() =>
                    patchAdvert({
                      locations: [
                        ...advert.locations,
                        { city: "", country: company?.country ?? "" },
                      ],
                    })
                  }
                >
                  <Plus className="w-3 h-3" />
                  Add location
                </Button>
              </div>

              {/* Money */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pay
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Currency</Label>
                    <Input
                      className="h-9"
                      placeholder="NGN"
                      value={advert.salaryCurrency}
                      onChange={(e) =>
                        patchAdvert({ salaryCurrency: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pay period</Label>
                    <Select
                      value={advert.payPeriod}
                      onValueChange={(v) => patchAdvert({ payPeriod: v as PayPeriod })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PAY_PERIOD_LABELS) as PayPeriod[]).map((p) => (
                          <SelectItem key={p} value={p}>
                            {PAY_PERIOD_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                    checked={advert.publishSalary}
                    onCheckedChange={(v) => patchAdvert({ publishSalary: v === true })}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-muted-foreground">
                    Show the salary band ({salaryRange}) on the advert.
                    <br />
                    Leave unticked to keep the band internal — it is then omitted
                    from every export.
                  </span>
                </label>
              </div>

              {/* How to apply */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  How to apply
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(APPLY_MODE_LABELS) as ApplyMethod["mode"][]).map((m) => (
                    <Button
                      key={m}
                      type="button"
                      size="sm"
                      variant={advert.apply.mode === m ? "default" : "outline"}
                      className="h-7 text-xs"
                      onClick={() => patchAdvert({ apply: { ...advert.apply, mode: m } })}
                    >
                      {APPLY_MODE_LABELS[m]}
                    </Button>
                  ))}
                </div>
                {advert.apply.mode === "external_url" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Application URL</Label>
                    <Input
                      className="h-9"
                      placeholder="https://…"
                      value={advert.apply.url ?? ""}
                      onChange={(e) =>
                        patchAdvert({ apply: { ...advert.apply, url: e.target.value } })
                      }
                    />
                  </div>
                )}
                {advert.apply.mode === "email" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Application email</Label>
                    <Input
                      className="h-9"
                      type="email"
                      placeholder="careers@example.com"
                      value={advert.apply.email ?? ""}
                      onChange={(e) =>
                        patchAdvert({ apply: { ...advert.apply, email: e.target.value } })
                      }
                    />
                  </div>
                )}
              </div>

              {/* The role */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Advert copy
                </h3>
                <div className="space-y-1.5">
                  <Label className="text-xs">Responsibilities</Label>
                  <Textarea
                    rows={4}
                    placeholder="What the person will actually do, one point per line."
                    value={advert.responsibilities ?? ""}
                    onChange={(e) => patchAdvert({ responsibilities: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Benefits &amp; package</Label>
                  <Textarea
                    rows={3}
                    placeholder="Pension, health cover, leave allowance, learning budget…"
                    value={advert.benefits ?? ""}
                    onChange={(e) => patchAdvert({ benefits: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Working hours</Label>
                    <Input
                      className="h-9"
                      placeholder="40 hours/week, Mon–Fri"
                      value={advert.workingHours ?? ""}
                      onChange={(e) => patchAdvert({ workingHours: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Contract length (months)</Label>
                    <Input
                      className="h-9"
                      type="number"
                      min={0}
                      placeholder="Leave blank if permanent"
                      value={advert.contractMonths ?? ""}
                      onChange={(e) =>
                        patchAdvert({
                          contractMonths: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Candidate requirements
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Experience level</Label>
                    <Select
                      value={advert.experienceLevel ?? "none"}
                      onValueChange={(v) =>
                        patchAdvert({
                          experienceLevel:
                            v === "none" ? undefined : (v as ExperienceLevel),
                        })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Not specified" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        {(Object.keys(EXPERIENCE_LEVEL_LABELS) as ExperienceLevel[]).map(
                          (l) => (
                            <SelectItem key={l} value={l}>
                              {EXPERIENCE_LEVEL_LABELS[l]}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Minimum years of experience</Label>
                    <Input
                      className="h-9"
                      type="number"
                      min={0}
                      value={advert.minYearsExperience ?? ""}
                      onChange={(e) =>
                        patchAdvert({
                          minYearsExperience: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Education</Label>
                    <Select
                      value={advert.educationLevel ?? "unset"}
                      onValueChange={(v) =>
                        patchAdvert({
                          educationLevel:
                            v === "unset" ? undefined : (v as EducationLevel),
                        })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Not specified" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Not specified</SelectItem>
                        {(Object.keys(EDUCATION_LEVEL_LABELS) as EducationLevel[]).map(
                          (l) => (
                            <SelectItem key={l} value={l}>
                              {EDUCATION_LEVEL_LABELS[l]}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Visa sponsorship</Label>
                    <Select
                      value={
                        advert.visaSponsorship === undefined
                          ? "unset"
                          : advert.visaSponsorship
                            ? "yes"
                            : "no"
                      }
                      onValueChange={(v) =>
                        patchAdvert({
                          visaSponsorship: v === "unset" ? undefined : v === "yes",
                        })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Not specified</SelectItem>
                        <SelectItem value="yes">Available</SelectItem>
                        <SelectItem value="no">Not available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Classification */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Classification &amp; statement
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Job function</Label>
                    <Input
                      className="h-9"
                      placeholder="Engineering"
                      value={advert.jobFunction ?? ""}
                      onChange={(e) => patchAdvert({ jobFunction: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Industry</Label>
                    <Input
                      className="h-9"
                      placeholder="Financial services"
                      value={advert.industry ?? ""}
                      onChange={(e) => patchAdvert({ industry: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Equal-opportunity statement</Label>
                  <Textarea
                    rows={3}
                    placeholder="We are an equal-opportunity employer…"
                    value={advert.eeoStatement ?? ""}
                    onChange={(e) => patchAdvert({ eeoStatement: e.target.value })}
                  />
                </div>
              </div>

              {advertBlockers.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Still missing for job boards:{" "}
                  {advertBlockers.map((w) => w.field).join(", ")}. You can publish
                  without them, but boards may reject the listing.
                </p>
              )}
            </div>
          )}

          {/* Step 5 — Publish settings */}
          {step === 5 && (
            <div className="space-y-5">
              {/* §7.15 — publish now or on a date, and close the vacancy
                  automatically so stale adverts don't linger. */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Publication schedule
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["now", "Publish now"],
                      ["schedule", "Schedule publication"],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={publishMode === value ? "default" : "outline"}
                      className="h-7 text-xs"
                      onClick={() => setPublishMode(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {publishMode === "schedule" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Publish on</Label>
                      <Input
                        type="date"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Expiry date</Label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={autoClose}
                    onCheckedChange={(v) => setAutoClose(v === true)}
                    disabled={!expiryDate}
                  />
                  <span className="text-xs text-muted-foreground">
                    Automatically close the vacancy on the expiry date
                  </span>
                </label>
              </div>

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

          {/* Step 6 — Review (read-only summary with edit jump-back) */}
          {step === 6 && (
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

              {/* Job advert — flags anything a job board would reject. */}
              <div className="rounded-lg border border-border/60 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Job advert
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
                  {WORK_MODE_LABELS[advert.workMode]}
                  {primaryLocationText ? ` · ${primaryLocationText}` : ""} ·{" "}
                  {advert.publishSalary
                    ? `Salary shown (${advert.salaryCurrency || "no currency"})`
                    : "Salary hidden"}{" "}
                  · {APPLY_MODE_LABELS[advert.apply.mode]}
                </p>
                {advertBlockers.length > 0 ? (
                  <p className="text-amber-600 dark:text-amber-400">
                    Missing for job boards: {advertBlockers.map((w) => w.field).join(", ")}
                  </p>
                ) : (
                  <p className="text-emerald-600 dark:text-emerald-400">
                    Ready to post to external job boards.
                  </p>
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
                    onClick={() => setStep(5)}
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
