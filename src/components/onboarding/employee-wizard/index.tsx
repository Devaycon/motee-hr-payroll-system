"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { Check, ChevronLeft, ChevronRight, PartyPopper } from "lucide-react";
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
import ThemeToggle from "@/src/components/themes/theme-toggle";
import { LogoPatternBackground } from "@/src/components/shared/logo-pattern-background";
import { cn } from "@/src/lib/utils";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { completeSelfOnboarding } from "@/src/lib/stores/onboarding-records-slice";
import type { ManualOnboardingData } from "@/src/lib/types/onboarding";
import {
  TaxStep,
  EMPTY_TAX,
  buildStarterTaxRecord,
  isEmployeeStatementComplete,
  DerivedSummary,
  type TaxFormState,
} from "./tax-step";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];
const MARITAL_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];
const TITLE_OPTIONS = ["Dr", "Mr", "Mrs", "Miss", "Ms"];
const ETHNICITY_OPTIONS = [
  "Asian / Asian British",
  "Black / African / Caribbean / Black British",
  "Mixed / Multiple ethnic groups",
  "White",
  "Other ethnic group",
  "Prefer not to say",
];

type StepKey = "personal" | "financial" | "emergency" | "tax" | "review";

/** Fields the joiner enters themselves (HR-only fields are excluded). */
type JoinerForm = Pick<
  ManualOnboardingData,
  | "title"
  | "firstName"
  | "middleName"
  | "lastName"
  | "preferredName"
  | "maidenName"
  | "initials"
  | "email"
  | "phone"
  | "dateOfBirth"
  | "gender"
  | "nationality"
  | "ethnicity"
  | "maritalStatus"
  | "address"
  | "state"
  | "country"
  | "bankName"
  | "bankAccountNumber"
  | "bankAccountName"
  | "ninNumber"
  | "niNumber"
  | "taxId"
  | "pensionId"
  | "nhfNumber"
  | "passportNumber"
  | "passportExpiry"
  | "passportCountry"
  | "driverLicenseNumber"
  | "emergencyContactName"
  | "emergencyContactRelationship"
  | "emergencyContactPhone"
  | "emergencyContactEmail"
  | "allergies"
  | "conditions"
  | "medications"
  | "dietaryRequirements"
  | "accessibilityNeeds"
>;

const EMPTY_FORM: JoinerForm = {
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
  country: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
  ninNumber: "",
  niNumber: "",
  taxId: "",
  pensionId: "",
  nhfNumber: "",
  passportNumber: "",
  passportExpiry: "",
  passportCountry: "",
  driverLicenseNumber: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
  emergencyContactEmail: "",
  allergies: "",
  conditions: "",
  medications: "",
  dietaryRequirements: "",
  accessibilityNeeds: "",
};

const personalSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z.string().min(7, "At least 7 digits"),
  dateOfBirth: z.string().min(1, "Required"),
  gender: z.string().min(1, "Required"),
  nationality: z.string().min(1, "Required"),
  address: z.string().min(5, "At least 5 characters"),
  country: z.string().min(1, "Required"),
});

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground shrink-0 w-48">{label}</span>
      <span className="text-sm text-foreground text-right">{value}</span>
    </div>
  );
}

export interface JoinerPrefill {
  name?: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  startDate?: string;
}

