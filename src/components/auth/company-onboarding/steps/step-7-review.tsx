"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { setCurrentStep, setIsComplete } from "@/src/lib/stores/onboarding-slice";
import { HOME_PATH } from "@/src/lib/auth/session";
import { getApiErrorMessage } from "@/src/lib/utils";
import { tenantSetupSchema } from "@/src/lib/validations/tenant-setup";
import {
  useCompleteTenantSetupMutation,
  useGetTenantSetupOptionsQuery,
  useUpdateTenantSetupMutation,
} from "@/src/store/services/tenant-setup";
import { setOnboardingCompleted } from "@/src/store/reducers/authSlice";
import { CheckCircle2, Pencil } from "lucide-react";

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
  const { companyProfile, organizationConfig, enabledModules } =
    useAppSelector((s) => s.onboarding.companySetup);
  const { data: options } = useGetTenantSetupOptionsQuery();
  const [updateTenantSetup, { isLoading: isSaving }] =
    useUpdateTenantSetupMutation();
  const [completeTenantSetup, { isLoading: isCompleting }] =
    useCompleteTenantSetupMutation();
  const isSubmitting = isSaving || isCompleting;
  const [showSuccess, setShowSuccess] = useState(false);
  const AVAILABLE_MODULES = options?.data?.modules ?? [];

  const handleSubmit = async () => {
    // The wizard shows a size range; the API wants that range's id.
    const companySize =
      options?.data?.companySizes.find(
        (size) => size.label === companyProfile.companySize,
      )?.id ?? "";
    const parsed = tenantSetupSchema.safeParse({
      industry: companyProfile.industry,
      companySize,
      companyEmailDomain: companyProfile.companyEmailDomain || null,
      companyPolicies: companyProfile.companyPolicies || null,
      managerTitle: organizationConfig.managerTitle,
      departmentLabel: organizationConfig.departmentLabel,
      structureType: organizationConfig.structureType,
      enabledModules,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      await updateTenantSetup(parsed.data).unwrap();
      await completeTenantSetup().unwrap();
      dispatch(setIsComplete(true));
      setShowSuccess(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save your setup."));
    }
  };

  const handleGoToDashboard = () => {
    setShowSuccess(false);
    // Flipped here rather than on save, so the success dialog is not replaced
    // by the auth guard's redirect before it can be read.
    dispatch(setOnboardingCompleted(true));
    router.push(HOME_PATH);
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
        <ReviewRow
          label="Structure Type"
          value={
            organizationConfig.structureType === "hierarchical"
              ? "Hierarchical"
              : "Flat"
          }
        />
      </ReviewSection>

      <ReviewSection title="Enabled Modules" step={3}>
        <ReviewRow label="Active Modules" value={moduleLabels || "None selected"} />
      </ReviewSection>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={() => dispatch(setCurrentStep(3))}>
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

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent showCloseButton={false} className="text-center">
          <DialogHeader className="items-center">
            <CheckCircle2 size={48} style={{ color: "#1D9E75" }} />
            <DialogTitle className="text-lg">Setup Complete!</DialogTitle>
            <DialogDescription>
              Your organisation has been configured successfully. You&apos;re all set to get started.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              onClick={handleGoToDashboard}
              style={{ backgroundColor: "#1D9E75", borderColor: "#1D9E75" }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
