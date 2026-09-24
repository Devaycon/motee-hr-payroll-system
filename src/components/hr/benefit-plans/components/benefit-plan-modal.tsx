"use client";

import { useState } from "react";
import { z } from "zod";
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
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { cn } from "@/src/lib/utils";
import { EMPLOYMENT_TYPE_OPTIONS } from "@/src/lib/constants/employment-types";
import {
  BENEFIT_CATEGORY_LABELS,
  BENEFIT_CATEGORY_OPTIONS,
  BENEFIT_PLAN_STATUS_LABELS,
  BENEFIT_ENROLLMENT_LABELS,
  type BenefitEnrollment,
  type BenefitPlan,
  type NewBenefitPlan,
} from "../types";

interface BenefitPlanModalProps {
  open: boolean;
  onClose: () => void;
  editingPlan: BenefitPlan | null;
  onSave: (data: NewBenefitPlan) => void;
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().min(4, "Description is required").max(500),
});

type FormFields = keyof z.infer<typeof formSchema>;
type FieldErrors = Partial<Record<FormFields, string>>;

function emptyForm(): NewBenefitPlan {
  return {
    name: "",
    category: "health",
    description: "",
    provider: "",
    coverageDetails: "",
    employerContributionPct: undefined,
    employeeContributionPct: undefined,
    costNote: "",
    waitingPeriodDays: undefined,
    scope: { kind: "all" },
    status: "draft",
    enrollment: "core",
  };
}

