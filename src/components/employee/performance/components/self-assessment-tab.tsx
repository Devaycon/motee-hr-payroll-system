import { useState, type Dispatch, type SetStateAction } from "react";
import { CheckCircle2, BookOpen, Send, Star } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/utils";
import { RATING_LABELS, REVIEW_TYPE_LABELS } from "@/src/data/performance-demo";
import type {
  PerformanceGoal,
  PerformanceRating,
  PerformanceReview,
  SelfAssessment,
} from "@/src/lib/types/performance";
import { ProgressBar, formatDate } from "./helpers";

const SECTIONS: {
  field: keyof SelfAssessment;
  label: string;
  placeholder: string;
  hint: string;
}[] = [
  {
    field: "achievements",
    label: "Key Achievements",
    placeholder:
      "Describe your most significant accomplishments this period — projects completed, targets hit, impact delivered…",
    hint: "Focus on measurable outcomes and business impact.",
  },
  {
    field: "challenges",
    label: "Challenges & How You Overcame Them",
    placeholder: "What obstacles did you face? How did you handle them?",
    hint: "Be honest — this shows self-awareness and growth mindset.",
  },
  {
    field: "developmentAreas",
    label: "Development Areas",
    placeholder:
      "What skills or behaviours would you like to develop further in the next period?",
    hint: "Tie these to your goals or the competencies expected at your level.",
  },
  {
    field: "managerFeedback",
    label: "What Support Do You Need From Your Manager?",
    placeholder:
      "Training budget, stretch assignments, more frequent 1-1s, clearer priorities…",
    hint: "This is your opportunity to ask for what you need.",
  },
];

interface SelfAssessmentTabProps {
  review: PerformanceReview | null;
  assessment: SelfAssessment;
  setAssessment: Dispatch<SetStateAction<SelfAssessment>>;
  selfRating: PerformanceRating | null;
  setSelfRating: (r: PerformanceRating) => void;
  goals: PerformanceGoal[];
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export function SelfAssessmentTab({
  review,
  assessment,
  setAssessment,
  selfRating,
  setSelfRating,
  goals,
  onSaveDraft,
  onSubmit,
}: SelfAssessmentTabProps) {
  const [hover, setHover] = useState(0);

  if (!review) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center gap-2 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            No review is open
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            You&apos;ll be able to write your self-assessment here once HR opens
            a review for you.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (review.selfSubmittedAt) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#1D9E75]" />
          <p className="text-base font-semibold text-foreground">
            Self-Assessment Submitted
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Your self-assessment for {review.period} was submitted to{" "}
            {review.reviewer} on {formatDate(review.selfSubmittedAt)}.
            You&apos;ll be notified when the manager review is complete.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasContent = SECTIONS.some((s) => assessment[s.field].trim());
  const canSubmit = Boolean(selfRating) && assessment.achievements.trim();
  const shownRating = hover || selfRating || 0;

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#4361ee]/10 border border-[#4361ee]/30">
        <BookOpen className="w-4 h-4 text-[#4361ee] shrink-0" />
        <div>
          <p className="text-xs font-semibold text-[#4361ee]">
            {review.period} — {REVIEW_TYPE_LABELS[review.reviewType]} Review
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Reviewer: {review.reviewer} · Due {formatDate(review.dueDate)}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-foreground">
            Overall Self-Rating <span className="text-destructive">*</span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            How would you rate your performance this period?
          </p>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`${s} — ${RATING_LABELS[s]}`}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setSelfRating(s as PerformanceRating)}
                className="p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star
                  className={cn(
                    "w-6 h-6 transition-colors",
                    s <= shownRating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30",
                  )}
                />
              </button>
            ))}
            {shownRating > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                {RATING_LABELS[shownRating]}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {SECTIONS.map((section) => (
        <Card key={section.field}>
          <CardContent className="p-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-foreground">
              {section.label}
              {section.field === "achievements" && (
                <span className="text-destructive"> *</span>
              )}
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
            {goals.length === 0 && (
              <p className="text-[11px] text-muted-foreground">No goals yet.</p>
            )}
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
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={onSaveDraft}
          disabled={!hasContent && !selfRating}
        >
          Save Draft
        </Button>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 bg-[#4361ee] hover:bg-[#3451d1] text-white"
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          <Send className="w-3.5 h-3.5" /> Submit Self-Assessment
        </Button>
        {!canSubmit && (
          <p className="text-[10px] text-muted-foreground">
            Add a self-rating and your key achievements to submit.
          </p>
        )}
      </div>
    </div>
  );
}
