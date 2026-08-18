"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import type { Course } from "@/src/lib/types/learning";
import { MY_ENROLLMENTS, COURSES } from "./components/data";
import type { MyEnrollment } from "./components/data";
import {
  TrainingStatCards,
  matchesTrainingCardFilter,
  TRAINING_CARD_FILTER_LABELS,
  type TrainingCardFilter,
} from "./components/stat-cards";
import { Button } from "@/src/components/ui/button";
import { MyLearningTab } from "./components/my-learning-tab";
import { LibraryTab } from "./components/library-tab";
import { HistoryTab } from "./components/history-tab";
import { PlayerModal } from "./components/player-modal";
import { AssessmentModal } from "./components/assessment-modal";
import { CertificateModal } from "./components/certificate-modal";
import { EnrollModal } from "./components/enroll-modal";
import { CourseDetailModal } from "./components/course-detail-modal";

export function EmployeeTraining({ embedded = false }: { embedded?: boolean }) {
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>(MY_ENROLLMENTS);
  // Controlled so the KPI cards can drill into a tab, not just a filter.
  const [activeTab, setActiveTab] = useState("my-learning");
  /** Drill-down set by the KPI cards; "all" shows everything assigned. */
  const [cardFilter, setCardFilter] = useState<TrainingCardFilter>("all");
  // Captured once on mount so "overdue" stays stable across re-renders.
  const [now] = useState(() => new Date());
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState<string>("all");

  const [selectedEnrollment, setSelectedEnrollment] = useState<MyEnrollment | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [playerOpen, setPlayerOpen] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [enrollConfirmOpen, setEnrollConfirmOpen] = useState(false);
  const [courseDetailOpen, setCourseDetailOpen] = useState(false);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);
  const [assessmentPassed, setAssessmentPassed] = useState(false);
  const [enrolledCourseId, setEnrolledCourseId] = useState<string | null>(null);

  /** The My Learning rows, narrowed to whichever KPI card is selected. */
  const visibleEnrollments = enrollments.filter((e) =>
    matchesTrainingCardFilter(e, cardFilter, now),
  );

  const quizForCourse = (courseId?: string) =>
    COURSES.find((c) => c.id === courseId)?.quiz ?? null;

  function openPlayer(enrollment: MyEnrollment) {
    setSelectedEnrollment(enrollment);
    setAssessmentSubmitted(false);
    setAnswers({});
    setAssessmentScore(null);
    setPlayerOpen(true);
  }

  // Persist watched progress + resume position; bump status to in_progress.
  function handleSaveProgress(percent: number, positionSeconds: number) {
    const newProgress = Math.round(percent);
    setEnrollments((prev) =>
      prev.map((e) =>
        e.id === selectedEnrollment?.id
          ? {
              ...e,
              progress: Math.max(e.progress, newProgress),
              status: newProgress > 0 && e.status === "enrolled" ? "in_progress" : e.status,
              lastPositionSeconds: positionSeconds,
            }
          : e,
      ),
    );
    setPlayerOpen(false);
  }

  // Video finished (or marked watched). With a quiz, completion is gated on passing it;
  // without one, the training is complete.
  function handleCompleteTraining() {
    const quiz = quizForCourse(selectedEnrollment?.courseId);
    const today = new Date().toISOString().split("T")[0];
    setEnrollments((prev) =>
      prev.map((e) =>
        e.id === selectedEnrollment?.id
          ? {
              ...e,
              progress: 100,
              status: quiz
                ? e.status === "enrolled"
                  ? "in_progress"
                  : e.status
                : "completed",
              completedAt: quiz ? e.completedAt : e.completedAt ?? today,
            }
          : e,
      ),
    );
    setPlayerOpen(false);
    if (quiz && !assessmentSubmitted) setAssessmentOpen(true);
  }

  // Weighted grade vs the quiz's passing score; records the attempt and gates completion.
  function handleSubmitAssessment() {
    if (!selectedEnrollment) return;
    const quiz = quizForCourse(selectedEnrollment.courseId);
    if (!quiz) return;
    const totalPoints = quiz.questions.reduce((s, q) => s + q.points, 0) || 1;
    const earned = quiz.questions.reduce(
      (s, q) => s + (answers[q.id] === q.correctIndex ? q.points : 0),
      0,
    );
    const score = Math.round((earned / totalPoints) * 100);
    const passed = score >= quiz.passingScore;
    setAssessmentScore(score);
    setAssessmentPassed(passed);
    setAssessmentSubmitted(true);
    setEnrollments((prev) =>
      prev.map((e) => {
        if (e.id !== selectedEnrollment.id) return e;
        const attempts = [
          ...(e.quizAttempts ?? []),
          { at: new Date().toISOString().split("T")[0], score, passed },
        ];
        const outOfAttempts =
          quiz.maxAttempts != null && attempts.length >= quiz.maxAttempts;
        return {
          ...e,
          quizAttempts: attempts,
          quizPassed: passed,
          score,
          status: passed ? "completed" : outOfAttempts ? "failed" : e.status,
          completedAt: passed
            ? e.completedAt ?? new Date().toISOString().split("T")[0]
            : e.completedAt,
        };
      }),
    );
  }

  function handleConfirmEnroll() {
    if (!selectedCourse) return;
    const newEnrollment: MyEnrollment = {
      id: `me-${Date.now()}`,
      courseId: selectedCourse.id,
      courseName: selectedCourse.title,
      category: selectedCourse.category,
      status: "enrolled",
      progress: 0,
      enrolledAt: new Date().toISOString().split("T")[0],
      durationHours: selectedCourse.durationHours,
      instructor: selectedCourse.instructor,
      deliveryMode: selectedCourse.deliveryMode,
    };
    setEnrollments((prev) => [...prev, newEnrollment]);
    setEnrolledCourseId(selectedCourse.id);
    setEnrollConfirmOpen(false);
    setTimeout(() => setEnrolledCourseId(null), 3000);
  }

  const completedCourses = enrollments.filter((e) => e.status === "completed");
  const totalHoursCompleted = completedCourses.reduce((sum, e) => sum + e.durationHours, 0);
  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));

  return (
    <div className="flex flex-col gap-5 pb-10">
      {!embedded && (
        <div className="py-6 w-fit">
          <h1 className="text-4xl font-bold text-foreground">Learning & Development</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your courses, complete training, and grow your skills.
          </p>
        </div>
      )}

      <TrainingStatCards
        enrollments={enrollments}
        activeTab={activeTab}
        cardFilter={cardFilter}
        onDrillDown={(tab, filter) => {
          setActiveTab(tab);
          setCardFilter(filter);
        }}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {TRAINING_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">
              ({visibleEnrollments.length})
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← Everything assigned
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            {
              value: "my-learning",
              label: `My Learning (${visibleEnrollments.length})`,
            },
            { value: "library", label: "Course Library" },
            { value: "history", label: "Learning History" },
          ]}
        />

        <TabsContent value="my-learning" className="mt-5">
          <MyLearningTab
            enrollments={visibleEnrollments}
            onOpenPlayer={openPlayer}
          />
        </TabsContent>

        <TabsContent value="library" className="mt-5">
          <LibraryTab
            courses={COURSES}
            enrolledCourseIds={enrolledCourseIds}
            enrolledCourseId={enrolledCourseId}
            librarySearch={librarySearch}
            libraryCategoryFilter={libraryCategoryFilter}
            setLibrarySearch={setLibrarySearch}
            setLibraryCategoryFilter={setLibraryCategoryFilter}
            onDetails={(c) => {
              setSelectedCourse(c);
              setCourseDetailOpen(true);
            }}
            onEnroll={(c) => {
              setSelectedCourse(c);
              setEnrollConfirmOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-5">
          <HistoryTab
            completedCourses={completedCourses}
            totalHoursCompleted={totalHoursCompleted}
            onViewCertificate={(e) => {
              setSelectedEnrollment(e);
              setCertificateOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      <PlayerModal
        open={playerOpen}
        enrollment={selectedEnrollment}
        onSaveProgress={handleSaveProgress}
        onComplete={handleCompleteTraining}
        onClose={() => setPlayerOpen(false)}
      />

      <AssessmentModal
        open={assessmentOpen}
        enrollment={selectedEnrollment}
        quiz={quizForCourse(selectedEnrollment?.courseId)}
        answers={answers}
        submitted={assessmentSubmitted}
        score={assessmentScore}
        passed={assessmentPassed}
        attemptsUsed={
          enrollments.find((e) => e.id === selectedEnrollment?.id)?.quizAttempts?.length ?? 0
        }
        onAnswer={(qId, idx) => setAnswers((prev) => ({ ...prev, [qId]: idx }))}
        onSubmit={handleSubmitAssessment}
        onRetake={() => {
          setAnswers({});
          setAssessmentSubmitted(false);
          setAssessmentScore(null);
          setAssessmentPassed(false);
        }}
        onViewCertificate={() => {
          setAssessmentOpen(false);
          setCertificateOpen(true);
        }}
        onClose={() => setAssessmentOpen(false)}
      />

      <CertificateModal
        open={certificateOpen}
        enrollment={selectedEnrollment}
        onClose={() => setCertificateOpen(false)}
      />

      <EnrollModal
        open={enrollConfirmOpen}
        course={selectedCourse}
        onConfirm={handleConfirmEnroll}
        onClose={() => setEnrollConfirmOpen(false)}
      />

      <CourseDetailModal
        open={courseDetailOpen}
        course={selectedCourse}
        isEnrolled={selectedCourse ? enrolledCourseIds.has(selectedCourse.id) : false}
        onClose={() => setCourseDetailOpen(false)}
        onEnroll={(c) => {
          setSelectedCourse(c);
          setEnrollConfirmOpen(true);
        }}
      />
    </div>
  );
}
