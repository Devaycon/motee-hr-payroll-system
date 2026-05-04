"use client";

import { useState } from "react";
import { z } from "zod";
import { ChevronDown } from "lucide-react";
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
import { Checkbox } from "@/src/components/ui/checkbox";
import { Switch } from "@/src/components/ui/switch";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { cn } from "@/src/lib/utils";
import {
  STATUTORY_DEDUCTION_OPTIONS,
  BENEFITS_OPTIONS,
  PAY_FREQUENCY_LABELS,
  CONTRACT_DURATION_LABELS,
} from "../data";
import type {
  EmploymentTypeRow,
  ContractDuration,
  PayFrequency,
  NewEmploymentType,
  PensionContribution,
  ProbationPeriodConfig,
  BenefitsConfig,
  WorkingHoursConfig,
} from "../types";

interface EmploymentTypeModalProps {
  open: boolean;
  onClose: () => void;
  editingType: EmploymentTypeRow | null;
  onSave: (data: NewEmploymentType | EmploymentTypeRow) => void;
}

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Type name must be at least 2 characters")
    .max(60, "Type name must be at most 60 characters"),
  contractDuration: z.enum(
    [
      "permanent",
      "fixed_1y",
      "fixed_2y",
      "fixed_3y",
      "contract_3m",
      "contract_6m",
    ],
    {
      message: "Please select a contract duration",
    },
  ),
  leaveEntitlement: z.string().min(1, "Leave entitlement is required"),
});

type FormFields = keyof z.infer<typeof formSchema>;
type FieldErrors = Partial<Record<FormFields, string>>;

const EMPTY_PENSION: PensionContribution = {
  enabled: false,
  employeePercentage: 8,
  employerPercentage: 10,
};
const EMPTY_PROBATION: ProbationPeriodConfig = {
  enabled: false,
  durationMonths: 3,
  reviewRequired: false,
};
const EMPTY_BENEFITS: BenefitsConfig = { enabled: false, available: [] };
const EMPTY_HOURS: WorkingHoursConfig = {
  enabled: false,
  hoursPerWeek: 40,
  flexibleHours: false,
};

const EMPTY = {
  name: "",
  description: "",
  contractDuration: "permanent" as ContractDuration,
  leaveEntitlement: "",
  payFrequency: "monthly" as PayFrequency,
  payrollInclusion: true,
  statutoryDeductions: [] as string[],
  pensionContribution: { ...EMPTY_PENSION },
  probationPeriod: { ...EMPTY_PROBATION },
  benefits: { ...EMPTY_BENEFITS, available: [] as string[] },
  workingHours: { ...EMPTY_HOURS },
};