export function EmployeeOnboardingWizard({
  recordId,
  prefill,
}: {
  recordId: string;
  prefill?: JoinerPrefill;
}) {
  const dispatch = useAppDispatch();
  // Ensure the active locale bundle is loaded (sets tenant + country context).
  useLocaleSection((b) => b.tenant);
  const country = useAppSelector((s) => s.locale.country);
  const tenantId = useAppSelector(
    (s) => s.locale.data?.tenant.id ?? "tenant_uk_001",
  );
  const record = useAppSelector((s) =>
    s.onboardingRecords.records.find((r) => r.id === recordId),
  );

  // Prefill identity/role from the record (preferred) or query params (fallback
  // for a hard reload that reset the store).
  const seededName = record?.employeeName ?? prefill?.name ?? "";
  const [seedFirst, ...seedRest] = seededName.split(" ");
  const meta = {
    name: seededName,
    email: record?.email ?? prefill?.email ?? "",
    jobTitle: record?.jobTitle ?? prefill?.jobTitle ?? "",
    department: record?.department ?? prefill?.department ?? "",
    startDate: record?.startDate ?? prefill?.startDate ?? "",
  };

  const isUK = country === "uk";
  const stepKeys: StepKey[] = isUK
    ? ["personal", "financial", "emergency", "tax", "review"]
    : ["personal", "financial", "emergency", "review"];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<JoinerForm>(() => ({
    ...EMPTY_FORM,
    firstName: seedFirst ?? "",
    lastName: seedRest.join(" "),
    email: meta.email,
    country: isUK ? "United Kingdom" : "Nigeria",
  }));
  const [tax, setTax] = useState<TaxFormState>(EMPTY_TAX);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const currentKey = stepKeys[step];

  const taxMeta = useMemo(
    () => ({
      employeeId: record?.referenceId ?? recordId,
      tenantId,
      employmentStartDate: meta.startDate,
    }),
    [record?.referenceId, recordId, tenantId, meta.startDate],
  );

  const set = (field: keyof JoinerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };
  const patchTax = (patch: Partial<TaxFormState>) =>
    setTax((prev) => ({ ...prev, ...patch }));
  const err = (k: string) => errors[k];

  function validateCurrent(): boolean {
    if (currentKey === "personal") {
      const result = personalSchema.safeParse(form);
      if (!result.success) {
        const errs: Record<string, string> = {};
        for (const issue of result.error.issues) {
          errs[issue.path[0] as string] = issue.message;
        }
        setErrors(errs);
        return false;
      }
    }
    if (currentKey === "tax") {
      if (!tax.hasP45) {
        toast.error("Please tell us whether you have a P45.");
        return false;
      }
      if (tax.hasP45 === "yes" && (!tax.leavingDate || !tax.taxCodeAtLeaving)) {
        toast.error("Enter your P45 leaving date and tax code.");
        return false;
      }
      if (tax.hasP45 === "no" && !isEmployeeStatementComplete(tax)) {
        toast.error("Please answer the employee statement questions.");
        return false;
      }
    }
    return true;
  }

  function handleNext() {
    if (!validateCurrent()) return;
    setErrors({});
    setStep((s) => Math.min(stepKeys.length - 1, s + 1));
  }
  function handleBack() {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  }

  function handleSubmit() {
    if (!validateCurrent()) return;
    const starterTax = isUK
      ? buildStarterTaxRecord(tax, taxMeta) ?? undefined
      : undefined;
    dispatch(
      completeSelfOnboarding({
        id: recordId,
        joinerData: form,
        starterTax,
      }),
    );
    setSubmitted(true);
    toast.success("Your onboarding details have been submitted.");
  }

  const derivedPreview = isUK ? buildStarterTaxRecord(tax, taxMeta) : null;

  if (submitted) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <LogoPatternBackground />
        <div className="absolute right-5 top-5 z-20">
          <ThemeToggle />
        </div>
        <div className="relative z-20 max-w-lg w-full rounded-2xl border border-border bg-card p-8 text-center flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
            <PartyPopper className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">All done!</h1>
          <p className="text-sm text-muted-foreground">
            Thanks {form.firstName || "there"} — your details have been submitted
            to the HR team. They&apos;ll be in touch with your next steps before
            your start date.
          </p>
          {derivedPreview && (
            <div className="w-full text-left">
              <DerivedSummary record={derivedPreview} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <LogoPatternBackground />
      <div className="absolute right-5 top-5 z-20">
        <ThemeToggle />
      </div>
      <div className="relative z-20 max-w-5xl mx-auto px-5 py-10 flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium text-primary uppercase tracking-wide">
            Welcome aboard{meta.jobTitle ? ` · ${meta.jobTitle}` : ""}
          </p>
          <h1 className="text-3xl font-bold text-foreground mt-1">
            Complete your onboarding
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hi {seedFirst || "there"}, please fill in your details below. This
            only takes a few minutes.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center w-full">
          {stepKeys.map((key, i) => (
            <div key={key} className="flex items-center flex-1 last:flex-none">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors shrink-0",
                  i < step
                    ? "bg-primary border-primary text-primary-foreground"
                    : i === step
                      ? "border-primary text-primary bg-background"
                      : "border-border text-muted-foreground bg-background",
                )}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < stepKeys.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
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
              <h2 className="text-lg font-semibold text-foreground">
                Personal &amp; contact details
              </h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Title</Label>
                  <Select value={form.title} onValueChange={(v) => set("title", v)}>
                    <SelectTrigger className="h-10 text-base">
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      {TITLE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    className="h-10 text-base"
                  />
                  {err("firstName") && (
                    <p className="text-xs text-destructive">{err("firstName")}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Middle Name</Label>
                  <Input
                    value={form.middleName}
                    onChange={(e) => set("middleName", e.target.value)}
                    className="h-10 text-base"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className="h-10 text-base"
                  />
                  {err("lastName") && (
                    <p className="text-xs text-destructive">{err("lastName")}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Preferred Name</Label>
                  <Input
                    value={form.preferredName}
                    onChange={(e) => set("preferredName", e.target.value)}
                    className="h-10 text-base"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Maiden Name</Label>
                  <Input
                    value={form.maidenName}
                    onChange={(e) => set("maidenName", e.target.value)}
                    className="h-10 text-base"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Initials</Label>
                  <Input
                    value={form.initials}
                    onChange={(e) =>
                      set("initials", e.target.value.toUpperCase())
                    }
                    maxLength={5}
                    className="h-10 text-base"
                    placeholder="e.g. JMD"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Email Address</Label>
                  <Input
                    type="email"
                    value={form.email}
                    readOnly
                    className="h-10 text-base bg-muted/50 text-muted-foreground"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      set("phone", e.target.value.replace(/[^\d+\s-]/g, ""))
                    }
                    className="h-10 text-base"
                    placeholder="+44 7000 000000"
                  />
                  {err("phone") && (
                    <p className="text-xs text-destructive">{err("phone")}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">
                    Date of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => set("dateOfBirth", e.target.value)}
                    className="h-10 text-base"
                  />
                  {err("dateOfBirth") && (
                    <p className="text-xs text-destructive">{err("dateOfBirth")}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">
                    Gender <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                    <SelectTrigger className="h-10 text-base">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {err("gender") && (
                    <p className="text-xs text-destructive">{err("gender")}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">
                    Nationality <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.nationality}
                    onChange={(e) => set("nationality", e.target.value)}
                    className="h-10 text-base"
                    placeholder={isUK ? "e.g. British" : "e.g. Nigerian"}
                  />
                  {err("nationality") && (
                    <p className="text-xs text-destructive">{err("nationality")}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Marital Status</Label>
                  <Select
                    value={form.maritalStatus}
                    onValueChange={(v) => set("maritalStatus", v)}
                  >
                    <SelectTrigger className="h-10 text-base">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARITAL_STATUS_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Ethnicity</Label>
                  <Select
                    value={form.ethnicity}
                    onValueChange={(v) => set("ethnicity", v)}
                  >
                    <SelectTrigger className="h-10 text-base">
                      <SelectValue placeholder="Select ethnicity" />
                    </SelectTrigger>
                    <SelectContent>
                      {ETHNICITY_OPTIONS.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-sm">
                    Home Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    className="h-10 text-base"
                  />
                  {err("address") && (
                    <p className="text-xs text-destructive">{err("address")}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">State / County</Label>
                  <Input
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    className="h-10 text-base"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">
                    Country <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    className="h-10 text-base"
                  />
                  {err("country") && (
                    <p className="text-xs text-destructive">{err("country")}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {currentKey === "financial" && (
            <>
              <h2 className="text-lg font-semibold text-foreground">
                Bank &amp; identity details
              </h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-sm">Bank Name</Label>
                  <Input
                    value={form.bankName}
                    onChange={(e) => set("bankName", e.target.value)}
                    className="h-10 text-base"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Account Number</Label>
                  <Input
                    inputMode="numeric"
                    value={form.bankAccountNumber}
                    onChange={(e) =>
                      set("bankAccountNumber", e.target.value.replace(/\D/g, ""))
                    }
                    className="h-10 text-base"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">
                    {isUK ? "Sort Code / Account Name" : "Account Name"}
                  </Label>
                  <Input
                    value={form.bankAccountName}
                    onChange={(e) => set("bankAccountName", e.target.value)}
                    className="h-10 text-base"
                  />
                </div>

                {isUK ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">National Insurance Number</Label>
                      <Input
                        value={form.niNumber}
                        onChange={(e) => set("niNumber", e.target.value.toUpperCase())}
                        className="h-10 text-base"
                        placeholder="e.g. QQ123456C"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Passport Number</Label>
                      <Input
                        value={form.passportNumber}
                        onChange={(e) => set("passportNumber", e.target.value)}
                        className="h-10 text-base"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Driving Licence Number</Label>
                      <Input
                        value={form.driverLicenseNumber}
                        onChange={(e) => set("driverLicenseNumber", e.target.value)}
                        className="h-10 text-base"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Passport Expiry Date</Label>
                      <Input
                        type="date"
                        value={form.passportExpiry}
                        onChange={(e) => set("passportExpiry", e.target.value)}
                        className="h-10 text-base"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Passport Issuing Country</Label>
                      <Input
                        value={form.passportCountry}
                        onChange={(e) => set("passportCountry", e.target.value)}
                        className="h-10 text-base"
                        placeholder="e.g. United Kingdom"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">NIN</Label>
                      <Input
                        inputMode="numeric"
                        value={form.ninNumber}
                        onChange={(e) =>
                          set("ninNumber", e.target.value.replace(/\D/g, ""))
                        }
                        className="h-10 text-base"
                        maxLength={11}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">TIN</Label>
                      <Input
                        inputMode="numeric"
                        value={form.taxId}
                        onChange={(e) =>
                          set("taxId", e.target.value.replace(/\D/g, ""))
                        }
                        className="h-10 text-base"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Pension ID (PFA)</Label>
                      <Input
                        value={form.pensionId}
                        onChange={(e) => set("pensionId", e.target.value)}
                        className="h-10 text-base"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">NHF Number</Label>
                      <Input
                        value={form.nhfNumber}
                        onChange={(e) => set("nhfNumber", e.target.value)}
                        className="h-10 text-base"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Driver&apos;s License Number</Label>
                      <Input
                        value={form.driverLicenseNumber}
                        onChange={(e) => set("driverLicenseNumber", e.target.value)}
                        className="h-10 text-base"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Passport Number</Label>
                      <Input
                        value={form.passportNumber}
                        onChange={(e) => set("passportNumber", e.target.value)}
                        className="h-10 text-base"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Passport Expiry Date</Label>
                      <Input
                        type="date"
                        value={form.passportExpiry}
                        onChange={(e) => set("passportExpiry", e.target.value)}
                        className="h-10 text-base"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Passport Issuing Country</Label>
                      <Input
                        value={form.passportCountry}
                        onChange={(e) => set("passportCountry", e.target.value)}
                        className="h-10 text-base"
                        placeholder="e.g. Nigeria"
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {currentKey === "emergency" && (
            <>
              <h2 className="text-lg font-semibold text-foreground">
                Emergency contact &amp; medical
              </h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Emergency Contact Name</Label>
                  <Input
                    value={form.emergencyContactName}
                    onChange={(e) => set("emergencyContactName", e.target.value)}
                    className="h-10 text-base"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Relationship</Label>
                  <Input
                    value={form.emergencyContactRelationship}
                    onChange={(e) =>
                      set("emergencyContactRelationship", e.target.value)
                    }
                    className="h-10 text-base"
                    placeholder="e.g. Spouse, Parent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Contact Phone</Label>
                  <Input
                    type="tel"
                    value={form.emergencyContactPhone}
                    onChange={(e) =>
                      set(
                        "emergencyContactPhone",
                        e.target.value.replace(/[^\d+\s-]/g, ""),
                      )
                    }
                    className="h-10 text-base"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Contact Email</Label>
                  <Input
                    type="email"
                    value={form.emergencyContactEmail}
                    onChange={(e) => set("emergencyContactEmail", e.target.value)}
                    className="h-10 text-base"
                  />
                </div>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground -mb-2">
                Medical facts (optional — shared only with HR for your wellbeing).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Allergies</Label>
                  <Input
                    value={form.allergies}
                    onChange={(e) => set("allergies", e.target.value)}
                    className="h-10 text-base"
                    placeholder="Comma-separated"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Medical Conditions</Label>
                  <Input
                    value={form.conditions}
                    onChange={(e) => set("conditions", e.target.value)}
                    className="h-10 text-base"
                    placeholder="Comma-separated"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Medications</Label>
                  <Input
                    value={form.medications}
                    onChange={(e) => set("medications", e.target.value)}
                    className="h-10 text-base"
                    placeholder="Comma-separated"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Dietary Requirements</Label>
                  <Input
                    value={form.dietaryRequirements}
                    onChange={(e) => set("dietaryRequirements", e.target.value)}
                    className="h-10 text-base"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Accessibility Needs</Label>
                  <Input
                    value={form.accessibilityNeeds}
                    onChange={(e) => set("accessibilityNeeds", e.target.value)}
                    className="h-10 text-base"
                  />
                </div>
              </div>
            </>
          )}

          {currentKey === "tax" && (
            <TaxStep
              value={tax}
              onChange={patchTax}
              meta={taxMeta}
              recap={{
                fullName: [form.title, form.firstName, form.lastName]
                  .filter(Boolean)
                  .join(" "),
                dateOfBirth: form.dateOfBirth,
                niNumber: form.niNumber,
                email: form.email,
                employmentStartDate: meta.startDate,
              }}
            />
          )}

          {currentKey === "review" && (
            <>
              <h2 className="text-lg font-semibold text-foreground">
                Review &amp; submit
              </h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Personal
                  </p>
                  <ReviewRow
                    label="Full Name"
                    value={[form.title, form.firstName, form.middleName, form.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <ReviewRow label="Email" value={form.email} />
                  <ReviewRow label="Phone" value={form.phone} />
                  <ReviewRow label="Date of Birth" value={form.dateOfBirth} />
                  <ReviewRow label="Gender" value={form.gender} />
                  <ReviewRow label="Nationality" value={form.nationality} />
                  <ReviewRow label="Address" value={form.address} />
                  <ReviewRow label="Country" value={form.country} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Bank &amp; Identity
                  </p>
                  <ReviewRow label="Bank Name" value={form.bankName} />
                  <ReviewRow label="Account Number" value={form.bankAccountNumber} />
                  {isUK ? (
                    <>
                      <ReviewRow label="NI Number" value={form.niNumber} />
                      <ReviewRow label="Passport" value={form.passportNumber} />
                      <ReviewRow label="Driving Licence" value={form.driverLicenseNumber} />
                    </>
                  ) : (
                    <>
                      <ReviewRow label="NIN" value={form.ninNumber} />
                      <ReviewRow label="TIN" value={form.taxId} />
                      <ReviewRow label="Pension ID" value={form.pensionId} />
                    </>
                  )}
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 mt-4">
                    Emergency
                  </p>
                  <ReviewRow label="Contact" value={form.emergencyContactName} />
                  <ReviewRow label="Phone" value={form.emergencyContactPhone} />
                </div>
              </div>
              {derivedPreview && (
                <div className="mt-2">
                  <DerivedSummary record={derivedPreview} />
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={step === 0}
            className="h-9 text-xs gap-1.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </Button>
          {step < stepKeys.length - 1 ? (
            <Button size="sm" onClick={handleNext} className="h-9 text-xs gap-1.5">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} className="h-9 text-xs gap-1.5">
              <Check className="w-3.5 h-3.5" /> Submit my details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
