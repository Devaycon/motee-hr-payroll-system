import type { Dispatch, SetStateAction } from "react";
import { CheckCircle2, BookOpen, Send } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { REVIEW_TYPE_LABELS } from "@/src/data/performance-demo";
import type { PerformanceGoal } from "@/src/lib/types/performance";
import { MY_REVIEW } from "./data";
import { ProgressBar, formatDate } from "./helpers";

type Assessment = {
  achievements: string;
  challenges: string;
  developmentAreas: string;
  managerFeedback: string;
};

interface SelfAssessmentTabProps {
  assessment: Assessment;
  setAssessment: Dispatch<SetStateAction<Assessment>>;
  goals: PerformanceGoal[];
  assessSubmitted: boolean;
  onSubmit: () => void;
}

export function SelfAssessmentTab({
  assessment,
  setAssessment,
  goals,
  assessSubmitted,
  onSubmit,
}: SelfAssessmentTabProps) {
  if (assessSubmitted) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#1D9E75]" />
          <p className="text-base font-semibold text-foreground">
            Self-Assessment Submitted
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Your self-assessment for {MY_REVIEW.period} has been submitted to{" "}
            {MY_REVIEW.reviewer}. You&apos;ll be notified when the manager
            review is complete.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#4361ee]/10 border border-[#4361ee]/30">
        <BookOpen className="w-4 h-4 text-[#4361ee] shrink-0" />
        <div>
          <p className="text-xs font-semibold text-[#4361ee]">
            {MY_REVIEW.period} — {REVIEW_TYPE_LABELS[MY_REVIEW.reviewType]}{" "}
            Review
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Reviewer: {MY_REVIEW.reviewer} · Due {formatDate(MY_REVIEW.dueDate)}
          </p>
        </div>
      </div>

      {[
        {
          field: "achievements" as keyof Assessment,
          label: "Key Achievements",
          placeholder:
            "Describe your most significant accomplishments this period — projects completed, targets hit, impact delivered…",
          hint: "Focus on measurable outcomes and business impact.",
        },
        {
          field: "challenges" as keyof Assessment,
          label: "Challenges & How You Overcame Them",
          placeholder: "What obstacles did you face? How did you handle them?",
          hint: "Be honest — this shows self-awareness and growth mindset.",
        },
        {
          field: "developmentAreas" as keyof Assessment,
          label: "Development Areas",
          placeholder:
            "What skills or behaviours would you like to develop further in the next period?",
          hint: "Tie these to your goals or the competencies expected at your level.",
        },
        {
          field: "managerFeedback" as keyof Assessment,
          label: "What Support Do You Need From Your Manager?",
          placeholder:
            "Training budget, stretch assignments, more frequent 1-1s, clearer priorities…",
          hint: "This is your opportunity to ask for what you need.",
        },
      ].map((section) => (
        <Card key={section.field}>
          <CardContent className="p-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-foreground">
              {section.label}
            </p>
            <p className="text-[10px] text-muted-foreground">{section.hint}</p>
            <Textarea
              value={assessment[section.field]}
              onChange={(e) =>
                setAssessment((prev) => ({
                  ...prev,
                  [section.field]: e.target.value,
                }))
              }
              placeholder={section.placeholder}
              className="text-xs min-h-24 resize-none mt-1"
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {assessment[section.field].length} chars
            </p>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-foreground">
            Goal Progress Reference
          </p>
          <p className="text-[11px] text-muted-foreground">
            Your manager will see these alongside your assessment.
          </p>
          <div className="flex flex-col gap-2">
            {goals.map((g) => (
              <div key={g.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">
                    {g.goalTitle}
                  </p>
                </div>
                <ProgressBar
                  value={g.progress}
                  color={
                    g.status === "completed"
                      ? "#1D9E75"
                      : g.status === "at_risk"
                        ? "#F59E0B"
                        : "#4361ee"
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="h-8 text-xs">
          Save Draft
        </Button>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 bg-[#4361ee] hover:bg-[#3451d1] text-white"
          onClick={onSubmit}
        >
          <Send className="w-3.5 h-3.5" /> Submit Self-Assessment
        </Button>
      </div>
    </div>
  );
}

