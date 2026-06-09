"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { QuizEditor, cleanQuiz } from "./quiz-editor";
import type { Course, CourseQuiz, CourseQuizQuestion } from "@/src/lib/types/learning";

interface Props {
  open: boolean;
  course: Course | null;
  onClose: () => void;
  onSave: (courseId: string, quiz: CourseQuiz) => void;
}

export function QuizBuilderModal({ open, course, onClose, onSave }: Props) {
  const [prevKey, setPrevKey] = useState<string | null>(null);
  const [questions, setQuestions] = useState<CourseQuizQuestion[]>([]);
  const [passingScore, setPassingScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState<string>("");

  // Seed from the course's existing quiz whenever the modal opens for a course.
  const key = open && course ? course.id : null;
  if (key !== prevKey) {
    setPrevKey(key);
    if (key && course) {
      const q = course.quiz;
      setQuestions(q?.questions.map((x) => ({ ...x })) ?? []);
      setPassingScore(q?.passingScore ?? 70);
      setMaxAttempts(q?.maxAttempts != null ? String(q.maxAttempts) : "");
    }
  }

  function handleSave() {
    if (!course) return;
    const quiz = cleanQuiz(questions, passingScore, maxAttempts);
    if (!quiz) {
      toast.error("Add at least one question with a prompt and two options.");
      return;
    }
    onSave(course.id, quiz);
    toast.success("Quiz saved");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            Quiz — {course?.title ?? ""}
          </DialogTitle>
        </DialogHeader>

        <QuizEditor
          questions={questions}
          setQuestions={setQuestions}
          passingScore={passingScore}
          setPassingScore={setPassingScore}
          maxAttempts={maxAttempts}
          setMaxAttempts={setMaxAttempts}
        />

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className="text-xs" onClick={handleSave}>
            Save quiz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
