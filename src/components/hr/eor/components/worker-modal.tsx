"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { systemData, COUNTRY_NAMES } from "@/src/config/system-data";
import { getInitials } from "@/src/lib/types/dashboard";
import type {
  EorWorker,
  EorProvider,
  EorComplianceItem,
  EorComplianceKey,
  EorComplianceStatus,
} from "../types";
import {
  EOR_WORKER_STATUS_OPTIONS,
  EOR_CURRENCIES,
  currencySymbolFor,
  TITLE_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
  NATIONALITY_OPTIONS,
  PAY_FREQUENCY_OPTIONS,
  EOR_COMPLIANCE_FIELDS,
  EOR_COMPLIANCE_STATUS_OPTIONS,
} from "../data";

const schema = z.object({
  title: z.string().min(1, "Select a title"),
  legalFirstName: z.string().min(1, "Required"),
  legalLastName: z.string().min(1, "Required"),
  middleName: z.string().optional(),
  preferredName: z.string().optional(),
  maidenName: z.string().optional(),
  dateOfBirth: z.string().min(1, "Required"),
  gender: z.string().min(1, "Select a gender"),
  maritalStatus: z.string().min(1, "Select a status"),
  nationality: z.string().min(1, "Select a nationality"),
  email: z.string().email("Enter a valid email"),
  personalEmail: z.string().email("Enter a valid email").or(z.literal("")),
  phone: z.string().min(4, "Required"),
  role: z.string().min(2, "Required"),
  department: z.string().min(2, "Required"),
  country: z.string().min(1, "Select a country"),
  providerId: z.string().min(1, "Select a provider"),
  status: z.string().min(1, "Select a status"),
  startDate: z.string().min(1, "Required"),
  endDate: z.string().optional(),
  currency: z.string().min(1, "Select a currency"),
  payFrequency: z.string().min(1, "Select pay frequency"),
  grossSalaryMonthly: z.coerce.number().min(1, "Required"),
  employerCost: z.coerce.number().min(0, "Required"),
  managementFee: z.coerce.number().min(0, "Required"),
  monthlyCostUsd: z.coerce.number().min(0, "Required"),
});

type FormState = {
  title: string;
  legalFirstName: string;
  legalLastName: string;
  middleName: string;
  preferredName: string;
  maidenName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  email: string;
  personalEmail: string;
  phone: string;
  role: string;
  department: string;
  country: string;
  providerId: string;
  status: string;
  startDate: string;
  endDate: string;
  currency: string;
  payFrequency: string;
  grossSalaryMonthly: string;
  employerCost: string;
  managementFee: string;
  monthlyCostUsd: string;
};

const EMPTY: FormState = {
  title: "",
  legalFirstName: "",
  legalLastName: "",
  middleName: "",
  preferredName: "",
  maidenName: "",
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  nationality: "",
  email: "",
  personalEmail: "",
  phone: "",
  role: "",
  department: "",
  country: "",
  providerId: "",
  status: "onboarding",
  startDate: "",
  endDate: "",
  currency: "USD",
  payFrequency: "monthly",
  grossSalaryMonthly: "",
  employerCost: "",
  managementFee: "",
  monthlyCostUsd: "",
};

type ComplianceState = Record<EorComplianceKey, EorComplianceStatus>;

const EMPTY_COMPLIANCE: ComplianceState = {
  contract: "complete",
  work_permit: "pending",
  tax_registration: "pending",
  statutory_benefits: "pending",
  local_id: "pending",
};

interface WorkerModalProps {
  open: boolean;
  onClose: () => void;
  editingWorker: EorWorker | null;
  providers: EorProvider[];
  onSave: (worker: EorWorker) => void;
}

