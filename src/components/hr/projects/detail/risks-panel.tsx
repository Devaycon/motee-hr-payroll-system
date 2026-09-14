"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { addRisk, deleteRisk, updateRisk } from "@/src/lib/stores/projects-slice";
import { cn } from "@/src/lib/utils";
import type { Project } from "@/src/lib/types/projects";
import {
  RISK_IMPACT_LABELS,
  RISK_IMPACT_STYLES,
  RISK_STATUS_LABELS,
  RISK_STATUS_STYLES,
  RISK_TYPE_LABELS,
  type NewProjectRisk,
  type ProjectRisk,
  type RiskImpact,
  type RiskStatus,
  type RiskType,
} from "@/src/lib/types/project-risks";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";

const RISK_EXPORT_COLUMNS: ReportColumn<ProjectRisk>[] = [
  { key: "type", header: "Type", value: (r) => RISK_TYPE_LABELS[r.type] },
  { key: "title", header: "Issue/Risk", value: (r) => r.title },
  { key: "ownerName", header: "Owner", value: (r) => r.ownerName ?? "—" },
  { key: "impact", header: "Impact", value: (r) => RISK_IMPACT_LABELS[r.impact] },
  { key: "dueDate", header: "Due", value: (r) => r.dueDate ?? "—" },
  { key: "status", header: "Status", value: (r) => RISK_STATUS_LABELS[r.status] },
];

/**
 * §5 — "probably the biggest missing project-management feature," per the
 * client: HRIS rollouts touch employee data, payroll, access permissions and
 * documents, so a risk/issue register matters more here than on a generic
 * project.
 */
export function RisksPanel({ project }: { project: Project }) {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const risks = useAppSelector((s) =>
    s.projects.risks.filter((r) => r.projectId === project.id),
  );
  const [editing, setEditing] = useState<ProjectRisk | "new" | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => setEditing("new")}>
          <Plus className="h-3.5 w-3.5" />
          Add risk / issue
        </Button>
      </div>

      {risks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No risks or issues logged
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Track anything that could threaten scope, schedule or budget.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="flex justify-end border-b border-border/40 bg-muted/30 px-3 py-2">
            <ExportMenu
              name={`${project.code}-risks`}
              title={`${project.name} — Risks & Issues`}
              columns={RISK_EXPORT_COLUMNS}
              rows={risks}
              variant="outline"
              buttonClassName="h-7 text-xs"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Issue/Risk</th>
                  <th className="px-3 py-2 font-medium">Owner</th>
                  <th className="px-3 py-2 font-medium">Impact</th>
                  <th className="px-3 py-2 font-medium">Due</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {risks.map((r) => (
                  <tr
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setEditing(r)}
                    className="cursor-pointer border-b border-border/30 last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px]">
                        {RISK_TYPE_LABELS[r.type]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-medium text-foreground">
                      {r.title}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {r.ownerName ?? "Unassigned"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", RISK_IMPACT_STYLES[r.impact])}
                      >
                        {RISK_IMPACT_LABELS[r.impact]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-muted-foreground">
                      {r.dueDate ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", RISK_STATUS_STYLES[r.status])}
                      >
                        {RISK_STATUS_LABELS[r.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(deleteRisk(r.id));
                          toast.success(`"${r.title}" deleted`);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RiskDialog
        open={editing !== null}
        risk={editing === "new" ? null : editing}
        employees={employees.map((e) => ({ id: e.id, name: e.fullName }))}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (editing && editing !== "new") {
            dispatch(updateRisk({ riskId: editing.id, patch }));
            toast.success(`"${patch.title}" updated`);
          } else {
            dispatch(addRisk({ projectId: project.id, risk: patch as NewProjectRisk }));
            toast.success(`"${patch.title}" added`);
          }
          setEditing(null);
        }}
      />
    </div>
  );
}

interface RiskDialogProps {
  open: boolean;
  risk: ProjectRisk | null;
  employees: { id: string; name: string }[];
  onClose: () => void;
  onSave: (patch: NewProjectRisk) => void;
}

function RiskDialog({ open, risk, employees, onClose, onSave }: RiskDialogProps) {
  const [type, setType] = useState<RiskType>(risk?.type ?? "risk");
  const [title, setTitle] = useState(risk?.title ?? "");
  const [description, setDescription] = useState(risk?.description ?? "");
  const [ownerId, setOwnerId] = useState(risk?.ownerId ?? "");
  const [impact, setImpact] = useState<RiskImpact>(risk?.impact ?? "medium");
  const [status, setStatus] = useState<RiskStatus>(risk?.status ?? "open");
  const [dueDate, setDueDate] = useState(risk?.dueDate ?? "");
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setType(risk?.type ?? "risk");
      setTitle(risk?.title ?? "");
      setDescription(risk?.description ?? "");
      setOwnerId(risk?.ownerId ?? "");
      setImpact(risk?.impact ?? "medium");
      setStatus(risk?.status ?? "open");
      setDueDate(risk?.dueDate ?? "");
    }
  }

  function handleSave() {
    if (title.trim().length < 2) {
      toast.error("Give it a title.");
      return;
    }
    const owner = employees.find((e) => e.id === ownerId);
    onSave({
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      ownerId: owner?.id,
      ownerName: owner?.name,
      impact,
      status,
      dueDate: dueDate || undefined,
      relatedTaskIds: risk?.relatedTaskIds,
      relatedMilestoneIds: risk?.relatedMilestoneIds,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{risk ? "Edit" : "Add"} risk / issue</DialogTitle>
        </DialogHeader>

        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as RiskType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risk">Risk</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Impact</Label>
              <Select
                value={impact}
                onValueChange={(v) => setImpact(v as RiskImpact)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Owner</Label>
              <Select
                value={ownerId || "none"}
                onValueChange={(v) => setOwnerId(v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {employees.slice(0, 60).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Due date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as RiskStatus)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
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