export function EmploymentTypeModal({
  open,
  onClose,
  editingType,
  onSave,
}: EmploymentTypeModalProps) {
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FormFields, boolean>>>(
    {},
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      if (editingType) {
        setForm({
          name: editingType.name,
          description: editingType.description,
          contractDuration: editingType.contractDuration,
          leaveEntitlement: editingType.leaveEntitlement,
          payFrequency: editingType.payFrequency,
          payrollInclusion: editingType.payrollInclusion,
          statutoryDeductions: [...editingType.statutoryDeductions],
          pensionContribution: { ...editingType.pensionContribution },
          probationPeriod: { ...editingType.probationPeriod },
          benefits: {
            ...editingType.benefits,
            available: [...editingType.benefits.available],
          },
          workingHours: { ...editingType.workingHours },
        });
      } else {
        setForm({
          ...EMPTY,
          description: "",
          statutoryDeductions: [],
          benefits: { ...EMPTY_BENEFITS, available: [] },
        });
      }
      setErrors({});
      setTouched({});
      setExpanded({});
    }
  }

  function handleClose() {
    setErrors({});
    setTouched({});
    onClose();
  }

  function setField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in formSchema.shape) {
      const result = formSchema.shape[key as FormFields].safeParse(value);
      setErrors((prev) => ({
        ...prev,
        [key]: result.success ? undefined : result.error.issues[0]?.message,
      }));
    }
  }

  function touch(field: FormFields) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const result = formSchema.shape[field].safeParse(
      form[field as keyof typeof form],
    );
    setErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  }

  function fieldError(field: FormFields) {
    return touched[field] && errors[field] ? errors[field] : undefined;
  }

  function toggleDeduction(d: string) {
    setForm((prev) => ({
      ...prev,
      statutoryDeductions: prev.statutoryDeductions.includes(d)
        ? prev.statutoryDeductions.filter((x) => x !== d)
        : [...prev.statutoryDeductions, d],
    }));
  }

  function toggleBenefit(b: string) {
    setForm((prev) => ({
      ...prev,
      benefits: {
        ...prev.benefits,
        available: prev.benefits.available.includes(b)
          ? prev.benefits.available.filter((x) => x !== b)
          : [...prev.benefits.available, b],
      },
    }));
  }

  function toggleExpanded(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    const result = formSchema.safeParse({
      name: form.name,
      contractDuration: form.contractDuration,
      leaveEntitlement: form.leaveEntitlement,
    });
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((e) => {
        const key = e.path[0];
        if (key) fieldErrors[key as FormFields] = e.message;
      });
      setErrors(fieldErrors);
      setTouched({
        name: true,
        contractDuration: true,
        leaveEntitlement: true,
      });
      return;
    }
    const payload = {
      name: form.name,
      description: form.description,
      contractDuration: form.contractDuration,
      leaveEntitlement: form.leaveEntitlement,
      payFrequency: form.payFrequency,
      payrollInclusion: form.payrollInclusion,
      statutoryDeductions: form.statutoryDeductions,
      pensionContribution: form.pensionContribution,
      probationPeriod: form.probationPeriod,
      benefits: form.benefits,
      workingHours: form.workingHours,
    };
    if (editingType) {
      onSave({ ...editingType, ...payload });
    } else {
      onSave({ ...payload });
    }
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            {editingType ? "Edit Employment Type" : "New Employment Type"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-1">
          <div className="space-y-4 py-2 pr-2">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Type Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Full Time"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
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
              <Label className="text-xs">Description</Label>
              <textarea
                placeholder="Brief description of this employment type"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Contract Duration <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.contractDuration}
                  onValueChange={(v) => {
                    setField("contractDuration", v as ContractDuration);
                    touch("contractDuration");
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "h-8 text-sm",
                      fieldError("contractDuration") && "border-destructive",
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTRACT_DURATION_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError("contractDuration") && (
                  <p className="text-[11px] text-destructive">
                    {fieldError("contractDuration")}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Pay Frequency</Label>
                <Select
                  value={form.payFrequency}
                  onValueChange={(v) =>
                    setField("payFrequency", v as PayFrequency)
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAY_FREQUENCY_LABELS).map(([k, v]) => (
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
                Leave Entitlement (days/year){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 21"
                value={form.leaveEntitlement}
                onChange={(e) => setField("leaveEntitlement", e.target.value)}
                onBlur={() => touch("leaveEntitlement")}
                className={cn(
                  "h-8 text-sm",
                  fieldError("leaveEntitlement") &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {fieldError("leaveEntitlement") && (
                <p className="text-[11px] text-destructive">
                  {fieldError("leaveEntitlement")}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div>
                <p className="text-xs font-medium text-foreground">
                  Payroll Inclusion
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Include this type in payroll runs
                </p>
              </div>
              <Switch
                checked={form.payrollInclusion}
                onCheckedChange={(v) => setField("payrollInclusion", v)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Statutory Deductions</Label>
              <div className="grid grid-cols-3 gap-y-2.5 gap-x-3">
                {STATUTORY_DEDUCTION_OPTIONS.map((d) => (
                  <div key={d} className="flex items-center gap-2">
                    <Checkbox
                      id={`ded-${d}`}
                      checked={form.statutoryDeductions.includes(d)}
                      onCheckedChange={() => toggleDeduction(d)}
                      className="h-3.5 w-3.5"
                    />
                    <Label
                      htmlFor={`ded-${d}`}
                      className="text-xs font-normal cursor-pointer"
                    >
                      {d}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Pension Contribution */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Switch
                  checked={form.pensionContribution.enabled}
                  onCheckedChange={(v) =>
                    setField("pensionContribution", {
                      ...form.pensionContribution,
                      enabled: v,
                    })
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    Pension Contribution
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Set pension deduction percentage for employees
                  </p>
                </div>
                <button
                  onClick={() => toggleExpanded("pension")}
                  className="p-1 rounded hover:bg-muted"
                >
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      expanded.pension && "rotate-180",
                    )}
                  />
                </button>
              </div>
              {expanded.pension && (
                <div className="border-t border-border px-3 py-3 space-y-3 bg-muted/20">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Employee % Contribution</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="8"
                        value={form.pensionContribution.employeePercentage}
                        onChange={(e) =>
                          setField("pensionContribution", {
                            ...form.pensionContribution,
                            employeePercentage: Number(e.target.value),
                          })
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Employer % Contribution</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="10"
                        value={form.pensionContribution.employerPercentage}
                        onChange={(e) =>
                          setField("pensionContribution", {
                            ...form.pensionContribution,
                            employerPercentage: Number(e.target.value),
                          })
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Probation Period */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Switch
                  checked={form.probationPeriod.enabled}
                  onCheckedChange={(v) =>
                    setField("probationPeriod", {
                      ...form.probationPeriod,
                      enabled: v,
                    })
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    Probation Period
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Set probation period requirements for new employees
                  </p>
                </div>
                <button
                  onClick={() => toggleExpanded("probation")}
                  className="p-1 rounded hover:bg-muted"
                >
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      expanded.probation && "rotate-180",
                    )}
                  />
                </button>
              </div>
              {expanded.probation && (
                <div className="border-t border-border px-3 py-3 space-y-3 bg-muted/20">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Duration (months)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      placeholder="3"
                      value={form.probationPeriod.durationMonths}
                      onChange={(e) =>
                        setField("probationPeriod", {
                          ...form.probationPeriod,
                          durationMonths: Number(e.target.value),
                        })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="probation-review"
                      checked={form.probationPeriod.reviewRequired}
                      onCheckedChange={(v) =>
                        setField("probationPeriod", {
                          ...form.probationPeriod,
                          reviewRequired: !!v,
                        })
                      }
                      className="h-3.5 w-3.5"
                    />
                    <Label
                      htmlFor="probation-review"
                      className="text-xs font-normal cursor-pointer"
                    >
                      Formal review required at end of probation
                    </Label>
                  </div>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Switch
                  checked={form.benefits.enabled}
                  onCheckedChange={(v) =>
                    setField("benefits", { ...form.benefits, enabled: v })
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    Benefits
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Select benefits available for this employment type
                  </p>
                </div>
                <button
                  onClick={() => toggleExpanded("benefits")}
                  className="p-1 rounded hover:bg-muted"
                >
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      expanded.benefits && "rotate-180",
                    )}
                  />
                </button>
              </div>
              {expanded.benefits && (
                <div className="border-t border-border px-3 py-3 bg-muted/20">
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                    {BENEFITS_OPTIONS.map((b) => (
                      <div key={b} className="flex items-center gap-2">
                        <Checkbox
                          id={`ben-${b}`}
                          checked={form.benefits.available.includes(b)}
                          onCheckedChange={() => toggleBenefit(b)}
                          className="h-3.5 w-3.5"
                        />
                        <Label
                          htmlFor={`ben-${b}`}
                          className="text-xs font-normal cursor-pointer"
                        >
                          {b}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Working Hours */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Switch
                  checked={form.workingHours.enabled}
                  onCheckedChange={(v) =>
                    setField("workingHours", {
                      ...form.workingHours,
                      enabled: v,
                    })
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    Working Hours
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Define standard working hours and flexibility
                  </p>
                </div>
                <button
                  onClick={() => toggleExpanded("hours")}
                  className="p-1 rounded hover:bg-muted"
                >
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      expanded.hours && "rotate-180",
                    )}
                  />
                </button>
              </div>
              {expanded.hours && (
                <div className="border-t border-border px-3 py-3 space-y-3 bg-muted/20">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Hours Per Week</Label>
                    <Input
                      type="number"
                      min={1}
                      max={168}
                      placeholder="40"
                      value={form.workingHours.hoursPerWeek}
                      onChange={(e) =>
                        setField("workingHours", {
                          ...form.workingHours,
                          hoursPerWeek: Number(e.target.value),
                        })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="flexible-hours"
                      checked={form.workingHours.flexibleHours}
                      onCheckedChange={(v) =>
                        setField("workingHours", {
                          ...form.workingHours,
                          flexibleHours: !!v,
                        })
                      }
                      className="h-3.5 w-3.5"
                    />
                    <Label
                      htmlFor="flexible-hours"
                      className="text-xs font-normal cursor-pointer"
                    >
                      Flexible hours allowed
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button size="sm" className="text-xs h-8" onClick={handleSave}>
            {editingType ? "Save Changes" : "Create Type"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
