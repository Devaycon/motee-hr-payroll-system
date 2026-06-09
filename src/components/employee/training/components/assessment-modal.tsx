import { CheckCircle2, X, Award, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import type { CourseQuiz } from "@/src/lib/types/learning";
import type { MyEnrollment } from "./data";

interface AssessmentModalProps {
  open: boolean;
  enrollment: MyEnrollment | null;
  quiz: CourseQuiz | null;
  answers: Record<string, number>;
  submitted: boolean;
  score: number | null;
  passed: boolean;
  attemptsUsed: number;
  onAnswer: (questionId: string, idx: number) => void;
  onSubmit: () => void;
  onRetake: () => void;
  onViewCertificate: () => void;
  onClose: () => void;
}

export function AssessmentModal({
  open,
  enrollment,
  quiz,
  answers,
  submitted,
  score,
  passed,
  attemptsUsed,
  onAnswer,
  onSubmit,
  onRetake,
  onViewCertificate,
  onClose,
}: AssessmentModalProps) {
  const questions = quiz?.questions ?? [];
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const attemptsLeft =
    quiz?.maxAttempts != null ? Math.max(0, quiz.maxAttempts - attemptsUsed) : null;
  const canRetake = quiz?.maxAttempts == null || attemptsUsed < quiz.maxAttempts;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">End-of-Course Assessment</DialogTitle>
        </DialogHeader>

        {!quiz ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            This course has no quiz — you&apos;re all done.
          </div>
        ) : !submitted ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                {enrollment?.courseName} — pass mark {quiz.passingScore}%
              </p>
              {attemptsLeft !== null && (
                <span className="text-[11px] text-muted-foreground">
                  {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} left
                </span>
              )}
            </div>
            {questions.map((q, qi) => (
              <div key={q.id} className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {qi + 1}. {q.prompt}
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {" "}
                    ({q.points} pt{q.points === 1 ? "" : "s"})
                  </span>
                </p>
                <div className="space-y-1.5">
                  {q.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAnswer(q.id, idx)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-md border transition ${
                        answers[q.id] === idx
                          ? "border-[#4361ee] bg-[#4361ee]/10 text-[#4361ee]"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button
              className="w-full text-white bg-[#4361ee] hover:bg-[#3451d1]"
              disabled={!allAnswered}
              onClick={onSubmit}
            >
              Submit Assessment
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            {passed ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">Passed! 🎉</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your score:{" "}
                    <span className="font-semibold text-foreground">{score}%</span>
                  </p>
                </div>
                <Button
                  className="text-white bg-[#4361ee] hover:bg-[#3451d1]"
                  onClick={onViewCertificate}
                >
                  <Award className="w-4 h-4 mr-2" />
                  View Certificate
                </Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">Not Passed</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your score:{" "}
                    <span className="font-semibold text-foreground">{score}%</span>. You
                    need {quiz.passingScore}% to pass.
                  </p>
                  {!canRetake && (
                    <p className="text-xs text-rose-600 mt-2">
                      You&apos;ve used all {quiz.maxAttempts} attempts — this training is
                      marked failed.
                    </p>
                  )}
                </div>
                {canRetake ? (
                  <Button variant="outline" onClick={onRetake}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake Assessment
                    {attemptsLeft !== null ? ` (${attemptsLeft} left)` : ""}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
