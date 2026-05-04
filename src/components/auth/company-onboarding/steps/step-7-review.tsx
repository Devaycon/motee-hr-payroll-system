"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { setCurrentStep, setIsComplete, setIsSubmitting } from "@/src/lib/stores/onboarding-slice";
import { AVAILABLE_MODULES } from "@/src/lib/types/onboarding-setup.types";
import { Pencil } from "lucide-react";

interface SectionProps {
  title: string;
  step: number;
  children: React.ReactNode;
}

function ReviewSection({ title, step, children }: SectionProps) {
  const dispatch = useAppDispatch();
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <button
          type="button"
          onClick={() => dispatch(setCurrentStep(step))}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil size={12} />
          Edit
        </button>
      </div>
      <div className="p-4 flex flex-col gap-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground text-right">{value || "—"}</span>
    </div>
  );
}

export function Step7Review() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { companyProfile, organizationConfig, accessControlConfig, enabledModules, workflowConfig, uiLabels } =
    useAppSelector((s) => s.onboarding.companySetup);
  const isSubmitting = useAppSelector((s) => s.onboarding.isSubmitting);

  const handleSubmit = async () => {
    dispatch(setIsSubmitting(true));
    await new Promise((r) => setTimeout(r, 1200));
    dispatch(setIsSubmitting(false));
    dispatch(setIsComplete(true));
    router.push("/hr");
  };

  const moduleLabels = enabledModules
    .map((id) => AVAILABLE_MODULES.find((m) => m.id === id)?.label)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Review your configuration before submitting. Click any section to edit.
      </p>

      <ReviewSection title="Company Profile" step={1}>
        <ReviewRow label="Company Name" value={companyProfile.companyName} />
        <ReviewRow label="Industry" value={companyProfile.industry} />
        <ReviewRow label="Company Size" value={companyProfile.companySize} />
        <ReviewRow label="Country" value={companyProfile.country} />
        <ReviewRow label="Email Domain" value={companyProfile.companyEmailDomain} />
      </ReviewSection>

      <ReviewSection title="Organisational Structure" step={2}>
        <ReviewRow label="Manager Title" value={organizationConfig.managerTitle} />
        <ReviewRow label="Department Label" value={organizationConfig.departmentLabel} />
        <ReviewRow label="Structure Type" value={organizationConfig.structureType === "hierarchical" ? "Hierarchical" : "Flat"} />
      </ReviewSection>

      <ReviewSection title="Role & Permissions" step={3}>
        <ReviewRow label="Access Model" value={accessControlConfig.model} />
        {accessControlConfig.roles.length > 0 && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-xs text-muted-foreground">Roles</span>
            <div className="flex flex-wrap gap-1 justify-end">
              {accessControlConfig.roles.map((r) => (
                <Badge key={r.id} variant="secondary" className="text-[10px]">{r.name}</Badge>
              ))}
            </div>
          </div>
        )}
      </ReviewSection>

      <ReviewSection title="Enabled Modules" step={4}>
        <ReviewRow label="Active Modules" value={moduleLabels || "None selected"} />
      </ReviewSection>

      <ReviewSection title="Workflow Configuration" step={5}>
        <ReviewRow label="Leave Approval" value={workflowConfig.leaveApproval.charAt(0).toUpperCase() + workflowConfig.leaveApproval.slice(1)} />
        <ReviewRow label="Multi-level Approval" value={workflowConfig.multiLevelApproval ? "Enabled" : "Disabled"} />
        <ReviewRow label="Auto-approval" value={workflowConfig.autoApproval ? "Enabled" : "Disabled"} />
      </ReviewSection>

      <ReviewSection title="UI Labels" step={6}>
        <ReviewRow label="Manager Label" value={uiLabels.manager} />
        <ReviewRow label="Employee ID Label" value={uiLabels.employeeId} />
        <ReviewRow label="Department Label" value={uiLabels.department} />
      </ReviewSection>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={() => dispatch(setCurrentStep(6))}>
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{ backgroundColor: "#1D9E75", borderColor: "#1D9E75" }}
        >
          {isSubmitting ? "Saving…" : "Complete Setup"}
        </Button>
      </div>
    </div>
  );
}
