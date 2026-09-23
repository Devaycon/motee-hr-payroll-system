"use client";

import { currentCurrencySymbol } from "@/src/lib/hooks/use-currency";
import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ChevronRight, Check, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils";
import {
  EmployeePicker,
  type PickedEmployee,
} from "@/src/components/shared/employee-picker";
import { DEPARTMENT_OPTIONS } from "../data";
import type { ManualOnboardingData, Guarantor, AssetDraft } from "../types";
import { emptyAssetDraft } from "../types";
import { guarantorsSchema, emptyGuarantor } from "@/src/lib/validation/guarantor";
import { addRecord } from "@/src/lib/stores/onboarding-records-slice";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useBranchOptions } from "@/src/lib/branches/use-branch";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import { onboardingStarted } from "@/src/lib/notifications/onboarding";
import {
  getOnboardingTemplates,
  getDefaultOnboardingTemplate,
} from "../instantiate";
import { EMPLOYMENT_TYPE_OPTIONS } from "@/src/lib/constants/employment-types";
import { titlesForGender } from "@/src/lib/constants/titles";
import { formatSortCode } from "@/src/lib/utils/bank-details";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const WORK_MODE_OPTIONS = [
  { value: "onsite", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];


const MARITAL_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

// Titles are offered against the selected gender — see `titlesForGender`.

const ETHNICITY_OPTIONS = [
  "Asian / Asian British",
  "Black / African / Caribbean / Black British",
  "Mixed / Multiple ethnic groups",
  "White",
  "Other ethnic group",
  "Prefer not to say",
];

type StepKey =
  | "personal"
  | "employment"
  | "bank"
  | "identity"
  | "emergency"
  | "guarantors"
  | "medical"
  | "assets"
  | "review";

const STEP_LABELS: Record<StepKey, string> = {
  personal: "Personal",
  employment: "Employment",
  bank: "Bank Details",
  identity: "Documents",
  emergency: "Emergency",
  guarantors: "Guarantors",
  medical: "Medical",
  assets: "Assets",
  review: "Review",
};

/** Guarantors are always required for NG hires; never collected for UK. */
function buildStepKeys(isUK: boolean): StepKey[] {
  return isUK
    ? ["personal", "employment", "bank", "identity", "emergency", "medical", "assets", "review"]
    : ["personal", "employment", "bank", "identity", "emergency", "guarantors", "medical", "assets", "review"];
}

const step1Schema = z.object({
  title: z.string().optional(),
  firstName: z.string().min(1, "Required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Required"),
  preferredName: z.string().optional(),
  maidenName: z.string().optional(),
  initials: z.string().optional(),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "At least 7 digits"),
  dateOfBirth: z.string().min(1, "Required"),
  gender: z.string().min(1, "Required"),
  nationality: z.string().min(1, "Required"),
  ethnicity: z.string().optional(),
  maritalStatus: z.string().optional(),
  address: z.string().min(5, "At least 5 characters"),
  state: z.string().optional(),
  postalCode: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
});

const step2Schema = z.object({
  employeeId: z.string().optional(),
  jobTitle: z.string().min(2, "At least 2 characters"),
  department: z.string().min(1, "Required"),
  employmentType: z.string().min(1, "Required"),
  manager: z.string().min(2, "At least 2 characters"),
  startDate: z.string().min(1, "Required"),
  salary: z.string(),
  workLocation: z.string().min(2, "At least 2 characters"),
  workMode: z.string().optional(),
  grade: z.string().optional(),
});

const step3Schema = z.object({
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  // §2.16 — validated in its own right now it has its own field.
  sortCode: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{2}$/, "Use the format NN-NN-NN")
    .optional()
    .or(z.literal("")),
});

const step4Schema = z.object({
  ninNumber: z.string().optional(),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
  passportCountry: z.string().optional(),
  driverLicenseNumber: z.string().optional(),
  driverLicenseExpiry: z.string().optional(),
  taxId: z.string().optional(),
  pensionId: z.string().optional(),
  nhfNumber: z.string().optional(),
});

const step5Schema = z.object({
  emergencyContactName: z.string().min(2, "At least 2 characters"),
  emergencyContactRelationship: z.string().min(2, "At least 2 characters"),
  emergencyContactPhone: z.string().min(7, "At least 7 digits"),
  emergencyContactEmail: z
    .string()
    .email("Valid email required")
    .optional()
    .or(z.literal("")),
});

