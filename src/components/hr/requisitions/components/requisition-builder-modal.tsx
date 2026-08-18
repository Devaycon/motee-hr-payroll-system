"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { store } from "@/src/lib/stores/store";
import { DEPARTMENT_OPTIONS } from "@/src/data/recruitment-demo";
import { buildWorkforceDemo } from "@/src/data/workforce-requests-demo";
import {
  submitApproval,
  upsertRequests,
} from "@/src/lib/stores/approvals-slice";
import { seedCountry as seedWorkforce } from "@/src/lib/stores/workforce-requests-slice";
import {
  addRequest,
  updateRequest,
  uid,
  type Requisition,
} from "@/src/lib/stores/requisitions-slice";

const STEPS = ["Select workforce", "Requisition details", "Review & submit"];

interface ReqForm {
  workforceRequestId: string;
  workforceLabel: string;
  title: string;
  jobDescription: string;
  department: string;
  location: string;
  numberOfPositions: number;
  salaryMin: number;
  salaryMax: number;
  qualifications: string;
  startDate: string;
  durationMonths: string;
  reportingManager: string;
  budgetAllocation: number;
  // §7.10 — the band candidates and approvers actually see.
  salaryBandName: string;
  salaryCurrency: string;
  // §7.9 — the hiring team, beyond the reporting line.
  hiringManager: string;
  recruiter: string;
  hrBusinessPartner: string;
  interviewPanel: string;
  // §7.11 — write it, reuse a template, or attach a document.
  jobDescriptionSource: "written" | "template" | "upload";
  jobDescriptionTemplateId: string;
  jobDescriptionFileName: string;
}

const EMPTY: ReqForm = {
  workforceRequestId: "",
  workforceLabel: "",
  title: "",
  jobDescription: "",
  department: DEPARTMENT_OPTIONS[0],
  location: "",
  numberOfPositions: 1,
  salaryMin: 0,
  salaryMax: 0,
  qualifications: "",
  startDate: "",
  durationMonths: "",
  reportingManager: "",
  budgetAllocation: 0,
  salaryBandName: "",
  salaryCurrency: "",
  hiringManager: "",
  recruiter: "",
  hrBusinessPartner: "",
  interviewPanel: "",
  jobDescriptionSource: "written",
  jobDescriptionTemplateId: "",
  jobDescriptionFileName: "",
};

/**
 * §7.11 — reusable job descriptions. Most roles are re-advertised with the
 * same wording, so retyping it invites drift between postings.
 */
