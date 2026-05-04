"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Camera, Pencil } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils";
import {
  EMPLOYEES,
  STATUS_LABELS,
  STATUS_STYLES,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_STYLES,
  formatDate,
} from "../data";
import { PageTabsList } from "@/src/components/shared/page-tabs";

interface EmployeeDetailPageProps {
  id: string;
}

const personalInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, "Required")
    .regex(/^[a-zA-Z\s'-]+$/, "Letters only"),
  middleName: z
    .string()
    .regex(/^[a-zA-Z\s'-]*$/, "Letters only")
    .optional()
    .or(z.literal("")),
  lastName: z
    .string()
    .min(1, "Required")
    .regex(/^[a-zA-Z\s'-]+$/, "Letters only"),
  jobTitle: z.string().min(1, "Required"),
  email: z.string().min(1, "Required").email("Invalid email"),
  phone: z
    .string()
    .min(1, "Required")
    .regex(/^[+\d\s\-().]+$/, "Invalid phone number"),
  dateOfBirth: z.string().min(1, "Required"),
  gender: z
    .string()
    .regex(/^[a-zA-Z\s]*$/, "Letters only")
    .optional()
    .or(z.literal("")),
  nationality: z
    .string()
    .regex(/^[a-zA-Z\s'-]*$/, "Letters only")
    .optional()
    .or(z.literal("")),
  maritalStatus: z
    .string()
    .regex(/^[a-zA-Z\s]*$/, "Letters only")
    .optional()
    .or(z.literal("")),
  bloodType: z
    .string()
    .regex(/^[ABO0+\-abos]*$/, "Invalid blood type")
    .optional()
    .or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  state: z
    .string()
    .regex(/^[a-zA-Z\s'-]*$/, "Letters only")
    .optional()
    .or(z.literal("")),
  country: z
    .string()
    .regex(/^[a-zA-Z\s'-]*$/, "Letters only")
    .optional()
    .or(z.literal("")),
  managerName: z.string().optional().or(z.literal("")),
});

type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground w-36 shrink-0">
        {label}:
      </span>
      <span className="text-xs text-foreground font-medium flex-1">
        {value ?? <span className="italic text-muted-foreground/50">—</span>}
      </span>
    </div>
  );
}

function DocCard({
  type,
  number,
  expiry,
  country,
}: {
  type: string;
  number?: string;
  expiry?: string;
  country?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-primary uppercase">ID</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{type}</p>
        {number ? (
          <p className="text-[11px] text-muted-foreground font-mono">
            {number}
            {expiry ? ` · Exp: ${formatDate(expiry)}` : ""}
            {country ? ` · ${country}` : ""}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            Not provided
          </p>
        )}
      </div>
    </div>
  );
}

export function EmployeeDetailPage({ id }: EmployeeDetailPageProps) {
  const router = useRouter();
  const employee = useMemo(() => EMPLOYEES.find((e) => e.id === id), [id]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const buildDefaults = (): PersonalInfoValues => {
    const parts = employee ? employee.name.trim().split(/\s+/) : [];
    const firstName = parts[0] ?? "";
    const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
    const middleName = parts.length > 2 ? parts.slice(1, -1).join(" ") : "";
    return {
      firstName,
      middleName,
      lastName,
      jobTitle: employee?.jobTitle ?? "",
      email: employee?.email ?? "",
      phone: employee?.phone ?? "",
      dateOfBirth: employee?.dateOfBirth ?? "",
      gender: employee?.gender ?? "",
      nationality: employee?.nationality ?? "",
      maritalStatus: employee?.maritalStatus ?? "",
      bloodType: employee?.bloodType ?? "",
      address: employee?.address ?? "",
      state: employee?.state ?? "",
      country: employee?.country ?? "",
      managerName: employee?.managerName ?? "",
    };
  };

  const [saved, setSaved] = useState<PersonalInfoValues>(buildDefaults);

  const form = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: buildDefaults(),
  });

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground text-sm">Employee not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Go Back
        </Button>
      </div>
    );
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhotoUrl(URL.createObjectURL(file));
  }

  function openModal() {
    form.reset(buildDefaults());
    setModalOpen(true);
  }

  function onSubmit(values: PersonalInfoValues) {
    setSaved(values);
    setModalOpen(false);
  }

  const displayName = [saved.firstName, saved.middleName, saved.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </Button>
        <span className="text-muted-foreground text-xs">/</span>
        <span className="text-xs text-muted-foreground">Employees</span>
        <span className="text-muted-foreground text-xs">/</span>
        <span className="text-xs text-foreground font-medium">
          {displayName}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[260px_1fr] gap-4 items-start">
        <Card>
          <CardContent className="p-4 flex flex-col items-center gap-4">
            <div
              className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer group"
              onClick={() => fileRef.current?.click()}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-5xl font-bold text-primary/40">
                    {employee.initials}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
            </div>

            <div className="text-center">
              <p className="text-xl font-extrabold text-foreground leading-tight">
                {displayName}
              </p>
              <p className="text-sm font-semibold text-muted-foreground mt-0.5">
                {saved.jobTitle}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
              Personal Information
              <Button variant="ghost" size="icon-xs" onClick={openModal}>
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="px-5 pb-4 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <InfoRow label="Email" value={saved.email} />
              <InfoRow label="Phone" value={saved.phone} />
              <InfoRow label="Department" value={employee.department} />
              <InfoRow
                label="Date of birth"
                value={
                  saved.dateOfBirth ? formatDate(saved.dateOfBirth) : undefined
                }
              />
              <InfoRow label="Gender" value={saved.gender} />
              <InfoRow label="Nationality" value={saved.nationality} />
              <InfoRow label="Marital status" value={saved.maritalStatus} />
              <InfoRow label="Blood type" value={saved.bloodType} />
              <InfoRow label="Address" value={saved.address} />
              <InfoRow label="State" value={saved.state} />
              <InfoRow label="Country" value={saved.country} />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                  STATUS_STYLES[employee.status] ?? "",
                )}
              >
                {STATUS_LABELS[employee.status] ?? employee.status}
              </span>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                  EMPLOYMENT_TYPE_STYLES[employee.employmentType] ?? "",
                )}
              >
                {EMPLOYMENT_TYPE_LABELS[employee.employmentType] ??
                  employee.employmentType}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-200! max-h-[90vh] overflow-y-auto pt-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Edit Personal Information
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-3 gap-4 py-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          placeholder="First name"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Middle Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          placeholder="Middle name (optional)"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          placeholder="Last name"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Job Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          placeholder="e.g. Software Engineer"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          className="h-8 text-sm"
                          placeholder="name@company.com"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          className="h-8 text-sm"
                          placeholder="+234 800 000 0000"
                          onKeyDown={(e) => {
                            const allowed = [
                              "Backspace",
                              "Delete",
                              "Tab",
                              "ArrowLeft",
                              "ArrowRight",
                              "Home",
                              "End",
                              "+",
                              "-",
                              "(",
                              ")",
                              " ",
                            ];
                            if (!allowed.includes(e.key) && !/^\d$/.test(e.key))
                              e.preventDefault();
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Date of Birth
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="h-8 text-sm"
                          max={new Date().toISOString().split("T")[0]}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Gender
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          placeholder="e.g. Male"
                          onKeyDown={(e) => {
                            if (
                              !/^[a-zA-Z\s]$/.test(e.key) &&
                              ![
                                "Backspace",
                                "Delete",
                                "Tab",
                                "ArrowLeft",
                                "ArrowRight",
                                "Home",
                                "End",
                              ].includes(e.key)
                            )
                              e.preventDefault();
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Nationality
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          placeholder="e.g. Nigerian"
                          onKeyDown={(e) => {
                            if (
                              !/^[a-zA-Z\s'-]$/.test(e.key) &&
                              ![
                                "Backspace",
                                "Delete",
                                "Tab",
                                "ArrowLeft",
                                "ArrowRight",
                                "Home",
                                "End",
                              ].includes(e.key)
                            )
                              e.preventDefault();
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Marital Status
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          placeholder="e.g. Single"
                          onKeyDown={(e) => {
                            if (
                              !/^[a-zA-Z\s]$/.test(e.key) &&
                              ![
                                "Backspace",
                                "Delete",
                                "Tab",
                                "ArrowLeft",
                                "ArrowRight",
                                "Home",
                                "End",
                              ].includes(e.key)
                            )
                              e.preventDefault();
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bloodType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Blood Type
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          placeholder="e.g. O+"
                          maxLength={3}
                          onKeyDown={(e) => {
                            if (
                              !/^[AaBbOo+\-0-9]$/.test(e.key) &&
                              ![
                                "Backspace",
                                "Delete",
                                "Tab",
                                "ArrowLeft",
                                "ArrowRight",
                                "Home",
                                "End",
                              ].includes(e.key)
                            )
                              e.preventDefault();
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Home Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          placeholder="Street address"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        State
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          placeholder="e.g. Lagos"
                          onKeyDown={(e) => {
                            if (
                              !/^[a-zA-Z\s'-]$/.test(e.key) &&
                              ![
                                "Backspace",
                                "Delete",
                                "Tab",
                                "ArrowLeft",
                                "ArrowRight",
                                "Home",
                                "End",
                              ].includes(e.key)
                            )
                              e.preventDefault();
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Country
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          placeholder="e.g. Nigeria"
                          onKeyDown={(e) => {
                            if (
                              !/^[a-zA-Z\s'-]$/.test(e.key) &&
                              ![
                                "Backspace",
                                "Delete",
                                "Tab",
                                "ArrowLeft",
                                "ArrowRight",
                                "Home",
                                "End",
                              ].includes(e.key)
                            )
                              e.preventDefault();
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="managerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Line Manager
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          placeholder="e.g. Jane Doe"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset(buildDefaults());
                    setModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <Tabs defaultValue="employment">
          <CardHeader className="pb-0 pt-4 px-5">
            <PageTabsList
              tabs={[
                { value: "employment", label: "Employment Details" },
                { value: "documents", label: "Identity Documents" },
                { value: "bank", label: "Bank Details" },
                { value: "emergency", label: "Emergency Contact" },
              ]}
            />
          </CardHeader>
          <Separator className="mt-3" />
          <CardContent className="px-5 pb-5 pt-3">
            <TabsContent value="employment" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <InfoRow label="Employee ID" value={employee.id} />
                <InfoRow label="Department" value={employee.department} />
                <InfoRow
                  label="Employment type"
                  value={EMPLOYMENT_TYPE_LABELS[employee.employmentType]}
                />
                <InfoRow
                  label="Line manager"
                  value={saved.managerName || employee.managerName}
                />
                <InfoRow
                  label="Start date"
                  value={formatDate(employee.startDate)}
                />
                <InfoRow label="Work location" value={employee.workLocation} />
                <InfoRow label="Work mode" value={employee.workMode} />
                <InfoRow label="Grade" value={employee.grade} />
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <DocCard type="National ID (NIN)" number={employee.ninNumber} />
                <DocCard
                  type="International Passport"
                  number={employee.passportNumber}
                  expiry={employee.passportExpiry}
                  country={employee.passportCountry}
                />
                <DocCard
                  type="Driver's License"
                  number={employee.driverLicenseNumber}
                />
                <DocCard
                  type="Tax Identification (TIN)"
                  number={employee.taxId}
                />
                <DocCard type="Pension ID (PFA)" number={employee.pensionId} />
                <DocCard
                  type="National Housing Fund (NHF)"
                  number={employee.nhfNumber}
                />
              </div>
            </TabsContent>

            <TabsContent value="bank" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <InfoRow label="Bank name" value={employee.bankName} />
                <InfoRow
                  label="Account number"
                  value={employee.bankAccountNumber}
                />
                <InfoRow
                  label="Account name"
                  value={employee.bankAccountName}
                />
              </div>
            </TabsContent>

            <TabsContent value="emergency" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <InfoRow
                  label="Full name"
                  value={employee.emergencyContactName}
                />
                <InfoRow
                  label="Relationship"
                  value={employee.emergencyContactRelationship}
                />
                <InfoRow label="Phone" value={employee.emergencyContactPhone} />
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
