"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { ScrollArea } from "@/src/components/ui/scroll-area";
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
import { Badge } from "@/src/components/ui/badge";
import { DEPARTMENT_OPTIONS, EMPLOYMENT_TYPE_LABELS } from "../data";
import type {
  JobRequisition,
  NewJobRequisition,
  RequisitionEmploymentType,
} from "../types";

const formSchema = z
  .object({
    positionTitle: z
      .string()
      .min(2, "At least 2 characters")
      .max(80, "Max 80 characters"),
    department: z.string().min(1, "Department is required"),
    hiringManager: z.string().min(2, "Hiring manager is required"),
    employmentType: z.enum(
      ["full_time", "part_time", "contract", "internship"],
      {
        message: "Employment type is required",
      },
    ),
    salaryMin: z.coerce.number().min(1, "Salary min is required"),
    salaryMax: z.coerce.number().min(1, "Salary max is required"),
    jobDescription: z
      .string()
      .min(10, "At least 10 characters")
      .max(1000, "Max 1000 characters"),
    openings: z.coerce
      .number()
      .int()
      .min(1, "At least 1 opening")
      .max(50, "Max 50"),
    targetStartDate: z.string().min(1, "Target start date is required"),
  })
  .refine((d) => d.salaryMax >= d.salaryMin, {
    message: "Max salary must be ≥ min salary",
    path: ["salaryMax"],
  });

type FormFields = z.infer<typeof formSchema>;

type TouchedFields = Partial<Record<keyof FormFields, boolean>>;

const EMPTY: FormFields = {
  positionTitle: "",
  department: "",
  hiringManager: "",
  employmentType: "full_time",
  salaryMin: 0,
  salaryMax: 0,
  jobDescription: "",
  openings: 1,
  targetStartDate: "",
};

interface RequisitionModalProps {
  open: boolean;
  onClose: () => void;
  editingRequisition: JobRequisition | null;
  onSave: (data: NewJobRequisition) => void;
}

