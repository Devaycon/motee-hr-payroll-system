"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updateUILabels, markStepComplete, setCurrentStep } from "@/src/lib/stores/onboarding-slice";

const schema = z.object({
  manager: z.string().min(1, "Required"),
  employeeId: z.string().min(1, "Required"),
  department: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

const LABEL_FIELDS: { key: keyof FormValues; label: string; hint: string }[] = [
  { key: "manager", label: "Manager label", hint: 'e.g. "Line Manager", "Team Lead", "Supervisor"' },
  { key: "employeeId", label: "Employee ID label", hint: 'e.g. "Staff ID", "Worker Number", "Personnel ID"' },
  { key: "department", label: "Department label", hint: 'e.g. "Unit", "Division", "Team"' },
];

export function Step6UILabels() {
  const dispatch = useAppDispatch();
  const uiLabels = useAppSelector((s) => s.onboarding.companySetup.uiLabels);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      manager: uiLabels.manager,
      employeeId: uiLabels.employeeId,
      department: uiLabels.department,
    },
  });

  useEffect(() => {
    setValue("manager", uiLabels.manager);
    setValue("employeeId", uiLabels.employeeId);
    setValue("department", uiLabels.department);
  }, [uiLabels, setValue]);

  const onSubmit = (data: FormValues) => {
    dispatch(updateUILabels(data));
    dispatch(markStepComplete(6));
    dispatch(setCurrentStep(7));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Customise the labels shown across tables, dashboards, and reports to match your company&apos;s terminology.
      </p>

      <div className="flex flex-col gap-4">
        {LABEL_FIELDS.map(({ key, label, hint }) => (
          <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center rounded-lg border border-border p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </div>
            <div className="flex flex-col gap-1">
              <Input placeholder={`Enter ${label.toLowerCase()}`} {...register(key)} />
              {errors[key] && <span className="text-xs text-destructive">{errors[key]?.message}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={() => dispatch(setCurrentStep(5))}>
          Back
        </Button>
        <Button type="submit" style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}>
          Continue
        </Button>
      </div>
    </form>
  );
}
