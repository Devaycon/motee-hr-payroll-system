"use client";

import { useState } from "react";
import Image from "next/image";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { setCurrentStep } from "@/src/lib/stores/onboarding-slice";
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
import { Upload, ClipboardList, ArrowRight, File } from "lucide-react";

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

  const [entryMode, setEntryMode] = useState<"manual" | "bulk" | null>(null);

  const isBulkUploadStep = currentStep === 8;
  const activeStepMeta = STEPS.find((s) => s.number === currentStep);

  const handleChooseManual = () => {
    setEntryMode("manual");
    dispatch(setCurrentStep(1));
  };

  const handleChooseBulk = () => {
    setEntryMode("bulk");
    dispatch(setCurrentStep(8));
  };

  return (
    <div
      className="relative h-screen flex items-center justify-end overflow-hidden"
      style={{
        backgroundImage: "url('/registration-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/45 dark:bg-black/60 light:bg-black/50" />

      {/* Left hero text */}
      <div className="hidden md:flex flex-1 flex-col justify-center gap-6 px-14 py-16 relative z-10">
        <div className="flex h-24 items-center px-5 shrink-0">
          <Image
            src="/employee-logo.png"
            alt="Motee HR"
            width={200}
            height={36}
            className="object-contain"
          />
        </div>

        <div className="flex flex-col gap-3 max-w-2xl">
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            {entryMode === null
              ? "Set up your organisation"
              : isBulkUploadStep
                ? "Bulk Upload"
                : (activeStepMeta?.title ?? "Organisation Setup")}
          </h1>
          <div className="w-10 h-1 rounded-full bg-white" />
          <p className="text-sm text-white leading-relaxed">
            {entryMode === null
              ? "Configure your HR platform, define your structure, and get your team up and running in minutes."
              : isBulkUploadStep
                ? "Download our template, fill it in, and upload it to auto-fill your entire setup in one go."
                : (activeStepMeta?.description ?? "")}
          </p>
        </div>

        {entryMode === null && (
          <div className="flex flex-col gap-3">
            {[
              { step: "1", label: "Set up company profile" },
              { step: "2", label: "Define roles & permissions" },
              { step: "3", label: "Configure HR modules" },
              { step: "4", label: "Review & go live" },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center  gap-3">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{
                    backgroundColor: "rgba(216,90,48,0.4)",
                    border: "1px solid rgba(216,90,48,0.6)",
                  }}
                >
                  {step}
                </div>
                <span className="text-sm text-white">{label}</span>
              </div>
            ))}
          </div>
        )}

        {entryMode !== null && !isBulkUploadStep && (
          <div className="flex flex-col gap-2">
            {STEPS.map(({ number, title }) => (
              <div key={number} className="flex items-center gap-3">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{
                    backgroundColor: completedSteps.includes(number)
                      ? "rgba(216,90,48,0.8)"
                      : number === currentStep
                        ? "rgba(216,90,48,0.4)"
                        : "rgba(255,255,255,0.15)",
                    border:
                      number === currentStep
                        ? "1px solid rgba(216,90,48,0.8)"
                        : "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {number}
                </div>
                <span
                  className="text-base"
                  style={{
                    color:
                      number === currentStep
                        ? "white"
                        : "rgba(255,255,255,0.55)",
                    fontWeight: number === currentStep ? 600 : 400,
                  }}
                >
                  {title}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-white mt-auto pt-10">
          {"\u00A9"} {new Date().getFullYear()} Motee Solutions
        </p>
      </div>

      {/* Right card */}
      <div className="relative py-5 z-10 flex flex-col w-full max-w-2xl h-[calc(100vh-4rem)] my-8 rounded-2xl md:shadow-2xl md:mr-16 bg-card border border-border overflow-hidden">
        {/* Card top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="hidden md:block" />
          <div className="flex justify-between w-full items-center gap-2">
            {entryMode !== null && (
              <button
                type="button"
                onClick={() => setEntryMode(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md border border-border hover:border-foreground/30 cursor-pointer"
              >
                &larr; Back
              </button>
            )}
            {entryMode === null && <div />}
            <ThemeToggle />
          </div>
        </div>

        {/* Entry mode selection */}
        {entryMode === null && (
          <div className="flex flex-col items-center gap-6 px-8 pt-2 pb-8 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                How would you like to set up?
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                Fill in your details step by step, or upload a bulk template to
                auto-populate everything at once.
              </p>
            </div>

            <div className="w-full grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleChooseManual}
                className="group flex items-center gap-4 rounded-xl border border-border bg-background px-5 py-4 text-left transition-all duration-200 hover:border-[#D85A30]/60 hover:shadow-md cursor-pointer"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "rgba(216,90,48,0.12)" }}
                >
                  <ClipboardList size={20} style={{ color: "#D85A30" }} />
                </div>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-sm font-semibold text-foreground">
                    Manual Entry
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Step-by-step guided setup, one screen at a time.
                  </span>
                </div>
                <ArrowRight
                  size={14}
                  className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                />
              </button>

              <button
                type="button"
                onClick={handleChooseBulk}
                className="group flex items-center gap-4 rounded-xl border border-border bg-background px-5 py-4 text-left transition-all duration-200 hover:border-[#7F77DD]/60 hover:shadow-md cursor-pointer"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "rgba(127,119,221,0.12)" }}
                >
                  <Upload size={20} style={{ color: "#7F77DD" }} />
                </div>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-sm font-semibold text-foreground">
                    Bulk Upload
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Upload a template to auto-fill your entire setup.
                  </span>
                </div>
                <ArrowRight
                  size={14}
                  className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                />
              </button>
              <button
                disabled
                type="button"
                className="group cursor-not-allowed opacity-70 flex items-center gap-4 rounded-xl border border-border bg-background px-5 py-4 text-left transition-all duration-200"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "rgba(127,119,221,0.2)" }}
                >
                  <File size={20} style={{ color: "green" }} />
                </div>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-sm font-semibold text-foreground">
                    Test With Demo Data
                  </span>
                  <span className="text-xs text-muted-foreground">
                     Auto-fill your entire system with fake data.
                  </span>
                </div>
                <ArrowRight
                  size={14}
                  className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                />
              </button>
            </div>

            <p className="text-[11px] self text-muted-foreground/50">
              {"\u00A9"} {new Date().getFullYear()} Motee Solutions
            </p>
          </div>
        )}

        {/* Step flow */}
        {entryMode !== null && (
          <div className="flex flex-col flex-1 min-h-0">
            {!isBulkUploadStep && (
              <div className="px-6 pt-1 pb-3 shrink-0">
                <OnboardingStepper
                  steps={STEPS}
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                />
              </div>
            )}

            {!isBulkUploadStep && activeStepMeta && (
              <div className="px-6 pb-4 border-b border-border shrink-0">
                <h2 className="text-base font-semibold text-foreground">
                  {activeStepMeta.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {activeStepMeta.description}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
              <StepContent step={currentStep} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
