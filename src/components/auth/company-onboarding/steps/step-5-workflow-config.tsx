"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Switch } from "@/src/components/ui/switch";
import { ArrowRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updateWorkflowConfig, markStepComplete, setCurrentStep } from "@/src/lib/stores/onboarding-slice";

const schema = z.object({
  leaveApproval: z.enum(["manager", "hr", "both"]),
  multiLevelApproval: z.boolean(),
  autoApproval: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const LEAVE_APPROVAL_LABELS: Record<FormValues["leaveApproval"], string[]> = {
  manager: ["Manager"],
  hr: ["HR"],
  both: ["Manager", "HR"],
};

function WorkflowPreview({ leaveApproval, multiLevelApproval, autoApproval }: FormValues) {
  const approvers = LEAVE_APPROVAL_LABELS[leaveApproval];
  const chain = ["Employee", ...approvers, ...(multiLevelApproval ? ["Senior Management"] : []), "Approved"];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4">
      <span className="text-xs font-semibold text-foreground">Workflow Preview</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {chain.map((step, i) => (
          <span key={`${step}-${i}`} className="flex items-center gap-1.5">
            <span
              className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
              style={
                step === "Approved"
                  ? { backgroundColor: "rgba(29,158,117,0.12)", borderColor: "rgba(29,158,117,0.4)", color: "#1D9E75" }
                  : { backgroundColor: "rgba(216,90,48,0.08)", borderColor: "rgba(216,90,48,0.3)", color: "#D85A30" }
              }
            >
              {step}
            </span>
            {i < chain.length - 1 && <ArrowRight size={11} className="text-muted-foreground" />}
          </span>
        ))}
      </div>
      {autoApproval && (
        <span className="text-[11px] text-muted-foreground">
          Requests meeting your auto-approval criteria will skip this chain entirely.
        </span>
      )}
    </div>
  );
}

export function Step5WorkflowConfig() {
  const dispatch = useAppDispatch();
  const config = useAppSelector((s) => s.onboarding.companySetup.workflowConfig);

  const { handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: config,
  });

  const values = watch();

  const onSubmit = (data: FormValues) => {
    dispatch(updateWorkflowConfig(data));
    dispatch(markStepComplete(5));
    dispatch(setCurrentStep(6));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Who approves leave requests?</Label>
        <RadioGroup
          defaultValue={config.leaveApproval}
          onValueChange={(v) => setValue("leaveApproval", v as "manager" | "hr" | "both")}
          className="flex flex-col gap-3 mt-1"
        >
          {[
            { value: "manager", label: "Direct Manager", desc: "Leave is approved by the employee's line manager" },
            { value: "hr", label: "HR Department", desc: "All leave requests go to HR for approval" },
            { value: "both", label: "Manager & HR", desc: "Requires approval from both manager and HR" },
          ].map(({ value, label, desc }) => (
            <div key={value} className="flex items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={value} id={`leave-${value}`} className="mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <label htmlFor={`leave-${value}`} className="text-sm font-medium text-foreground cursor-pointer">{label}</label>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      <WorkflowPreview {...values} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">Multi-level Approval</span>
            <span className="text-xs text-muted-foreground">Require approval from multiple levels before final decision</span>
          </div>
          <Switch
            defaultChecked={config.multiLevelApproval}
            onCheckedChange={(v) => setValue("multiLevelApproval", v)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">Auto-approval Rules</span>
            <span className="text-xs text-muted-foreground">Automatically approve requests that meet defined criteria</span>
          </div>
          <Switch
            defaultChecked={config.autoApproval}
            onCheckedChange={(v) => setValue("autoApproval", v)}
          />
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={() => dispatch(setCurrentStep(4))}>
          Back
        </Button>
        <Button type="submit" style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}>
          Continue
        </Button>
      </div>
    </form>
  );
}
