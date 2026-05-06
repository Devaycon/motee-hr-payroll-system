import { CheckCircle2, X, Award, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import type { MyEnrollment, AssessmentQuestion } from "./data";

interface AssessmentModalProps {
  open: boolean;
  enrollment: MyEnrollment | null;
  questions: AssessmentQuestion[];
  answers: Record<number, number>;
  submitted: boolean;
  score: number | null;
  onAnswer: (questionId: number, idx: number) => void;
  onSubmit: () => void;
  onRetake: () => void;
  onViewCertificate: () => void;
  onClose: () => void;
}

export function AssessmentModal({
  open,
  enrollment,
  questions,
  answers,
  submitted,
  score,
  onAnswer,
  onSubmit,
  onRetake,
  onViewCertificate,
  onClose,
}: AssessmentModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            End-of-Course Assessment
          </DialogTitle>
        </DialogHeader>
        {!submitted ? (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              {enrollment?.courseName} — Answer all questions to complete.
            </p>
            {questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {q.id}. {q.question}
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
              disabled={Object.keys(answers).length < questions.length}
              onClick={onSubmit}
            >
              Submit Assessment
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            {score !== null && score >= 70 ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">
                    Passed! 🎉
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your score:{" "}
                    <span className="font-semibold text-foreground">
                      {score}%
                    </span>
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
                  <p className="font-bold text-foreground text-lg">
                    Not Passed
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your score:{" "}
                    <span className="font-semibold text-foreground">
                      {score}%
                    </span>
                    . You need 70% to pass.
                  </p>
                </div>
                <Button variant="outline" onClick={onRetake}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake Assessment
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
