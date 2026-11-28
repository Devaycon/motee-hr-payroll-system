"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import type { SurveyQuestion } from "@/src/lib/types/surveys";

const LIKERT = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

/** The choices a question offers, by its type. */
function choicesFor(q: SurveyQuestion): string[] {
  switch (q.type) {
    case "rating": {
      const min = q.scaleMin ?? 1;
      const max = q.scaleMax ?? 5;
      return Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
    }
    case "nps":
      return Array.from({ length: 11 }, (_, i) => String(i));
    case "likert":
      return q.options?.length ? q.options : LIKERT;
    case "yes_no":
      return ["Yes", "No"];
    case "multiple_choice":
      return q.options ?? [];
    default:
      return [];
  }
}

export interface TakeSurveyModalProps {
  open: boolean;
  title: string;
  description?: string;
  isAnonymous: boolean;
  questions: SurveyQuestion[] | null;
  /** Already answered: shown read-only. */
  submitted?: Record<string, string[]> | null;
  onClose: () => void;
  onSubmit: (answers: Record<string, string[]>) => Promise<boolean>;
}

/** Answer a survey, or read back the answers you gave. */
export function TakeSurveyModal({
  open,
  title,
  description,
  isAnonymous,
  questions,
  submitted,
  onClose,
  onSubmit,
}: TakeSurveyModalProps) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const readOnly = !!submitted;
  const values = submitted ?? answers;

  const set = (id: string, v: string[]) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    setMissing((prev) => prev.filter((x) => x !== id));
  };

  async function handleSubmit() {
    const gaps = (questions ?? [])
      .filter((q) => q.required && !(answers[q.id] ?? []).some((v) => v.trim()))
      .map((q) => q.id);
    if (gaps.length) {
      setMissing(gaps);
      return;
    }
    setSending(true);
    const ok = await onSubmit(answers);
    setSending(false);
    if (ok) {
      setAnswers({});
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6 pr-14">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
          {isAnonymous && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="size-3" /> Anonymous — HR sees results, not who answered.
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {!questions ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">This survey has no questions.</p>
          ) : (
            questions.map((q, i) => {
              const current = values[q.id] ?? [];
              const choices = choicesFor(q);
              return (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {i + 1}. {q.text}
                    {q.required && <span className="text-destructive"> *</span>}
                  </p>
                  {q.type === "open_text" ? (
                    <Textarea
                      value={current[0] ?? ""}
                      disabled={readOnly}
                      onChange={(e) => set(q.id, [e.target.value])}
                      placeholder="Your answer"
                      className="min-h-20 resize-none text-sm"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {choices.map((c) => {
                        const on = current.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            disabled={readOnly}
                            onClick={() => set(q.id, [c])}
                            className={cn(
                              "rounded-md border px-2.5 py-1 text-xs transition-colors",
                              on
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:bg-muted",
                              readOnly && !on && "opacity-50",
                            )}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {missing.includes(q.id) && (
                    <p className="text-xs text-destructive">This question needs an answer.</p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button disabled={!questions || sending} onClick={() => void handleSubmit()}>
              {sending ? "Submitting…" : "Submit Answers"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
