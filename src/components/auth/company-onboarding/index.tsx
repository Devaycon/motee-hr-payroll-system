"use client";

import { useAppSelector } from "@/src/lib/stores/hooks";
import { OnboardingStepper } from "./stepper";
import { Step1CompanyProfile } from "./steps/step-1-company-profile";
import { Step2OrgStructure } from "./steps/step-2-org-structure";
import { Step3RolePermissions } from "./steps/step-3-role-permissions";
import { Step4ModulePreferences } from "./steps/step-4-module-preferences";
import { Step5WorkflowConfig } from "./steps/step-5-workflow-config";
import { Step6UILabels } from "./steps/step-6-ui-labels";
import { Step7Review } from "./steps/step-7-review";
import { Step8BulkUpload } from "./steps/step-8-bulk-upload";
import ThemeToggle from "@/src/components/themes/theme-toggle";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { setCurrentStep } from "@/src/lib/stores/onboarding-slice";

const STEPS = [
  {
    number: 1,
    label: "Company",
    title: "Company Profile",
    description: "Tell us about your organisation",
  },
  {
    number: 2,
    label: "Structure",
    title: "Organisational Structure",
    description: "Define your internal naming conventions",
  },
  {
    number: 3,
    label: "Roles",
    title: "Role & Permission Model",
    description: "Configure how access control works",
  },
  {
    number: 4,
    label: "Modules",
    title: "HR Module Preferences",
    description: "Choose which modules to activate",
  },
  {
    number: 5,
    label: "Workflow",
    title: "Workflow Configuration",
    description: "Set up approval workflows",
  },
  {
    number: 6,
    label: "Labels",
    title: "Table & Dashboard Labels",
    description: "Customise UI terminology",
  },
  {
    number: 7,
    label: "Review",
    title: "Review & Submit",
    description: "Confirm your configuration",
  },
];

function StepContent({ step }: { step: number }) {
  switch (step) {
    case 1:
      return <Step1CompanyProfile />;
    case 2:
      return <Step2OrgStructure />;
    case 3:
      return <Step3RolePermissions />;
    case 4:
      return <Step4ModulePreferences />;
    case 5:
      return <Step5WorkflowConfig />;
    case 6:
      return <Step6UILabels />;
    case 7:
      return <Step7Review />;
    case 8:
      return <Step8BulkUpload />;
    default:
      return null;
  }
}

export default function CompanyOnboardingIndex() {
  const dispatch = useAppDispatch();
  const currentStep = useAppSelector((s) => s.onboarding.currentStep);
  const completedSteps = useAppSelector((s) => s.onboarding.completedSteps);
  const isBulkUploaded = useAppSelector((s) => s.onboarding.isBulkUploaded);

  const isBulkUploadStep = currentStep === 8;
  const activeStepMeta = STEPS.find((s) => s.number === currentStep);

  return (
    <div className="flex min-h-screen bg-background">
      <div
        className="hidden lg:flex lg:w-72 xl:w-80 flex-col justify-between p-8 shrink-0"
        style={{
          background: "linear-gradient(180deg, #1a1a2e 0%, #0f3460 100%)",
        }}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm text-white"
              style={{ backgroundColor: "#D85A30" }}
            >
              M
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Motee Solutions
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/40 uppercase tracking-widest">
              Setup Progress
            </span>
            <div className="mt-3 flex flex-col gap-1">
              {STEPS.map((step) => {
                const isCompleted = completedSteps.includes(step.number);
                const isCurrent = currentStep === step.number;
                return (
                  <div
                    key={step.number}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                    style={
                      isCurrent
                        ? { backgroundColor: "rgba(216,90,48,0.15)" }
                        : {}
                    }
                  >
                    <div
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={
                        isCompleted
                          ? { backgroundColor: "#1D9E75", color: "#fff" }
                          : isCurrent
                            ? { backgroundColor: "#D85A30", color: "#fff" }
                            : {
                                backgroundColor: "rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.4)",
                              }
                      }
                    >
                      {isCompleted ? "✓" : step.number}
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: isCurrent
                          ? "#fff"
                          : isCompleted
                            ? "rgba(255,255,255,0.6)"
                            : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {!isBulkUploaded && (
            <button
              type="button"
              onClick={() => dispatch(setCurrentStep(8))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left"
              style={{
                border: "1px solid rgba(127,119,221,0.4)",
                color: "#a5a0f5",
                backgroundColor: "rgba(127,119,221,0.08)",
              }}
            >
              ⚡ Bulk Upload Template
            </button>
          )}
          <p className="text-[10px] text-white/25">
            © {new Date().getFullYear()} Motee Solutions
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col min-h-screen">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 lg:hidden">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs text-white"
              style={{ backgroundColor: "#D85A30" }}
            >
              M
            </div>
            <span className="text-foreground font-bold text-sm">
              Motee Solutions
            </span>
          </div>

          <div className="hidden lg:flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">
              {isBulkUploadStep ? "Bulk Upload" : (activeStepMeta?.title ?? "")}
            </span>
            <span className="text-xs text-muted-foreground">
              {isBulkUploadStep
                ? "Auto-fill from template"
                : (activeStepMeta?.description ?? "")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isBulkUploadStep && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                Step {Math.min(currentStep, 7)} of 7
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex flex-col px-6 py-6 sm:px-8 overflow-y-auto">
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 pb-10">
            {!isBulkUploadStep && (
              <div className="overflow-x-auto pb-1">
                <OnboardingStepper
                  steps={STEPS}
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                />
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-col gap-5">
                {!isBulkUploadStep && activeStepMeta && (
                  <div className="flex flex-col gap-1 pb-4 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">
                      {activeStepMeta.title}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {activeStepMeta.description}
                    </p>
                  </div>
                )}

                <StepContent step={currentStep} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
