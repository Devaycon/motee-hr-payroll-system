"use client";

import React, { useState } from "react";
import { z } from "zod/v4";
import { toast } from "sonner";
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
  AnyCase,
  CaseType,
  NewGrievanceCase,
  NewDisciplinaryCase,
} from "../types";
import {
  GRIEVANCE_CATEGORY_OPTIONS,
  DISCIPLINARY_CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
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

const grievanceSchema = z.object({
  type: z.literal("grievance"),
  employeeName: z.string().min(2, { message: "Employee name is required." }),
  employeeDept: z.string().min(1, { message: "Department is required." }),
  incidentDate: z.string().optional(),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  category: z.string().min(1, { message: "Category is required." }),
  priority: z.string().min(1, { message: "Priority is required." }),
  assignedTo: z.string().optional(),
});

const disciplinarySchema = z.object({
  type: z.literal("disciplinary"),
  employeeName: z.string().min(2, { message: "Employee name is required." }),
  employeeDept: z.string().min(1, { message: "Department is required." }),
  incidentDate: z.string().min(1, { message: "Incident date is required." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  category: z.string().min(1, { message: "Category is required." }),
  priority: z.string().min(1, { message: "Priority is required." }),
  assignedTo: z.string().optional(),
});

interface Props {
  open: boolean;
  editing: AnyCase | null;
  onClose: () => void;
  onCreate: (
    type: CaseType,
    data: NewGrievanceCase | NewDisciplinaryCase,
  ) => void;
  onUpdate: (id: string, data: Partial<AnyCase>) => void;
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
  const defaultType: CaseType = editing?.type ?? "grievance";

  const [prevOpen, setPrevOpen] = useState(false);
  const [type, setType] = useState<CaseType>(defaultType);
  const [employeeName, setEmployeeName] = useState(editing?.employeeName ?? "");
  const [employeeDept, setEmployeeDept] = useState(editing?.employeeDept ?? "");
  const [incidentDate, setIncidentDate] = useState(
    editing?.type === "disciplinary"
      ? editing.incidentDate
      : (editing?.incidentDate ?? ""),
  );
  const [description, setDescription] = useState(editing?.description ?? "");
  const [category, setCategory] = useState(editing?.category ?? "");
  const [priority, setPriority] = useState<string>(
    editing?.priority ?? "medium",
  );
  const [assignedTo, setAssignedTo] = useState(editing?.assignedTo ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setType(editing?.type ?? "grievance");
      setEmployeeName(editing?.employeeName ?? "");
      setEmployeeDept(editing?.employeeDept ?? "");
      setIncidentDate(
        editing?.type === "disciplinary"
          ? editing.incidentDate
          : (editing?.incidentDate ?? ""),
      );
      setDescription(editing?.description ?? "");
      setCategory(editing?.category ?? "");
      setPriority(editing?.priority ?? "medium");
      setAssignedTo(editing?.assignedTo ?? "");
      setErrors({});
    }
  }

  function handleTypeChange(val: CaseType) {
    setType(val);
    setCategory("");
    setErrors({});
  }

  function validate(): boolean {
    const raw = {
      type,
      employeeName,
      employeeDept,
      incidentDate,
      description,
      category,
      priority,
      assignedTo: assignedTo || undefined,
    };
    const schema = type === "grievance" ? grievanceSchema : disciplinarySchema;
    const result = schema.safeParse(raw);
    if (!result.success) {
      const errs: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!errs[key]) {
          errs[key] = issue.message;
        }
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
    const base = {
      type: type as "grievance" | "disciplinary",
      employeeName,
      employeeDept,
      description,
      category,
      priority: priority as NewGrievanceCase["priority"],
      assignedTo: assignedTo || undefined,
      assignedInitials: officer?.initials,
    };

    setTimeout(() => {
      if (isEdit && editing) {
        onUpdate(editing.id, {
          ...base,
          category: category,
        } as Partial<AnyCase>);
        toast.success("Case updated successfully.");
      } else if (type === "grievance") {
        onCreate("grievance", {
          ...base,
          incidentDate: incidentDate || undefined,
        } as NewGrievanceCase);
        toast.success("Grievance case created.");
      } else {
        onCreate("disciplinary", {
          ...base,
          incidentDate,
          category: category as never,
        } as NewDisciplinaryCase);
        toast.success("Disciplinary case created.");
      }
      setLoading(false);
      onClose();
    }, 300);
  }

  const categoryOptions =
    type === "grievance"
      ? GRIEVANCE_CATEGORY_OPTIONS
      : DISCIPLINARY_CATEGORY_OPTIONS;

  return (
    <Dialog
      open={open}
      onOpenChange={(v: boolean) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Case" : "New Case"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Case Type</Label>
              <div className="flex gap-2">
                {(["grievance", "disciplinary"] as CaseType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      type === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-transparent text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              <Label htmlFor="incident-date">
                Incident Date
                {type === "disciplinary" && (
                  <span className="text-destructive"> *</span>
                )}
              </Label>
              <Input
                id="incident-date"
                type="date"
                value={incidentDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setIncidentDate(e.target.value)
                }
              />
              {errors.incidentDate && (
                <p className="text-xs text-destructive">
                  {errors.incidentDate}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v)}>
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
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category}</p>
              )}
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="Describe the incident or grievance in detail..."
              rows={4}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
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
