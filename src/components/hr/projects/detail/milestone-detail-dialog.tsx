"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updateMilestone } from "@/src/lib/stores/projects-slice";
import {
  MILESTONE_STATUS_LABELS,
  type Milestone,
  type MilestoneStatus,
  type Project,
} from "@/src/lib/types/projects";

interface MilestoneDetailDialogProps {
  open: boolean;
  project: Project;
  milestone: Milestone | null;
  onClose: () => void;
}

/**
 * §13 — the full milestone detail view: target/actual date, status, %
 * complete, responsible person, related tasks, linked risks, and approval.
 * Styled after `AddTaskDialog` (tasks-panel.tsx) — same dialog shape and
 * checkbox-list pattern for linking related records.
 */
export function MilestoneDetailDialog({
  open,
  project,
  milestone,
  onClose,
}: MilestoneDetailDialogProps) {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const risks = useAppSelector((s) =>
    s.projects.risks.filter((r) => r.projectId === project.id),
  );

  const [targetDate, setTargetDate] = useState("");
  const [actualDate, setActualDate] = useState("");
  const [status, setStatus] = useState<MilestoneStatus>("not_started");
  const [percentComplete, setPercentComplete] = useState(0);
  const [responsibleId, setResponsibleId] = useState("");
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [riskIds, setRiskIds] = useState<string[]>([]);
  const [approved, setApproved] = useState(false);
  const [prevMilestoneId, setPrevMilestoneId] = useState<string | null>(null);

  const milestoneId = milestone?.id ?? null;
  if (open && milestoneId !== prevMilestoneId) {
    setPrevMilestoneId(milestoneId);
    if (milestone) {
      setTargetDate(milestone.date);
      setActualDate(milestone.actualDate ?? "");
      setStatus(milestone.status ?? (milestone.reached ? "completed" : "not_started"));
      setPercentComplete(milestone.percentComplete ?? (milestone.reached ? 100 : 0));
      setResponsibleId(milestone.responsibleId ?? "");
      setTaskIds(milestone.taskIds ?? []);
      setRiskIds(milestone.riskIds ?? []);
      setApproved(Boolean(milestone.approved));
    }
  }

  if (!milestone) return null;

  function handleSave() {
    if (!milestone) return;
    const responsible = employees.find((e) => e.id === responsibleId);
    dispatch(
      updateMilestone({
        projectId: project.id,
        milestoneId: milestone.id,
        patch: {
          date: targetDate,
          actualDate: actualDate || undefined,
          status,
          percentComplete,
          responsibleId: responsible?.id,
          responsibleName: responsible?.fullName,
          taskIds: taskIds.length ? taskIds : undefined,
          riskIds: riskIds.length ? riskIds : undefined,
          approved,
          // Stamped only on the transition into "approved" — this app has
          // no signed-in-user concept beyond demo names, so the project
          // owner stands in, matching the `createdBy: "System"` convention
          // used elsewhere when there's no real actor to attribute to.
          ...(approved && !milestone.approved
            ? {
                approvedBy: project.ownerName ?? "System",
                approvedAt: new Date().toISOString().slice(0, 10),
              }
            : {}),
        },
      }),
    );
    toast.success(`"${milestone.name}" updated`);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{milestone.name}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Target date</Label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Actual date</Label>
              <Input
                type="date"
                value={actualDate}
                onChange={(e) => setActualDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as MilestoneStatus)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(MILESTONE_STATUS_LABELS) as MilestoneStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {MILESTONE_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Completion %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={percentComplete}
                onChange={(e) =>
                  setPercentComplete(
                    Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Responsible person</Label>
            <Select
              value={responsibleId || "none"}
              onValueChange={(v) => setResponsibleId(v === "none" ? "" : v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {employees.slice(0, 60).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {project.tasks.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Related tasks</Label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-border/60 p-2">
                {project.tasks.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 text-[11px] text-foreground"
                  >
                    <Checkbox
                      checked={taskIds.includes(t.id)}
                      onCheckedChange={() =>
                        setTaskIds((prev) =>
                          prev.includes(t.id)
                            ? prev.filter((id) => id !== t.id)
                            : [...prev, t.id],
                        )
                      }
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {risks.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Linked risks &amp; issues</Label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-border/60 p-2">
                {risks.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-2 text-[11px] text-foreground"
                  >
                    <Checkbox
                      checked={riskIds.includes(r.id)}
                      onCheckedChange={() =>
                        setRiskIds((prev) =>
                          prev.includes(r.id)
                            ? prev.filter((id) => id !== r.id)
                            : [...prev, r.id],
                        )
                      }
                    />
                    {r.title}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5 rounded-md border border-border/60 p-3">
            <label className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Checkbox
                checked={approved}
                onCheckedChange={(v) => setApproved(Boolean(v))}
              />
              Approved
            </label>
            {milestone.approved && milestone.approvedBy && (
              <p className="text-[11px] text-muted-foreground">
                Approved by {milestone.approvedBy}
                {milestone.approvedAt && ` on ${milestone.approvedAt}`}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
