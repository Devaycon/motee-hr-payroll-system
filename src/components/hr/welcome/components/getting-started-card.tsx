"use client";

import Link from "next/link";
import { Rocket, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { SETUP_STEPS } from "@/src/data/welcome-demo";

interface GettingStartedCardProps {
  completedSteps: number;
  setupPercent: number;
  nextStep: { label: string; done: boolean; link: string } | undefined;
}

export function GettingStartedCard({
  completedSteps,
  setupPercent,
  nextStep,
}: GettingStartedCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <Rocket className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Getting Started
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {completedSteps} of {SETUP_STEPS.length} steps done
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 shrink-0"
        >
          <Link href="/admin/settings">
            Continue <ChevronRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-muted-foreground">
              Setup progress
            </span>
            <span className="text-xs font-semibold text-foreground">
              {setupPercent}%
            </span>
          </div>
          <Progress value={setupPercent} className="h-2" />
        </div>
        <div className="flex flex-col gap-2.5">
          {SETUP_STEPS.map((step) => (
            <Link
              key={step.label}
              href={step.link}
              className="flex items-center gap-2 group"
            >
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 text-[#4ED251] shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span
                className={`text-xs flex-1 group-hover:underline ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}
              >
                {step.label}
              </span>
              {!step.done && (
                <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          ))}
        </div>
        {nextStep && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            Next:{" "}
            <span className="font-medium text-foreground">
              {nextStep.label}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