export function RequisitionModal({
  open,
  onClose,
  editingRequisition,
  onSave,
}: RequisitionModalProps) {
  const [fields, setFields] = useState<FormFields>(EMPTY);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const skillInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editingRequisition;

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      if (editingRequisition) {
        setFields({
          positionTitle: editingRequisition.positionTitle,
          department: editingRequisition.department,
          hiringManager: editingRequisition.hiringManager,
          employmentType: editingRequisition.employmentType,
          salaryMin: editingRequisition.salaryMin,
          salaryMax: editingRequisition.salaryMax,
          jobDescription: editingRequisition.jobDescription,
          openings: editingRequisition.openings,
          targetStartDate: editingRequisition.targetStartDate,
        });
        setSkills(editingRequisition.requiredSkills);
      } else {
        setFields(EMPTY);
        setSkills([]);
      }
      setTouched({});
      setSkillInput("");
    }
  }

  const result = formSchema.safeParse(fields);

  const fieldError = (key: keyof FormFields) => {
    if (!touched[key]) return null;
    if (result.success) return null;
    const issue = result.error.issues.find((i) => i.path[0] === key);
    return issue?.message ?? null;
  };

  const touch = (key: keyof FormFields) =>
    setTouched((p) => ({ ...p, [key]: true }));

  const set = <K extends keyof FormFields>(key: K, value: FormFields[K]) =>
    setFields((p) => ({ ...p, [key]: value }));

  const addSkill = () => {
    const trimmed = skillInput.trim().replace(/,$/, "");
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((p) => [...p, trimmed]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) =>
    setSkills((p) => p.filter((s) => s !== skill));

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSave = () => {
    const allTouched = Object.fromEntries(
      Object.keys(EMPTY).map((k) => [k, true]),
    ) as TouchedFields;
    setTouched(allTouched);
    if (!result.success) return;
    onSave({ ...result.data, requiredSkills: skills });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-semibold">
            {isEditing ? "Edit Requisition" : "New Job Requisition"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-5 grid grid-cols-2 gap-x-4 gap-y-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Position Title</Label>
              <Input
                placeholder="e.g. Senior Software Engineer"
                value={fields.positionTitle}
                onChange={(e) => set("positionTitle", e.target.value)}
                onBlur={() => touch("positionTitle")}
                className="h-8 text-sm"
              />
              {fieldError("positionTitle") && (
                <p className="text-xs text-destructive">
                  {fieldError("positionTitle")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Department</Label>
              <Select
                value={fields.department}
                onValueChange={(v) => {
                  set("department", v);
                  touch("department");
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d} className="text-sm">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("department") && (
                <p className="text-xs text-destructive">
                  {fieldError("department")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Hiring Manager</Label>
              <Input
                placeholder="Full name"
                value={fields.hiringManager}
                onChange={(e) => set("hiringManager", e.target.value)}
                onBlur={() => touch("hiringManager")}
                className="h-8 text-sm"
              />
              {fieldError("hiringManager") && (
                <p className="text-xs text-destructive">
                  {fieldError("hiringManager")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Employment Type</Label>
              <Select
                value={fields.employmentType}
                onValueChange={(v) => {
                  set("employmentType", v as RequisitionEmploymentType);
                  touch("employmentType");
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(
                      EMPLOYMENT_TYPE_LABELS,
                    ) as RequisitionEmploymentType[]
                  ).map((k) => (
                    <SelectItem key={k} value={k} className="text-sm">
                      {EMPLOYMENT_TYPE_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("employmentType") && (
                <p className="text-xs text-destructive">
                  {fieldError("employmentType")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Number of Openings</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={fields.openings}
                onChange={(e) => set("openings", Number(e.target.value))}
                onBlur={() => touch("openings")}
                className="h-8 text-sm"
              />
              {fieldError("openings") && (
                <p className="text-xs text-destructive">
                  {fieldError("openings")}
                </p>
              )}
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Salary Range (₦)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Input
                    type="number"
                    placeholder="Minimum"
                    value={fields.salaryMin || ""}
                    onChange={(e) => set("salaryMin", Number(e.target.value))}
                    onBlur={() => touch("salaryMin")}
                    className="h-8 text-sm"
                  />
                  {fieldError("salaryMin") && (
                    <p className="text-xs text-destructive">
                      {fieldError("salaryMin")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Input
                    type="number"
                    placeholder="Maximum"
                    value={fields.salaryMax || ""}
                    onChange={(e) => set("salaryMax", Number(e.target.value))}
                    onBlur={() => touch("salaryMax")}
                    className="h-8 text-sm"
                  />
                  {fieldError("salaryMax") && (
                    <p className="text-xs text-destructive">
                      {fieldError("salaryMax")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Target Start Date</Label>
              <Input
                type="date"
                value={fields.targetStartDate}
                onChange={(e) => set("targetStartDate", e.target.value)}
                onBlur={() => touch("targetStartDate")}
                className="h-8 text-sm"
              />
              {fieldError("targetStartDate") && (
                <p className="text-xs text-destructive">
                  {fieldError("targetStartDate")}
                </p>
              )}
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Required Skills</Label>
              <div className="flex flex-col gap-2">
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs gap-1 pl-2 pr-1"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="rounded-sm hover:bg-muted-foreground/20 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    ref={skillInputRef}
                    placeholder="Type skill and press Enter or comma"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    className="h-8 text-sm flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={addSkill}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Job Description</Label>
              <Textarea
                placeholder="Describe the role, responsibilities, and requirements..."
                value={fields.jobDescription}
                onChange={(e) => set("jobDescription", e.target.value)}
                onBlur={() => touch("jobDescription")}
                className="text-sm resize-none max-h-36 overflow-y-auto"
                rows={4}
              />
              {fieldError("jobDescription") && (
                <p className="text-xs text-destructive">
                  {fieldError("jobDescription")}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? "Save Changes" : "Create Requisition"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
