"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { createProject, updateProject } from "@/src/lib/stores/projects-slice";
import { useCostCentres } from "@/src/lib/hooks/use-cost-centres";
import {
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectPriority,
  type ProjectStatus,
} from "@/src/lib/types/projects";

interface ProjectFormModalProps {
  open: boolean;
  editing: Project | null;
  onClose: () => void;
}

interface FormState {
  code: string;
  name: string;
  description: string;
  client: string;
  ownerName: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  budget: string;
  costCentreId: string;
}

function emptyForm(): FormState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    code: "",
    name: "",
    description: "",
    client: "",
    ownerName: "",
    status: "planning",
    priority: "medium",
    startDate: today,
    endDate: today,
    budget: "",
    costCentreId: "",
  };
}

export function ProjectFormModal({
  open,
  editing,
  onClose,
}: ProjectFormModalProps) {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const actorName = useAppSelector((s) => s.auth.user?.name) ?? "You";
  const centres = useCostCentres();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(
        editing
          ? {
              code: editing.code,
              name: editing.name,
              description: editing.description ?? "",
              client: editing.client ?? "",
              ownerName: editing.ownerName ?? "",
              status: editing.status,
              priority: editing.priority,
              startDate: editing.startDate,
              endDate: editing.endDate,
              budget: editing.budget ? String(editing.budget) : "",
              costCentreId: editing.costCentreId ?? "",
            }
          : emptyForm(),
      );
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (form.name.trim().length < 3) {
      toast.error("Give the project a name of at least 3 characters.");
      return;
    }
    if (!form.code.trim()) {
      toast.error("Give the project a code — it's how it's referenced.");
      return;
    }
    // A project that ends before it starts breaks every downstream date
    // calculation, so it is caught here rather than rendering a negative bar.
    if (form.endDate < form.startDate) {
      toast.error("The end date is before the start date.");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      client: form.client.trim() || undefined,
      ownerName: form.ownerName.trim() || undefined,
      status: form.status,
      priority: form.priority,
      startDate: form.startDate,
      endDate: form.endDate,
      budget: form.budget ? Number(form.budget.replace(/,/g, "")) : undefined,
      costCentreId: form.costCentreId || undefined,
    };

    if (editing) {
      dispatch(updateProject({ id: editing.id, ...payload }));
      toast.success("Project updated");
    } else {
      dispatch(createProject({ ...payload, createdBy: actorName }));
      toast.success(`"${payload.name}" created`);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit project" : "New project"}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Code *</Label>
              <Input
                placeholder="HRIS-2026"
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Name *</Label>
              <Input
                placeholder="HRIS Platform Rollout"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={2}
              placeholder="What is this project delivering?"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Client / requester</Label>
              <Input
                placeholder="Internal — People Operations"
                value={form.client}
                onChange={(e) => set("client", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Owner</Label>
              <Select
                value={form.ownerName || "none"}
                onValueChange={(v) => set("ownerName", v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {employees.slice(0, 60).map((e) => (
                    <SelectItem key={e.id} value={e.fullName}>
                      {e.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as ProjectStatus)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {PROJECT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => set("priority", v as ProjectPriority)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(PROJECT_PRIORITY_LABELS) as ProjectPriority[]
                  ).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PROJECT_PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Start date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Budget</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.budget}
                onChange={(e) => set("budget", e.target.value)}
              />
            </div>
            {/* §7.3 — projects charge to an existing cost centre rather than
                inventing a parallel set of codes. */}
            <div className="space-y-1.5">
              <Label className="text-xs">Cost centre</Label>
              <Select
                value={form.costCentreId || "none"}
                onValueChange={(v) => set("costCentreId", v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {centres.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {editing ? "Save changes" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
