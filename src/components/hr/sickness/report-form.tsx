"use client";

import { useMemo, useState } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { AlertTriangle, FileCheck2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { FileDropzone } from "@/src/components/shared/file-dropzone";
import { EmployeePicker } from "@/src/components/shared/employee-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { reportSickness, sicknessId } from "@/src/lib/stores/sickness-slice";
import { submitApproval } from "@/src/lib/stores/approvals-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import { SICKNESS_REASON_CATEGORIES, type SicknessReasonCategory } from "@/src/lib/constants/sickness";
import {
  DOCUMENT_KIND_LABELS,
  REVIEW_TRIGGER_LABELS,
  type DayPortion,
  type SicknessDocument,
  type SicknessDocumentKind,
  type SicknessKind,
  type SicknessRecord,
} from "@/src/lib/types/sickness";
import { useSickness, useSicknessActor } from "./hooks";
import { fmtDate } from "./ui";

const MAX_INLINE_BYTES = 1_500_000;
const HR_ROLES = ["ROLE-HRMGR", "ROLE-HRADMIN"];

type Mode = "hr" | "self";

/**
 * Report Sickness — HR or a manager logging on someone's behalf, or the
 * employee reporting themselves. Creates the absence record, starts the
 * sickness approval chain and tells the people the employee's scheme names.
 */
export function ReportSicknessForm({
  mode,
  onDone,
  initialEmployeeId,
}: {
  mode: Mode;
  onDone: (id: string) => void;
  initialEmployeeId?: string;
}) {
  const dispatch = useAppDispatch();
  const s = useSickness();
  const user = useAppSelector((st) => st.auth.user);
  const actor = useSicknessActor();
  const today = s.asOf;

  const [employeeId, setEmployeeId] = useState<string | undefined>(
    mode === "self" ? user?.employeeId : initialEmployeeId,
  );
  const [kind, setKind] = useState<SicknessKind | "time_attendance">("sickness");
  const [returned, setReturned] = useState(false);
  const [reason, setReason] = useState<SicknessReasonCategory | "">("");
  const [detail, setDetail] = useState("");
  const [hasDoc, setHasDoc] = useState(false);
  const [docKind, setDocKind] = useState<SicknessDocumentKind>("fit_note");
  const [docs, setDocs] = useState<SicknessDocument[]>([]);
  const [startDate, setStartDate] = useState(today);
  const [allDay, setAllDay] = useState(true);
  const [leftAt, setLeftAt] = useState("");
  const [expectedEnd, setExpectedEnd] = useState("");
  const [lastDay, setLastDay] = useState("");
  const [notified, setNotified] = useState(today);
  const [hospital, setHospital] = useState(false);
  const [overnight, setOvernight] = useState(false);
  const [linkTo, setLinkTo] = useState("none");
  const [rtwConfirmed, setRtwConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const employee = employeeId ? s.byId.get(employeeId) : undefined;
  const { scheme } = employeeId ? s.schemeFor(employeeId, startDate) : { scheme: null };
  const selfCertDays = scheme?.advanced.selfCertDays ?? s.settings.selfCertDays;
  const endForRule = returned ? lastDay : expectedEnd;
  const spanDays = endForRule && startDate ? differenceInCalendarDays(parseISO(endForRule), parseISO(startDate)) + 1 : null;
  const fitNoteRequired = spanDays != null && spanDays > selfCertDays;
  const hasFitNote = docs.some((d) => d.kind === "fit_note");

  // Link targets: open review cases, OH cases and the employee's recent episodes.
  const linkOptions = useMemo(() => {
    if (!employeeId) return [];
    const out: Array<[string, string]> = [];
    for (const c of s.reviewCases.filter((c) => c.employeeId === employeeId && c.status !== "closed")) {
      out.push([`case:${c.id}`, `Review case — ${REVIEW_TRIGGER_LABELS[c.trigger]} (opened ${fmtDate(c.openedAt)})`]);
    }
    for (const c of s.ohCases.filter((c) => c.employeeId === employeeId && c.status !== "closed")) {
      out.push([`oh:${c.id}`, `Occupational Health case ${c.id}`]);
    }
    for (const r of s.records.filter((r) => r.employeeId === employeeId).slice(0, 8)) {
      out.push([`rec:${r.id}`, `Continuation of absence from ${fmtDate(r.startDate)}${r.endDate ? ` to ${fmtDate(r.endDate)}` : " (ongoing)"}`]);
    }
    return out;
  }, [employeeId, s.reviewCases, s.ohCases, s.records]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const doc: SicknessDocument = {
        id: sicknessId("DOC"),
        kind: docKind,
        name: f.name,
        sizeBytes: f.size,
        validFrom: startDate,
        validTo: (returned ? lastDay : expectedEnd) || undefined,
        uploadedAt: new Date().toISOString(),
        uploadedBy: actor,
      };
      if (f.size <= MAX_INLINE_BYTES) {
        const reader = new FileReader();
        reader.onload = () => setDocs((d) => d.map((x) => (x.id === doc.id ? { ...x, dataUrl: String(reader.result) } : x)));
        reader.readAsDataURL(f);
      }
      setDocs((d) => [...d, doc]);
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!employeeId) e.employee = "Choose the employee";
    if (!reason) e.reason = "Choose the cause of sickness";
    if (!startDate) e.start = "Enter the first day of sickness";
    if (!notified) e.notified = "Enter when the employee first notified you";
    if (notified && startDate && notified < startDate && differenceInCalendarDays(parseISO(startDate), parseISO(notified)) > 60) {
      e.notified = "Notification date looks too early";
    }
    if (!allDay && !leftAt) e.leftAt = "Enter the time they left work";
    if (returned && !lastDay) e.lastDay = "Enter their last day of sickness";
    if (returned && lastDay && lastDay < startDate) e.lastDay = "Last day can't be before the first day";
    if (!returned && expectedEnd && expectedEnd < startDate) e.expectedEnd = "Expected end can't be before the first day";
    if (startDate > today && kind !== "medical_procedure") e.start = "Sickness can't start in the future — use 'Plan time off for a medical procedure'";
    if (mode === "self" && returned && !rtwConfirmed) e.rtw = "Confirm you are fit and back at work";
    // Overlap with an existing open record for the same person.
    if (employeeId && startDate) {
      const clash = s.records.find(
        (r) =>
          r.employeeId === employeeId &&
          r.approvalStatus !== "rejected" &&
          r.approvalStatus !== "cancelled" &&
          r.startDate <= (returned ? lastDay || startDate : expectedEnd || startDate) &&
          (r.endDate ?? "9999-12-31") >= startDate,
      );
      if (clash && linkTo !== `rec:${clash.id}`) {
        e.start = `Overlaps the absence starting ${fmtDate(clash.startDate)} — link it as a continuation or change the dates`;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate() || !employee || !reason) return;
    const now = new Date().toISOString();
    const isProcedure = kind === "medical_procedure";
    const id = sicknessId("SCK");
    const portion: DayPortion = allDay ? "full" : "pm";
    const linkedRecordId = linkTo.startsWith("rec:") ? linkTo.slice(4) : undefined;
    const linkedCaseId = linkTo.startsWith("case:") ? linkTo.slice(5) : linkTo.startsWith("oh:") ? linkTo.slice(3) : undefined;
    const source = mode === "self" ? "self" : kind === "time_attendance" ? "time_attendance" : user?.roleId === "ROLE-MGR" ? "manager" : "hr";
    const record: SicknessRecord = {
      id,
      tenantId: s.tenantId,
      employeeId: employee.id,
      employeeName: employee.fullName,
      employeeInitials: employee.initials,
      department: employee.departmentName,
      branchId: employee.branchId,
      managerId: employee.managerId,
      kind: isProcedure ? "medical_procedure" : "sickness",
      startDate,
      startPortion: portion,
      leftWorkAt: allDay ? undefined : leftAt,
      endDate: returned ? lastDay : null,
      endPortion: "full",
      overnightShift: overnight,
      expectedReturnDate: !returned && expectedEnd ? expectedEnd : undefined,
      reasonCategory: reason,
      reasonDetail: detail.trim() || undefined,
      notifiedAt: notified,
      hospitalised: hospital,
      source,
      reportedBy: { employeeId: user?.employeeId, name: actor },
      reportedAt: now,
      approvalStatus: "awaiting_approval",
      absenceState: returned ? "returned" : "ongoing",
      fitNoteStatus: hasFitNote ? "received" : fitNoteRequired ? "awaiting" : spanDays == null ? "not_required" : "self_certified",
      documents: docs,
      linkedRecordId,
      linkedCaseId,
      ohReferralId: linkTo.startsWith("oh:") ? linkTo.slice(3) : undefined,
      rtw: returned
        ? {
            status: "pending",
            returnDate: undefined,
            lastSickDay: lastDay,
            interviewRequired: scheme?.advanced.rtwInterview !== "never",
            employeeConfirmedAt: mode === "self" && rtwConfirmed ? now : undefined,
          }
        : { status: "not_due", interviewRequired: scheme?.advanced.rtwInterview !== "never" },
      createdAt: now,
      updatedAt: now,
    };
    dispatch(reportSickness({ record, actor }));

    try {
      await dispatch(
        submitApproval({
          documentType: "sickness_absence",
          documentId: id,
          documentTitle: `${isProcedure ? "Medical procedure" : "Sickness absence"} — ${employee.fullName}`,
          documentSummary: `${employee.fullName} · from ${fmtDate(startDate)}${returned ? ` to ${fmtDate(lastDay)}` : ""}`,
          // No medical detail in the approval payload — approvers see dates, not diagnoses.
          payloadSnapshot: {
            startDate,
            endDate: returned ? lastDay : "ongoing",
            fitNote: record.fitNoteStatus,
            reportedBy: actor,
            onBehalf: mode !== "self",
          },
          // Always the absent employee, even when HR logs it on their behalf,
          // so the "line manager" step routes to *their* manager.
          submitter: {
            employeeId: employee.id,
            name: employee.fullName,
            initials: employee.initials,
            departmentName: employee.departmentName,
          },
        }),
      ).unwrap();
    } catch {
      toast.warning("Absence recorded, but no approval chain is set up for sickness yet", {
        description: "Create one under Submissions & Approvals → Approval Chains.",
      });
    }

    const notifyManager = !scheme || scheme.notifyOnSick.includes("line_manager");
    dispatch(
      pushNotification({
        title: `${employee.fullName} reported sick`,
        description: `${mode === "self" ? "Self-reported" : `Logged by ${actor}`} · from ${fmtDate(startDate)}. Absence confirmation awaits approval.`,
        type: "warning",
        recipientRoleIds: !scheme || scheme.notifyOnSick.some((r) => r.startsWith("hr")) ? HR_ROLES : undefined,
        recipientEmployeeIds: notifyManager && employee.managerId ? [employee.managerId] : undefined,
        href: `/time-payroll/sickness/records/${id}`,
      }),
    );
    toast.success(mode === "self" ? "Sickness reported — your manager has been told" : `Sickness logged for ${employee.fullName}`);
    onDone(id);
  }

  const err = (k: string) => errors[k] && <p className="text-[11px] text-destructive">{errors[k]}</p>;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      {mode === "hr" ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Employee name <span className="text-destructive">*</span></Label>
          <EmployeePicker value={employeeId} onChange={(p) => setEmployeeId(p?.id)} placeholder="Employee name" />
          {err("employee")}
        </div>
      ) : (
        <p className="text-sm">Reporting for <b>{employee?.fullName ?? "you"}</b></p>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">What do you want to do? <span className="text-destructive">*</span></Label>
        <RadioGroup value={kind} onValueChange={(v) => setKind(v as typeof kind)} className="flex flex-wrap gap-4">
          {(
            [
              ["sickness", mode === "self" ? "Report myself as sick" : "Report this employee as sick"],
              ["medical_procedure", "Plan time off for a medical procedure"],
              ...(mode === "hr" ? [["time_attendance", "Recorded from time and attendance"] as const] : []),
            ] as const
          ).map(([v, l]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 text-xs">
              <RadioGroupItem value={v} /> {l}
            </label>
          ))}
        </RadioGroup>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs">
        <Checkbox checked={returned} onCheckedChange={(c) => setReturned(!!c)} />
        {mode === "self" ? "I have already returned to work" : "Returned to work"}
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Cause of sickness <span className="text-destructive">*</span></Label>
          <Select value={reason} onValueChange={(v) => setReason(v as SicknessReasonCategory)}>
            <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Cause of sickness" /></SelectTrigger>
            <SelectContent>
              {SICKNESS_REASON_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {err("reason")}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Absence status</Label>
          <div className="flex h-9 items-center rounded-md border border-border bg-muted px-3 text-xs">
            {returned ? "Returned — return-to-work to be recorded" : kind === "medical_procedure" ? "Planned absence" : "Currently off sick"} · awaiting approval
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Additional details given by {mode === "self" ? "you" : "employee"}</Label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Confidential — visible to authorised HR only"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">First day of sickness <span className="text-destructive">*</span></Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
          {err("start")}
        </div>
        {returned ? (
          <div className="space-y-1.5">
            <Label className="text-xs">Last day of sickness <span className="text-destructive">*</span></Label>
            <Input type="date" value={lastDay} onChange={(e) => setLastDay(e.target.value)} className="h-9" />
            {err("lastDay")}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs">When do you expect the sickness to end?</Label>
            <Input type="date" value={expectedEnd} onChange={(e) => setExpectedEnd(e.target.value)} className="h-9" />
            {err("expectedEnd")}
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs">When did the employee first notify you? <span className="text-destructive">*</span></Label>
          <Input type="date" value={notified} onChange={(e) => setNotified(e.target.value)} className="h-9" />
          {err("notified")}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={allDay} onCheckedChange={(c) => setAllDay(!!c)} /> Absent all day
        </label>
        {!allDay && (
          <div className="flex items-center gap-2">
            <Label className="text-xs">Left work at</Label>
            <Input type="time" value={leftAt} onChange={(e) => setLeftAt(e.target.value)} className="h-8 w-28" />
            {err("leftAt")}
          </div>
        )}
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={hospital} onCheckedChange={(c) => setHospital(!!c)} /> Admitted to hospital
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={overnight} onCheckedChange={(c) => setOvernight(!!c)} /> Overnight shift worker
        </label>
      </div>

      <div
        className={
          fitNoteRequired && !hasFitNote
            ? "flex gap-2 rounded-md border border-amber-500/40 bg-amber-50 dark:bg-amber-950 px-3 py-2 text-xs text-amber-800 dark:text-amber-300"
            : "flex gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground"
        }
      >
        {fitNoteRequired && !hasFitNote ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <FileCheck2 className="h-4 w-4 shrink-0" />}
        <span>
          <b>Fit note requirement:</b>{" "}
          {spanDays == null
            ? `Self-certification covers the first ${selfCertDays} calendar days. A fit note is needed beyond that.`
            : fitNoteRequired
              ? hasFitNote
                ? `Fit note attached for this ${spanDays}-day absence.`
                : `This ${spanDays}-day absence is longer than ${selfCertDays} days, so a fit note is required from day ${selfCertDays + 1}. It will be tracked as awaited until uploaded.`
              : `${spanDays} day${spanDays === 1 ? "" : "s"} — the employee can self-certify; no fit note needed.`}
          {scheme && <> Scheme: {scheme.name}.</>}
        </span>
      </div>

      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={hasDoc} onCheckedChange={(c) => setHasDoc(!!c)} /> I have a document to attach
        </label>
        {hasDoc && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <Select value={docKind} onValueChange={(v) => setDocKind(v as SicknessDocumentKind)}>
              <SelectTrigger size="sm" className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(DOCUMENT_KIND_LABELS) as SicknessDocumentKind[]).map((k) => (
                  <SelectItem key={k} value={k} className="text-xs">{DOCUMENT_KIND_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FileDropzone onFiles={addFiles} multiple accept=".pdf,.jpg,.jpeg,.png" label="Drop a fit note or document" hint="PDF or image" />
            {docs.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-xs">
                <Paperclip className="h-3.5 w-3.5" /> {DOCUMENT_KIND_LABELS[d.kind]} — {d.name}
                <button type="button" onClick={() => setDocs((x) => x.filter((y) => y.id !== d.id))}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {linkOptions.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Link this sickness episode to an existing case</Label>
          <Select value={linkTo} onValueChange={setLinkTo}>
            <SelectTrigger className="h-9 w-full text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not linked — a new episode</SelectItem>
              {linkOptions.map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {returned && (
        <label className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-3 text-xs">
          <Checkbox checked={rtwConfirmed} onCheckedChange={(c) => setRtwConfirmed(!!c)} className="mt-0.5" />
          <span>
            <b>Return-to-work confirmation.</b>{" "}
            {mode === "self"
              ? "I confirm I am fit and back at work. My manager will arrange a return-to-work conversation."
              : "The employee has confirmed they are back. A return-to-work interview will be added to the review queue."}
          </span>
        </label>
      )}
      {err("rtw")}

      <div className="flex gap-2 border-t border-border pt-4">
        <Button onClick={submit}>Submit</Button>
        <Button variant="outline" onClick={() => onDone("")}>Cancel</Button>
      </div>
    </div>
  );
}
