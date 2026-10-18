"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Eye,
  FileText,
  HeartPulse,
  Lock,
  Paperclip,
  ShieldCheck,
  Stethoscope,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { FileDropzone } from "@/src/components/shared/file-dropzone";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  addDocument,
  logMedicalView,
  referToOH,
  setApproval,
  setExclusion,
  sicknessId,
  updateRecord,
} from "@/src/lib/stores/sickness-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import { spellLength, workingDaysLost } from "@/src/lib/sickness/bradford";
import { calculateSickPay } from "@/src/lib/sickness/sick-pay";
import {
  DOCUMENT_KIND_LABELS,
  FIT_NOTE_STATUS_LABELS,
  PROTECTED_CATEGORY_LABELS,
  SICKNESS_SOURCE_LABELS,
  type FitNoteStatus,
  type ProtectedCategory,
  type SicknessDocumentKind,
} from "@/src/lib/types/sickness";
import type { OHReferral } from "@/src/lib/types/occupational-health";
import { useFormatMoney } from "./money";
import {
  SICKNESS_BASE,
  payEmployee,
  useCanManageSickness,
  useCanViewMedical,
  useSickness,
  useSicknessActor,
} from "./hooks";
import {
  AbsenceStateBadge,
  ApprovalBadge,
  BradfordBadge,
  FitNoteBadge,
  RtwBadge,
  fmtDate,
  reasonFor,
} from "./ui";

