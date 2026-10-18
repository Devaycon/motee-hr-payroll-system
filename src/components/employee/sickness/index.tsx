"use client";

import { useState } from "react";
import { HeartPulse, Paperclip, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Skeleton } from "@/src/components/ui/skeleton";
import { FileDropzone } from "@/src/components/shared/file-dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { addDocument, recordReturn, sicknessId } from "@/src/lib/stores/sickness-slice";
import { workingDaysLost } from "@/src/lib/sickness/bradford";
import { cn } from "@/src/lib/utils";
import type { SicknessRecord } from "@/src/lib/types/sickness";
import { ReportSicknessForm } from "@/src/components/hr/sickness/report-form";
import { useSickness } from "@/src/components/hr/sickness/hooks";
import { ApprovalBadge, AbsenceStateBadge, FitNoteBadge, RtwBadge, fmtDate } from "@/src/components/hr/sickness/ui";

/**
 * Employee self-service: report sickness, upload fit notes and confirm the
 * return to work. Bradford scores aren't shown here — they're a management
 * indicator, not something to put in front of the employee without context.
 */
export function MySicknessPage() {
  const s = useSickness();
  const me = useAppSelector((st) => st.auth.user?.employeeId);
  const [tab, setTab] = useState<"mine" | "report">("mine");
  const [returning, setReturning] = useState<SicknessRecord | null>(null);
  const mine = s.records.filter((r) => r.employeeId === me).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const off = mine.find((r) => r.absenceState === "ongoing" && r.approvalStatus !== "rejected");

  if (s.loading) return <Skeleton className="m-6 h-96" />;

  return (
    <div className="flex flex-col gap-4 pb-10 pt-6">
      <div>
        <h1 className="text-4xl font-bold">My Sickness</h1>
        <p className="text-sm text-muted-foreground">Tell us when you&apos;re unwell, send your fit note and let us know when you&apos;re back.</p>
      </div>

      {off && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950 px-4 py-3 text-sm">
          <HeartPulse className="h-4 w-4 text-rose-600" />
          <span className="flex-1">You&apos;re recorded as off sick since {fmtDate(off.startDate)}. Get well soon.</span>
          <Button size="sm" className="gap-1.5" onClick={() => setReturning(off)}><Undo2 className="h-3.5 w-3.5" /> I&apos;m back at work</Button>
        </div>
      )}

      <div className="flex w-fit rounded-lg border border-border bg-muted p-0.5 text-xs">
        {(
          [
            ["mine", "My absences"],
            ["report", "Report sickness"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} type="button" onClick={() => setTab(v)} className={cn("rounded-md px-3 py-1.5 font-medium", tab === v ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{l}</button>
        ))}
      </div>

      {tab === "report" ? (
        <ReportSicknessForm mode="self" onDone={() => setTab("mine")} />
      ) : mine.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No sickness recorded.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {mine.map((r) => (
            <MyAbsence key={r.id} r={r} days={workingDaysLost(r, s.asOf, s.byId.get(r.employeeId)?.workPattern?.schedule, s.holidays)} onReturn={() => setReturning(r)} />
          ))}
        </div>
      )}

      <SelfReturnDialog record={returning} onClose={() => setReturning(null)} />
    </div>
  );
}

function MyAbsence({ r, days, onReturn }: { r: SicknessRecord; days: number; onReturn: () => void }) {
  const dispatch = useAppDispatch();
  const name = useAppSelector((st) => st.auth.user?.name) ?? "Employee";
  function upload(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const doc = { id: sicknessId("DOC"), kind: "fit_note" as const, name: f.name, sizeBytes: f.size, validFrom: r.startDate, uploadedAt: new Date().toISOString(), uploadedBy: name };
      const reader = new FileReader();
      reader.onload = () => dispatch(addDocument({ id: r.id, actor: name, document: { ...doc, dataUrl: f.size <= 1_500_000 ? String(reader.result) : undefined } }));
      reader.readAsDataURL(f);
    }
    toast.success("Fit note sent to HR");
  }
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{fmtDate(r.startDate)} – {r.endDate ? fmtDate(r.endDate) : "ongoing"}</p>
          <p className="text-xs text-muted-foreground">{r.reasonCategory} · {days} working day{days === 1 ? "" : "s"}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ApprovalBadge status={r.approvalStatus} />
          <AbsenceStateBadge record={r} />
          <FitNoteBadge status={r.fitNoteStatus} />
          {r.rtw.status !== "not_due" && <RtwBadge status={r.rtw.status} />}
        </div>
      </div>
      {r.documents.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {r.documents.map((d) => <li key={d.id} className="flex items-center gap-1.5"><Paperclip className="h-3 w-3" /> {d.name} · {fmtDate(d.uploadedAt)}</li>)}
        </ul>
      )}
      {(r.fitNoteStatus === "awaiting" || r.fitNoteStatus === "expired") && (
        <div className="mt-3">
          <p className="mb-1 text-xs text-amber-700 dark:text-amber-400">Your absence is longer than 7 days, so we need a fit note from your GP.</p>
          <FileDropzone onFiles={upload} accept=".pdf,.jpg,.jpeg,.png" label="Upload your fit note" />
        </div>
      )}
      {r.absenceState === "ongoing" && (
        <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={onReturn}><Undo2 className="h-3.5 w-3.5" /> I&apos;m back at work</Button>
      )}
    </div>
  );
}

/** Employee's own return-to-work confirmation; the manager then holds the interview. */
function SelfReturnDialog({ record, onClose }: { record: SicknessRecord | null; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const name = useAppSelector((st) => st.auth.user?.name) ?? "Employee";
  const today = new Date().toISOString().slice(0, 10);
  const [returnDate, setReturnDate] = useState(today);
  const [lastDay, setLastDay] = useState("");
  const [fit, setFit] = useState(false);
  if (!record) return null;
  const valid = fit && lastDay && returnDate > lastDay && lastDay >= record.startDate;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Welcome back</DialogTitle>
          <DialogDescription className="text-xs">Confirm your dates. Your manager will arrange a short return-to-work conversation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="space-y-1.5"><Label className="text-xs">Last day of sickness</Label><Input type="date" value={lastDay} onChange={(e) => setLastDay(e.target.value)} className="h-9" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Date you returned to work</Label><Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="h-9" /></div>
          <label className="flex items-start gap-2"><Checkbox checked={fit} onCheckedChange={(c) => setFit(!!c)} className="mt-0.5" /> I confirm I&apos;m fit and back at work</label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={!valid}
            onClick={() => {
              dispatch(
                recordReturn({
                  id: record.id,
                  actor: name,
                  endDate: lastDay,
                  rtw: { ...record.rtw, status: record.rtw.interviewRequired ? "pending" : "completed", returnDate, lastSickDay: lastDay, employeeConfirmedAt: new Date().toISOString(), safeToReturn: true },
                }),
              );
              toast.success("Thanks — your manager has been told you're back");
              onClose();
            }}
          >
            Confirm return
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