export const JD_TEMPLATES: { id: string; name: string; body: string }[] = [
  {
    id: "jd-generic-manager",
    name: "People Manager",
    body: "Lead and develop a team, set objectives, run performance reviews, and own delivery for your area.",
  },
  {
    id: "jd-generic-specialist",
    name: "Specialist / Individual Contributor",
    body: "Own a specialist area end to end, advise stakeholders, and deliver work to agreed standards and deadlines.",
  },
  {
    id: "jd-generic-analyst",
    name: "Analyst",
    body: "Gather and analyse data, produce reporting and insight, and support decision-making across the business.",
  },
  {
    id: "jd-generic-admin",
    name: "Administrator",
    body: "Provide day-to-day administrative support, maintain records, and coordinate scheduling and correspondence.",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Requisition | null;
}

export function RequisitionBuilderModal({ open, onOpenChange, editing }: Props) {
  const dispatch = useAppDispatch();
  const { format: formatMoney } = useCurrency();
  const country = useAppSelector((s) => s.locale.country);
  const user = useAppSelector((s) => s.auth.user);
  const workforceRequests = useAppSelector(
    (s) => s.workforceRequests.byCountry[country] ?? [],
  );
  const approvals = useAppSelector((s) => s.approvals.requests);

  const approvedWorkforces = useMemo(() => {
    const byId = new Map(approvals.map((r) => [r.id, r]));
    return workforceRequests.filter(
      (w) =>
        w.approvalRequestId &&
        byId.get(w.approvalRequestId)?.status === "approved",
    );
  }, [workforceRequests, approvals]);

  // The workforce requests + their approvals are normally seeded by the
  // Workforce Requests list page. Seed them here too (both dispatches are
  // idempotent) so the "Approved workforce" dropdown is populated even when
  // this builder is opened without visiting that page first.
  useEffect(() => {
    const demo = buildWorkforceDemo();
    dispatch(seedWorkforce({ country, requests: demo.requests }));
    dispatch(upsertRequests(demo.approvals));
  }, [country, dispatch]);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ReqForm>(EMPTY);
  const [seededOpen, setSeededOpen] = useState(false);

  // Seed the form each time the modal opens (edit → step 2, source locked).
  if (open !== seededOpen) {
    setSeededOpen(open);
    if (open) {
      if (editing) {
        setForm({
          workforceRequestId: editing.workforceRequestId,
          workforceLabel: editing.workforceLabel,
          title: editing.title,
          jobDescription: editing.jobDescription,
          department: editing.department,
          location: editing.location,
          numberOfPositions: editing.numberOfPositions,
          salaryMin: editing.salaryMin,
          salaryMax: editing.salaryMax,
          qualifications: editing.qualifications,
          startDate: editing.startDate,
          durationMonths: editing.durationMonths ? String(editing.durationMonths) : "",
          reportingManager: editing.reportingManager,
          budgetAllocation: editing.budgetAllocation,
          salaryBandName: editing.salaryBandName ?? "",
          salaryCurrency: editing.salaryCurrency ?? "",
          hiringManager: editing.hiringManager ?? "",
          recruiter: editing.recruiter ?? "",
          hrBusinessPartner: editing.hrBusinessPartner ?? "",
          interviewPanel: (editing.interviewPanel ?? []).join(", "),
          jobDescriptionSource: editing.jobDescriptionSource ?? "written",
          jobDescriptionTemplateId: editing.jobDescriptionTemplateId ?? "",
          jobDescriptionFileName: editing.jobDescriptionFileName ?? "",
        });
        setStep(1);
      } else {
        setForm({ ...EMPTY });
        setStep(0);
      }
    }
  }

  const set = <K extends keyof ReqForm>(k: K, v: ReqForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function pickWorkforce(id: string) {
    const wf = approvedWorkforces.find((w) => w.id === id);
    if (!wf) return;
    setForm((f) => ({
      ...f,
      workforceRequestId: wf.id,
      workforceLabel: `${wf.numberOfHires} hire${wf.numberOfHires === 1 ? "" : "s"} — ${wf.department}`,
      department: wf.department,
      numberOfPositions: wf.numberOfHires,
      startDate: wf.expectedStartDate || f.startDate,
      budgetAllocation: wf.budgetEstimate || f.budgetAllocation,
      title: f.title || `${wf.department} role`,
    }));
  }

  function buildRecord(): Requisition {
    return {
      id: editing?.id ?? uid("REQ"),
      workforceRequestId: form.workforceRequestId,
      workforceLabel: form.workforceLabel,
      title: form.title.trim(),
      jobDescription: form.jobDescription.trim(),
      salaryBandName: form.salaryBandName.trim() || undefined,
      salaryCurrency: form.salaryCurrency.trim() || undefined,
      hiringManager: form.hiringManager.trim() || undefined,
      recruiter: form.recruiter.trim() || undefined,
      hrBusinessPartner: form.hrBusinessPartner.trim() || undefined,
      interviewPanel: form.interviewPanel
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      jobDescriptionSource: form.jobDescriptionSource,
      jobDescriptionTemplateId: form.jobDescriptionTemplateId || undefined,
      jobDescriptionFileName: form.jobDescriptionFileName || undefined,
      department: form.department,
      location: form.location.trim(),
      numberOfPositions: Math.max(1, form.numberOfPositions),
      salaryMin: form.salaryMin,
      salaryMax: form.salaryMax,
      qualifications: form.qualifications.trim(),
      startDate: form.startDate,
      durationMonths: form.durationMonths ? Number(form.durationMonths) : undefined,
      reportingManager: form.reportingManager.trim(),
      budgetAllocation: form.budgetAllocation,
      status: editing?.status ?? "draft",
      lifecycleStatus: editing?.lifecycleStatus ?? "active",
      approvalRequestId: editing?.approvalRequestId,
      recruitmentId: editing?.recruitmentId,
      createdById: editing?.createdById ?? user?.employeeId ?? "",
      createdByName: editing?.createdByName ?? user?.name ?? "—",
      createdAt: editing?.createdAt ?? new Date().toISOString().slice(0, 10),
    };
  }

  function validate(): boolean {
    if (!form.workforceRequestId) {
      toast.error("Select an approved workforce first.");
      return false;
    }
    if (form.title.trim().length < 2) {
      toast.error("Add a requisition title.");
      return false;
    }
    return true;
  }

  function saveDraft() {
    if (!validate()) return;
    const record = buildRecord();
    if (editing) {
      dispatch(updateRequest({ country, id: record.id, patch: record }));
      toast.success("Requisition updated");
    } else {
      dispatch(addRequest({ country, requisition: record }));
      toast.success("Draft requisition saved");
    }
    onOpenChange(false);
  }

  async function submitForApproval() {
    if (!validate()) return;
    if (!user) {
      toast.error("You must be logged in to submit.");
      return;
    }
    const record = buildRecord();
    dispatch(addRequest({ country, requisition: record }));
    await dispatch(
      submitApproval({
        documentType: "job_requisition",
        documentId: record.id,
        documentTitle: `${record.title} — ${record.department}`,
        documentSummary: record.jobDescription,
        payloadSnapshot: {
          title: record.title,
          department: record.department,
          location: record.location,
          numberOfPositions: record.numberOfPositions,
          salaryMin: record.salaryMin,
          salaryMax: record.salaryMax,
        },
        submitter: {
          employeeId: user.employeeId,
          name: user.name,
          initials: user.initials,
          departmentName: user.departmentName,
        },
      }),
    );
    const created = store
      .getState()
      .approvals.requests.find(
        (r) => r.documentType === "job_requisition" && r.documentId === record.id,
      );
    if (created) {
      dispatch(updateRequest({ country, id: record.id, patch: { approvalRequestId: created.id } }));
      toast.success("Requisition submitted for approval (Manager → HR → Finance)");
    } else {
      toast.error("Could not submit — no job-requisition workflow found.");
    }
    onOpenChange(false);
  }

  const canNext = step === 0 ? Boolean(form.workforceRequestId) : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit requisition" : "Create requisition"}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                  i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs",
                  i === step ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="text-muted-foreground">›</span>}
            </div>
          ))}
        </div>

        {/* Step 1 — select approved workforce */}
        {step === 0 && (
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Approved workforce</Label>
              <Select value={form.workforceRequestId} onValueChange={pickWorkforce}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an approved workforce…" />
                </SelectTrigger>
                <SelectContent>
                  {approvedWorkforces.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No approved workforces yet.
                    </div>
                  ) : (
                    approvedWorkforces.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.numberOfHires} hire{w.numberOfHires === 1 ? "" : "s"} — {w.department}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The requisition is raised against an approved headcount request.
              </p>
            </div>
            {form.workforceRequestId && (
              <div className="rounded-lg border border-border/60 p-3 text-sm">
                <p className="font-medium text-foreground">{form.workforceLabel}</p>
                <p className="text-xs text-muted-foreground">
                  Prefilled department, positions, start date and budget from this workforce.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — details */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="col-span-2 space-y-1.5">
              <Label>Requisition title</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Senior Backend Engineer" />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(v) => set("department", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Lagos (Hybrid)" />
            </div>
            <div className="space-y-1.5">
              <Label>Number of positions</Label>
              <Input type="number" min={1} value={form.numberOfPositions} onChange={(e) => set("numberOfPositions", Math.max(1, Number(e.target.value) || 1))} />
            </div>
            <div className="space-y-1.5">
              <Label>Reporting manager</Label>
              <Input value={form.reportingManager} onChange={(e) => set("reportingManager", e.target.value)} placeholder="Manager name" />
            </div>
            {/* §7.9 — the hiring team. Without it nobody knows who screens,
                who interviews, or who owns the offer. */}
            <div className="space-y-1.5">
              <Label>Hiring manager</Label>
              <Input value={form.hiringManager} onChange={(e) => set("hiringManager", e.target.value)} placeholder="Owns the hire" />
            </div>
            <div className="space-y-1.5">
              <Label>Recruiter</Label>
              <Input value={form.recruiter} onChange={(e) => set("recruiter", e.target.value)} placeholder="Runs the pipeline" />
            </div>
            <div className="space-y-1.5">
              <Label>HR Business Partner</Label>
              <Input value={form.hrBusinessPartner} onChange={(e) => set("hrBusinessPartner", e.target.value)} placeholder="HRBP name" />
            </div>
            <div className="space-y-1.5">
              <Label>Interview panel</Label>
              <Input value={form.interviewPanel} onChange={(e) => set("interviewPanel", e.target.value)} placeholder="Comma-separated names" />
            </div>

            {/* §7.10 — a named band, with the numbers behind it. */}
            <div className="col-span-2 space-y-1.5">
              <Label>Salary band</Label>
              <Input value={form.salaryBandName} onChange={(e) => set("salaryBandName", e.target.value)} placeholder="e.g. Band 5 / Senior Advisor" />
            </div>
            <div className="space-y-1.5">
              <Label>Band minimum</Label>
              <Input type="number" min={0} value={form.salaryMin} onChange={(e) => set("salaryMin", Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Band maximum</Label>
              <Input type="number" min={0} value={form.salaryMax} onChange={(e) => set("salaryMax", Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input value={form.salaryCurrency} onChange={(e) => set("salaryCurrency", e.target.value.toUpperCase())} placeholder="e.g. GBP" maxLength={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (months, if contract)</Label>
              <Input type="number" min={0} value={form.durationMonths} onChange={(e) => set("durationMonths", e.target.value)} placeholder="Leave blank if permanent" />
            </div>
            <div className="space-y-1.5">
              <Label>Budget allocation</Label>
              <Input type="number" min={0} value={form.budgetAllocation} onChange={(e) => set("budgetAllocation", Number(e.target.value) || 0)} />
            </div>
            {/* §7.11 — most roles are re-advertised with the same wording, so
                offer a template or an upload rather than retyping it. */}
            <div className="col-span-2 space-y-1.5">
              <Label>Job description</Label>
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ["written", "Write it"],
                    ["template", "Use a template"],
                    ["upload", "Upload a document"],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={
                      form.jobDescriptionSource === value ? "default" : "outline"
                    }
                    className="h-7 text-xs"
                    onClick={() => set("jobDescriptionSource", value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {form.jobDescriptionSource === "template" && (
                <Select
                  value={form.jobDescriptionTemplateId}
                  onValueChange={(v) => {
                    const tpl = JD_TEMPLATES.find((t) => t.id === v);
                    set("jobDescriptionTemplateId", v);
                    if (tpl) set("jobDescription", tpl.body);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a job description template" />
                  </SelectTrigger>
                  <SelectContent>
                    {JD_TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {form.jobDescriptionSource === "upload" && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border p-3">
                  <span className="text-xs text-muted-foreground">
                    {form.jobDescriptionFileName || "No document attached"}
                  </span>
                  <label className="cursor-pointer text-xs font-medium text-primary">
                    Choose file
                    <input
                      type="file"
                      accept="application/pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) =>
                        set(
                          "jobDescriptionFileName",
                          e.target.files?.[0]?.name ?? "",
                        )
                      }
                    />
                  </label>
                </div>
              )}

              <Textarea
                rows={3}
                value={form.jobDescription}
                onChange={(e) => set("jobDescription", e.target.value)}
                placeholder="Summary of the role and responsibilities…"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Required qualifications</Label>
              <Textarea rows={2} value={form.qualifications} onChange={(e) => set("qualifications", e.target.value)} placeholder="Key qualifications and experience…" />
            </div>
          </div>
        )}

        {/* Step 3 — review */}
        {step === 2 && (
          <div className="space-y-3 py-1">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border/60 p-4 text-sm sm:grid-cols-3">
              {[
                { label: "Title", value: form.title || "—" },
                { label: "Source workforce", value: form.workforceLabel || "—" },
                { label: "Department", value: form.department },
                { label: "Location", value: form.location || "—" },
                { label: "Positions", value: String(form.numberOfPositions) },
                { label: "Salary range", value: `${formatMoney(form.salaryMin)} – ${formatMoney(form.salaryMax)}` },
                { label: "Start date", value: form.startDate || "—" },
                { label: "Duration", value: form.durationMonths ? `${form.durationMonths} months` : "Permanent" },
                { label: "Reporting manager", value: form.reportingManager || "—" },
                { label: "Budget", value: formatMoney(form.budgetAllocation) },
              ].map((f) => (
                <div key={f.label} className="flex flex-col gap-0.5">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                  <dd className="text-foreground">{f.value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted-foreground">
              Submitting routes the requisition through the approval chain (Manager → HR → Finance).
            </p>
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {step > 0 && !editing && (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {editing ? (
              <Button onClick={saveDraft}>Save changes</Button>
            ) : step < STEPS.length - 1 ? (
              <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Next
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={saveDraft}>
                  Save as draft
                </Button>
                <Button onClick={submitForApproval}>Submit for approval</Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