const step6Schema = z.object({
  allergies: z.string().optional(),
  conditions: z.string().optional(),
  medications: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
});

const step7Schema = z.object({
  // §3.1 — any number of assets, including none.
  assets: z.array(
    z.object({
      tag: z.string().optional(),
      name: z.string().optional(),
      category: z.string().optional(),
      serialNumber: z.string().optional(),
      assignedDate: z.string().optional(),
    }),
  ),
});

const EMPTY_DATA: ManualOnboardingData = {
  title: "",
  firstName: "",
  middleName: "",
  lastName: "",
  preferredName: "",
  maidenName: "",
  initials: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  nationality: "",
  ethnicity: "",
  maritalStatus: "",
  address: "",
  state: "",
  postalCode: "",
  country: "",
  employeeId: "",
  jobTitle: "",
  department: "",
  employmentType: "",
  managerId: "",
  manager: "",
  startDate: "",
  salary: "",
  branchId: "",
  workLocation: "",
  workMode: "",
  grade: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
  sortCode: "",
  ninNumber: "",
  niNumber: "",
  passportNumber: "",
  passportExpiry: "",
  passportCountry: "",
  driverLicenseNumber: "",
  driverLicenseExpiry: "",
  taxId: "",
  pensionId: "",
  nhfNumber: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
  emergencyContactEmail: "",
  guarantors: [emptyGuarantor(), emptyGuarantor()],
  allergies: "",
  conditions: "",
  medications: "",
  dietaryRequirements: "",
  accessibilityNeeds: "",
  assets: [emptyAssetDraft()],
  workflowTemplateId: "",
};

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground shrink-0 w-44">
        {label}
      </span>
      <span className="text-xs text-foreground text-right">{value}</span>
    </div>
  );
}