export function BenefitPlanModal({
  open,
  onClose,
  editingPlan,
  onSave,
}: BenefitPlanModalProps) {
  const [form, setForm] = useState<NewBenefitPlan>(emptyForm());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FormFields, boolean>>>(
    {},
  );

  // Reset the form whenever the dialog transitions open, keyed off whichever
  // plan (if any) it was opened to edit — mirrors the employment-type modal.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setForm(
        editingPlan
          ? {
              name: editingPlan.name,
              category: editingPlan.category,
              description: editingPlan.description,
              provider: editingPlan.provider ?? "",
              coverageDetails: editingPlan.coverageDetails ?? "",
              employerContributionPct: editingPlan.employerContributionPct,
              employeeContributionPct: editingPlan.employeeContributionPct,
              costNote: editingPlan.costNote ?? "",
              waitingPeriodDays: editingPlan.waitingPeriodDays,
              scope:
                editingPlan.scope.kind === "employmentType"
                  ? { kind: "employmentType", types: [...editingPlan.scope.types] }
                  : { kind: "all" },
              status: editingPlan.status,
              enrollment: editingPlan.enrollment ?? "core",
              country: editingPlan.country,
            }
          : emptyForm(),
      );
      setErrors({});
      setTouched({});
    }
  }

  function handleClose() {
    setErrors({});
    setTouched({});
    onClose();
  }

  function setField<K extends keyof NewBenefitPlan>(
    key: K,
    value: NewBenefitPlan[K],
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
    const result = formSchema.shape[field].safeParse(form[field]);
    setErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  }

  function fieldError(field: FormFields) {
    return touched[field] && errors[field] ? errors[field] : undefined;
  }

  function toggleEmploymentType(type: string) {
    setForm((prev) => {
      const current = prev.scope.kind === "employmentType" ? prev.scope.types : [];
      const next = current.includes(type as (typeof current)[number])
        ? current.filter((t) => t !== type)
        : [...current, type as (typeof current)[number]];
      return { ...prev, scope: { kind: "employmentType", types: next } };
    });
  }

  function handleSave() {
    const result = formSchema.safeParse({
      name: form.name,
      description: form.description,
    });
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((e) => {
        const key = e.path[0];
        if (key) fieldErrors[key as FormFields] = e.message;
      });
      setErrors(fieldErrors);
      setTouched({ name: true, description: true });
      return;
    }
    // A restricted plan with no types picked isn't a valid scope — fall back
    // to "all" rather than silently saving a plan nobody is eligible for.
    const scope =
      form.scope.kind === "employmentType" && form.scope.types.length === 0
        ? { kind: "all" as const }
        : form.scope;
    onSave({
      ...form,
      scope,
      provider: form.provider?.trim() || undefined,
      coverageDetails: form.coverageDetails?.trim() || undefined,
      costNote: form.costNote?.trim() || undefined,
    });
    handleClose();
  }

  const selectedTypes = form.scope.kind === "employmentType" ? form.scope.types : [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            {editingPlan ? "Edit Benefit Plan" : "New Benefit Plan"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-1">
          <div className="space-y-4 py-2 pr-2">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Group Health Insurance (HMO)"
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
                <p className="text-[11px] text-destructive">{fieldError("name")}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setField("category", v as NewBenefitPlan["category"])
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BENEFIT_CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {BENEFIT_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setField("status", v as NewBenefitPlan["status"])
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BENEFIT_PLAN_STATUS_LABELS).map(([k, v]) => (
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
                Description <span className="text-destructive">*</span>
              </Label>
              <textarea
                placeholder="What this benefit covers and why it exists"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                onBlur={() => touch("description")}
                rows={2}
                className={cn(
                  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none",
                  fieldError("description") && "border-destructive",
                )}
              />
              {fieldError("description") && (
                <p className="text-[11px] text-destructive">
                  {fieldError("description")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Provider / Scheme</Label>
                <Input
                  placeholder="e.g. AXA Mansard HMO"
                  value={form.provider ?? ""}
                  onChange={(e) => setField("provider", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Waiting Period (days)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 90"
                  value={form.waitingPeriodDays ?? ""}
                  onChange={(e) =>
                    setField(
                      "waitingPeriodDays",
                      e.target.value === "" ? undefined : Number(e.target.value),
                    )
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Enrolment</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(BENEFIT_ENROLLMENT_LABELS) as BenefitEnrollment[]).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setField("enrollment", e)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-xs transition-colors",
                      (form.enrollment ?? "core") === e
                        ? "border-primary bg-primary/5 font-medium text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    {BENEFIT_ENROLLMENT_LABELS[e]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Coverage Details</Label>
              <textarea
                placeholder="e.g. Employee + spouse + 4 children · in/outpatient care"
                value={form.coverageDetails ?? ""}
                onChange={(e) => setField("coverageDetails", e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Employee Contribution %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 8"
                  value={form.employeeContributionPct ?? ""}
                  onChange={(e) =>
                    setField(
                      "employeeContributionPct",
                      e.target.value === "" ? undefined : Number(e.target.value),
                    )
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Employer Contribution %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 10"
                  value={form.employerContributionPct ?? ""}
                  onChange={(e) =>
                    setField(
                      "employerContributionPct",
                      e.target.value === "" ? undefined : Number(e.target.value),
                    )
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Cost Note</Label>
              <Input
                placeholder="e.g. Fully employer-funded"
                value={form.costNote ?? ""}
                onChange={(e) => setField("costNote", e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-2 rounded-lg border border-border px-3 py-3">
              <Label className="text-xs">Who is this for?</Label>
              <RadioGroup
                value={form.scope.kind}
                onValueChange={(v) =>
                  setField(
                    "scope",
                    v === "all"
                      ? { kind: "all" }
                      : { kind: "employmentType", types: selectedTypes },
                  )
                }
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="scope-all" className="h-3.5 w-3.5" />
                  <Label htmlFor="scope-all" className="text-xs font-normal cursor-pointer">
                    All employees
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="employmentType"
                    id="scope-type"
                    className="h-3.5 w-3.5"
                  />
                  <Label htmlFor="scope-type" className="text-xs font-normal cursor-pointer">
                    Specific employment types
                  </Label>
                </div>
              </RadioGroup>

              {form.scope.kind === "employmentType" && (
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-3 pt-1 pl-5">
                  {EMPLOYMENT_TYPE_OPTIONS.map((t) => (
                    <div key={t.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`type-${t.value}`}
                        checked={selectedTypes.includes(t.value)}
                        onCheckedChange={() => toggleEmploymentType(t.value)}
                        className="h-3.5 w-3.5"
                      />
                      <Label
                        htmlFor={`type-${t.value}`}
                        className="text-xs font-normal cursor-pointer"
                      >
                        {t.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleClose}>
            Cancel
          </Button>
          <Button size="sm" className="text-xs h-8" onClick={handleSave}>
            {editingPlan ? "Save Changes" : "Create Plan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
