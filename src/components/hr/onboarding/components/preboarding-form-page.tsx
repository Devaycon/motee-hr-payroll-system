"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Plus, Trash2, Check } from "lucide-react";
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
import { Card, CardContent } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { addRecord } from "@/src/lib/stores/onboarding-records-slice";
import {
  COUNTRY_NAMES,
  statesForCountry,
  ASSET_TYPES,
} from "@/src/config/system-data";
import type { PreboardAsset } from "../types";

const STEPS = ["Personal information", "Asset assignment", "Review & submit"];
const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const CONDITION_OPTIONS = ["New", "Good", "Fair", "Damaged"];
const TITLE_OPTIONS = ["Dr", "Mr", "Mrs", "Miss", "Ms"];
const MARITAL_OPTIONS = ["Single", "Married", "Divorced", "Widowed"];
const ETHNICITY_OPTIONS = [
  "Asian / Asian British",
  "Black / African / Caribbean / Black British",
  "Mixed / Multiple ethnic groups",
  "White",
  "Other ethnic group",
  "Prefer not to say",
];

interface PersonalForm {
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  maidenName: string;
  initials: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  ethnicity: string;
  maritalStatus: string;
  address: string;
  country: string;
  state: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinEmail: string;
}

const EMPTY_PERSONAL: PersonalForm = {
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
  country: "",
  state: "",
  nextOfKinName: "",
  nextOfKinPhone: "",
  nextOfKinEmail: "",
};

function newAsset(): PreboardAsset {
  return { assetType: "", serialNumber: "", condition: "", notes: "" };
}