export function OnboardingFormPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const templates = useAppSelector((s) => s.approvals.templates);
  // Sort code and driving-licence expiry are UK-shaped; NG uses NIN/TIN/PFA.
  const isUK = useAppSelector((s) => s.locale.country) === "uk";
  const branchOptions = useBranchOptions();
  const onboardingTemplates = getOnboardingTemplates(templates);
  const defaultTemplate = getDefaultOnboardingTemplate(templates);
  const stepKeys = buildStepKeys(isUK);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ManualOnboardingData>(() => ({
    ...EMPTY_DATA,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentKey = stepKeys[step];
  const selectedWorkflowId = data.workflowTemplateId || defaultTemplate?.id || "";

  const stepSchemas: Partial<Record<StepKey, z.ZodType>> = {
    personal: step1Schema,
    employment: step2Schema,
    bank: step3Schema,
    identity: step4Schema,
    emergency: step5Schema,
    guarantors: guarantorsSchema,
    medical: step6Schema,
    assets: step7Schema,
  };

  function update(field: keyof ManualOnboardingData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  /** Updates one field on one of the two guarantors — always required for NG. */
  function updateGuarantor(index: number, field: keyof Guarantor, value: string) {
    setData((prev) => ({
      ...prev,
      guarantors: prev.guarantors.map((g, i) =>
        i === index ? { ...g, [field]: value } : g,
      ),
    }));
    const errKey = `guarantors.${index}.${field}`;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[errKey];
      return next;
    });
  }

  /** §3.1 — one, several, or no assets can be assigned at onboarding. */
  function updateAsset(index: number, field: keyof AssetDraft, value: string) {
    setData((prev) => ({
      ...prev,
      assets: prev.assets.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    }));
  }

  function addAsset() {
    setData((prev) => ({ ...prev, assets: [...prev.assets, emptyAssetDraft()] }));
  }

  function removeAsset(index: number) {
    setData((prev) => ({
      ...prev,
      assets: prev.assets.length > 1 ? prev.assets.filter((_, i) => i !== index) : prev.assets,
    }));
  }

  function validateStep(s: number): boolean {
    const schema = stepSchemas[stepKeys[s]];
    if (!schema) return true;
    const result = schema.safeParse(data);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errs[issue.path.join(".")] = issue.message;
      }
      setErrors(errs);
      return false;
    }
    return true;
  }

  function handleNext() {
    if (validateStep(step)) {
      setErrors({});
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    setErrors({});
    setStep((s) => s - 1);
  }

  function handleSubmit() {
    if (!validateStep(stepKeys.length - 2)) return;
    setIsSubmitting(true);
    const id = `onb-${Date.now()}`;
    const fullName = `${data.firstName} ${data.lastName}`;
    const initials = `${data.firstName[0]}${data.lastName[0]}`.toUpperCase();
    dispatch(
      addRecord({
        id,
        referenceId: data.employeeId || undefined,
        employeeName: fullName,
        employeeInitials: initials,
        email: data.email,
        jobTitle: data.jobTitle,
        department: data.department,
        startDate: data.startDate,
        stage: "pre_boarding",
        status: "not_started",
        // Tasks come from the onboarding workflow run the listener starts for
        // this record, which is the only place a real owner is known.
        tasks: [],
        completedTasks: 0,
        totalTasks: 0,
        welcomeEmailSent: false,
        initiatedAt: new Date().toISOString().slice(0, 10),
        mode: "manual",
        // Everything else this wizard collected (bank, tax, emergency
        // contact, medical, assets…) used to be discarded here — it never
        // reached the record at all, so there was nothing for the employee
        // handoff to carry through later.
        joinerData: data,
      }),
    );

    // §2.10 — the employer-side record of the process starting.
    dispatch(
      pushNotification(
        onboardingStarted(fullName, data.jobTitle, data.startDate),
      ),
    );

    toast.success(`Onboarding initiated for ${fullName}`);
    router.push("/talent/onboarding");
  }

  const err = (k: string) => errors[k];

  return (
    <div className="flex flex-col px-5 gap-6 pb-10 w-full">
      <div>
        <h1 className="text-4xl font-bold text-foreground mt-5">
          Add New Employee
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete all steps to initiate onboarding for a new team member.
        </p>
      </div>

      <div className="flex items-center w-full">
        {stepKeys.map((key, i) => (
          <div key={key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold border-2 transition-colors",
                  i < step
                    ? "bg-primary border-primary text-primary-foreground"
                    : i === step
                      ? "border-primary text-primary bg-background"
                      : "border-border text-muted-foreground bg-background",
                )}
              >
                {i < step ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  i === step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {STEP_LABELS[key]}
              </span>
            </div>
            {i < stepKeys.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mb-5 transition-colors",
                  i < step ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
        {currentKey === "personal" && (
          <>
            <h2 className="text-sm font-semibold text-foreground">
              Personal Information
            </h2>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Title</Label>
                <Select
                  value={data.title}
                  onValueChange={(v) => update("title", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    {titlesForGender(data.gender, data.maritalStatus).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={data.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="John"
                />
                {err("firstName") && (
                  <p className="text-xs text-destructive">{err("firstName")}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Middle Name</Label>
                <Input
                  value={data.middleName}
                  onChange={(e) => update("middleName", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. Michael"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={data.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Doe"
                />
                {err("lastName") && (
                  <p className="text-xs text-destructive">{err("lastName")}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Preferred Name</Label>
                <Input
                  value={data.preferredName}
                  onChange={(e) => update("preferredName", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. Johnny"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Maiden Name</Label>
                <Input
                  value={data.maidenName}
                  onChange={(e) => update("maidenName", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. Smith"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Initials</Label>
                <Input
                  value={data.initials}
                  onChange={(e) =>
                    update("initials", e.target.value.toUpperCase())
                  }
                  className="h-9 text-sm"
                  maxLength={5}
                  placeholder="e.g. JMD"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={data.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="john.doe@company.com"
                />
                {err("email") && (
                  <p className="text-xs text-destructive">{err("email")}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="tel"
                  value={data.phone}
                  onChange={(e) =>
                    update("phone", e.target.value.replace(/[^\d+\s-]/g, ""))
                  }
                  className="h-9 text-sm"
                  placeholder="+234 800 000 0000"
                />
                {err("phone") && (
                  <p className="text-xs text-destructive">{err("phone")}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={data.dateOfBirth}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                  className="h-9 text-sm"
                />
                {err("dateOfBirth") && (
                  <p className="text-xs text-destructive">
                    {err("dateOfBirth")}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Gender <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.gender}
                  onValueChange={(v) => update("gender", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {err("gender") && (
                  <p className="text-xs text-destructive">{err("gender")}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Nationality <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={data.nationality}
                  onChange={(e) => update("nationality", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. Nigerian"
                />
                {err("nationality") && (
                  <p className="text-xs text-destructive">
                    {err("nationality")}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Marital Status</Label>
                <Select
                  value={data.maritalStatus}
                  onValueChange={(v) => update("maritalStatus", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARITAL_STATUS_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Ethnicity</Label>
                <Select
                  value={data.ethnicity}
                  onValueChange={(v) => update("ethnicity", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select ethnicity" />
                  </SelectTrigger>
                  <SelectContent>
                    {ETHNICITY_OPTIONS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs">
                  Home Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={data.address}
                  onChange={(e) => update("address", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="123 Main Street"
                />
                {err("address") && (
                  <p className="text-xs text-destructive">{err("address")}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">State / Province</Label>
                <Input
                  value={data.state}
                  onChange={(e) => update("state", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. Lagos"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Postcode <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={data.postalCode}
                  onChange={(e) =>
                    update("postalCode", e.target.value.toUpperCase())
                  }
                  className="h-9 text-sm"
                  placeholder="e.g. SW1A 1AA"
                />
                {err("postalCode") && (
                  <p className="text-xs text-destructive">{err("postalCode")}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={data.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. Nigeria"
                />
                {err("country") && (
                  <p className="text-xs text-destructive">{err("country")}</p>
                )}
              </div>
            </div>
          </>
        )}

        {currentKey === "employment" && (
          <>
            <h2 className="text-sm font-semibold text-foreground">
              Employment Details
            </h2>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Employee ID{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  value={data.employeeId}
                  onChange={(e) => update("employeeId", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. EMP-001"
                />
                {err("employeeId") && (
                  <p className="text-xs text-destructive">
                    {err("employeeId")}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Job Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={data.jobTitle}
                  onChange={(e) => update("jobTitle", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. Software Engineer"
                />
                {err("jobTitle") && (
                  <p className="text-xs text-destructive">{err("jobTitle")}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Department <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.department}
                  onValueChange={(v) => update("department", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_OPTIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {err("department") && (
                  <p className="text-xs text-destructive">
                    {err("department")}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Employment Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.employmentType}
                  onValueChange={(v) => update("employmentType", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {err("employmentType") && (
                  <p className="text-xs text-destructive">
                    {err("employmentType")}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Line Manager <span className="text-destructive">*</span>
                </Label>
                <EmployeePicker
                  value={data.managerId || undefined}
                  placeholder="Search for a manager…"
                  onChange={(picked: PickedEmployee | null) => {
                    setData((prev) => ({
                      ...prev,
                      managerId: picked?.id ?? "",
                      manager: picked?.name ?? "",
                    }));
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.manager;
                      return next;
                    });
                  }}
                />
                {err("manager") && (
                  <p className="text-xs text-destructive">{err("manager")}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={data.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                  className="h-9 text-sm"
                />
                {err("startDate") && (
                  <p className="text-xs text-destructive">{err("startDate")}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Gross Salary ({currentCurrencySymbol()})
                </Label>
                <Input
                  type="number"
                  value={data.salary}
                  onChange={(e) => update("salary", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. 500000"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Branch <span className="text-destructive">*</span>
                </Label>
                {/* Picked from the branch list rather than typed, so the hire
                    lands on a real site. Both the id and its name are stored:
                    the id is the FK, the name is what older readers display. */}
                <Select
                  value={data.branchId}
                  onValueChange={(v) => {
                    update("branchId", v);
                    update(
                      "workLocation",
                      branchOptions.find((b) => b.id === v)?.name ?? "",
                    );
                  }}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branchOptions.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {err("workLocation") && (
                  <p className="text-xs text-destructive">
                    {err("workLocation")}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Work Mode</Label>
                <Select
                  value={data.workMode}
                  onValueChange={(v) => update("workMode", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select work mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_MODE_OPTIONS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Grade / Level</Label>
                <Input
                  value={data.grade}
                  onChange={(e) => update("grade", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. L3, Senior"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs">
                  Onboarding Workflow{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedWorkflowId}
                  onValueChange={(v) => update("workflowTemplateId", v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {onboardingTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                        {t.isDefault ? " (Default)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  The selected workflow&apos;s tasks &amp; reviewers will be
                  assigned to this hire.
                </p>
              </div>
            </div>
          </>
        )}

        {currentKey === "bank" && (
          <>
            <h2 className="text-sm font-semibold text-foreground">
              Bank Details
            </h2>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs">Bank Name</Label>
                <Input
                  value={data.bankName}
                  onChange={(e) => update("bankName", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. First Bank of Nigeria"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Account Number</Label>
                <Input
                  inputMode="numeric"
                  value={data.bankAccountNumber}
                  onChange={(e) =>
                    update(
                      "bankAccountNumber",
                      e.target.value.replace(/\D/g, ""),
                    )
                  }
                  className="h-9 text-sm"
                  placeholder={isUK ? "8-digit account number" : "10-digit account number"}
                  maxLength={isUK ? 8 : 10}
                />
              </div>
              {/* §2.16 — sort code is its own field, formatted as NN-NN-NN. */}
              {isUK && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Sort Code</Label>
                  <Input
                    inputMode="numeric"
                    value={data.sortCode}
                    onChange={(e) =>
                      update("sortCode", formatSortCode(e.target.value))
                    }
                    className="h-9 text-sm"
                    placeholder="NN-NN-NN"
                    maxLength={8}
                  />
                  {err("sortCode") && (
                    <p className="text-xs text-destructive">{err("sortCode")}</p>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Account Holder Name</Label>
                <Input
                  value={data.bankAccountName}
                  onChange={(e) => update("bankAccountName", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Name on account"
                />
              </div>
            </div>
          </>
        )}

        {currentKey === "identity" && (
          <>
            <h2 className="text-sm font-semibold text-foreground">
              Identity Documents
            </h2>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* §2.1 (Correction 2 feedback) — NIN/Pension ID (PFA)/NHF are
                  Nigeria-specific identifiers and must not render for UK
                  tenants. TIN doubles as the UK's UTR field (relabelled
                  below), and NI Number is UK-only. */}
              {!isUK && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">
                    NIN (National Identification Number)
                  </Label>
                  <Input
                    inputMode="numeric"
                    value={data.ninNumber}
                    onChange={(e) =>
                      update("ninNumber", e.target.value.replace(/\D/g, ""))
                    }
                    className="h-9 text-sm"
                    placeholder="11-digit NIN"
                    maxLength={11}
                  />
                </div>
              )}
              {isUK && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">NI Number</Label>
                  <Input
                    value={data.niNumber}
                    onChange={(e) =>
                      update("niNumber", e.target.value.toUpperCase())
                    }
                    className="h-9 text-sm"
                    placeholder="e.g. QQ 12 34 56 C"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  {isUK
                    ? "UTR (Unique Taxpayer Reference)"
                    : "TIN (Tax Identification Number)"}
                </Label>
                <Input
                  inputMode="numeric"
                  value={data.taxId}
                  onChange={(e) =>
                    update("taxId", e.target.value.replace(/\D/g, ""))
                  }
                  className="h-9 text-sm"
                  placeholder={isUK ? "10-digit UTR" : "Tax ID number"}
                  maxLength={isUK ? 10 : undefined}
                />
              </div>
              {!isUK && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Pension ID (PFA)</Label>
                  <Input
                    inputMode="numeric"
                    value={data.pensionId}
                    onChange={(e) =>
                      update("pensionId", e.target.value.replace(/\D/g, ""))
                    }
                    className="h-9 text-sm"
                    placeholder="Pension account number"
                  />
                </div>
              )}
              {!isUK && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">NHF Number</Label>
                  <Input
                    inputMode="numeric"
                    value={data.nhfNumber}
                    onChange={(e) =>
                      update("nhfNumber", e.target.value.replace(/\D/g, ""))
                    }
                    className="h-9 text-sm"
                    placeholder="National Housing Fund number"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  {isUK ? "Driving Licence Number" : "Driver's License Number"}
                </Label>
                <Input
                  value={data.driverLicenseNumber}
                  onChange={(e) =>
                    update("driverLicenseNumber", e.target.value)
                  }
                  className="h-9 text-sm"
                  placeholder="Licence number"
                />
              </div>
              {/* §2.17 — expiry sits with the licence, as passport expiry does. */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  {isUK ? "Driving Licence Expiry" : "Driver's License Expiry"}
                </Label>
                <Input
                  type="date"
                  value={data.driverLicenseExpiry}
                  onChange={(e) =>
                    update("driverLicenseExpiry", e.target.value)
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Passport Number</Label>
                <Input
                  value={data.passportNumber}
                  onChange={(e) => update("passportNumber", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Passport number"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Passport Expiry Date</Label>
                <Input
                  type="date"
                  value={data.passportExpiry}
                  onChange={(e) => update("passportExpiry", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Passport Issuing Country</Label>
                <Input
                  value={data.passportCountry}
                  onChange={(e) => update("passportCountry", e.target.value)}
                  className="h-9 text-sm"
                  placeholder={isUK ? "e.g. United Kingdom" : "e.g. Nigeria"}
                />
              </div>
            </div>
          </>
        )}

        {currentKey === "emergency" && (
          <>
            <h2 className="text-sm font-semibold text-foreground">
              Emergency Contact
            </h2>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={data.emergencyContactName}
                  onChange={(e) =>
                    update("emergencyContactName", e.target.value)
                  }
                  className="h-9 text-sm"
                  placeholder="Contact's full name"
                />
                {err("emergencyContactName") && (
                  <p className="text-xs text-destructive">
                    {err("emergencyContactName")}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Relationship <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={data.emergencyContactRelationship}
                  onChange={(e) =>
                    update("emergencyContactRelationship", e.target.value)
                  }
                  className="h-9 text-sm"
                  placeholder="e.g. Spouse, Parent"
                />
                {err("emergencyContactRelationship") && (
                  <p className="text-xs text-destructive">
                    {err("emergencyContactRelationship")}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="tel"
                  value={data.emergencyContactPhone}
                  onChange={(e) =>
                    update(
                      "emergencyContactPhone",
                      e.target.value.replace(/[^\d+\s-]/g, ""),
                    )
                  }
                  className="h-9 text-sm"
                  placeholder="+234 800 000 0000"
                />
                {err("emergencyContactPhone") && (
                  <p className="text-xs text-destructive">
                    {err("emergencyContactPhone")}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Email Address</Label>
                <Input
                  type="email"
                  value={data.emergencyContactEmail}
                  onChange={(e) =>
                    update("emergencyContactEmail", e.target.value)
                  }
                  className="h-9 text-sm"
                  placeholder="contact@example.com"
                />
                {err("emergencyContactEmail") && (
                  <p className="text-xs text-destructive">
                    {err("emergencyContactEmail")}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {currentKey === "guarantors" && (
          <>
            <h2 className="text-sm font-semibold text-foreground">
              Guarantors
            </h2>
            <p className="text-xs text-muted-foreground -mt-1">
              Two guarantors are required for every NG hire.
            </p>
            <Separator />
            <div className="flex flex-col gap-5">
              {data.guarantors.map((guarantor, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <h3 className="text-xs font-semibold text-foreground">
                    Guarantor {i + 1}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <Label className="text-xs">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={guarantor.name}
                        onChange={(e) => updateGuarantor(i, "name", e.target.value)}
                        className="h-9 text-sm"
                        placeholder="Guarantor's full name"
                      />
                      {err(`guarantors.${i}.name`) && (
                        <p className="text-xs text-destructive">
                          {err(`guarantors.${i}.name`)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">
                        Relationship <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={guarantor.relationship}
                        onChange={(e) =>
                          updateGuarantor(i, "relationship", e.target.value)
                        }
                        className="h-9 text-sm"
                        placeholder="e.g. Colleague, Family friend"
                      />
                      {err(`guarantors.${i}.relationship`) && (
                        <p className="text-xs text-destructive">
                          {err(`guarantors.${i}.relationship`)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <Label className="text-xs">
                        Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={guarantor.address}
                        onChange={(e) => updateGuarantor(i, "address", e.target.value)}
                        className="h-9 text-sm"
                        placeholder="Guarantor's home address"
                      />
                      {err(`guarantors.${i}.address`) && (
                        <p className="text-xs text-destructive">
                          {err(`guarantors.${i}.address`)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">
                        Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="tel"
                        value={guarantor.phone}
                        onChange={(e) =>
                          updateGuarantor(
                            i,
                            "phone",
                            e.target.value.replace(/[^\d+\s-]/g, ""),
                          )
                        }
                        className="h-9 text-sm"
                        placeholder="+234 800 000 0000"
                      />
                      {err(`guarantors.${i}.phone`) && (
                        <p className="text-xs text-destructive">
                          {err(`guarantors.${i}.phone`)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">
                        Occupation <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={guarantor.occupation}
                        onChange={(e) =>
                          updateGuarantor(i, "occupation", e.target.value)
                        }
                        className="h-9 text-sm"
                        placeholder="e.g. Civil Servant"
                      />
                      {err(`guarantors.${i}.occupation`) && (
                        <p className="text-xs text-destructive">
                          {err(`guarantors.${i}.occupation`)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {currentKey === "medical" && (
          <>
            <h2 className="text-sm font-semibold text-foreground">
              Medical Facts
            </h2>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Allergies</Label>
                <Input
                  value={data.allergies}
                  onChange={(e) => update("allergies", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Comma-separated, e.g. Peanuts, Penicillin"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Medical Conditions</Label>
                <Input
                  value={data.conditions}
                  onChange={(e) => update("conditions", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Comma-separated, e.g. Asthma"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Medications</Label>
                <Input
                  value={data.medications}
                  onChange={(e) => update("medications", e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Comma-separated"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Dietary Requirements</Label>
                <Input
                  value={data.dietaryRequirements}
                  onChange={(e) =>
                    update("dietaryRequirements", e.target.value)
                  }
                  className="h-9 text-sm"
                  placeholder="Comma-separated, e.g. Vegetarian"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs">Accessibility Needs</Label>
                <Input
                  value={data.accessibilityNeeds}
                  onChange={(e) =>
                    update("accessibilityNeeds", e.target.value)
                  }
                  className="h-9 text-sm"
                  placeholder="Any workplace accessibility requirements"
                />
              </div>
            </div>
          </>
        )}

        {currentKey === "assets" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Assets to Assign
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={addAsset}
              >
                <Plus className="w-3 h-3" /> Add asset
              </Button>
            </div>
            <Separator />
            {/* §3.1 — more than one asset can be assigned at onboarding. */}
            <div className="flex flex-col gap-5">
              {data.assets.map((asset, index) => (
                <div key={index} className="flex flex-col gap-3 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Asset {index + 1}
                    </span>
                    {data.assets.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 text-xs text-destructive hover:text-destructive"
                        onClick={() => removeAsset(index)}
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Asset Tag</Label>
                      <Input
                        value={asset.tag}
                        onChange={(e) => updateAsset(index, "tag", e.target.value)}
                        className="h-9 text-sm"
                        placeholder="e.g. AST-0142"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Asset Name</Label>
                      <Input
                        value={asset.name}
                        onChange={(e) => updateAsset(index, "name", e.target.value)}
                        className="h-9 text-sm"
                        placeholder="e.g. MacBook Pro 14&quot;"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Category</Label>
                      <Input
                        value={asset.category}
                        onChange={(e) => updateAsset(index, "category", e.target.value)}
                        className="h-9 text-sm"
                        placeholder="e.g. Laptop, Phone"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Serial Number</Label>
                      <Input
                        value={asset.serialNumber}
                        onChange={(e) => updateAsset(index, "serialNumber", e.target.value)}
                        className="h-9 text-sm"
                        placeholder="Serial number"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Assigned Date</Label>
                      <Input
                        type="date"
                        value={asset.assignedDate}
                        onChange={(e) => updateAsset(index, "assignedDate", e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {currentKey === "review" && (
          <>
            <h2 className="text-sm font-semibold text-foreground">
              Review & Confirm
            </h2>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Personal
                </p>
                <ReviewRow
                  label="Full Name"
                  value={[data.title, data.firstName, data.middleName, data.lastName]
                    .filter(Boolean)
                    .join(" ")}
                />
                <ReviewRow label="Preferred Name" value={data.preferredName} />
                <ReviewRow label="Maiden Name" value={data.maidenName} />
                <ReviewRow label="Initials" value={data.initials} />
                <ReviewRow label="Email" value={data.email} />
                <ReviewRow label="Phone" value={data.phone} />
                <ReviewRow label="Date of Birth" value={data.dateOfBirth} />
                <ReviewRow label="Gender" value={data.gender} />
                <ReviewRow label="Nationality" value={data.nationality} />
                <ReviewRow label="Ethnicity" value={data.ethnicity} />
                <ReviewRow label="Marital Status" value={data.maritalStatus} />
                <ReviewRow label="Address" value={data.address} />
                <ReviewRow label="State" value={data.state} />
                <ReviewRow label="Country" value={data.country} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Employment
                </p>
                <ReviewRow label="Employee ID" value={data.employeeId} />
                <ReviewRow label="Job Title" value={data.jobTitle} />
                <ReviewRow label="Department" value={data.department} />
                <ReviewRow
                  label="Employment Type"
                  value={data.employmentType}
                />
                <ReviewRow label="Line Manager" value={data.manager} />
                <ReviewRow label="Start Date" value={data.startDate} />
                <ReviewRow
                  label="Salary"
                  value={
                    data.salary
                      ? `${currentCurrencySymbol()}${Number(data.salary).toLocaleString()}`
                      : undefined
                  }
                />
                <ReviewRow label="Work Location" value={data.workLocation} />
                <ReviewRow label="Work Mode" value={data.workMode} />
                <ReviewRow label="Grade" value={data.grade} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Bank Details
                </p>
                <ReviewRow label="Bank Name" value={data.bankName} />
                <ReviewRow
                  label="Account Number"
                  value={data.bankAccountNumber}
                />
                <ReviewRow label="Account Name" value={data.bankAccountName} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Documents
                </p>
                <ReviewRow label="NIN" value={data.ninNumber} />
                <ReviewRow label="TIN" value={data.taxId} />
                <ReviewRow label="Pension ID" value={data.pensionId} />
                <ReviewRow label="NHF" value={data.nhfNumber} />
                <ReviewRow
                  label="Driver's License"
                  value={data.driverLicenseNumber}
                />
                <ReviewRow label="Passport" value={data.passportNumber} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Emergency Contact
                </p>
                <ReviewRow label="Name" value={data.emergencyContactName} />
                <ReviewRow
                  label="Relationship"
                  value={data.emergencyContactRelationship}
                />
                <ReviewRow label="Phone" value={data.emergencyContactPhone} />
                <ReviewRow label="Email" value={data.emergencyContactEmail} />
              </div>
              {!isUK && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Guarantors
                  </p>
                  {data.guarantors.map((g, i) => (
                    <ReviewRow
                      key={i}
                      label={`Guarantor ${i + 1}`}
                      value={[g.name, g.relationship].filter(Boolean).join(" — ")}
                    />
                  ))}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Medical
                </p>
                <ReviewRow label="Allergies" value={data.allergies} />
                <ReviewRow label="Conditions" value={data.conditions} />
                <ReviewRow label="Medications" value={data.medications} />
                <ReviewRow
                  label="Dietary"
                  value={data.dietaryRequirements}
                />
                <ReviewRow
                  label="Accessibility"
                  value={data.accessibilityNeeds}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Assets to Assign
                </p>
                {data.assets.every((a) => !a.tag && !a.name) ? (
                  <p className="text-xs text-muted-foreground">No assets assigned.</p>
                ) : (
                  data.assets.map((asset, i) =>
                    asset.tag || asset.name ? (
                      <div key={i} className={i > 0 ? "mt-3 pt-3 border-t border-border" : undefined}>
                        <ReviewRow label={`Asset ${i + 1} — Tag`} value={asset.tag} />
                        <ReviewRow label="Asset Name" value={asset.name} />
                        <ReviewRow label="Category" value={asset.category} />
                        <ReviewRow label="Serial Number" value={asset.serialNumber} />
                        <ReviewRow label="Assigned Date" value={asset.assignedDate} />
                      </div>
                    ) : null,
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={step === 0 ? () => router.back() : handleBack}
          className="h-9 text-xs gap-1.5"
          disabled={isSubmitting}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {step === 0 ? "Cancel" : "Back"}
        </Button>

        {step < stepKeys.length - 1 ? (
          <Button
            size="sm"
            onClick={handleNext}
            className="h-9 text-xs gap-1.5"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-9 text-xs gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            {isSubmitting ? "Saving…" : "Confirm & Initiate Onboarding"}
          </Button>
        )}
      </div>
    </div>
  );
}
