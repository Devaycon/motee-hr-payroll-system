"use client";

import React, { useState } from "react";
import { z } from "zod/v4";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
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
import type {
  ERCase,
  NewERCase,
  CaseComplaintType,
  CasePriority,
  ConfidentialityLevel,
  CaseWitness,
  CaseEvidence,
} from "../types";
import {
  CASE_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  CONFIDENTIALITY_OPTIONS,
} from "../data";

const HR_OFFICERS = [
  { value: "Rachel Mensah", label: "Rachel Mensah", initials: "RM" },
  { value: "Amara Osei", label: "Amara Osei", initials: "AO" },
  { value: "Kofi Asante", label: "Kofi Asante", initials: "KA" },
];

const DEPARTMENTS = [
  "Design",
  "Engineering",
  "Finance",
  "Legal",
  "Marketing",
  "Operations",
  "People & Culture",
  "Customer Success",
  "Sales",
  "Product",
];

const caseSchema = z.object({
  complaintType: z.string().min(1, { message: "Case type is required." }),
  employeeName: z.string().min(2, { message: "Employee name is required." }),
  employeeDept: z.string().min(1, { message: "Department is required." }),
  incidentDate: z.string().optional(),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  priority: z.string().min(1, { message: "Priority is required." }),
  confidentialityLevel: z
    .string()
    .min(1, { message: "Confidentiality is required." }),
  assignedTo: z.string().optional(),
});

interface Props {
  open: boolean;
  editing: ERCase | null;
  onClose: () => void;
  onCreate: (data: NewERCase) => void;
  onUpdate: (id: string, data: Partial<ERCase>) => void;
}

type FormErrors = Partial<Record<string, string>>;

export function CaseFormModal({
  open,
  editing,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const isEdit = editing !== null;

  const [prevOpen, setPrevOpen] = useState(false);
  const [complaintType, setComplaintType] = useState<string>(
    editing?.complaintType ?? "grievance",
  );
  const [employeeName, setEmployeeName] = useState(editing?.employeeName ?? "");
  const [employeeDept, setEmployeeDept] = useState(editing?.employeeDept ?? "");
  const [incidentDate, setIncidentDate] = useState(editing?.incidentDate ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [priority, setPriority] = useState<string>(
    editing?.priority ?? "medium",
  );
  const [confidentiality, setConfidentiality] = useState<string>(
    editing?.confidentialityLevel ?? "standard",
  );
  const [assignedTo, setAssignedTo] = useState(editing?.assignedTo ?? "");
  const [witnesses, setWitnesses] = useState<CaseWitness[]>(
    editing?.witnesses ?? [],
  );
  const [evidence, setEvidence] = useState<CaseEvidence[]>(
    editing?.evidence ?? [],
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setComplaintType(editing?.complaintType ?? "grievance");
      setEmployeeName(editing?.employeeName ?? "");
      setEmployeeDept(editing?.employeeDept ?? "");
      setIncidentDate(editing?.incidentDate ?? "");
      setDescription(editing?.description ?? "");
      setPriority(editing?.priority ?? "medium");
      setConfidentiality(editing?.confidentialityLevel ?? "standard");
      setAssignedTo(editing?.assignedTo ?? "");
      setWitnesses(editing?.witnesses ?? []);
      setEvidence(editing?.evidence ?? []);
      setErrors({});
    }
  }

  function validate(): boolean {
    const result = caseSchema.safeParse({
      complaintType,
      employeeName,
      employeeDept,
      incidentDate,
      description,
      priority,
      confidentialityLevel: confidentiality,
      assignedTo: assignedTo || undefined,
    });
    if (!result.success) {
      const errs: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  }

  function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    const officer = HR_OFFICERS.find((o) => o.value === assignedTo);
    const cleanWitnesses = witnesses.filter((w) => w.name.trim());
    const cleanEvidence = evidence.filter((e) => e.name.trim());

    setTimeout(() => {
      if (isEdit && editing) {
        onUpdate(editing.id, {
          complaintType: complaintType as CaseComplaintType,
          employeeName,
          employeeDept,
          incidentDate: incidentDate || undefined,
          description,
          priority: priority as CasePriority,
          confidentialityLevel: confidentiality as ConfidentialityLevel,
          assignedTo: assignedTo || undefined,
          assignedInitials: officer?.initials,
          witnesses: cleanWitnesses,
          evidence: cleanEvidence,
        });
        toast.success("Case updated successfully.");
      } else {
        onCreate({
          complaintType: complaintType as CaseComplaintType,
          employeeName,
          employeeDept,
          incidentDate: incidentDate || undefined,
          description,
          priority: priority as CasePriority,
          confidentialityLevel: confidentiality as ConfidentialityLevel,
          assignedTo: assignedTo || undefined,
          witnesses: cleanWitnesses,
          evidence: cleanEvidence,
        });
        toast.success("Case created.");
      }
      setLoading(false);
      onClose();
    }, 300);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v: boolean) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Case" : "New Case"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Case Type</Label>
              <Select value={complaintType} onValueChange={setComplaintType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CASE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.complaintType && (
                <p className="text-xs text-destructive">
                  {errors.complaintType}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="emp-name">Employee Name</Label>
              <Input
                id="emp-name"
                value={employeeName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmployeeName(e.target.value)
                }
                placeholder="Full name"
              />
              {errors.employeeName && (
                <p className="text-xs text-destructive">
                  {errors.employeeName}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={employeeDept} onValueChange={setEmployeeDept}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dept" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeeDept && (
                <p className="text-xs text-destructive">
                  {errors.employeeDept}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="incident-date">Incident Date</Label>
              <Input
                id="incident-date"
                type="date"
                value={incidentDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setIncidentDate(e.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confidentiality</Label>
              <Select
                value={confidentiality}
                onValueChange={setConfidentiality}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONFIDENTIALITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Assigned To</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {HR_OFFICERS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="Describe the incident or complaint in detail..."
              rows={4}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Witnesses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Witnesses</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() =>
                  setWitnesses((w) => [...w, { name: "", statement: "" }])
                }
              >
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {witnesses.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No witnesses added.
              </p>
            )}
            {witnesses.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    value={w.name}
                    placeholder="Name"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setWitnesses((arr) =>
                        arr.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    value={w.statement ?? ""}
                    placeholder="Statement (optional)"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setWitnesses((arr) =>
                        arr.map((x, j) =>
                          j === i ? { ...x, statement: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() =>
                    setWitnesses((arr) => arr.filter((_, j) => j !== i))
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Evidence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Evidence</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() =>
                  setEvidence((e) => [
                    ...e,
                    {
                      name: "",
                      uploadedAt: new Date().toISOString().split("T")[0],
                    },
                  ])
                }
              >
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {evidence.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No evidence uploaded.
              </p>
            )}
            {evidence.map((ev, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={ev.name}
                  placeholder="File name or reference"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEvidence((arr) =>
                      arr.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() =>
                    setEvidence((arr) => arr.filter((_, j) => j !== i))
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
