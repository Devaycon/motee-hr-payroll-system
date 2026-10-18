"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays, format, parseISO } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Skeleton } from "@/src/components/ui/skeleton";
import { FileDropzone } from "@/src/components/shared/file-dropzone";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { addDocument, recordReturn, sicknessId } from "@/src/lib/stores/sickness-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import { spellLength } from "@/src/lib/sickness/bradford";
import type { DayPortion } from "@/src/lib/types/sickness";
import { SICKNESS_BASE, useCanViewMedical, useSickness, useSicknessActor } from "./hooks";
import { SicknessShell } from "./shell";
import { FitNoteBadge, Pager, RtwBadge, fmtDate, reasonFor, usePaged } from "./ui";

/** The Return to Work form — closes the spell and records the interview. */
export function ReturnToWorkForm({ id, backHref }: { id: string; backHref?: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const s = useSickness();
  const actor = useSicknessActor();
  const canViewMedical = useCanViewMedical();
  const record = s.records.find((r) => r.id === id);
  const today = s.asOf;

  const [returnDate, setReturnDate] = useState(record?.rtw.returnDate ?? today);
  const [lastDay, setLastDay] = useState(
    record?.endDate ?? record?.rtw.lastSickDay ?? format(addDays(parseISO(today), -1), "yyyy-MM-dd"),
  );
  const [lastAllDay, setLastAllDay] = useState(true);
  const [held, setHeld] = useState(record?.rtw.interviewHeld ?? false);
  const [interviewDate, setInterviewDate] = useState(today);
  const [interviewer, setInterviewer] = useState(actor);
  const [notes, setNotes] = useState("");
  const [hasDoc, setHasDoc] = useState(false);
  const [safe, setSafe] = useState(false);
  const [adjust, setAdjust] = useState(false);
  const [oh, setOh] = useState(false);
  const [error, setError] = useState("");

  if (s.loading) return <Skeleton className="m-6 h-96" />;
  if (!record) return <p className="py-12 text-sm text-muted-foreground">Absence not found.</p>;

  function upload(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      dispatch(
        addDocument({
          id: record!.id,
          actor,
          document: { id: sicknessId("DOC"), kind: "other", name: f.name, sizeBytes: f.size, uploadedAt: new Date().toISOString(), uploadedBy: actor },
        }),
      );
    }
  }

  function save() {
    if (!returnDate || !lastDay) return setError("Enter the return date and last day of sickness.");
    if (lastDay < record!.startDate) return setError("The last day can't be before the absence started.");
    if (returnDate <= lastDay && lastAllDay) return setError("They can't return on or before their last full day of sickness.");
    if (!safe) return setError("Confirm the employee is safe to return to work.");
    // Without an interview the return is recorded but the RTW stays pending.
    const completed = held || !record!.rtw.interviewRequired;
    const portion: DayPortion = lastAllDay ? "full" : "am";
    dispatch(
      recordReturn({
        id: record!.id,
        actor,
        endDate: lastDay,
        rtw: {
          ...record!.rtw,
          status: completed ? "completed" : "pending",
          returnDate,
          lastSickDay: lastDay,
          lastDayPortion: portion,
          interviewHeld: held,
          interviewDate: held ? interviewDate : undefined,
          interviewer: held ? interviewer : undefined,
          safeToReturn: safe,
          notes: notes.trim() || undefined,
          adjustmentsRecommended: adjust,
          ohReferralRecommended: oh,
          completedBy: completed ? actor : undefined,
          completedAt: completed ? new Date().toISOString() : undefined,
        },
      }),
    );
    const { scheme } = s.schemeFor(record!.employeeId);
    dispatch(
      pushNotification({
        title: `${record!.employeeName} has returned to work`,
        description: completed ? "Return-to-work recorded." : "Back at work — return-to-work interview still to be held.",
        type: "success",
        recipientRoleIds: !scheme || scheme.notifyOnReturn.some((r) => r.startsWith("hr")) ? ["ROLE-HRMGR", "ROLE-HRADMIN"] : undefined,
        recipientEmployeeIds: record!.managerId && (!scheme || scheme.notifyOnReturn.includes("line_manager")) ? [record!.managerId] : undefined,
        href: `${SICKNESS_BASE}/records/${record!.id}`,
      }),
    );
    if (oh || adjust) {
      toast.info(oh ? "Refer them to Occupational Health from the absence record" : "Record the adjustments on the Occupational Health case");
    }
    toast.success(completed ? "Return to work recorded" : "Return recorded — interview still due");
    router.push(backHref ?? `${SICKNESS_BASE}/records/${record!.id}`);
  }

  return (
    <div className="flex flex-col gap-4 pb-10 pt-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1 text-muted-foreground" asChild>
        <Link href={backHref ?? `${SICKNESS_BASE}/return-to-work`}><ChevronLeft className="h-4 w-4" /> Back</Link>
      </Button>
      <h1 className="text-3xl font-bold">Return to Work</h1>
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-[11px] text-muted-foreground">Employee name</dt><dd className="font-medium">{record.employeeName}</dd></div>
          <div><dt className="text-[11px] text-muted-foreground">Sickness started</dt><dd>{fmtDate(record.startDate)}</dd></div>
          <div><dt className="text-[11px] text-muted-foreground">Cause of sickness</dt><dd>{reasonFor(record, canViewMedical)}</dd></div>
        </dl>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">When did they return to work? <span className="text-destructive">*</span></Label>
            <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">When was their last day of sickness? <span className="text-destructive">*</span></Label>
            <Input type="date" value={lastDay} onChange={(e) => setLastDay(e.target.value)} className="h-9" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs"><Checkbox checked={lastAllDay} onCheckedChange={(c) => setLastAllDay(!!c)} /> Absent all day on their last day</label>
        <label className="flex items-center gap-2 text-xs"><Checkbox checked={held} onCheckedChange={(c) => setHeld(!!c)} /> I held a return to work interview</label>
        {held && (
          <div className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label className="text-xs">Interview date</Label><Input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Interviewer</Label><Input value={interviewer} onChange={(e) => setInterviewer(e.target.value)} className="h-9" /></div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Interview notes (confidential)</Label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="How they are, support agreed, any phased return…" />
            </div>
          </div>
        )}
        <label className="flex items-center gap-2 text-xs"><Checkbox checked={hasDoc} onCheckedChange={(c) => setHasDoc(!!c)} /> I have a document to attach</label>
        {hasDoc && <FileDropzone onFiles={upload} multiple label="Attach a document" />}
        <label className="flex items-center gap-2 text-xs"><Checkbox checked={adjust} onCheckedChange={(c) => setAdjust(!!c)} /> Workplace adjustments recommended</label>
        <label className="flex items-center gap-2 text-xs"><Checkbox checked={oh} onCheckedChange={(c) => setOh(!!c)} /> Occupational Health referral recommended</label>
        <label className="flex items-center gap-2 text-xs font-medium"><Checkbox checked={safe} onCheckedChange={(c) => setSafe(!!c)} /> Employee is safe to return to work <span className="text-destructive">*</span></label>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2 border-t border-border pt-4">
          <Button onClick={save}>Save</Button>
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

type View = "off" | "due" | "done";

/** Return-to-Work Reviews — who is off, who needs an interview, who is done. */
export function ReturnToWorkPage() {
  const s = useSickness();
  const [view, setView] = useState<View>("due");
  const lists = useMemo(() => {
    const live = s.records.filter((r) => r.approvalStatus !== "rejected" && r.approvalStatus !== "cancelled");
    return {
      off: live.filter((r) => r.absenceState === "ongoing"),
      due: live.filter((r) => r.rtw.status === "pending"),
      done: live.filter((r) => r.rtw.status === "completed").sort((a, b) => (b.rtw.returnDate ?? "").localeCompare(a.rtw.returnDate ?? "")),
    };
  }, [s.records]);
  const pager = usePaged(lists[view], 12, view);
  const rows = pager.slice;
  const labels: Record<View, string> = { off: "Off sick now", due: "Interviews due", done: "Completed" };

  return (
    <SicknessShell>
      <div className="flex rounded-lg border border-border bg-muted p-0.5 text-xs w-fit">
        {(Object.keys(labels) as View[]).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)} className={v === view ? "rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground" : "rounded-md px-3 py-1.5 text-muted-foreground"}>
            {labels[v]} ({lists[v].length})
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nothing here.</p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0">
              <PersonAvatar name={r.employeeName} initials={r.employeeInitials} className="size-8" fallbackClassName="text-[10px]" />
              <div className="min-w-0 flex-1">
                <Link href={`${SICKNESS_BASE}/records/${r.id}`} className="text-sm font-medium hover:underline">{r.employeeName}</Link>
                <p className="text-xs text-muted-foreground">
                  {r.department} · off since {fmtDate(r.startDate)}
                  {r.absenceState === "ongoing" ? ` · ${spellLength(r, s.asOf)} days${r.expectedReturnDate ? ` · expected back ${fmtDate(r.expectedReturnDate)}` : ""}` : ` · back ${fmtDate(r.rtw.returnDate)}`}
                </p>
              </div>
              <FitNoteBadge status={r.fitNoteStatus} />
              <RtwBadge status={r.rtw.status} />
              {view !== "done" && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`${SICKNESS_BASE}/return-to-work/${r.id}`}>{view === "off" ? "Record return" : "Record interview"}</Link>
                </Button>
              )}
            </div>
          ))
        )}
        <Pager pager={pager} noun="people" />
      </div>
    </SicknessShell>
  );
}
