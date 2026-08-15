"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  ImageUp,
  UserRound,
  Save,
} from "lucide-react";
import { PhotoChangeDialog } from "@/src/components/shared/profile-fields/photo-change-dialog";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
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
import {
  completeSelfOnboarding,
  saveOnboardingDraft,
} from "@/src/lib/stores/onboarding-records-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import {
  onboardingAmended,
  onboardingDocumentsMissing,
  onboardingSubmitted,
} from "@/src/lib/notifications/onboarding";
import {
  titlesForGender,
  isTitleValidForGender,
} from "@/src/lib/constants/titles";
import {
  accountNumberLength,
  formatSortCode,
  isValidSortCode,
} from "@/src/lib/utils/bank-details";
import {
  JOINER_DOCUMENTS,
  type ManualOnboardingData,
  type JoinerDocument,
  type PrivacyConsent,
} from "@/src/lib/types/onboarding";
import { PrivacyGate } from "./privacy-gate";
import {
  DocumentsStep,
  missingRequiredDocuments,
} from "./documents-step";
import {
  TaxStep,
  EMPTY_TAX,
  buildStarterTaxRecord,
  isEmployeeStatementComplete,
  DerivedSummary,
  type TaxFormState,
} from "./tax-step";

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
  { value: "Prefer_not_to_say", label: "Prefer not to say" },
];
const MARITAL_STATUS_OPTIONS = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Divorced", label: "Divorced" },
  { value: "Widowed", label: "Widowed" },
];
// Titles are offered against the selected gender (see `titlesForGender`), so a
// mismatch can't be recorded at the point of hire.
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
  | "financial"
  | "documents"
  | "emergency"
  | "tax"
  | "review";

/**
 * Step names shown under each circle — bare numbers gave no sense of what was
 * still to come (client feedback §2.4).
 */
const STEP_LABELS: Record<StepKey, string> = {
  personal: "Personal Details",
  financial: "Bank & Identity",
  documents: "Documents",
  emergency: "Emergency Contact",
  tax: "Starter Checklist",
  review: "Review & Submit",
};

/** Fields the joiner enters themselves (HR-only fields are excluded). */
type JoinerForm = Pick<
  ManualOnboardingData,
  | "photoUrl"
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
  | "sortCode"
  | "ninNumber"
  | "niNumber"
  | "taxId"
  | "pensionId"
  | "nhfNumber"
  | "passportNumber"
  | "passportExpiry"
  | "passportCountry"
  | "driverLicenseNumber"
  | "driverLicenseExpiry"
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
  photoUrl: "",
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
  sortCode: "",
  ninNumber: "",
  niNumber: "",
  taxId: "",
  pensionId: "",
  nhfNumber: "",
  passportNumber: "",
  passportExpiry: "",
  passportCountry: "",
  driverLicenseNumber: "",
  driverLicenseExpiry: "",
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

/**
 * Bank and identity details (client feedback §2.5). Payroll cannot pay someone
 * without these, and a wrong account number is expensive to unpick later.
 * NOTE: sort code is not validated here — there is no separate sort-code field
 * yet; that arrives with the §2.16 field split in a later phase.
 */
function buildFinancialSchema(isUK: boolean) {
  return z.object({
    bankName: z.string().trim().min(2, "Required"),
    bankAccountNumber: z
      .string()
      .trim()
      .min(isUK ? 8 : 10, `Enter a valid ${isUK ? 8 : 10}-digit account number`)
      .regex(/^\d+$/, "Digits only"),
    bankAccountName: z.string().trim().min(2, "Required"),
    // §2.16 — now a real field, so it can finally be validated.
    sortCode: isUK
      ? z.string().refine(isValidSortCode, "Use the format NN-NN-NN")
      : z.string().optional(),
  });
}

/** Someone has to be reachable if something happens on site (§2.5). */
const emergencySchema = z.object({
  emergencyContactName: z.string().trim().min(2, "Required"),
  emergencyContactRelationship: z.string().trim().min(2, "Required"),
  emergencyContactPhone: z.string().trim().min(7, "At least 7 digits"),
});

