"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updateCompanyProfile, markStepComplete, setCurrentStep } from "@/src/lib/stores/onboarding-slice";
import { INDUSTRIES, COMPANY_SIZES } from "@/src/lib/types/onboarding-setup.types";
import { useGetTenantSetupOptionsQuery } from "@/src/store/services/tenant-setup";

const schema = z.object({
  companyName: z.string().min(2, "Required"),
  industry: z.string().min(1, "Required"),
  companySize: z.string().min(1, "Required"),
  country: z.string().optional(),
  companyEmailDomain: z.string().optional(),
  logo: z.string().optional(),
  companyPolicies: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function Step1CompanyProfile() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((s) => s.onboarding.companySetup.companyProfile);
  const { data: options } = useGetTenantSetupOptionsQuery();
  const industries = options?.data?.industries ?? INDUSTRIES;
  const companySizes =
    options?.data?.companySizes.map((size) => size.label) ?? COMPANY_SIZES;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: profile,
  });

  useEffect(() => {
    Object.entries(profile).forEach(([key, value]) => {
      setValue(key as keyof FormValues, value ?? "");
    });
  }, [profile, setValue]);

  const onSubmit = (data: FormValues) => {
    dispatch(updateCompanyProfile(data));
    dispatch(markStepComplete(1));
    dispatch(setCurrentStep(2));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" placeholder="Acme Corporation" readOnly {...register("companyName")} />
          {errors.companyName && <span className="text-xs text-destructive">{errors.companyName.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Industry</Label>
          <Select
            key={profile.industry}
            defaultValue={profile.industry}
            onValueChange={(v) => setValue("industry", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.industry && <span className="text-xs text-destructive">{errors.industry.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Company Size</Label>
          <Select
            key={profile.companySize}
            defaultValue={profile.companySize}
            onValueChange={(v) => setValue("companySize", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {companySizes.map((size) => (
                <SelectItem key={size} value={size}>{size} employees</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.companySize && <span className="text-xs text-destructive">{errors.companySize.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Country</Label>
          <Input value={profile.country} readOnly disabled />
          {errors.country && <span className="text-xs text-destructive">{errors.country.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="companyEmailDomain">Company Email Domain <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="companyEmailDomain" placeholder="e.g. acme.com" {...register("companyEmailDomain")} />
          {errors.companyEmailDomain && <span className="text-xs text-destructive">{errors.companyEmailDomain.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="companyPolicies">Company Description <span className="text-muted-foreground">(optional)</span></Label>
          <Textarea
            id="companyPolicies"
            placeholder="Describe your company or paste details here…"
            rows={4}
            {...register("companyPolicies")}
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}>
          Continue
        </Button>
      </div>
    </form>
  );
}