export function PreboardingFormPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(0);
  const [p, setP] = useState<PersonalForm>(EMPTY_PERSONAL);
  const [assets, setAssets] = useState<PreboardAsset[]>([newAsset()]);

  const set = <K extends keyof PersonalForm>(k: K, v: PersonalForm[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));

  const stateOptions = statesForCountry(p.country);

  function patchAsset(i: number, patch: Partial<PreboardAsset>) {
    setAssets((prev) => prev.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  }

  function validatePersonal(): boolean {
    if (p.firstName.trim().length < 1 || p.lastName.trim().length < 1) {
      toast.error("First and last name are required.");
      return false;
    }
    if (!/.+@.+\..+/.test(p.email)) {
      toast.error("A valid email is required.");
      return false;
    }
    return true;
  }

  function goNext() {
    if (step === 0 && !validatePersonal()) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function submit() {
    if (!validatePersonal()) {
      setStep(0);
      return;
    }
    const cleanAssets = assets.filter((a) => a.assetType || a.serialNumber);
    const id = `pre-${Date.now()}`;
    const fullName = `${p.firstName} ${p.lastName}`.trim();
    const initials = `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();
    const first = cleanAssets[0];

    dispatch(
      addRecord({
        id,
        employeeName: fullName,
        employeeInitials: initials,
        email: p.email,
        department: "—",
        jobTitle: "—",
        startDate: "",
        stage: "pre_boarding",
        status: "not_started",
        phase: "preboarding",
        tasks: [],
        completedTasks: 0,
        totalTasks: 0,
        welcomeEmailSent: false,
        initiatedAt: new Date().toISOString().slice(0, 10),
        mode: "manual",
        assets: cleanAssets,
        preboardingData: {
          title: p.title,
          firstName: p.firstName,
          middleName: p.middleName,
          lastName: p.lastName,
          preferredName: p.preferredName,
          maidenName: p.maidenName,
          initials: p.initials,
          email: p.email,
          phone: p.phone,
          dateOfBirth: p.dateOfBirth,
          gender: p.gender,
          nationality: p.nationality,
          ethnicity: p.ethnicity,
          maritalStatus: p.maritalStatus,
          address: p.address,
          country: p.country,
          state: p.state,
          emergencyContactName: p.nextOfKinName,
          emergencyContactPhone: p.nextOfKinPhone,
          emergencyContactEmail: p.nextOfKinEmail,
          assetCategory: first?.assetType ?? "",
          assetSerialNumber: first?.serialNumber ?? "",
        },
      }),
    );
    toast.success(`${fullName || "Hire"} registered for preboarding`);
    router.push("/talent/onboarding");
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/talent/onboarding")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Initiate Preboarding</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span className={cn("text-xs", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="text-muted-foreground">›</span>}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Step 1 — Personal */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Select value={p.title} onValueChange={(v) => set("title", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {TITLE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">First name</Label>
                <Input value={p.firstName} onChange={(e) => set("firstName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Middle name</Label>
                <Input value={p.middleName} onChange={(e) => set("middleName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Last name</Label>
                <Input value={p.lastName} onChange={(e) => set("lastName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Preferred name</Label>
                <Input value={p.preferredName} onChange={(e) => set("preferredName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Maiden name</Label>
                <Input value={p.maidenName} onChange={(e) => set("maidenName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Initials</Label>
                <Input value={p.initials} maxLength={5} onChange={(e) => set("initials", e.target.value.toUpperCase())} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email address</Label>
                <Input type="email" value={p.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone number</Label>
                <Input type="tel" value={p.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date of birth</Label>
                <Input type="date" value={p.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Gender</Label>
                <Select value={p.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nationality</Label>
                <Input value={p.nationality} onChange={(e) => set("nationality", e.target.value)} placeholder="e.g. Nigerian" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ethnicity</Label>
                <Select value={p.ethnicity} onValueChange={(v) => set("ethnicity", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {ETHNICITY_OPTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Marital status</Label>
                <Select value={p.maritalStatus} onValueChange={(v) => set("maritalStatus", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {MARITAL_OPTIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input value={p.address} onChange={(e) => set("address", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Country</Label>
                <Select value={p.country} onValueChange={(v) => { set("country", v); set("state", ""); }}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {COUNTRY_NAMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State / City</Label>
                {stateOptions.length > 0 ? (
                  <Select value={p.state} onValueChange={(v) => set("state", v)}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {stateOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={p.state} onChange={(e) => set("state", e.target.value)} placeholder="State / City" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Next of kin name</Label>
                <Input value={p.nextOfKinName} onChange={(e) => set("nextOfKinName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Next of kin phone</Label>
                <Input type="tel" value={p.nextOfKinPhone} onChange={(e) => set("nextOfKinPhone", e.target.value)} placeholder="+234 800 000 0000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Next of kin email</Label>
                <Input type="email" value={p.nextOfKinEmail} onChange={(e) => set("nextOfKinEmail", e.target.value)} placeholder="kin@example.com" />
              </div>
            </div>
          )}

          {/* Step 2 — Assets */}
          {step === 1 && (
            <div className="space-y-3">
              {assets.map((a, i) => (
                <div key={i} className="rounded-lg border border-border/60 p-3 grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Asset type</Label>
                    <Select value={a.assetType} onValueChange={(v) => patchAsset(i, { assetType: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Serial number</Label>
                    <Input value={a.serialNumber} onChange={(e) => patchAsset(i, { serialNumber: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Condition</Label>
                    <Select value={a.condition} onValueChange={(v) => patchAsset(i, { condition: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Notes</Label>
                    <Input value={a.notes} onChange={(e) => patchAsset(i, { notes: e.target.value })} />
                  </div>
                  {assets.length > 1 && (
                    <div className="col-span-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-destructive"
                        onClick={() => setAssets((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => setAssets((prev) => [...prev, newAsset()])}
              >
                <Plus className="w-3.5 h-3.5" /> Add asset
              </Button>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Personal
                </h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                  {[
                    { label: "Name", value: [p.title, p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ") },
                    { label: "Preferred name", value: p.preferredName },
                    { label: "Maiden name", value: p.maidenName },
                    { label: "Initials", value: p.initials },
                    { label: "Email", value: p.email },
                    { label: "Phone", value: p.phone },
                    { label: "Date of birth", value: p.dateOfBirth },
                    { label: "Gender", value: p.gender },
                    { label: "Nationality", value: p.nationality },
                    { label: "Ethnicity", value: p.ethnicity },
                    { label: "Marital status", value: p.maritalStatus },
                    { label: "Country", value: p.country },
                    { label: "State / City", value: p.state },
                    { label: "Address", value: p.address },
                    { label: "Next of kin", value: p.nextOfKinName },
                    { label: "Next of kin phone", value: p.nextOfKinPhone },
                    { label: "Next of kin email", value: p.nextOfKinEmail },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col gap-0.5">
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                      <dd className="text-foreground">{f.value || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Assets ({assets.filter((a) => a.assetType || a.serialNumber).length})
                </h3>
                <div className="flex flex-col gap-1.5">
                  {assets.filter((a) => a.assetType || a.serialNumber).map((a, i) => (
                    <p key={i} className="text-sm text-foreground">
                      {a.assetType || "—"}
                      {a.serialNumber ? ` · ${a.serialNumber}` : ""}
                      {a.condition ? ` · ${a.condition}` : ""}
                    </p>
                  ))}
                  {assets.filter((a) => a.assetType || a.serialNumber).length === 0 && (
                    <p className="text-sm text-muted-foreground">No assets assigned.</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Submitting registers this person with a <span className="font-medium">Preboarding</span>{" "}
                status. You can continue them into full onboarding later.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={step === 0 ? () => router.push("/talent/onboarding") : () => setStep((s) => s - 1)}
        >
          {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={goNext} className="gap-1.5">
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={submit} className="gap-1.5">
            <Check className="w-4 h-4" /> Submit preboarding
          </Button>
        )}
      </div>
    </div>
  );
}
