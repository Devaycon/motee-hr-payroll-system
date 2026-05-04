"use client";

import { useState } from "react";
import { z } from "zod";
import { ChevronRight, ChevronLeft, User, Briefcase } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import { DEPT_OPTIONS, EMPLOYMENT_TYPE_LABELS } from "../data";
import type { EmployeeRow, NewEmployee } from "../types";

interface EmployeeAddModalProps {
  open: boolean;
  onClose: () => void;
  allEmployees: EmployeeRow[];
  onSave: (emp: NewEmployee) => void;
}

const STEPS = [
  { id: 1, label: "Personal Details", icon: User },
  { id: 2, label: "Job Information", icon: Briefcase },
];

const step1Schema = z.object({
  name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name must be at most 80 characters")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Full name can only contain letters, spaces, hyphens and apostrophes",
    ),
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Enter a valid email address"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^\+?[\d\s\-().]{7,20}$/,
      "Enter a valid phone number (e.g. +234-801-234-5678)",
    ),
});

const step2Schema = z.object({
  department: z.string().min(1, "Please select a department"),
  jobTitle: z
    .string()
    .min(2, "Job title must be at least 2 characters")
    .max(80, "Job title must be at most 80 characters"),
  startDate: z.string().min(1, "Start date is required"),
  salary: z
    .string()
    .refine(
      (v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 0),
      "Salary must be a positive number",
    ),
});

type Step1Fields = keyof z.infer<typeof step1Schema>;
type Step2Fields = keyof z.infer<typeof step2Schema>;
type FieldErrors = Partial<Record<Step1Fields | Step2Fields, string>>;

const EMPTY: NewEmployee = {
  name: "",
  email: "",
  phone: "",
  department: "",
  jobTitle: "",
  employmentType: "full_time",
  status: "active",
  startDate: "",
  salary: "",
  managerId: "",
};

export function EmployeeAddModal({
  open,
  onClose,
  allEmployees,
  onSave,
}: EmployeeAddModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<NewEmployee>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<Step1Fields | Step2Fields, boolean>>
  >({});

  function handleClose() {
    setStep(1);
    setForm(EMPTY);
    setErrors({});
    setTouched({});
    onClose();
  }

  function set(field: keyof NewEmployee, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    validateField(field as Step1Fields | Step2Fields, value);
  }

  function touch(field: Step1Fields | Step2Fields) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, form[field as keyof NewEmployee] as string);
  }

  function validateField(field: Step1Fields | Step2Fields, value: string) {
    const step1Fields = ["name", "email", "phone"] as const;
    const step2Fields = [
      "department",
      "jobTitle",
      "startDate",
      "salary",
    ] as const;

    let error: string | undefined;

    if (step1Fields.includes(field as Step1Fields)) {
      const result = step1Schema.shape[field as Step1Fields].safeParse(value);
      error = result.success ? undefined : result.error.issues[0]?.message;
    } else if (step2Fields.includes(field as Step2Fields)) {
      const result = step2Schema.shape[field as Step2Fields].safeParse(value);
      error = result.success ? undefined : result.error.issues[0]?.message;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
  }

  function validateStep1(): boolean {
    const result = step1Schema.safeParse({
      name: form.name,
      email: form.email,
      phone: form.phone,
    });
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((e) => {
        const key = e.path[0];
        if (key) fieldErrors[key as Step1Fields] = e.message;
      });
      setErrors(fieldErrors);
      setTouched({ name: true, email: true, phone: true });
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    const result = step2Schema.safeParse({
      department: form.department,
      jobTitle: form.jobTitle,
      startDate: form.startDate,
      salary: form.salary,
    });
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((e) => {
        const key = e.path[0];
        if (key) fieldErrors[key as Step2Fields] = e.message;
      });
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setTouched((prev) => ({
        ...prev,
        department: true,
        jobTitle: true,
        startDate: true,
        salary: true,
      }));
      return false;
    }
    return true;
  }

  function handleNext() {
    if (validateStep1()) setStep(2);
  }

  function handleSave() {
    if (validateStep2()) {
      onSave(form);
      handleClose();
    }
  }

  function fieldError(field: Step1Fields | Step2Fields) {
    return touched[field] && errors[field] ? errors[field] : undefined;
  }

  const deptOptions = DEPT_OPTIONS.filter((d) => d !== "all");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Add Employee
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isDone
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-border mx-2" />
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4 py-2">
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. Adaeze Okonkwo"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={() => touch("name")}
                  className={cn(
                    "h-8 text-sm",
                    fieldError("name") &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {fieldError("name") && (
                  <p className="text-[11px] text-destructive">
                    {fieldError("name")}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="e.g. adaeze@company.ng"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  onBlur={() => touch("email")}
                  className={cn(
                    "h-8 text-sm",
                    fieldError("email") &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {fieldError("email") && (
                  <p className="text-[11px] text-destructive">
                    {fieldError("email")}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. +234-801-234-5678"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  onBlur={() => touch("phone")}
                  className={cn(
                    "h-8 text-sm",
                    fieldError("phone") &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {fieldError("phone") && (
                  <p className="text-[11px] text-destructive">
                    {fieldError("phone")}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Department <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.department}
                    onValueChange={(v) => {
                      set("department", v);
                      touch("department");
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-8 text-sm",
                        fieldError("department") && "border-destructive",
                      )}
                    >
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {deptOptions.map((d) => (
                        <SelectItem key={d} value={d} className="text-xs">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldError("department") && (
                    <p className="text-[11px] text-destructive">
                      {fieldError("department")}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Employment Type</Label>
                  <Select
                    value={form.employmentType}
                    onValueChange={(v) => set("employmentType", v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-xs">
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Job Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. Senior Software Engineer"
                  value={form.jobTitle}
                  onChange={(e) => set("jobTitle", e.target.value)}
                  onBlur={() => touch("jobTitle")}
                  className={cn(
                    "h-8 text-sm",
                    fieldError("jobTitle") &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {fieldError("jobTitle") && (
                  <p className="text-[11px] text-destructive">
                    {fieldError("jobTitle")}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    onBlur={() => touch("startDate")}
                    className={cn(
                      "h-8 text-sm",
                      fieldError("startDate") &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {fieldError("startDate") && (
                    <p className="text-[11px] text-destructive">
                      {fieldError("startDate")}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Monthly Salary (₦)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 500000"
                    value={form.salary}
                    onChange={(e) => set("salary", e.target.value)}
                    onBlur={() => touch("salary")}
                    className={cn(
                      "h-8 text-sm",
                      fieldError("salary") &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {fieldError("salary") && (
                    <p className="text-[11px] text-destructive">
                      {fieldError("salary")}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => set("status", v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active" className="text-xs">
                        Active
                      </SelectItem>
                      <SelectItem value="probation" className="text-xs">
                        Probation
                      </SelectItem>
                      <SelectItem value="on_leave" className="text-xs">
                        On Leave
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reports To</Label>
                  <Select
                    value={form.managerId}
                    onValueChange={(v) => set("managerId", v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="No manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" className="text-xs">
                        No manager (Top level)
                      </SelectItem>
                      {allEmployees.map((e) => (
                        <SelectItem key={e.id} value={e.id} className="text-xs">
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 gap-1.5"
            onClick={step === 1 ? handleClose : () => setStep(1)}
          >
            {step === 1 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </>
            )}
          </Button>
          {step === 1 ? (
            <Button
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={handleNext}
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button size="sm" className="text-xs h-8" onClick={handleSave}>
              Add Employee
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
