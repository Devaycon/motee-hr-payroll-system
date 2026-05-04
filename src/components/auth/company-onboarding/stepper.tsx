"use client";

import { cn } from "@/src/lib/utils";
import { Check } from "lucide-react";

interface Step {
  number: number;
  label: string;
}

interface OnboardingStepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export function OnboardingStepper({ steps, currentStep, completedSteps }: OnboardingStepperProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.number);
        const isCurrent = currentStep === step.number;
        const isUpcoming = !isCompleted && !isCurrent;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                  isCompleted && "text-white",
                  isCurrent && "text-white ring-4",
                  isUpcoming && "text-muted-foreground bg-muted border border-border"
                )}
                style={
                  isCompleted
                    ? { backgroundColor: "#1D9E75" }
                    : isCurrent
                    ? { backgroundColor: "#D85A30", boxShadow: "0 0 0 4px rgba(216,90,48,0.15)" }
                    : {}
                }
              >
                {isCompleted ? <Check size={13} strokeWidth={2.5} /> : step.number}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium whitespace-nowrap hidden sm:block",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-8 sm:w-12 mx-1 -mt-5 sm:-mt-4 transition-colors",
                  isCompleted ? "bg-green-500/40" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