/** One absence: details, evidence, approval, Bradford impact, sick pay, RTW, audit. */
export function SicknessRecordDetail({ id }: { id: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const s = useSickness();
  const actor = useSicknessActor();
  const canViewMedical = useCanViewMedical();
  const canManage = useCanManageSickness();
  const money = useFormatMoney();
  const approval = useAppSelector((st) =>
    st.approvals.requests.find((r) => r.documentType === "sickness_absence" && r.documentId === id),
  );
  const [showMedical, setShowMedical] = useState(false);
  const [docKind, setDocKind] = useState<SicknessDocumentKind>("fit_note");
  const [excludeOpen, setExcludeOpen] = useState(false);
  const [ohOpen, setOhOpen] = useState(false);

  const record = s.records.find((r) => r.id === id);
  const employee = record ? s.byId.get(record.employeeId) : undefined;
  const bradford = useMemo(() => (record ? s.bradfordFor(record.employeeId) : null), [record, s]);
  const pay = useMemo(() => {
    if (!record || !employee) return null;
    const { scheme } = s.schemeFor(record.employeeId, record.startDate);
    const days = calculateSickPay({
      employee: payEmployee(employee),
      scheme,
      records: s.records.filter((r) => r.employeeId === record.employeeId),
      asOf: s.asOf,
      holidays: s.holidays,
    }).filter((d) => d.recordId === record.id);
    return { scheme, days };
  }, [record, employee, s]);

  if (s.loading) return <Skeleton className="m-6 h-96" />;
  if (!record) {
    return (
      <div className="flex flex-col items-start gap-3 py-12">
        <h1 className="text-2xl font-semibold">Absence not found</h1>
        <Button variant="outline" onClick={() => router.push(SICKNESS_BASE)}>
          <ChevronLeft className="h-4 w-4" /> Back to absence records
        </Button>
      </div>
    );
  }

  const audit = s.audit.filter((a) => a.subjectId === record.id);
  const daysLost = workingDaysLost(record, s.asOf, employee?.workPattern?.schedule, s.holidays);

  function revealMedical() {
    dispatch(logMedicalView({ id: record!.id, actor }));
    setShowMedical(true);
  }

  function upload(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const doc = {
        id: sicknessId("DOC"),
        kind: docKind,
        name: f.name,
        sizeBytes: f.size,
        validFrom: record!.startDate,
        validTo: record!.endDate ?? record!.expectedReturnDate,
        uploadedAt: new Date().toISOString(),
        uploadedBy: actor,
      };
      if (f.size <= 1_500_000) {
        const reader = new FileReader();
        reader.onload = () => dispatch(addDocument({ id: record!.id, actor, document: { ...doc, dataUrl: String(reader.result) } }));
        reader.readAsDataURL(f);
      } else {
        dispatch(addDocument({ id: record!.id, actor, document: doc }));
      }
    }
    toast.success("Document added");
  }

  const facts: Array<[string, React.ReactNode]> = [
    ["First day", `${fmtDate(record.startDate)}${record.startPortion !== "full" ? " (part day)" : ""}${record.leftWorkAt ? ` · left at ${record.leftWorkAt}` : ""}`],
    ["Last day", record.endDate ? fmtDate(record.endDate) : `Ongoing${record.expectedReturnDate ? ` · expected back ${fmtDate(record.expectedReturnDate)}` : ""}`],
    ["Length", `${spellLength(record, s.asOf)} calendar days · ${daysLost} working days lost`],
    ["Type", record.kind === "medical_procedure" ? "Planned medical procedure" : "Sickness"],
    ["Reason", reasonFor(record, canViewMedical)],
    ["Reported", `${SICKNESS_SOURCE_LABELS[record.source]} by ${record.reportedBy.name} · ${fmtDate(record.reportedAt)}`],
    ["First notified", fmtDate(record.notifiedAt)],
    ["Hospital admission", record.hospitalised ? "Yes" : "No"],
    ["Overnight shift", record.overnightShift ? "Yes — counted on the shift's start day" : "No"],
  ];
  const linkedRecord = record.linkedRecordId ? s.records.find((r) => r.id === record.linkedRecordId) : undefined;

  return (
    <div className="flex flex-col gap-4 pb-10 pt-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1 text-muted-foreground" asChild>
        <Link href={SICKNESS_BASE}><ChevronLeft className="h-4 w-4" /> Absence records</Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{record.employeeName}</h1>
          <p className="text-sm text-muted-foreground">
            {record.department} · {fmtDate(record.startDate)} – {record.endDate ? fmtDate(record.endDate) : "ongoing"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ApprovalBadge status={record.approvalStatus} />
            <AbsenceStateBadge record={record} />
            <FitNoteBadge status={record.fitNoteStatus} />
            <RtwBadge status={record.rtw.status} />
          </div>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            {(record.absenceState === "ongoing" || record.rtw.status === "pending") && (
              <Button asChild className="gap-1.5">
                <Link href={`${SICKNESS_BASE}/return-to-work/${record.id}`}><Undo2 className="h-4 w-4" /> Return to work</Link>
              </Button>
            )}
            <Button variant="outline" className="gap-1.5" onClick={() => setOhOpen(true)} disabled={!!record.ohReferralId}>
              <Stethoscope className="h-4 w-4" /> {record.ohReferralId ? "Referred to OH" : "Refer to Occupational Health"}
            </Button>
            {canViewMedical && (
              <Button variant="outline" className="gap-1.5" onClick={() => setExcludeOpen(true)}>
                <ShieldCheck className="h-4 w-4" /> {record.exclusion ? "Edit Bradford exclusion" : "Exclude from Bradford"}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Absence details</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] text-muted-foreground">{k}</dt>
                <dd className="text-sm">{v}</dd>
              </div>
            ))}
            {linkedRecord && (
              <div>
                <dt className="text-[11px] text-muted-foreground">Continuation of</dt>
                <dd className="text-sm">
                  <Link className="text-primary hover:underline" href={`${SICKNESS_BASE}/records/${linkedRecord.id}`}>
                    Absence from {fmtDate(linkedRecord.startDate)}
                  </Link>
                </dd>
              </div>
            )}
            {record.linkedCaseId && (
              <div>
                <dt className="text-[11px] text-muted-foreground">Linked case</dt>
                <dd className="text-sm">
                  {record.linkedCaseId.startsWith("ARC") ? (
                    <Link className="text-primary hover:underline" href={`${SICKNESS_BASE}/bradford?case=${record.linkedCaseId}`}>Review case</Link>
                  ) : (
                    <Link className="text-primary hover:underline" href={`/time-payroll/occupational-health/${record.linkedCaseId}`}>Occupational Health case</Link>
                  )}
                </dd>
              </div>
            )}
          </dl>
          {record.exclusion && (
            <p className="mt-3 rounded-md border border-violet-500/30 bg-violet-50 dark:bg-violet-950 px-3 py-2 text-xs text-violet-700 dark:text-violet-300">
              Excluded from the Bradford score — {PROTECTED_CATEGORY_LABELS[record.exclusion.category]}: {record.exclusion.reason} (approved by {record.exclusion.approvedBy}, {fmtDate(record.exclusion.approvedAt)})
            </p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Lock className="h-3.5 w-3.5" /> Medical details</h2>
          {!canViewMedical ? (
            <p className="text-xs text-muted-foreground">Only authorised HR users can see medical details.</p>
          ) : showMedical ? (
            <div className="space-y-2 text-sm">
              <p><span className="text-[11px] text-muted-foreground">Category</span><br />{record.reasonCategory}</p>
              <p><span className="text-[11px] text-muted-foreground">What the employee said</span><br />{record.reasonDetail || "Nothing recorded"}</p>
              <p className="text-[11px] text-muted-foreground">This view was recorded in the audit log.</p>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={revealMedical}>
              <Eye className="h-3.5 w-3.5" /> Show medical details
            </Button>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Fit notes &amp; documents</h2>
            {canManage && (
              <Select
                value={record.fitNoteStatus}
                onValueChange={(v) =>
                  dispatch(updateRecord({ id: record.id, actor, changes: { fitNoteStatus: v as FitNoteStatus }, note: `Fit note: ${FIT_NOTE_STATUS_LABELS[v as FitNoteStatus]}` }))
                }
              >
                <SelectTrigger size="sm" className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(FIT_NOTE_STATUS_LABELS) as FitNoteStatus[]).map((k) => (
                    <SelectItem key={k} value={k} className="text-xs">{FIT_NOTE_STATUS_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {record.documents.length === 0 ? (
            <p className="mb-3 text-xs text-muted-foreground">No documents yet.</p>
          ) : (
            <ul className="mb-3 space-y-1.5">
              {record.documents.map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-xs">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{DOCUMENT_KIND_LABELS[d.kind]}</span>
                  {canViewMedical && d.dataUrl ? (
                    <a href={d.dataUrl} download={d.name} className="text-primary hover:underline" onClick={() => dispatch(logMedicalView({ id: record.id, actor }))}>{d.name}</a>
                  ) : (
                    <span>{canViewMedical ? d.name : "Restricted"}</span>
                  )}
                  <span className="text-muted-foreground">
                    {d.validFrom ? `${fmtDate(d.validFrom)} – ${fmtDate(d.validTo)}` : ""} · {fmtDate(d.uploadedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {canManage && (
            <div className="space-y-2">
              <Select value={docKind} onValueChange={(v) => setDocKind(v as SicknessDocumentKind)}>
                <SelectTrigger size="sm" className="h-7 w-48 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(DOCUMENT_KIND_LABELS) as SicknessDocumentKind[]).map((k) => (
                    <SelectItem key={k} value={k} className="text-xs">{DOCUMENT_KIND_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FileDropzone onFiles={upload} multiple accept=".pdf,.jpg,.jpeg,.png" label="Upload a fit note or document" />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Approval</h2>
          {approval ? (
            <div className="space-y-2 text-xs">
              {approval.steps.map((st, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                  <span>{st.label}</span>
                  <span className="capitalize text-muted-foreground">{st.status}</span>
                </div>
              ))}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/hr-action-center/submissions/${approval.id}`}>Open in Submissions &amp; Approvals</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>Recorded before the sickness approval chain existed.</p>
              {canManage && record.approvalStatus === "awaiting_approval" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => dispatch(setApproval({ id: record.id, status: "approved", actor }))}>Confirm absence</Button>
                  <Button size="sm" variant="outline" onClick={() => dispatch(setApproval({ id: record.id, status: "rejected", actor, note: "Not confirmed" }))}>Reject</Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold"><HeartPulse className="h-3.5 w-3.5" /> Bradford Factor impact</h2>
            {bradford && <BradfordBadge action={bradford.action} score={bradford.score} />}
          </div>
          {bradford && (
            <>
              <p className="text-xs text-muted-foreground">
                {record.employeeName}: {bradford.S} episode{bradford.S === 1 ? "" : "s"} and {bradford.D} days in the last {s.settings.bradford.windowWeeks} weeks → {bradford.S}² × {bradford.D} = <b className="text-foreground">{bradford.score}</b>
              </p>
              <Link href={`${SICKNESS_BASE}/bradford?employee=${record.employeeId}`} className="mt-2 inline-block text-xs text-primary hover:underline">
                See the full calculation and review history →
              </Link>
              <p className="mt-2 text-[11px] text-muted-foreground">A management indicator only — it never triggers disciplinary action.</p>
            </>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Sick pay</h2>
          {!pay || pay.days.length === 0 ? (
            <p className="text-xs text-muted-foreground">No paid working days in this absence.</p>
          ) : (
            <>
              <p className="mb-2 text-xs text-muted-foreground">
                Scheme: {pay.scheme?.name ?? "None — statutory only"} · company pay {money(pay.days.reduce((a, d) => a + d.ospAmount, 0))} · statutory {money(pay.days.reduce((a, d) => a + d.sspAmount, 0))}
              </p>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-[11px]">
                  <tbody>
                    {pay.days.map((d) => (
                      <tr key={d.date} className="border-t border-border/60">
                        <td className="py-1 pr-2 tabular-nums">{fmtDate(d.date, "EEE d MMM")}</td>
                        <td className="py-1 pr-2">{d.stepLabel}</td>
                        <td className="py-1 pr-2 text-right tabular-nums">{money(d.ospAmount)}</td>
                        <td className="py-1 text-muted-foreground">{d.basis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Return to work</h2>
        {record.rtw.status === "not_due" ? (
          <p className="text-xs text-muted-foreground">Still off — the return-to-work form opens when they come back.</p>
        ) : (
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-[11px] text-muted-foreground">Returned</dt><dd>{fmtDate(record.rtw.returnDate)}</dd></div>
            <div><dt className="text-[11px] text-muted-foreground">Interview</dt><dd>{record.rtw.interviewHeld ? `Held ${fmtDate(record.rtw.interviewDate)} by ${record.rtw.interviewer ?? "—"}` : "Not yet held"}</dd></div>
            <div><dt className="text-[11px] text-muted-foreground">Safe to return</dt><dd>{record.rtw.safeToReturn == null ? "—" : record.rtw.safeToReturn ? "Yes" : "No"}</dd></div>
            {record.rtw.employeeConfirmedAt && <div><dt className="text-[11px] text-muted-foreground">Employee confirmed</dt><dd>{fmtDate(record.rtw.employeeConfirmedAt)}</dd></div>}
            {record.rtw.notes && canViewMedical && <div className="sm:col-span-3"><dt className="text-[11px] text-muted-foreground">Notes</dt><dd>{record.rtw.notes}</dd></div>}
          </dl>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><FileText className="h-3.5 w-3.5" /> Audit history</h2>
        {audit.length === 0 ? (
          <p className="text-xs text-muted-foreground">No changes recorded since this absence moved into Sickness &amp; Absence.</p>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {audit.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="w-36 shrink-0 tabular-nums text-muted-foreground">{fmtDate(a.at, "d MMM yyyy HH:mm")}</span>
                <span><b>{a.actor}</b> {a.action.replace(/_/g, " ")}{a.note ? ` — ${a.note}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ExclusionDialog open={excludeOpen} onOpenChange={setExcludeOpen} recordId={record.id} current={record.exclusion} />
      <ReferToOHDialog open={ohOpen} onOpenChange={setOhOpen} recordId={record.id} />
    </div>
  );
}

function ExclusionDialog({
  open,
  onOpenChange,
  recordId,
  current,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  recordId: string;
  current?: { category: ProtectedCategory; reason: string };
}) {
  const dispatch = useAppDispatch();
  const actor = useSicknessActor();
  const [category, setCategory] = useState<ProtectedCategory>(current?.category ?? "disability");
  const [reason, setReason] = useState(current?.reason ?? "");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Exclude from the Bradford score</DialogTitle>
          <DialogDescription className="text-xs">
            Absence related to disability, pregnancy or an agreed adjustment shouldn&apos;t count towards
            attendance triggers. The exclusion and your reason are kept in the audit history.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Circumstance</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ProtectedCategory)}>
              <SelectTrigger className="h-9 w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PROTECTED_CATEGORY_LABELS) as ProtectedCategory[]).map((k) => (
                  <SelectItem key={k} value={k}>{PROTECTED_CATEGORY_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reason (required)</Label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-between gap-2 border-t border-border pt-3">
          {current ? (
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { dispatch(setExclusion({ id: recordId, exclusion: null, actor })); onOpenChange(false); toast.success("Exclusion removed — score recalculated"); }}>
              Remove exclusion
            </Button>
          ) : <span />}
          <Button
            size="sm"
            disabled={reason.trim().length < 5}
            onClick={() => {
              dispatch(setExclusion({ id: recordId, actor, exclusion: { category, reason: reason.trim(), approvedBy: actor, approvedAt: new Date().toISOString() } }));
              onOpenChange(false);
              toast.success("Excluded — Bradford score recalculated");
            }}
          >
            Save exclusion
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Refer the absence straight into Occupational Health (no diagnosis is passed). */
function ReferToOHDialog({ open, onOpenChange, recordId }: { open: boolean; onOpenChange: (o: boolean) => void; recordId: string }) {
  const dispatch = useAppDispatch();
  const s = useSickness();
  const actor = useSicknessActor();
  const record = s.records.find((r) => r.id === recordId);
  const related = record ? s.records.filter((r) => r.employeeId === record.employeeId && r.id !== record.id).slice(0, 6) : [];
  const [include, setInclude] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  if (!record) return null;

  function refer() {
    const today = new Date().toISOString().slice(0, 10);
    const referral: OHReferral = {
      id: `OH-${Date.now().toString(36).toUpperCase()}`,
      employeeId: record!.employeeId,
      employeeName: record!.employeeName,
      employeeInitials: record!.employeeInitials,
      department: record!.department,
      absenceStartDate: record!.startDate,
      referralDate: today,
      status: "referred",
      fitnessStatus: "pending",
      adjustments: [],
      equalityActConsidered: false,
      caseNotes: question.trim() || undefined,
      caseOwner: actor,
      nextAction: { label: "Await OH assessment appointment", owner: "Occupational Health", due: today },
      history: [{ id: "h1", at: new Date().toISOString(), actorName: actor, note: "Referred from Sickness & Absence" }],
    };
    dispatch(referToOH({ referral, recordIds: [record!.id, ...include], actor }));
    dispatch(
      pushNotification({
        title: "Occupational Health referral",
        description: `${record!.employeeName} has been referred to Occupational Health.`,
        type: "info",
        recipientRoleIds: ["ROLE-HRMGR", "ROLE-HRADMIN"],
        href: `/time-payroll/occupational-health/${referral.id}`,
      }),
    );
    toast.success("Referred to Occupational Health");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Refer to Occupational Health</DialogTitle>
          <DialogDescription className="text-xs">
            Opens an OH case linked to this absence. OH records fitness-for-work and recommended
            adjustments only — no diagnosis is shared.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          {related.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Also link earlier absences</Label>
              {related.map((r) => (
                <label key={r.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={include.includes(r.id)} onChange={(e) => setInclude((x) => (e.target.checked ? [...x, r.id] : x.filter((y) => y !== r.id)))} />
                  {fmtDate(r.startDate)} – {r.endDate ? fmtDate(r.endDate) : "ongoing"}
                </label>
              ))}
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Questions for Occupational Health</Label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder="e.g. Is a phased return advisable? Are adjustments needed?" className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={refer}>Refer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
