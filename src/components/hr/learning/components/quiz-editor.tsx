"use client";

import type { Dispatch, SetStateAction } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import type {
  CourseQuiz,
  CourseQuizQuestion,
  QuizQuestionType,
} from "@/src/lib/types/learning";

function qid(): string {
  return `q-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** Create a blank question of the given type. */
export function newQuestion(type: QuizQuestionType): CourseQuizQuestion {
  return type === "true_false"
    ? { id: qid(), type, prompt: "", options: ["True", "False"], correctIndex: 0, points: 1 }
    : { id: qid(), type, prompt: "", options: ["", "", "", ""], correctIndex: 0, points: 1 };
}

/**
 * Trim and validate a draft quiz. Returns a CourseQuiz when at least one
 * question has a prompt and two options, otherwise null.
 */
export function cleanQuiz(
  questions: CourseQuizQuestion[],
  passingScore: number,
  maxAttempts: string,
): CourseQuiz | null {
  const cleaned = questions
    .map((q) => ({
      ...q,
      prompt: q.prompt.trim(),
      options: q.options.map((o) => o.trim()),
    }))
    .filter((q) => q.prompt && q.options.filter(Boolean).length >= 2);
  if (cleaned.length === 0) return null;
  const max =
    maxAttempts.trim() === "" ? undefined : Math.max(1, Number(maxAttempts) || 1);
  return {
    passingScore: Math.min(100, Math.max(0, passingScore)),
    maxAttempts: max,
    questions: cleaned,
  };
}

interface QuizEditorProps {
  questions: CourseQuizQuestion[];
  setQuestions: Dispatch<SetStateAction<CourseQuizQuestion[]>>;
  passingScore: number;
  setPassingScore: (n: number) => void;
  maxAttempts: string;
  setMaxAttempts: (s: string) => void;
}

/** Controlled editor for an end-of-course quiz (questions, scoring, attempts). */
export function QuizEditor({
  questions,
  setQuestions,
  passingScore,
  setPassingScore,
  maxAttempts,
  setMaxAttempts,
}: QuizEditorProps) {
  function patch(id: string, p: Partial<CourseQuizQuestion>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...p } : q)));
  }
  function setType(id: string, type: QuizQuestionType) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        if (type === "true_false") {
          return { ...q, type, options: ["True", "False"], correctIndex: 0 };
        }
        const options = q.options.length >= 2 ? q.options : ["", "", "", ""];
        return { ...q, type, options };
      }),
    );
  }
  function setOption(id: string, idx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, options: q.options.map((o, i) => (i === idx ? value : o)) }
          : q,
      ),
    );
  }

  return (
    <div className="space-y-4 py-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Passing score (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(Number(e.target.value) || 0)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Max attempts (blank = unlimited)</Label>
          <Input
            type="number"
            min={1}
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(e.target.value)}
            placeholder="Unlimited"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, qi) => (
          <div key={q.id} className="rounded-lg border border-border/60 p-3 space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="text-xs font-semibold text-muted-foreground mt-2">
                {qi + 1}.
              </span>
              <Input
                value={q.prompt}
                onChange={(e) => patch(q.id, { prompt: e.target.value })}
                placeholder="Question prompt"
                className="h-8 text-xs flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive shrink-0"
                onClick={() => setQuestions((p) => p.filter((x) => x.id !== q.id))}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-2 pl-5">
              <Select value={q.type} onValueChange={(v) => setType(q.id, v as QuizQuestionType)}>
                <SelectTrigger className="h-7 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq" className="text-xs">Multiple choice</SelectItem>
                  <SelectItem value="true_false" className="text-xs">True / False</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] text-muted-foreground">Points</Label>
                <Input
                  type="number"
                  min={1}
                  value={q.points}
                  onChange={(e) => patch(q.id, { points: Math.max(1, Number(e.target.value) || 1) })}
                  className="h-7 w-16 text-xs"
                />
              </div>
              {q.type === "mcq" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-[11px] ml-auto"
                  onClick={() => patch(q.id, { options: [...q.options, ""] })}
                >
                  <Plus className="w-3 h-3" /> Option
                </Button>
              )}
            </div>

            <div className="space-y-1.5 pl-5">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Mark correct"
                    onClick={() => patch(q.id, { correctIndex: oi })}
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      q.correctIndex === oi
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-border text-transparent",
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <Input
                    value={opt}
                    onChange={(e) => setOption(q.id, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    disabled={q.type === "true_false"}
                    className="h-7 text-xs"
                  />
                  {q.type === "mcq" && q.options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground shrink-0"
                      onClick={() =>
                        patch(q.id, {
                          options: q.options.filter((_, i) => i !== oi),
                          correctIndex:
                            q.correctIndex >= oi && q.correctIndex > 0
                              ? q.correctIndex - 1
                              : q.correctIndex,
                        })
                      }
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No questions yet. Add one below.
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setQuestions((p) => [...p, newQuestion("mcq")])}
          >
            <Plus className="w-3.5 h-3.5" /> Add MCQ
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setQuestions((p) => [...p, newQuestion("true_false")])}
          >
            <Plus className="w-3.5 h-3.5" /> Add True/False
          </Button>
        </div>
      </div>
    </div>
  );
}
