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
    <div className="flex w-full items-start">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.number);
        const isCurrent = currentStep === step.number;
        const isUpcoming = !isCompleted && !isCurrent;

        return (
          <div key={step.number} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all",
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
                {isCompleted ? <Check size={16} strokeWidth={2.5} /> : step.number}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap hidden sm:block",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              // Sits on the circles' centre line (circle is h-10).
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 mt-4.75 rounded-full transition-colors",
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
