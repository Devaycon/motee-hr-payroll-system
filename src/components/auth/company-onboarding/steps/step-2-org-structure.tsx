"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updateOrganizationConfig, markStepComplete, setCurrentStep } from "@/src/lib/stores/onboarding-slice";

const MANAGER_TITLES = ["Line Manager", "Reporting Manager", "Team Lead", "Supervisor", "Custom"];
const DEPARTMENT_LABELS = ["Department", "Unit", "Division", "Team"];

const schema = z.object({
  managerTitle: z.string().min(1, "Required"),
  customManagerTitle: z.string().optional(),
  departmentLabel: z.string().min(1, "Required"),
  structureType: z.enum(["hierarchical", "flat"]),
});

type FormValues = z.infer<typeof schema>;

export function Step2OrgStructure() {
  const dispatch = useAppDispatch();
  const config = useAppSelector((s) => s.onboarding.companySetup.organizationConfig);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      managerTitle: config.managerTitle,
      departmentLabel: config.departmentLabel,
      structureType: config.structureType,
    },
  });

  useEffect(() => {
    setValue("managerTitle", config.managerTitle);
    setValue("departmentLabel", config.departmentLabel);
    setValue("structureType", config.structureType);
  }, [config, setValue]);

  const managerTitle = watch("managerTitle");

  const onSubmit = (data: FormValues) => {
    const finalTitle = data.managerTitle === "Custom" ? (data.customManagerTitle || "Manager") : data.managerTitle;
    dispatch(updateOrganizationConfig({
      managerTitle: finalTitle,
      departmentLabel: data.departmentLabel,
      structureType: data.structureType,
    }));
    dispatch(markStepComplete(2));
    dispatch(setCurrentStep(3));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label>What do you call supervisors?</Label>
        <Select
          defaultValue={config.managerTitle}
          onValueChange={(v) => setValue("managerTitle", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select title" />
          </SelectTrigger>
          <SelectContent>
            {MANAGER_TITLES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.managerTitle && <span className="text-xs text-destructive">{errors.managerTitle.message}</span>}

        {managerTitle === "Custom" && (
          <div className="mt-2">
            <Input placeholder="Enter custom title" {...register("customManagerTitle")} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>What do you call departments?</Label>
        <Select
          defaultValue={config.departmentLabel}
          onValueChange={(v) => setValue("departmentLabel", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select label" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENT_LABELS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.departmentLabel && <span className="text-xs text-destructive">{errors.departmentLabel.message}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Organisational Structure Type</Label>
        <RadioGroup
          defaultValue={config.structureType}
          onValueChange={(v) => setValue("structureType", v as "hierarchical" | "flat")}
          className="flex flex-col gap-3 mt-1"
        >
          <div className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="hierarchical" id="hierarchical" className="mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <label htmlFor="hierarchical" className="text-sm font-medium text-foreground cursor-pointer">
                Hierarchical Structure
              </label>
              <span className="text-xs text-muted-foreground">
                Traditional top-down structure (Manager → Team Lead → Staff)
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="flat" id="flat" className="mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <label htmlFor="flat" className="text-sm font-medium text-foreground cursor-pointer">
                Flat Structure
              </label>
              <span className="text-xs text-muted-foreground">
                Minimal hierarchy, everyone reports to a central point
              </span>
            </div>
          </div>
        </RadioGroup>
        {errors.structureType && <span className="text-xs text-destructive">{errors.structureType.message}</span>}
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={() => dispatch(setCurrentStep(1))}>
          Back
        </Button>
        <Button type="submit" style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}>
          Continue
        </Button>
      </div>
    </form>
  );
}