/** Per-step schemas. Financial validation is locale-shaped, so it's built. */
function buildStepSchemas(isUK: boolean): Partial<Record<StepKey, z.ZodType>> {
  return {
    personal: personalSchema,
    financial: buildFinancialSchema(isUK),
    emergency: emergencySchema,
  };
}

/** Field keys → the wording the joiner actually sees on the form. */
const FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  phone: "Phone number",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  nationality: "Nationality",
  address: "Address",
  country: "Country",
  bankName: "Bank name",
  bankAccountNumber: "Account number",
  bankAccountName: "Account holder name",
  sortCode: "Sort code",
  emergencyContactName: "Emergency contact name",
  emergencyContactRelationship: "Emergency contact relationship",
  emergencyContactPhone: "Emergency contact phone",
};

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
    ? ["personal", "financial", "documents", "emergency", "tax", "review"]
    : ["personal", "financial", "documents", "emergency", "review"];

  // §2.3 — resume from a saved draft when one exists.
  const [step, setStep] = useState(() => {
    const savedKey = record?.draft?.stepKey as StepKey | undefined;
    const keys: StepKey[] = isUK
      ? ["personal", "financial", "documents", "emergency", "tax", "review"]
      : ["personal", "financial", "documents", "emergency", "review"];
    const idx = savedKey ? keys.indexOf(savedKey) : -1;
    return idx >= 0 ? idx : 0;
  });
  const [form, setForm] = useState<JoinerForm>(() => ({
    ...EMPTY_FORM,
    firstName: seedFirst ?? "",
    lastName: seedRest.join(" "),
    email: meta.email,
    country: isUK ? "United Kingdom" : "Nigeria",
    // A saved draft wins over the seeded values.
    ...(record?.draft?.form ?? {}),
  }));
  const [tax, setTax] = useState<TaxFormState>(EMPTY_TAX);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // §2.7 — declaration captured on the review step.
  const [declarationAgreed, setDeclarationAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  // §2.6 — identity / right-to-work uploads, restored from a saved draft.
  const [documents, setDocuments] = useState<JoinerDocument[]>(
    () => record?.documents ?? [],
  );
  // §2.12 — nothing is collected until the Privacy Notice is accepted.
  const [consent, setConsent] = useState<PrivacyConsent | null>(
    () => record?.privacyConsent ?? null,
  );

  const currentKey = stepKeys[step];
  const stepSchemas = useMemo(() => buildStepSchemas(isUK), [isUK]);

  const declarationDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  /**
   * §2.5 — everything the earlier steps require but that is still blank, named
   * in plain language for the review step.
   */
  const missingFields = useMemo(() => {
    const out: string[] = [];
    for (const [key, schema] of Object.entries(stepSchemas)) {
      const result = schema!.safeParse(form);
      if (result.success) continue;
      for (const issue of result.error.issues) {
        out.push(
          `${STEP_LABELS[key as StepKey]}: ${FIELD_LABELS[issue.path[0] as string] ?? String(issue.path[0])}`,
        );
      }
    }
    for (const label of missingRequiredDocuments(documents)) {
      out.push(`${STEP_LABELS.documents}: ${label}`);
    }
    return out;
  }, [form, stepSchemas, documents]);

  const canSubmit =
    missingFields.length === 0 &&
    declarationAgreed &&
    signature.trim().length > 1;

  const taxMeta = useMemo(
    () => ({
      employeeId: record?.referenceId ?? recordId,
      tenantId,
      employmentStartDate: meta.startDate,
    }),
    [record?.referenceId, recordId, tenantId, meta.startDate],
  );

  const set = (field: keyof JoinerForm, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Changing gender or marital status after picking a title would otherwise
      // leave them contradicting each other — a married "Miss", say. Drop a
      // title the new combination can't support.
      if (
        (field === "gender" || field === "maritalStatus") &&
        !isTitleValidForGender(next.title, next.gender, next.maritalStatus)
      ) {
        next.title = "";
      }
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };
  const patchTax = (patch: Partial<TaxFormState>) =>
    setTax((prev) => ({ ...prev, ...patch }));
  const err = (k: string) => errors[k];

  /**
   * Accessibility props for a validated control (§2.11) — ties the label, the
   * control and its error message together for screen readers.
   */
  const fieldProps = (k: string) => ({
    id: `joiner-${k}`,
    "aria-invalid": Boolean(errors[k]),
    "aria-describedby": errors[k] ? `joiner-${k}-error` : undefined,
  });

  function validateCurrent(): boolean {
    const schema = stepSchemas[currentKey];
    if (schema) {
      const result = schema.safeParse(form);
      if (!result.success) {
        const errs: Record<string, string> = {};
        for (const issue of result.error.issues) {
          errs[issue.path[0] as string] = issue.message;
        }
        setErrors(errs);
        toast.error("Please correct the highlighted fields.");
        return false;
      }
    }
    // §2.6 — required identity evidence must be attached before moving on.
    if (currentKey === "documents") {
      const missing = missingRequiredDocuments(documents);
      if (missing.length > 0) {
        toast.error(`Still needed: ${missing.join(", ")}`);
        return false;
      }
    }
    if (currentKey === "tax") {
      if (!tax.hasP45) {
        toast.error("Please tell us whether you have a P45.");
        return false;
      }
      // §2.18 — an uploaded P45 is sufficient; the manual boxes are a fallback
      // for anyone who can't upload the document.
      if (
        tax.hasP45 === "yes" &&
        !tax.documentRef &&
        (!tax.leavingDate || !tax.taxCodeAtLeaving)
      ) {
        toast.error(
          "Upload your P45, or enter the leaving date and tax code manually.",
        );
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

  /**
   * §2.3 — park a part-finished form. Everything typed so far is stored on the
   * record, so returning to the link picks up on the same step.
   */
  function handleSaveDraft() {
    dispatch(
      saveOnboardingDraft({
        id: recordId,
        stepKey: currentKey,
        form,
        documents,
        privacyConsent: consent ?? undefined,
      }),
    );
    toast.success("Progress saved", {
      description: "Use the same link to pick up where you left off.",
    });
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
        documents,
        privacyConsent: consent ?? undefined,
        declaration: {
          signedName: signature.trim(),
          signedAt: new Date().toISOString(),
        },
      }),
    );
    // §2.10 — the employer is told the pack has arrived, and separately if it
    // arrived incomplete. Before this, HR only found out by opening the page.
    const employeeName =
      `${form.firstName ?? ""} ${form.lastName ?? ""}`.trim() ||
      meta.name ||
      "A new starter";
    const role = meta.jobTitle || "their role";
    // A resubmission after HR asked for changes is a different event to a
    // first submission — the reviewer needs to know it's back in their queue.
    const isAmendment = record?.review?.status === "changes_requested";
    dispatch(
      pushNotification(
        isAmendment
          ? onboardingAmended(employeeName)
          : onboardingSubmitted(employeeName, role),
      ),
    );
    const missing = missingRequiredDocuments(documents);
    if (missing.length > 0) {
      dispatch(
        pushNotification(onboardingDocumentsMissing(employeeName, missing)),
      );
    }

    setSubmitted(true);
    // §2.9 — the joiner sees what happens next, not just "success".
    toast.success("Your onboarding details have been submitted.", {
      description: "HR will review them and confirm your next steps.",
    });
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

        {/* §2.12 — consent gate. Nothing personal is collected until the
            joiner has seen the Privacy Notice and accepted it. */}
        {!consent ? (
          <PrivacyGate
            employeeName={seedFirst ?? ""}
            onAccept={(version) =>
              setConsent({
                acceptedAt: new Date().toISOString(),
                privacyNoticeVersion: version,
              })
            }
          />
        ) : (
          <>

        {/* Stepper — §2.4 names each step, not just a circle. */}
        <nav aria-label="Onboarding progress">
          <ol className="flex items-start w-full list-none">
            {stepKeys.map((key, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <li
                  key={key}
                  className="flex items-start flex-1 last:flex-none"
                  aria-current={current ? "step" : undefined}
                >
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
                        done
                          ? "bg-primary border-primary text-primary-foreground"
                          : current
                            ? "border-primary text-primary bg-background"
                            : "border-border text-muted-foreground bg-background",
                      )}
                    >
                      {done ? (
                        <Check className="w-4 h-4" aria-hidden />
                      ) : (
                        i + 1
                      )}
                      <span className="sr-only">
                        {`Step ${i + 1} of ${stepKeys.length}: ${STEP_LABELS[key]}${
                          done ? " (completed)" : ""
                        }`}
                      </span>
                    </div>
                    {/* Only the current step is named on narrow screens, so
                        five labels don't collide. */}
                    <span
                      className={cn(
                        "max-w-24 text-center text-[11px] leading-tight",
                        current
                          ? "text-foreground font-medium"
                          : "text-muted-foreground",
                        !current && "hidden sm:block",
                      )}
                      aria-hidden
                    >
                      {STEP_LABELS[key]}
                    </span>
                  </div>
                  {i < stepKeys.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2 mt-4.5 transition-colors",
                        done ? "bg-primary" : "bg-border",
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
          {currentKey === "personal" && (
            <>
              <h2 className="text-lg font-semibold text-foreground">
                Personal &amp; contact details
              </h2>
              <Separator />

              {/* Joiners supply their own photo here rather than waiting for HR
                  to chase one after they've started. Optional — nobody should
                  be blocked from onboarding over a picture. */}
              <div className="flex items-center gap-4">
                <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-primary/10 flex items-center justify-center">
                  {form.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.photoUrl}
                      alt="Your profile photo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="size-8 text-primary/60" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">
                    Profile photo{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    A clear head-and-shoulders photo. JPG, PNG or WebP, up to 5&nbsp;MB.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setPhotoDialogOpen(true)}
                    >
                      <ImageUp className="size-4" />
                      {form.photoUrl ? "Change photo" : "Upload photo"}
                    </Button>
                    {form.photoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => set("photoUrl", "")}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Title</Label>
                  <Select value={form.title} onValueChange={(v) => set("title", v)}>
                    <SelectTrigger className="h-10 text-base">
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      {titlesForGender(form.gender, form.maritalStatus).map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="joiner-firstName" className="text-sm">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...fieldProps("firstName")}
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    className="h-10 text-base"
                  />
                  {err("firstName") && (
                    <p id="joiner-firstName-error" role="alert" className="text-xs text-destructive">{err("firstName")}</p>
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
                  <Label htmlFor="joiner-lastName" className="text-sm">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...fieldProps("lastName")}
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className="h-10 text-base"
                  />
                  {err("lastName") && (
                    <p id="joiner-lastName-error" role="alert" className="text-xs text-destructive">{err("lastName")}</p>
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
                  <Label htmlFor="joiner-phone" className="text-sm">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...fieldProps("phone")}
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      set("phone", e.target.value.replace(/[^\d+\s-]/g, ""))
                    }
                    className="h-10 text-base"
                    placeholder="+44 7000 000000"
                  />
                  {err("phone") && (
                    <p id="joiner-phone-error" role="alert" className="text-xs text-destructive">{err("phone")}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="joiner-dateOfBirth" className="text-sm">
                    Date of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...fieldProps("dateOfBirth")}
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => set("dateOfBirth", e.target.value)}
                    className="h-10 text-base"
                  />
                  {err("dateOfBirth") && (
                    <p id="joiner-dateOfBirth-error" role="alert" className="text-xs text-destructive">{err("dateOfBirth")}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="joiner-gender" className="text-sm">
                    Gender <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                    <SelectTrigger
                      {...fieldProps("gender")}
                      className="h-10 text-base"
                    >
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {err("gender") && (
                    <p id="joiner-gender-error" role="alert" className="text-xs text-destructive">{err("gender")}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="joiner-nationality" className="text-sm">
                    Nationality <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...fieldProps("nationality")}
                    value={form.nationality}
                    onChange={(e) => set("nationality", e.target.value)}
                    className="h-10 text-base"
                    placeholder={isUK ? "e.g. British" : "e.g. Nigerian"}
                  />
                  {err("nationality") && (
                    <p id="joiner-nationality-error" role="alert" className="text-xs text-destructive">{err("nationality")}</p>
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
                  <Label htmlFor="joiner-address" className="text-sm">
                    Home Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...fieldProps("address")}
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    className="h-10 text-base"
                  />
                  {err("address") && (
                    <p id="joiner-address-error" role="alert" className="text-xs text-destructive">{err("address")}</p>
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
                  <Label htmlFor="joiner-country" className="text-sm">
                    Country <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...fieldProps("country")}
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    className="h-10 text-base"
                  />
                  {err("country") && (
                    <p id="joiner-country-error" role="alert" className="text-xs text-destructive">{err("country")}</p>
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
                  <Label htmlFor="joiner-bankName" className="text-sm">
                    Bank Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...fieldProps("bankName")}
                    value={form.bankName}
                    onChange={(e) => set("bankName", e.target.value)}
                    className="h-10 text-base"
                  />
                  {err("bankName") && (
                    <p
                      id="joiner-bankName-error"
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {err("bankName")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="joiner-bankAccountNumber" className="text-sm">
                    Account Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...fieldProps("bankAccountNumber")}
                    inputMode="numeric"
                    value={form.bankAccountNumber}
                    onChange={(e) =>
                      set("bankAccountNumber", e.target.value.replace(/\D/g, ""))
                    }
                    className="h-10 text-base"
                    maxLength={accountNumberLength(isUK)}
                    placeholder={`${accountNumberLength(isUK)} digits`}
                  />
                  {err("bankAccountNumber") && (
                    <p
                      id="joiner-bankAccountNumber-error"
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {err("bankAccountNumber")}
                    </p>
                  )}
                </div>
                {/* §2.16 — sort code split out of the account-name field, so
                    payroll gets two clean values instead of one string. */}
                {isUK && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="joiner-sortCode" className="text-sm">
                      Sort Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      {...fieldProps("sortCode")}
                      inputMode="numeric"
                      value={form.sortCode}
                      onChange={(e) =>
                        set("sortCode", formatSortCode(e.target.value))
                      }
                      className="h-10 text-base"
                      placeholder="NN-NN-NN"
                      maxLength={8}
                    />
                    {err("sortCode") && (
                      <p
                        id="joiner-sortCode-error"
                        role="alert"
                        className="text-xs text-destructive"
                      >
                        {err("sortCode")}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="joiner-bankAccountName" className="text-sm">
                    Account Holder Name{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...fieldProps("bankAccountName")}
                    value={form.bankAccountName}
                    onChange={(e) => set("bankAccountName", e.target.value)}
                    className="h-10 text-base"
                    placeholder="Exactly as it appears on the account"
                  />
                  {err("bankAccountName") && (
                    <p
                      id="joiner-bankAccountName-error"
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {err("bankAccountName")}
                    </p>
                  )}
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
                    {/* §2.17 — licence expiry beside the number it belongs to. */}
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Driving Licence Expiry</Label>
                      <Input
                        type="date"
                        value={form.driverLicenseExpiry}
                        onChange={(e) =>
                          set("driverLicenseExpiry", e.target.value)
                        }
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

          {/* §2.6 — identity and right-to-work evidence. */}
          {currentKey === "documents" && (
            <DocumentsStep documents={documents} onChange={setDocuments} />
          )}

          {currentKey === "emergency" && (
            <>
              <h2 className="text-lg font-semibold text-foreground">
                Emergency contact &amp; medical
              </h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="joiner-emergencyContactName" className="text-sm">
                    Emergency Contact Name{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...fieldProps("emergencyContactName")}
                    value={form.emergencyContactName}
                    onChange={(e) => set("emergencyContactName", e.target.value)}
                    className="h-10 text-base"
                  />
                  {err("emergencyContactName") && (
                    <p
                      id="joiner-emergencyContactName-error"
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {err("emergencyContactName")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="joiner-emergencyContactRelationship"
                    className="text-sm"
                  >
                    Relationship <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...fieldProps("emergencyContactRelationship")}
                    value={form.emergencyContactRelationship}
                    onChange={(e) =>
                      set("emergencyContactRelationship", e.target.value)
                    }
                    className="h-10 text-base"
                    placeholder="e.g. Spouse, Parent"
                  />
                  {err("emergencyContactRelationship") && (
                    <p
                      id="joiner-emergencyContactRelationship-error"
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {err("emergencyContactRelationship")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="joiner-emergencyContactPhone" className="text-sm">
                    Contact Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...fieldProps("emergencyContactPhone")}
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
                  {err("emergencyContactPhone") && (
                    <p
                      id="joiner-emergencyContactPhone-error"
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {err("emergencyContactPhone")}
                    </p>
                  )}
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
              {/* Show the photo back before submitting — it's the one answer
                  they can't verify from a text row. */}
              {form.photoUrl && (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.photoUrl}
                    alt="Your profile photo"
                    className="size-16 rounded-2xl object-cover"
                  />
                  <p className="text-xs text-muted-foreground">
                    This is the photo that will appear on your profile.
                  </p>
                </div>
              )}
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
                  {/* §2.6 — confirm what was actually attached. */}
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 mt-4">
                    Documents
                  </p>
                  {documents.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">
                      None uploaded
                    </p>
                  ) : (
                    documents.map((d) => (
                      <ReviewRow
                        key={d.kind}
                        label={
                          JOINER_DOCUMENTS.find((s) => s.kind === d.kind)
                            ?.label ?? d.kind
                        }
                        value={d.file.name}
                      />
                    ))
                  )}
                </div>
              </div>
              {derivedPreview && (
                <div className="mt-2">
                  <DerivedSummary record={derivedPreview} />
                </div>
              )}

              {/* §2.5 — surface anything still missing before they hit submit,
                  rather than bouncing them back a step at a time. */}
              {missingFields.length > 0 && (
                <div
                  role="alert"
                  className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3"
                >
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Still needed before you can submit
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {missingFields.map((m) => (
                      <li
                        key={m}
                        className="text-xs text-amber-700 dark:text-amber-400"
                      >
                        · {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* §2.7 — a recorded declaration, signed and dated. */}
              <div className="rounded-lg border border-border bg-muted/20 p-4 flex flex-col gap-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={declarationAgreed}
                    onCheckedChange={(v) => setDeclarationAgreed(v === true)}
                    className="mt-0.5"
                    aria-describedby="declaration-text"
                  />
                  <span
                    id="declaration-text"
                    className="text-xs text-foreground"
                  >
                    I confirm that the information provided is true and complete.
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="declaration-signature" className="text-xs">
                      Employee signature
                    </Label>
                    <Input
                      id="declaration-signature"
                      placeholder="Type your full name"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="declaration-date" className="text-xs">
                      Date
                    </Label>
                    <Input
                      id="declaration-date"
                      value={declarationDate}
                      readOnly
                      className="bg-muted/50"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={step === 0}
            className="h-9 text-xs gap-1.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </Button>
          <div className="flex items-center gap-2">
            {/* §2.3 — leave and come back without losing what's been typed. */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveDraft}
              className="h-9 text-xs gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save &amp; finish later
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
                disabled={!canSubmit}
                title={
                  canSubmit
                    ? undefined
                    : "Complete the required fields and sign the declaration first."
                }
                className="h-9 text-xs gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Submit my details
              </Button>
            )}
          </div>
        </div>
          </>
        )}
      </div>

      {/* Reuses the profile-photo dialog so onboarding enforces exactly the
          same crop, format and size rules as a later photo change. "edit" mode
          because the joiner is filling in their own record, not requesting a
          change to one — so no reason is asked for. */}
      <PhotoChangeDialog
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
        mode="edit"
        onSubmit={(dataUrl) => {
          set("photoUrl", dataUrl);
          setPhotoDialogOpen(false);
          toast.success("Profile photo added");
        }}
      />
    </div>
  );
}