export function WorkerModal({
  open,
  onClose,
  editingWorker,
  providers,
  onSave,
}: WorkerModalProps) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [compliance, setCompliance] = useState<ComplianceState>(EMPTY_COMPLIANCE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      if (editingWorker) {
        const w = editingWorker;
        setForm({
          title: w.title,
          legalFirstName: w.legalFirstName,
          legalLastName: w.legalLastName,
          middleName: w.middleName ?? "",
          preferredName: w.preferredName ?? "",
          maidenName: w.maidenName ?? "",
          dateOfBirth: w.dateOfBirth,
          gender: w.gender,
          maritalStatus: w.maritalStatus,
          nationality: w.nationality,
          email: w.email,
          personalEmail: w.personalEmail ?? "",
          phone: w.phone,
          role: w.role,
          department: w.department,
          country: w.country,
          providerId: w.providerId,
          status: w.status,
          startDate: w.startDate,
          endDate: w.endDate ?? "",
          currency: w.currency,
          payFrequency: w.payFrequency,
          grossSalaryMonthly: String(w.grossSalaryMonthly),
          employerCost: String(w.employerCost),
          managementFee: String(w.managementFee),
          monthlyCostUsd: String(w.monthlyCostUsd),
        });
        setCompliance({
          ...EMPTY_COMPLIANCE,
          ...Object.fromEntries(w.compliance.map((c) => [c.key, c.status])),
        });
      } else {
        setForm(EMPTY);
        setCompliance({ ...EMPTY_COMPLIANCE });
      }
      setErrors({});
    }
  }

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  const nationalityOptions = Array.from(
    new Set([form.nationality, ...NATIONALITY_OPTIONS].filter(Boolean)),
  );

  function handleSave() {
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormState;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    const v = result.data;
    const provider = providers.find((p) => p.id === v.providerId);
    const countryCode =
      systemData.countries.find((c) => c.name === v.country)?.code ?? "—";
    const displayName =
      v.preferredName?.trim() || `${v.legalFirstName} ${v.legalLastName}`.trim();
    const complianceItems: EorComplianceItem[] = EOR_COMPLIANCE_FIELDS.map((f) => ({
      key: f.key,
      label: f.label,
      status: compliance[f.key],
    }));

    const worker: EorWorker = {
      id: editingWorker?.id ?? `eorw-${Date.now()}`,
      name: displayName,
      initials: getInitials(displayName),
      title: v.title,
      legalFirstName: v.legalFirstName.trim(),
      legalLastName: v.legalLastName.trim(),
      middleName: v.middleName?.trim() || undefined,
      preferredName: v.preferredName?.trim() || undefined,
      maidenName: v.maidenName?.trim() || undefined,
      dateOfBirth: v.dateOfBirth,
      gender: v.gender,
      maritalStatus: v.maritalStatus,
      nationality: v.nationality,
      email: v.email.trim(),
      personalEmail: v.personalEmail?.trim() || undefined,
      phone: v.phone.trim(),
      role: v.role.trim(),
      department: v.department.trim(),
      country: v.country,
      countryCode,
      providerId: v.providerId,
      providerName: provider?.name ?? "—",
      status: v.status as EorWorker["status"],
      startDate: v.startDate,
      endDate: v.endDate?.trim() || undefined,
      currency: v.currency,
      currencySymbol: currencySymbolFor(v.currency),
      grossSalaryMonthly: v.grossSalaryMonthly,
      employerCost: v.employerCost,
      managementFee: v.managementFee,
      monthlyCostUsd: v.monthlyCostUsd,
      payFrequency: v.payFrequency as EorWorker["payFrequency"],
      compliance: complianceItems,
    };

    onSave(worker);
    toast.success(
      editingWorker ? "Worker updated." : `${worker.name} added to the EOR register.`,
    );
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            {editingWorker ? "Edit EOR Worker" : "Add EOR Worker"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[68vh] pr-3">
          <div className="space-y-6 py-1">
            <FormSection title="Personal">
              <Grid>
                <Field label="Title" error={errors.title}>
                  <PlainSelect
                    value={form.title}
                    onChange={(v) => set("title", v)}
                    placeholder="Select"
                    options={TITLE_OPTIONS}
                  />
                </Field>
                <Field label="Legal First Name" error={errors.legalFirstName}>
                  <Input value={form.legalFirstName} onChange={(e) => set("legalFirstName", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="Middle Name(s)" error={errors.middleName}>
                  <Input value={form.middleName} onChange={(e) => set("middleName", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="Legal Last Name" error={errors.legalLastName}>
                  <Input value={form.legalLastName} onChange={(e) => set("legalLastName", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="Preferred Name" error={errors.preferredName}>
                  <Input value={form.preferredName} onChange={(e) => set("preferredName", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="Maiden Name" error={errors.maidenName}>
                  <Input value={form.maidenName} onChange={(e) => set("maidenName", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="Date of birth" error={errors.dateOfBirth}>
                  <Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="Gender" error={errors.gender}>
                  <PlainSelect value={form.gender} onChange={(v) => set("gender", v)} placeholder="Select" options={GENDER_OPTIONS} />
                </Field>
                <Field label="Marital status" error={errors.maritalStatus}>
                  <PlainSelect value={form.maritalStatus} onChange={(v) => set("maritalStatus", v)} placeholder="Select" options={MARITAL_OPTIONS} />
                </Field>
                <Field label="Nationality" error={errors.nationality}>
                  <PlainSelect value={form.nationality} onChange={(v) => set("nationality", v)} placeholder="Select" options={nationalityOptions} />
                </Field>
              </Grid>
            </FormSection>

            <FormSection title="Contact">
              <Grid>
                <Field label="Work email" error={errors.email}>
                  <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="Personal email" error={errors.personalEmail}>
                  <Input type="email" value={form.personalEmail} onChange={(e) => set("personalEmail", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="Phone" error={errors.phone}>
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-9 text-sm" />
                </Field>
              </Grid>
            </FormSection>

            <FormSection title="Engagement">
              <Grid>
                <Field label="Role" error={errors.role}>
                  <Input value={form.role} onChange={(e) => set("role", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="Department" error={errors.department}>
                  <Input value={form.department} onChange={(e) => set("department", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="Country" error={errors.country}>
                  <PlainSelect value={form.country} onChange={(v) => set("country", v)} placeholder="Select country" options={COUNTRY_NAMES} />
                </Field>
                <Field label="Provider" error={errors.providerId}>
                  <Select value={form.providerId} onValueChange={(v) => set("providerId", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select provider" /></SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-sm">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status" error={errors.status}>
                  <Select value={form.status} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EOR_WORKER_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-sm">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Pay frequency" error={errors.payFrequency}>
                  <Select value={form.payFrequency} onValueChange={(v) => set("payFrequency", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAY_FREQUENCY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-sm">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Start date" error={errors.startDate}>
                  <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="End date (optional)" error={errors.endDate}>
                  <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className="h-9 text-sm" />
                </Field>
              </Grid>
            </FormSection>

            <FormSection title="Compensation">
              <Grid>
                <Field label="Pay currency" error={errors.currency}>
                  <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EOR_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code} className="text-sm">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Gross / month (local)" error={errors.grossSalaryMonthly}>
                  <Input type="number" min={0} value={form.grossSalaryMonthly} onChange={(e) => set("grossSalaryMonthly", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="Employer cost (local)" error={errors.employerCost}>
                  <Input type="number" min={0} value={form.employerCost} onChange={(e) => set("employerCost", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="Management fee (local)" error={errors.managementFee}>
                  <Input type="number" min={0} value={form.managementFee} onChange={(e) => set("managementFee", e.target.value)} className="h-9 text-sm" />
                </Field>
                <Field label="Monthly cost (USD)" error={errors.monthlyCostUsd}>
                  <Input type="number" min={0} value={form.monthlyCostUsd} onChange={(e) => set("monthlyCostUsd", e.target.value)} className="h-9 text-sm" />
                </Field>
              </Grid>
            </FormSection>

            <FormSection title="Compliance">
              <Grid>
                {EOR_COMPLIANCE_FIELDS.map((f) => (
                  <Field key={f.key} label={f.label}>
                    <Select
                      value={compliance[f.key]}
                      onValueChange={(v) =>
                        setCompliance((c) => ({ ...c, [f.key]: v as EorComplianceStatus }))
                      }
                    >
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EOR_COMPLIANCE_STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-sm">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                ))}
              </Grid>
            </FormSection>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>
            {editingWorker ? "Save Changes" : "Add Worker"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

function PlainSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="text-sm">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
