"use client";

import { useState } from "react";
import Link from "next/link";
import { Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { sicknessId, updateOHCase, updateRecord } from "@/src/lib/stores/sickness-slice";
import { useCan } from "@/src/lib/permissions/use-can";
import {
  ADJUSTMENT_STATUS_LABELS,
  OH_FITNESS_LABELS,
  OH_STAGES,
  type AdjustmentRecord,
  type AdjustmentStatus,
  type OHFitnessStatus,
  type OHStatus,
} from "@/src/lib/types/occupational-health";
import type { MergedReferral } from "./use-oh-referrals";
import { fmt } from "./lib";

/**
 * HR's working area on an OH case: linked sickness absences, the OH
 * recommendations and outcome, and the adjustments with their review dates
 * and implementation status. No clinical detail is captured here.
 */
export function OHCaseManage({ referral }: { referral: MergedReferral }) {
  const dispatch = useAppDispatch();
  const actor = useAppSelector((s) => s.auth.user?.name) ?? "HR";
  const canEdit = useCan("time-payroll.occupational-health", "edit");
  const records = useAppSelector((s) => s.sickness.records).filter((r) => r.employeeId === referral.employeeId);
  const linked = records.filter((r) => referral.linkedSicknessIds.includes(r.id));
  const unlinked = records.filter((r) => !referral.linkedSicknessIds.includes(r.id));

  const [status, setStatus] = useState<OHStatus>(referral.status);
  const [fitness, setFitness] = useState<OHFitnessStatus>(referral.fitnessStatus);
  const [assessment, setAssessment] = useState(referral.assessmentDate ?? "");
  const [expectedReturn, setExpectedReturn] = useState(referral.expectedReturnDate ?? "");
  const [reviewDate, setReviewDate] = useState(referral.reviewDate ?? "");
  const [recommendation, setRecommendation] = useState("");
  const [newAdj, setNewAdj] = useState({ description: "", reviewDate: "", owner: "", linkedSicknessId: linked[0]?.id ?? "" });

  const history = (note: string) => [
    ...(referral.history ?? []),
    { id: sicknessId("H"), at: new Date().toISOString(), actorName: actor, note },
  ];

  function saveOutcome() {
    const notes = recommendation.trim()
      ? `${referral.caseNotes ? `${referral.caseNotes}\n\n` : ""}${new Date().toISOString().slice(0, 10)} — OH recommendations: ${recommendation.trim()}`
      : referral.caseNotes;
    dispatch(
      updateOHCase({
        id: referral.id,
        actor,
        changes: {
          status,
          fitnessStatus: fitness,
          assessmentDate: assessment || undefined,
          expectedReturnDate: expectedReturn || undefined,
          reviewDate: reviewDate || undefined,
          caseNotes: notes,
          equalityActConsidered: referral.equalityActConsidered || fitness === "fit_with_adjustments",
          history: history(`Outcome updated: ${OH_STAGES.find((s) => s.key === status)?.label} · ${OH_FITNESS_LABELS[fitness]}${recommendation.trim() ? " · recommendations recorded" : ""}`),
        },
      }),
    );
    setRecommendation("");
    toast.success("OH outcome saved");
  }

  function setAdjustments(next: AdjustmentRecord[], note: string) {
    dispatch(updateOHCase({ id: referral.id, actor, changes: { adjustments: next, history: history(note) } }));
  }

  function addAdjustment() {
    if (newAdj.description.trim().length < 3) return;
    const adj: AdjustmentRecord = {
      id: sicknessId("ADJ"),
      description: newAdj.description.trim(),
      dateRecommended: new Date().toISOString().slice(0, 10),
      implementationOwner: newAdj.owner || undefined,
      reviewDate: newAdj.reviewDate || undefined,
      status: "proposed",
      linkedSicknessId: newAdj.linkedSicknessId || undefined,
    };
    setAdjustments([...referral.adjustments, adj], `Adjustment recommended: ${adj.description}`);
    setNewAdj({ description: "", reviewDate: "", owner: "", linkedSicknessId: newAdj.linkedSicknessId });
    toast.success("Adjustment added");
  }

  function updateAdj(id: string, patch: Partial<AdjustmentRecord>, note: string) {
    setAdjustments(referral.adjustments.map((a) => (a.id === id ? { ...a, ...patch } : a)), note);
  }

  function linkAbsence(recordId: string) {
    dispatch(updateOHCase({ id: referral.id, actor, changes: { linkedSicknessIds: [...referral.linkedSicknessIds, recordId] } }));
    dispatch(updateRecord({ id: recordId, actor, changes: { ohReferralId: referral.id, linkedCaseId: referral.id }, note: `Linked to OH case ${referral.id}` }));
    toast.success("Absence linked");
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-sm">Linked sickness absences</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-xs">
          {linked.length === 0 && <p className="text-muted-foreground">No absence records linked yet.</p>}
          {linked.map((r) => (
            <Link key={r.id} href={`/time-payroll/sickness/records/${r.id}`} className="flex items-center justify-between rounded-md border border-border px-3 py-2 hover:bg-muted">
              <span>{fmt(r.startDate)} – {r.endDate ? fmt(r.endDate) : "ongoing"}</span>
              <span className="text-muted-foreground">{r.absenceState === "ongoing" ? "Off sick" : "Returned"}</span>
            </Link>
          ))}
          {canEdit && unlinked.length > 0 && (
            <Select onValueChange={linkAbsence}>
              <SelectTrigger size="sm" className="h-8 w-full text-xs"><Link2 className="h-3.5 w-3.5" /><SelectValue placeholder="Link another absence…" /></SelectTrigger>
              <SelectContent>
                {unlinked.map((r) => <SelectItem key={r.id} value={r.id} className="text-xs">{fmt(r.startDate)} – {r.endDate ? fmt(r.endDate) : "ongoing"}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">OH recommendations &amp; outcome</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Stage</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as OHStatus)} disabled={!canEdit}>
                <SelectTrigger size="sm" className="h-8 w-full text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{OH_STAGES.map((s) => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fitness for work</Label>
              <Select value={fitness} onValueChange={(v) => setFitness(v as OHFitnessStatus)} disabled={!canEdit}>
                <SelectTrigger size="sm" className="h-8 w-full text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(OH_FITNESS_LABELS) as OHFitnessStatus[]).map((k) => <SelectItem key={k} value={k} className="text-xs">{OH_FITNESS_LABELS[k]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Assessment date</Label><Input type="date" value={assessment} onChange={(e) => setAssessment(e.target.value)} disabled={!canEdit} className="h-8 text-xs" /></div>
            <div className="space-y-1"><Label className="text-xs">Expected return</Label><Input type="date" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} disabled={!canEdit} className="h-8 text-xs" /></div>
            <div className="space-y-1"><Label className="text-xs">Case review date</Label><Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} disabled={!canEdit} className="h-8 text-xs" /></div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Recommendations received (no diagnoses)</Label>
            <textarea value={recommendation} onChange={(e) => setRecommendation(e.target.value)} disabled={!canEdit} rows={2} placeholder="e.g. Phased return over 4 weeks; avoid lifting over 10kg" className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-xs" />
          </div>
          {canEdit && <Button size="sm" onClick={saveOutcome}>Save outcome</Button>}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-sm">Manage adjustments</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-xs">
          {referral.adjustments.map((a) => (
            <div key={a.id} className="grid items-end gap-2 rounded-md border border-border p-3 md:grid-cols-[1fr_150px_150px_150px_auto]">
              <div>
                <p className="font-medium">{a.description}</p>
                <p className="text-muted-foreground">
                  Recommended {fmt(a.dateRecommended)}
                  {a.linkedSicknessId ? (
                    <> · <Link className="text-primary hover:underline" href={`/time-payroll/sickness/records/${a.linkedSicknessId}`}>linked absence</Link></>
                  ) : null}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Status</Label>
                <Select value={a.status} onValueChange={(v) => updateAdj(a.id, { status: v as AdjustmentStatus, ...(v === "agreed" ? { agreedBy: actor } : {}), ...(v === "implemented" ? { effectiveDate: a.effectiveDate ?? new Date().toISOString().slice(0, 10) } : {}) }, `Adjustment "${a.description}" → ${ADJUSTMENT_STATUS_LABELS[v as AdjustmentStatus]}`)} disabled={!canEdit}>
                  <SelectTrigger size="sm" className="h-8 w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(ADJUSTMENT_STATUS_LABELS) as AdjustmentStatus[]).map((k) => <SelectItem key={k} value={k} className="text-xs">{ADJUSTMENT_STATUS_LABELS[k]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Effective date</Label>
                <Input type="date" value={a.effectiveDate ?? ""} onChange={(e) => updateAdj(a.id, { effectiveDate: e.target.value || undefined }, `Effective date set for "${a.description}"`)} disabled={!canEdit} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Review date</Label>
                <Input type="date" value={a.reviewDate ?? ""} onChange={(e) => updateAdj(a.id, { reviewDate: e.target.value || undefined }, `Review date set for "${a.description}"`)} disabled={!canEdit} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Linked absence</Label>
                <Select value={a.linkedSicknessId ?? "none"} onValueChange={(v) => updateAdj(a.id, { linkedSicknessId: v === "none" ? undefined : v }, `Absence link updated for "${a.description}"`)} disabled={!canEdit}>
                  <SelectTrigger size="sm" className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">Not linked</SelectItem>
                    {records.map((r) => <SelectItem key={r.id} value={r.id} className="text-xs">{fmt(r.startDate)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          {canEdit && (
            <div className="grid items-end gap-2 rounded-md border border-dashed border-border p-3 md:grid-cols-[1fr_150px_150px_auto]">
              <div className="space-y-1"><Label className="text-[11px]">New adjustment</Label><Input value={newAdj.description} onChange={(e) => setNewAdj({ ...newAdj, description: e.target.value })} placeholder="e.g. Ergonomic chair and phased hours" className="h-8 text-xs" /></div>
              <div className="space-y-1"><Label className="text-[11px]">Owner</Label><Input value={newAdj.owner} onChange={(e) => setNewAdj({ ...newAdj, owner: e.target.value })} className="h-8 text-xs" /></div>
              <div className="space-y-1"><Label className="text-[11px]">Review date</Label><Input type="date" value={newAdj.reviewDate} onChange={(e) => setNewAdj({ ...newAdj, reviewDate: e.target.value })} className="h-8 text-xs" /></div>
              <Button size="sm" className="gap-1" onClick={addAdjustment}><Plus className="h-3.5 w-3.5" /> Add</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
