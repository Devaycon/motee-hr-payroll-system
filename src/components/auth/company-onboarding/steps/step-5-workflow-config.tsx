"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Switch } from "@/src/components/ui/switch";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ArrowRight, UserCog } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updateWorkflowConfig, markStepComplete, setCurrentStep } from "@/src/lib/stores/onboarding-slice";
import type { DelegateTarget, FallbackStep } from "@/src/lib/types/onboarding-setup.types";

const schema = z.object({
  leaveApproval: z.enum(["manager", "hr", "both"]),
  multiLevelApproval: z.boolean(),
  autoApproval: z.boolean(),
  autoDelegate: z.boolean(),
  delegateTo: z.enum(["hr", "next_level_manager", "specific"]),
  escalationEnabled: z.boolean(),
  escalationHours: z.number().min(1).max(720),
  fallbackOrder: z.array(z.enum(["delegate", "managers_manager", "hr"])),
});

type FormValues = z.infer<typeof schema>;

const LEAVE_APPROVAL_LABELS: Record<FormValues["leaveApproval"], string[]> = {
  manager: ["Manager"],
  hr: ["HR"],
  both: ["Manager", "HR"],
};

const DELEGATE_TARGET_LABELS: Record<DelegateTarget, string> = {
  hr: "HR Department",
  next_level_manager: "Manager's next-level manager",
  specific: "Specific designated delegate",
};

const FALLBACK_STEP_LABELS: Record<FallbackStep, string> = {
  delegate: "Designated delegate",
  managers_manager: "Manager's manager",
  hr: "HR",
};

function WorkflowPreview({
  leaveApproval,
  multiLevelApproval,
  autoApproval,
  autoDelegate,
  delegateTo,
}: FormValues) {
  const approvers = LEAVE_APPROVAL_LABELS[leaveApproval];
  const chain = ["Employee", ...approvers, ...(multiLevelApproval ? ["Senior Management"] : []), "Approved"];

  // §4.1 — the client's own worked example: `Employee → Manager (On Leave)
  // → Delegate / HR → Approved` when a manager is absent.
  const absenceChain = autoDelegate
    ? [
        "Employee",
        `${approvers[0]} (On Leave)`,
        delegateTo === "hr" ? "HR" : "Delegate",
        "Approved",
      ]
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex flex-col gap-2">
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
      </div>
      {absenceChain && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <span className="text-xs font-semibold text-foreground">If the approver is absent</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {absenceChain.map((step, i) => (
              <span key={`${step}-${i}`} className="flex items-center gap-1.5">
                <span
                  className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
                  style={
                    step === "Approved"
                      ? { backgroundColor: "rgba(29,158,117,0.12)", borderColor: "rgba(29,158,117,0.4)", color: "#1D9E75" }
                      : step.includes("On Leave")
                        ? { backgroundColor: "rgba(220,38,38,0.08)", borderColor: "rgba(220,38,38,0.3)", color: "#dc2626" }
                        : { backgroundColor: "rgba(216,90,48,0.08)", borderColor: "rgba(216,90,48,0.3)", color: "#D85A30" }
                  }
                >
                  {step}
                </span>
                {i < absenceChain.length - 1 && <ArrowRight size={11} className="text-muted-foreground" />}
              </span>
            ))}
          </div>
        </div>
      )}
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

  function moveFallbackStep(index: number, direction: -1 | 1) {
    const next = [...values.fallbackOrder];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setValue("fallbackOrder", next);
  }

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

      {/* §4.1 — "Approval Delegation & Escalation": named per the client's
          explicit ask, covering both planned absence and automatic
          escalation, not just the manual-delegation case. */}
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <div className="flex items-center gap-2">
          <UserCog size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">Approval Delegation &amp; Escalation</span>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          What happens when the approver is unavailable?
        </p>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">Automatically delegate approval</span>
            <span className="text-xs text-muted-foreground">
              If the direct manager is unavailable or on leave, route their approvals elsewhere.
            </span>
          </div>
          <Switch
            defaultChecked={config.autoDelegate}
            onCheckedChange={(v) => setValue("autoDelegate", v)}
          />
        </div>

        {values.autoDelegate && (
          <div className="flex flex-col gap-2 pl-1">
            <Label className="text-xs">Delegate to</Label>
            <Select
              defaultValue={config.delegateTo}
              onValueChange={(v) => setValue("delegateTo", v as DelegateTarget)}
            >
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DELEGATE_TARGET_LABELS) as DelegateTarget[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {DELEGATE_TARGET_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[11px] text-muted-foreground">
              Trigger: manager marked On Leave/Unavailable, or —
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">Escalate if no response</span>
            <span className="text-xs text-muted-foreground">
              Optional — escalate when the manager doesn't respond within a set time.
            </span>
          </div>
          <Switch
            defaultChecked={config.escalationEnabled}
            onCheckedChange={(v) => setValue("escalationEnabled", v)}
          />
        </div>
        {values.escalationEnabled && (
          <div className="flex items-center gap-2 pl-1">
            <Input
              type="number"
              min={1}
              max={720}
              defaultValue={config.escalationHours}
              onChange={(e) => setValue("escalationHours", Number(e.target.value))}
              className="w-24 h-9"
            />
            <span className="text-xs text-muted-foreground">hours without a response</span>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <Label className="text-xs">
            Fallback approval chain — used when no delegate is configured
          </Label>
          <p className="text-[11px] text-muted-foreground -mt-1">
            More robust than sending everything to HR: preserves the organisational hierarchy.
          </p>
          <ol className="flex flex-col gap-1.5">
            {values.fallbackOrder.map((step, i) => (
              <li
                key={step}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-1.5"
              >
                <span className="text-xs text-foreground">
                  {i + 1}. {FALLBACK_STEP_LABELS[step]}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs"
                    disabled={i === 0}
                    onClick={() => moveFallbackStep(i, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs"
                    disabled={i === values.fallbackOrder.length - 1}
                    onClick={() => moveFallbackStep(i, 1)}
                  >
                    ↓
                  </Button>
                </div>
              </li>
            ))}
          </ol>
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
